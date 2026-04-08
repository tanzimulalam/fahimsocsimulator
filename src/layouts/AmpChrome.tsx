import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { ToastStrip } from "../components/ToastStrip";
import { TopBar } from "../components/TopBar";

export function AmpChrome({ role, onLogout }: { role: "admin" | "student"; onLogout: () => void }) {
  return (
    <div className="app-shell">
      <Sidebar role={role} />
      <div className="main-wrap">
        <TopBar role={role} onLogout={onLogout} />
        <ToastStrip />
        <Outlet />
      </div>
    </div>
  );
}
