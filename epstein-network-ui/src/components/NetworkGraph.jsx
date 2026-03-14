import React, { useRef, useCallback, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

// Community → color mapping (20 distinct colors)
const COMMUNITY_COLORS = [
  '#e63946','#457b9d','#2a9d8f','#e9c46a','#f4a261',
  '#264653','#8ecae6','#a8dadc','#6d6875','#b5838d',
  '#e76f51','#52b788','#90e0ef','#c77dff','#f72585',
  '#4cc9f0','#fb8500','#8338ec','#06d6a0','#ef233c',
]

const CATEGORY_COLORS = {
  Legal:      '#ff4757',
  Social:     '#2ed8f7',
  Logistical: '#2ecc71',
}

function getCommunityColor(groupId) {
  return COMMUNITY_COLORS[Math.abs(groupId ?? 0) % COMMUNITY_COLORS.length]
}

export default function NetworkGraph({ graphData, onNodeClick, selectedNode }) {
  const fgRef = useRef()
  const containerRef = useRef()
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Responsive resize
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Custom node rendering
  const paintNode = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode?.id === node.id
    const isUnknown  = node.is_unknown

    // Size based on degree (capped for readability)
    const r = Math.max(3, Math.min(22, Math.sqrt(node.val ?? 1) * 1.4))

    const color = getCommunityColor(node.group)

    // Glow for selected
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(245,197,24,0.2)'
      ctx.fill()
    }

    // Main circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()

    // Gold ring for unknown/broker nodes
    if (isUnknown) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 2.5, 0, 2 * Math.PI)
      ctx.strokeStyle = '#f5c518'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Label (only when zoomed in enough, or selected)
    const fontSize = Math.max(10 / globalScale, 2)
    if (globalScale > 1.2 || isSelected) {
      ctx.font = `${isSelected ? 'bold ' : ''}${fontSize}px JetBrains Mono, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Label background
      const textW = ctx.measureText(node.label).width
      ctx.fillStyle = 'rgba(8,10,15,0.85)'
      ctx.fillRect(node.x - textW / 2 - 2, node.y + r + 1, textW + 4, fontSize + 2)

      ctx.fillStyle = isSelected ? '#f5c518' : '#e8eaf0'
      ctx.fillText(node.label, node.x, node.y + r + fontSize / 2 + 3)
    }
  }, [selectedNode])

  // Edge color by category
  const linkColor = useCallback((link) => {
    return CATEGORY_COLORS[link.category] ?? '#2a3448'
  }, [])

  const linkWidth = useCallback((link) => {
    return Math.max(0.5, Math.min(4, Math.log1p(link.weight ?? 1) * 0.6))
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-void)' }}
    >
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: `
          linear-gradient(rgba(30,37,53,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,37,53,0.4) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#080a0f"
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => 'replace'}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={0}
        onNodeClick={onNodeClick}
        nodePointerAreaPaint={(node, color, ctx) => {
          const r = Math.max(4, Math.min(22, Math.sqrt(node.val ?? 1) * 1.4)) + 4
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
          ctx.fill()
        }}
        cooldownTicks={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />

      {/* Empty state */}
      {graphData.nodes.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, zIndex: 5,
        }}>
          <div style={{ fontSize: 32 }}>⬡</div>
          <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', fontSize: 13 }}>
            No nodes match current filters
          </div>
        </div>
      )}
    </div>
  )
}
