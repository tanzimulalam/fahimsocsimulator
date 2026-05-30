import { Link } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";

export function SentinelTopbar() {
  const { addNotification } = useSimulator();
  return (
    <header className="def-top sen-top">
      <button type="button" className="def-ico" title="App launcher" onClick={() => addNotification("Azure Portal", "Azure portal app launcher opened (simulated).")}>⊞</button>
      <div className="def-title-inline">Microsoft Sentinel <span className="sen-workspace">· contoso-soc-law</span></div>
      <input
        className="def-search"
        placeholder="Search incidents, entities, rules..."
        onKeyDown={(e) => { if (e.key === "Enter") addNotification("Sentinel Search", "Global search executed (simulated)."); }}
      />
      <button type="button" className="def-ico" title="Notifications" onClick={() => addNotification("Notifications", "No new Sentinel notifications.")}>🔔</button>
      <button type="button" className="def-ico" title="Settings" onClick={() => addNotification("Settings", "Workspace settings opened (simulated).")}>⚙</button>
      <button type="button" className="def-avatar sen-avatar" title="User profile" onClick={() => addNotification("Profile", "Account menu (simulated).")}>TF</button>
      <Link to="/defender/home" className="btn">Defender XDR</Link>
      <Link to="/inbox" className="btn">Back to AMP</Link>
    </header>
  );
}
