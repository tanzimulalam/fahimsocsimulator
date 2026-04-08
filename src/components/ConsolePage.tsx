import type { ReactNode } from "react";

export function ConsolePage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="page-scroll">
      <div className="console-page-head">
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="console-subtitle">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}
