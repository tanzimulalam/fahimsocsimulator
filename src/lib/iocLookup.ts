import type { CompromiseEvent, Incident } from "../types";
import { simulatedVirusTotalLine } from "../data/publicMalwareSamples";
import { findIncidentsBySha256Partial, fullShaFromEvent, normalizeSha256Input, normalizeSha256Partial } from "./sha256";

export type IocVerdict = "Malicious" | "Suspicious" | "Unknown" | "Clean" | "Benign";

export type Sha256IocHit = {
  kind: "sha256";
  sha256: string;
  display: string;
  verdict: IocVerdict;
  ampDisposition: string;
  virusTotalSimulated: string;
  filename?: string;
  threatLabel?: string;
  incidentId: string;
  hostLine: string;
  hostname: string;
  eventType: string;
  timestampUtc: string;
};

export type IpIocHit = {
  kind: "ip";
  ip: string;
  verdict: IocVerdict;
  role: string;
  virusTotalSimulated: string;
  incidentId: string;
  hostLine: string;
  hostname: string;
  context: string;
};

function dispositionToVerdict(d: string | undefined): IocVerdict {
  const x = (d ?? "").toLowerCase();
  if (x.includes("malicious")) return "Malicious";
  if (x.includes("suspicious")) return "Suspicious";
  if (x.includes("clean") || x.includes("benign") || x.includes("signed")) return "Clean";
  if (x.includes("blocked") || x.includes("quarantine")) return "Suspicious";
  if (x === "unknown" || !x) return "Unknown";
  return "Unknown";
}

function vtForVerdict(v: IocVerdict, fullHash: string): string {
  const line = simulatedVirusTotalLine(fullHash);
  if (v === "Malicious") return `${line} (AMP: malicious)`;
  if (v === "Suspicious") return `${line} (AMP: suspicious)`;
  if (v === "Unknown") return `${line} (AMP: unknown disposition)`;
  if (v === "Clean" || v === "Benign") return line;
  return line;
}

function eventToShaHit(inc: Incident, ev: CompromiseEvent): Sha256IocHit {
  const sha256 = fullShaFromEvent(ev);
  const verdict = dispositionToVerdict(ev.disposition);
  return {
    kind: "sha256",
    sha256,
    display: `${sha256.slice(0, 16)}…${sha256.slice(-10)}`,
    verdict,
    ampDisposition: ev.disposition ?? "Unknown",
    virusTotalSimulated: vtForVerdict(verdict, sha256),
    filename: ev.filename,
    threatLabel: ev.detectionName,
    incidentId: inc.id,
    hostLine: inc.hostLine,
    hostname: inc.host.hostname,
    eventType: ev.eventType,
    timestampUtc: ev.timestampUtc,
  };
}

const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

export function collectSha256Hits(incidents: Incident[], partial: string): Sha256IocHit[] {
  const p = partial.toLowerCase();
  const hits: Sha256IocHit[] = [];
  const seen = new Set<string>();
  for (const inc of incidents) {
    for (const ev of inc.events) {
      const full = fullShaFromEvent(ev);
      if (!full.includes(p) && !full.startsWith(p)) continue;
      if (seen.has(`${inc.id}:${ev.id}`)) continue;
      seen.add(`${inc.id}:${ev.id}`);
      hits.push(eventToShaHit(inc, ev));
    }
  }
  return hits.slice(0, 24);
}

export function collectIpHits(incidents: Incident[], ip: string): IpIocHit[] {
  const hits: IpIocHit[] = [];
  const seen = new Set<string>();

  for (const inc of incidents) {
    const h = inc.host;
    const push = (addr: string, role: string, context: string, verdict: IocVerdict) => {
      if (addr !== ip) return;
      const k = `${inc.id}:${role}`;
      if (seen.has(k)) return;
      seen.add(k);
      hits.push({
        kind: "ip",
        ip,
        verdict,
        role,
        virusTotalSimulated:
      verdict === "Malicious"
        ? "Pivot this IPv4 on VirusTotal — community noise is common; corroborate with your SIR (simulated guidance)."
        : vtForVerdict(verdict, ""),
        incidentId: inc.id,
        hostLine: inc.hostLine,
        hostname: h.hostname,
        context,
      });
    };

    push(h.internalIp, "Internal (host)", "Managed endpoint address", "Benign");
    push(h.externalIp, "External (host egress)", "Connector-reported egress IP", "Unknown");

    for (const row of inc.xdrSir.maliciousIpv4) {
      if (row.ip === ip) {
        push(ip, "XDR / SIR observable", row.context, "Malicious");
      }
    }

    for (const ev of inc.events) {
      if (ev.remoteIp === ip) {
        push(ip, "Telemetry (remote)", `${ev.eventType} · ${ev.filename ?? "—"}`, dispositionToVerdict(ev.disposition));
      }
      if (ev.localIp === ip) {
        push(ip, "Telemetry (local)", ev.eventType, "Benign");
      }
    }
  }

  return hits;
}

/** AMP global search + training pivots */
export function lookupTrainingIocs(query: string, incidents: Incident[]): {
  shaHits: Sha256IocHit[];
  ipHits: IpIocHit[];
  ambiguousSha: boolean;
} {
  const raw = query.trim();
  if (!raw) return { shaHits: [], ipHits: [], ambiguousSha: false };

  const full = normalizeSha256Input(raw);
  const partial = normalizeSha256Partial(raw);
  const ip = raw.trim();
  const ipHits = IP_RE.test(ip) ? collectIpHits(incidents, ip) : [];

  if (full) {
    const hits = collectSha256Hits(incidents, full);
    return { shaHits: hits, ipHits, ambiguousSha: false };
  }
  if (partial && partial.length >= 8) {
    const hits = collectSha256Hits(incidents, partial);
    const amb = findIncidentsBySha256Partial(incidents, partial).length > 1 && partial.length < 32;
    return { shaHits: hits, ipHits, ambiguousSha: amb };
  }

  return { shaHits: [], ipHits, ambiguousSha: false };
}
