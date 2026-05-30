import { SHA256 } from "./publicMalwareSamples";

/**
 * First-class Microsoft Defender XDR incident catalog.
 * Derived from the Cisco XDR incident catalog (src/data/xdrIncidents.ts) so the
 * three tools (AMP / XDR / Defender / Sentinel) tell one consistent story, but
 * modeled with proper Microsoft Defender semantics.
 *
 * All hashes are real public SHA-256 references from publicMalwareSamples.ts so
 * simulatedVirusTotalLine() verdicts line up. CVEs and MITRE technique IDs are real.
 */

export type DefenderWorkload = "Endpoint" | "Email" | "Identity" | "CloudApps";
export type DefenderSeverity = "High" | "Medium" | "Low" | "Informational";
export type DefenderIncidentStatus = "Active" | "In progress" | "Resolved" | "Redirected";
export type DefenderClassification =
  | "Not set"
  | "True positive"
  | "Informational, expected activity"
  | "False positive";
export type DefenderDetermination =
  | "Not set"
  | "Malware"
  | "Phishing"
  | "Compromised account"
  | "Multi-stage attack"
  | "Malicious user activity"
  | "Unwanted software"
  | "Security testing";

export type EvidenceVerdict = "malicious" | "suspicious" | "clean" | "unknown";

export interface DefenderAlertRecord {
  id: string;
  title: string;
  severity: DefenderSeverity;
  category: string;
  mitreTechniques: string[];
  detectionSource: string;
  serviceSource: DefenderWorkload;
  entities: string[];
  firstActivity: string;
  status: "New" | "In progress" | "Resolved";
  /** Optional: matching Sentinel analytic rule reference (teaching cross-link). */
  sentinelAnalyticRuleId?: string;
}

export interface DefenderDeviceRef {
  name: string;
  riskLevel: DefenderSeverity;
  os: string;
}

export interface DefenderUserRef {
  upn: string;
  riskLevel: DefenderSeverity;
}

export interface DefenderFileEvidence {
  sha256: string;
  filename: string;
  verdict: EvidenceVerdict;
}

export interface DefenderIpEvidence {
  ip: string;
  verdict: EvidenceVerdict;
  role: string;
}

export interface DefenderUrlEvidence {
  url: string;
  verdict: EvidenceVerdict;
}

export interface DefenderAttackStoryStep {
  step: number;
  time: string;
  text: string;
  workload: DefenderWorkload;
}

export interface DefenderIncidentRecord {
  id: string;
  displayId: number;
  title: string;
  severity: DefenderSeverity;
  status: DefenderIncidentStatus;
  classification: DefenderClassification;
  determination: DefenderDetermination;
  assignedTo: string | null;
  workloads: DefenderWorkload[];
  tactics: string[];
  techniques: string[];
  firstActivity: string;
  lastActivity: string;
  devices: DefenderDeviceRef[];
  users: DefenderUserRef[];
  mailboxes: { upn: string }[];
  fileEvidence: DefenderFileEvidence[];
  ipEvidence: DefenderIpEvidence[];
  urlEvidence: DefenderUrlEvidence[];
  cves: string[];
  alerts: DefenderAlertRecord[];
  attackStory: DefenderAttackStoryStep[];
  // ── cross-tool linkage (the integration spine) ──
  linkedXdrIncidentId?: string;
  linkedSentinelIncidentId?: string;
  linkedEmailMailId?: string;
}

// Stable UTC timestamps (deterministic — never randomized on reload).
const T = (iso: string) => iso;

