import { useState } from "react";
import { Link } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { Modal } from "../../components/Modal";
import { runKql, type KqlResult } from "../../lib/kql";
import {
  DEFENDER_HUNTING_SCHEMA,
  DEFENDER_HUNTING_TABLES,
  DEFENDER_SAMPLE_QUERIES,
} from "../../data/defenderHuntingTables";
import type { DefenderSeverity } from "../../data/defenderIncidents";

export function DefenderHuntingPage() {
  const { addCustomDetection, pushDetectionToSentinel } = useDefenderData();
  const [query, setQuery] = useState(DEFENDER_SAMPLE_QUERIES[1].query);
  const [result, setResult] = useState<KqlResult | null>(null);
  const [ruleModal, setRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleSeverity, setRuleSeverity] = useState<DefenderSeverity>("Medium");
  const [alsoSentinel, setAlsoSentinel] = useState(true);

  const run = () => setResult(runKql(query, DEFENDER_HUNTING_TABLES));

  const createRule = () => {
    const res = result ?? runKql(query, DEFENDER_HUNTING_TABLES);
    const rule = addCustomDetection({
      name: ruleName.trim() || "Untitled detection",
      description: "Created from Advanced hunting query.",
      query,
      severity: ruleSeverity,
      createdFrom: "Advanced hunting",
      frequency: "Every hour",
      matches: res.rows.length,
      lastRun: new Date().toISOString(),
    });
    if (alsoSentinel) pushDetectionToSentinel(rule.id);
    setRuleModal(false);
    setRuleName("");
  };

  return (
    <div className="def-page">
      <h1>Advanced hunting</h1>
      <p className="dash-muted">Query Defender telemetry with KQL (teaching subset). Shares one engine with Microsoft Sentinel Logs.</p>

      <div className="def-hunt-layout">
        <aside className="panel def-hunt-schema">
          <div className="panel-h">Schema & sample queries</div>
          <div style={{ padding: 10, maxHeight: 520, overflow: "auto" }}>
            <h4 style={{ margin: "0 0 6px" }}>Saved queries</h4>
            {DEFENDER_SAMPLE_QUERIES.map((q) => (
              <button key={q.id} className="link-btn" style={{ display: "block", textAlign: "left", marginBottom: 6 }} onClick={() => { setQuery(q.query); setResult(null); }} title={q.description}>
                {q.name}
              </button>
            ))}
            <h4 style={{ margin: "12px 0 6px" }}>Tables</h4>
            {DEFENDER_HUNTING_SCHEMA.map((t) => (
              <details key={t.name} style={{ marginBottom: 4 }}>
                <summary style={{ cursor: "pointer", fontSize: 12 }}>{t.name}</summary>
                <div className="dash-muted" style={{ fontSize: 11, paddingLeft: 8 }}>
                  {t.columns.map((c) => c.name).join(", ")}
                </div>
              </details>
            ))}
          </div>
        </aside>

        <div>
          <textarea className="def-query" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="def-toolbar" style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={run}>Run query</button>
            <button className="btn" onClick={() => setRuleModal(true)}>Create custom detection rule</button>
            <Link className="btn" to="/defender/hunting/custom-detection-rules">View detection rules →</Link>
          </div>

          {result ? (
            <div className="panel" style={{ marginTop: 10 }}>
              <div className="panel-h">
                Results
                <span className="dash-muted" style={{ fontWeight: 400 }}>
                  {result.error ? "error" : `${result.rows.length} rows · ${result.rowsScanned} scanned`}
                </span>
              </div>
              {result.error ? (
                <p style={{ padding: 12, color: "#ff7b72" }}>{result.error}</p>
              ) : (
                <div className="table-wrap" style={{ maxHeight: 360 }}>
                  <table className="data-table">
                    <thead>
                      <tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.rows.length === 0 ? <tr><td colSpan={Math.max(1, result.columns.length)} className="dash-muted">No rows matched.</td></tr> : null}
                      {result.rows.slice(0, 200).map((row, i) => (
                        <tr key={i}>
                          {result.columns.map((c) => <td key={c} style={{ wordBreak: "break-all" }}>{String(row[c] ?? "")}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <Modal open={ruleModal} title="Create custom detection rule" onClose={() => setRuleModal(false)}>
        <p className="dash-muted" style={{ fontSize: 12 }}>This saves the current query as a scheduled custom detection (persisted) and optionally creates a matching Microsoft Sentinel analytic rule.</p>
        <label style={{ display: "block", fontSize: 12, marginBottom: 8 }}>Rule name
          <input className="def-search-inline" style={{ width: "100%" }} value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="e.g. RDP brute force > 20 failures" />
        </label>
        <label style={{ display: "block", fontSize: 12, marginBottom: 8 }}>Severity
          <select className="def-search-inline" style={{ width: "100%" }} value={ruleSeverity} onChange={(e) => setRuleSeverity(e.target.value as DefenderSeverity)}>
            {["High", "Medium", "Low", "Informational"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="filter-check"><input type="checkbox" checked={alsoSentinel} onChange={(e) => setAlsoSentinel(e.target.checked)} /> Also create matching Sentinel analytic rule</label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn" onClick={() => setRuleModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={createRule}>Create rule</button>
        </div>
      </Modal>
    </div>
  );
}
