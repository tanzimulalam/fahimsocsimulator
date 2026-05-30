import { useSearchParams, Link } from "react-router-dom";
import { useSentinelData } from "../../context/SentinelDataContext";
import { useLabState } from "../../lib/useLabState";
import type { CustomDetectionRule } from "../../context/DefenderDataContext";
import { senSevClass, fmtTs } from "./sentinelShared";

export function SentinelAnalyticsPage() {
  const { rules, toggleRule, runRule } = useSentinelData();
  const [params, setParams] = useSearchParams();
  const focus = params.get("rule");
  // Rules pushed from Defender Advanced Hunting (cross-tool flow) share this key.
  const [defenderRules] = useLabState<CustomDetectionRule[]>("defender-custom-detections-v1", []);
  const pushed = defenderRules.filter((r) => r.pushedToSentinel);

  const setFocus = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("rule", id);
    else next.delete("rule");
    setParams(next, { replace: true });
  };

  const focused = rules.find((r) => r.id === focus);

  return (
    <div className="def-page">
      <h1>Analytics</h1>
      <p className="dash-muted">Analytic rules generate Sentinel incidents. Toggle enable/disable and run on demand.</p>

      {focused ? (
        <section className="panel" style={{ marginBottom: 12 }}>
          <div className="panel-h">{focused.name} <button className="btn" style={{ float: "right" }} onClick={() => setFocus(null)}>Close</button></div>
          <div className="def-kv">
            <p>{focused.description}</p>
            <p><strong>Type:</strong> {focused.ruleType} · <strong>Frequency:</strong> {focused.frequency} · <strong>Severity:</strong> <span className={senSevClass(focused.severity)}>{focused.severity}</span></p>
            <p><strong>Tactics:</strong> {focused.tactics.join(", ")} · <strong>Techniques:</strong> {focused.techniques.join(", ")}</p>
            <p><strong>Incidents created:</strong> {focused.incidentsCreated}</p>
            <pre className="def-query" style={{ whiteSpace: "pre-wrap" }}>{focused.kql}</pre>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={() => runRule(focused.id)}>Run now</button>
              <button className="btn" onClick={() => toggleRule(focused.id)}>{focused.enabled ? "Disable" : "Enable"}</button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">Rules <span className="badge-count info">{rules.length}</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Severity</th><th>Tactics</th><th>Incidents</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td><button className="link-btn" onClick={() => setFocus(r.id)}>{r.name}</button></td>
                  <td>{r.ruleType}</td>
                  <td><span className={senSevClass(r.severity)}>{r.severity}</span></td>
                  <td><span className="dash-muted" style={{ fontSize: 11 }}>{r.tactics.join(", ")}</span></td>
                  <td><span className="badge-count info">{r.incidentsCreated}</span></td>
                  <td>{r.enabled ? <span className="def-status-chip remediated">Enabled</span> : <span className="def-status-chip">Disabled</span>}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn" onClick={() => runRule(r.id)}>Run now</button>
                    <button className="btn" onClick={() => toggleRule(r.id)}>{r.enabled ? "Disable" : "Enable"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">Rules created from Defender hunting <span className="badge-count info">{pushed.length}</span></div>
        <div style={{ padding: 12 }}>
          {pushed.length === 0 ? (
            <p className="dash-muted">None yet. In <Link to="/defender/hunting">Defender Advanced hunting</Link>, create a custom detection and choose "Push to Sentinel" to see it appear here.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Rule ID</th><th>Name</th><th>Severity</th><th>KQL</th><th>Created</th></tr></thead>
                <tbody>
                  {pushed.map((r) => (
                    <tr key={r.id}>
                      <td>{r.sentinelRuleId}</td>
                      <td>{r.name}</td>
                      <td><span className={senSevClass(r.severity)}>{r.severity}</span></td>
                      <td><code style={{ fontSize: 11 }}>{r.query.slice(0, 60)}…</code></td>
                      <td>{fmtTs(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
