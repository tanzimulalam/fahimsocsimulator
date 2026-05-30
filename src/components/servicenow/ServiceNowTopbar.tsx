export function ServiceNowTopbar() {
  return (
    <header className="sn-topbar">
      <div className="sn-topbar-nav">
        <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>⌂</span> All
        </span>
        <span>History</span>
        <span>Workspaces</span>
      </div>
      <div className="sn-topbar-center">
        Incidents <span style={{ color: "#facc15" }}>☆</span>
      </div>
      <div className="sn-topbar-right">
        <input type="text" placeholder="Search" className="sn-search-input" style={{ width: 150 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>❓</span>
          <span>⚙️</span>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#444', border: '1px solid #666', display: 'grid', placeItems: 'center', fontSize: 10, color: 'white' }}>SA</div>
        </div>
      </div>
    </header>
  );
}
