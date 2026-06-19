import type { KqlRow, KqlTables, KqlTableSchema } from "../lib/kql";

/**
 * Microsoft Sentinel seed data: analytic rules, data connectors, watchlists,
 * playbooks, and the Logs (KQL) tables. Cross-linked to the Defender catalog
 * and XDR IOCs so the whole stack tells one story. Deterministic — no randomness.
 */

export type SentinelSeverity = "High" | "Medium" | "Low" | "Informational";

export type AnalyticRuleType = "Scheduled" | "NRT" | "Microsoft Security" | "Fusion";

export interface AnalyticRule {
  id: string;
  name: string;
  description: string;
  severity: SentinelSeverity;
  tactics: string[];
  techniques: string[];
  kql: string;
  ruleType: AnalyticRuleType;
  frequency: string;
  enabled: boolean;
  incidentsCreated: number;
}

export const SENTINEL_RULES: AnalyticRule[] = [
  {
    id: "AR-0001",
    name: "Failed logon brute force (4625)",
    description: "More than 20 failed Windows logons from a single source IP per account.",
    severity: "Medium",
    tactics: ["CredentialAccess"],
    techniques: ["T1110"],
    kql: 'SecurityEvent\n| where EventID == 4625\n| summarize count() by Account, IpAddress\n| where count_ > 20',
    ruleType: "Scheduled",
    frequency: "Every 5 minutes",
    enabled: true,
    incidentsCreated: 3,
  },
  {
    id: "AR-0002",
    name: "Credential dumping on domain controller",
    description: "LSASS access / comsvcs MiniDump observed on a DC.",
    severity: "High",
    tactics: ["CredentialAccess"],
    techniques: ["T1003.001"],
    kql: 'DeviceEvents\n| where DeviceName has "DC"\n| where ProcessCommandLine contains "comsvcs.dll"',
    ruleType: "Scheduled",
    frequency: "Every 15 minutes",
    enabled: true,
    incidentsCreated: 1,
  },
  {
    id: "AR-0003",
    name: "Lateral movement via PsExec (NRT)",
    description: "Near-real-time detection of PSEXESVC service creation.",
    severity: "High",
    tactics: ["LateralMovement"],
    techniques: ["T1021.002"],
    kql: 'SecurityEvent\n| where EventID == 7045\n| where ServiceName contains "PSEXESVC"',
    ruleType: "NRT",
    frequency: "Near-real-time",
    enabled: true,
    incidentsCreated: 1,
  },
  {
    id: "AR-0004",
    name: "MFA fatigue followed by approval",
    description: "Multiple denied MFA prompts followed by an approval and sign-in.",
    severity: "High",
    tactics: ["CredentialAccess"],
    techniques: ["T1621"],
    kql: 'SigninLogs\n| where ResultType == "50074" or ResultType == "0"\n| summarize count() by UserPrincipalName, IPAddress',
    ruleType: "Scheduled",
    frequency: "Every 10 minutes",
    enabled: true,
    incidentsCreated: 1,
  },
  {
    id: "AR-0005",
    name: "New local administrator account (NRT)",
    description: "A new account was added to the local Administrators group.",
    severity: "Medium",
    tactics: ["Persistence", "PrivilegeEscalation"],
    techniques: ["T1136.001", "T1098"],
    kql: 'SecurityEvent\n| where EventID == 4732\n| where GroupName == "Administrators"',
    ruleType: "NRT",
    frequency: "Near-real-time",
    enabled: false,
    incidentsCreated: 0,
  },
  {
    id: "AR-0006",
    name: "EternalBlue SMB exploitation",
    description: "SMBv1 exploitation pattern consistent with CVE-2017-0144.",
    severity: "High",
    tactics: ["LateralMovement"],
    techniques: ["T1210"],
    kql: 'CommonSecurityLog\n| where DeviceProduct == "IDS"\n| where Activity contains "EternalBlue"',
    ruleType: "Scheduled",
    frequency: "Every 15 minutes",
    enabled: true,
    incidentsCreated: 1,
  },
  {
    id: "AR-0007",
    name: "HTML smuggling in inbound email",
    description: "Defender for Office 365 phish verdict with smuggled HTML attachment.",
    severity: "High",
    tactics: ["InitialAccess"],
    techniques: ["T1566.001"],
    kql: 'EmailEvents\n| where ThreatTypes has "Phish"\n| where DeliveryAction == "Delivered"',
    ruleType: "Microsoft Security",
    frequency: "Imported from Defender XDR",
    enabled: true,
    incidentsCreated: 2,
  },
  {
    id: "AR-0008",
    name: "Risky OAuth consent grant",
    description: "Consent granted to an unverified app requesting mailbox scopes.",
    severity: "Medium",
    tactics: ["Persistence"],
    techniques: ["T1528"],
    kql: 'CloudAppEvents\n| where ActionType contains "Consent"',
    ruleType: "Microsoft Security",
    frequency: "Imported from Defender for Cloud Apps",
    enabled: true,
    incidentsCreated: 1,
  },
  {
    id: "AR-0009",
    name: "Suspected Kerberoasting (4769 spike)",
    description: "Burst of RC4 TGS requests for service principals.",
    severity: "Medium",
    tactics: ["CredentialAccess"],
    techniques: ["T1558.003"],
    kql: 'SecurityEvent\n| where EventID == 4769\n| where TicketEncryptionType == "0x17"\n| summarize count() by Account',
    ruleType: "Scheduled",
    frequency: "Every 30 minutes",
    enabled: true,
    incidentsCreated: 1,
  },
  {
    id: "AR-0010",
    name: "DNS tunneling — long query volume",
    description: "High volume of long DNS queries to a single domain.",
    severity: "Medium",
    tactics: ["Exfiltration", "CommandAndControl"],
    techniques: ["T1071.004", "T1048.003"],
    kql: 'DeviceEvents\n| where ActionType == "DnsQuery"\n| summarize count() by DeviceName, RemoteUrl\n| where count_ > 100',
    ruleType: "Scheduled",
    frequency: "Every 1 hour",
    enabled: true,
    incidentsCreated: 1,
  },
  {
    id: "AR-0011",
    name: "Advanced multi-stage attack (Fusion)",
    description: "Machine-learning correlation of low-fidelity signals into a high-confidence multi-stage incident.",
    severity: "High",
    tactics: ["InitialAccess", "Execution", "LateralMovement", "Exfiltration"],
    techniques: ["T1190", "T1059", "T1021"],
    kql: "// Fusion correlation — no editable KQL (built-in ML)",
    ruleType: "Fusion",
    frequency: "Continuous (ML)",
    enabled: true,
    incidentsCreated: 1,
  },
];

