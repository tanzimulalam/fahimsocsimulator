import { useState } from "react";
import { Link } from "react-router-dom";
import { ConsolePage } from "../components/ConsolePage";
import { Modal } from "../components/Modal";
import { useSimulator } from "../context/SimulatorContext";

const HEALTH = [
  {
    id: "def",
    label: "Definition freshness",
    status: "OK",
    sev: "low" as const,
    blurb: "All connectors reported TETRA defs ≤ 4h old except 3 VDI snapshots (frozen for class).",
    fix: "Force policy refresh on stale hosts; reboot pending on pool VDIs.",
  },
  {
    id: "hb",
    label: "Connector heartbeat",
    status: "99.2%",
    sev: "low" as const,
    blurb: "Synthetic uptime. Worst segment: DMZ web tier during maintenance window.",
    fix: "No action — within SLO for lab narrative.",
  },
  {
    id: "drift",
    label: "Policy drift",
    status: "3 hosts",
    sev: "medium" as const,
    blurb: "Hosts on policy revision N-2 after failed merge (simulated). Risk: missing exploit prevention rule.",
    fix: "Open Management → reconcile group membership; run connector repair on listed GUIDs.",
  },
];

export function OverviewPage() {
  const { addNotification } = useSimulator();
  const [healthId, setHealthId] = useState<string | null>(null);
  const [zone, setZone] = useState<string | null>(null);

  return (
    <ConsolePage title="Overview" subtitle="Org topology snapshot — diagram is illustrative only.">
      <div className="console-toolbar">
        <button type="button" className="btn" onClick={() => addNotification("Topology", "Layout export saved to Downloads (simulated).")}>
          Export diagram (PNG)
        </button>
        <Link to="/management" className="btn btn-primary">
          Jump to Management
        </Link>
      </div>

      <div className="overview-layout">
        <div className="panel">
          <div className="panel-h">Logical deployment — click a zone</div>
          <div style={{ padding: 16 }}>
            <svg viewBox="0 0 420 200" width="100%" height="200" aria-hidden>
              <rect
                x="20"
                y="20"
                width="120"
                height="50"
                rx="6"
                fill="#1f6feb"
                opacity="0.25"
                stroke="#388bfd"
                className="overview-zone"
                style={{ cursor: "pointer" }}
                onClick={() => setZone("Identity (Azure AD)")}
              />
              <text x="38" y="50" fill="#e6edf3" fontSize="12" pointerEvents="none">
                Identity (Azure AD)
              </text>
              <rect
                x="180"
                y="20"
                width="120"
                height="50"
                rx="6"
                fill="#238636"
                opacity="0.25"
                stroke="#3fb950"
                className="overview-zone"
                style={{ cursor: "pointer" }}
                onClick={() => setZone("Connectors")}
              />
              <text x="200" y="50" fill="#e6edf3" fontSize="12" pointerEvents="none">
                Connectors
              </text>
              <rect
                x="340"
                y="20"
                width="60"
                height="50"
                rx="6"
                fill="#8957e5"
                opacity="0.25"
                stroke="#a371f7"
                className="overview-zone"
                style={{ cursor: "pointer" }}
                onClick={() => setZone("SIEM / SOAR")}
              />
              <text x="348" y="50" fill="#e6edf3" fontSize="11" pointerEvents="none">
                SIEM
              </text>
              <line x1="80" y1="70" x2="80" y2="100" stroke="#484f58" />
              <line x1="240" y1="70" x2="240" y2="100" stroke="#484f58" />
              <line x1="370" y1="70" x2="370" y2="100" stroke="#484f58" />
              <rect
                x="40"
                y="100"
                width="340"
                height="70"
                rx="6"
                fill="#21262d"
                stroke="#30363d"
                style={{ cursor: "pointer" }}
                onClick={() => setZone("Endpoints (fleet)")}
              />
              <text x="120" y="140" fill="#8b949e" fontSize="11" pointerEvents="none">
                Endpoints (Win / Mac / Linux) — policies & groups from Management
              </text>
            </svg>
            <p className="dash-muted" style={{ margin: "8px 0 0", fontSize: 11 }}>
              Click boxes for a fake narrative. Telemetry flows: endpoint → cloud → optional SIEM (simplified).
            </p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h">Health checks — click a row</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Check</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {HEALTH.map((h) => (
                <tr
                  key={h.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setHealthId(h.id)}
                >
                  <td>{h.label}</td>
                  <td>
                    <span className={"sev sev-" + h.sev}>{h.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!healthId} title="Health detail" onClose={() => setHealthId(null)} wide>
        {healthId ? (
          <>
            <h3 style={{ marginTop: 0 }}>{HEALTH.find((h) => h.id === healthId)?.label}</h3>
            <p>{HEALTH.find((h) => h.id === healthId)?.blurb}</p>
            <p>
              <strong>Remediation (simulated):</strong> {HEALTH.find((h) => h.id === healthId)?.fix}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setHealthId(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>

      <Modal open={!!zone} title="Zone detail" onClose={() => setZone(null)} wide>
        {zone ? (
          <>
            <p>
              <strong>{zone}</strong> — narrative for SOC class. No live API calls.
            </p>
            {zone.includes("Identity") ? (
              <p>Conditional access + device compliance gates enrollment before AMP policy applies.</p>
            ) : null}
            {zone.includes("Connector") ? (
              <p>Connector handles policy, telemetry upload, and quarantine orchestration (simplified).</p>
            ) : null}
            {zone.includes("SIEM") ? (
              <p>Forwarded alerts include incident id, host, and observables — correlate with XDR cases.</p>
            ) : null}
            {zone.includes("Endpoints") ? (
              <p>
                Mix of domain-joined and WFH assets. Use <Link to="/inbox">Inbox</Link> for triage exercises.
              </p>
            ) : null}
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setZone(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </ConsolePage>
  );
}
