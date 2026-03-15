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

    const { categories, showUnknown, minDegree } = filters

    // --- Step 1: density-based pruning (ignores category filter) ---
    // Take the top MAX_LINKS heaviest links to find relevant nodes.
    const baseLinks = [...rawData.links]
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      .slice(0, MAX_LINKS)

    const validNodes = new Set()
    baseLinks.forEach(l => {
      validNodes.add(l.source?.id ?? l.source)
      validNodes.add(l.target?.id ?? l.target)
    })

    // Epstein always present regardless of any filter
    rawData.nodes.forEach(n => {
      if (n.id?.toLowerCase().includes('jeffrey epstein')) validNodes.add(n.id)
    })

    // --- Step 2: unknown toggle ---
    if (!showUnknown) {
      rawData.nodes.forEach(n => {
        if (n.is_unknown) validNodes.delete(n.id)
      })
    }

    // --- Step 3: nodes — apply minDegree threshold ---
    // node.val = weighted degree (number of interactions).
    // Epstein is always shown regardless of the threshold.
    const nodes = rawData.nodes
      .filter(n => {
        if (!validNodes.has(n.id)) return false
        if (n.id?.toLowerCase().includes('jeffrey epstein')) return true
        if ((n.val ?? 0) < (minDegree ?? 1)) return false
        return true
      })
      .map(n => ({ ...n }))

    // Rebuild valid set from filtered nodes so links respect the threshold
    const validNodesFiltered = new Set(nodes.map(n => n.id))

    // --- Step 4: links ---
    // All base links are kept in the data (with a hidden flag) so that
    // react-force-graph-3d never removes nodes from the simulation.
    // Links are marked hidden when they don't match the category filter
    // or when one of their endpoints was removed by minDegree/unknown filters.
    const links = [...rawData.links]
      .filter(l => {
        const src = l.source?.id ?? l.source
        const tgt = l.target?.id ?? l.target
        // Must connect two nodes that survived all filters
        if (!validNodesFiltered.has(src) || !validNodesFiltered.has(tgt)) return false
        if (!showUnknown) {
          const sn = rawData.nodes.find(n => n.id === src)
          const tn = rawData.nodes.find(n => n.id === tgt)
          if (sn?.is_unknown || tn?.is_unknown) return false
        }
        return true
      })
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      .slice(0, MAX_LINKS)
      .map(l => ({
        ...l,
        // hidden = true: link stays in simulation but is rendered invisible
        hidden: categories.length > 0 && !categories.includes(l.category)
      }))

    return { nodes, links }
  }, [rawData, filters])

  const metadata = rawData?.metadata ?? {}

  return { graphData, metadata, loading, error, rawData }
}