export interface DataConnector {
  id: string;
  name: string;
  provider: string;
  status: "Connected" | "Disconnected";
  dataTypes: string[];
  lastDataReceived: string;
  eventsIngested24h: number;
  /** teaching blind-spot flag: connected but no data in the last hour */
  staleData?: boolean;
}

export const SENTINEL_CONNECTORS: DataConnector[] = [
  { id: "dc-mde", name: "Microsoft Defender XDR", provider: "Microsoft", status: "Connected", dataTypes: ["SecurityAlert", "DeviceEvents", "EmailEvents"], lastDataReceived: "2026-05-29T20:10:00Z", eventsIngested24h: 1820000 },
  { id: "dc-entra", name: "Microsoft Entra ID", provider: "Microsoft", status: "Connected", dataTypes: ["SigninLogs", "AuditLogs"], lastDataReceived: "2026-05-29T20:12:00Z", eventsIngested24h: 540000 },
  { id: "dc-o365", name: "Office 365", provider: "Microsoft", status: "Connected", dataTypes: ["OfficeActivity", "EmailEvents"], lastDataReceived: "2026-05-29T20:09:00Z", eventsIngested24h: 760000 },
  { id: "dc-azure", name: "Azure Activity", provider: "Microsoft", status: "Connected", dataTypes: ["AzureActivity"], lastDataReceived: "2026-05-29T20:00:00Z", eventsIngested24h: 88000 },
  { id: "dc-aws", name: "Amazon Web Services", provider: "Amazon", status: "Connected", dataTypes: ["AWSCloudTrail"], lastDataReceived: "2026-05-29T19:58:00Z", eventsIngested24h: 132000 },
  { id: "dc-okta", name: "Okta Single Sign-On", provider: "Okta", status: "Connected", dataTypes: ["Okta_CL"], lastDataReceived: "2026-05-29T17:40:00Z", eventsIngested24h: 4200, staleData: true },
  { id: "dc-pan", name: "Palo Alto Networks", provider: "Palo Alto", status: "Connected", dataTypes: ["CommonSecurityLog"], lastDataReceived: "2026-05-29T20:05:00Z", eventsIngested24h: 980000 },
  { id: "dc-syslog", name: "Syslog", provider: "Linux", status: "Disconnected", dataTypes: ["Syslog"], lastDataReceived: "2026-05-28T11:00:00Z", eventsIngested24h: 0, staleData: true },
];

