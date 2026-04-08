import { Link } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";
import { incidentTitle } from "../../data/defenderSim";

export function DefenderIncidentsPage() {
  const { incidents, addNotification } = useSimulator();
  const open = incidents.filter((i) => i.status !== "resolved");

  return (
    <div className="def-page">
      <h1>Incidents</h1>
      <div className="def-toolbar">
        <label className="filter-check"><input type="checkbox" defaultChecked /> Endpoint</label>
        <label className="filter-check"><input type="checkbox" defaultChecked /> Office 365</label>
        <label className="filter-check"><input type="checkbox" defaultChecked /> Identity</label>
        <label className="filter-check"><input type="checkbox" defaultChecked /> Cloud apps</label>
        <button type="button" className="btn" onClick={() => addNotification("Filters", "Filter pane opened: Severity, Status, Assigned to.")}>Filters</button>
        <button type="button" className="btn" onClick={() => addNotification("Manage incidents", "Bulk ownership and tagging opened (simulated).")}>Manage incidents</button>
        <button type="button" className="btn" onClick={() => addNotification("Export", "Incidents CSV export started (simulated).")}>Export</button>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Incident name</th>
                <th>Incident ID</th>
                <th>Severity</th>
                <th>Tags</th>
                <th>Impact</th>
                <th>Status</th>
                <th>Service source</th>
              </tr>
            </thead>
            <tbody>
              {open.map((i, idx) => (
                <tr key={i.id}>
                  <td><Link to={`/defender/incidents/${encodeURIComponent(i.id)}`}>{idx === 0 ? "Multi-stage attack involved Initial Access via Phishing, Execution on Endpoint, and Lateral Movement to Domain Controller" : incidentTitle(i)}</Link></td>
                  <td>{235600 + idx}</td>
                  <td><span className={"sev " + (idx % 3 === 0 ? "sev-high" : "sev-medium")}>{idx % 3 === 0 ? "High" : "Medium"}</span></td>
                  <td>{idx === 0 ? "Ransomware, Finance-Dept" : "Suspicious behavior"}</td>
                  <td>{idx === 0 ? "Users: bob.jones; Devices: HR-Laptop-01; Mailbox: bob.jones@contoso.com" : "1 device"}</td>
                  <td>{i.status.replace("_", " ")}</td>
                  <td>Defender XDR, Microsoft Sentinel</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

