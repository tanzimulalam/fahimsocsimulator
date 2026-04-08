import { Outlet } from "react-router-dom";
import { DefenderSidebar } from "../components/defender/DefenderSidebar";
import { DefenderTopbar } from "../components/defender/DefenderTopbar";
import "../styles/defender.css";

export function DefenderLayout() {
  return (
    <div className="def-app">
      <a href="#def-main-content" className="def-skip-link">Skip to main content</a>
      <DefenderSidebar />
      <div className="def-main">
        <DefenderTopbar />
        <main className="def-content" id="def-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