export const DEFENDER_INCIDENTS: DefenderIncidentRecord[] = [
  // 1. Phishing → AsyncRAT (Endpoint + Email)
  {
    id: "DINC-0001",
    displayId: 235601,
    title: "Multi-stage incident: phishing delivery followed by AsyncRAT on one endpoint",
    severity: "High",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["Email", "Endpoint"],
    tactics: ["Initial Access", "Execution", "Command and Control"],
    techniques: ["T1566.001", "T1059.001", "T1071.001"],
    firstActivity: T("2026-05-29T11:42:00Z"),
    lastActivity: T("2026-05-29T13:05:00Z"),
    devices: [{ name: "HR-LAPTOP-04", riskLevel: "High", os: "Windows 11 23H2" }],
    users: [{ upn: "sarah.chen@contoso.com", riskLevel: "Medium" }],
    mailboxes: [{ upn: "liam.walker@contoso.com" }],
    fileEvidence: [{ sha256: SHA256.ASYNC_RAT, filename: "AsyncRAT.exe", verdict: "malicious" }],
    ipEvidence: [{ ip: "185.234.218.116", verdict: "malicious", role: "C2 beacon (port 6606)" }],
    urlEvidence: [{ url: "http://onedrive-secure-preview.net/doc", verdict: "malicious" }],
    cves: [],
    alerts: [
      {
        id: "DA-0001",
        title: "HTML smuggling dropper detected in inbound email",
        severity: "High",
        category: "InitialAccess",
        mitreTechniques: ["T1566.001"],
        detectionSource: "Microsoft Defender for Office 365",
        serviceSource: "Email",
        entities: ["liam.walker@contoso.com", "onedrive-secure-preview.net"],
        firstActivity: T("2026-05-29T11:42:00Z"),
        status: "New",
        sentinelAnalyticRuleId: "AR-0007",
      },
      {
        id: "DA-0002",
        title: "Suspicious mshta.exe spawned a remote access tool",
        severity: "High",
        category: "Execution",
        mitreTechniques: ["T1059.001", "T1218.005"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["HR-LAPTOP-04", "mshta.exe", "AsyncRAT.exe"],
        firstActivity: T("2026-05-29T12:58:00Z"),
        status: "New",
      },
      {
        id: "DA-0003",
        title: "Outbound C2 connection to known malicious IP",
        severity: "Medium",
        category: "CommandAndControl",
        mitreTechniques: ["T1071.001"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["HR-LAPTOP-04", "185.234.218.116"],
        firstActivity: T("2026-05-29T13:05:00Z"),
        status: "New",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-29T11:42:00Z"), text: "Phishing email with HTML-smuggling link delivered to liam.walker@contoso.com.", workload: "Email" },
      { step: 2, time: T("2026-05-29T12:55:00Z"), text: "User opened the link; mshta.exe executed remote scriptlet.", workload: "Endpoint" },
      { step: 3, time: T("2026-05-29T12:58:00Z"), text: "AsyncRAT.exe written to disk and launched on HR-LAPTOP-04.", workload: "Endpoint" },
      { step: 4, time: T("2026-05-29T13:05:00Z"), text: "Beacon established to 185.234.218.116 on port 6606.", workload: "Endpoint" },
    ],
    linkedXdrIncidentId: "INC-XDR-001",
    linkedSentinelIncidentId: "SENT-3001",
    linkedEmailMailId: "m9",
  },

  // 2. Emotet macro (Endpoint + Email)
  {
    id: "DINC-0002",
    displayId: 235602,
    title: "Emotet loader delivered via macro-enabled document on SALES-VM-22",
    severity: "High",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["Email", "Endpoint"],
    tactics: ["Initial Access", "Execution"],
    techniques: ["T1566.001", "T1204.002", "T1059.001"],
    firstActivity: T("2026-05-29T09:14:00Z"),
    lastActivity: T("2026-05-29T09:51:00Z"),
    devices: [{ name: "SALES-VM-22", riskLevel: "High", os: "Windows 10 22H2" }],
    users: [{ upn: "d.patel@contoso.com", riskLevel: "Medium" }],
    mailboxes: [{ upn: "lucas.king@contoso.com" }],
    fileEvidence: [{ sha256: SHA256.EMOTET, filename: "Expense-Rejection.docm", verdict: "malicious" }],
    ipEvidence: [{ ip: "91.240.118.168", verdict: "malicious", role: "Payload download server" }],
    urlEvidence: [{ url: "http://expense-review-download.biz/open", verdict: "malicious" }],
    cves: [],
    alerts: [
      {
        id: "DA-0004",
        title: "Macro-enabled document blocked at delivery",
        severity: "Medium",
        category: "InitialAccess",
        mitreTechniques: ["T1566.001"],
        detectionSource: "Microsoft Defender for Office 365",
        serviceSource: "Email",
        entities: ["lucas.king@contoso.com", "Expense-Rejection.docm"],
        firstActivity: T("2026-05-29T09:14:00Z"),
        status: "New",
      },
      {
        id: "DA-0005",
        title: "WINWORD.EXE launched PowerShell download cradle",
        severity: "High",
        category: "Execution",
        mitreTechniques: ["T1059.001", "T1204.002"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["SALES-VM-22", "winword.exe", "powershell.exe"],
        firstActivity: T("2026-05-29T09:48:00Z"),
        status: "New",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-29T09:14:00Z"), text: "Macro document delivered to lucas.king@contoso.com.", workload: "Email" },
      { step: 2, time: T("2026-05-29T09:47:00Z"), text: "User enabled content; winword.exe spawned powershell.exe.", workload: "Endpoint" },
      { step: 3, time: T("2026-05-29T09:48:00Z"), text: "PowerShell download cradle fetched Emotet payload.", workload: "Endpoint" },
      { step: 4, time: T("2026-05-29T09:51:00Z"), text: "Emotet DLL contacted 91.240.118.168.", workload: "Endpoint" },
    ],
    linkedXdrIncidentId: "INC-XDR-005",
    linkedSentinelIncidentId: "SENT-3002",
    linkedEmailMailId: "m14",
  },

  // 3. WannaCry / SMB (Endpoint)
  {
    id: "DINC-0003",
    displayId: 235603,
    title: "WannaCry ransomware with SMB propagation on the finance segment",
    severity: "High",
    status: "In progress",
    classification: "True positive",
    determination: "Malware",
    assignedTo: "Jordan Smith",
    workloads: ["Endpoint"],
    tactics: ["Lateral Movement", "Impact"],
    techniques: ["T1210", "T1486", "T1490"],
    firstActivity: T("2026-05-27T19:30:00Z"),
    lastActivity: T("2026-05-28T02:10:00Z"),
    devices: [
      { name: "FIN-EXEC-01", riskLevel: "High", os: "Windows Server 2016" },
      { name: "FIN-WS-07", riskLevel: "Medium", os: "Windows 10 21H2" },
    ],
    users: [{ upn: "m.rodriguez@contoso.com", riskLevel: "Medium" }],
    mailboxes: [],
    fileEvidence: [
      { sha256: SHA256.WANNACRY, filename: "@WanaDecryptor@.exe", verdict: "malicious" },
    ],
    ipEvidence: [],
    urlEvidence: [],
    cves: ["CVE-2017-0144"],
    alerts: [
      {
        id: "DA-0006",
        title: "Ransomware behavior detected: mass file encryption",
        severity: "High",
        category: "Ransomware",
        mitreTechniques: ["T1486"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["FIN-EXEC-01", "@WanaDecryptor@.exe"],
        firstActivity: T("2026-05-27T19:30:00Z"),
        status: "In progress",
      },
      {
        id: "DA-0007",
        title: "Shadow copies deleted (vssadmin)",
        severity: "High",
        category: "Impact",
        mitreTechniques: ["T1490"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["FIN-EXEC-01", "vssadmin.exe"],
        firstActivity: T("2026-05-27T19:32:00Z"),
        status: "In progress",
      },
      {
        id: "DA-0008",
        title: "SMB exploitation attempt (EternalBlue pattern)",
        severity: "High",
        category: "LateralMovement",
        mitreTechniques: ["T1210"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["FIN-EXEC-01", "FIN-WS-07", "445/tcp"],
        firstActivity: T("2026-05-27T19:40:00Z"),
        status: "In progress",
        sentinelAnalyticRuleId: "AR-0006",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-27T19:30:00Z"), text: "WannaCry executed on FIN-EXEC-01 and began encrypting files.", workload: "Endpoint" },
      { step: 2, time: T("2026-05-27T19:32:00Z"), text: "vssadmin delete shadows executed to inhibit recovery.", workload: "Endpoint" },
      { step: 3, time: T("2026-05-27T19:40:00Z"), text: "SMB exploitation attempts (CVE-2017-0144) seen toward finance VLAN.", workload: "Endpoint" },
    ],
    linkedXdrIncidentId: "INC-XDR-004",
    linkedSentinelIncidentId: "SENT-3003",
  },

  // 4. Mimikatz credential dump (Endpoint + Identity)
  {
    id: "DINC-0004",
    displayId: 235604,
    title: "Credential theft: LSASS/SAM hive dump on POLC-MJ0LQLRR",
    severity: "Medium",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["Endpoint", "Identity"],
    tactics: ["Credential Access", "Defense Evasion"],
    techniques: ["T1003.001", "T1003.002", "T1218.005"],
    firstActivity: T("2026-05-29T05:12:00Z"),
    lastActivity: T("2026-05-29T05:40:00Z"),
    devices: [{ name: "POLC-MJ0LQLRR", riskLevel: "High", os: "Windows 11 23H2" }],
    users: [
      { upn: "dapqa@contoso.com", riskLevel: "High" },
      { upn: "crowduser@contoso.com", riskLevel: "Medium" },
    ],
    mailboxes: [],
    fileEvidence: [
      { sha256: SHA256.GENERIC_HACKTOOL, filename: "m.exe (mimikatz)", verdict: "suspicious" },
    ],
    ipEvidence: [{ ip: "151.101.65.91", verdict: "suspicious", role: "mshta download (Fastly CDN)" }],
    urlEvidence: [],
    cves: [],
    alerts: [
      {
        id: "DA-0009",
        title: "Sensitive registry hive dump (reg save HKLM\\SYSTEM)",
        severity: "High",
        category: "CredentialAccess",
        mitreTechniques: ["T1003.002"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["POLC-MJ0LQLRR", "reg.exe", "dapqa"],
        firstActivity: T("2026-05-29T05:12:00Z"),
        status: "New",
      },
      {
        id: "DA-0010",
        title: "Possible LSASS credential dump",
        severity: "Medium",
        category: "CredentialAccess",
        mitreTechniques: ["T1003.001"],
        detectionSource: "Microsoft Defender for Identity",
        serviceSource: "Identity",
        entities: ["dapqa", "crowduser"],
        firstActivity: T("2026-05-29T05:30:00Z"),
        status: "New",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-29T05:12:00Z"), text: "dapqa ran reg.exe save HKLM\\SYSTEM to capture credentials.", workload: "Endpoint" },
      { step: 2, time: T("2026-05-29T05:30:00Z"), text: "Defender for Identity flagged anomalous credential access.", workload: "Identity" },
      { step: 3, time: T("2026-05-29T05:40:00Z"), text: "mshta.exe spawned by explorer.exe and reached 151.101.65.91.", workload: "Endpoint" },
    ],
    linkedXdrIncidentId: "INC-XDR-006",
    linkedSentinelIncidentId: "SENT-3004",
  },

  // 5. Kerberoasting (Identity)
  {
    id: "DINC-0005",
    displayId: 235605,
    title: "Kerberoasting: anomalous TGS requests for service accounts",
    severity: "Medium",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["Identity"],
    tactics: ["Credential Access"],
    techniques: ["T1558.003"],
    firstActivity: T("2026-05-29T06:05:00Z"),
    lastActivity: T("2026-05-29T06:22:00Z"),
    devices: [{ name: "HR-VDI-12", riskLevel: "Medium", os: "Windows 10 22H2" }],
    users: [{ upn: "hr.analyst@contoso.com", riskLevel: "Medium" }],
    mailboxes: [],
    fileEvidence: [],
    ipEvidence: [],
    urlEvidence: [],
    cves: [],
    alerts: [
      {
        id: "DA-0011",
        title: "Suspected Kerberoasting (RC4 downgrade, Event 4769 spike)",
        severity: "Medium",
        category: "CredentialAccess",
        mitreTechniques: ["T1558.003"],
        detectionSource: "Microsoft Defender for Identity",
        serviceSource: "Identity",
        entities: ["hr.analyst", "svc_sql", "svc_backup", "svc_exchange"],
        firstActivity: T("2026-05-29T06:05:00Z"),
        status: "New",
        sentinelAnalyticRuleId: "AR-0009",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-29T06:05:00Z"), text: "Burst of Kerberos TGS requests for SPNs from HR-VDI-12.", workload: "Identity" },
      { step: 2, time: T("2026-05-29T06:22:00Z"), text: "RC4-HMAC downgrade observed — consistent with offline cracking prep.", workload: "Identity" },
    ],
    linkedXdrIncidentId: "INC-XDR-013",
    linkedSentinelIncidentId: "SENT-3005",
  },

  // 6. MFA fatigue / compromised account (Identity)
  {
    id: "DINC-0006",
    displayId: 235606,
    title: "Compromised account: MFA fatigue and impossible travel for elena.fisher",
    severity: "High",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["Identity"],
    tactics: ["Credential Access", "Initial Access"],
    techniques: ["T1621", "T1110.003", "T1078.004"],
    firstActivity: T("2026-05-29T02:18:00Z"),
    lastActivity: T("2026-05-29T03:01:00Z"),
    devices: [],
    users: [{ upn: "elena.fisher@contoso.com", riskLevel: "High" }],
    mailboxes: [{ upn: "elena.fisher@contoso.com" }],
    fileEvidence: [],
    ipEvidence: [
      { ip: "45.155.205.233", verdict: "malicious", role: "Sign-in source (Lagos, NG)" },
      { ip: "203.0.113.54", verdict: "suspicious", role: "Second source (Frankfurt, DE)" },
    ],
    urlEvidence: [],
    cves: [],
    alerts: [
      {
        id: "DA-0012",
        title: "Multiple failed MFA prompts followed by approval (MFA fatigue)",
        severity: "High",
        category: "CredentialAccess",
        mitreTechniques: ["T1621"],
        detectionSource: "Microsoft Entra ID Protection",
        serviceSource: "Identity",
        entities: ["elena.fisher", "45.155.205.233"],
        firstActivity: T("2026-05-29T02:18:00Z"),
        status: "New",
        sentinelAnalyticRuleId: "AR-0004",
      },
      {
        id: "DA-0013",
        title: "Impossible travel sign-in",
        severity: "High",
        category: "InitialAccess",
        mitreTechniques: ["T1078.004"],
        detectionSource: "Microsoft Entra ID Protection",
        serviceSource: "Identity",
        entities: ["elena.fisher", "45.155.205.233", "203.0.113.54"],
        firstActivity: T("2026-05-29T02:55:00Z"),
        status: "New",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-29T02:18:00Z"), text: "Repeated MFA push requests from 45.155.205.233.", workload: "Identity" },
      { step: 2, time: T("2026-05-29T02:50:00Z"), text: "User approved a push under fatigue; session token issued.", workload: "Identity" },
      { step: 3, time: T("2026-05-29T02:55:00Z"), text: "Impossible travel: sign-ins from NG then DE within minutes.", workload: "Identity" },
      { step: 4, time: T("2026-05-29T03:01:00Z"), text: "Inbox rule created to auto-forward finance mail (collection).", workload: "Identity" },
    ],
    linkedSentinelIncidentId: "SENT-3006",
  },

  // 7. DNS tunneling exfil (Endpoint)
  {
    id: "DINC-0007",
    displayId: 235607,
    title: "DNS tunneling exfiltration from RND-WS-09",
    severity: "Medium",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["Endpoint"],
    tactics: ["Command and Control", "Exfiltration"],
    techniques: ["T1071.004", "T1048.003"],
    firstActivity: T("2026-05-28T21:10:00Z"),
    lastActivity: T("2026-05-29T01:30:00Z"),
    devices: [{ name: "RND-WS-09", riskLevel: "Medium", os: "Windows 11 23H2" }],
    users: [{ upn: "k.osei@contoso.com", riskLevel: "Low" }],
    mailboxes: [],
    fileEvidence: [],
    ipEvidence: [],
    urlEvidence: [{ url: "data.tunnel-c2.xyz", verdict: "malicious" }],
    cves: [],
    alerts: [
      {
        id: "DA-0014",
        title: "Anomalous DNS query volume with long subdomains",
        severity: "Medium",
        category: "Exfiltration",
        mitreTechniques: ["T1071.004", "T1048.003"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["RND-WS-09", "data.tunnel-c2.xyz"],
        firstActivity: T("2026-05-28T21:10:00Z"),
        status: "New",
        sentinelAnalyticRuleId: "AR-0010",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-28T21:10:00Z"), text: "RND-WS-09 began emitting unusually long DNS queries (>200 chars).", workload: "Endpoint" },
      { step: 2, time: T("2026-05-29T01:30:00Z"), text: "14,200 queries to data.tunnel-c2.xyz — DNS tunneling pattern.", workload: "Endpoint" },
    ],
    linkedXdrIncidentId: "INC-XDR-018",
    linkedSentinelIncidentId: "SENT-3007",
  },

  // 8. Cloud Apps risky OAuth (CloudApps)
  {
    id: "DINC-0008",
    displayId: 235608,
    title: "Risky OAuth consent grant to unverified third-party app",
    severity: "Medium",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["CloudApps", "Identity"],
    tactics: ["Persistence", "Credential Access"],
    techniques: ["T1528", "T1098.003"],
    firstActivity: T("2026-05-28T15:44:00Z"),
    lastActivity: T("2026-05-28T16:02:00Z"),
    devices: [],
    users: [{ upn: "p.nguyen@contoso.com", riskLevel: "Medium" }],
    mailboxes: [{ upn: "p.nguyen@contoso.com" }],
    fileEvidence: [],
    ipEvidence: [{ ip: "104.21.5.178", verdict: "suspicious", role: "OAuth app callback host" }],
    urlEvidence: [{ url: "https://perfectdata-software.app/oauth/callback", verdict: "suspicious" }],
    cves: [],
    alerts: [
      {
        id: "DA-0015",
        title: "Unverified app granted mailbox read/write via OAuth",
        severity: "Medium",
        category: "Persistence",
        mitreTechniques: ["T1528"],
        detectionSource: "Microsoft Defender for Cloud Apps",
        serviceSource: "CloudApps",
        entities: ["p.nguyen", "PerfectData Software"],
        firstActivity: T("2026-05-28T15:44:00Z"),
        status: "New",
        sentinelAnalyticRuleId: "AR-0008",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-28T15:44:00Z"), text: "User consented to 'PerfectData Software' requesting Mail.ReadWrite + offline_access.", workload: "CloudApps" },
      { step: 2, time: T("2026-05-28T16:02:00Z"), text: "App registered a refresh token (persistence via OAuth).", workload: "Identity" },
    ],
    linkedSentinelIncidentId: "SENT-3008",
  },

  // 9. BENIGN false-positive drill: EICAR test file
  {
    id: "DINC-0009",
    displayId: 235609,
    // triage drill: EICAR is the harmless AV test file — looks scary but is authorized testing
    title: "EICAR test file detected on analyst workstation",
    severity: "Informational",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["Endpoint"],
    tactics: ["Execution"],
    techniques: ["T1204.002"],
    firstActivity: T("2026-05-29T14:00:00Z"),
    lastActivity: T("2026-05-29T14:00:00Z"),
    devices: [{ name: "SOC-ANALYST-02", riskLevel: "Informational", os: "Windows 11 23H2" }],
    users: [{ upn: "intern.soc@contoso.com", riskLevel: "Low" }],
    mailboxes: [],
    fileEvidence: [{ sha256: SHA256.EICAR, filename: "eicar.com", verdict: "suspicious" }],
    ipEvidence: [],
    urlEvidence: [],
    cves: [],
    alerts: [
      {
        id: "DA-0016",
        title: "EICAR-Test-File (not a virus) detected",
        severity: "Informational",
        category: "Execution",
        mitreTechniques: ["T1204.002"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["SOC-ANALYST-02", "eicar.com"],
        firstActivity: T("2026-05-29T14:00:00Z"),
        status: "New",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-29T14:00:00Z"), text: "Analyst saved the EICAR test string while validating AV. Authorized security testing — expected to classify as Informational / Security testing.", workload: "Endpoint" },
    ],
  },

  // 10. BENIGN false-positive drill: legitimate IT tool flagged
  {
    id: "DINC-0010",
    displayId: 235610,
    // triage drill: Dell SupportAssist is signed/legit but unfamiliar — false positive practice
    title: "Unfamiliar but signed support tool flagged on IT workstation",
    severity: "Low",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["Endpoint"],
    tactics: ["Execution"],
    techniques: ["T1059"],
    firstActivity: T("2026-05-29T08:20:00Z"),
    lastActivity: T("2026-05-29T08:21:00Z"),
    devices: [{ name: "IT-DESK-15", riskLevel: "Low", os: "Windows 11 23H2" }],
    users: [{ upn: "h.singh@contoso.com", riskLevel: "Low" }],
    mailboxes: [],
    fileEvidence: [{ sha256: SHA256.DELL_SUPPORT_ASSIST, filename: "SupportAssist.exe", verdict: "clean" }],
    ipEvidence: [],
    urlEvidence: [],
    cves: [],
    alerts: [
      {
        id: "DA-0017",
        title: "Behavioral alert: vendor tool spawned diagnostic scripts",
        severity: "Low",
        category: "Execution",
        mitreTechniques: ["T1059"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["IT-DESK-15", "SupportAssist.exe"],
        firstActivity: T("2026-05-29T08:20:00Z"),
        status: "New",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-29T08:20:00Z"), text: "Dell SupportAssist ran diagnostics. Signed, ~0/70 on VirusTotal — expected to classify as False positive / expected activity.", workload: "Endpoint" },
    ],
  },

  // 11. BENIGN false-positive drill: bulk email quarantined
  {
    id: "DINC-0011",
    displayId: 235611,
    // triage drill: legitimate Microsoft digest over-flagged as bulk/phish — passing auth
    title: "Bulk newsletter quarantined as suspected phishing (SPF/DKIM/DMARC pass)",
    severity: "Informational",
    status: "Active",
    classification: "Not set",
    determination: "Not set",
    assignedTo: null,
    workloads: ["Email"],
    tactics: ["Initial Access"],
    techniques: ["T1566"],
    firstActivity: T("2026-05-29T07:05:00Z"),
    lastActivity: T("2026-05-29T07:05:00Z"),
    devices: [],
    users: [{ upn: "sam.patel@contoso.com", riskLevel: "Low" }],
    mailboxes: [{ upn: "sam.patel@contoso.com" }],
    fileEvidence: [],
    ipEvidence: [],
    urlEvidence: [{ url: "https://office.com/", verdict: "clean" }],
    cves: [],
    alerts: [
      {
        id: "DA-0018",
        title: "High-volume sender flagged as bulk/phish",
        severity: "Informational",
        category: "InitialAccess",
        mitreTechniques: ["T1566"],
        detectionSource: "Microsoft Defender for Office 365",
        serviceSource: "Email",
        entities: ["sam.patel@contoso.com", "security@microsoft.com"],
        firstActivity: T("2026-05-29T07:05:00Z"),
        status: "New",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-29T07:05:00Z"), text: "Legitimate digest from security@microsoft.com quarantined as bulk. Headers pass SPF/DKIM/DMARC — expected to classify as False positive and release.", workload: "Email" },
    ],
    linkedEmailMailId: "m26",
  },

  // 12. Log4Shell multi-stage (the big one)
  {
    id: "DINC-0012",
    displayId: 235612,
    title: "Escalating multi-stage intrusion: Log4Shell to domain admin across 4 hosts",
    severity: "High",
    status: "In progress",
    classification: "True positive",
    determination: "Multi-stage attack",
    assignedTo: "Fahim Tanzimul",
    workloads: ["Endpoint", "Identity"],
    tactics: ["Initial Access", "Execution", "Privilege Escalation", "Lateral Movement", "Credential Access", "Command and Control"],
    techniques: ["T1190", "T1059.001", "T1021.002", "T1003.001", "T1071.001"],
    firstActivity: T("2026-05-28T11:00:00Z"),
    lastActivity: T("2026-05-29T07:45:00Z"),
    devices: [
      { name: "WEB-PROD-01", riskLevel: "High", os: "Ubuntu 22.04 (MDE for Linux)" },
      { name: "DEV-SERVER-03", riskLevel: "High", os: "Windows Server 2019" },
      { name: "DC01", riskLevel: "High", os: "Windows Server 2022 (DC)" },
      { name: "FIN-SERVER-02", riskLevel: "Medium", os: "Windows Server 2019" },
    ],
    users: [
      { upn: "webservice@contoso.com", riskLevel: "High" },
      { upn: "administrator@contoso.com", riskLevel: "High" },
    ],
    mailboxes: [],
    fileEvidence: [
      { sha256: "6f131a313b2ce21396b27d42cfd653770335e2de39af3ef33939eb9f874ab908", filename: "jndi-dropper.class", verdict: "malicious" },
      { sha256: "c64cc0cb8a3793f77395ef02506b12a80f089602534f3fb036d0bd10d94f29ee", filename: "beacon.dll (Cobalt Strike)", verdict: "malicious" },
    ],
    ipEvidence: [{ ip: "203.0.113.47", verdict: "malicious", role: "Cobalt Strike team server" }],
    urlEvidence: [],
    cves: ["CVE-2021-44228"],
    alerts: [
      {
        id: "DA-0019",
        title: "Exploitation of public-facing application (Log4Shell)",
        severity: "High",
        category: "InitialAccess",
        mitreTechniques: ["T1190"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["WEB-PROD-01", "java.exe"],
        firstActivity: T("2026-05-28T11:00:00Z"),
        status: "In progress",
      },
      {
        id: "DA-0020",
        title: "Cobalt Strike beacon detected",
        severity: "High",
        category: "CommandAndControl",
        mitreTechniques: ["T1071.001"],
        detectionSource: "Microsoft Defender for Endpoint",
        serviceSource: "Endpoint",
        entities: ["WEB-PROD-01", "203.0.113.47", "beacon.dll"],
        firstActivity: T("2026-05-28T11:40:00Z"),
        status: "In progress",
      },
      {
        id: "DA-0021",
        title: "Lateral movement via SMB admin shares (PsExec)",
        severity: "High",
        category: "LateralMovement",
        mitreTechniques: ["T1021.002"],
        detectionSource: "Microsoft Defender for Identity",
        serviceSource: "Identity",
        entities: ["DEV-SERVER-03", "DC01"],
        firstActivity: T("2026-05-28T14:20:00Z"),
        status: "In progress",
        sentinelAnalyticRuleId: "AR-0003",
      },
      {
        id: "DA-0022",
        title: "Domain dominance: credential dumping on DC01",
        severity: "High",
        category: "CredentialAccess",
        mitreTechniques: ["T1003.001"],
        detectionSource: "Microsoft Defender for Identity",
        serviceSource: "Identity",
        entities: ["DC01", "administrator"],
        firstActivity: T("2026-05-29T07:45:00Z"),
        status: "In progress",
        sentinelAnalyticRuleId: "AR-0002",
      },
    ],
    attackStory: [
      { step: 1, time: T("2026-05-28T11:00:00Z"), text: "Log4Shell (CVE-2021-44228) exploited on WEB-PROD-01.", workload: "Endpoint" },
      { step: 2, time: T("2026-05-28T11:40:00Z"), text: "Cobalt Strike beacon to 203.0.113.47 established.", workload: "Endpoint" },
      { step: 3, time: T("2026-05-28T14:20:00Z"), text: "PsExec lateral movement to DEV-SERVER-03 and DC01.", workload: "Identity" },
      { step: 4, time: T("2026-05-29T07:45:00Z"), text: "Credential dumping on DC01 — domain admin achieved.", workload: "Identity" },
    ],
    linkedXdrIncidentId: "INC-XDR-020",
    linkedSentinelIncidentId: "SENT-3012",
  },
];

export function getDefenderIncident(id: string): DefenderIncidentRecord | undefined {
  return DEFENDER_INCIDENTS.find((i) => i.id === id);
}

export function getDefenderIncidentByDisplayId(displayId: number): DefenderIncidentRecord | undefined {
  return DEFENDER_INCIDENTS.find((i) => i.displayId === displayId);
}

const SEVERITY_ORDER: Record<DefenderSeverity, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  Informational: 3,
};

export function compareDefenderIncidents(a: DefenderIncidentRecord, b: DefenderIncidentRecord): number {
  const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  if (s !== 0) return s;
  return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
}
