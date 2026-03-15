import { useState, useEffect, useMemo } from 'react'

const MAX_LINKS = 2000

export function useGraphData(filters) {
  const [rawData, setRawData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetch('/web_graph_data.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => { setRawData(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [])

  const graphData = useMemo(() => {
    if (!rawData) return { nodes: [], links: [] }

    const { categories, showUnknown } = filters

    // --- Step 1: density-based pruning (always on full link set) ---
    const baseLinks = [...rawData.links]
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      .slice(0, MAX_LINKS)

    const validNodes = new Set()
    baseLinks.forEach(l => {
      validNodes.add(l.source?.id ?? l.source)
      validNodes.add(l.target?.id ?? l.target)
    })

    // Epstein always present
    rawData.nodes.forEach(n => {
      if (n.id?.toLowerCase().includes('jeffrey epstein')) validNodes.add(n.id)
    })

    // --- Step 2: unknown toggle ---
    if (!showUnknown) {
      rawData.nodes.forEach(n => {
        if (n.is_unknown) validNodes.delete(n.id)
      })
    }

    // --- Step 3: nodes (never filtered by category) ---
    const nodes = rawData.nodes
      .filter(n => validNodes.has(n.id))
      .map(n => ({ ...n }))

    // --- Step 4: links with visibility flag ---
    // KEY INSIGHT: instead of removing filtered links (which causes nodes to
    // disappear from the simulation), we keep ALL base links but add a
    // `hidden` flag. NetworkGraph.jsx uses this flag to make links
    // invisible without removing them from the physics simulation.
    // This keeps all nodes positioned in the graph at all times.
    const links = baseLinks
      .filter(l => {
        const src = l.source?.id ?? l.source
        const tgt = l.target?.id ?? l.target
        if (!validNodes.has(src) || !validNodes.has(tgt)) return false
        if (!showUnknown) {
          const sn = rawData.nodes.find(n => n.id === src)
          const tn = rawData.nodes.find(n => n.id === tgt)
          if (sn?.is_unknown || tn?.is_unknown) return false
        }
        return true
      })
      .map(l => ({
        ...l,
        // hidden = true means: keep in simulation but render invisibly
        hidden: categories.length > 0 && !categories.includes(l.category)
      }))

    return { nodes, links }
  }, [rawData, filters])

  const metadata = rawData?.metadata ?? {}

  return { graphData, metadata, loading, error, rawData }
}
