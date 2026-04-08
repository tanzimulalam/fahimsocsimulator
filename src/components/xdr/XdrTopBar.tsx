import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";

export function XdrTopBar() {
  const { addNotification } = useSimulator();
  const [profileOpen, setProfileOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="xdr-topbar">
      <div className="xdr-topbar-spacer" />
      <div className="xdr-topbar-actions">
        <button
          type="button"
          className="xdr-icon-btn"
          aria-label="Search"
          onClick={() => addNotification("Search", "Simulated global search (no backend).")}
        >
          ⌕
        </button>
        <button
          type="button"
          className="xdr-icon-btn"
          aria-label="Help"
          onClick={() => addNotification("Help", "XDR Investigate: select a node, review verdicts, pivot to AMP Events.")}
        >
          ?
        </button>
        <button
          type="button"
          className="xdr-icon-btn"
          aria-label="Notifications"
          onClick={() => addNotification("Notifications", "No new XDR alerts (simulated).")}
        >
          🔔
        </button>
        <div className="notif-wrap" ref={wrapRef}>
          <button
            type="button"
            className="user-pill"
            onClick={() => setProfileOpen((o) => !o)}
            aria-expanded={profileOpen}
          >
            <div className="user-avatar" aria-hidden>
              TF
            </div>
            <div className="user-meta">
              <strong>FahimTanzimul</strong>
              <small>Data Group</small>
            </div>
          </button>
          {profileOpen ? (
            <div className="profile-panel">
              <div className="profile-panel-head">
                <div className="user-avatar large" aria-hidden>
                  TF
                </div>
                <div>
                  <div className="profile-name">FahimTanzimul</div>
                  <div className="profile-org">Data Group · XDR (lab)</div>
                </div>
              </div>
              <p style={{ fontSize: 12, margin: "0 0 8px" }}>
                <Link to="/inbox">← Back to Secure Endpoint simulator</Link>
              </p>
              <button type="button" className="btn" style={{ width: "100%" }} onClick={() => setProfileOpen(false)}>
                Close
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
