import React from 'react'

export default function Header({ metadata }) {
  return (
    <header style={{
      height: 'var(--header-h)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: 'var(--bg-panel)',
      flexShrink: 0,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 15,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
        }}>
          Network Analysis
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          The Epstein Corpus
        </span>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {[
          ['NODES',  metadata.total_nodes],
          ['EDGES',  metadata.total_links],
          ['CLUSTERS', metadata.n_communities],
        ].map(([label, val]) => (
          <div key={label} style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.12em' }}>
              {label}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text-primary)',
            }}>
              {val?.toLocaleString() ?? '—'}
            </div>
          </div>
        ))}
      </div>
    </header>
  )
}
