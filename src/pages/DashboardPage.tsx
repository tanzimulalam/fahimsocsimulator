import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConsolePage } from "../components/ConsolePage";
import { Modal } from "../components/Modal";
import { useSimulator } from "../context/SimulatorContext";
import { csvEscape, downloadText } from "../lib/fakeExport";
import { talosReputationUrl, virusTotalIpUrl } from "../lib/threatIntelLinks";

const kpis = [
  {
    id: "managed",
    label: "Managed endpoints",
    value: "2,847",
    delta: "+12 (lab)",
    detail:
      "Synthetic fleet count. Breakdown: Windows 2,201 · macOS 412 · Linux 234. 38 connectors pending reboot after policy push.",
  },
  {
    id: "threats",
    label: "Active threats (24h)",
    value: "38",
    delta: "↓ vs. sim baseline",
    detail:
      "Roll-up of high/critical file and behavioral events not yet triaged in this org view. 11 tied to commodity loaders, 9 to phishing attachments, remainder spread across lab groups.",
  },
  {
    id: "quar",
    label: "Quarantined files",
    value: "156",
    delta: "review queue",
    detail:
      "Items awaiting analyst disposition. Oldest: 6d (policy exception request). Auto-delete after 30d not modeled here.",
  },
  {
    id: "pol",
    label: "Policies deployed",
    value: "42",
    delta: "all groups",
    detail:
      "Last merge window: simulated 02:00 UTC. Drift: 3 hosts on stale policy (see Overview health).",
  },
];

