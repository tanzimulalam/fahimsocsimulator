import { Link } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";

export function DefenderTopbar() {
  const { addNotification } = useSimulator();
  return (
    <header className="def-top">
      <button
        type="button"
        className="def-ico"
        title="App launcher"
        onClick={() => addNotification("App Launcher", "Microsoft 365 app launcher opened (simulated).")}
      >
        ⊞
      </button>
      <div className="def-title-inline">Microsoft Defender</div>
      <input
        className="def-search"
        placeholder="Search devices, users, hashes, IPs..."
        onKeyDown={(e) => {
          if (e.key === "Enter") addNotification("Defender Search", "Global search executed (simulated).");
          if ((e.altKey && e.key.toLowerCase() === "q") || (e.ctrlKey && e.key.toLowerCase() === "e")) {
            addNotification("Shortcut", "Focus search shortcut detected (Alt+Q / Ctrl+E).");
          }
        }}
      />
      <button type="button" className="def-ico" title="Feedback" onClick={() => addNotification("Feedback", "Feedback panel opened (simulated).")}>☺</button>
      <button type="button" className="def-ico" title="Help" onClick={() => addNotification("Help", "Help center opened (simulated).")}>?</button>
      <button type="button" className="def-ico" title="Global settings" onClick={() => addNotification("Global Settings", "Global settings opened (simulated).")}>⚙</button>
      <button type="button" className="def-ico" title="Notifications" onClick={() => addNotification("Notifications", "No new defender alerts.")}>🔔</button>
      <button type="button" className="def-avatar" title="User profile" onClick={() => addNotification("Profile", "User profile menu: account, preferences, sign out (simulated).")}>TF</button>
      <Link to="/inbox" className="btn">Back to AMP</Link>
    </header>
  );
}

