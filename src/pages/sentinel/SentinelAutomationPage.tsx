import { useState } from "react";
import { useSentinelData } from "../../context/SentinelDataContext";
import { SENTINEL_PLAYBOOKS, type Playbook } from "../../data/sentinelData";
import { Modal } from "../../components/Modal";
import { fmtTs } from "./sentinelShared";

export function SentinelAutomationPage() {
  const { playbookRuns, runPlaybook } = useSentinelData();
  const [runFor, setRunFor] = useState<Playbook | null>(null);
  const [target, setTarget] = useState("");

  return (
    <div className="def-page">
      <h1>Automation</h1>
      <p className="dash-muted">Logic-App-style playbooks (SOAR). Running a playbook logs a simulated execution to the shared response ledger.</p>

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">Playbooks</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Playbook</th><th>Trigger</th><th>Steps</th><th></th></tr></thead>
            <tbody>
              {SENTINEL_PLAYBOOKS.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong><div className="dash-muted" style={{ fontSize: 11 }}>{p.description}</div></td>
                  <td>{p.trigger}</td>
                  <td><span className="dash-muted" style={{ fontSize: 11 }}>{p.steps.join(" → ")}</span></td>
                  <td><button className="btn btn-primary" onClick={() => { setRunFor(p); setTarget(""); }}>Run playbook</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">Run history <span className="badge-count info">{playbookRuns.length}</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Playbook</th><th>Target</th><th>Incident</th><th>Run by</th><th>Time</th></tr></thead>
            <tbody>
              {playbookRuns.length === 0 ? <tr><td colSpan={5} className="dash-muted">No playbook runs yet.</td></tr> : null}
              {playbookRuns.map((r) => (
                <tr key={r.id}>
                  <td>{r.playbookName}</td>
                  <td>{r.target}</td>
                  <td>{r.incidentId ?? "—"}</td>
                  <td>{r.authorInitials}</td>
                  <td>{fmtTs(r.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!runFor} title={runFor ? `Run "${runFor.name}"` : ""} onClose={() => setRunFor(null)}>
        {runFor ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p className="dash-muted" style={{ fontSize: 12 }}>{runFor.description}</p>
            <ol style={{ fontSize: 13, paddingLeft: 18 }}>{runFor.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <label style={{ fontSize: 12 }}>Target entity
              <input className="def-search-inline" style={{ width: "100%" }} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 203.0.113.47 or elena.fisher@contoso.com" />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setRunFor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { runPlaybook(runFor.id, runFor.name, target.trim() || "(no target)"); setRunFor(null); }}>Run</button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