export function DashboardPage() {
  const { addNotification, incidents } = useSimulator();
  const [kpiOpen, setKpiOpen] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState(() => new Date().toISOString());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const exportCsv = useMemo(
    () => () => {
      const rows = [
        ["metric", "value", "notes"],
        ["managed_endpoints", "2847", "lab"],
        ["active_threats_24h", "38", "synthetic"],
        ["open_incidents", String(incidents.filter((i) => i.status !== "resolved").length), "live from simulator"],
      ];
      const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
      downloadText(`dashboard-export-${Date.now()}.csv`, body, "text/csv;charset=utf-8");
      addNotification("Export", "CSV downloaded — data is fictional except incident counts from this session.");
    },
    [addNotification, incidents]
  );

  return (
    <ConsolePage title="Dashboard" subtitle="High-level posture — all numbers are fictional for teaching unless noted.">
      <div className="amp-dashboard-ctl">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setLastSync(new Date().toISOString());
            addNotification("Refresh", "Dashboard metrics refreshed (simulated) — timestamps and sparklines unchanged in this build.");
          }}
        >
          Refresh
        </button>
        <label className="filter-check" style={{ marginBottom: 0 }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => {
              setAutoRefresh(e.target.checked);
              addNotification("Auto refresh", e.target.checked ? "Auto-refresh enabled (simulated)." : "Auto-refresh paused.");
            }}
          />
          Auto-refresh
        </label>
        <button type="button" className="btn btn-primary" onClick={exportCsv}>
          Export summary (CSV)
        </button>
        <span className="dash-muted">Last sync: {lastSync.slice(0, 19).replace("T", " ")} UTC</span>
        <span className="amp-date-chip">30 days</span>
        <span className="amp-date-chip">2026-03-08 18:29</span>
        <span className="amp-date-chip">2026-04-07 19:29</span>
        <Link to="/inbox" className="btn">
          Open Inbox
        </Link>
        <Link to="/xdr/investigate" className="btn">
          XDR Investigate
        </Link>
      </div>

      <div className="dash-kpi-grid">
        {kpis.map((k) => (
          <button
            key={k.id}
            type="button"
            className="dash-kpi dash-kpi-click"
            onClick={() => setKpiOpen(k.id)}
          >
            <div className="dash-kpi-value">{k.value}</div>
            <div className="dash-kpi-label">{k.label}</div>
            <div className="dash-kpi-delta">{k.delta}</div>
            <div className="dash-kpi-hint">Click for detail</div>
          </button>
        ))}
      </div>

      <div className="amp-dashboard-main">
        <div className="panel">
          <div className="panel-h">Compromise trend (7d simulated)</div>
          <div style={{ padding: 16 }}>
            <svg viewBox="0 0 400 120" width="100%" height="120" aria-hidden>
              <polyline
                fill="none"
                stroke="#e2231a"
                strokeWidth="2"
                points="0,100 40,85 80,90 120,70 160,65 200,50 240,55 280,40 320,35 360,30 400,25"
              />
              <polyline
                fill="url(#g)"
                stroke="none"
                points="0,100 40,85 80,90 120,70 160,65 200,50 240,55 280,40 320,35 360,30 400,25 400,120 0,120"
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e2231a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#e2231a" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <p className="dash-muted" style={{ margin: "8px 0 0", fontSize: 11 }}>
              Trend is illustrative. Pair with Inbox volume when teaching “signal vs. noise.”
            </p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h">Top noisy groups (simulated)</div>
          <ul className="dash-list">
            {[
              "Defender ATP Group FacStaff — 42% of alerts",
              "Work from Home Group — 28%",
              "Defender ATP Group LabClass — 15%",
              "IT Support Pool — 10%",
              "Kiosk Fleet — 5%",
            ].map((line) => (
              <li key={line}>
                <button
                  type="button"
                  className="link-btn"
                  style={{ textAlign: "left", padding: 0 }}
                  onClick={() => addNotification("Group drill", `${line} — open Management to map policies.`)}
                >
                  {line}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="panel-h">Secure Malware Analytics</div>
          <ul className="dash-list">
            <li>
              <button type="button" className="link-btn" onClick={() => addNotification("SMA", "Auto submits queued (simulated).")}>
                Automatic analysis submissions
              </button>
            </li>
            <li>
              <button type="button" className="link-btn" onClick={() => addNotification("SMA", "Retrospective verdict sync started (simulated).")}>
                Retroactive threat detections
              </button>
            </li>
          </ul>
        </div>
        <div className="panel">
          <div className="panel-h">Statistics</div>
          <table className="data-table">
            <tbody>
              <tr>
                <td>Total devices</td>
                <td>2,488</td>
              </tr>
              <tr>
                <td>Items scanned</td>
                <td>18,737</td>
              </tr>
              <tr>
                <td>Threats contained</td>
                <td>328</td>
              </tr>
              <tr>
                <td>Policy exceptions</td>
                <td>12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-h">Campaign radar (fake)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Stage</th>
              <th>Hosts</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Qbot dropper → Cobalt Strike</td>
              <td>
                <span className="sev sev-high">Active</span>
              </td>
              <td>14</td>
              <td>
                <button type="button" className="link-btn" onClick={() => addNotification("Playbook", "Runbook SOC-AMP-014 queued (simulated).")}>
                  View playbook
                </button>
              </td>
            </tr>
            <tr>
              <td>ISO → hidden .lnk → PowerShell</td>
              <td>
                <span className="sev sev-medium">Contained</span>
              </td>
              <td>6</td>
              <td>
                <Link to="/analysis">Hunt query</Link>
              </td>
            </tr>
            <tr>
              <td>Browser exploit kit (fake EK)</td>
              <td>
                <span className="sev sev-low">Monitoring</span>
              </td>
              <td>3</td>
              <td>
                <button type="button" className="link-btn" onClick={() => addNotification("TI", "STIX bundle pinned to team channel (simulated).")}>
                  Open intel card
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-h">Quick intel (example IPs)</div>
        <p className="dash-muted" style={{ padding: "0 12px 12px" }}>
          Opens public reputation pages — use in class to compare VT vs. Talos.
        </p>
        <div className="dash-links">
          <a href={virusTotalIpUrl("198.51.100.10")} target="_blank" rel="noreferrer">
            VT: 198.51.100.10
          </a>
          <a href={talosReputationUrl("198.51.100.10")} target="_blank" rel="noreferrer">
            Talos: 198.51.100.10
          </a>
          <button type="button" className="link-btn" onClick={() => addNotification("Bookmark", "IP watchlist updated locally (simulated).")}>
            Add to class watchlist
          </button>
        </div>
      </div>

      <Modal
        open={!!kpiOpen}
        title={kpis.find((k) => k.id === kpiOpen)?.label ?? "Metric"}
        onClose={() => setKpiOpen(null)}
        wide
      >
        {kpiOpen ? (
          <>
            <p style={{ marginTop: 0 }}>
              <strong>Value:</strong> {kpis.find((k) => k.id === kpiOpen)?.value} ·{" "}
              <span className="dash-muted">{kpis.find((k) => k.id === kpiOpen)?.delta}</span>
            </p>
            <p>{kpis.find((k) => k.id === kpiOpen)?.detail}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setKpiOpen(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </ConsolePage>
  );
}
