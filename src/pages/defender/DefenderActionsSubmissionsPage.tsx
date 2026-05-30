import { Link } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { useSimulator } from "../../context/SimulatorContext";

function fmt(ts: number | string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export function DefenderActionsSubmissionsPage() {
  const { pendingActions, approvePendingAction, rejectPendingAction } = useDefenderData();
  const { responseActions } = useSimulator();

  return (
    <div className="def-page">
      <h1>Action center</h1>
      <p className="dash-muted">Pending automated-investigation remediations require approval. History is the shared cross-tool response ledger.</p>

      <section className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">Pending actions <span className="badge-count high">{pendingActions.length}</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Created</th><th>Action</th><th>Entity</th><th>Source</th><th>Incident</th><th></th></tr>
            </thead>
            <tbody>
              {pendingActions.length === 0 ? <tr><td colSpan={6} className="dash-muted">No pending actions.</td></tr> : null}
              {pendingActions.map((a) => (
                <tr key={a.id}>
                  <td>{fmt(a.createdAt)}</td>
                  <td><strong>{a.actionLabel}</strong><div className="dash-muted" style={{ fontSize: 11 }}>{a.description}</div></td>
                  <td>{a.entity}</td>
                  <td>{a.source}</td>
                  <td>{a.incidentId ? <Link to={`/defender/incidents/${encodeURIComponent(a.incidentId)}`}>{a.incidentId}</Link> : "—"}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-primary" onClick={() => approvePendingAction(a.id)}>Approve</button>
                    <button className="btn" onClick={() => rejectPendingAction(a.id)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-h">History (shared response ledger) <span className="badge-count info">{responseActions.length}</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Time</th><th>Action</th><th>Target</th><th>Tool</th><th>Source</th><th>Analyst</th></tr>
            </thead>
            <tbody>
              {responseActions.length === 0 ? <tr><td colSpan={6} className="dash-muted">No actions recorded yet. Execute a response from an incident to populate this.</td></tr> : null}
              {responseActions.map((r) => (
                <tr key={r.id}>
                  <td>{fmt(r.at)}</td>
                  <td>{r.label ?? r.action}</td>
                  <td>{r.target ?? r.nodeLabel}</td>
                  <td>{r.tool ?? "Cisco XDR"}</td>
                  <td>{r.source}</td>
                  <td>{r.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
