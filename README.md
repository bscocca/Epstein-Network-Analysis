# Forensic Network Analysis: The Epstein Corpus

**Course:** Web and Data Science — Prof. Pierri  
**Author:** Bernadette Scocca, Mario Zoccola
**Year:** 2025–2026

---

## Overview

This project applies computational social science methods to a corpus of 25,232 documents related to the Jeffrey Epstein case — including emails, flight logs, legal filings, and personal correspondence — to map power dynamics, identify structural brokers, and track how relational networks evolve across time and institutional context.

The central contribution is a **dynamic knowledge graph** built from 107,030 RDF triples extracted by an AI pipeline, semantically labeled via Zero-Shot NLP classification, and analyzed through network science methods (centrality, community detection, temporal analysis).

---

## Research Questions

### RQ1 — Context Drift
*How does the nature of interactions (Logistical, Social, Legal) evolve over time, in correspondence with key judicial events in the Epstein case?*

**Finding:** The network undergoes a dramatic semantic shift in response to judicial shocks. Legal interactions peak at 94.1% of all edges during the 2005–2008 investigation period, collapsing to 35.8% post-plea deal (2009–2018) as Social interactions become dominant (50.8%). This confirms the hypothesis that relational networks "legify" in response to institutional pressure, then normalize once legal threat subsides.

### RQ2 — The Brokers
*What is the structural role of 'Unknown' entities in connecting separate clusters?*

**Finding:** Unknown/anonymized entities represent 7.5% of network nodes but control 15.0% of total betweenness centrality — exactly double what a uniform distribution would predict (concentration ratio: 2.00x). Their mean betweenness is 2.18x higher than named entities. This is consistent with Burt's (2004) structural holes theory: anonymous actors occupy privileged intermediation positions between otherwise disconnected network clusters.

### RQ3 — Contextual Influence
*How does the influence hierarchy (centrality) shift when filtering the network by domain?*

**Finding:** Centrality is not domain-invariant. Virginia Roberts Giuffre ranks #4 in the Legal subgraph but #158 in the Social subgraph — appearing almost exclusively in judicial proceedings. Conversely, Ehud Barak ranks #4 in Social but #440 in Legal, reflecting a personal/political rather than judicial relationship with Epstein. The FBI ranks #6 in Legal and #609 in Social. These cross-domain rank shifts reveal functionally specialized actors whose influence is context-dependent.

---

## Methodological Pipeline

```
SQLite DB (107,030 triples)
        │
        ▼
┌─────────────────────────────────┐
│  Notebook 01 — EDA              │
│  • Missing data audit           │
│  • Entity resolution            │
│  • Unknown entity census        │
│  • Temporal coverage analysis   │
└──────────────┬──────────────────┘
               │  edges_base.csv
               ▼
┌─────────────────────────────────┐
│  Notebook 02 — NLP              │
│  • Zero-Shot Classification     │
│    (BART-large-mnli)            │
│  • 3 labels: Legal/Social/      │
│    Logistical                   │
│  • Confidence threshold: 0.70   │
│  • Human-in-the-loop validation │
└──────────────┬──────────────────┘
               │  edges_classified.csv
               ▼
┌─────────────────────────────────┐
│  Notebook 03 — Network Analysis │
│  • Entity pruning               │
│  • DiGraph construction         │
│  • 4 centrality metrics         │
│  • Louvain community detection  │
│  • RQ1: temporal analysis       │
│  • RQ2: broker analysis         │
│  • RQ3: rank shift matrix       │
└──────────────┬──────────────────┘
               │  web_graph_data.json
               ▼
┌─────────────────────────────────┐
│  React Dashboard                │
│  • 3D force graph (WebGL)       │
│  • Domain filter (RQ1/RQ3)      │
│  • Unknown toggle (RQ2)         │
│  • Node inspector               │
│  • Search                       │
└─────────────────────────────────┘
```

---

## Key Methodological Choices

### Why Zero-Shot NLP instead of Sentiment Analysis?
The corpus is dominated by procedural and logistical text (emails, flight logs, legal filings). Sentiment analysis on this type of content produces an artificial inflation of the "Neutral" class, yielding uninformative results. Zero-Shot classification with BART-large-mnli assigns semantically meaningful labels without requiring a labeled training set, exploiting the model's pre-trained NLI (Natural Language Inference) capabilities.

### Why three labels (Legal / Social / Logistical)?
The three labels were chosen for parsimony and direct alignment with the Research Questions. They correspond to three distinct relational modes present in the corpus: institutional/judicial interactions (Legal), personal/political interactions (Social), and movement/coordination interactions (Logistical). The choice is acknowledged to be a simplification: the Legal/Social boundary is permeable in mixed communications, and Logistical aggregates heterogeneous phenomena (transport, property management, payments).

