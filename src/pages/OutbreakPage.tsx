import { useState } from "react";
import { Link } from "react-router-dom";
import { ConsolePage } from "../components/ConsolePage";
import { Modal } from "../components/Modal";
import { useSimulator } from "../context/SimulatorContext";
import { downloadText } from "../lib/fakeExport";

const RULES = [
  {
    id: "OR-2024-AMP-01",
    title: "SHA-256 blocklist (lab IOC set A)",
    detail: "42 hashes; last editor FahimTanzimul; auto-expire 2026-12-31 (simulated).",
  },
  {
    id: "OR-2024-AMP-02",
    title: "Suspicious parent → child (Excel → PowerShell)",
    detail: "Parent process tree depth ≤ 2; alert on signed binaries spawning unsigned PowerShell.",
  },
  {
    id: "OR-2024-AMP-03",
    title: "DMZ webshell watchlist",
    detail: "Correlates with IIS paths + POST anomalies; opens XDR incident on 3+ signals.",
  },
];

export function OutbreakPage() {
  const { addNotification } = useSimulator();
  const [rule, setRule] = useState<(typeof RULES)[0] | null>(null);
  const [containOpen, setContainOpen] = useState(false);

  function downloadIoc() {
    const body = RULES.map((r) => `${r.id}\t${r.title}\t${r.detail}`).join("\n");
    downloadText(`ioc-package-${Date.now()}.txt`, "id\ttitle\tdetail\n" + body, "text/plain;charset=utf-8");
    addNotification("IOC", "IOC package downloaded — teaching content only.");
  }

  return (
    <ConsolePage title="Outbreak Control" subtitle="Containment & IOC packages — buttons are non-destructive demos.">
      <div className="console-toolbar">
        <button type="button" className="btn btn-primary" onClick={downloadIoc}>
          Download IOC package (TXT)
        </button>
        <Link to="/xdr/investigate" className="btn">
          XDR Investigate
        </Link>
      </div>

      <div className="outbreak-grid">
        <div className="panel">
          <div className="panel-h">Active outbreak rules — click a rule</div>
          <ul className="dash-list">
            {RULES.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="link-btn"
                  style={{ textAlign: "left", padding: 0 }}
                  onClick={() => setRule(r)}
                >
                  <strong>{r.id}</strong> — {r.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="panel-h">Isolation (simulated)</div>
          <p className="dash-muted" style={{ padding: "0 12px" }}>
            In production, isolation limits lateral movement. Here, you confirm intent and we show a toast only.
          </p>
          <div style={{ padding: 12 }}>
            <button type="button" className="btn btn-primary" onClick={() => setContainOpen(true)}>
              Apply network containment…
            </button>
          </div>
        </div>
      </div>

      <Modal open={!!rule} title={rule?.id ?? "Rule"} onClose={() => setRule(null)} wide>
        {rule ? (
          <>
            <p>
              <strong>{rule.title}</strong>
            </p>
            <p>{rule.detail}</p>
            <div className="dash-links">
              <button type="button" className="link-btn" onClick={() => addNotification("Edit", "Rule editor would open (simulated).")}>
                Edit rule
              </button>
              <button type="button" className="link-btn" onClick={() => addNotification("Version", "Revision v3 published (simulated).")}>
                View revision history
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setRule(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>

      <Modal open={containOpen} title="Confirm containment" onClose={() => setContainOpen(false)}>
        <p>
          This will <strong>simulate</strong> blocking all outbound traffic except AMP cloud and your jump box for
          affected hosts. No real network changes occur.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              addNotification("Containment", "Network containment applied to selected scope (simulated). SOC war-room mode: enabled.");
              setContainOpen(false);
            }}
          >
            Confirm containment
          </button>
          <button type="button" className="btn" onClick={() => setContainOpen(false)}>
            Cancel
          </button>
        </div>
      </Modal>
    </ConsolePage>
  );
}