export interface Watchlist {
  id: string;
  name: string;
  description: string;
  itemsCount: number;
  searchKey: string;
}

export const SENTINEL_WATCHLISTS: Watchlist[] = [
  { id: "wl-vip", name: "VIP users", description: "High-value accounts (executives, admins).", itemsCount: 12, searchKey: "UserPrincipalName" },
  { id: "wl-tor", name: "Known TOR exit nodes", description: "IP indicators for anonymizing infrastructure.", itemsCount: 240, searchKey: "IPAddress" },
  { id: "wl-malhash", name: "Known-bad file hashes", description: "Curated malware SHA-256 indicators.", itemsCount: 8, searchKey: "SHA256" },
];

export interface Playbook {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
  description: string;
}

export const SENTINEL_PLAYBOOKS: Playbook[] = [
  { id: "pb-teams", name: "Notify SOC Teams channel", trigger: "When incident is created", steps: ["Get incident", "Post adaptive card to Teams", "Wait for analyst ack"], description: "Posts a rich incident card to the SOC Microsoft Teams channel." },
  { id: "pb-snow", name: "Create ServiceNow ticket", trigger: "When incident severity is High", steps: ["Get incident", "Create ServiceNow incident", "Write ticket # back to comment"], description: "Opens a ServiceNow incident and links it back to Sentinel." },
  { id: "pb-blockip", name: "Block IP at firewall", trigger: "On-demand (entity: IP)", steps: ["Get IP entity", "Call Palo Alto API", "Add to deny address-group", "Comment result"], description: "Pushes a malicious IP to the perimeter firewall block list." },
  { id: "pb-disable", name: "Disable compromised user", trigger: "On-demand (entity: Account)", steps: ["Get account entity", "Disable Entra ID account", "Revoke refresh tokens"], description: "Disables an Entra ID account and revokes its sessions." },
];

// ── Sentinel Logs (KQL) tables — shares the runKql engine with Defender ──

