import { useSimulator } from "../../context/SimulatorContext";

export function DefenderInvestigationsPage() {
  const { addNotification } = useSimulator();
  return (
    <div className="def-page">
      <h1>Investigations</h1>
      <div className="def-toolbar">
        <button type="button" className="btn" onClick={() => addNotification("Export", "Investigation list exported (simulated).")}>Export</button>
        <button type="button" className="btn" onClick={() => addNotification("Refresh", "Investigation list refreshed.")}>Refresh</button>
        <input className="def-search-inline" placeholder="Search" />
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Investigation</th>
                <th>Users</th>
                <th>Creation Time</th>
                <th>Threat score</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["bf74…", "Pending action", "Clicked on variant changed ts.msi", "sonia@env", "Oct 13, 2023", "18"],
                ["c9a4…", "Remediated", "Mal url malicious urls is zipped", "jeff@sec", "Oct 12, 2023", "14"],
                ["1ef0…", "Partially remediated", "Clicked on verdict changed t.exe", "sonia@env", "Oct 12, 2023", "19"],
              ].map((r) => (
                <tr key={r[0]}>
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

