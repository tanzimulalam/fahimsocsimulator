import { useState } from "react";
import { Link } from "react-router-dom";
import { ConsolePage } from "../components/ConsolePage";
import { Modal } from "../components/Modal";
import { useSimulator } from "../context/SimulatorContext";

const HUNT_QUERY = `process_cmdline:/-(enc|e)\\s+[A-Za-z0-9+\\/=]{20,}/`;

const BAR_LABELS = ["W1", "W2", "W3", "W4", "W5"];

export function AnalysisPage() {
  const { addNotification } = useSimulator();
  const [savedOpen, setSavedOpen] = useState(false);
  const [barIdx, setBarIdx] = useState<number | null>(null);

  async function copyQuery() {
    try {
      await navigator.clipboard.writeText(HUNT_QUERY);
      addNotification("Copied", "Hunt query copied — paste into your EDR / SIEM story.");
    } catch {
      addNotification("Copy", "Clipboard unavailable.");
    }
  }

  return (
    <ConsolePage title="Analysis" subtitle="Retrospective hunts & file reputation — simulated workflows.">
      <div className="console-toolbar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            addNotification("Hunt run", "Query executed — 12 hosts matched in last 30d (fake).");
          }}
        >
          Run hunt
        </button>
        <button type="button" className="btn" onClick={copyQuery}>
          Copy query
        </button>
        <button type="button" className="btn" onClick={() => setSavedOpen(true)}>
          Saved hunts
        </button>
        <Link to="/events" className="btn">
          Open Events
        </Link>
      </div>

      <div className="analysis-grid">
        <div className="panel">
          <div className="panel-h">Hunt: encoded PowerShell (example)</div>
          <p className="dash-muted" style={{ padding: "0 12px" }}>
            Saved query returns hosts where command line matches <code>-enc</code> or <code>-e</code> (training).
          </p>
          <pre className="analysis-pre">{HUNT_QUERY}</pre>
          <div style={{ padding: "0 12px 12px" }} className="dash-links">
            <button type="button" className="link-btn" onClick={() => addNotification("MITRE", "Mapped to T1059.001 — discuss detection gaps.")}>
              Map to MITRE
            </button>
            <button type="button" className="link-btn" onClick={() => addNotification("Schedule", "Weekly report scheduled (simulated).")}>
              Schedule report
            </button>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h">Prevalence (fake) — click a bar</div>
          <svg viewBox="0 0 200 100" width="100%" height="100" aria-hidden={true}>
            {[10, 40, 70, 100, 130].map((x, i) => {
              const heights = [30, 45, 60, 40, 35];
              const h = heights[i];
              const y = 60 - h * 0.5;
              const colors = ["#484f58", "#f0883e", "#e2231a", "#484f58", "#f0883e"];
              return (
                <rect
                  key={x}
                  x={x}
                  y={y}
                  width="20"
                  height={h * 0.5}
                  fill={colors[i]}
                  opacity={0.85}
                  style={{ cursor: "pointer" }}
                  onClick={() => setBarIdx(i)}
                />
              );
            })}
          </svg>
          <p className="dash-muted" style={{ padding: 12 }}>
            Bars = hosts seen with same SHA-256 over 30d (illustrative). Selected:{" "}
            {barIdx !== null ? BAR_LABELS[barIdx] : "none"}.
          </p>
        </div>
      </div>

      <Modal open={savedOpen} title="Saved hunts (simulated)" onClose={() => setSavedOpen(false)} wide>
        <ul className="dash-list">
          <li>
            <strong>ENC-PSH-01</strong> — encoded PowerShell (this page)
          </li>
          <li>
            <strong>RUNDLL-SIDELOAD</strong> — suspicious DLL loads from Temp
          </li>
          <li>
            <strong>ISO-MOUNT-7D</strong> — users mounting ISO then executing
          </li>
        </ul>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => setSavedOpen(false)}>
            Close
          </button>
        </div>
      </Modal>

      <Modal open={barIdx !== null} title="Prevalence slice" onClose={() => setBarIdx(null)}>
        {barIdx !== null ? (
          <>
            <p>
              Week <strong>{BAR_LABELS[barIdx]}</strong>: synthetic host count spike. Compare with change control
              windows and phishing campaigns.
            </p>
            <p className="dash-muted">In production you would pivot to hash prevalence APIs and tenant telemetry.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setBarIdx(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </ConsolePage>
  );
}
