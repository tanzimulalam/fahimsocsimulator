import { useState } from "react";
import { useLabState } from "../../lib/useLabState";
import {
  CLOUD_APPS_KEY,
  DISCOVERED_APPS,
  initialCloudAppsState,
  type AppControlPolicy,
  type CloudAppsState,
} from "../../data/defenderCloudApps";

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function DefenderCloudPoliciesPage() {
  const [state, setState] = useLabState<CloudAppsState>(CLOUD_APPS_KEY, initialCloudAppsState);
  const [name, setName] = useState("");
  const [target, setTarget] = useState(DISCOVERED_APPS[0].name);
  const [action, setAction] = useState<AppControlPolicy["action"]>("Block");

  const create = () => {
    const policy: AppControlPolicy = {
      id: `pol-${Date.now().toString(36)}`,
      name: name.trim() || `${action} ${target}`,
      target,
      action,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, policies: [policy, ...prev.policies] }));
    setName("");
  };

  const remove = (id: string) => setState((prev) => ({ ...prev, policies: prev.policies.filter((p) => p.id !== id) }));

  const targets = [...DISCOVERED_APPS.map((a) => a.name), "Category: Cloud storage", "Category: Generative AI", "Category: Webmail"];

  return (
    <div className="def-page">
      <h1>Cloud app policies</h1>
      <p className="dash-muted">Create app-control policies (persisted). Block, monitor, or warn on discovered apps and categories.</p>

      <section className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">New policy</div>
        <div className="def-toolbar" style={{ padding: 12 }}>
          <input className="def-search-inline" placeholder="Policy name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="def-search-inline" value={target} onChange={(e) => setTarget(e.target.value)}>
            {targets.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="def-search-inline" value={action} onChange={(e) => setAction(e.target.value as AppControlPolicy["action"])}>
            <option value="Block">Block</option>
            <option value="Monitor">Monitor</option>
            <option value="Warn">Warn</option>
          </select>
          <button className="btn btn-primary" onClick={create}>Create policy</button>
        </div>
      </section>

      <div className="panel">
        <div className="panel-h">Policies <span className="badge-count info">{state.policies.length}</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Target</th><th>Action</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {state.policies.length === 0 ? <tr><td colSpan={5} className="dash-muted">No policies yet.</td></tr> : null}
              {state.policies.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.target}</td>
                  <td><span className={"def-status-chip " + (p.action === "Block" ? "pending-actions" : "in-progress")}>{p.action}</span></td>
                  <td>{fmt(p.createdAt)}</td>
                  <td><button className="btn" onClick={() => remove(p.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
