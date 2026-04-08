import { NavLink } from "react-router-dom";

export function DefenderSidebar() {
  return (
    <aside className="def-side">
      <div className="def-side-brand">Microsoft Defender</div>
      <nav>
        <ul className="def-nav">
          <li><NavLink to="/defender/home" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Home</NavLink></li>

          <li className="def-nav-head">Incidents & alerts</li>
          <li><NavLink to="/defender/incidents" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Incidents</NavLink></li>
          <li><NavLink to="/defender/alerts" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Alerts</NavLink></li>

          <li className="def-nav-head">Email & collaboration</li>
          <li><NavLink to="/defender/email-collab/explorer" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Explorer</NavLink></li>
          <li><NavLink to="/defender/email-collab/attack-simulation-training" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Attack simulation training</NavLink></li>

          <li className="def-nav-head">Cloud apps</li>
          <li><NavLink to="/defender/cloud-apps/discovery" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Cloud discovery</NavLink></li>
          <li><NavLink to="/defender/cloud-apps/policies" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Policies</NavLink></li>

          <li className="def-nav-head">Hunting</li>
          <li><NavLink to="/defender/hunting" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Advanced hunting</NavLink></li>
          <li><NavLink to="/defender/hunting/custom-detection-rules" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Custom detection rules</NavLink></li>

          <li className="def-nav-head">Actions & submissions</li>
          <li><NavLink to="/defender/actions-submissions" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Action center / submissions</NavLink></li>

          <li className="def-nav-head">Threat intelligence</li>
          <li><NavLink to="/defender/threat-intelligence" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Threat analytics</NavLink></li>

          <li className="def-nav-head">Assets</li>
          <li><NavLink to="/defender/assets" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Devices</NavLink></li>
          <li><NavLink to="/defender/identities/users" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Identities / Users</NavLink></li>

          <li className="def-nav-head">Vulnerability management</li>
          <li><NavLink to="/defender/vulnerability-management" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Dashboard / recommendations</NavLink></li>

          <li className="def-nav-head">Reports</li>
          <li><NavLink to="/defender/reports" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Reports</NavLink></li>

          <li className="def-nav-head">Settings</li>
          <li><NavLink to="/defender/settings/endpoints" className={({ isActive }) => "def-nav-link" + (isActive ? " active" : "")}>Endpoints</NavLink></li>
        </ul>
      </nav>
    </aside>
  );
}

