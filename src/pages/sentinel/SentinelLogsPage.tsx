import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSentinelData } from "../../context/SentinelDataContext";
import { useSimulator } from "../../context/SimulatorContext";
import { runKql, type KqlResult } from "../../lib/kql";
import { SENTINEL_LOG_SCHEMA, SENTINEL_LOG_TABLES, SENTINEL_SAMPLE_QUERIES } from "../../data/sentinelData";

export function SentinelLogsPage() {
  const { addBookmark } = useSentinelData();
  const { addNotification } = useSimulator();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? SENTINEL_SAMPLE_QUERIES[0].query);
  const [result, setResult] = useState<KqlResult | null>(null);

  useEffect(() => {
    const q = params.get("q");
    if (q) {
      setQuery(q);
      setResult(runKql(q, SENTINEL_LOG_TABLES));
    }
  }, [params]);

  const run = () => setResult(runKql(query, SENTINEL_LOG_TABLES));

  const table = result?.tableName ?? query.split("\n")[0]?.trim() ?? "";

  return (
    <div className="def-page">
      <h1>Logs</h1>
      <p className="dash-muted">Run KQL against the Sentinel workspace. Same engine as Defender Advanced hunting.</p>

      <div className="def-hunt-layout">
        <aside className="panel def-hunt-schema">
          <div className="panel-h">Schema & sample queries</div>
          <div style={{ padding: 10, maxHeight: 520, overflow: "auto" }}>
            <h4 style={{ margin: "0 0 6px" }}>Sample queries</h4>
            {SENTINEL_SAMPLE_QUERIES.map((q) => (
              <button key={q.id} className="link-btn" style={{ display: "block", textAlign: "left", marginBottom: 6 }} onClick={() => { setQuery(q.query); setResult(null); }} title={q.description}>
                {q.name}
              </button>
            ))}
            <h4 style={{ margin: "12px 0 6px" }}>Tables</h4>
            {SENTINEL_LOG_SCHEMA.map((t) => (
              <details key={t.name} style={{ marginBottom: 4 }}>
                <summary style={{ cursor: "pointer", fontSize: 12 }}>{t.name}</summary>
                <div className="dash-muted" style={{ fontSize: 11, paddingLeft: 8 }}>{t.columns.map((c) => c.name).join(", ")}</div>
              </details>
            ))}
          </div>
        </aside>

        <div>
          <textarea className="def-query" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="def-toolbar" style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={run}>Run</button>
            <button className="btn" onClick={() => addBookmark({ query, table, note: "Bookmarked from Logs" })}>Bookmark result</button>
            <button className="btn" onClick={() => addNotification("New analytic rule", "Query staged as a new scheduled analytic rule (simulated). Configure it in Analytics.")}>New analytic rule from query</button>
          </div>

          {result ? (
            <div className="panel" style={{ marginTop: 10 }}>
              <div className="panel-h">Results <span className="dash-muted" style={{ fontWeight: 400 }}>{result.error ? "error" : `${result.rows.length} rows · ${result.rowsScanned} scanned`}</span></div>
              {result.error ? (
                <p style={{ padding: 12, color: "#ff7b72" }}>{result.error}</p>
              ) : (
                <div className="table-wrap" style={{ maxHeight: 360 }}>
                  <table className="data-table">
                    <thead><tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {result.rows.length === 0 ? <tr><td colSpan={Math.max(1, result.columns.length)} className="dash-muted">No rows matched.</td></tr> : null}
                      {result.rows.slice(0, 200).map((row, i) => (
                        <tr key={i}>{result.columns.map((c) => <td key={c} style={{ wordBreak: "break-all" }}>{String(row[c] ?? "")}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
