/** Synthetic investigation graph — mixed severities, malware-styled nodes */

import type { IncidentXdrSir } from "../types";

export type NodeSeverity = "malicious" | "suspicious" | "common" | "unknown" | "clean";

export type InvestigationNode = {
  id: string;
  severity: NodeSeverity;
  label: string;
  sha256: string;
  shaDisplay: string;
  family: string;
  confidence: number;
  prevalence: "rare" | "uncommon" | "common";
  recommendation: "block_sha256" | "allow_sha256" | "isolate_host" | "block_ip" | "monitor_only";
  rationale: string;
};

const LABELS: Record<NodeSeverity, string[]> = {
  malicious: [
    "Malicious process",
    "Trojan dropper",
    "C2 beacon module",
    "Credential stealer",
    "Ransomware precursor",
    "Webshell payload",
    "Banker module",
  ],
  suspicious: [
    "Suspicious script",
    "Unsigned PowerShell child",
    "Rare LOLBin spawn",
    "Macro staging DLL",
    "RMM side-load",
  ],
  unknown: [
    "Unknown binary",
    "Low-prevalence file",
    "Packed PE (unknown)",
    "Unsigned driver candidate",
  ],
  common: [
    "Signed Windows binary",
    "Office updater",
    "Browser helper (common)",
    "Defender definition helper",
  ],
  clean: [
    "Known-good system file",
    "Microsoft-signed DLL",
    "Vendor-signed installer",
  ],
};

const FAMILIES: Record<NodeSeverity, string[]> = {
  malicious: ["QakBot", "Remcos", "AgentTesla", "LummaStealer", "DarkGate"],
  suspicious: ["PossiblyLoader", "ScriptDropper", "UnsignedRMM", "MacroStager"],
  unknown: ["Unknown.Packed", "Unknown.LowPrevalence", "Unknown.DriverCandidate"],
  common: ["KnownInstaller", "EnterpriseUpdater", "SignedUtility"],
  clean: ["MicrosoftSigned", "VendorSigned", "WhitelistedLibrary"],
};

function recommendationFor(severity: NodeSeverity, prevalence: "rare" | "uncommon" | "common") {
  if (severity === "malicious") return "block_sha256" as const;
  if (severity === "suspicious") return prevalence === "rare" ? "isolate_host" as const : "block_ip" as const;
  if (severity === "unknown") return "monitor_only" as const;
  if (severity === "common") return "allow_sha256" as const;
  return "allow_sha256" as const;
}

function normalizeSha(s: string): string {
  const t = s.replace(/\s/g, "").toLowerCase();
  if (t.length >= 64) return t.slice(0, 64);
  return t.padEnd(64, "0").slice(0, 64);
}

/** Deterministic PRNG for repeatable graphs per incident */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return h >>> 0;
}

function diversifySha(baseList: string[], i: number, seedStr: string): string {
  if (baseList.length === 0) return "0".repeat(64);
  const base = normalizeSha(baseList[i % baseList.length]);
  const rnd = mulberry32(hashSeed(seedStr + i + base.slice(0, 8)));
  const tail = Math.floor(rnd() * 0xffffffff).toString(16).padStart(8, "0");
  return (base.slice(0, 56) + tail).slice(0, 64);
}

/**
 * Build ~48 graph nodes: mix of verdicts, malware-themed labels, SHA tied to AMP hashes + deterministic variants.
 */
export function buildInvestigationNodes(sha256List: string[], seed: string): InvestigationNode[] {
  const count = 48;
  const nodes: InvestigationNode[] = [];
  const rng = mulberry32(hashSeed(seed || "xdr"));
  const bases = sha256List.length > 0 ? sha256List.map(normalizeSha) : ["757d4a22b6e952f3030be35b767dcdb0a25000000000000000000000000000000"];

  for (let i = 0; i < count; i++) {
    const roll = rng();
    let severity: NodeSeverity;
    if (roll < 0.28) severity = "malicious";
    else if (roll < 0.48) severity = "suspicious";
    else if (roll < 0.66) severity = "unknown";
    else if (roll < 0.82) severity = "common";
    else severity = "clean";

    const labels = LABELS[severity];
    const label = labels[i % labels.length];
    const full = diversifySha(bases, i, seed);
    const family = FAMILIES[severity][i % FAMILIES[severity].length];
    const prevalence = (rng() < 0.33 ? "rare" : rng() < 0.66 ? "uncommon" : "common") as "rare" | "uncommon" | "common";
    const confidence = Math.floor(55 + rng() * 44);
    const recommendation = recommendationFor(severity, prevalence);
    const rationale =
      severity === "malicious"
        ? `Behavioral chain aligns with ${family}: staged payload + outbound C2 over TLS. Confidence ${confidence}%.`
        : severity === "suspicious"
          ? `Partial overlap with ${family} techniques. Validate parent process and user context before final action.`
          : severity === "unknown"
            ? `Low-prevalence sample with incomplete intel. Monitor execution and enrich with sandbox/VT before block.`
            : severity === "common"
              ? `Signed and frequently observed enterprise utility (${family}); false positive risk is high.`
              : `Trusted baseline artifact (${family}) with stable prevalence and no malicious behavior.`;

    nodes.push({
      id: `node-${seed.slice(0, 8)}-${i}`,
      severity,
      label,
      sha256: full,
      shaDisplay: `${full.slice(0, 32)}…${full.slice(-8)}`,
      family,
      confidence,
      prevalence,
      recommendation,
      rationale,
    });
  }
  return nodes;
}

export function sirHeadline(sir: IncidentXdrSir): string {
  return `${sir.sirId} — ${sir.sirTitle}`;
}
