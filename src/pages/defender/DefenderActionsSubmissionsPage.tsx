import { useState } from "react";
import { useSimulator } from "../../context/SimulatorContext";

export function DefenderActionsSubmissionsPage() {
  const { addNotification } = useSimulator();
  const [tab, setTab] = useState<"pending" | "history">("pending");

  return (
    <div className="def-page">
      <h1>Actions & submissions</h1>
      <div className="def-tabs">
        <button type="button" className={"xdr-tab" + (tab === "pending" ? " active" : "")} onClick={() => setTab("pending")}>Action center - Pending</button>
        <button type="button" className={"xdr-tab" + (tab === "history" ? " active" : "")} onClick={() => setTab("history")}>Action center - History</button>
      </div>
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">Action center</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Target</th>
                <th>Initiated by</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(tab === "pending"
                ? [
                    ["2026-04-07 19:01", "Delete suspicious file", "HR-LAPTOP-33", "Automated Investigation", "Waiting approval"],
                    ["2026-04-07 18:41", "Isolate device", "WEB-APP-01", "Automated Investigation", "Waiting approval"],
                  ]
                : [
                    ["2026-04-06 13:18", "File quarantined", "SALES-VM-22", "Automation", "Completed"],
                    ["2026-04-06 10:42", "Device isolated by admin", "FIN-EXEC-01", "FahimTanzimul", "Completed"],
                  ]
              ).map((r) => (
                <tr key={r.join("-")}>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>{r[2]}</td>
                  <td>{r[3]}</td>
                  <td>{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">Submissions to Microsoft</div>
        <div className="def-toolbar">
          <button type="button" className="btn btn-primary" onClick={() => addNotification("Submission", "Suspicious file submitted to Microsoft researchers (simulated).")}>
            Submit file
          </button>
          <button type="button" className="btn" onClick={() => addNotification("Submission", "Suspicious URL submitted (simulated).")}>
            Submit URL
          </button>
          <button type="button" className="btn" onClick={() => addNotification("Submission", "Suspicious email submitted (simulated).")}>
            Submit email
          </button>
        </div>
      </div>
    </div>
  );
}

