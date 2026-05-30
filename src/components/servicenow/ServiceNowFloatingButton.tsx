import { useNavigate, useLocation } from "react-router-dom";

export function ServiceNowFloatingButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const isSn = location.pathname.startsWith("/servicenow");

  if (isSn) return null;

  return (
    <button
      onClick={() => navigate("/servicenow/incidents")}
      className="fab-btn"
      style={{
        bottom: 270,
        backgroundColor: "#1b1736",
        color: "#e6e6e6",
        borderColor: "#3b3366",
        zIndex: 9999,
      }}
      title="Open ServiceNow"
    >
      <div className="fab-icon" style={{ fontSize: "16px", fontWeight: "bold" }}>SN</div>
    </button>
  );
}
