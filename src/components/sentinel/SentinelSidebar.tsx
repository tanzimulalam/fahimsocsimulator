import { NavLink } from "react-router-dom";

const link = ({ isActive }: { isActive: boolean }) => "def-nav-link" + (isActive ? " active" : "");

export function SentinelSidebar() {
  return (
    <aside className="def-side sen-side">
      <div className="def-side-brand sen-brand">Microsoft Sentinel</div>
      <nav>
        <ul className="def-nav">
          <li><NavLink to="/sentinel/overview" className={link}>Overview</NavLink></li>

          <li className="def-nav-head">Threat management</li>
          <li><NavLink to="/sentinel/incidents" className={link}>Incidents</NavLink></li>
          <li><NavLink to="/sentinel/hunting" className={link}>Hunting</NavLink></li>
          <li><NavLink to="/sentinel/workbooks" className={link}>Workbooks</NavLink></li>

          <li className="def-nav-head">Content management</li>
          <li><NavLink to="/sentinel/analytics" className={link}>Analytics</NavLink></li>
          <li><NavLink to="/sentinel/automation" className={link}>Automation</NavLink></li>

          <li className="def-nav-head">Configuration</li>
          <li><NavLink to="/sentinel/data-connectors" className={link}>Data connectors</NavLink></li>
          <li><NavLink to="/sentinel/logs" className={link}>Logs</NavLink></li>
          <li><NavLink to="/sentinel/watchlists" className={link}>Watchlists</NavLink></li>
          <li><NavLink to="/sentinel/threat-intelligence" className={link}>Threat intelligence</NavLink></li>
          <li><NavLink to="/sentinel/settings" className={link}>Settings</NavLink></li>
        </ul>
      </nav>
    </aside>
  );
}
