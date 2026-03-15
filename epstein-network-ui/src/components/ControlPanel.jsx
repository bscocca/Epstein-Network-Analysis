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

function hexToRgb(cssVar) {
  const map = {
    'var(--legal)':      '255,71,87',
    'var(--social)':     '46,216,247',
    'var(--logistical)': '46,204,113',
  }
  return map[cssVar] ?? '255,255,255'
}

// Degree distribution of this dataset (from analysis):
// 25th pct = 2   →  50% of nodes have degree ≤ 6
// 75th pct = 23  →  top 25% start here
// 90th pct = 60  →  top 10%
// 95th pct = 107 →  top 5%
// Max       = 14,461 (Epstein)
// Slider range: 1–150. Values above 150 only retain ~5% of nodes (hubs only).
const SLIDER_MIN = 1
const SLIDER_MAX = 150

function degreeLabel(val) {
  if (val <= 1)   return 'tutti i nodi'
  if (val <= 6)   return 'top 50%'
  if (val <= 23)  return 'top 25%'
  if (val <= 60)  return 'top 10%'
  if (val <= 107) return 'top 5%'
  return 'solo hub'
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

  const activeCount = graphData.nodes.length
  const activeEdges = graphData.links.filter(l => !l.hidden).length

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
          Filtra gli archi per categoria semantica. Deseleziona tutto per vedere il network completo.
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
          Mostra/nascondi le entità anonime (Unknown) per studiare i broker strutturali.
        </div>
        <Toggle
          label="Mostra entità Unknown"
          color="var(--unknown)"
          active={showUnknown}
          onToggle={() => setFilters(f => ({ ...f, showUnknown: !f.showUnknown }))}
        />
      </Section>

      {/* Node Threshold Slider */}
      <Section title="Node Threshold">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
          Mostra solo nodi con almeno{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{minDegree}</span>
          {' '}interazioni pesate
          {' '}
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            ({degreeLabel(minDegree)})
          </span>
        </div>
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={1}
          value={minDegree}
          onChange={e => setFilters(f => ({ ...f, minDegree: +e.target.value }))}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          fontSize: 9,
          color: 'var(--text-muted)',
          marginTop: 6,
          gap: 2,
        }}>
          {[
            ['1', 'tutti'],
            ['23', 'top 25%'],
            ['60', 'top 10%'],
            ['150', 'hub'],
          ].map(([val, lbl]) => (
            <div
              key={val}
              onClick={() => setFilters(f => ({ ...f, minDegree: +val }))}
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                padding: '3px 0',
                borderRadius: 3,
                background: minDegree === +val ? 'var(--accent-dim)' : 'transparent',
                color: minDegree === +val ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.1s',
              }}
            >
              <div style={{ fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 8 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Legend */}
      <Section title="Legend">
        {[
          ['Colore arco', ''],
          ['— Legal',      'var(--legal)'],
          ['— Social',     'var(--social)'],
          ['— Logistical', 'var(--logistical)'],
          ['Dimensione nodo', ''],
          ['= Degree pesato', 'var(--text-muted)'],
          ['Colore nodo', ''],
          ['= Community (Louvain)', 'var(--text-muted)'],
          ['Anello dorato', 'var(--accent)'],
          ['= Unknown/broker', 'var(--accent)'],
          ['Forma ottaedro', 'var(--legal)'],
          ['= Entità Unknown', 'var(--legal)'],
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
          NAVIGAZIONE
        </div>
        <div>Scroll → Zoom</div>
        <div>Drag sinistro → Ruota</div>
        <div>Drag destro → Pan</div>
        <div>Click nodo → Ispeziona</div>
        <div>Click again → Deseleziona</div>
      </div>
    </aside>
  )
}
