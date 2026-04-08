import { useSimulator } from "../../context/SimulatorContext";

export function DefenderThreatIntelPage() {
  const { addNotification } = useSimulator();
  return (
    <div className="def-page">
      <h1>Threat intelligence</h1>
      <div className="def-home-grid">
        <section className="def-card">
          <h3>Analyst report</h3>
          <p><strong>Storm-2062 attempts to exploit CVE-2023-22515 in Atlassian</strong></p>
          <p className="dash-muted">Detailed TTP mapping, targeting summary, and observed infrastructure.</p>
          <button type="button" className="btn" onClick={() => addNotification("Threat analytics", "Analyst report opened (simulated).")}>Open report</button>
        </section>
        <section className="def-card">
          <h3>Mitigation checklist</h3>
          <ul className="dash-list">
            <li>Patch Atlassian Confluence → <span className="sev sev-medium">Pending</span></li>
            <li>Block IOC IPs/domains in indicators → <span className="sev sev-low">Done</span></li>
            <li>Enable EDR in block mode on servers → <span className="sev sev-medium">Pending</span></li>
          </ul>
        </section>
        <section className="def-card">
          <h3>Featured article</h3>
          <p>WS FTP server critical vulnerabilities</p>
          <button type="button" className="btn" onClick={() => addNotification("Threat article", "Threat article opened in intel explorer (simulated).")}>Open in intel explorer</button>
        </section>
        <section className="def-card">
          <h3>Tenant exposure vs campaign</h3>
          <p className="def-big">3 vulnerable devices</p>
          <button type="button" className="btn btn-primary" onClick={() => addNotification("Exposure", "Jumped to vulnerable devices list.")}>View impacted assets</button>
        </section>
      </div>
    </div>
  );
}

