import { useState } from "react";
import { useSentinelData } from "../../context/SentinelDataContext";
import { SENTINEL_CONNECTORS, type DataConnector } from "../../data/sentinelData";
import { Modal } from "../../components/Modal";
import { fmtTs } from "./sentinelShared";

export function SentinelDataConnectorsPage() {
  const { connectorOverrides, toggleConnector } = useSentinelData();
  const [drawer, setDrawer] = useState<DataConnector | null>(null);

  const connectors = SENTINEL_CONNECTORS.map((c) => ({ ...c, status: connectorOverrides[c.id] ?? c.status }));

  return (
    <div className="def-page">
      <h1>Data connectors</h1>
      <p className="dash-muted">Connectors ingest data into the workspace. Some are deliberately stale — a teaching point about visibility blind spots.</p>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Connector</th><th>Provider</th><th>Status</th><th>Data types</th><th>Last data</th><th>Events (24h)</th><th></th></tr></thead>
            <tbody>
              {connectors.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className={"conn-dot " + (c.status === "Disconnected" ? "off" : c.staleData ? "stale" : "ok")} />
                    <button className="link-btn" onClick={() => setDrawer(c)}>{c.name}</button>
                  </td>
                  <td>{c.provider}</td>
                  <td>{c.status}{c.status === "Connected" && c.staleData ? <span className="dash-muted"> (no data 1h)</span> : null}</td>
                  <td><span className="dash-muted" style={{ fontSize: 11 }}>{c.dataTypes.join(", ")}</span></td>
                  <td>{fmtTs(c.lastDataReceived)}</td>
                  <td>{c.eventsIngested24h.toLocaleString()}</td>
                  <td><button className="btn" onClick={() => toggleConnector(c.id, c.status)}>{c.status === "Connected" ? "Disconnect" : "Connect"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!drawer} title={drawer?.name ?? ""} onClose={() => setDrawer(null)}>
        {drawer ? (
          <div className="def-kv">
            <p><strong>Provider:</strong> {drawer.provider}</p>
            <p><strong>Status:</strong> {connectorOverrides[drawer.id] ?? drawer.status}</p>
            <p><strong>Data types:</strong> {drawer.dataTypes.join(", ")}</p>
            <p><strong>Events ingested (24h):</strong> {drawer.eventsIngested24h.toLocaleString()}</p>
            <p><strong>Sample query:</strong></p>
            <pre className="def-query" style={{ whiteSpace: "pre-wrap" }}>{drawer.dataTypes[0]}{"\n| take 50"}</pre>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
