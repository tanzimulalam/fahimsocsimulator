import { Link } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";

const kpis = [
  { label: "Team Mean Time To Engage", value: "0 mins", delta: "No change from previous 30 day period" },
  { label: "Team Mean Time To Contain", value: "0 mins", delta: "No change from previous 30 day period" },
  { label: "Team Mean Time To Resolve", value: "4 days 21 hrs 22 mins", delta: "Up 2 days 4 hrs vs previous 30 day period" },
  { label: "% Marked as false positive", value: "20%", delta: "Up 2% from previous 30 day period" },
];

export function XdrControlCenterPage() {
  const { incidents, addNotification } = useSimulator();

  const openIncidents = incidents.filter((i) => i.status !== "resolved");

  return (
    <div className="xdr-cc-page">
      <div className="xdr-cc-head">
        <h1>Dashboards</h1>
        <div className="xdr-cc-head-actions">
          <button type="button" className="btn" onClick={() => addNotification("Timeframe", "Last 30 days selected (simulated).")}>
            Timeframe
          </button>
          <button type="button" className="btn" onClick={() => addNotification("Layout", "Entered full screen mode (simulated).")}>
            Enter full screen mode
          </button>
          <button type="button" className="btn btn-primary" onClick={() => addNotification("Customize", "Widget customization saved (simulated).")}>
            Customize
          </button>
        </div>
      </div>

      <div className="xdr-cc-tabs">
        <button type="button" className="xdr-tab active">Operational Insights</button>
        <button type="button" className="xdr-tab" onClick={() => addNotification("Tab", "UNCP dashboard preset loaded (simulated).")}>UNCP - Copy</button>
        <button type="button" className="xdr-tab" onClick={() => addNotification("Tab", "AMP + SECURE ENDPOINTS preset loaded (simulated).")}>AMP+ SECURE ENDPOINTS + Copy</button>
        <button type="button" className="xdr-tab" onClick={() => addNotification("Tab", "Secure Malware Analytics preset loaded (simulated).")}>Secure Malware Analytics - Copy</button>
      </div>

      <div className="xdr-cc-kpis">
        {kpis.map((k) => (
          <button key={k.label} type="button" className="xdr-cc-kpi" onClick={() => addNotification("KPI", `${k.label}: ${k.value}`)}>
            <div className="xdr-cc-kpi-label">{k.label}</div>
            <div className="xdr-cc-kpi-value">{k.value}</div>
            <div className="xdr-cc-kpi-delta">{k.delta}</div>
          </button>
        ))}
      </div>

      <div className="xdr-cc-grid">
        <section className="panel">
          <div className="panel-h">Incidents by priority</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Name</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {openIncidents.slice(0, 4).map((inc, idx) => (
                  <tr key={inc.id}>
                    <td><span className="sev sev-high">{idx % 2 === 0 ? "870" : "670"}</span></td>
                    <td>
                      <Link to={`/xdr/incidents?incident=${encodeURIComponent(inc.id)}`}>
                        New Remote Access on {inc.host.internalIp}
                      </Link>
                    </td>
                    <td>{inc.events[0]?.timestampUtc ?? "—"}</td>
                    <td>{inc.status.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-h">MITRE ATT&CK incidents</div>
          <div className="xdr-bar-chart">
            {["Recon", "Initial", "Persist", "Defense", "Discovery", "Collection", "Exfil", "Impact"].map((n, i) => (
              <button
                key={n}
                type="button"
                className="xdr-bar-btn"
                style={{ height: `${40 + (i % 4) * 14}px` }}
                onClick={() => addNotification("MITRE", `${n}: click into Incidents to review mapped behaviors.`)}
                title={n}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-h">Incident status by assignment</div>
          <div className="xdr-h-bars">
            {["new", "assigned", "in progress", "closed"].map((n, i) => (
              <button
                key={n}
                type="button"
                className="xdr-hbar-row"
                onClick={() => addNotification("Assignment", `${n} filter applied (simulated).`)}
              >
                <span>{n}</span>
                <span className="xdr-hbar"><i style={{ width: `${25 + i * 18}%` }} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-h">Unassigned incidents</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Name</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {openIncidents.slice(0, 3).map((inc, idx) => (
                  <tr key={inc.id}>
                    <td><span className="sev sev-low">{[200, 150, 60][idx] ?? 120}</span></td>
                    <td>
                      <Link to={`/xdr/incidents?incident=${encodeURIComponent(inc.id)}`}>
                        Exploit blocked on {inc.host.hostname.split(".")[0]}
                      </Link>
                    </td>
                    <td>{inc.events[0]?.timestampUtc ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

