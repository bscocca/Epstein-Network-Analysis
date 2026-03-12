import streamlit as st
import pandas as pd
import os

# 1. Setup Stile "Intelligence Report"
st.set_page_config(page_title="Network Intelligence Explorer", layout="wide")
st.markdown("""
    <style>
    .main { background-color: #f8f9fa; }
    .stMetric { border-left: 5px solid #ff4b4b; background-color: white; padding: 10px; }
    </style>
    """, unsafe_allow_html=True)

# 2. Caricamento Dati Semplificato
@st.cache_data
def load_data():
    nodes = pd.read_csv('data/nodes_base_metrics.csv')
    edges = pd.read_csv('data/edges_sentiment.csv')
    # Pulizia nomi
    nodes['Node'] = nodes['Node'].str.strip()
    return nodes, edges

df_nodes, df_edges = load_data()

# 3. Sidebar per Filtri Globali
st.sidebar.title("🔍 Filtri Globali")
min_weight = st.sidebar.slider("Peso minimo relazione", 1, 20, 3)

# 4. Ricerca Entità (Come il sito originale)
st.title("🛡️ Epstein Network Relationship Explorer")
search_query = st.selectbox("Seleziona una persona o organizzazione per vedere i suoi legami:", 
                            options=[""] + sorted(df_nodes['Node'].unique().tolist()))

if search_query:
    # Filtriamo i dati per l'entità scelta
    relazioni = df_edges[
        ((df_edges['source'] == search_query) | (df_edges['target'] == search_query)) & 
        (df_edges['weight'] >= min_weight)
    ].sort_values(by='weight', ascending=False)

    col1, col2 = st.columns([1, 2])

    with col1:
        st.subheader(f"Profilo: {search_query}")
        metrics = df_nodes[df_nodes['Node'] == search_query].iloc[0]
        st.metric("Importanza nella Rete (Betweenness)", f"{metrics['Betweenness_Centrality']:.4f}")
        st.write(f"Questa entità ha **{len(relazioni)}** connessioni rilevanti nel dataset.")

    with col2:
        st.subheader("Relazioni Dirette e Sentiment")
        # Visualizzazione Tabella Professionale
        def color_sentiment(val):
            color = 'red' if val < -0.1 else 'green' if val > 0.1 else 'black'
            return f'color: {color}'
        
        st.dataframe(relazioni.style.applymap(color_sentiment, subset=['avg_sentiment']), 
                     use_container_width=True, hide_index=True)

else:
    # Vista Generale se non c'è ricerca
    st.info("Seleziona un nome dal menu a sinistra per iniziare l'esplorazione.")
    
    st.subheader("Top 10 Broker della Rete (Chi controlla i flussi)")
    st.table(df_nodes.sort_values('Betweenness_Centrality', ascending=False).head(10))

# 5. Footer Scientifico
st.markdown("---")
st.caption("Analisi basata su 64,954 relazioni estratte tramite LLM e classificate con RoBERTa Sentiment Analysis.")