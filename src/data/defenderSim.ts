import type { Incident } from "../types";

export type DefenderAlert = {
  id: string;
  timeUtc: string;
  title: string;
  severity: "low" | "medium" | "high";
  entity: string;
  status: "new" | "active" | "resolved";
};

export function incidentTitle(i: Incident): string {
  return `Multi-stage incident involving Initial access & Execution on ${i.host.hostname}`;
}

export function buildAlerts(i: Incident): DefenderAlert[] {
  const out: DefenderAlert[] = [];
  for (const [idx, ev] of i.events.entries()) {
    out.push({
      id: `${i.id}-a-${idx}`,
      timeUtc: ev.timestampUtc,
      title: ev.eventType,
      severity: ev.severity === "critical" || ev.severity === "high" ? "high" : ev.severity === "medium" ? "medium" : "low",
      entity: ev.user ?? i.host.hostname,
      status: idx === 0 ? "active" : idx === 1 ? "new" : "resolved",
    });
  }
  return out;
}

