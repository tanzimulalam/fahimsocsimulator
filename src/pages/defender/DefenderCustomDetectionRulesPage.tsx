import { useSimulator } from "../../context/SimulatorContext";

export function DefenderCustomDetectionRulesPage() {
  const { addNotification } = useSimulator();
  return (
    <div className="def-page">
      <h1>Custom detection rules</h1>
      <div className="def-toolbar">
        <button type="button" className="btn btn-primary" onClick={() => addNotification("Rule", "New custom detection rule wizard opened.")}>
          Create rule
        </button>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule name</th>
                <th>Query source</th>
                <th>Frequency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Encoded PowerShell from Office</td><td>Advanced hunting query</td><td>Every 10 minutes</td><td>Enabled</td></tr>
              <tr><td>Rare unsigned binary from temp</td><td>Advanced hunting query</td><td>Every hour</td><td>Enabled</td></tr>
              <tr><td>Suspicious VPN impossible travel</td><td>Identity events query</td><td>Every 30 minutes</td><td>Disabled</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

