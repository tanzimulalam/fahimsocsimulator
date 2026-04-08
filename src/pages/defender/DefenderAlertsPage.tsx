import { Link } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";
import { buildAlerts } from "../../data/defenderSim";

export function DefenderAlertsPage() {
  const { incidents, addNotification } = useSimulator();
  const rows = incidents.flatMap((i) =>
    buildAlerts(i).map((a) => ({
      ...a,
      incidentId: i.id,
      source: i.events[0]?.eventType.includes("PowerShell") ? "EDR Behavioral" : "Antivirus / EDR",
    }))
  );

  return (
    <div className="def-page">
      <h1>Alerts</h1>
      <div className="def-toolbar">
        <button type="button" className="btn" onClick={() => addNotification("Alert filter", "High + Medium + Low selected.")}>
          Severity: High, Medium, Low
        </button>
        <button type="button" className="btn" onClick={() => addNotification("Detection source", "Antivirus + EDR + SmartScreen selected.")}>
          Detection source
        </button>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Alert</th>
                <th>Severity</th>
                <th>Detection source</th>
                <th>Linked incident</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 18).map((r) => (
                <tr key={r.id}>
                  <td>{r.timeUtc}</td>
                  <td>{r.title}</td>
                  <td><span className={"sev " + (r.severity === "high" ? "sev-high" : r.severity === "medium" ? "sev-medium" : "sev-low")}>{r.severity}</span></td>
                  <td>{r.source}</td>
                  <td>
                    <Link to={`/defender/incidents/${encodeURIComponent(r.incidentId)}`}>Open incident</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

