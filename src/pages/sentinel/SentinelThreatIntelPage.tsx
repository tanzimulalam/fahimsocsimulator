import { useMemo, useState } from "react";
import { SENTINEL_INCIDENTS } from "../../data/sentinelIncidents";

type Indicator = { type: string; value: string; source: string; confidence: number };

export function SentinelThreatIntelPage() {
  const [filter, setFilter] = useState("");

  const indicators = useMemo<Indicator[]>(() => {
    const seen = new Set<string>();
    const out: Indicator[] = [];
    SENTINEL_INCIDENTS.forEach((inc) => {
      inc.entities.forEach((e) => {
        if (e.type === "ip" || e.type === "url" || e.type === "filehash") {
          if (seen.has(e.value)) return;
          seen.add(e.value);
          out.push({
            type: e.type === "filehash" ? "FileHash-SHA256" : e.type === "ip" ? "IPv4" : "DomainName",
            value: e.value,
            source: inc.productNames[0] ?? "Microsoft Sentinel",
            confidence: e.type === "filehash" ? 95 : e.type === "ip" ? 85 : 80,
          });
        }
      });
    });
    return out;
  }, []);

  const filtered = indicators.filter((i) => !filter || i.value.toLowerCase().includes(filter.toLowerCase()) || i.type.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="def-page">
      <h1>Threat intelligence</h1>
      <p className="dash-muted">Indicators of compromise aggregated from incidents. Confidence reflects source reliability.</p>

      <div className="def-toolbar">
        <input className="def-search-inline" placeholder="Filter indicators…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <span className="dash-muted">{filtered.length} indicators</span>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Type</th><th>Indicator</th><th>Source</th><th>Confidence</th></tr></thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.value}>
                  <td>{i.type}</td>
                  <td style={{ wordBreak: "break-all" }}><code>{i.value}</code></td>
                  <td>{i.source}</td>
                  <td><span className={"badge-count " + (i.confidence >= 90 ? "high" : "info")}>{i.confidence}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
