import { classroomApi } from "../lib/apiClient";
import { iocValues, MSISAC_DOMAINS, MSISAC_HASHES, MSISAC_IPS, MSISAC_URLS, MSISAC_WEEK2_DOMAINS } from "./msisacIocs";
import type { SnTicket } from "./serviceNowTickets";

export type AmpBlockEntryType = "domain" | "url" | "ip" | "hash";

export type AmpBlocklistEntry = {
  id: string;
  type: AmpBlockEntryType;
  value: string;
  source: string;
  blockedAt: string;
  ticketNumber?: string;
  status: "blocked" | "allowed";
};

export const AMP_BLOCKLIST_KEY = "amp-blocklist-v1";

function uid() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function entry(
  type: AmpBlockEntryType,
  value: string,
  source: string,
  blockedAt: string,
  ticketNumber?: string,
  status: "blocked" | "allowed" = "blocked"
): AmpBlocklistEntry {
  return { id: uid(), type, value, source, blockedAt, ticketNumber, status };
}

/** Baseline blocklist reflecting already-resolved MS-ISAC work and the hubspot false positive. */
export function getDefaultAmpBlocklist(): AmpBlocklistEntry[] {
  const ts2203 = "2026-05-26 04:42:21 PM";
  const tsHub = "2026-05-27 11:20:00 AM";
  const rows: AmpBlocklistEntry[] = [
    entry("domain", "hubspot.com", "Cisco Secure Endpoint — Web Filter", tsHub, "INC0162850"),
  ];
  iocValues(MSISAC_IPS).forEach((ip) => {
    rows.push(entry("ip", ip, "MS-ISAC IOC ingest (INC0162203)", ts2203, "INC0162203"));
  });
  iocValues(MSISAC_DOMAINS).forEach((d) => {
    rows.push(entry("domain", d, "MS-ISAC IOC ingest (INC0162203)", ts2203, "INC0162203"));
  });
  iocValues(MSISAC_URLS).forEach((u) => {
    rows.push(entry("url", u, "MS-ISAC IOC ingest (INC0162203)", ts2203, "INC0162203"));
  });
  iocValues(MSISAC_HASHES).forEach((h) => {
    rows.push(entry("hash", h, "MS-ISAC IOC ingest (INC0162203)", ts2203, "INC0162203"));
  });
  return rows;
}

export function loadAmpBlocklist(): AmpBlocklistEntry[] {
  const raw = localStorage.getItem(AMP_BLOCKLIST_KEY);
  if (!raw) return getDefaultAmpBlocklist();
  try {
    const parsed = JSON.parse(raw) as AmpBlocklistEntry[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultAmpBlocklist();
  } catch {
    return getDefaultAmpBlocklist();
  }
}

export function saveAmpBlocklist(entries: AmpBlocklistEntry[]) {
  localStorage.setItem(AMP_BLOCKLIST_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("amp-blocklist-updated"));
  if (classroomApi.enabled) {
    void classroomApi.putLabState("default", AMP_BLOCKLIST_KEY, entries).catch((err) => {
      console.warn("Failed to sync AMP blocklist.", err);
    });
  }
}

export function getBlockedEntries(): AmpBlocklistEntry[] {
  return loadAmpBlocklist().filter((e) => e.status === "blocked");
}

export function isBlocked(value: string, type?: AmpBlockEntryType): boolean {
  const v = value.toLowerCase();
  return getBlockedEntries().some(
    (e) => e.value.toLowerCase() === v && (type ? e.type === type : true)
  );
}

function mergeEntries(existing: AmpBlocklistEntry[], incoming: AmpBlocklistEntry[]): AmpBlocklistEntry[] {
  const map = new Map(existing.map((e) => [`${e.type}:${e.value.toLowerCase()}`, e]));
  for (const inc of incoming) {
    const key = `${inc.type}:${inc.value.toLowerCase()}`;
    map.set(key, { ...inc, id: map.get(key)?.id ?? inc.id });
  }
  return [...map.values()];
}

export function addBlocklistEntries(incoming: Omit<AmpBlocklistEntry, "id">[]): AmpBlocklistEntry[] {
  const withIds = incoming.map((e) => ({ ...e, id: uid() }));
  const merged = mergeEntries(loadAmpBlocklist(), withIds);
  saveAmpBlocklist(merged);
  return merged;
}

export function allowEntry(value: string, type?: AmpBlockEntryType): AmpBlocklistEntry[] {
  const v = value.toLowerCase();
  const next = loadAmpBlocklist().map((e) =>
    e.value.toLowerCase() === v && (type ? e.type === type : true) ? { ...e, status: "allowed" as const } : e
  );
  saveAmpBlocklist(next);
  return next;
}

/** Push ticket-linked IOCs into the shared AMP blocklist when a ticket is resolved. */
export function applyTicketBlocklist(ticket: SnTicket): AmpBlocklistEntry[] {
  const ts = ticket.resolvedAt ?? new Date().toLocaleString("en-US", { hour12: true });
  const incoming: Omit<AmpBlocklistEntry, "id">[] = [];

  if (ticket.ampBlocklist) {
    const src = `ServiceNow ${ticket.number}`;
    ticket.ampBlocklist.domains?.forEach((d) => incoming.push({ type: "domain", value: d, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
    ticket.ampBlocklist.urls?.forEach((u) => incoming.push({ type: "url", value: u, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
    ticket.ampBlocklist.ips?.forEach((ip) => incoming.push({ type: "ip", value: ip, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
    ticket.ampBlocklist.hashes?.forEach((h) => incoming.push({ type: "hash", value: h, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
  }

  if (ticket.importMsisacWeek === 1) {
    const src = `MS-ISAC IOC ingest (${ticket.number})`;
    iocValues(MSISAC_IPS).forEach((ip) => incoming.push({ type: "ip", value: ip, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
    iocValues(MSISAC_DOMAINS).forEach((d) => incoming.push({ type: "domain", value: d, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
    iocValues(MSISAC_URLS).forEach((u) => incoming.push({ type: "url", value: u, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
    iocValues(MSISAC_HASHES).forEach((h) => incoming.push({ type: "hash", value: h, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
  }

  if (ticket.importMsisacWeek === 2) {
    const src = `MS-ISAC IOC ingest (${ticket.number})`;
    iocValues(MSISAC_WEEK2_DOMAINS).forEach((d) => incoming.push({ type: "domain", value: d, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
    iocValues(MSISAC_IPS.slice(0, 6)).forEach((ip) => incoming.push({ type: "ip", value: ip, source: src, blockedAt: ts, ticketNumber: ticket.number, status: "blocked" }));
  }

  const notes = (ticket.resolutionNotes ?? "").toLowerCase();
  if (ticket.number === "INC0162850" && (notes.includes("false positive") || notes.includes("allow") || notes.includes("unblock"))) {
    return allowEntry("hubspot.com", "domain");
  }

  if (incoming.length === 0) return loadAmpBlocklist();
  return addBlocklistEntries(incoming);
}
