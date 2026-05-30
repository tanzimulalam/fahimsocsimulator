import { useMemo, useState } from "react";
import { useSentinelData } from "../../context/SentinelDataContext";
import { runKql, type KqlResult } from "../../lib/kql";
import { SENTINEL_LOG_TABLES, SENTINEL_SAMPLE_QUERIES } from "../../data/sentinelData";
import { fmtTs } from "./sentinelShared";

export function SentinelHuntingPage() {
  const { addBookmark, bookmarks } = useSentinelData();
  const [active, setActive] = useState<string | null>(null);
  const [result, setResult] = useState<KqlResult | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof SENTINEL_SAMPLE_QUERIES>();
    SENTINEL_SAMPLE_QUERIES.forEach((q) => {
      const arr = map.get(q.tactic) ?? [];
      arr.push(q);
      map.set(q.tactic, arr);
    });
    return [...map.entries()];
  }, []);

  const run = (id: string, query: string) => {
    setActive(id);
    setResult(runKql(query, SENTINEL_LOG_TABLES));
  };

  const activeQuery = SENTINEL_SAMPLE_QUERIES.find((q) => q.id === active);

  return (
    <div className="def-page">
      <h1>Hunting</h1>
      <p className="dash-muted">Proactive hunting queries grouped by MITRE tactic. Run a query, then bookmark interesting results.</p>

      <div className="def-incident-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel">
          <div className="panel-h">Hunting queries</div>
          <div style={{ padding: 12 }}>
            {grouped.map(([tactic, queries]) => (
              <div key={tactic} style={{ marginBottom: 12 }}>
                <h4 style={{ margin: "0 0 6px", color: "#9ed6ff" }}>{tactic}</h4>
                {queries.map((q) => (
                  <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                    <span title={q.description}>{q.name}</span>
                    <button className="btn" onClick={() => run(q.id, q.query)}>Run</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-h">Results {activeQuery ? <span className="dash-muted" style={{ fontWeight: 400 }}>· {activeQuery.name}</span> : null}</div>
          <div style={{ padding: 12 }}>
            {!result ? (
              <p className="dash-muted">Run a hunting query to see results.</p>
            ) : result.error ? (
              <p style={{ color: "#ff7b72" }}>{result.error}</p>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="dash-muted">{result.rows.length} rows</span>
                  <button className="btn" onClick={() => activeQuery && addBookmark({ query: activeQuery.query, table: result.tableName ?? "", note: activeQuery.name })}>Bookmark result</button>
                </div>
                <div className="table-wrap" style={{ maxHeight: 300 }}>
                  <table className="data-table">
                    <thead><tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {result.rows.slice(0, 100).map((row, i) => (
                        <tr key={i}>{result.columns.map((c) => <td key={c} style={{ wordBreak: "break-all" }}>{String(row[c] ?? "")}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <div className="panel-h">Bookmarks <span className="badge-count info">{bookmarks.length}</span></div>
        <div style={{ padding: 12 }}>
          {bookmarks.length === 0 ? <p className="dash-muted">No bookmarks yet.</p> : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Note</th><th>Table</th><th>Query</th><th>Created</th></tr></thead>
                <tbody>
                  {bookmarks.map((b) => (
                    <tr key={b.id}>
                      <td>{b.note}</td>
                      <td>{b.table}</td>
                      <td><code style={{ fontSize: 11 }}>{b.query.replace(/\n/g, " ").slice(0, 50)}…</code></td>
                      <td>{fmtTs(b.createdAt)}</td>
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
