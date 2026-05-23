import { useMemo, useState } from "react";
import type { AttackGraphNode, AttackGraphEdge } from "../../data/xdrIncidents";

interface XdrAttackGraphProps {
  nodes: AttackGraphNode[];
  edges: AttackGraphEdge[];
}

const DISPOSITION_COLORS = {
  malicious: "#D13438", // Red
  suspicious: "#C0472B", // Dark orange/red
  common: "#E8A000", // Yellow/amber
  unknown: "#8b949e", // Grey
  clean: "#0078D4", // Blue
  asset: "#8A2BE2" // Purple
};

function getNodeIcon(type: string) {
  // Simple embedded SVG paths for icons
  switch (type) {
    case "ip":
      return <path d="M4 4h16v16H4z M4 9h16 M4 14h16 M8 4v16" fill="none" stroke="currentColor" strokeWidth="2" />; // Server-ish
    case "endpoint":
      return <path d="M2 18h20v2H2z M4 6h16v10H4z" fill="none" stroke="currentColor" strokeWidth="2" />; // Laptop
    case "process":
      return <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" />; // Gear
    case "user":
      return <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="none" stroke="currentColor" strokeWidth="2" />; // Person
    case "file":
    default:
      return <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M16 13H8M16 17H8M10 9H8" fill="none" stroke="currentColor" strokeWidth="2" />; // Document
  }
}

