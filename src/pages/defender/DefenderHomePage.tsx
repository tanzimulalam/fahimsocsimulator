import { Link } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";

export function DefenderHomePage() {
  const { incidents, addNotification } = useSimulator();
  const open = incidents.filter((i) => i.status !== "resolved").length;
  return (
    <div className="def-page">
      <h1>Home</h1>
      <div className="def-home-grid">
        <section className="def-card">
          <h3>Secure score</h3>
          <p className="def-big">65%</p>
          <button type="button" className="btn" onClick={() => addNotification("Secure score", "Score details opened (simulated).")}>View details</button>
        </section>
        <section className="def-card">
          <h3>Exposure score</h3>
          <p className="def-big">Medium</p>
          <p>27 devices need patching this week.</p>
          <button type="button" className="btn" onClick={() => addNotification("Exposure", "Exposure details opened (simulated).")}>Open recommendations</button>
        </section>
        <section className="def-card">
          <h3>Active incidents</h3>
          <p className="def-big">{open}</p>
          <Link to="/defender/incidents" className="btn btn-primary">Open incidents queue</Link>
        </section>
        <section className="def-card">
          <h3>Top security recommendations</h3>
          <ul className="dash-list">
            <li>Update Windows 11 22H2 baseline on 11 devices</li>
            <li>Enable tamper protection on 4 endpoints</li>
            <li>Patch Acrobat Reader CVE-2023-2109</li>
          </ul>
        </section>
        <section className="def-card">
          <h3>At-risk devices</h3>
          <p>USA-NYC-LPT-004, CEO-Laptop, Finance-Server-01</p>
          <Link to="/defender/assets" className="btn">Open assets</Link>
        </section>
        <section className="def-card">
          <h3>Users at risk</h3>
          <p className="def-big">1 user</p>
          <button type="button" className="btn" onClick={() => addNotification("Users at risk", "User risk panel opened (simulated).")}>View users</button>
        </section>
      </div>
    </div>
  );
}

