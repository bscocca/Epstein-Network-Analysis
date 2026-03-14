import React from 'react'

const CATEGORIES = ['Legal', 'Social', 'Logistical']

const CAT_COLORS = {
  Legal:       'var(--legal)',
  Social:      'var(--social)',
  Logistical:  'var(--logistical)',
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 9,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Toggle({ label, color, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '7px 10px',
        borderRadius: 4,
        background: active ? `rgba(${hexToRgb(color)}, 0.08)` : 'transparent',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        color: active ? color : 'var(--text-muted)',
        marginBottom: 6,
        transition: 'all 0.15s ease',
        textAlign: 'left',
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: active ? color : 'var(--text-muted)',
        flexShrink: 0,
        transition: 'background 0.15s',
      }} />
      <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        {label}
      </span>
    </button>
  )
}

// Helper to convert CSS var hex to rgb for rgba()
function hexToRgb(cssVar) {
  const map = {
    'var(--legal)':      '255,71,87',
    'var(--social)':     '46,216,247',
    'var(--logistical)': '46,204,113',
  }
  return map[cssVar] ?? '255,255,255'
}

export default function ControlPanel({ filters, setFilters, graphData, selectedNode }) {
  const { categories, showUnknown, minDegree } = filters

  const toggleCategory = (cat) => {
    setFilters(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat]
    }))
  }

  const activeCount  = graphData.nodes.length
  const activeEdges  = graphData.links.length

  return (
    <aside style={{
      width: 'var(--panel-w)',
      height: '100%',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      overflowY: 'auto',
      padding: '20px 16px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Live counts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        marginBottom: 24,
      }}>
        {[['Visible Nodes', activeCount], ['Visible Edges', activeEdges]].map(([l, v]) => (
          <div key={l} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--accent)', marginTop: 2 }}>
              {v.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* RQ1 / RQ3 — Domain Filter */}
      <Section title="Domain Filter (RQ1 · RQ3)">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
          Filter edges by semantic category. Deselect all to show full network.
        </div>
        {CATEGORIES.map(cat => (
          <Toggle
            key={cat}
            label={cat}
            color={CAT_COLORS[cat]}
            active={categories.includes(cat)}
            onToggle={() => toggleCategory(cat)}
          />
        ))}
      </Section>

      {/* RQ2 — Broker Filter */}
      <Section title="Broker Analysis (RQ2)">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
          Toggle visibility of Unknown/anonymized entities to study structural brokers.
        </div>
        <Toggle
          label="Show Unknown Entities"
          color="var(--unknown)"
          active={showUnknown}
          onToggle={() => setFilters(f => ({ ...f, showUnknown: !f.showUnknown }))}
        />
      </Section>

      {/* Min Degree Slider */}
      <Section title="Node Threshold">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
          Hide nodes with fewer than <span style={{ color: 'var(--accent)' }}>{minDegree}</span> weighted connections.
        </div>
        <input
          type="range" min={1} max={100} value={minDegree}
          onChange={e => setFilters(f => ({ ...f, minDegree: +e.target.value }))}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          <span>1 (all)</span><span>100 (hubs only)</span>
        </div>
      </Section>

      {/* Legend */}
      <Section title="Legend">
        {[
          ['Edge color', ''],
          ['— Legal',      'var(--legal)'],
          ['— Social',     'var(--social)'],
          ['— Logistical', 'var(--logistical)'],
          ['Node size', ''],
          ['= Weighted degree', 'var(--text-muted)'],
          ['Node color', ''],
          ['= Community (Louvain)', 'var(--text-muted)'],
          ['Gold ring', 'var(--accent)'],
          ['= Unknown/broker', 'var(--accent)'],
        ].map(([text, color], i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 4, fontSize: 11,
            color: color || 'var(--text-secondary)',
          }}>
            {color && color !== 'var(--text-muted)' && color !== 'var(--text-secondary)' && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            )}
            <span>{text}</span>
          </div>
        ))}
      </Section>

      <div style={{ marginTop: 'auto', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
          HOW TO NAVIGATE
        </div>
        <div>Scroll → Zoom</div>
        <div>Drag → Pan</div>
        <div>Click node → Inspect</div>
        <div>Drag node → Reposition</div>
      </div>
    </aside>
  )
}
