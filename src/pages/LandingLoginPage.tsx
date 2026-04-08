import { useState } from "react";

type Props = {
  onLogin: (username: string, password: string) => boolean;
};

export function LandingLoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const ok = onLogin(username.trim(), password);
    if (!ok) setError("Invalid credentials. Please contact your instructor.");
  }

  return (
    <div className="landing-wrap">
      <div className="landing-bg-glow" />
      <main className="landing-card">
        <h1>SOC Training Simulator</h1>
        <p className="landing-sub">
          Cisco AMP + Cisco XDR + Microsoft Defender for Endpoint lab environment
        </p>

        <section className="landing-accounts">
          <h3>Secure Access</h3>
          <p className="dash-muted">Use your assigned training credentials to continue.</p>
        </section>

        <div className="landing-form">
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </label>
          {error ? <p className="landing-error">{error}</p> : null}
          <button type="button" className="btn btn-primary" onClick={submit}>
            Enter Simulator
          </button>
        </div>
      </main>
    </div>
  );
}

