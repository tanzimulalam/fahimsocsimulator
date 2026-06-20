import { SHA256 } from "./publicMalwareSamples";
import type { SentinelSeverity } from "./sentinelData";

/**
 * Microsoft Sentinel incident catalog. Most incidents mirror the Defender XDR
 * catalog (linkedDefenderIncidentId set both ways) to teach the unified portal.
 * 3 incidents come from non-Microsoft connectors (AWS, Okta, Palo Alto) to teach
 * that Sentinel ingests beyond Microsoft. Deterministic — no randomness.
 */

export type SentinelStatus = "New" | "Active" | "Closed";

export type SentinelCloseClassification =
  | "Not set"
  | "True positive"
  | "Benign positive"
  | "False positive"
  | "Undetermined";

export type SentinelEntityType = "account" | "host" | "ip" | "url" | "filehash";

export interface SentinelEntity {
  type: SentinelEntityType;
  value: string;
}

export interface SentinelIncident {
  id: string;
  displayId: number;
  title: string;
  severity: SentinelSeverity;
  status: SentinelStatus;
  owner: string | null;
  tactics: string[];
  techniques: string[];
  alertCount: number;
  entities: SentinelEntity[];
  productNames: string[];
  analyticRuleId: string;
  created: string;
  lastUpdated: string;
  description: string;
  closeClassification: SentinelCloseClassification;
  linkedDefenderIncidentId?: string;
  linkedXdrIncidentId?: string;
}

const T = (iso: string) => iso;

