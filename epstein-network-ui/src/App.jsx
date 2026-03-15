import React, { useState } from 'react'
import Header from './components/Header.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import NetworkGraph from './components/NetworkGraph.jsx'
import NodeInspector from './components/NodeInspector.jsx'
import { useGraphData } from './hooks/useGraphData.js'

const DEFAULT_FILTERS = {
  categories:  ['Legal', 'Social', 'Logistical'],
  showUnknown: true,
  minDegree:   5,
  highlightNode: null,
}

export default function App() {
  const [filters, setFilters]           = useState(DEFAULT_FILTERS)
  const [selectedNode, setSelectedNode] = useState(null)

  const { graphData, metadata, loading, error } = useGraphData(filters)

  const handleNodeClick = (node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 16,
      background: 'var(--bg-void)',
    }}>
      <div style={{
        width: 40, height: 40, border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
        LOADING CORPUS...
      </div>
    </div>
  )

  if (error) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 12,
      background: 'var(--bg-void)',
    }}>
      <div style={{ color: 'var(--legal)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
        FAILED TO LOAD DATA
      </div>
      <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        {error}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, maxWidth: 400, textAlign: 'center', marginTop: 8 }}>
        Make sure <code style={{ color: 'var(--accent)' }}>web_graph_data.json</code> is in the{' '}
        <code style={{ color: 'var(--accent)' }}>public/</code> folder of this project.
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header metadata={metadata} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ControlPanel
          filters={filters}
          setFilters={setFilters}
          graphData={graphData}
          selectedNode={selectedNode}
        />

        <NetworkGraph
          graphData={graphData}
          onNodeClick={handleNodeClick}
          selectedNode={selectedNode}
        />

        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            graphData={graphData}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  )
}
