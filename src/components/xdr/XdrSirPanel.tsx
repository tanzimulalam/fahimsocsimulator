import type { IncidentXdrSir } from "../../types";

export function XdrSirPanel({ sir }: { sir: IncidentXdrSir }) {
  return (
    <section className="xdr-sir-panel" aria-labelledby="xdr-sir-heading">
      <h2 id="xdr-sir-heading" className="xdr-sir-panel-title">
        {sir.sirId} — {sir.sirTitle}
      </h2>
      <p className="xdr-sir-meta">
        <span>
          <strong>MS-ISAC feed:</strong> {sir.msisacFeedId}
        </span>
        <span>
          <strong>First seen:</strong> {sir.firstSeenUtc}
        </span>
        <span>
          <strong>Last observed:</strong> {sir.lastObservedUtc}
        </span>
      </p>
      <p className="xdr-sir-sector">
        <strong>Sector / org context:</strong> {sir.sectorContext}
      </p>
      <div className="xdr-sir-narrative">
        <h3 className="xdr-sir-subh">Investigation narrative</h3>
        <p>{sir.narrative}</p>
      </div>

      <div className="xdr-sir-columns">
        <div>
          <h3 className="xdr-sir-subh">Malicious / suspicious IPv4</h3>
          {sir.maliciousIpv4.length === 0 ? (
            <p className="dash-muted">None listed for this archived case.</p>
          ) : (
            <ul className="xdr-sir-list">
              {sir.maliciousIpv4.map((row) => (
                <li key={row.ip}>
                  <code className="xdr-sir-ip">{row.ip}</code>
                  <span className="xdr-sir-first">{row.firstSeenUtc}</span>
                  <p className="xdr-sir-ctx">{row.context}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="xdr-sir-subh">Malicious domains</h3>
          {sir.maliciousDomains.length === 0 ? (
            <p className="dash-muted">None — internal or resolved-only traffic.</p>
          ) : (
            <ul className="xdr-sir-list">
              {sir.maliciousDomains.map((row) => (
                <li key={row.domain}>
                  <code className="xdr-sir-domain">{row.domain}</code>
                  <p className="xdr-sir-ctx">
                    {row.context} <span className="dash-muted">({row.observedVia})</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {sir.dnsQueriesSample.length > 0 ? (
        <div className="xdr-sir-dns">
          <h3 className="xdr-sir-subh">DNS queries (sample)</h3>
          <ul className="xdr-sir-dns-list">
            {sir.dnsQueriesSample.map((q) => (
              <li key={q}>
                <code>{q}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="xdr-sir-ttps">
        <h3 className="xdr-sir-subh">MITRE ATT&amp;CK (mapped)</h3>
        <ul className="xdr-sir-ttp-tags">
          {sir.ttps.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <p className="xdr-sir-intel">
        <strong>Intel / fusion:</strong> {sir.relatedIntelNote}
      </p>
    </section>
  );
}
