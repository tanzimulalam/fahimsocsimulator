import { useMemo } from "react";
import { useDefenderData } from "../../context/DefenderDataContext";
import { useSimulator } from "../../context/SimulatorContext";
import type { DefenderSeverity } from "../../data/defenderIncidents";

export function DefenderReportsPage() {
  const { incidents } = useDefenderData();
  const { responseActions } = useSimulator();

  const data = useMemo(() => {
    const bySev: Record<DefenderSeverity, number> = { High: 0, Medium: 0, Low: 0, Informational: 0 };
    const byWorkload: Record<string, number> = {};
    const techCount: Record<string, number> = {};
    let resolved = 0;
    incidents.forEach((i) => {
      bySev[i.severity]++;
      if (i.status === "Resolved") resolved++;
      i.workloads.forEach((w) => (byWorkload[w] = (byWorkload[w] ?? 0) + 1));
      i.techniques.forEach((t) => (techCount[t] = (techCount[t] ?? 0) + 1));
    });
    const topTech = Object.entries(techCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { bySev, byWorkload, topTech, resolved, total: incidents.length };
  }, [incidents]);

  const maxTech = Math.max(...data.topTech.map((t) => t[1]), 1);
  const maxWorkload = Math.max(...Object.values(data.byWorkload), 1);

  return (
    <div className="def-page">
      <h1>Reports</h1>
      <p className="dash-muted">Live summary computed from current incident, alert, and response state.</p>

      <div className="def-home-grid" style={{ marginBottom: 12 }}>
        <div className="def-card"><h3>Total incidents</h3><div className="def-big">{data.total}</div></div>
        <div className="def-card"><h3>Resolved</h3><div className="def-big">{data.resolved}</div></div>
        <div className="def-card"><h3>Response actions taken</h3><div className="def-big">{responseActions.length}</div></div>
        <div className="def-card"><h3>Mean time to respond</h3><div className="def-big">42m</div><span className="dash-muted" style={{ fontSize: 11 }}>MTTR placeholder</span></div>
      </div>

      <div className="def-incident-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <section className="panel">
          <div className="panel-h">Incidents by severity</div>
          <div className="def-pivot-bars" style={{ padding: 12 }}>
            {(["High", "Medium", "Low", "Informational"] as DefenderSeverity[]).map((s) => (
              <div key={s} className="def-pivot-row">
                <div className="def-pivot-label">{s}</div>
                <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${(data.bySev[s] / Math.max(1, data.total)) * 100}%` }} /></div>
                <div className="def-pivot-count">{data.bySev[s]}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-h">Incidents by workload</div>
          <div className="def-pivot-bars" style={{ padding: 12 }}>
            {Object.entries(data.byWorkload).map(([w, n]) => (
              <div key={w} className="def-pivot-row">
                <div className="def-pivot-label">{w}</div>
                <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${(n / maxWorkload) * 100}%` }} /></div>
                <div className="def-pivot-count">{n}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-h">Top MITRE techniques</div>
          <div className="def-pivot-bars" style={{ padding: 12 }}>
            {data.topTech.map(([t, n]) => (
              <div key={t} className="def-pivot-row">
                <div className="def-pivot-label">{t}</div>
                <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${(n / maxTech) * 100}%` }} /></div>
                <div className="def-pivot-count">{n}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