export const SENTINEL_LOG_SCHEMA: KqlTableSchema[] = [
  {
    name: "SecurityEvent",
    description: "Windows Security events forwarded via the agent.",
    columns: [
      { name: "TimeGenerated", type: "datetime" },
      { name: "EventID", type: "int" },
      { name: "Account", type: "string" },
      { name: "Computer", type: "string" },
      { name: "IpAddress", type: "string" },
      { name: "Activity", type: "string" },
    ],
  },
  {
    name: "SigninLogs",
    description: "Microsoft Entra ID interactive sign-ins.",
    columns: [
      { name: "TimeGenerated", type: "datetime" },
      { name: "UserPrincipalName", type: "string" },
      { name: "IPAddress", type: "string" },
      { name: "Location", type: "string" },
      { name: "ResultType", type: "string" },
      { name: "AppDisplayName", type: "string" },
    ],
  },
  {
    name: "SecurityAlert",
    description: "Alerts imported from Microsoft security products.",
    columns: [
      { name: "TimeGenerated", type: "datetime" },
      { name: "AlertName", type: "string" },
      { name: "AlertSeverity", type: "string" },
      { name: "ProviderName", type: "string" },
      { name: "Entities", type: "string" },
    ],
  },
  {
    name: "CommonSecurityLog",
    description: "CEF/Syslog from network appliances (Palo Alto, etc.).",
    columns: [
      { name: "TimeGenerated", type: "datetime" },
      { name: "DeviceVendor", type: "string" },
      { name: "DeviceProduct", type: "string" },
      { name: "SourceIP", type: "string" },
      { name: "DestinationIP", type: "string" },
      { name: "Activity", type: "string" },
    ],
  },
  {
    name: "DeviceEvents",
    description: "Defender for Endpoint device telemetry (via XDR connector).",
    columns: [
      { name: "TimeGenerated", type: "datetime" },
      { name: "DeviceName", type: "string" },
      { name: "ActionType", type: "string" },
      { name: "ProcessCommandLine", type: "string" },
      { name: "RemoteUrl", type: "string" },
      { name: "RemoteIP", type: "string" },
    ],
  },
  {
    name: "AWSCloudTrail",
    description: "AWS management-plane API activity.",
    columns: [
      { name: "TimeGenerated", type: "datetime" },
      { name: "EventName", type: "string" },
      { name: "UserIdentityArn", type: "string" },
      { name: "SourceIpAddress", type: "string" },
      { name: "AwsRegion", type: "string" },
    ],
  },
];

function plusMin(iso: string, m: number): string {
  return new Date(new Date(iso).getTime() + m * 60000).toISOString().slice(0, 19) + "Z";
}

// SecurityEvent — brute force (26x 4625 then 4624 success), PsExec service, DC mini-dump
const securityEvent: KqlRow[] = [];
for (let i = 0; i < 26; i++) {
  securityEvent.push({ TimeGenerated: plusMin("2026-05-29T02:18:00Z", i), EventID: 4625, Account: "administrator", Computer: "LAB-WS-0142", IpAddress: "45.155.205.233", Activity: "An account failed to log on" });
}
securityEvent.push(
  { TimeGenerated: "2026-05-29T02:47:00Z", EventID: 4624, Account: "administrator", Computer: "LAB-WS-0142", IpAddress: "45.155.205.233", Activity: "An account was successfully logged on" },
  { TimeGenerated: "2026-05-28T14:20:00Z", EventID: 7045, Account: "administrator", Computer: "DEV-SERVER-03", IpAddress: "10.0.0.44", Activity: "A service was installed: PSEXESVC" },
  { TimeGenerated: "2026-05-29T07:45:00Z", EventID: 4688, Account: "administrator", Computer: "DC01", IpAddress: "10.0.0.10", Activity: "comsvcs.dll MiniDump lsass" },
  { TimeGenerated: "2026-05-29T06:05:00Z", EventID: 4769, Account: "svc_sql", Computer: "DC01", IpAddress: "10.20.1.12", Activity: "Kerberos service ticket requested (0x17)" },
  // Syncing with XDR Incidents for teaching:
  { TimeGenerated: "2026-05-29T10:15:00Z", EventID: 4688, Account: "sarah.chen", Computer: "hr-laptop-04", IpAddress: "185.234.218.116", Activity: "A new process has been created: AsyncRAT.exe" },
  { TimeGenerated: "2026-05-27T19:35:00Z", EventID: 4688, Account: "m.rodriguez", Computer: "FIN-EXEC-01", IpAddress: "10.4.12.55", Activity: "A new process has been created: @WanaDecryptor" },
  { TimeGenerated: "2026-05-27T19:36:00Z", EventID: 4688, Account: "m.rodriguez", Computer: "FIN-EXEC-01", IpAddress: "-", Activity: "vssadmin.exe delete shadows" },
  { TimeGenerated: "2026-05-28T09:12:00Z", EventID: 4688, Account: "dapqa", Computer: "POLC-MJ0LQLRR", IpAddress: "151.101.65.91", Activity: "reg.exe save hklm\\system" },
  { TimeGenerated: "2026-05-28T09:15:00Z", EventID: 4688, Account: "dapqa", Computer: "POLC-MJ0LQLRR", IpAddress: "151.101.65.91", Activity: "mshta.exe spawned by explorer.exe" }
);

