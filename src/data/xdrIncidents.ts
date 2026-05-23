export type XDRIncidentStatus = 
  | 'New: Presented'
  | 'Open: Investigating'
  | 'Open: Reported'
  | 'Open: Contained'
  | 'Open: Recovered'
  | 'Hold: Internal'
  | 'Hold: External'
  | 'Hold: Legal'
  | 'Closed: Under Review'
  | 'Closed: Confirmed Threat'
  | 'Closed: Suspected'
  | 'Closed: False Positive'
  | 'Closed: Near-Miss'
  | 'Closed: Other';

export type AttackGraphNode = {
  id: string;
  type: 'ip' | 'endpoint' | 'process' | 'user' | 'file';
  label: string;
  disposition: 'malicious' | 'suspicious' | 'common' | 'unknown' | 'clean' | 'asset';
};

export type AttackGraphEdge = {
  source: string;
  target: string;
};

export type DetectionEvent = {
  id: string;
  firstSeen: string;
  severity: 'High' | 'Critical' | 'Medium' | 'Low';
  source: string;
  indicators: string[];
  observables: string[];
  assets: string[];
};

export type PlaybookState = {
  currentPhase: 'identification' | 'containment' | 'eradication' | 'recovery' | 'closed';
  completedTasks: string[];
  notes: { taskId: string; text: string; timestamp: string; authorInitials: string }[];
  actionsLog: { description: string; timestamp: string; authorInitials: string; isWorkflow: boolean }[];
};

export type XDRIncident = {
  id: string;
  priority: number;
  status: XDRIncidentStatus;
  title: string;
  source: string[];
  tactics: string[];
  description: string;
  host: string;
  users: string[];
  sha256: { hash: string; filename: string; verdict: 'malicious' | 'suspicious' | 'clean' | 'unknown' }[];
  c2Ips: string[];
  c2Domains: string[];
  cves: string[];
  attackGraph: {
    nodes: AttackGraphNode[];
    edges: AttackGraphEdge[];
  };
  detectionEvents: DetectionEvent[];
  created: string;
  assigned: string | null;
};

