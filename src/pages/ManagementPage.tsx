import { useState } from "react";
import { ConsolePage } from "../components/ConsolePage";
import { Modal } from "../components/Modal";
import { GROUP_OPTIONS } from "../data/mockData";
import { useSimulator } from "../context/SimulatorContext";

const policies = [
  { name: "Work from Home Policy for Windows", ver: "12.4", hosts: 412, id: "pol-wfh" },
  { name: "Defender ATP Policy — FacStaff", ver: "11.9", hosts: 890, id: "pol-fac" },
  { name: "Lab Class — Windows", ver: "10.2", hosts: 220, id: "pol-lab" },
  { name: "DMZ — Web", ver: "9.1", hosts: 34, id: "pol-dmz" },
];

export function ManagementPage() {
  const { addNotification } = useSimulator();
  const [groupModal, setGroupModal] = useState<string | null>(null);
  const [policyModal, setPolicyModal] = useState<(typeof policies)[0] | null>(null);

  return (
    <ConsolePage title="Management" subtitle="Policies and groups — read-only lab view with simulated actions.">
      <div className="panel">
        <div className="panel-h">Groups</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Group name</th>
                <th>Description (fake)</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {GROUP_OPTIONS.map((g) => (
                <tr key={g}>
                  <td>
                    <code>{g}</code>
                  </td>
                  <td>Training partition — map to your org’s real OU/GPO story.</td>
                  <td>
                    <button type="button" className="link-btn" onClick={() => setGroupModal(g)}>
                      View hosts
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-h">Policies</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Version</th>
                <th>Endpoints (sim.)</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.ver}</td>
                  <td>{p.hosts}</td>
                  <td>
                    <button type="button" className="link-btn" onClick={() => setPolicyModal(p)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!groupModal} title={groupModal ? `Hosts — ${groupModal}` : "Hosts"} onClose={() => setGroupModal(null)} wide>
        {groupModal ? (
          <>
            <p className="dash-muted">
              Representative members (fake): <code>HOST-01</code>, <code>HOST-02</code>, <code>LAB-WS-0142</code>…
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>OS</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>{groupModal.slice(0, 8).toUpperCase()}-WS-01</code>
                  </td>
                  <td>Windows 11</td>
                  <td>2024-04-11 14:00 UTC</td>
                </tr>
                <tr>
                  <td>
                    <code>{groupModal.slice(0, 8).toUpperCase()}-WS-02</code>
                  </td>
                  <td>Windows 10</td>
                  <td>2024-04-11 13:22 UTC</td>
                </tr>
              </tbody>
            </table>
            <div className="modal-actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  addNotification("Export", "Host list CSV queued (simulated).");
                }}
              >
                Export CSV
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setGroupModal(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>

      <Modal open={!!policyModal} title={policyModal?.name ?? "Policy"} onClose={() => setPolicyModal(null)} wide>
        {policyModal ? (
          <>
            <p>
              <strong>Version:</strong> {policyModal.ver} · <strong>Approx. coverage:</strong> {policyModal.hosts} endpoints
            </p>
            <ul className="dash-list">
              <li>Exploit prevention: ON (blocking)</li>
              <li>Orbital advanced features: audit-only</li>
              <li>Custom detections: DEFCON + Quick SCD linked</li>
              <li>Last merge: simulated 02:00 UTC · Editor: FahimTanzimul</li>
            </ul>
            <div className="dash-links">
              <button type="button" className="link-btn" onClick={() => addNotification("Diff", "Policy diff vs. v-1 opened (simulated).")}>
                Compare to previous version
              </button>
              <button type="button" className="link-btn" onClick={() => addNotification("Staged", "Staged rollout to 10% pilot (simulated).")}>
                Staged rollout
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setPolicyModal(null)}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </ConsolePage>
  );
}
