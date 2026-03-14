import { useState, useEffect, useMemo } from 'react'

export function useGraphData(filters) {
  const [rawData, setRawData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

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

    const { categories, showUnknown, minDegree, highlightNode } = filters

    // Filter nodes
    const validNodes = new Set()
    rawData.nodes.forEach(n => {
      if (!showUnknown && n.is_unknown) return
      if (n.val < minDegree) return
      validNodes.add(n.id)
    })

    const nodes = rawData.nodes
      .filter(n => validNodes.has(n.id))
      .map(n => ({ ...n }))   // shallow clone so force-graph can mutate

    // Filter links
    const links = rawData.links.filter(l =>
      validNodes.has(l.source?.id ?? l.source) &&
      validNodes.has(l.target?.id ?? l.target) &&
      (categories.length === 0 || categories.includes(l.category))
    )

    return { nodes, links }
  }, [rawData, filters])

  const metadata = rawData?.metadata ?? {}

  return { graphData, metadata, loading, error, rawData }
}
