import { useState } from "react";
import { useSimulator } from "../../context/SimulatorContext";

const SAMPLE_QUERY = `EmailEvents
| where SenderFromDomain == "bad.com"
| join kind=inner IdentityLogonEvents on AccountName
| where DeviceName == "Finance-Server"
| where Timestamp between (EmailEvents.Timestamp .. EmailEvents.Timestamp + 1h)
| project Timestamp, AccountName, DeviceName, SenderFromDomain, ActionType`;

export function DefenderHuntingPage() {
  const { addNotification } = useSimulator();
  const [query, setQuery] = useState(SAMPLE_QUERY);
  const [ran, setRan] = useState(false);

  return (
    <div className="def-page">
      <h1>Advanced Hunting</h1>
      <div className="def-hunt-layout">
        <aside className="panel def-hunt-schema">
          <div className="panel-h">Schema</div>
          <ul className="dash-list">
            <li>DeviceProcessEvents</li>
            <li>DeviceLogonEvents</li>
            <li>DeviceNetworkEvents</li>
            <li>DeviceFileEvents</li>
            <li>EmailEvents</li>
            <li>EmailUrlInfo</li>
            <li>IdentityLogonEvents</li>
            <li>CloudAppEvents</li>
            <li>UrlClickEvents</li>
          </ul>
          <button type="button" className="btn" onClick={() => addNotification("Schema", "Schema reference opened (simulated).")}>
            Schema reference
          </button>
        </aside>

        <section>
          <div className="def-toolbar">
            <button type="button" className="btn btn-primary" onClick={() => {
              setRan(true);
              addNotification("Query executed", "Advanced hunting query executed against simulator dataset.");
            }}>Run query</button>
            <button type="button" className="btn" onClick={() => addNotification("Save query", "Query saved to library (simulated).")}>Save</button>
            <button type="button" className="btn" onClick={() => addNotification("Share", "Share link copied (simulated).")}>Share link</button>
            <button type="button" className="btn" onClick={() => addNotification("Custom detection", "Custom detection rule created from this query (simulated).")}>
              Create custom detection rule
            </button>
          </div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <textarea className="def-query" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </section>
      </div>
      <div className="panel">
        <div className="panel-h">Results {ran ? "(8 items)" : "(run query first)"}</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Account</th>
                <th>Device name</th>
                <th>Sender domain</th>
                <th>Action type</th>
                <th>Workload</th>
              </tr>
            </thead>
            <tbody>
              {(ran ? [
                ["2025-10-24 14:30:00", "bob.jones", "Finance-Server-01", "bad.com", "InteractiveLogonSuccess", "Email + Identity"],
                ["2025-10-24 14:41:00", "bob.jones", "Finance-Server-01", "bad.com", "PowerShellEncodedCommand", "Endpoint"],
                ["2025-10-24 14:45:00", "alice.smith", "DC-Server-01", "bad.com", "ImpossibleTravelAnomaly", "Identity"],
              ] : []).map((r, idx) => (
                <tr key={idx}>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>{r[2]}</td>
                  <td>{r[3]}</td>
                  <td>{r[4]}</td>
                  <td>{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