export const xdrIncidents: XDRIncident[] = [
  {
    id: "INC-XDR-001",
    priority: 1000,
    status: "New: Presented",
    title: "AsyncRAT Deployed via Phishing — HR-LAPTOP-04",
    source: ["Cisco XDR Analytics"],
    tactics: ["Initial Access", "Command and Control"],
    description: "Malicious email with HTML smuggling dropper delivered AsyncRAT payload to hr-laptop-04. Beacon established to attacker C2 on port 6606.",
    host: "hr-laptop-04.datagroup.local",
    users: ["sarah.chen"],
    sha256: [{ hash: "6c5360d41bd2b14b1565f5b18e5c203cf1e0e222b65ac0b22284bdfe0d24521b", filename: "AsyncRAT.exe", verdict: "malicious" }],
    c2Ips: ["185.234.218.116"],
    c2Domains: ["update-cdn.microsoftservices.workers.dev"],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "ip", label: "185.234.218.116", disposition: "malicious" },
        { id: "n2", type: "endpoint", label: "hr-laptop-04", disposition: "asset" },
        { id: "n3", type: "process", label: "mshta.exe", disposition: "suspicious" },
        { id: "n4", type: "file", label: "AsyncRAT.exe", disposition: "malicious" },
        { id: "n5", type: "user", label: "sarah.chen", disposition: "clean" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" },
        { source: "n4", target: "n5" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "2 hours ago", severity: "High", source: "CrowdStrike Falcon", indicators: ["MshtaExecution"], observables: ["mshta.exe"], assets: ["hr-laptop-04", "sarah.chen"] },
      { id: "ev2", firstSeen: "2 hours ago", severity: "High", source: "Cisco Email Threat Defense", indicators: ["HTML Smuggling Detected"], observables: ["185.234.218.116"], assets: ["hr-laptop-04"] }
    ],
    created: new Date(Date.now() - 2 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-002",
    priority: 870,
    status: "Open: Investigating",
    title: "UNC Staging Share — JONE-ATH-B2240",
    source: ["Cisco XDR Analytics"],
    tactics: ["Lateral Movement", "Defense Evasion"],
    description: "Signed-but-revoked DLL pulled from an internal UNC share. VPN split-tunnel and SMB session reuse detected.",
    host: "JONE-ATH-B2240.datagroup.local",
    users: ["j.atherton"],
    sha256: [{ hash: "3c4b2a1d9e8f7c6b5a4d3e2f1c0b9a8d7e6f5c4b3a2d1e0f9c8b7a6d5e4f3c2b", filename: "Signed revoked DLL", verdict: "suspicious" }],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "ip", label: "198.51.100.22", disposition: "suspicious" },
        { id: "n2", type: "ip", label: "10.4.12.1", disposition: "unknown" },
        { id: "n3", type: "ip", label: "10.4.12.88", disposition: "asset" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n1" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "5 hours ago", severity: "High", source: "Cisco XDR Analytics", indicators: ["UNC Path Lateral Movement"], observables: ["198.51.100.22", "10.4.12.1"], assets: ["JONE-ATH-B2240"] }
    ],
    created: new Date(Date.now() - 5 * 3600000).toISOString(),
    assigned: "FT"
  },
  {
    id: "INC-XDR-003",
    priority: 910,
    status: "Open: Investigating",
    title: "Webshell Deployed on DMZ IIS — WEB-APP-01",
    source: ["Cisco XDR Analytics"],
    tactics: ["Persistence", "Execution"],
    description: "China Chopper webshell uploaded to IIS server via vulnerable upload endpoint (CVE-2021-26855). Attacker executing commands via POST requests.",
    host: "WEB-APP-01.dmzsrv.local",
    users: ["IIS_IUSRS"],
    sha256: [{ hash: "b1ab8f882eb758a011ed0ea81f970ea49e9185a4a50d2bb8eb413dd6db9007f3", filename: "webshell.aspx", verdict: "malicious" }],
    c2Ips: ["45.142.212.100"],
    c2Domains: [],
    cves: ["CVE-2021-26855"],
    attackGraph: {
      nodes: [
        { id: "n1", type: "ip", label: "45.142.212.100", disposition: "malicious" },
        { id: "n2", type: "endpoint", label: "WEB-APP-01", disposition: "asset" },
        { id: "n3", type: "process", label: "w3wp.exe", disposition: "suspicious" },
        { id: "n4", type: "process", label: "cmd.exe", disposition: "suspicious" },
        { id: "n5", type: "file", label: "webshell.aspx", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" },
        { source: "n4", target: "n5" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "1 day ago", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["Webshell Detected"], observables: ["webshell.aspx"], assets: ["WEB-APP-01"] },
      { id: "ev2", firstSeen: "1 day ago", severity: "High", source: "CrowdStrike Falcon", indicators: ["IIS Child Process Spawned"], observables: ["cmd.exe"], assets: ["WEB-APP-01"] }
    ],
    created: new Date(Date.now() - 24 * 3600000).toISOString(),
    assigned: "FT"
  },
  {
    id: "INC-XDR-004",
    priority: 1000,
    status: "Open: Contained",
    title: "WannaCry Ransomware — SMB Propagation on Finance Segment",
    source: ["Cisco Secure Endpoint"],
    tactics: ["Lateral Movement", "Impact"],
    description: "WannaCry ransomware detected on FIN-EXEC-01. Attempting SMB propagation via EternalBlue (CVE-2017-0144) across finance VLAN. Shadow copies being deleted.",
    host: "FIN-EXEC-01.corp.local",
    users: ["m.rodriguez"],
    sha256: [{ hash: "24d004a104d4d54034dbcffc2a4b19a11f39008a575aa614ea04703480b1022c", filename: "@WanaDecryptor", verdict: "malicious" }],
    c2Ips: [],
    c2Domains: [],
    cves: ["CVE-2017-0144"],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "FIN-EXEC-01", disposition: "asset" },
        { id: "n2", type: "process", label: "mssecsvc.exe", disposition: "malicious" },
        { id: "n3", type: "process", label: "tasksche.exe", disposition: "malicious" },
        { id: "n4", type: "file", label: "@WanaDecryptor", disposition: "malicious" },
        { id: "n5", type: "ip", label: "10.4.0.0/16", disposition: "unknown" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" },
        { source: "n4", target: "n5" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "2 days ago", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["WannaCry Ransomware"], observables: ["@WanaDecryptor"], assets: ["FIN-EXEC-01"] },
      { id: "ev2", firstSeen: "2 days ago", severity: "Critical", source: "SIEM", indicators: ["vssadmin delete shadows"], observables: ["vssadmin.exe"], assets: ["FIN-EXEC-01"] },
      { id: "ev3", firstSeen: "2 days ago", severity: "High", source: "SIEM", indicators: ["Mass SMB connection attempts"], observables: ["445/tcp"], assets: ["FIN-EXEC-01"] }
    ],
    created: new Date(Date.now() - 48 * 3600000).toISOString(),
    assigned: "JS"
  },
  {
    id: "INC-XDR-005",
    priority: 870,
    status: "New: Presented",
    title: "Emotet Loader — Macro Document Execution — SALES-VM-22",
    source: ["Cisco Email Threat Defense", "Cisco Secure Endpoint"],
    tactics: ["Initial Access", "Execution"],
    description: "Emotet loader delivered via malicious Word macro. PowerShell download cradle executed. Additional payload download observed.",
    host: "SALES-VM-22.vpn.local",
    users: ["d.patel"],
    sha256: [{ hash: "a0d5c80cb1880482dc1d50c6fb0eebbe28ed294f9b8c66e409ec8e22d9c0e2a2", filename: "Emotet.dll", verdict: "malicious" }],
    c2Ips: ["91.240.118.168"],
    c2Domains: ["invoicesystem.duckdns.org"],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "file", label: "Phishing email", disposition: "suspicious" },
        { id: "n2", type: "process", label: "winword.exe", disposition: "suspicious" },
        { id: "n3", type: "process", label: "powershell.exe", disposition: "suspicious" },
        { id: "n4", type: "file", label: "Emotet.dll", disposition: "malicious" },
        { id: "n5", type: "ip", label: "91.240.118.168", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" },
        { source: "n4", target: "n5" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "3 hours ago", severity: "Critical", source: "Cisco Email Threat Defense", indicators: ["Malicious Attachment"], observables: ["Emotet.dll"], assets: ["SALES-VM-22"] },
      { id: "ev2", firstSeen: "3 hours ago", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["Emotet Detected"], observables: ["Emotet.dll", "powershell.exe"], assets: ["SALES-VM-22"] }
    ],
    created: new Date(Date.now() - 3 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-006",
    priority: 820,
    status: "Open: Investigating",
    title: "Mimikatz Credential Dumping — POLC-MJ0LQLRR",
    source: ["CrowdStrike Falcon"],
    tactics: ["Credential Access"],
    description: "CrowdStrike Falcon detected SYSTEM hive credential dumping (T1003.002) via reg.exe. User dapqa executed reg.exe save hklm\\system. mshta.exe subsequently spawned by explorer.exe and established outbound connection to Fastly CDN.",
    host: "POLC-MJ0LQLRR.datagroup.local",
    users: ["dapqa", "crowduser"],
    sha256: [{ hash: "2260ff02fa10e7ee61a6c1170d14b1f6ea49a18d1976a4dfec1907cf7cdd3141", filename: "mshta payload", verdict: "malicious" }],
    c2Ips: ["151.101.65.91"],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "user", label: "dapqa", disposition: "suspicious" },
        { id: "n2", type: "process", label: "reg.exe", disposition: "suspicious" },
        { id: "n3", type: "file", label: "HKLM\\SYSTEM dump", disposition: "malicious" },
        { id: "n4", type: "process", label: "explorer.exe", disposition: "common" },
        { id: "n5", type: "process", label: "mshta.exe", disposition: "malicious" },
        { id: "n6", type: "ip", label: "151.101.65.91", disposition: "suspicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" },
        { source: "n4", target: "n5" },
        { source: "n5", target: "n6" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "8 hours ago", severity: "Critical", source: "CrowdStrike Falcon", indicators: ["HiveCredTheft"], observables: ["reg.exe"], assets: ["POLC-MJ0LQLRR"] },
      { id: "ev2", firstSeen: "8 hours ago", severity: "High", source: "CrowdStrike Falcon", indicators: ["Anomalous Process Execution", "MshtaDownload"], observables: ["mshta.exe"], assets: ["POLC-MJ0LQLRR"] }
    ],
    created: new Date(Date.now() - 8 * 3600000).toISOString(),
    assigned: "FT"
  },
  {
    id: "INC-XDR-007",
    priority: 640,
    status: "New: Presented",
    title: "Machine Learning High Confidence Malicious File — SAND-VIC2",
    source: ["CrowdStrike Falcon"],
    tactics: ["Execution"],
    description: "ML model flagged wsmprovav.exe as high confidence malicious. File written to Windows system directory. High entropy and packing detected. PUP hash match on CrowdStrike database.",
    host: "SAND-VIC2",
    users: ["fherbert", "SAND-VIC2$"],
    sha256: [{ hash: "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f", filename: "wsmprovav.exe", verdict: "malicious" }],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "SAND-VIC2", disposition: "asset" },
        { id: "n2", type: "file", label: "wsmprovav.exe", disposition: "malicious" },
        { id: "n3", type: "file", label: "KJhJnzzl.exe", disposition: "suspicious" },
        { id: "n4", type: "file", label: "perfc.exe", disposition: "suspicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n1", target: "n3" },
        { source: "n1", target: "n4" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "12 hours ago", severity: "High", source: "CrowdStrike Falcon", indicators: ["MLSensor-High"], observables: ["wsmprovav.exe"], assets: ["SAND-VIC2"] },
      { id: "ev2", firstSeen: "12 hours ago", severity: "Medium", source: "CrowdStrike Falcon", indicators: ["Detect OnWrite Adware/PUP Hash", "HashPupAdwareCrowdStrikeSha256"], observables: ["wsmprovav.exe"], assets: ["SAND-VIC2"] }
    ],
    created: new Date(Date.now() - 12 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-008",
    priority: 1000,
    status: "Closed: Confirmed Threat",
    title: "Malicious Email and AsyncRAT Activity — brie.ad.ciscrypt.info",
    source: ["Cisco XDR Analytics", "Cisco Email Threat Defense", "Cisco Secure Endpoint"],
    tactics: ["Initial Access", "Command and Control", "Execution", "Defense Evasion", "Persistence", "Privilege Escalation", "Lateral Movement", "Impact"],
    description: "Multiple findings from Cisco Email Threat Defense and Cisco Secure Endpoint affecting user leeg and endpoint brie.ad.ciscrypt.info. AsyncRAT established persistent C2 channel.",
    host: "brie.ad.ciscrypt.info",
    users: ["leeg"],
    sha256: [{ hash: "6c5360d41bd2b14b1565f5b18e5c203cf1e0e222b65ac0b22284bdfe0d24521b", filename: "AsyncRAT variant", verdict: "malicious" }],
    c2Ips: ["94.232.41.155"],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "user", label: "leeg", disposition: "suspicious" },
        { id: "n2", type: "endpoint", label: "brie.ad.ciscrypt.info", disposition: "asset" },
        { id: "n3", type: "file", label: "AsyncRAT variant", disposition: "malicious" },
        { id: "n4", type: "ip", label: "94.232.41.155", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "4 days ago", severity: "Critical", source: "Cisco Email Threat Defense", indicators: ["Malicious Email"], observables: ["AsyncRAT variant"], assets: ["brie.ad.ciscrypt.info"] },
      { id: "ev2", firstSeen: "4 days ago", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["AsyncRAT Activity"], observables: ["AsyncRAT variant"], assets: ["brie.ad.ciscrypt.info"] }
    ],
    created: new Date(Date.now() - 96 * 3600000).toISOString(),
    assigned: "FT"
  },
  {
    id: "INC-XDR-009",
    priority: 870,
    status: "New: Presented",
    title: "New Remote Access — LAB-WS-0142 — Suspicious RDP Brute Force",
    source: ["Cisco XDR Analytics"],
    tactics: ["Initial Access", "Credential Access"],
    description: "847 failed RDP authentication attempts from external IP 185.220.101.47 between 02:31 and 02:47. Successful login at 02:47. New account svc_backup01 created post-login.",
    host: "LAB-WS-0142.campus.local",
    users: ["MdUsman", "svc_backup01"],
    sha256: [],
    c2Ips: ["185.220.101.47"],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "ip", label: "185.220.101.47", disposition: "malicious" },
        { id: "n2", type: "endpoint", label: "LAB-WS-0142", disposition: "asset" },
        { id: "n3", type: "user", label: "MdUsman", disposition: "suspicious" },
        { id: "n4", type: "user", label: "svc_backup01", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "6 hours ago", severity: "High", source: "Cisco XDR Analytics", indicators: ["RDP Brute Force"], observables: ["185.220.101.47"], assets: ["LAB-WS-0142"] },
      { id: "ev2", firstSeen: "6 hours ago", severity: "Critical", source: "SIEM", indicators: ["Event ID 4720 New Account"], observables: ["svc_backup01"], assets: ["LAB-WS-0142"] }
    ],
    created: new Date(Date.now() - 6 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-010",
    priority: 870,
    status: "New: Presented",
    title: "Suspicious Outbound Traffic — FIN-EXEC-01 — Possible Data Exfiltration",
    source: ["Cisco XDR Analytics"],
    tactics: ["Exfiltration", "Command and Control"],
    description: "certutil.exe used to base64-encode payroll CSV. Invoke-WebRequest used to POST encoded file to external server. Classic LOLBin exfiltration chain.",
    host: "FIN-EXEC-01.corp.local",
    users: ["svc_backup01"],
    sha256: [{ hash: "b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2", filename: "out.b64", verdict: "suspicious" }],
    c2Ips: ["185.234.219.21"],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "FIN-EXEC-01", disposition: "asset" },
        { id: "n2", type: "process", label: "certutil.exe", disposition: "suspicious" },
        { id: "n3", type: "file", label: "2024.csv", disposition: "clean" },
        { id: "n4", type: "file", label: "out.b64", disposition: "suspicious" },
        { id: "n5", type: "process", label: "powershell.exe", disposition: "suspicious" },
        { id: "n6", type: "ip", label: "185.234.219.21", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" },
        { source: "n4", target: "n5" },
        { source: "n5", target: "n6" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "2 hours ago", severity: "High", source: "CrowdStrike Falcon", indicators: ["Anomalous certutil Usage"], observables: ["certutil.exe"], assets: ["FIN-EXEC-01"] },
      { id: "ev2", firstSeen: "2 hours ago", severity: "Critical", source: "Cisco XDR Analytics", indicators: ["Data Exfiltration Pattern"], observables: ["185.234.219.21"], assets: ["FIN-EXEC-01"] }
    ],
    created: new Date(Date.now() - 2 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-011",
    priority: 870,
    status: "New: Presented",
    title: "Cobalt Strike Beacon — SOC-TRAINING-01",
    source: ["Cisco Secure Endpoint", "CrowdStrike Falcon"],
    tactics: ["Command and Control", "Execution"],
    description: "Cobalt Strike beacon detected via named pipe communication. Malleable C2 profile using HTTPS to blend in. Parent process: spoolsv.exe (unusual child process spawn).",
    host: "SOC-TRAINING-01.lab.local",
    users: ["trainee.analyst"],
    sha256: [{ hash: "c64cc0cb8a3793f77395ef02506b12a80f089602534f3fb036d0bd10d94f29ee", filename: "Cobalt Strike beacon", verdict: "malicious" }],
    c2Ips: ["203.0.113.47"],
    c2Domains: ["windowsupdate-cdn.azureedge.net"],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "SOC-TRAINING-01", disposition: "asset" },
        { id: "n2", type: "process", label: "spoolsv.exe", disposition: "suspicious" },
        { id: "n3", type: "file", label: "mojo.5688...", disposition: "suspicious" },
        { id: "n4", type: "ip", label: "203.0.113.47", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "1 hour ago", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["CobaltStrike Beacon"], observables: ["Cobalt Strike beacon"], assets: ["SOC-TRAINING-01"] },
      { id: "ev2", firstSeen: "1 hour ago", severity: "High", source: "CrowdStrike Falcon", indicators: ["Named Pipe Created by Unusual Process"], observables: ["spoolsv.exe"], assets: ["SOC-TRAINING-01"] }
    ],
    created: new Date(Date.now() - 1 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-012",
    priority: 870,
    status: "Open: Investigating",
    title: "PowerShell Empire Activity — ENG-WS-77",
    source: ["CrowdStrike Falcon"],
    tactics: ["Execution", "Defense Evasion"],
    description: "PowerShell Empire framework detected. Encoded PowerShell launcher executed from Word macro. AMSI bypass attempted. Fileless payload loaded directly into memory.",
    host: "ENG-WS-77.datagroup.local",
    users: ["r.johnson"],
    sha256: [],
    c2Ips: ["10.129.0.44"],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "ENG-WS-77", disposition: "asset" },
        { id: "n2", type: "process", label: "winword.exe", disposition: "suspicious" },
        { id: "n3", type: "process", label: "powershell.exe", disposition: "malicious" },
        { id: "n4", type: "ip", label: "10.129.0.44", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "4 hours ago", severity: "Critical", source: "CrowdStrike Falcon", indicators: ["PowerShell Empire Stager"], observables: ["powershell.exe"], assets: ["ENG-WS-77"] },
      { id: "ev2", firstSeen: "4 hours ago", severity: "High", source: "CrowdStrike Falcon", indicators: ["AMSI Bypass Attempt"], observables: ["powershell.exe"], assets: ["ENG-WS-77"] }
    ],
    created: new Date(Date.now() - 4 * 3600000).toISOString(),
    assigned: "FT"
  },
  {
    id: "INC-XDR-013",
    priority: 870,
    status: "New: Presented",
    title: "New Remote Access — HR-VDI-12 — Kerberoasting Detected",
    source: ["Cisco XDR Analytics"],
    tactics: ["Credential Access"],
    description: "Kerberoasting attack detected. Unusual volume of Kerberos TGS requests for service accounts from single workstation. rc4-hmac downgrade attack pattern. T1558.003.",
    host: "HR-VDI-12.datagroup.local",
    users: ["hr.analyst"],
    sha256: [],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "HR-VDI-12", disposition: "asset" },
        { id: "n2", type: "user", label: "hr.analyst", disposition: "suspicious" },
        { id: "n3", type: "user", label: "svc_sql", disposition: "clean" },
        { id: "n4", type: "user", label: "svc_backup", disposition: "clean" },
        { id: "n5", type: "user", label: "svc_exchange", disposition: "clean" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n2", target: "n4" },
        { source: "n2", target: "n5" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "7 hours ago", severity: "High", source: "Cisco XDR Analytics", indicators: ["Kerberoasting Pattern"], observables: ["hr.analyst"], assets: ["HR-VDI-12"] },
      { id: "ev2", firstSeen: "7 hours ago", severity: "High", source: "SIEM", indicators: ["Anomalous Kerberos TGS Volume"], observables: ["Event ID 4769"], assets: ["HR-VDI-12"] }
    ],
    created: new Date(Date.now() - 7 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-014",
    priority: 870,
    status: "Open: Investigating",
    title: "New Remote Access — SRV-DATA-10 — Lateral Movement via PsExec",
    source: ["Cisco XDR Analytics"],
    tactics: ["Lateral Movement", "Execution"],
    description: "PsExec used to execute commands on SRV-DATA-10 from compromised workstation 10.0.0.44. ADMIN$ share access. PSEXESVC service created remotely.",
    host: "SRV-DATA-10.institute.local",
    users: [],
    sha256: [{ hash: "c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", filename: "PsExec", verdict: "suspicious" }],
    c2Ips: ["10.0.0.44"],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "ip", label: "10.0.0.44", disposition: "suspicious" },
        { id: "n2", type: "endpoint", label: "SRV-DATA-10", disposition: "asset" },
        { id: "n3", type: "process", label: "PSEXESVC", disposition: "suspicious" },
        { id: "n4", type: "process", label: "cmd.exe", disposition: "suspicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "9 hours ago", severity: "High", source: "Cisco XDR Analytics", indicators: ["PsExec Lateral Movement"], observables: ["10.0.0.44"], assets: ["SRV-DATA-10"] },
      { id: "ev2", firstSeen: "9 hours ago", severity: "High", source: "SIEM", indicators: ["Remote Service Creation"], observables: ["PSEXESVC"], assets: ["SRV-DATA-10"] }
    ],
    created: new Date(Date.now() - 9 * 3600000).toISOString(),
    assigned: "FT"
  },
  {
    id: "INC-XDR-015",
    priority: 870,
    status: "New: Presented",
    title: "New Remote Access — IT-JUMPBOX-02 — Pass-the-Hash",
    source: ["CrowdStrike Falcon"],
    tactics: ["Lateral Movement", "Credential Access"],
    description: "Pass-the-Hash attack using stolen NTLM hash from lsass dump. Logon Type 9 with NewCredentials. SeDebugPrivilege assigned to unexpected account.",
    host: "IT-JUMPBOX-02.datagroup.local",
    users: ["administrator"],
    sha256: [],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "IT-JUMPBOX-02", disposition: "asset" },
        { id: "n2", type: "user", label: "administrator", disposition: "suspicious" },
        { id: "n3", type: "file", label: "NTLM Hash", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "10 hours ago", severity: "Critical", source: "CrowdStrike Falcon", indicators: ["Pass-the-Hash Attempt"], observables: ["administrator"], assets: ["IT-JUMPBOX-02"] },
      { id: "ev2", firstSeen: "10 hours ago", severity: "Critical", source: "SIEM", indicators: ["Logon Type 9 with SeDebugPrivilege"], observables: ["Event ID 4624"], assets: ["IT-JUMPBOX-02"] }
    ],
    created: new Date(Date.now() - 10 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-016",
    priority: 870,
    status: "New: Presented",
    title: "New Remote Access — 172.20.2.58 — RDP from Tor Exit Node",
    source: ["Cisco XDR Analytics"],
    tactics: ["Initial Access"],
    description: "Successful RDP connection from known Tor exit node. Connection lasted 47 minutes. File transfers detected during session.",
    host: "172.20.2.58",
    users: [],
    sha256: [],
    c2Ips: ["194.165.16.78"],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "ip", label: "194.165.16.78", disposition: "malicious" },
        { id: "n2", type: "endpoint", label: "172.20.2.58", disposition: "asset" },
        { id: "n3", type: "process", label: "RDP Clip", disposition: "suspicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "11 hours ago", severity: "High", source: "Cisco XDR Analytics", indicators: ["RDP from Known Tor Node"], observables: ["194.165.16.78"], assets: ["172.20.2.58"] },
      { id: "ev2", firstSeen: "11 hours ago", severity: "High", source: "Cisco Umbrella", indicators: ["Tor Exit Node Detected"], observables: ["194.165.16.78"], assets: ["172.20.2.58"] }
    ],
    created: new Date(Date.now() - 11 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-017",
    priority: 870,
    status: "Open: Investigating",
    title: "LockerGoga Ransomware Pre-Deployment — FIN-LAPTOP-19",
    source: ["Cisco Secure Endpoint"],
    tactics: ["Impact", "Defense Evasion"],
    description: "LockerGoga ransomware artefacts found. ACL modification to lock out local accounts before encryption. vssadmin delete shadows executed. Network shares being enumerated.",
    host: "FIN-LAPTOP-19.datagroup.local",
    users: ["finance.user"],
    sha256: [{ hash: "ba15c27f26265f4b063b65654e9d7c25dc8ceebed59abfb878b277dca71dd45c", filename: "LockerGoga sample", verdict: "malicious" }],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "FIN-LAPTOP-19", disposition: "asset" },
        { id: "n2", type: "user", label: "finance.user", disposition: "suspicious" },
        { id: "n3", type: "file", label: "LockerGoga sample", disposition: "malicious" },
        { id: "n4", type: "process", label: "vssadmin.exe", disposition: "malicious" },
        { id: "n5", type: "process", label: "icacls.exe", disposition: "suspicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" },
        { source: "n3", target: "n5" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "14 hours ago", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["LockerGoga Artefact"], observables: ["LockerGoga sample"], assets: ["FIN-LAPTOP-19"] },
      { id: "ev2", firstSeen: "14 hours ago", severity: "Critical", source: "SIEM", indicators: ["Shadow Copy Deletion"], observables: ["vssadmin.exe"], assets: ["FIN-LAPTOP-19"] }
    ],
    created: new Date(Date.now() - 14 * 3600000).toISOString(),
    assigned: "FT"
  },
  {
    id: "INC-XDR-018",
    priority: 870,
    status: "New: Presented",
    title: "New Remote Access — 10.109.0.61 — DNS Tunneling C2",
    source: ["Cisco Umbrella", "Cisco XDR Analytics"],
    tactics: ["Command and Control", "Exfiltration"],
    description: "DNS tunneling detected. Unusually long DNS queries (>200 chars) to single domain. High query volume indicates data exfiltration via DNS. Tool: iodine or dnscat2.",
    host: "10.109.0.61",
    users: [],
    sha256: [],
    c2Ips: [],
    c2Domains: ["data.tunnel-c2.xyz"],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "10.109.0.61", disposition: "asset" },
        { id: "n2", type: "ip", label: "DNS Server", disposition: "common" },
        { id: "n3", type: "endpoint", label: "data.tunnel-c2.xyz", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "18 hours ago", severity: "Critical", source: "Cisco Umbrella", indicators: ["DNS Tunneling Pattern"], observables: ["data.tunnel-c2.xyz"], assets: ["10.109.0.61"] },
      { id: "ev2", firstSeen: "18 hours ago", severity: "High", source: "Cisco XDR Analytics", indicators: ["Anomalous DNS Volume"], observables: ["14,200 queries"], assets: ["10.109.0.61"] }
    ],
    created: new Date(Date.now() - 18 * 3600000).toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-019",
    priority: 870,
    status: "Open: Investigating",
    title: "New Remote Access — 10.4.21.77 — Supply Chain Compromise via SolarWinds Orion",
    source: ["Cisco XDR Analytics"],
    tactics: ["Initial Access", "Defense Evasion"],
    description: "SUNBURST backdoor artefacts detected. SolarWinds Orion binary SolarWinds.Orion.Core.BusinessLayer.dll loaded with malicious modification. C2 communication via avsvmcloud.com (deactivated sinkhole — for training only).",
    host: "10.4.21.77",
    users: ["SYSTEM"],
    sha256: [{ hash: "ce77d116a074dab7a22530ab4a6a5e01ce641e737c350711ccba3eb37651c68e", filename: "SUNBURST", verdict: "malicious" }],
    c2Ips: [],
    c2Domains: ["avsvmcloud.com"],
    cves: ["CVE-2020-10148"],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "10.4.21.77", disposition: "asset" },
        { id: "n2", type: "process", label: "SolarWinds.Orion.Core", disposition: "suspicious" },
        { id: "n3", type: "file", label: "SUNBURST", disposition: "malicious" },
        { id: "n4", type: "endpoint", label: "avsvmcloud.com", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "20 hours ago", severity: "Critical", source: "Cisco XDR Analytics", indicators: ["SUNBURST Beacon Pattern"], observables: ["avsvmcloud.com"], assets: ["10.4.21.77"] },
      { id: "ev2", firstSeen: "20 hours ago", severity: "High", source: "Cisco Secure Endpoint", indicators: ["Signed Binary Proxy Execution"], observables: ["SUNBURST"], assets: ["10.4.21.77"] }
    ],
    created: new Date(Date.now() - 20 * 3600000).toISOString(),
    assigned: "FT"
  },
  {
    id: "INC-XDR-020",
    priority: 1000,
    status: "Open: Investigating",
    title: "Escalating Intrusion — Attack Chain via Endpoint Exploits — Multiple Hosts",
    source: ["Cisco XDR Analytics", "CrowdStrike Falcon", "Microsoft Defender for Endpoint"],
    tactics: ["Initial Access", "Execution", "Privilege Escalation", "Lateral Movement", "Credential Access", "Command and Control"],
    description: "Full attack chain detected across 4 hosts. Initial access via Log4Shell (CVE-2021-44228) on web server. Lateral movement via PsExec. Cobalt Strike deployed. Domain Admin achieved. Credential dumping in progress.",
    host: "web-prod-01, dev-server-03, dc01.corp.local, fin-server-02",
    users: ["webservice", "administrator"],
    sha256: [
      { hash: "6f131a313b2ce21396b27d42cfd653770335e2de39af3ef33939eb9f874ab908", filename: "Log4Shell dropper", verdict: "malicious" },
      { hash: "c64cc0cb8a3793f77395ef02506b12a80f089602534f3fb036d0bd10d94f29ee", filename: "Cobalt Strike", verdict: "malicious" }
    ],
    c2Ips: ["203.0.113.47"],
    c2Domains: [],
    cves: ["CVE-2021-44228"],
    attackGraph: {
      nodes: [
        { id: "n1", type: "ip", label: "203.0.113.47", disposition: "malicious" },
        { id: "n2", type: "endpoint", label: "web-prod-01", disposition: "asset" },
        { id: "n3", type: "process", label: "java.exe", disposition: "suspicious" },
        { id: "n4", type: "file", label: "jndi.ldap dropper", disposition: "malicious" },
        { id: "n5", type: "file", label: "Cobalt Strike", disposition: "malicious" },
        { id: "n6", type: "endpoint", label: "dc01.corp.local", disposition: "asset" },
        { id: "n7", type: "endpoint", label: "fin-server-02", disposition: "asset" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4" },
        { source: "n4", target: "n5" },
        { source: "n5", target: "n6" },
        { source: "n6", target: "n7" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "22 hours ago", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["Log4Shell Exploit Attempt"], observables: ["6f131a313b2ce21396b27d42cfd653770335e2de39af3ef33939eb9f874ab908"], assets: ["web-prod-01"] },
      { id: "ev2", firstSeen: "22 hours ago", severity: "Critical", source: "CrowdStrike Falcon", indicators: ["CobaltStrike Beacon"], observables: ["c64cc0cb8a3793f77395ef02506b12a80f089602534f3fb036d0bd10d94f29ee"], assets: ["web-prod-01"] },
      { id: "ev3", firstSeen: "22 hours ago", severity: "Critical", source: "Microsoft Defender for Endpoint", indicators: ["Domain Admin Achieved by Unexpected Account"], observables: ["administrator"], assets: ["dc01.corp.local"] },
      { id: "ev4", firstSeen: "22 hours ago", severity: "Critical", source: "Cisco XDR Analytics", indicators: ["Multi-Host Attack Chain"], observables: ["Lateral Movement"], assets: ["web-prod-01", "dc01.corp.local"] }
    ],
    created: new Date(Date.now() - 22 * 3600000).toISOString(),
    assigned: "FT"
  }
];
