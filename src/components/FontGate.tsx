import { useEffect, useState, type ReactNode } from "react";

type Props = { children: ReactNode };

/**
 * Avoids Inter → system-font flash on first paint by waiting for font loading.
 */
export function FontGate({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="app-font-splash" role="status" aria-live="polite">
        <div className="app-font-splash-inner">
          <div className="app-font-splash-title">SOC Simulator</div>
          <div className="app-font-splash-sub">Loading…</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
