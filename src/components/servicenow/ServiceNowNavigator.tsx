import { useState } from "react";
import { NavLink } from "react-router-dom";

export function ServiceNowNavigator() {
  const [doitExpanded, setDoitExpanded] = useState(true);
  const [socExpanded, setSocExpanded] = useState(true);
  const [filter, setFilter] = useState("");

  return (
    <nav className="sn-sidebar">
      <div className="sn-sidebar-header">Filter Navigator</div>
      <div className="sn-filter-box">
        <input 
          type="text" 
          className="sn-filter-input" 
          placeholder="Filter navigator" 
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>
      
      <div className="sn-nav-scroll" style={{ overflowY: "auto", flex: 1 }}>
        <div className="sn-nav-group">
          <div className="sn-nav-group-title" onClick={() => setDoitExpanded(!doitExpanded)}>
            <span>{doitExpanded ? "▼" : "▶"}</span> DOIT Bravetech
          </div>
          {doitExpanded && (
            <div className="sn-nav-items">
              <NavLink to="/servicenow/incidents" className={({isActive}) => `sn-nav-item ${isActive ? "active" : ""}`}>
                Bravetech Tickets
              </NavLink>
              <NavLink to="/servicenow/service-desk" className="sn-nav-item">
                Service Desk
              </NavLink>
              <NavLink to="/servicenow/incidents?assignedTo=me" className="sn-nav-item">
                Incidents Assigned to Me
              </NavLink>
              <NavLink to="/servicenow/itss" className="sn-nav-item">
                ITSS Tickets
              </NavLink>
            </div>
          )}
        </div>

        <div className="sn-nav-group">
          <div className="sn-nav-group-title" onClick={() => setSocExpanded(!socExpanded)}>
            <span>{socExpanded ? "▼" : "▶"}</span> Security Operations Center
          </div>
          {socExpanded && (
            <div className="sn-nav-items">
              <NavLink to="/servicenow/incidents?assignedTo=me&group=soc" className="sn-nav-item">
                Incidents Assigned to Me
              </NavLink>
              <NavLink to="/servicenow/incidents" className="sn-nav-item">
                SOC Incidents
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
