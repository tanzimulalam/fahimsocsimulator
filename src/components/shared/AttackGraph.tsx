import { useMemo } from "react";

export type GraphVerdict = "malicious" | "suspicious" | "common" | "unknown" | "clean" | "asset";
export type GraphNodeType = "ip" | "endpoint" | "process" | "user" | "file" | "url" | "mailbox";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  verdict: GraphVerdict;
}

export interface GraphEdge {
  source: string;
  target: string;
}

interface AttackGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  selectedId?: string;
}

const VERDICT_COLORS: Record<GraphVerdict, string> = {
  malicious: "#D13438",
  suspicious: "#C0472B",
  common: "#E8A000",
  unknown: "#8b949e",
  clean: "#0078D4",
  asset: "#8A2BE2",
};

function nodeIcon(type: GraphNodeType) {
  switch (type) {
    case "ip":
      return <path d="M4 4h16v16H4z M4 9h16 M4 14h16 M8 4v16" fill="none" stroke="currentColor" strokeWidth="2" />;
    case "endpoint":
      return <path d="M2 18h20v2H2z M4 6h16v10H4z" fill="none" stroke="currentColor" strokeWidth="2" />;
    case "process":
      return <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" />;
    case "user":
      return <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="none" stroke="currentColor" strokeWidth="2" />;
    case "url":
      return <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" fill="none" stroke="currentColor" strokeWidth="2" />;
    case "mailbox":
      return <path d="M4 4h16v16H4z M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" />;
    case "file":
    default:
      return <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M16 13H8M16 17H8M10 9H8" fill="none" stroke="currentColor" strokeWidth="2" />;
  }
}

export function AttackGraph({ nodes, edges, onNodeClick, selectedId }: AttackGraphProps) {
  const layoutNodes = useMemo(() => {
    const levels: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    nodes.forEach((n) => {
      adj[n.id] = [];
      inDegree[n.id] = 0;
    });
    edges.forEach((e) => {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (inDegree[e.target] !== undefined) inDegree[e.target]++;
    });
    let queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
    if (queue.length === 0 && nodes.length > 0) queue = [nodes[0].id];
    queue.forEach((id) => (levels[id] = 0));
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const curLevel = levels[cur];
      adj[cur]?.forEach((nb) => {
        if (levels[nb] === undefined || levels[nb] < curLevel + 1) {
          levels[nb] = curLevel + 1;
          queue.push(nb);
        }
      });
    }
    const levelGroups: Record<number, string[]> = {};
    nodes.forEach((n) => {
      const l = levels[n.id] || 0;
      if (!levelGroups[l]) levelGroups[l] = [];
      levelGroups[l].push(n.id);
    });
    const X_SPACING = 180;
    const Y_SPACING = 80;
    return nodes.map((n) => {
      const l = levels[n.id] || 0;
      const siblings = levelGroups[l];
      const index = siblings.indexOf(n.id);
      const x = 50 + l * X_SPACING;
      const totalH = siblings.length * Y_SPACING;
      const y = Math.max(40, 150 - totalH / 2 + index * Y_SPACING);
      return { ...n, x, y, cx: x + 60, cy: y + 25 };
    });
  }, [nodes, edges]);

  const maxX = Math.max(700, ...layoutNodes.map((n) => n.x + 200));
  const maxY = Math.max(260, ...layoutNodes.map((n) => n.y + 90));

  return (
    <div style={{ width: "100%", overflow: "auto", background: "#0d1117", border: "1px solid #30363d", borderRadius: 8 }}>
      <svg width={maxX} height={maxY} style={{ display: "block" }}>
        <defs>
          <marker id="ag-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#8b949e" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const s = layoutNodes.find((n) => n.id === e.source);
          const t = layoutNodes.find((n) => n.id === e.target);
          if (!s || !t) return null;
          const startX = s.cx + 60;
          const endX = t.cx - 60;
          return (
            <path
              key={i}
              d={`M ${startX} ${s.cy} C ${startX + 40} ${s.cy}, ${endX - 40} ${t.cy}, ${endX} ${t.cy}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              markerEnd="url(#ag-arrow)"
              opacity={0.8}
            />
          );
        })}
        {layoutNodes.map((n) => {
          const color = VERDICT_COLORS[n.verdict] ?? VERDICT_COLORS.unknown;
          const isSel = selectedId === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              style={{ cursor: onNodeClick ? "pointer" : "default" }}
              onClick={() => onNodeClick?.(n)}
            >
              <rect x="0" y="0" width="120" height="50" rx="6" fill={isSel ? "#1f2933" : "#161b22"} stroke={isSel ? "#58a6ff" : color} strokeWidth={isSel ? 2 : 1} />
              <rect x="0" y="0" width="8" height="50" fill={color} />
              <svg x="14" y="15" width="20" height="20" color="#c9d1d9">
                {nodeIcon(n.type)}
              </svg>
              <text x="42" y="24" fill="#e6edf3" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                {n.label.length > 13 ? n.label.slice(0, 11) + "…" : n.label}
              </text>
              <text x="42" y="38" fill="#8b949e" fontSize="9" fontFamily="sans-serif">
                {n.verdict.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
