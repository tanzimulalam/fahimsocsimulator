import { useState } from "react";
import { sparklineSeries, treemapGroups, treemapTabs } from "../data/mockData";
import { useSimulator } from "../context/SimulatorContext";
import { TreemapTabDiagram } from "./GroupTreemapDiagrams";

const TAB_BLURB: string[] = [
  "Student-heavy subnets: compare alert volume vs. headcount (simulated).",
  "Malicious activity lens: prioritize by technique, not only count.",
  "AMP Everywhere: cross-environment visibility (cloud + endpoint metaphor).",
  "ADOBE GROUP: third-party app risk island for vendor discussions.",
];

export function TreemapWidget() {
  const { addNotification } = useSimulator();
  const [tab, setTab] = useState(0);
  const total = treemapGroups.reduce((s, g) => s + g.weight, 0);

  return (
    <div className="panel">
      <div className="panel-h">
        <span>Top</span>
        <div className="tab-strip" role="tablist" aria-label="Group scope">
          {treemapTabs.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={i === tab}
              className={"tab-pill" + (i === tab ? " on" : "")}
              onClick={() => {
                setTab(i);
                addNotification("Group scope", `View: ${label} — ${TAB_BLURB[i]}`);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="treemap-diagram-slot">
        <TreemapTabDiagram tabIndex={tab} />
        <p className="treemap-diagram-caption">{TAB_BLURB[tab]}</p>
      </div>
      <div className="treemap-body">
        <div className="treemap-flex" aria-label="Groups by relative volume">
          {treemapGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              className="treemap-cell"
              style={{
                flex: `${g.weight} 1 ${(g.weight / total) * 100}%`,
                minWidth: "28%",
                minHeight: 72,
                background:
                  g.weight > 30
                    ? "linear-gradient(145deg, #b91c1c, #7f1d1d)"
                    : g.weight > 15
                      ? "linear-gradient(145deg, #dc2626, #991b1b)"
                      : "linear-gradient(145deg, #9a3412, #7c2d12)",
              }}
              title={g.label}
              onClick={() =>
                addNotification("Group volume", `${g.label}: discuss policy, blast radius, and ownership.`)
              }
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <Sparkline series={sparklineSeries} />
    </div>
  );
}

function Sparkline({ series }: { series: number[] }) {
  const { addNotification } = useSimulator();
  const max = Math.max(...series);
  const w = 600;
  const h = 48;
  const pad = 2;
  const barW = (w - pad * 2) / series.length - 1;

  return (
    <div className="sparkline-wrap">
      <svg
        className="sparkline-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {series.map((v, i) => {
          const bh = (v / max) * (h - 6);
          const x = pad + i * (barW + 1);
          const y = h - bh;
          const hot = v > max * 0.65;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={bh}
              fill={hot ? "#e2231a" : "#484f58"}
              rx={1}
              style={{ cursor: "pointer" }}
              onClick={() =>
                addNotification(
                  "Activity slot",
                  `Hour bucket ${i + 1}: relative volume ${v} (${hot ? "spike — discuss triage" : "baseline noise"}).`
                )
              }
            />
          );
        })}
      </svg>
    </div>
  );
}