### Why confidence threshold 0.70?
Human-in-the-loop validation on a stratified sample of 15 triples per class revealed systematic errors below confidence 0.65, including a book about family travel classified as Logistical and a geopolitical briefing classified as Social. The threshold was raised to 0.70 after verifying that payment→Unknown triples (a forensically critical category) were already 94.2% correctly classified as Legal at that threshold, making rule-based overrides unnecessary.

### Why Betweenness Centrality for broker analysis?
Betweenness centrality measures the proportion of shortest paths between all pairs of nodes that pass through a given node. A node with high betweenness is a structural broker: information or influence must pass through it to flow between otherwise disconnected parts of the network. This is the direct operationalization of Burt's (2004) structural holes theory, which posits that actors bridging disconnected clusters hold disproportionate informational and strategic advantage.

### Why approximate Betweenness (k=500)?
Exact betweenness centrality is O(n·m) — on a graph with 33,000+ nodes, computation would require several hours on consumer hardware. Brandes (2001) introduced a sampling-based approximation that estimates betweenness by computing shortest paths from a random sample of k source nodes. With k=500 (approximately 1.5% of nodes), the approximation is statistically reliable for identifying top-ranked brokers, which is the only analytically relevant use case here.

### Why Louvain for community detection?
Louvain modularity optimization is the standard algorithm for large-scale community detection in weighted graphs. It maximizes the modularity Q, which measures the density of edges within communities relative to a random baseline. It was chosen over alternatives (Girvan-Newman, label propagation) for its scalability and interpretability. A resolution parameter of 1.5 was used to obtain macro-communities of analytically meaningful size.

---

## Dataset

The source database (`document_analysis.db`) was produced by the [Epstein Doc Explorer](https://github.com/maxandrews/Epstein-doc-explorer) project, which applied an AI pipeline to publicly available Epstein-related documents to extract structured RDF triples and document metadata.

| Metric | Value |
|--------|-------|
| Documents | 25,232 |
| RDF triples (raw) | 107,030 |
| AI analysis success rate | 83.8% |
| Triples after NLP filtering (≥0.70 confidence) | 66,467 |
| Unique entities in graph | 33,402 |
| Entities in exported graph (top by PageRank) | 1,201 |
| Edges in exported graph | 3,278 |

---

## Project Structure

```
Epstein-Network-Analysis/
│
├── data/
│   ├── document_analysis.db          # Source SQLite database
│   ├── edges_base.csv                # Extracted triples (NB01 output)
│   ├── edges_classified.csv          # NLP-labeled triples (NB02 output)
│   ├── centrality_full.csv           # All centrality metrics (NB03 output)
│   ├── rq1_temporal_distribution.csv # RQ1 data
│   ├── rq3_rank_shift.csv            # RQ3 data
│   └── web_graph_data.json           # Dashboard input (NB03 output)
│
├── notebooks/
│   ├── 01_EDA.ipynb                  # Exploratory Data Analysis (14 cells)
│   ├── 02_semantic_classification.ipynb  # Zero-Shot NLP (4 cells)
│   └── 03_network_analysis.ipynb     # Network Analysis (18+ cells)
│
├── epstein-network-ui/               # React dashboard
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── ControlPanel.jsx
│   │   │   ├── NetworkGraph.jsx      # 3D force graph (WebGL)
│   │   │   └── NodeInspector.jsx
│   │   └── hooks/
│   │       └── useGraphData.js
│   └── public/
│       └── web_graph_data.json
│
└── README.md
```

---

## Running the Dashboard

### Requirements
- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
cd epstein-network-ui
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Dashboard Features

| Feature | Description |
|---------|-------------|
| **Domain Filter** | Show only Legal / Social / Logistical edges (RQ1, RQ3) |
| **Unknown Toggle** | Show/hide anonymized broker entities (RQ2) |
| **Color by Community** | Color nodes by Louvain cluster |
| **Color by Domain** | Color nodes by dominant semantic domain |
| **Node Inspector** | Click any node: PageRank, Betweenness, Eigenvector, edge breakdown |
| **Search** | Find any entity by name, fly camera to node |
| **Fit view** | Reset camera to show full graph |

### Navigation
- **Scroll** → Zoom
- **Left drag** → Rotate
- **Right drag** → Pan
- **Click node** → Inspect + highlight neighbours
- **Click again** → Deselect

---

## Running the Notebooks

### Requirements

```bash
pip install pandas networkx python-louvain matplotlib seaborn scipy transformers torch
```

### Execution Order

```bash
jupyter notebook notebooks/01_EDA.ipynb         # ~5 min
jupyter notebook notebooks/02_semantic_classification.ipynb  # ~7 hours (BART inference)
jupyter notebook notebooks/03_network_analysis.ipynb         # ~20 min
```

> Notebook 02 requires significant compute time due to BART-large-mnli inference on 107k sequences. On Apple Silicon (M2), MPS acceleration reduces this to approximately 4 hours. A checkpoint system saves progress every 5,000 rows.