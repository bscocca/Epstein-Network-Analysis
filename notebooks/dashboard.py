import pandas as pd
from pyvis.network import Network
import os

# 1. Caricamento dati
df_nodes = pd.read_csv('data/nodes_base_metrics.csv')
df_edges = pd.read_csv('data/edges_sentiment.csv')

# 2. Design dell'interfaccia (Look Professionale Dark)
net = Network(
    height="100vh", 
    width="100%", 
    bgcolor="#111111", # Sfondo nero profondo
    font_color="#eeeeee", 
    select_menu=True
)

# 3. FILTRAGGIO ELITE (La chiave per la professionalità)
# Mostriamo solo i 60 attori più centrali per evitare il caos
top_nodes = df_nodes.nlargest(60, 'Betweenness_Centrality')
top_names = top_nodes['Node'].tolist()

# Filtriamo gli archi: solo quelli tra i top 60 e con peso > 1
f_edges = df_edges[
    (df_edges['source'].isin(top_names)) & 
    (df_edges['target'].isin(top_names)) &
    (df_edges['weight'] > 1)
]

# 4. Aggiunta Nodi con Design Custom
for _, row in top_nodes.iterrows():
    # Dimensione basata sulla centralità
    size = (row['Betweenness_Centrality'] * 1500) + 15
    net.add_node(
        row['Node'], 
        label=row['Node'], 
        size=size, 
        color="#00d4ff", # Ciano tecnologico
        borderWidth=2,
        font={'size': 18, 'face': 'Arial', 'color': 'white'}
    )

# 5. Aggiunta Archi (Sentiment-Driven)
for _, row in f_edges.iterrows():
    # Rosso per sentiment negativo, Verde per positivo, Bianco opaco per neutro
    edge_color = "rgba(255, 77, 77, 0.6)" if row['avg_sentiment'] < -0.1 else \
                 "rgba(0, 255, 127, 0.6)" if row['avg_sentiment'] > 0.1 else \
                 "rgba(200, 200, 200, 0.2)"
    
    net.add_edge(
        row['source'], 
        row['target'], 
        value=row['weight'], 
        color=edge_color,
        smooth={'type': 'curvedCW', 'roundness': 0.2} # Archi curvi eleganti
    )

# 6. FISICA AVANZATA (Stile D3.js professionale)
net.set_options("""
var options = {
  "nodes": {
    "shadow": {"enabled": true, "color": "rgba(0,212,255,0.2)"}
  },
  "physics": {
    "forceAtlas2Based": {
      "gravitationalConstant": -150,
      "centralGravity": 0.005,
      "springLength": 200,
      "springConstant": 0.05,
      "avoidOverlap": 1
    },
    "solver": "forceAtlas2Based",
    "stabilization": { "iterations": 200 }
  },
  "interaction": {
    "hover": true,
    "tooltipDelay": 100
  }
}
""")

# 7. Generazione
net.save_graph("intelligence_map.html")