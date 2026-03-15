import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'

const COMMUNITY_COLORS = [
  '#e63946','#457b9d','#2a9d8f','#e9c46a','#f4a261',
  '#264653','#8ecae6','#a8dadc','#6d6875','#b5838d',
  '#e76f51','#52b788','#90e0ef','#c77dff','#f72585',
  '#4cc9f0','#fb8500','#8338ec','#06d6a0','#ef233c',
]
const DOMAIN_COLORS   = { Legal:'#ff4757', Social:'#2ed8f7', Logistical:'#2ecc71' }
const CATEGORY_COLORS = { Legal:'#ff4757', Social:'#2ed8f7', Logistical:'#2ecc71' }
const COLOR_MODES = [
  { key:'community', label:'Community', desc:'Louvain clusters'        },
  { key:'domain',    label:'Domain',    desc:'Dominant semantic domain' },
]

function getCommunityColor(g) {
  return COMMUNITY_COLORS[Math.abs(g ?? 0) % COMMUNITY_COLORS.length]
}
function getNodeColor(node, mode) {
  if (mode === 'domain') return DOMAIN_COLORS[node.dominant_domain] ?? '#9E9E9E'
  return getCommunityColor(node.group)
}
function isEpstein(node) {
  return node.id?.toLowerCase().includes('jeffrey epstein')
}

