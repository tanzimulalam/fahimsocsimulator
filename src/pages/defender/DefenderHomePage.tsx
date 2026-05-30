import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDefenderData } from "../../context/DefenderDataContext";
import { sevClass } from "./DefenderIncidentsPage";
import { compareDefenderIncidents } from "../../data/defenderIncidents";

export function DefenderHomePage() {
  const { incidents, pendingActions } = useDefenderData();

  const stats = useMemo(() => {
    const active = incidents.filter((i) => i.status === "Active").length;
    const high = incidents.filter((i) => i.severity === "High").length;
    const totalAlerts = incidents.reduce((sum, i) => sum + i.alerts.length, 0);
    const riskyDevices = new Set<string>();
    const riskyUsers = new Set<string>();
    incidents.forEach((i) => {
      i.devices.forEach((d) => d.riskLevel === "High" && riskyDevices.add(d.name));
      i.users.forEach((u) => u.riskLevel === "High" && riskyUsers.add(u.upn));
    });
    return { active, high, totalAlerts, riskyDevices: riskyDevices.size, riskyUsers: riskyUsers.size };
  }, [incidents]);

  // Secure / exposure scores derived deterministically from posture.
  const secureScore = Math.max(40, 78 - stats.high * 3);
  const exposureScore = Math.min(70, 18 + stats.high * 4);

  const recent = useMemo(() => incidents.slice().sort(compareDefenderIncidents).slice(0, 6), [incidents]);

  return (
    <div className="def-page">
      <h1>Home</h1>
      <p className="dash-muted">Microsoft Defender XDR — unified security posture (simulated, live from the incident catalog)</p>

      <div className="def-home-grid">
        <Link to="/defender/incidents?status=Active" className="def-card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>Active incidents</h3>
          <div className="def-big">{stats.active}</div>
          <span className="def-status-chip pending-actions">Needs attention →</span>
        </Link>
        <Link to="/defender/incidents?sev=High" className="def-card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>High severity</h3>
          <div className="def-big">{stats.high}</div>
          <span className="def-status-chip">View high incidents →</span>
        </Link>
        <Link to="/defender/alerts" className="def-card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>Total alerts</h3>
          <div className="def-big">{stats.totalAlerts}</div>
          <span className="def-status-chip">Open alerts queue →</span>
        </Link>
        <Link to="/defender/actions-submissions" className="def-card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>Pending actions</h3>
          <div className="def-big">{pendingActions.length}</div>
          <span className="def-status-chip in-progress">Action center →</span>
        </Link>
        <div className="def-card">
          <h3>Microsoft Secure Score</h3>
          <div className="def-big">{secureScore}%</div>
          <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${secureScore}%` }} /></div>
        </div>
        <div className="def-card">
          <h3>Device exposure score</h3>
          <div className="def-big">{exposureScore}/100</div>
          <div className="def-pivot-bar-track"><div className="def-pivot-bar-fill" style={{ width: `${exposureScore}%`, background: "linear-gradient(90deg,#f59f00,#f03e3e)" }} /></div>
        </div>
        <Link to="/defender/assets" className="def-card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>At-risk devices</h3>
          <div className="def-big">{stats.riskyDevices}</div>
          <span className="def-status-chip">Device inventory →</span>
        </Link>
        <Link to="/defender/identities/users" className="def-card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>At-risk users</h3>
          <div className="def-big">{stats.riskyUsers}</div>
          <span className="def-status-chip">Identities →</span>
        </Link>
      </div>

      <section className="panel" style={{ marginTop: 12 }}>
        <div className="panel-h">Most recent incidents <Link to="/defender/incidents">See all →</Link></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Incident</th><th>ID</th><th>Severity</th><th>Status</th><th>Workloads</th></tr></thead>
            <tbody>
              {recent.map((i) => (
                <tr key={i.id}>
                  <td><Link to={`/defender/incidents/${encodeURIComponent(i.id)}`}>{i.title}</Link></td>
                  <td>{i.displayId}</td>
                  <td><span className={sevClass(i.severity)}>{i.severity}</span></td>
                  <td>{i.status}</td>
                  <td>{i.workloads.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
