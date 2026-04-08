import type { CompromiseEvent, Incident } from "../types";

/** Normalize user paste: 64 hex chars only */
export function normalizeSha256Input(input: string): string | null {
  const t = input.replace(/\s/g, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(t)) return null;
  return t;
}

export function fullShaFromEvent(ev: CompromiseEvent): string {
  if (ev.sha256Full) return ev.sha256Full.toLowerCase();
  return `${ev.sha256Prefix}${"0".repeat(48)}${ev.sha256Suffix}`.slice(0, 64).toLowerCase();
}

export function findIncidentBySha256(incidents: Incident[], sha256: string): Incident | undefined {
  const n = sha256.toLowerCase();
  return incidents.find((inc) => inc.events.some((ev) => fullShaFromEvent(ev) === n));
}

export function uniqueSha256sFromIncident(inc: Incident): string[] {
  const set = new Set<string>();
  for (const ev of inc.events) {
    set.add(fullShaFromEvent(ev));
  }
  return [...set];
}
