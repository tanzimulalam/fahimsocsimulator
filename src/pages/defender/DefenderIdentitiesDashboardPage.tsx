import { Link, useNavigate } from "react-router-dom";
import { useSimulator } from "../../context/SimulatorContext";
import { useLabState } from "../../lib/useLabState";
import { IdentityShield } from "../../components/defender/IdentityShield";
import {
  IDENTITY_HARDENING,
  IDENTITY_POSTURE,
  IDENTITY_POSTURE_KEY,
  initialIdentityPostureState,
  type IdentityPostureState,
} from "../../data/defenderIdentityPosture";

export function DefenderIdentitiesDashboardPage() {
  const { addNotification } = useSimulator();
  const navigate = useNavigate();
  const [state, setState] = useLabState<IdentityPostureState>(IDENTITY_POSTURE_KEY, initialIdentityPostureState);

  const p = IDENTITY_POSTURE;
  const visibleInsights = p.topInsights.filter((i) => !state.dismissedInsights.includes(i.id));

  const dismissInsight = (id: string) =>
    setState((prev) => ({ ...prev, dismissedInsights: [...new Set([...prev.dismissedInsights, id])] }));

  const toggleHardening = (id: string) =>
    setState((prev) => ({
      ...prev,
      hardeningDone: prev.hardeningDone.includes(id)
        ? prev.hardeningDone.filter((x) => x !== id)
        : [...prev.hardeningDone, id],
    }));

  const openInsight = (to?: string) => {
    if (!to) {
      addNotification("ITDR insight", "No risky lateral movement paths detected (simulated).");
      return;
    }
    addNotification("ITDR insight", "Opening filtered Users view (simulated).");
    navigate(to);
  };

  return (
    <div className="def-page">
      <div className="def-itdr-hero">
        <div className="def-itdr-intro">
          <h1>ITDR Dashboard</h1>
          <p className="dash-muted">
            This dynamic dashboard offers a centralized view of critical insights and real-time data about identity
            threat detection and response, helping you proactively monitor and manage potential identity-related
            security risks across cloud, on-premises, and hybrid identities.
          </p>
        </div>
        <IdentityShield cloud={p.population.cloud} onPrem={p.population.onPrem} hybrid={p.population.hybrid} />
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-h">Top insights</div>
        <div className="def-itdr-insights">
          {visibleInsights.length === 0 ? (
            <p className="dash-muted" style={{ padding: 12 }}>All insights acknowledged.</p>
          ) : null}
          {visibleInsights.map((ins) => (
            <div key={ins.id} className={"def-itdr-insight " + ins.severity}>
              <div className="def-itdr-insight-text">{ins.text}</div>
              <div className="def-itdr-insight-actions">
                {ins.cta ? <button className="link-btn" onClick={() => openInsight(ins.cta!.to)}>{ins.cta.label}</button> : null}
                {ins.severity === "warning" ? <button className="btn" onClick={() => dismissInsight(ins.id)}>Acknowledge</button> : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="def-home-grid" style={{ marginTop: 16 }}>
        <section className="def-card def-itdr-bottom">
          <h3>ITDR Deployment Health</h3>
          <p className="dash-muted" style={{ fontSize: 12 }}>
            Protect your identities and identity infrastructure with Microsoft Defender for Identity and Entra ID Protection.
          </p>
          {p.deploymentHealth.map((d) => (
            <div key={d.name} className="def-itdr-deploy-row">
              <span><span className={"conn-dot " + (d.status === "Healthy" ? "ok" : "stale")} />{d.name}</span>
              <span className="dash-muted" style={{ fontSize: 12 }}>{d.status}</span>
            </div>
          ))}
        </section>

        <section className="def-card def-itdr-bottom">
          <h3>Identity posture (Secure score)</h3>
          <div className="def-big" style={{ color: "#9ed6ff" }}>Identity: {p.identitySecureScorePct}%</div>
          <p className="dash-muted" style={{ fontSize: 12 }}>Identity secure score is a representation of your security posture.</p>
          <details className="def-itdr-reco">
            <summary>View recommendations</summary>
            <div style={{ marginTop: 8 }}>
              {IDENTITY_HARDENING.map((h) => (
                <label key={h.id} className="filter-check" style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input type="checkbox" checked={state.hardeningDone.includes(h.id)} onChange={() => toggleHardening(h.id)} />
                  <span style={{ textDecoration: state.hardeningDone.includes(h.id) ? "line-through" : "none", fontSize: 13 }}>{h.text}</span>
                </label>
              ))}
            </div>
          </details>
        </section>

        <section className="def-card def-itdr-bottom">
          <h3>Highly privileged identities</h3>
          <Link className="def-itdr-priv-row" to="/defender/identities/users?filter=globalAdmin">
            <span>Entra ID Global Admin</span><span className="badge-count high">{p.highlyPrivileged.globalAdmins}</span>
          </Link>
          <Link className="def-itdr-priv-row" to="/defender/identities/users?filter=securityAdmin">
            <span>Entra ID Security Administrator</span><span className="badge-count info">{p.highlyPrivileged.securityAdmins}</span>
          </Link>
          <Link className="def-itdr-priv-row" to="/defender/identities/users?filter=sensitive">
            <span>Tagged as sensitive</span><span className="badge-count info">{p.highlyPrivileged.taggedSensitive}</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
