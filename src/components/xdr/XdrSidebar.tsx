import { Link, NavLink } from "react-router-dom";
import { countByStatus, useSimulator } from "../../context/SimulatorContext";

export function XdrSidebar() {
  const { incidents, addNotification } = useSimulator();

  return (
    <>
      <aside className="xdr-sidebar">
        <div className="xdr-sidebar-brand">
          <span className="xdr-logo-mark" aria-hidden />
          <div className="xdr-sidebar-title">
            Cisco <strong>XDR</strong>
            <span>Simulator (training)</span>
          </div>
        </div>
        <nav className="xdr-nav" aria-label="XDR">
          <ul>
            <li>
              <NavLink to="/xdr/control-center" className={({ isActive }) => "xdr-nav-link" + (isActive ? " active" : "")}>
                Control Center
              </NavLink>
            </li>
            <li>
              <NavLink to="/xdr/incidents" className={({ isActive }) => "xdr-nav-link" + (isActive ? " active" : "")}>
                Incidents
                <span className="xdr-nav-badge" title="From AMP sim">
                  {countByStatus(incidents, "requires_attention") + countByStatus(incidents, "in_progress")}
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/xdr/investigate" className={({ isActive }) => "xdr-nav-link" + (isActive ? " active" : "")}>
                Investigate
              </NavLink>
            </li>
            <li>
              <button type="button" className="xdr-nav-link" onClick={() => addNotification("Intelligence", "Threat intel workspace coming soon.")}>
                Intelligence
              </button>
            </li>
            <li>
              <button type="button" className="xdr-nav-link" onClick={() => addNotification("Automate", "Workflow automation studio coming soon.")}>
                Automate <span className="nav-chevron">▸</span>
              </button>
            </li>
            <li>
              <button type="button" className="xdr-nav-link" onClick={() => addNotification("Assets", "Unified asset inventory coming soon.")}>
                Assets <span className="nav-chevron">▸</span>
              </button>
            </li>
            <li>
              <button type="button" className="xdr-nav-link" onClick={() => addNotification("Administration", "Admin settings are simulated in this build.")}>
                Administration <span className="nav-chevron">▸</span>
              </button>
            </li>
          </ul>
        </nav>
        <div className="xdr-sidebar-foot">
          <Link to="/inbox" className="xdr-foot-badge" title="Back to Secure Endpoint">
            AMP
          </Link>
        </div>
      </aside>
    </>
  );
}
