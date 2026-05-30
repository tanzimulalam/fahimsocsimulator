import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSentinelData } from "../../context/SentinelDataContext";
import { SENTINEL_CONNECTORS } from "../../data/sentinelData";
import type { SentinelSeverity } from "../../data/sentinelData";

export function SentinelOverviewPage() {
  const { incidents, connectorOverrides } = useSentinelData();

  const stats = useMemo(() => {
    const open = incidents.filter((i) => i.status !== "Closed");
    const bySev: Record<SentinelSeverity, number> = { High: 0, Medium: 0, Low: 0, Informational: 0 };
    const byProduct: Record<string, number> = {};
    open.forEach((i) => {
      bySev[i.severity]++;
      i.productNames.forEach((p) => (byProduct[p] = (byProduct[p] ?? 0) + i.alertCount));
    });
    return { open, bySev, byProduct };
  }, [incidents]);

  const connectors = SENTINEL_CONNECTORS.map((c) => ({ ...c, status: connectorOverrides[c.id] ?? c.status }));
  const connected = connectors.filter((c) => c.status === "Connected").length;
  const totalIngest = connectors.reduce((s, c) => s + (c.status === "Connected" ? c.eventsIngested24h : 0), 0);
  const maxProduct = Math.max(...Object.values(stats.byProduct), 1);

  // 7-day ingestion bars (deterministic teaching data)
  const ingestionTrend = [1.4, 1.6, 1.5, 1.8, 1.7, 2.0, 1.9];
  const maxTrend = Math.max(...ingestionTrend);

  return (
    <div className="def-page">
      <h1>Overview</h1>
      <p className="dash-muted">Microsoft Sentinel workspace dashboard. Tiles link into the relevant blade.</p>

      <div className="def-home-grid" style={{ marginBottom: 12 }}>
        <Link to="/sentinel/incidents" className="def-card"><h3>Open incidents</h3><div className="def-big">{stats.open.length}</div></Link>
        <Link to="/sentinel/incidents?severity=High" className="def-card"><h3>High severity</h3><div className="def-big" style={{ color: "#ff7878" }}>{stats.bySev.High}</div></Link>
        <Link to="/sentinel/data-connectors" className="def-card"><h3>Connectors</h3><div className="def-big">{connected}/{connectors.length}</div></Link>
        <div className="def-card"><h3>Events ingested (24h)</h3><div className="def-big">{(totalIngest / 1_000_000).toFixed(2)}M</div></div>
      </div>

      <div className="def-incident-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel">
          <div className="panel-h">Events ingested per day (7d)</div>
          <div className="def-pivot-bars" style={{ padding: 12 }}>
            {ingestionTrend.map((v, i) => (
              <div key={i} className="def-pivot-row">
                <div className="def-pivot-label">Day {i + 1}</div>
                <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${(v / maxTrend) * 100}%`, background: "#0078d4" }} /></div>
                <div className="def-pivot-count">{v.toFixed(1)}M</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-h">Open incidents by severity</div>
          <div className="def-pivot-bars" style={{ padding: 12 }}>
            {(["High", "Medium", "Low", "Informational"] as SentinelSeverity[]).map((s) => (
              <div key={s} className="def-pivot-row">
                <div className="def-pivot-label">{s}</div>
                <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${(stats.bySev[s] / Math.max(1, stats.open.length)) * 100}%` }} /></div>
                <div className="def-pivot-count">{stats.bySev[s]}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-h">Alerts by product</div>
          <div className="def-pivot-bars" style={{ padding: 12 }}>
            {Object.entries(stats.byProduct).sort((a, b) => b[1] - a[1]).map(([p, n]) => (
              <div key={p} className="def-pivot-row">
                <div className="def-pivot-label">{p}</div>
                <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${(n / maxProduct) * 100}%`, background: "#0078d4" }} /></div>
                <div className="def-pivot-count">{n}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-h">Data connector health</div>
          <div style={{ padding: 12 }}>
            {connectors.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                <span>
                  <span className={"conn-dot " + (c.status === "Disconnected" ? "off" : c.staleData ? "stale" : "ok")} />
                  {c.name}
                </span>
                <span className="dash-muted" style={{ fontSize: 12 }}>{c.status === "Disconnected" ? "Disconnected" : c.staleData ? "No data in last hour" : "Healthy"}</span>
              </div>
            ))}
            <p style={{ marginTop: 8 }}><Link to="/sentinel/data-connectors">Manage connectors →</Link></p>
          </div>
        </section>
      </div>
    </div>
  );
}
