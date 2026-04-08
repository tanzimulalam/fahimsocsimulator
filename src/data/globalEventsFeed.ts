/** Synthetic org-wide event stream for the Events nav page (not tied to Inbox state). */

export type GlobalFeedRow = {
  id: string;
  timeUtc: string;
  hostname: string;
  group: string;
  severity: "low" | "medium" | "high" | "critical";
  eventType: string;
  shaShort: string;
  localIp: string;
  remoteIp: string;
  user?: string;
  process?: string;
  filePath?: string;
  mitre?: string;
  disposition?: string;
};

export const GLOBAL_EVENTS_FEED: GlobalFeedRow[] = [
  {
    id: "g1",
    timeUtc: "2024-04-11 14:22:01",
    hostname: "FahimTanzimul",
    group: "Work from Home Group",
    severity: "medium",
    eventType: "File Detection",
    shaShort: "9014827c…062daad6",
    localIp: "172.20.2.58",
    remoteIp: "198.51.100.10",
    user: "CORP\\fahim.lab",
    process: "C:\\Windows\\explorer.exe",
    filePath: "C:\\Users\\…\\AppData\\Local\\Temp\\invoice.iso",
    mitre: "T1204.002 (User Execution: Malicious File)",
    disposition: "Quarantine pending analyst",
  },
  {
    id: "g2",
    timeUtc: "2024-04-11 14:18:55",
    hostname: "FIN-EXEC-01.corp.local",
    group: "Defender ATP Group FacStaff",
    severity: "high",
    eventType: "Blocked execution",
    shaShort: "aabbccdd…eeff0011",
    localIp: "10.4.2.3",
    remoteIp: "203.0.113.9",
    user: "CORP\\exec_svc",
    process: "C:\\Windows\\System32\\rundll32.exe",
    filePath: "C:\\ProgramData\\stage\\payload.dll",
    mitre: "T1218 (System Binary Proxy Execution)",
    disposition: "Blocked by policy",
  },
  {
    id: "g3",
    timeUtc: "2024-04-11 13:40:12",
    hostname: "PRINT-SRV-01.corp.local",
    group: "IT Support Pool",
    severity: "medium",
    eventType: "Suspicious script",
    shaShort: "11223344…55667788",
    localIp: "10.4.50.2",
    remoteIp: "192.0.2.15",
    user: "NT AUTHORITY\\SYSTEM",
    process: "powershell.exe",
    filePath: "C:\\Windows\\Temp\\w.ps1",
    mitre: "T1059.001 (PowerShell)",
    disposition: "Monitor + ticket PRNT-4482",
  },
  {
    id: "g4",
    timeUtc: "2024-04-11 12:05:00",
    hostname: "LAB-WS-0142.campus.local",
    group: "Defender ATP Group LabClass",
    severity: "low",
    eventType: "Threat Quarantined",
    shaShort: "c0ffee00…badf00d1",
    localIp: "10.8.1.42",
    remoteIp: "—",
    user: "CAMPUS\\student42",
    process: "chrome.exe",
    filePath: "C:\\Users\\…\\Downloads\\cracktool.exe",
    mitre: "T1189 (Drive-by Compromise)",
    disposition: "Quarantined",
  },
  {
    id: "g5",
    timeUtc: "2024-04-11 11:33:44",
    hostname: "SOC-TRAINING-01.lab.local",
    group: "IT Support Pool",
    severity: "low",
    eventType: "Policy update",
    shaShort: "—",
    localIp: "10.10.0.5",
    remoteIp: "—",
    user: "SYSTEM",
    process: "Cisco AMP Connector",
    disposition: "Informational",
  },
  {
    id: "g6",
    timeUtc: "2024-04-11 10:12:00",
    hostname: "DMZ-WEB-03.corp.local",
    group: "DMZ — Web",
    severity: "critical",
    eventType: "Webshell behavior",
    shaShort: "00aa11bb…ccdd22ee",
    localIp: "10.2.0.8",
    remoteIp: "198.51.100.77",
    user: "IIS APPPOOL\\DefaultAppPool",
    process: "w3wp.exe",
    filePath: "D:\\inetpub\\wwwroot\\upload\\shell.aspx",
    mitre: "T1505.003 (Web Shell)",
    disposition: "Isolate host (simulated workflow)",
  },
  {
    id: "g7",
    timeUtc: "2024-04-11 09:44:18",
    hostname: "VDI-POOL-07.corp.local",
    group: "Work from Home Group",
    severity: "medium",
    eventType: "Outbound connection",
    shaShort: "—",
    localIp: "172.20.44.107",
    remoteIp: "203.0.113.44",
    user: "CORP\\contractor",
    process: "outlook.exe",
    mitre: "T1071 (Application Layer Protocol)",
    disposition: "Correlate with email gateway",
  },
];
