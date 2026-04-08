import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { ToastStrip } from "../components/ToastStrip";
import { TopBar } from "../components/TopBar";

export function AmpChrome() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-wrap">
        <TopBar />
        <ToastStrip />
        <Outlet />
      </div>
    </div>
  );
}
