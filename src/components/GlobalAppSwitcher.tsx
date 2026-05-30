import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useClassroom } from "../context/ClassroomContext";

export function GlobalAppSwitcher() {
  const [open, setOpen] = useState(false);
  const { session } = useClassroom();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "fixed", top: 16, right: 16, zIndex: 99999 }}>
      <button
        onClick={() => setOpen(!open)}
        title="App Switcher"
        style={{
          background: "#1e1e2e",
          border: "1px solid #333",
          color: "#fff",
          borderRadius: 8,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
          fontSize: 20,
          transition: "transform 0.2s, background 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#2a2a3e"}
        onMouseLeave={e => e.currentTarget.style.background = "#1e1e2e"}
      >
        ⚙️
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: 50,
          right: 0,
          background: "#1e1e2e",
          border: "1px solid #333",
          borderRadius: 8,
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          width: 250,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "fadeIn 0.15s ease-out"
        }}>
          <div style={{ padding: "12px 16px", background: "#2a2a3e", borderBottom: "1px solid #333", fontWeight: "bold", fontSize: 13, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 }}>
            Switch App
          </div>
          
          <SwitcherLink to="/inbox" icon="🛡️" label="Cisco Secure Endpoint" onClick={() => setOpen(false)} />
          <SwitcherLink to="/xdr/investigate" icon="🔍" label="Cisco XDR" onClick={() => setOpen(false)} />
          <SwitcherLink to="/defender/home" icon="🛡️" label="Microsoft Defender XDR" onClick={() => setOpen(false)} />
          <SwitcherLink to="/sentinel/overview" icon="👁️" label="Microsoft Sentinel" onClick={() => setOpen(false)} />
          <SwitcherLink to="/servicenow/incidents" icon="🎫" label="ServiceNow" onClick={() => setOpen(false)} />
          
          {session?.role === "admin" && (
            <>
              <div style={{ height: 1, background: "#333", margin: "4px 0" }} />
              <SwitcherLink to="/notepad" icon="📝" label="Instructor Notepad" onClick={() => setOpen(false)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SwitcherLink({ to, icon, label, onClick }: { to: string, icon: string, label: string, onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        color: "#eee",
        textDecoration: "none",
        fontSize: 14,
        transition: "background 0.2s"
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#2a2a3e"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </Link>
  );
}
