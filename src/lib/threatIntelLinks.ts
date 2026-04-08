/** External reputation lookups (training — opens real public sites with your IOC). */

export function virusTotalFileUrl(sha256: string): string {
  return `https://www.virustotal.com/gui/file/${sha256}`;
}

export function virusTotalIpUrl(ip: string): string {
  return `https://www.virustotal.com/gui/ip-address/${encodeURIComponent(ip)}`;
}

/** Cisco Talos Intelligence — reputation lookup (hash, IP, domain). */
export function talosReputationUrl(query: string): string {
  return `https://talosintelligence.com/reputation_center/lookup?search=${encodeURIComponent(query)}`;
}