export default function NetworkGraph({ graphData, onNodeClick, selectedNode }) {
  const fgRef        = useRef()
  const containerRef = useRef()
  const [dimensions,    setDimensions]    = useState({ width: 800, height: 600 })
  const [colorMode,     setColorMode]     = useState('community')
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults,   setShowResults]   = useState(false)

  // Prevent physics from re-initialising on every filter change
  const physicsReady = useRef(false)

  // ── Responsive resize ──────────────────────────────────────────
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // ── Physics — once only ───────────────────────────────────────
  useEffect(() => {
    if (!fgRef.current || !graphData.nodes.length) return
    if (physicsReady.current) return
    physicsReady.current = true
    setTimeout(() => {
      const fg = fgRef.current
      if (!fg) return
      fg.d3Force('charge')?.strength(-600)
      fg.d3Force('link')?.distance(80)
      fg.d3ReheatSimulation()
    }, 100)
  }, [graphData])

  // ── Neighbours ────────────────────────────────────────────────
  const neighbourIds = useMemo(() => {
    if (!selectedNode) return new Set()
    const ids = new Set()
    graphData.links.forEach(l => {
      const src = l.source?.id ?? l.source
      const tgt = l.target?.id ?? l.target
      if (src === selectedNode.id) ids.add(tgt)
      if (tgt === selectedNode.id) ids.add(src)
    })
    return ids
  }, [selectedNode, graphData.links])

  // ── Search ────────────────────────────────────────────────────
  const handleSearch = useCallback((q) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); setShowResults(false); return }
    setSearchResults(
      graphData.nodes
        .filter(n => n.label?.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8)
    )
    setShowResults(true)
  }, [graphData.nodes])

  const flyToNode = useCallback((node) => {
    setShowResults(false)
    setSearchQuery(node.label)
    onNodeClick(node)
    if (fgRef.current) {
      const dist = 150
      fgRef.current.cameraPosition(
        { x: (node.x ?? 0) + dist, y: (node.y ?? 0) + dist, z: (node.z ?? 0) + dist },
        { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 },
        800
      )
    }
  }, [onNodeClick])

  // ── 3D node objects ───────────────────────────────────────────
  const nodeThreeObject = useCallback((node) => {
    const isSel        = selectedNode?.id === node.id
    const isNeigh      = neighbourIds.has(node.id)
    const hasSelection = !!selectedNode
    const dimmed       = hasSelection && !isSel && !isNeigh
    const isEp         = isEpstein(node)
    const isUnknown    = node.is_unknown && !isEp

    // Radius — Epstein always biggest, log scale for others
    const r = isEp
      ? 24
      : Math.max(2, Math.min(14, Math.log1p(node.val ?? 1) * 1.8))

    const color = isEp ? '#f5c518' : getNodeColor(node, colorMode)
    const grp   = new THREE.Group()

    if (isUnknown) {
      // ── Unknown entities: OCTAHEDRON shape ───────────────────
      // Visually distinct from all other spherical nodes.
      // Size matches the logarithmic scale used for spheres.
      grp.add(new THREE.Mesh(
        new THREE.OctahedronGeometry(r * 1.2, 0),
        new THREE.MeshLambertMaterial({
          color:       dimmed ? '#1a1a2e' : color,
          transparent: dimmed,
          opacity:     dimmed ? 0.2 : 1,
        })
      ))
      // Gold wireframe outline to make brokers even more visible
      if (!dimmed) {
        grp.add(new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.OctahedronGeometry(r * 1.2, 0)),
          new THREE.LineBasicMaterial({ color: '#f5c518', opacity: 0.6, transparent: true })
        ))
      }
    } else {
      // ── All other nodes: SPHERE ───────────────────────────────
      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(r, 16, 16),
        new THREE.MeshLambertMaterial({
          color:       dimmed ? '#1a1a2e' : color,
          transparent: dimmed,
          opacity:     dimmed ? 0.2 : 1,
        })
      ))
    }

    // Epstein: outer gold ring
    if (isEp) {
      grp.add(new THREE.Mesh(
        new THREE.TorusGeometry(r + 5, 1, 10, 40),
        new THREE.MeshLambertMaterial({ color: '#f5c518', transparent: true, opacity: 0.5 })
      ))
    }

    // Selected: glow
    if (isSel) {
      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(r + 6, 16, 16),
        new THREE.MeshLambertMaterial({ color: '#f5c518', transparent: true, opacity: 0.15 })
      ))
    }

    // Neighbour: soft highlight
    if (isNeigh && !isSel) {
      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(r + 3, 16, 16),
        new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.08 })
      ))
    }

    // ── Labels ─────────────────────────────────────────────────
    // RULE:
    //   - Epstein: ALWAYS shown
    //   - Selected node: shown
    //   - Direct neighbours of selected: shown
    //   - Everyone else: NEVER shown
    const showLabel = isEp || isSel || isNeigh

    if (showLabel && !dimmed) {
      const canvas  = document.createElement('canvas')
      const ctx     = canvas.getContext('2d')
      const label   = node.label ?? node.id
      const fs      = isEp || isSel ? 30 : 18
      canvas.width  = 600
      canvas.height = 90

      ctx.font      = `${isEp || isSel ? 'bold ' : ''}${fs}px JetBrains Mono, monospace`
      ctx.textAlign = 'center'

      const tw = ctx.measureText(label).width
      ctx.fillStyle = 'rgba(8,10,15,0.82)'
      ctx.fillRect(canvas.width / 2 - tw / 2 - 8, 10, tw + 16, fs + 12)
      ctx.fillStyle = isEp || isSel ? '#f5c518' : isNeigh ? '#ffffff' : '#c8ccd4'
      ctx.fillText(label, canvas.width / 2, fs + 14)

      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })
      )
      const sc = isEp || isSel ? 75 : 45
      sprite.scale.set(sc, sc * (canvas.height / canvas.width), 1)
      sprite.position.set(0, r + sc * 0.28, 0)
      grp.add(sprite)
    }

    return grp
  }, [selectedNode, neighbourIds, colorMode])

  // ── Link styling ──────────────────────────────────────────────
  const linkColor = useCallback((link) => {
    if (link.hidden) return 'rgba(0,0,0,0)'
if (!selectedNode) return CATEGORY_COLORS[link.category] ?? 'rgba(80,100,140,0.4)'
    const src       = link.source?.id ?? link.source
    const tgt       = link.target?.id ?? link.target
    const connected = src === selectedNode.id || tgt === selectedNode.id
    return connected
      ? (CATEGORY_COLORS[link.category] ?? '#ffffff')
      : 'rgba(30,40,60,0.08)'
  }, [selectedNode])

  const linkWidth = useCallback((link) => {
const base = Math.max(0.2, Math.min(2.5, Math.log1p(link.weight ?? 1) * 0.4))
    if (link.hidden) return 0
    if (!selectedNode) return base
    const src       = link.source?.id ?? link.source
    const tgt       = link.target?.id ?? link.target
    const connected = src === selectedNode.id || tgt === selectedNode.id
    return connected
      ? Math.max(1.5, Math.min(5, Math.log1p(link.weight ?? 1) * 0.9))
      : 0.1
  }, [selectedNode])



  // ── Render ────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#080a0f' }}>

      {/* Color mode switcher */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 2 }}>
          Color by
        </div>
        {COLOR_MODES.map(m => (
          <button key={m.key} onClick={() => setColorMode(m.key)} style={{
            padding: '6px 12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            background: colorMode === m.key ? 'var(--accent-dim)' : 'var(--bg-card)',
            border: `1px solid ${colorMode === m.key ? 'var(--accent)' : 'var(--border)'}`,
            color: colorMode === m.key ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11,
          }}>
            <div>{m.label}</div>
            <div style={{ fontSize: 9, opacity: 0.7, fontWeight: 400 }}>{m.desc}</div>
          </button>
        ))}
        {colorMode === 'domain' && (
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4 }}>
            {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{d}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search bar */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20, width: 320 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(13,16,23,0.92)',
          border: '1px solid var(--border-bright)',
          borderRadius: searchResults.length && showResults ? '6px 6px 0 0' : 6,
          padding: '8px 12px', gap: 8, backdropFilter: 'blur(8px)',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>⌕</span>
          <input
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => searchResults.length && setShowResults(true)}
            placeholder="Search entity..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false) }} style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1 }}>×</button>
          )}
        </div>
        {showResults && searchResults.length > 0 && (
          <div style={{ background: 'rgba(13,16,23,0.97)', border: '1px solid var(--border-bright)', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
            {searchResults.map(node => (
              <div key={node.id} onClick={() => flyToNode(node)}
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: node.is_unknown ? '#f5c518' : getNodeColor(node, colorMode) }} />
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>deg {node.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fit view */}
      <button onClick={() => fgRef.current?.zoomToFit(600, 80)} style={{
        position: 'absolute', bottom: 20, right: 16, zIndex: 20,
        background: 'rgba(13,16,23,0.88)', border: '1px solid var(--border-bright)',
        borderRadius: 6, padding: '6px 12px', fontSize: 11,
        color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', cursor: 'pointer',
      }}>
        ⊡ Fit view
      </button>

      {/* Deselect hint */}
      {selectedNode && (
        <div onClick={() => onNodeClick(selectedNode)} style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, cursor: 'pointer',
          background: 'rgba(13,16,23,0.88)', border: '1px solid var(--border-bright)',
          borderRadius: 20, padding: '6px 16px',
          fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
        }}>
          Click again to deselect
        </div>
      )}

      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#080a0f"
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkOpacity={0.6}
        onNodeClick={onNodeClick}
        cooldownTicks={200}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.2}
        enableNodeDrag={true}
        showNavInfo={false}
      />

      {graphData.nodes.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, zIndex: 5 }}>
          <div style={{ fontSize: 32 }}>⬡</div>
          <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', fontSize: 13 }}>No nodes match current filters</div>
        </div>
      )}
    </div>
  )
}
