import { useState } from "react";
import { useSimulator } from "../../context/SimulatorContext";

export function DefenderSettingsPage() {
  const { addNotification } = useSimulator();
  const [liveResponse, setLiveResponse] = useState(true);
  const [autoInvestigation, setAutoInvestigation] = useState(true);
  const [tamperProtection, setTamperProtection] = useState(true);
  const [indicatorBlock, setIndicatorBlock] = useState("203.0.113.44");

  return (
    <div className="def-page">
      <h1>Settings - Endpoints</h1>
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">Onboarding</div>
        <div className="def-toolbar">
          <button type="button" className="btn" onClick={() => addNotification("Onboarding", "Windows 10/11 selected.")}>Windows 10/11</button>
          <button type="button" className="btn" onClick={() => addNotification("Onboarding", "Windows onboarding package downloaded (simulated).")}>Windows script</button>
          <button type="button" className="btn" onClick={() => addNotification("Onboarding", "macOS onboarding package downloaded (simulated).")}>macOS script</button>
          <button type="button" className="btn" onClick={() => addNotification("Onboarding", "Linux onboarding package downloaded (simulated).")}>Linux script</button>
          <button type="button" className="btn" onClick={() => addNotification("Onboarding", "Android onboarding package downloaded (simulated).")}>Android package</button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">Permissions & advanced features</div>
        <div className="def-toolbar">
          <button type="button" className="btn" onClick={() => addNotification("Permissions", "Role assignments opened (simulated).")}>Permissions</button>
          <label className="filter-check">
            <input type="checkbox" checked={liveResponse} onChange={(e) => {
              setLiveResponse(e.target.checked);
              addNotification("Feature toggle", `Live Response ${e.target.checked ? "enabled" : "disabled"}.`);
            }} />
            Live Response
          </label>
          <label className="filter-check">
            <input type="checkbox" checked={autoInvestigation} onChange={(e) => {
              setAutoInvestigation(e.target.checked);
              addNotification("Feature toggle", `Automated Investigation ${e.target.checked ? "enabled" : "disabled"}.`);
            }} />
            Automated Investigation
          </label>
          <label className="filter-check">
            <input type="checkbox" checked={tamperProtection} onChange={(e) => {
              setTamperProtection(e.target.checked);
              addNotification("Feature toggle", `Tamper Protection ${e.target.checked ? "enabled" : "disabled"}.`);
            }} />
            Tamper Protection
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">Indicators (Block/Allow)</div>
        <div className="def-toolbar">
          <input className="def-search-inline" value={indicatorBlock} onChange={(e) => setIndicatorBlock(e.target.value)} />
          <button type="button" className="btn btn-primary" onClick={() => addNotification("Indicator", `${indicatorBlock} added to Block list (simulated).`)}>
            Block indicator
          </button>
          <button type="button" className="btn" onClick={() => addNotification("Indicator", `${indicatorBlock} added to Allow list (simulated).`)}>
            Allow indicator
          </button>
        </div>
      </div>
    </div>
  );
}

