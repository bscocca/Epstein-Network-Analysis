# Forensic Network Analysis: The Epstein Corpus

A university research project applying computational social science methods 
to a corpus of legal, logistical, and personal documents related to the 
Jeffrey Epstein case.

## Overview

This project constructs and analyzes a **dynamic knowledge graph** from a 
structured database of ~25k documents (emails, flight logs, legal filings) 
to map power dynamics, identify structural brokers, and track how 
relationship networks evolve across time and institutional context.

Rather than traditional sentiment analysis — unsuitable for procedural and 
logistical text — this project uses **Zero-Shot Text Classification** 
(via transformer models) to semantically label graph edges into three 
functional domains: `Logistical`, `Social`, and `Legal`.

## Research Questions

- **RQ1 · Context Drift** — How does the nature of interactions evolve 
  over time in correspondence with key judicial events?
- **RQ2 · The Brokers** — What is the structural role of 'Unknown' entities 
  in bridging separate network clusters?
- **RQ3 · Contextual Influence** — How does the influence hierarchy (centrality) 
  shift when filtering the network by domain?


## Academic Context

Web and Data Science project - Politecnico di Milano 
Authors: Bernadette Scocca, Mario Zoccola  