import { Outlet } from "react-router-dom";
import { SentinelSidebar } from "../components/sentinel/SentinelSidebar";
import { SentinelTopbar } from "../components/sentinel/SentinelTopbar";
import { SentinelDataProvider } from "../context/SentinelDataContext";
import "../styles/defender.css";
import "../styles/sentinel.css";

export function SentinelLayout() {
  return (
    <SentinelDataProvider>
      <div className="def-app sen-app">
        <a href="#sen-main-content" className="def-skip-link">Skip to main content</a>
        <SentinelSidebar />
        <div className="def-main">
          <SentinelTopbar />
          <main className="def-content" id="sen-main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </SentinelDataProvider>
  );
}