export const SENTINEL_INCIDENTS: SentinelIncident[] = [
  {
    id: "SENT-3001",
    displayId: 30001,
    title: "Phishing delivery followed by AsyncRAT on HR-LAPTOP-04",
    severity: "High",
    status: "Active",
    owner: null,
    tactics: ["InitialAccess", "Execution", "CommandAndControl"],
    techniques: ["T1566.001", "T1059.001", "T1071.001"],
    alertCount: 3,
    entities: [
      { type: "host", value: "HR-LAPTOP-04" },
      { type: "account", value: "sarah.chen@contoso.com" },
      { type: "filehash", value: SHA256.ASYNC_RAT },
      { type: "ip", value: "185.234.218.116" },
      { type: "url", value: "onedrive-secure-preview.net" },
    ],
    productNames: ["Microsoft Defender XDR", "Microsoft Defender for Office 365"],
    analyticRuleId: "AR-0007",
    created: T("2026-05-29T11:45:00Z"),
    lastUpdated: T("2026-05-29T13:06:00Z"),
    description: "Microsoft Security rule imported a Defender for Office 365 phish alert; correlated with endpoint RAT execution.",
    closeClassification: "Not set",
    linkedDefenderIncidentId: "DINC-0001",
    linkedXdrIncidentId: "INC-XDR-001",
  },
  {
    id: "SENT-3002",
    displayId: 30002,
    title: "Emotet loader via macro document on SALES-VM-22",
    severity: "High",
    status: "Active",
    owner: null,
    tactics: ["InitialAccess", "Execution"],
    techniques: ["T1566.001", "T1204.002", "T1059.001"],
    alertCount: 2,
    entities: [
      { type: "host", value: "SALES-VM-22" },
      { type: "account", value: "d.patel@contoso.com" },
      { type: "filehash", value: SHA256.EMOTET },
      { type: "ip", value: "91.240.118.168" },
    ],
    productNames: ["Microsoft Defender XDR"],
    analyticRuleId: "AR-0007",
    created: T("2026-05-29T09:16:00Z"),
    lastUpdated: T("2026-05-29T09:52:00Z"),
    description: "Macro-enabled document spawned a PowerShell download cradle that fetched the Emotet payload.",
    closeClassification: "Not set",
    linkedDefenderIncidentId: "DINC-0002",
    linkedXdrIncidentId: "INC-XDR-005",
  },
  {
    id: "SENT-3003",
    displayId: 30003,
    title: "WannaCry ransomware with SMB propagation (finance)",
    severity: "High",
    status: "Active",
    owner: "Jordan Smith",
    tactics: ["LateralMovement", "Impact"],
    techniques: ["T1210", "T1486", "T1490"],
    alertCount: 3,
    entities: [
      { type: "host", value: "FIN-EXEC-01" },
      { type: "host", value: "FIN-WS-07" },
      { type: "filehash", value: SHA256.WANNACRY },
    ],
    productNames: ["Microsoft Defender XDR", "Palo Alto Networks"],
    analyticRuleId: "AR-0006",
    created: T("2026-05-27T19:32:00Z"),
    lastUpdated: T("2026-05-28T02:12:00Z"),
    description: "Mass file encryption and shadow-copy deletion with EternalBlue SMB exploitation across the finance VLAN.",
    closeClassification: "Not set",
    linkedDefenderIncidentId: "DINC-0003",
    linkedXdrIncidentId: "INC-XDR-004",
  },
  {
    id: "SENT-3004",
    displayId: 30004,
    title: "Credential theft: SAM/LSASS dump on POLC-MJ0LQLRR",
    severity: "Medium",
    status: "New",
    owner: null,
    tactics: ["CredentialAccess", "DefenseEvasion"],
    techniques: ["T1003.001", "T1003.002"],
    alertCount: 2,
    entities: [
      { type: "host", value: "POLC-MJ0LQLRR" },
      { type: "account", value: "dapqa@contoso.com" },
      { type: "ip", value: "151.101.65.91" },
    ],
    productNames: ["Microsoft Defender XDR", "Microsoft Defender for Identity"],
    analyticRuleId: "AR-0002",
    created: T("2026-05-29T05:14:00Z"),
    lastUpdated: T("2026-05-29T05:42:00Z"),
    description: "Registry hive export and suspected LSASS access flagged by Defender for Identity.",
    closeClassification: "Not set",
    linkedDefenderIncidentId: "DINC-0004",
    linkedXdrIncidentId: "INC-XDR-006",
  },
  {
    id: "SENT-3005",
    displayId: 30005,
    title: "Suspected Kerberoasting — anomalous TGS requests",
    severity: "Medium",
    status: "New",
    owner: null,
    tactics: ["CredentialAccess"],
    techniques: ["T1558.003"],
    alertCount: 1,
    entities: [
      { type: "host", value: "HR-VDI-12" },
      { type: "account", value: "hr.analyst@contoso.com" },
    ],
    productNames: ["Microsoft Defender for Identity"],
    analyticRuleId: "AR-0009",
    created: T("2026-05-29T06:07:00Z"),
    lastUpdated: T("2026-05-29T06:24:00Z"),
    description: "RC4 downgrade TGS request spike consistent with offline cracking preparation.",
    closeClassification: "Not set",
    linkedDefenderIncidentId: "DINC-0005",
    linkedXdrIncidentId: "INC-XDR-013",
  },
  {
    id: "SENT-3006",
    displayId: 30006,
    title: "Compromised account: MFA fatigue + impossible travel (elena.fisher)",
    severity: "High",
    status: "Active",
    owner: null,
    tactics: ["CredentialAccess", "InitialAccess"],
    techniques: ["T1621", "T1078.004"],
    alertCount: 2,
    entities: [
      { type: "account", value: "elena.fisher@contoso.com" },
      { type: "ip", value: "45.155.205.233" },
      { type: "ip", value: "203.0.113.54" },
    ],
    productNames: ["Microsoft Entra ID Protection"],
    analyticRuleId: "AR-0004",
    created: T("2026-05-29T02:20:00Z"),
    lastUpdated: T("2026-05-29T03:02:00Z"),
    description: "MFA fatigue approval followed by impossible-travel sign-ins and a malicious inbox rule.",
    closeClassification: "Not set",
    linkedDefenderIncidentId: "DINC-0006",
  },
  {
    id: "SENT-3007",
    displayId: 30007,
    title: "DNS tunneling exfiltration from RND-WS-09",
    severity: "Medium",
    status: "Active",
    owner: null,
    tactics: ["CommandAndControl", "Exfiltration"],
    techniques: ["T1071.004", "T1048.003"],
    alertCount: 1,
    entities: [
      { type: "host", value: "RND-WS-09" },
      { type: "url", value: "data.tunnel-c2.xyz" },
    ],
    productNames: ["Microsoft Defender XDR"],
    analyticRuleId: "AR-0010",
    created: T("2026-05-28T21:12:00Z"),
    lastUpdated: T("2026-05-29T01:32:00Z"),
    description: "High volume of long DNS queries to a single external domain.",
    closeClassification: "Not set",
    linkedDefenderIncidentId: "DINC-0007",
    linkedXdrIncidentId: "INC-XDR-018",
  },
  {
    id: "SENT-3008",
    displayId: 30008,
    title: "Risky OAuth consent grant to unverified app",
    severity: "Medium",
    status: "New",
    owner: null,
    tactics: ["Persistence", "CredentialAccess"],
    techniques: ["T1528", "T1098.003"],
    alertCount: 1,
    entities: [
      { type: "account", value: "p.nguyen@contoso.com" },
      { type: "url", value: "perfectdata-software.app" },
      { type: "ip", value: "104.21.5.178" },
    ],
    productNames: ["Microsoft Defender for Cloud Apps"],
    analyticRuleId: "AR-0008",
    created: T("2026-05-28T15:46:00Z"),
    lastUpdated: T("2026-05-28T16:04:00Z"),
    description: "User consented to an unverified app requesting Mail.ReadWrite and offline_access.",
    closeClassification: "Not set",
    linkedDefenderIncidentId: "DINC-0008",
  },
  {
    id: "SENT-3012",
    displayId: 30012,
    title: "Multi-stage intrusion: Log4Shell to domain admin (Fusion)",
    severity: "High",
    status: "Active",
    owner: "Fahim Tanzimul",
    tactics: ["InitialAccess", "Execution", "LateralMovement", "CredentialAccess", "CommandAndControl"],
    techniques: ["T1190", "T1059.001", "T1021.002", "T1003.001", "T1071.001"],
    alertCount: 4,
    entities: [
      { type: "host", value: "WEB-PROD-01" },
      { type: "host", value: "DC01" },
      { type: "account", value: "administrator@contoso.com" },
      { type: "ip", value: "203.0.113.47" },
    ],
    productNames: ["Microsoft Defender XDR", "Microsoft Defender for Identity", "Azure Activity"],
    analyticRuleId: "AR-0011",
    created: T("2026-05-28T11:05:00Z"),
    lastUpdated: T("2026-05-29T07:46:00Z"),
    description: "Fusion correlated Log4Shell exploitation, Cobalt Strike C2, PsExec lateral movement, and DC credential dumping into one high-confidence multi-stage incident.",
    closeClassification: "Not set",
    linkedDefenderIncidentId: "DINC-0012",
    linkedXdrIncidentId: "INC-XDR-020",
  },

  // ── Sentinel-only incidents from non-Microsoft connectors ──
  {
    id: "SENT-3013",
    displayId: 30013,
    // teaching: Sentinel ingests AWS CloudTrail — a source Defender XDR cannot see
    title: "AWS: console login from risky IP then access-key creation",
    severity: "High",
    status: "New",
    owner: null,
    tactics: ["Persistence", "PrivilegeEscalation"],
    techniques: ["T1078.004", "T1098.001"],
    alertCount: 1,
    entities: [
      { type: "account", value: "arn:aws:iam::44:user/deploy" },
      { type: "ip", value: "45.155.205.233" },
    ],
    productNames: ["Amazon Web Services"],
    analyticRuleId: "AR-0001",
    created: T("2026-05-29T16:22:00Z"),
    lastUpdated: T("2026-05-29T16:27:00Z"),
    description: "AWS CloudTrail shows a console login from a known-bad IP immediately followed by CreateAccessKey and a permissive bucket policy change.",
    closeClassification: "Not set",
  },
  {
    id: "SENT-3014",
    displayId: 30014,
    // teaching: Okta SSO source — third-party identity provider
    title: "Okta: suspicious MFA push spam against multiple users",
    severity: "Medium",
    status: "New",
    owner: null,
    tactics: ["CredentialAccess"],
    techniques: ["T1621"],
    alertCount: 1,
    entities: [
      { type: "account", value: "j.martin@contoso.com" },
      { type: "ip", value: "45.155.205.233" },
    ],
    productNames: ["Okta Single Sign-On"],
    analyticRuleId: "AR-0004",
    created: T("2026-05-29T17:30:00Z"),
    lastUpdated: T("2026-05-29T17:41:00Z"),
    description: "Okta system log shows repeated push challenges to several users from a single source — possible MFA bombing. Note the Okta connector is showing stale data.",
    closeClassification: "Not set",
  },
  {
    id: "SENT-3015",
    displayId: 30015,
    // teaching: Palo Alto firewall source — network-only detection
    title: "Palo Alto: outbound traffic to Cobalt Strike team server",
    severity: "Medium",
    status: "New",
    owner: null,
    tactics: ["CommandAndControl"],
    techniques: ["T1071.001"],
    alertCount: 1,
    entities: [
      { type: "ip", value: "203.0.113.47" },
      { type: "host", value: "WEB-PROD-01" },
    ],
    productNames: ["Palo Alto Networks"],
    analyticRuleId: "AR-0001",
    created: T("2026-05-28T11:41:00Z"),
    lastUpdated: T("2026-05-28T11:42:00Z"),
    description: "Perimeter firewall logged allowed outbound HTTPS to a known Cobalt Strike C2 — corroborates the Log4Shell multi-stage incident.",
    closeClassification: "Not set",
    linkedXdrIncidentId: "INC-XDR-020",
  },
  {
    id: "SENT-3016",
    displayId: 30016,
    title: "Cobalt Strike C2 beacon from SOC-TRAINING-01 to 203.0.113.47",
    severity: "High",
    status: "New",
    owner: null,
    tactics: ["CommandAndControl", "Execution"],
    techniques: ["T1071.001", "T1059.003"],
    alertCount: 2,
    entities: [
      { type: "host", value: "SOC-TRAINING-01" },
      { type: "ip", value: "203.0.113.47" },
      { type: "account", value: "trainee.analyst" },
      { type: "filehash", value: "c64cc0cb8a3793f77395ef02506b12a80f089602534f3fb036d0bd10d94f29ee" },
    ],
    productNames: ["Cisco Secure Endpoint", "CrowdStrike Falcon"],
    analyticRuleId: "AR-0001",
    created: T("2026-05-31T09:00:00Z"),
    lastUpdated: T("2026-05-31T09:31:00Z"),
    description: "Cisco Secure Endpoint and CrowdStrike Falcon both flagged named-pipe activity and HTTPS beaconing from SOC-TRAINING-01 to the known Cobalt Strike team server 203.0.113.47. Parent process: spoolsv.exe. Corroborate in XDR incident INC-XDR-011 and block the C2 IP in AMP.",
    closeClassification: "Not set",
    linkedXdrIncidentId: "INC-XDR-011",
  },
];

const SEV_ORDER: Record<SentinelSeverity, number> = { High: 0, Medium: 1, Low: 2, Informational: 3 };

export function compareSentinelIncidents(a: SentinelIncident, b: SentinelIncident): number {
  const s = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
  if (s !== 0) return s;
  return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
}

export function getSentinelIncident(id: string): SentinelIncident | undefined {
  return SENTINEL_INCIDENTS.find((i) => i.id === id);
}
