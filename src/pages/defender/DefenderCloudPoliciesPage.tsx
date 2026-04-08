import { useSimulator } from "../../context/SimulatorContext";

export function DefenderCloudPoliciesPage() {
  const { addNotification } = useSimulator();
  return (
    <div className="def-page">
      <h1>Cloud app policies</h1>
      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Policy name</th><th>Severity</th><th>Logic</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr>
                <td>Mass download by a single user</td>
                <td><span className="sev sev-high">High</span></td>
                <td>Alert if user downloads &gt; 100 files in 5 minutes from SharePoint.</td>
                <td>Enabled</td>
                <td><button type="button" className="link-btn" onClick={() => addNotification("Policy", "Policy tuned to 80 files / 5 min.")}>Tune</button></td>
              </tr>
              <tr>
                <td>Anonymous file sharing spike</td>
                <td><span className="sev sev-medium">Medium</span></td>
                <td>Alert on sudden increase in external sharing links.</td>
                <td>Enabled</td>
                <td><button type="button" className="link-btn" onClick={() => addNotification("Policy", "Policy details opened.")}>Open</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

