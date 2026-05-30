import { Outlet } from "react-router-dom";
import { ServiceNowNavigator } from "../components/servicenow/ServiceNowNavigator";
import { ServiceNowTopbar } from "../components/servicenow/ServiceNowTopbar";
import "../styles/servicenow.css";

export function ServiceNowLayout() {
  return (
    <div className="sn-app">
      <a href="#sn-main-content" className="sn-skip-link">Skip to main content</a>
      <ServiceNowNavigator />
      <div className="sn-main">
        <ServiceNowTopbar />
        <main className="sn-content" id="sn-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
