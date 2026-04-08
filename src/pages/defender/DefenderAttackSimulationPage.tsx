import { useState } from "react";
import { useSimulator } from "../../context/SimulatorContext";

export function DefenderAttackSimulationPage() {
  const { addNotification } = useSimulator();
  const [tab, setTab] = useState<"simulations" | "library">("simulations");

  return (
    <div className="def-page">
      <h1>Attack simulation training</h1>
      <div className="def-tabs">
        <button type="button" className={"btn" + (tab === "simulations" ? " btn-primary" : "")} onClick={() => setTab("simulations")}>Simulations</button>
        <button type="button" className={"btn" + (tab === "library" ? " btn-primary" : "")} onClick={() => setTab("library")}>Content library</button>
      </div>
      {tab === "simulations" ? (
        <div className="panel">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Status</th><th>Compromised users</th><th>Action</th></tr></thead>
              <tbody>
                <tr>
                  <td>Q3 Phishing Test - Gift Card Lure</td>
                  <td>Completed</td>
                  <td>12/150</td>
                  <td><button type="button" className="link-btn" onClick={() => addNotification("Simulation", "Simulation report opened (simulated).")}>Open report</button></td>
                </tr>
                <tr>
                  <td>Payroll update urgency simulation</td>
                  <td>Running</td>
                  <td>5/150</td>
                  <td><button type="button" className="link-btn" onClick={() => addNotification("Simulation", "Campaign paused (simulated).")}>Pause</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Template</th><th>Category</th><th>Language</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td>FedEx Delivery Exception</td><td>Credential harvest</td><td>English</td><td><button type="button" className="link-btn" onClick={() => addNotification("Library", "Template copied to draft campaign.")}>Use template</button></td></tr>
                <tr><td>Microsoft Teams Voicemail</td><td>Malicious link</td><td>English</td><td><button type="button" className="link-btn" onClick={() => addNotification("Library", "Template preview opened.")}>Preview</button></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

