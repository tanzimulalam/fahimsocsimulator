import { useState } from "react";
import { useLabState } from "../../lib/useLabState";
import { SENTINEL_WATCHLISTS, type Watchlist } from "../../data/sentinelData";

type UserWatchlist = Watchlist & { custom: true };

export function SentinelWatchlistsPage() {
  const [added, setAdded] = useLabState<UserWatchlist[]>("sentinel-watchlists-v1", []);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [key, setKey] = useState("IPAddress");

  const create = () => {
    if (!name.trim()) return;
    setAdded((prev) => [{ id: `wl-${Date.now().toString(36)}`, name: name.trim(), description: desc.trim() || "Custom watchlist", itemsCount: 0, searchKey: key, custom: true }, ...prev]);
    setName("");
    setDesc("");
  };

  const remove = (id: string) => setAdded((prev) => prev.filter((w) => w.id !== id));

  const all: (Watchlist & { custom?: boolean })[] = [...added, ...SENTINEL_WATCHLISTS];

  return (
    <div className="def-page">
      <h1>Watchlists</h1>
      <p className="dash-muted">Curated lists joined into analytics and hunting queries. Create your own (persisted).</p>

      <section className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-h">New watchlist</div>
        <div className="def-toolbar" style={{ padding: 12 }}>
          <input className="def-search-inline" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="def-search-inline" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <select className="def-search-inline" value={key} onChange={(e) => setKey(e.target.value)}>
            <option value="IPAddress">IPAddress</option>
            <option value="UserPrincipalName">UserPrincipalName</option>
            <option value="SHA256">SHA256</option>
            <option value="DeviceName">DeviceName</option>
          </select>
          <button className="btn btn-primary" onClick={create}>Create watchlist</button>
        </div>
      </section>

      <div className="panel">
        <div className="panel-h">Watchlists <span className="badge-count info">{all.length}</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Description</th><th>Search key</th><th>Items</th><th></th></tr></thead>
            <tbody>
              {all.map((w) => (
                <tr key={w.id}>
                  <td><strong>{w.name}</strong></td>
                  <td>{w.description}</td>
                  <td><code>{w.searchKey}</code></td>
                  <td>{w.itemsCount}</td>
                  <td>{w.custom ? <button className="btn" onClick={() => remove(w.id)}>Delete</button> : <span className="dash-muted">Built-in</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
