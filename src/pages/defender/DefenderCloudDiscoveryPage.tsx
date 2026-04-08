import { useSimulator } from "../../context/SimulatorContext";

export function DefenderCloudDiscoveryPage() {
  const { addNotification } = useSimulator();
  return (
    <div className="def-page">
      <h1>Cloud discovery</h1>
      <div className="def-home-grid">
        <section className="def-card">
          <h3>Discovered apps</h3>
          <p className="def-big">1,204</p>
        </section>
        <section className="def-card">
          <h3>Risk distribution</h3>
          <p>Low risk: 728 · Medium risk: 309 · High risk: 167</p>
        </section>
      </div>
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>App name</th><th>Risk score</th><th>Traffic</th><th>Users</th><th>Action</th></tr></thead>
            <tbody>
              <tr>
                <td>Dropbox</td><td>10</td><td>500 GB</td><td>45</td>
                <td><button type="button" className="link-btn" onClick={() => addNotification("Cloud app", "Dropbox sanctioned.")}>Sanction</button></td>
              </tr>
              <tr>
                <td>PDF-Converter-Free-Tool.com</td><td>2</td><td>10 MB</td><td>4</td>
                <td><button type="button" className="link-btn" onClick={() => addNotification("Cloud app", "App unsanctioned and blocked at firewall (simulated).")}>Unsanction</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

