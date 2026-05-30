import { useState } from "react";
import { NavLink } from "react-router-dom";

export function ServiceNowNavigator() {
  const [doitExpanded, setDoitExpanded] = useState(true);
  const [socExpanded, setSocExpanded] = useState(true);
  const [filter, setFilter] = useState("");

  return (
    <nav className="sn-sidebar">
      <div className="sn-sidebar-header">
        <span style={{ fontSize: 18 }}>🏛</span> 
        <span style={{ flex: 1, letterSpacing: 0.5 }}>UNC<br/><span style={{fontSize: 9, fontWeight: 'normal'}}>PEMBROKE</span></span>
        <span style={{ fontSize: 12 }}>Favorites</span>
      </div>
      <div className="sn-filter-box">
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 8, top: 5, fontSize: 12, color: "#ccc" }}>Y</span>
          <input 
            type="text" 
            className="sn-filter-input" 
            placeholder="Filter" 
            style={{ paddingLeft: 24 }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>
      
      <div className="sn-nav-scroll" style={{ overflowY: "auto", flex: 1 }}>
        <div className="sn-nav-group">
          <div className="sn-nav-group-title" onClick={() => setDoitExpanded(!doitExpanded)}>
            <span style={{fontSize: 10}}>{doitExpanded ? "▼" : "▶"}</span> DOIT Bravetech
          </div>
          {doitExpanded && (
            <div className="sn-nav-items">
              <NavLink to="/servicenow/incidents" className={({isActive}) => `sn-nav-item ${isActive ? "active" : ""}`}>
                <span style={{ color: "#ef4444" }}>⭐</span> Bravetech Tickets
              </NavLink>
              <NavLink to="/servicenow/service-desk" className="sn-nav-item">
                <span style={{ color: "#3b82f6" }}>⭐</span> Service Desk
              </NavLink>
              <NavLink to="/servicenow/incidents?assignedTo=me" className="sn-nav-item">
                <span style={{ color: "#ef4444" }}>⭐</span> Incidents Assigned to Me
              </NavLink>
              <NavLink to="/servicenow/itss" className="sn-nav-item">
                <span style={{ color: "#eab308" }}>⭐</span> ITSS Tickets
              </NavLink>
            </div>
          )}
        </div>

        <div className="sn-nav-group">
          <div className="sn-nav-group-title" onClick={() => setSocExpanded(!socExpanded)}>
            <span style={{fontSize: 10}}>{socExpanded ? "▼" : "▶"}</span> Security Operations Center
          </div>
          {socExpanded && (
            <div className="sn-nav-items">
              <NavLink to="/servicenow/incidents?assignedTo=me&group=soc" className="sn-nav-item">
                <span style={{ color: "#3b82f6" }}>🗂</span> Incidents Assigned to Me
              </NavLink>
              <NavLink to="/servicenow/incidents" className="sn-nav-item">
                <span>📁</span> SOC Incidents
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
