import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLabState } from "../../lib/useLabState";
import {
  CLOUD_APPS_KEY,
  DISCOVERED_APPS,
  initialCloudAppsState,
  type CloudAppsState,
} from "../../data/defenderCloudApps";

function riskClass(score: number): string {
  if (score <= 3) return "sev sev-high";
  if (score <= 6) return "sev sev-medium";
  return "sev sev-low";
}

export function DefenderCloudDiscoveryPage() {
  const [state, setState] = useLabState<CloudAppsState>(CLOUD_APPS_KEY, initialCloudAppsState);

  const setStatus = (id: string, status: "sanctioned" | "unsanctioned") =>
    setState((prev) => ({ ...prev, status: { ...prev.status, [id]: status } }));

  const distribution = useMemo(() => {
    const cats = new Map<string, number>();
    DISCOVERED_APPS.forEach((a) => cats.set(a.category, (cats.get(a.category) ?? 0) + 1));
    return [...cats.entries()].map(([cat, count]) => ({ cat, count }));
  }, []);
  const maxCat = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="def-page">
      <h1>Cloud discovery</h1>
      <p className="dash-muted">Shadow-IT discovery (Defender for Cloud Apps). Lower risk score = riskier app. Mark apps sanctioned/unsanctioned.</p>

      <div className="def-incident-grid" style={{ gridTemplateColumns: "1fr 2fr", marginBottom: 12 }}>
        <section className="panel">
          <div className="panel-h">Apps by category</div>
          <div className="def-pivot-bars" style={{ padding: 12 }}>
            {distribution.map((d) => (
              <div key={d.cat} className="def-pivot-row">
                <div className="def-pivot-label">{d.cat}</div>
                <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${(d.count / maxCat) * 100}%` }} /></div>
                <div className="def-pivot-count">{d.count}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-h">Posture</div>
          <div className="def-kv">
            <p><strong>Discovered apps:</strong> {DISCOVERED_APPS.length}</p>
            <p><strong>Sanctioned:</strong> {Object.values(state.status).filter((s) => s === "sanctioned").length}</p>
            <p><strong>Unsanctioned:</strong> {Object.values(state.status).filter((s) => s === "unsanctioned").length}</p>
            <p><Link to="/defender/cloud-apps/policies">Create app-control policy →</Link></p>
          </div>
        </section>
      </div>

      <div className="panel">
        <div className="panel-h">Discovered apps</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>App</th><th>Category</th><th>Risk score</th><th>Users</th><th>Traffic (MB)</th><th>Compliance</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {DISCOVERED_APPS.map((a) => {
                const st = state.status[a.id];
                return (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.category}</td>
                    <td><span className={riskClass(a.riskScore)}>{a.riskScore}/10</span></td>
                    <td>{a.users}</td>
                    <td>{a.trafficMb.toLocaleString()}</td>
                    <td>{a.compliance}</td>
                    <td>
                      {st === "sanctioned" ? <span className="def-status-chip remediated">Sanctioned</span> : null}
                      {st === "unsanctioned" ? <span className="def-status-chip pending-actions">Unsanctioned</span> : null}
                      {!st ? <span className="dash-muted">—</span> : null}
                    </td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn" onClick={() => setStatus(a.id, "sanctioned")}>Sanction</button>
                      <button className="btn" onClick={() => setStatus(a.id, "unsanctioned")}>Unsanction</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
