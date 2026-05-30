import { Link } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { sevClass } from "./DefenderIncidentsPage";
import { runKql } from "../../lib/kql";
import { DEFENDER_HUNTING_TABLES } from "../../data/defenderHuntingTables";

function fmt(iso?: string) {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function DefenderCustomDetectionRulesPage() {
  const { customDetections, toggleCustomDetection, runCustomDetection, pushDetectionToSentinel } = useDefenderData();

  const run = (id: string, query: string) => {
    const res = runKql(query, DEFENDER_HUNTING_TABLES);
    runCustomDetection(id, res.error ? 0 : res.rows.length);
  };

  return (
    <div className="def-page">
      <h1>Custom detection rules</h1>
      <p className="dash-muted">Rules created from Advanced hunting. Toggle enable/disable, run on demand, and push to Microsoft Sentinel.</p>

      {customDetections.length === 0 ? (
        <div className="panel" style={{ padding: 16 }}>
          <p className="dash-muted">No custom detections yet. Create one from <Link to="/defender/hunting">Advanced hunting</Link>.</p>
        </div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Severity</th><th>Status</th><th>Frequency</th><th>Last run</th><th>Matches</th><th>Sentinel</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {customDetections.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong><div className="dash-muted" style={{ fontSize: 11 }}>{r.createdFrom} · {fmt(r.createdAt)}</div></td>
                    <td><span className={sevClass(r.severity)}>{r.severity}</span></td>
                    <td>{r.enabled ? <span className="def-status-chip remediated">Enabled</span> : <span className="def-status-chip">Disabled</span>}</td>
                    <td>{r.frequency}</td>
                    <td>{fmt(r.lastRun)}</td>
                    <td><span className={"badge-count " + ((r.matches ?? 0) > 0 ? "high" : "info")}>{r.matches ?? 0}</span></td>
                    <td>{r.pushedToSentinel ? <Link to={`/sentinel/analytics?rule=${encodeURIComponent(r.sentinelRuleId ?? "")}`}>{r.sentinelRuleId} →</Link> : "—"}</td>
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="btn" onClick={() => run(r.id, r.query)}>Run now</button>
                      <button className="btn" onClick={() => toggleCustomDetection(r.id)}>{r.enabled ? "Disable" : "Enable"}</button>
                      {!r.pushedToSentinel ? <button className="btn" onClick={() => pushDetectionToSentinel(r.id)}>Push to Sentinel</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
