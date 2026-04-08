import { useEffect, useRef, useState } from "react";
import { useSimulator } from "../context/SimulatorContext";
import { Modal } from "./Modal";
import { SearchResultsModal } from "./SearchResultsModal";

export function TopBar() {
  const {
    incidents,
    searchQuery,
    setSearchQuery,
    notifications,
    unreadCount,
    markAllNotificationsRead,
    dismissNotification,
    addNotification,
  } = useSimulator();
  const [panelOpen, setPanelOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(t)) setPanelOpen(false);
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggleNotif() {
    setPanelOpen((prev) => {
      if (!prev) markAllNotificationsRead();
      return !prev;
    });
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-search">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              className="search-input"
              placeholder="Search endpoints, hashes, incidents…"
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setSearchModalOpen(true);
                  addNotification("Search", "Showing simulated cross-product results — pivot to Inbox or public intel.");
                }
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary search-go"
            title="Run search (simulated)"
            onClick={() => {
              setSearchModalOpen(true);
              addNotification("Search", "Results panel opened — incidents, hash/IP pivots, and fake correlations.");
            }}
          >
            Search
          </button>
        </div>
        <div className="topbar-actions">
          <div className="notif-wrap" ref={wrapRef}>
            <button
              type="button"
              className="icon-btn"
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={panelOpen}
              onClick={toggleNotif}
            >
              🔔
              {unreadCount > 0 ? <span className="badge">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
            </button>
            {panelOpen ? (
              <div className="notif-panel">
                <header>
                  <span>Notifications</span>
                  <button type="button" className="link-btn" onClick={markAllNotificationsRead}>
                    Mark all read
                  </button>
                </header>
                {notifications.length === 0 ? (
                  <div className="notif-item">No notifications yet. Use Begin Work, Mark Resolved, etc.</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={"notif-item" + (n.read ? "" : " unread")}>
                      <strong>{n.title}</strong>
                      <div>{n.message}</div>
                      <small>{new Date(n.at).toLocaleString()}</small>
                      <div style={{ marginTop: 6 }}>
                        <button type="button" className="link-btn" onClick={() => dismissNotification(n.id)}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="icon-btn"
            title="Help"
            aria-label="Help"
            onClick={() => setHelpOpen(true)}
          >
            ?
          </button>
          <div className="notif-wrap" ref={profileRef}>
            <button
              type="button"
              className="user-pill"
              aria-expanded={profileOpen}
              aria-haspopup="dialog"
              onClick={() => setProfileOpen((o) => !o)}
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
              <div className="profile-panel" role="dialog" aria-label="User profile">
                <div className="profile-panel-head">
                  <div className="user-avatar large" aria-hidden>
                    TF
                  </div>
                  <div>
                    <div className="profile-name">FahimTanzimul</div>
                    <div className="profile-org">Data Group · SOC Instructor (lab)</div>
                  </div>
                </div>
                <dl className="profile-kv">
                  <div>
                    <dt>Email</dt>
                    <dd>tanzimul.fahim@datagroup.lab</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>Org Admin (simulated)</dd>
                  </div>
                  <div>
                    <dt>Region</dt>
                    <dd>North America (training)</dd>
                  </div>
                  <div>
                    <dt>Session</dt>
                    <dd>Console · local simulator</dd>
                  </div>
                </dl>
                <div className="profile-actions">
                  <button type="button" className="btn" onClick={() => addNotification("Profile", "Account settings are not persisted in this build.")}>
                    Account settings
                  </button>
                  <button type="button" className="btn" onClick={() => addNotification("Profile", "Signed out (simulated) — refresh page to reset.")}>
                    Sign out (demo)
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="icon-btn"
            title="Settings"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            ⚙
          </button>
        </div>
      </header>

      <Modal open={helpOpen} title="SOC Instructor — Quick guide" onClose={() => setHelpOpen(false)} wide>
        <p>
          <strong>1. Triage:</strong> Stay on <strong>Requires Attention</strong>, select a host with the checkbox,
          then <strong>Begin Work</strong>. The incident moves to <strong>In Progress</strong> and you get a
          notification.
        </p>
        <p>
          <strong>2. Complete:</strong> Open <strong>In Progress</strong>, select the same incident, then{" "}
          <strong>Mark Resolved</strong>. Find it later under <strong>Resolved</strong>.
        </p>
        <p>
          <strong>3. Hashes:</strong> Click any observables row or right-click a compromise event row to see full
          SHA-256 and copy it.
        </p>
        <p>
          <strong>4. Events drill-down:</strong> Expand an incident and click <strong>Events</strong> for a full table
          with Talos / VirusTotal links.
        </p>
        <p>
          <strong>5. Scan:</strong> Click the green <strong>Scan</strong> button → <strong>Full Scan</strong> (or Flash).
          When it finishes, open <strong>Events</strong> to see <em>clean scan</em> log lines. Add an{" "}
          <strong>Analyst comment</strong>, then <strong>Mark Resolved</strong> when appropriate.
        </p>
        <p>
          <strong>6. Reset:</strong> Use <strong>Reset</strong> on Inbox to restore the starting lab data.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => setHelpOpen(false)}>
            Got it
          </button>
        </div>
      </Modal>

      <SearchResultsModal
        open={searchModalOpen}
        query={searchQuery}
        incidents={incidents}
        onClose={() => setSearchModalOpen(false)}
      />

      <Modal open={settingsOpen} title="Settings (simulated)" onClose={() => setSettingsOpen(false)}>
        <p>These controls are for demo only — nothing is saved to a server.</p>
        <label className="filter-check">
          <input
            type="checkbox"
            defaultChecked
            onChange={(e) =>
              addNotification(
                "Settings",
                e.target.checked ? "Demo alerts enabled." : "Demo alerts disabled (simulated)."
              )
            }
          />
          Show training notifications
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => setSettingsOpen(false)}>
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