const signinLogs: KqlRow[] = [
  { TimeGenerated: "2026-05-29T02:18:00Z", UserPrincipalName: "elena.fisher@contoso.com", IPAddress: "45.155.205.233", Location: "Lagos, NG", ResultType: "50074", AppDisplayName: "Office 365" },
  { TimeGenerated: "2026-05-29T02:50:00Z", UserPrincipalName: "elena.fisher@contoso.com", IPAddress: "45.155.205.233", Location: "Lagos, NG", ResultType: "0", AppDisplayName: "Office 365" },
  { TimeGenerated: "2026-05-29T02:55:00Z", UserPrincipalName: "elena.fisher@contoso.com", IPAddress: "203.0.113.54", Location: "Frankfurt, DE", ResultType: "0", AppDisplayName: "Office 365" },
  { TimeGenerated: "2026-05-29T09:00:00Z", UserPrincipalName: "p.nguyen@contoso.com", IPAddress: "104.21.5.178", Location: "Seattle, US", ResultType: "0", AppDisplayName: "Azure Portal" },
];

const securityAlert: KqlRow[] = [
  { TimeGenerated: "2026-05-29T12:58:00Z", AlertName: "Suspicious mshta.exe spawned a remote access tool", AlertSeverity: "High", ProviderName: "Cisco Secure Endpoint", Entities: "HR-LAPTOP-04;AsyncRAT.exe" },
  { TimeGenerated: "2026-05-27T19:30:00Z", AlertName: "Ransomware behavior detected", AlertSeverity: "High", ProviderName: "Cisco XDR", Entities: "FIN-EXEC-01;@WanaDecryptor" },
  { TimeGenerated: "2026-05-29T02:18:00Z", AlertName: "MFA fatigue", AlertSeverity: "High", ProviderName: "IPC", Entities: "elena.fisher@contoso.com" },
  { TimeGenerated: "2026-05-28T09:20:00Z", AlertName: "Mimikatz Credential Dumping", AlertSeverity: "High", ProviderName: "CrowdStrike Falcon", Entities: "POLC-MJ0LQLRR;reg.exe" },
  { TimeGenerated: "2026-05-29T10:15:00Z", AlertName: "Malicious Attachment Execution", AlertSeverity: "High", ProviderName: "Cisco Secure Endpoint", Entities: "SALES-VM-22;Emotet.dll" },
];

const commonSecurityLog: KqlRow[] = [
  { TimeGenerated: "2026-05-27T19:40:00Z", DeviceVendor: "Palo Alto Networks", DeviceProduct: "IDS", SourceIP: "10.5.0.7", DestinationIP: "10.5.0.20", Activity: "EternalBlue SMB exploit attempt" },
  { TimeGenerated: "2026-05-28T11:40:00Z", DeviceVendor: "Palo Alto Networks", DeviceProduct: "Firewall", SourceIP: "10.8.0.3", DestinationIP: "203.0.113.47", Activity: "Allowed outbound 443" },
  { TimeGenerated: "2026-05-28T14:15:00Z", DeviceVendor: "Cisco", DeviceProduct: "Firepower", SourceIP: "10.109.0.61", DestinationIP: "8.8.8.8", Activity: "DNS Tunneling Pattern Detected" },
];

const deviceEventsSentinel: KqlRow[] = [
  { TimeGenerated: "2026-05-29T07:45:00Z", DeviceName: "DC01", ActionType: "ProcessCreated", ProcessCommandLine: "rundll32 comsvcs.dll MiniDump", RemoteUrl: "", RemoteIP: "" },
  { TimeGenerated: "2026-05-29T13:05:00Z", DeviceName: "HR-LAPTOP-04", ActionType: "ConnectionSuccess", ProcessCommandLine: "AsyncRAT.exe", RemoteUrl: "", RemoteIP: "185.234.218.116" },
  { TimeGenerated: "2026-05-27T19:32:00Z", DeviceName: "FIN-EXEC-01", ActionType: "FileCreated", ProcessCommandLine: "mssecsvc.exe", RemoteUrl: "", RemoteIP: "" },
  ...Array.from({ length: 30 }, (_, i) => ({
    TimeGenerated: plusMin("2026-05-28T21:10:00Z", i * 5),
    DeviceName: "RND-WS-09",
    ActionType: "DnsQuery",
    ProcessCommandLine: "iodine.exe",
    RemoteUrl: `a${i.toString(36)}b9f2c1e8d7${i}data.tunnel-c2.xyz`,
    RemoteIP: "8.8.8.8",
  })),
];

