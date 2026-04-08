export type IncidentStatus = "requires_attention" | "in_progress" | "resolved";

export type Severity = "low" | "medium" | "high" | "critical";

export interface CompromiseEvent {
  id: string;
  severity: Severity;
  eventType: string;
  sha256Prefix: string;
  sha256Suffix: string;
  /** Full 64-char hex for training copy/search */
  sha256Full?: string;
  timestampUtc: string;
  filename?: string;
  disposition?: string;
  /** Realistic telemetry for the Events drill-down */
  filePath?: string;
  processPath?: string;
  parentProcess?: string;
  commandLine?: string;
  user?: string;
  localIp?: string;
  remoteIp?: string;
  remotePort?: string;
  direction?: "inbound" | "outbound" | "local";
  relatedUrl?: string;
}

export interface HostInfo {
  hostname: string;
  os: string;
  connectorVersion: string;
  installDateUtc: string;
  connectorGuid: string;
  processorId: string;
  definitionsLastUpdatedUtc: string;
  ciscoSecureClientId: string;
  group: string;
  policy: string;
  internalIp: string;
  externalIp: string;
  lastSeenUtc: string;
  definitionVersion: string;
  updateServer: string;
  riskScore: number;
}

/** Rich XDR / MS-ISAC narrative for Investigate — unique per lab incident */
export interface IncidentXdrSir {
  sirId: string;
  sirTitle: string;
  msisacFeedId: string;
  sectorContext: string;
  firstSeenUtc: string;
  lastObservedUtc: string;
  narrative: string;
  maliciousIpv4: { ip: string; context: string; firstSeenUtc: string }[];
  maliciousDomains: { domain: string; context: string; observedVia: string }[];
  dnsQueriesSample: string[];
  ttps: string[];
  relatedIntelNote: string;
}

export interface Incident {
  id: string;
  status: IncidentStatus;
  hostLine: string;
  groupName: string;
  eventCount: number;
  recordCount: number;
  host: HostInfo;
  events: CompromiseEvent[];
  vulnerabilitiesNote: string;
  /** Cisco XDR / MS-ISAC–style case file for Investigate */
  xdrSir: IncidentXdrSir;
}

export interface ObservableRow {
  id: string;
  type: string;
  hash: string;
  /** Full SHA-256 for modals / copy */
  fullHash: string;
  count: number;
  variant: "high" | "info";
}

export interface EventTypeRow {
  severity: Severity;
  name: string;
  count: number;
  maxInDataset: number;
}

export interface TreemapGroup {
  id: string;
  label: string;
  weight: number;
}

export type ScanStatus = "idle" | "scanning" | "clean" | "threats_found";

export interface IncidentScanState {
  status: ScanStatus;
  mode?: "full" | "flash";
  startedAt?: number;
  completedAt?: number;
}

export interface AnalystComment {
  id: string;
  text: string;
  at: number;
  author: string;
}

export interface IncidentWork {
  scan: IncidentScanState;
  comments: AnalystComment[];
}