export function XdrAttackGraph({ nodes, edges }: XdrAttackGraphProps) {
  const [activeNode, setActiveNode] = useState<AttackGraphNode | null>(null);

  // Auto-layout logic (horizontal chain/tree)
  const layoutNodes = useMemo(() => {
    // Simple topological sort / level assignment
    const levels: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    
    nodes.forEach(n => {
      adj[n.id] = [];
      inDegree[n.id] = 0;
    });

    edges.forEach(e => {
      if (adj[e.source]) {
        adj[e.source].push(e.target);
      }
      if (inDegree[e.target] !== undefined) {
        inDegree[e.target]++;
      }
    });

    // Find roots
    let queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    if (queue.length === 0 && nodes.length > 0) queue = [nodes[0].id]; // cycle fallback

    queue.forEach(id => { levels[id] = 0; });
    
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const curLevel = levels[cur];
      
      adj[cur]?.forEach(neighbor => {
        if (levels[neighbor] === undefined || levels[neighbor] < curLevel + 1) {
          levels[neighbor] = curLevel + 1;
          queue.push(neighbor);
        }
      });
    }

    // Group by level to assign Y coordinates
    const levelGroups: Record<number, string[]> = {};
    let maxLevel = 0;
    nodes.forEach(n => {
      const l = levels[n.id] || 0;
      if (!levelGroups[l]) levelGroups[l] = [];
      levelGroups[l].push(n.id);
      if (l > maxLevel) maxLevel = l;
    });

    const NODE_WIDTH = 120;
    const NODE_HEIGHT = 50;
    const X_SPACING = 180;
    const Y_SPACING = 80;

    const positioned = nodes.map(n => {
      const l = levels[n.id] || 0;
      const siblings = levelGroups[l];
      const index = siblings.indexOf(n.id);
      
      const x = 50 + l * X_SPACING;
      // Center vertically based on siblings
      const totalH = siblings.length * Y_SPACING;
      const y = Math.max(50, 150 - totalH/2 + index * Y_SPACING);

      return {
        ...n,
        x, y,
        cx: x + NODE_WIDTH / 2,
        cy: y + NODE_HEIGHT / 2
      };
    });

    return positioned;
  }, [nodes, edges]);

  // Dimensions
  const maxX = Math.max(800, ...layoutNodes.map(n => n.x + 200));
  const maxY = Math.max(300, ...layoutNodes.map(n => n.y + 100));

  return (
    <div className="xdr-attack-graph-container" style={{ position: 'relative', width: '100%', overflowX: 'auto', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px' }}>
      <svg width={maxX} height={maxY} style={{ display: 'block' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#8b949e" />
          </marker>
          <filter id="glow-malicious" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-suspicious" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <style>
          {`
            @keyframes dashAnim {
              to { stroke-dashoffset: -20; }
            }
            .animated-edge {
              stroke-dasharray: 6, 6;
              animation: dashAnim 1s linear infinite;
            }
            .node-content {
              transition: transform 0.2s ease;
              transform-origin: 60px 25px;
            }
            .node-group:hover .node-content {
              transform: scale(1.05);
            }
          `}
        </style>
        
        {/* Edges */}
        {edges.map((e, i) => {
          const source = layoutNodes.find(n => n.id === e.source);
          const target = layoutNodes.find(n => n.id === e.target);
          if (!source || !target) return null;
          
          // Draw curved line (cubic bezier)
          const startX = source.cx + 60; // Approximate right edge
          const startY = source.cy;
          const endX = target.cx - 60; // Approximate left edge
          const endY = target.cy;
          const ctrlX1 = startX + 40;
          const ctrlX2 = endX - 40;

          return (
            <path
              key={`edge-${i}`}
              className="animated-edge"
              d={`M ${startX} ${startY} C ${ctrlX1} ${startY}, ${ctrlX2} ${endY}, ${endX} ${endY}`}
              fill="none"
              stroke="#58a6ff"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              opacity={0.8}
            />
          );
        })}

        {/* Nodes */}
        {layoutNodes.map(n => {
          const color = DISPOSITION_COLORS[n.disposition] || DISPOSITION_COLORS.unknown;
          const isSelected = activeNode?.id === n.id;
          
          let filter = undefined;
          if (n.disposition === 'malicious') filter = "url(#glow-malicious)";
          if (n.disposition === 'suspicious') filter = "url(#glow-suspicious)";
          
          return (
            <g 
              key={n.id} 
              className="node-group"
              style={{ cursor: 'pointer' }}
              transform={`translate(${n.x}, ${n.y})`}
              onClick={() => setActiveNode(n)}
              filter={filter}
            >
              <g className="node-content">
                <rect
                  x="0" y="0" width="120" height="50" rx="6"
                  fill={isSelected ? "#1f2428" : "#161b22"}
                  stroke={isSelected ? "#58a6ff" : color}
                  strokeWidth={isSelected ? "2" : "1"}
                  style={{ transition: 'all 0.2s ease' }}
                />
                {/* Left Color Bar */}
                <rect x="0" y="0" width="8" height="50" fill={color} rx="6" style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
                
                {/* Icon */}
                <svg x="14" y="15" width="20" height="20" color="#c9d1d9">
                  {getNodeIcon(n.type)}
                </svg>
                
                {/* Label */}
                <text x="42" y="25" fill="#e6edf3" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                  {n.label.length > 12 ? n.label.substring(0, 10) + '...' : n.label}
                </text>
                <text x="42" y="38" fill="#8b949e" fontSize="9" fontFamily="sans-serif" style={{ textTransform: 'uppercase' }}>
                  {n.disposition}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Side Panel for Node Details */}
      {activeNode && (
        <div className="xdr-node-detail-panel" style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0,
          width: '250px',
          background: '#161b22',
          borderLeft: '1px solid #30363d',
          padding: '16px',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.3)',
          overflowY: 'auto'
        }}>
          <button 
            onClick={() => setActiveNode(null)} 
            style={{ float: 'right', background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '16px' }}
          >
            ×
          </button>
          <h4 style={{ margin: '0 0 16px 0', color: '#e6edf3', fontSize: '14px', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
            Node Details
          </h4>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Label</span>
            <strong style={{ fontSize: '13px', color: '#e6edf3', wordBreak: 'break-all' }}>{activeNode.label}</strong>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Type</span>
            <span style={{ fontSize: '13px', color: '#c9d1d9', textTransform: 'capitalize' }}>{activeNode.type}</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Disposition</span>
            <span style={{ 
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '11px',
              background: `${DISPOSITION_COLORS[activeNode.disposition]}33`,
              color: DISPOSITION_COLORS[activeNode.disposition],
              border: `1px solid ${DISPOSITION_COLORS[activeNode.disposition]}`
            }}>
              {activeNode.disposition}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
