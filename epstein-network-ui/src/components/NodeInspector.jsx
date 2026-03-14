import React from 'react'

const CAT_COLORS = {
  Legal:       'var(--legal)',
  Social:      'var(--social)',
  Logistical:  'var(--logistical)',
}

function MetricBar({ label, value, max = 1, color = 'var(--accent)' }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          {value < 0.001 ? value.toExponential(2) : value.toFixed(5)}
        </span>
      </div>
      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

export default function NodeInspector({ node, graphData, onClose }) {
  if (!node) return null

  // Compute neighbors
  const neighbors = new Set()
  const edgesByCategory = { Legal: 0, Social: 0, Logistical: 0 }

  graphData.links.forEach(l => {
    const src = l.source?.id ?? l.source
    const tgt = l.target?.id ?? l.target
    if (src === node.id) { neighbors.add(tgt); edgesByCategory[l.category] = (edgesByCategory[l.category]||0)+1 }
    if (tgt === node.id) { neighbors.add(src); edgesByCategory[l.category] = (edgesByCategory[l.category]||0)+1 }
  })

  const totalEdges = Object.values(edgesByCategory).reduce((a,b) => a+b, 0)

  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0,
      width: 300,
      height: '100%',
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border)',
      overflowY: 'auto',
      padding: '20px 16px',
      zIndex: 20,
      animation: 'slideIn 0.2s ease',
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity:0 } to { transform:translateX(0); opacity:1 } }`}</style>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 14, right: 14,
          color: 'var(--text-muted)', fontSize: 18, lineHeight: 1,
        }}
      >×</button>

      {/* Node name */}
      <div style={{ marginBottom: 20, paddingRight: 24 }}>
        {node.is_unknown && (
          <div style={{
            display: 'inline-block',
            fontSize: 9, letterSpacing: '0.14em',
            color: 'var(--accent)', background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: 3, padding: '2px 6px', marginBottom: 6,
          }}>
            UNKNOWN ENTITY · BROKER
          </div>
        )}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          wordBreak: 'break-word',
        }}>
          {node.label}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          Community #{node.group} · {neighbors.size} direct neighbors
        </div>
      </div>

      {/* Centrality metrics */}
      <div style={{
        fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: 12,
        paddingBottom: 6, borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font-display)', fontWeight: 600,
      }}>
        Centrality Metrics
      </div>

      <MetricBar label="PageRank"    value={node.pagerank}    color="var(--accent)" />
      <MetricBar label="Betweenness" value={node.betweenness} color="var(--legal)" />
      <MetricBar label="Eigenvector" value={node.eigenvector} color="var(--social)" />
      <MetricBar label="Degree (w)"  value={node.val} max={500} color="var(--logistical)" />

      {/* Edge breakdown */}
      <div style={{
        fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: 12, marginTop: 20,
        paddingBottom: 6, borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font-display)', fontWeight: 600,
      }}>
        Edge Breakdown
      </div>

      {Object.entries(edgesByCategory).map(([cat, count]) => (
        count > 0 && (
          <div key={cat} style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px', marginBottom: 6,
            background: 'var(--bg-card)',
            border: `1px solid ${CAT_COLORS[cat]}33`,
            borderRadius: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: CAT_COLORS[cat], flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: CAT_COLORS[cat], fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {cat}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {count}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
                ({totalEdges > 0 ? ((count/totalEdges)*100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>
        )
      ))}

      {/* RQ hint */}
      {node.is_unknown && node.betweenness > 0.001 && (
        <div style={{
          marginTop: 20, padding: '10px 12px',
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent)',
          borderRadius: 6, fontSize: 11,
          color: 'var(--accent)', lineHeight: 1.6,
        }}>
          ⚠ High betweenness on an unknown entity. Structural broker candidate (RQ2).
        </div>
      )}
    </div>
  )
}
