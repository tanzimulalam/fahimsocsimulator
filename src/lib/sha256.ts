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

/** 8–64 hex (partial paste from AMP UI) */
export function normalizeSha256Partial(input: string): string | null {
  const t = input.replace(/\s/g, "").toLowerCase();
  if (!/^[a-f0-9]{8,64}$/.test(t)) return null;
  return t;
}

export function findIncidentsBySha256Partial(incidents: Incident[], partial: string): Incident[] {
  const p = partial.toLowerCase();
  return incidents.filter((inc) => inc.events.some((ev) => fullShaFromEvent(ev).includes(p)));
}

/** Exact 64-char match, else prefix match, else substring match on any event hash */
export function findBestIncidentForShaQuery(incidents: Incident[], query: string): Incident | undefined {
  const full = normalizeSha256Input(query);
  if (full) return findIncidentBySha256(incidents, full);
  const part = normalizeSha256Partial(query);
  if (!part) return undefined;
  const byPrefix = incidents.filter((inc) => inc.events.some((ev) => fullShaFromEvent(ev).startsWith(part)));
  if (byPrefix.length >= 1) return byPrefix[0];
  const subs = findIncidentsBySha256Partial(incidents, part);
  return subs[0];
}

export function uniqueSha256sFromIncident(inc: Incident): string[] {
  const set = new Set<string>();
  for (const ev of inc.events) {
    set.add(fullShaFromEvent(ev));
  }
  return [...set];
}
