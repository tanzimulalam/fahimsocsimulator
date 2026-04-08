import { useSimulator } from "../../context/SimulatorContext";

export function DefenderReportsPage() {
  const { addNotification } = useSimulator();
  return (
    <div className="def-page">
      <h1>Reports</h1>
      <div className="panel">
        <div className="panel-h">Security trend reports</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Report</th><th>Format</th><th>Date range</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr><td>Incident trends by severity</td><td>PDF</td><td>Last 30 days</td><td><button type="button" className="link-btn" onClick={() => addNotification("Report", "PDF report downloaded (simulated).")}>Download</button></td></tr>
              <tr><td>Device exposure summary</td><td>Excel</td><td>Last 30 days</td><td><button type="button" className="link-btn" onClick={() => addNotification("Report", "Excel report downloaded (simulated).")}>Download</button></td></tr>
              <tr><td>Email threat overview</td><td>Excel</td><td>Last 7 days</td><td><button type="button" className="link-btn" onClick={() => addNotification("Report", "Excel report downloaded (simulated).")}>Download</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