const awsCloudTrail: KqlRow[] = [
  { TimeGenerated: "2026-05-29T16:20:00Z", EventName: "ConsoleLogin", UserIdentityArn: "arn:aws:iam::44:user/deploy", SourceIpAddress: "45.155.205.233", AwsRegion: "us-east-1" },
  { TimeGenerated: "2026-05-29T16:24:00Z", EventName: "CreateAccessKey", UserIdentityArn: "arn:aws:iam::44:user/deploy", SourceIpAddress: "45.155.205.233", AwsRegion: "us-east-1" },
  { TimeGenerated: "2026-05-29T16:26:00Z", EventName: "PutBucketPolicy", UserIdentityArn: "arn:aws:iam::44:user/deploy", SourceIpAddress: "45.155.205.233", AwsRegion: "us-east-1" },
];

export const SENTINEL_LOG_TABLES: KqlTables = {
  SecurityEvent: securityEvent,
  SigninLogs: signinLogs,
  SecurityAlert: securityAlert,
  CommonSecurityLog: commonSecurityLog,
  DeviceEvents: deviceEventsSentinel,
  AWSCloudTrail: awsCloudTrail,
};

export interface SentinelSavedQuery {
  id: string;
  name: string;
  description: string;
  tactic: string;
  query: string;
}

export const SENTINEL_SAMPLE_QUERIES: SentinelSavedQuery[] = [
  { id: "sq1", name: "Brute force failed logons", description: "EventID 4625 grouped by account + IP.", tactic: "CredentialAccess", query: 'SecurityEvent\n| where EventID == 4625\n| summarize count() by Account, IpAddress\n| where count_ > 20' },
  { id: "sq2", name: "Impossible travel sign-ins", description: "Successful sign-ins by location.", tactic: "InitialAccess", query: 'SigninLogs\n| where ResultType == "0"\n| project TimeGenerated, UserPrincipalName, Location, IPAddress' },
  { id: "sq3", name: "PsExec service installs", description: "Lateral movement via service creation.", tactic: "LateralMovement", query: 'SecurityEvent\n| where EventID == 7045\n| where Activity contains "PSEXESVC"' },
  { id: "sq4", name: "DNS tunneling volume", description: "Long DNS queries to a single domain.", tactic: "Exfiltration", query: 'DeviceEvents\n| where ActionType == "DnsQuery"\n| summarize count() by DeviceName, RemoteUrl\n| top 10 by count_' },
  { id: "sq5", name: "AWS suspicious key creation", description: "CreateAccessKey from a risky IP.", tactic: "Persistence", query: 'AWSCloudTrail\n| where EventName == "CreateAccessKey"' },
  { id: "sq6", name: "High severity imported alerts", description: "SecurityAlert by provider.", tactic: "Multiple", query: 'SecurityAlert\n| where AlertSeverity == "High"\n| summarize count() by ProviderName' },
  { id: "sq7", name: "EternalBlue IDS hits", description: "SMB exploitation from network sensors.", tactic: "LateralMovement", query: 'CommonSecurityLog\n| where Activity contains "EternalBlue"' },
  { id: "sq8", name: "Kerberoasting TGS spike", description: "RC4 service ticket requests.", tactic: "CredentialAccess", query: 'SecurityEvent\n| where EventID == 4769\n| summarize count() by Account' },
];

export function getRule(id: string): AnalyticRule | undefined {
  return SENTINEL_RULES.find((r) => r.id === id);
}
