export function ServiceNowTopbar() {
  return (
    <header className="sn-topbar">
      <div className="sn-topbar-left">
        <div className="sn-logo">ServiceNow</div>
      </div>
      <div className="sn-topbar-right">
        <div className="sn-search-wrap">
          <input type="text" placeholder="Search" className="sn-filter-input" style={{ width: 200 }} />
        </div>
        <div className="sn-user-menu" style={{ fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>System Administrator</span>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10 }}>SA</div>
        </div>
      </div>
    </header>
  );
}
