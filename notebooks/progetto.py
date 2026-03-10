import sqlite3
import pandas as pd
import networkx as nx
import community as community_louvain
from transformers import pipeline
import warnings

# Disabilita warning non critici di HuggingFace per un output pulito
warnings.filterwarnings('ignore')

# CONFIGURAZIONE BASATA SUL REPOSITORY GITHUB
DB_PATH = 'document_analysis.db'  # Nome di default nel repository maxandrews
MODEL_NAME = "./bert-base-multilingual-uncased-sentiment"

def analyze_schema(conn):
    """Analizza lo schema del DB per trovare le tabelle e colonne corrette."""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    
    # AGGIUNTO 'rdf_triples' CHE È IL NOME REALE NEL REPO
    rel_table = 'rdf_triples' if 'rdf_triples' in tables else \
                'relationships' if 'relationships' in tables else \
                'triples' if 'triples' in tables else None
                
    if not rel_table:
        print(f"Tabelle trovate nel DB: {tables}") # Stampa d'aiuto per il debug
        raise ValueError("Tabella relazioni non trovata. Verifica che il DB sia popolato.")

    cursor.execute(f"PRAGMA table_info({rel_table})")
    cols = [col[1] for col in cursor.fetchall()]
    
    # Identifica dinamicamente le colonne per testo e date (cerca 'action', 'context', ecc.)
    text_col = next((c for c in cols if c in ['action', 'relationship', 'context', 'snippet', 'description']), None)
    date_col = next((c for c in cols if 'date' in c.lower() or 'time' in c.lower() or 'year' in c.lower()), None)
    
    return rel_table, text_col, date_col, cols

def setup_database():
    """Aggiunge le colonne per i risultati AI e Community se non esistono."""
    conn = sqlite3.connect(DB_PATH)
    rel_table, _, _, cols = analyze_schema(conn)
    cursor = conn.cursor()
    
    if 'sentiment' not in cols:
        cursor.execute(f"ALTER TABLE {rel_table} ADD COLUMN sentiment TEXT")
        cursor.execute(f"ALTER TABLE {rel_table} ADD COLUMN sentiment_score REAL")
    
    # Creiamo una tabella dedicata per salvare le community (se non esiste)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entity_communities (
            entity_name TEXT PRIMARY KEY,
            community_id INTEGER
        )
    """)
    conn.commit()
    conn.close()

# --- FASE 1: SENTIMENT ANALYSIS ---
# --- FASE 1: SENTIMENT ANALYSIS ---
def run_sentiment_analysis():
    print("FASE 1: Avvio Sentiment Analysis con BERT...")
    conn = sqlite3.connect(DB_PATH)
    rel_table, text_col, _, cols = analyze_schema(conn)
    
    if not text_col:
        print("ATTENZIONE: Colonna testuale per le relazioni non trovata.")
        return

    # Capiamo se la tabella usa 'id' come chiave, altrimenti ripieghiamo su 'rowid'
    id_col = 'id' if 'id' in cols else 'rowid'

    # Usiamo un alias 'record_id' così Pandas non si confonde
    query = f"SELECT {id_col} AS record_id, {text_col} FROM {rel_table} WHERE {text_col} IS NOT NULL"
    df_rel = pd.read_sql_query(query, conn)
    
    sentiment_analyzer = pipeline("sentiment-analysis", model=MODEL_NAME)
    results = []
    
    print(f"Analisi di {len(df_rel)} relazioni trovate...")
    for _, row in df_rel.iterrows():
        text = str(row[text_col])[:512]
        if not text.strip(): continue
        
        prediction = sentiment_analyzer(text)[0]
        score = int(prediction['label'].split()[0])
        sentiment_cat = "Negative" if score <= 2 else "Neutral" if score == 3 else "Positive"
        
        results.append((sentiment_cat, prediction['score'], row['record_id']))
    
    cursor = conn.cursor()
    # Aggiorniamo usando la colonna ID corretta
    cursor.executemany(f"UPDATE {rel_table} SET sentiment = ?, sentiment_score = ? WHERE {id_col} = ?", results)
    conn.commit()
    conn.close()
    print("FASE 1 Completata.")

# --- FASE 2: COMMUNITY DETECTION ---
def run_community_detection():
    print("\nFASE 2: Avvio Community Detection (Louvain)...")
    conn = sqlite3.connect(DB_PATH)
    rel_table, _, _, cols = analyze_schema(conn)
    
    # Il repo usa le colonne 'actor' e 'target' per definire le entità
    if 'actor' not in cols or 'target' not in cols:
        print("Errore: Colonne 'actor' e 'target' non trovate nel database.")
        return

    df_edges = pd.read_sql_query(f"SELECT actor, target FROM {rel_table} WHERE actor IS NOT NULL AND target IS NOT NULL", conn)
    
    # Costruzione grafo NetworkX
    G = nx.from_pandas_edgelist(df_edges, 'actor', 'target')
    
    # Rilevamento delle comunità
    partition = community_louvain.best_partition(G)
    
    # Salvataggio nel DB
    partition_data = [(entity, comm_id) for entity, comm_id in partition.items()]
    cursor = conn.cursor()
    cursor.executemany("INSERT OR REPLACE INTO entity_communities (entity_name, community_id) VALUES (?, ?)", partition_data)
    
    conn.commit()
    conn.close()
    print(f"FASE 2 Completata: Trovate {len(set(partition.values()))} comunità uniche nel network.")

# --- FASE 3: TEMPORAL ANALYSIS ---
def run_temporal_analysis():
    print("\nFASE 3: Estrazione Temporal Analysis...")
    conn = sqlite3.connect(DB_PATH)
    rel_table, _, date_col, cols = analyze_schema(conn)
    
    if not date_col:
        print("ATTENZIONE: Colonna data non trovata direttamente in relazioni. Tentativo di join con tabella documenti...")
        # Fallback: Se la data è nei documenti, proviamo un JOIN (dipende dalle chiavi del DB)
        try:
            query = f"""
            SELECT strftime('%Y', d.date) as year, COUNT(r.rowid) as rel_count, r.sentiment
            FROM {rel_table} r
            JOIN documents d ON r.document_id = d.id
            WHERE d.date IS NOT NULL AND r.sentiment IS NOT NULL
            GROUP BY year, r.sentiment
            ORDER BY year ASC
            """
            df_temp = pd.read_sql_query(query, conn)
        except sqlite3.OperationalError:
            print("Join fallito o struttura date mancante. Estrazione dati temporali saltata.")
            df_temp = pd.DataFrame()
    else:
        # Se la data è già nella tabella relazioni
        query = f"""
        SELECT strftime('%Y', {date_col}) as year, COUNT(*) as rel_count, sentiment
        FROM {rel_table}
        WHERE {date_col} IS NOT NULL AND sentiment IS NOT NULL
        GROUP BY year, sentiment
        ORDER BY year ASC
        """
        df_temp = pd.read_sql_query(query, conn)
    
    conn.close()
    
    if not df_temp.empty:
        print("Dati temporali aggregati estratti con successo (primi 5 risultati):")
        print(df_temp.head())
    print("FASE 3 Completata.")
    return df_temp

if __name__ == "__main__":
    try:
        setup_database()
        run_sentiment_analysis()
        run_community_detection()
        run_temporal_analysis()
        print("\nProcesso di arricchimento completato. Il database SQLite è pronto per Streamlit!")
    except Exception as e:
        print(f"\nSi è verificato un errore critico: {e}")