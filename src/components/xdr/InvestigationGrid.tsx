import { useCallback, useEffect, useState } from "react";
import type { InvestigationNode } from "../../data/xdrInvestigation";

type Props = {
  nodes: InvestigationNode[];
  selectedId: string | null;
  onSelect: (node: InvestigationNode) => void;
  onRefresh?: () => void;
  onQuickAction?: (node: InvestigationNode, action: "block_sha256" | "allow_sha256" | "isolate_host") => void;
};

export function InvestigationGrid({ nodes, selectedId, onSelect, onRefresh, onQuickAction }: Props) {
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [menu, setMenu] = useState<{ x: number; y: number; node: InvestigationNode } | null>(null);

  useEffect(() => {
    function closeMenu() {
      setMenu(null);
    }
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(1.6, z + 0.1)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.5, z - 0.1)), []);

  function refresh() {
    onRefresh?.();
    setTooltip("Graph refreshed — layout and nodes re-synced from AMP (simulated).");
  }

  return (
    <div className="xdr-grid-wrap">
      <div className="xdr-grid-toolbar" aria-label="Canvas tools">
        <button type="button" title="Fit" onClick={() => setZoom(1)}>
          ⊡
        </button>
        <button type="button" title="Zoom in" onClick={zoomIn}>
          +
        </button>
        <button type="button" title="Zoom out" onClick={zoomOut}>
          −
        </button>
        <button
          type="button"
          className={tool === "pan" ? "xdr-tool-active" : undefined}
          title="Pan (simulated)"
          onClick={() => {
            setTool("pan");
            setTooltip("Pan mode: scroll the canvas to move (simulated).");
          }}
        >
          ✥
        </button>
        <button
          type="button"
          className={tool === "select" ? "xdr-tool-active" : undefined}
          title="Select"
          onClick={() => {
            setTool("select");
            setTooltip("Select mode: click a node to open the drawer.");
          }}
        >
          ➤
        </button>
        <button type="button" title="Refresh" onClick={refresh}>
          ↻
        </button>
      </div>
      {tooltip ? (
        <div className="xdr-grid-toast" role="status">
          {tooltip}
          <button type="button" className="link-btn" onClick={() => setTooltip(null)}>
            ×
          </button>
        </div>
      ) : null}
      {menu ? (
        <div className="xdr-node-menu" style={{ left: menu.x, top: menu.y }}>
          <button type="button" onClick={() => { onSelect(menu.node); setMenu(null); }}>Open details</button>
          <button type="button" onClick={() => { onQuickAction?.(menu.node, "block_sha256"); setMenu(null); }}>
            Quick block SHA
          </button>
          <button type="button" onClick={() => { onQuickAction?.(menu.node, "allow_sha256"); setMenu(null); }}>
            Quick allow SHA
          </button>
          <button type="button" onClick={() => { onQuickAction?.(menu.node, "isolate_host"); setMenu(null); }}>
            Quick isolate host
          </button>
        </div>
      ) : null}
      <div className="xdr-grid-scroll">
        <div className="xdr-grid-inner" style={{ transform: `scale(${zoom})` }}>
          <div className="xdr-grid-selection-hint" aria-hidden>
            <span className="xdr-selection-box" />
          </div>
          <div className="xdr-hex-grid">
            {nodes.map((n, idx) => (
              <button
                key={n.id}
                type="button"
                className={
                  "xdr-hex xdr-hex--" +
                  n.severity +
                  (selectedId === n.id ? " selected" : "") +
                  (idx === 17 ? " focus-demo" : "")
                }
                title={`${n.label} — ${n.shaDisplay} (${n.severity})`}
                onClick={() => onSelect(n)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({ x: e.clientX - 80, y: e.clientY - 110, node: n });
                }}
                aria-label={`${n.label} ${n.shaDisplay}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="xdr-legend">
        <span>
          <i className="xdr-leg malicious" /> Malicious
        </span>
        <span>
          <i className="xdr-leg suspicious" /> Suspicious
        </span>
        <span>
          <i className="xdr-leg common" /> Common
        </span>
        <span>
          <i className="xdr-leg unknown" /> Unknown
        </span>
        <span>
          <i className="xdr-leg clean" /> Clean
        </span>
      </div>
    </div>
  );
}
