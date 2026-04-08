import { Outlet } from "react-router-dom";
import { XdrSidebar } from "../components/xdr/XdrSidebar";
import { XdrTopBar } from "../components/xdr/XdrTopBar";
import "../styles/xdr.css";

export function XdrLayout() {
  return (
    <div className="xdr-app">
      <XdrSidebar />
      <div className="xdr-main">
        <XdrTopBar />
        <main className="xdr-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
