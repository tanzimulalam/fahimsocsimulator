import { useState } from "react";
import { Modal } from "../../components/Modal";
import { useSimulator } from "../../context/SimulatorContext";
import type { Incident } from "../../types";

export function DefenderAssetsPage() {
  const { incidents, addNotification } = useSimulator();
  const [pick, setPick] = useState<Incident | null>(null);

  return (
    <div className="def-page">
      <h1>Assets - Devices</h1>
      <div className="def-tabs">
        <button type="button" className="btn btn-primary">Computers & Mobile</button>
        <button type="button" className="btn" onClick={() => addNotification("Network devices", "Network devices view opened (simulated).")}>Network devices</button>
        <button type="button" className="btn" onClick={() => addNotification("IoT devices", "IoT devices view opened (simulated).")}>IoT devices</button>
        <button type="button" className="btn" onClick={() => addNotification("Filter", "Filter pane opened: Last seen, Risk level, Sensor health.")}>Filter</button>
      </div>
      <div className="panel">
        <div className="panel-h">Device inventory</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Risk level</th>
                <th>Exposure level</th>
                <th>OS platform</th>
                <th>Sensor health</th>
                <th>Last seen</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i.id}>
                  <td>{i.host.hostname}</td>
                  <td><span className="sev sev-high">{i.host.riskScore > 75 ? "High" : i.host.riskScore > 45 ? "Medium" : "Low"}</span></td>
                  <td>{i.host.riskScore > 75 ? "High" : i.host.riskScore > 45 ? "Medium" : "Low"}</td>
                  <td>Windows 11, version 22H2</td>
                  <td>Active</td>
                  <td>{i.host.lastSeenUtc}</td>
                  <td>
                    <button type="button" className="link-btn" onClick={() => setPick(i)}>Open device page</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="panel-h">Device discovery</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Discovered device</th><th>IP address</th><th>Status</th><th>Protocol</th></tr></thead>
            <tbody>
              <tr><td>Canon-Printer-MX922</td><td>192.168.1.50</td><td>Unmanaged</td><td>ARP/unicast</td></tr>
              <tr><td>Warehouse-Camera-07</td><td>192.168.1.72</td><td>Unmanaged</td><td>Passive network sensor</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!pick} title={pick ? `Device - ${pick.host.hostname}` : "Device"} onClose={() => setPick(null)} wide>
        {pick ? (
          <>
            <p><strong>Risk level:</strong> {pick.host.riskScore > 75 ? "High" : pick.host.riskScore > 45 ? "Medium" : "Low"}</p>
            <p><strong>Exposure level:</strong> {pick.host.riskScore > 70 ? "High (multiple missing patches)" : "Medium"}</p>
            <h4>Timeline</h4>
            <ul className="dash-list">
              {pick.events.slice(0, 5).map((e) => (
                <li key={e.id}>{e.timestampUtc} — {e.eventType} ({e.filename ?? "n/a"})</li>
              ))}
            </ul>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => addNotification("Live response", `Started live response shell on ${pick.host.hostname} (simulated).`)}>
                Live response
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setPick(null)}>Close</button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}

