import type { IncidentXdrSir } from "../types";

/** Per-incident SIR / MS-ISAC–style narratives — pair with unique AMP SHA-256s in mockData */
export const XDR_SIR_BY_INCIDENT_ID: Record<string, IncidentXdrSir> = {
  "inc-1": {
    sirId: "SIR0017192",
    sirTitle: "Malicious IPs and Domains observed by MS-ISAC — BGAUpdate dropper cluster",
    xdrTitle: "New suspicious execution — MdUsman / MSILHeracles + public Lumma hash",
    xdrPriority: 870,
    xdrState: "New",
    xdrTactics: ["Initial Access", "Execution", "Command and Control"],
    xdrBlurb:
      "Connector flagged gen:Variant.MSILHeracles.75067 on a GUID-renamed BGAUpdate.exe with repeated quarantine failures. Treat as potential commodity loader until scan + trajectory review complete.",
    msisacFeedId: "MS-ISAC-2025-EDU-AMP-0142",
    sectorContext:
      "Data Group institute WFH cohort: commodity updater masquerading as browser game assistant (BGAUpdate.exe) with staged PowerShell from Temp. Correlates with sector-wide ISO→lnk campaigns.",
    firstSeenUtc: "2025-03-18T08:00:00.000Z",
    lastObservedUtc: "2025-03-24T22:38:11.000Z",
    narrative:
      "Connector telemetry shows repeated execution from Public Downloads, then DNS to a bulletproof resolver followed by HTTPS beaconing. MS-ISAC notes overlapping infrastructure with Qakbot precursor staging (training attribution only). Data Group SOC tied the same SHA-256 to outbound 203.0.113.0/24 and 198.51.100.0/24 sinks observed in sibling institutions last week.",
    maliciousIpv4: [
      { ip: "203.0.113.44", context: "C2 beacon — TLS JA3 fingerprint matches cluster “Cerberus-7” (simulated)", firstSeenUtc: "2025-03-24T22:38:09.000Z" },
      { ip: "198.51.100.77", context: "DNS-over-HTTPS resolver used to exfil staged shellcode length", firstSeenUtc: "2025-03-24T22:38:10.000Z" },
      { ip: "192.0.2.15", context: "Second-stage payload retrieval — HTTP 404 masking actual PE drop", firstSeenUtc: "2025-03-24T21:12:44.000Z" },
    ],
    maliciousDomains: [
      { domain: "cdn-bgassist.net", context: "Typosquat of legitimate updater CDN", observedVia: "DNS + SNI on 443" },
      { domain: "telemetry-gameio.xyz", context: "DGA-like subdomain burst every 4h", observedVia: "Connector DNS tap" },
    ],
    dnsQueriesSample: [
      "a7f3.cdn-bgassist.net",
      "stage.telemetry-gameio.xyz",
      "resolver.cloudfront-edge.invalid",
    ],
    ttps: ["T1566.001 (Spearphishing Attachment)", "T1059.001 (PowerShell)", "T1071.001 (Web Protocols)"],
    relatedIntelNote:
      "Primary file hash matches public Lumma stealer corpus (ae12bb54…) — have students verify live on VirusTotal; adware second-stage uses 142b638c… (typically fewer engines).",
  },

  "inc-2": {
    sirId: "SIR0018401",
    sirTitle: "UNC path lateral movement — FacStaff laptop with stale VPN profile",
    xdrTitle: "UNC staging share — JONE-ATH-B2240",
    xdrPriority: 670,
    xdrState: "New",
    xdrTactics: ["Lateral Movement", "Defense Evasion"],
    xdrBlurb: "Signed-but-revoked DLL pulled from an internal UNC share; review VPN split-tunnel and SMB session reuse.",
    msisacFeedId: "MS-ISAC-2025-SMB-LAT-0098",
    sectorContext:
      "UNC path \\\\JONE-ATH-B2240\\public\\staging observed in peer alerts; overlaps with stolen NTLM relay lab used in spring phishing sim.",
    firstSeenUtc: "2025-03-22T11:15:00.000Z",
    lastObservedUtc: "2025-03-24T19:02:00.000Z",
    narrative:
      "Two file events only — both reference a signed-but-revoked DLL pulled from an internal share. MS-ISAC lists the same external IP as a sinkhole that impersonates Windows Update metadata. No PowerShell on this slice; focus is SMB session reuse from VPN split-tunnel misconfig.",
    maliciousIpv4: [
      { ip: "198.51.100.22", context: "Masqueraded WSUS metadata pull", firstSeenUtc: "2025-03-24T18:55:12.000Z" },
      { ip: "10.4.12.1", context: "Internal DC — unexpected NTLM from laptop during off-hours", firstSeenUtc: "2025-03-24T18:54:01.000Z" },
    ],
    maliciousDomains: [
      { domain: "wsus-cdn.windows-update.fake", context: "Homoglyph + invalid TLD", observedVia: "HTTPS proxy log (simulated)" },
    ],
    dnsQueriesSample: ["wsus-cdn.windows-update.fake", "ctldl.windowsupdate.com.edgekey.net"],
    ttps: ["T1021.002 (SMB/Windows Admin Shares)", "T1550.002 (Pass the Hash)", "T1078 (Valid Accounts)"],
    relatedIntelNote: "Internal red-team runbook RT-FAC-03 references the same share path — verify not scheduled exercise.",
  },

  "inc-3": {
    sirId: "SIR0016208",
    sirTitle: "Lab malware sample handle — student VM isolated segment",
    msisacFeedId: "MS-ISAC-2025-EDU-LAB-0003",
    sectorContext:
      "Controlled malware corpus in LabClass; MS-ISAC still flags cross-network copy attempts even when VLAN ACLs exist.",
    firstSeenUtc: "2025-02-10T16:00:00.000Z",
    lastObservedUtc: "2025-04-09T18:22:01.000Z",
    narrative:
      "Single quarantine event on sample.dll — hash matches public “AMSI bypass lab” repo. Observed DNS to academic torrent tracker (false positive risk) but blocked at perimeter. Document for curriculum: compare sandbox vs. real endpoint behavior.",
    maliciousIpv4: [{ ip: "10.8.1.1", context: "Lab gateway — no external route", firstSeenUtc: "2025-04-09T18:22:01.000Z" }],
    maliciousDomains: [
      { domain: "malware-sample.edu.internal", context: "Split-horizon DNS for class share", observedVia: "Connector" },
    ],
    dnsQueriesSample: ["malware-sample.edu.internal", "pool.labtorrent.campus.local"],
    ttps: ["T0846 (Remote Access Tools)", "T1480 (Execution Guardrails)"],
    relatedIntelNote: "If this hash appears outside LAB-WS VLAN, escalate immediately — per lab charter §4.",
  },

  "inc-ip-1": {
    sirId: "SIR0019011",
    sirTitle: "SOC training injector — synthetic beacon for class keyboard drills",
    msisacFeedId: "MS-ISAC-2025-TRAIN-SOC-0001",
    sectorContext:
      "Dedicated SOC training host; feed still emits SIR so students practice XDR pivot without production blast radius.",
    firstSeenUtc: "2025-01-05T09:00:00.000Z",
    lastObservedUtc: "2025-04-10T22:38:11.000Z",
    narrative:
      "Single synthetic event reusing BGAUpdate-style hash in a controlled loopback. Malicious IPs listed are from TEST-NET documentation ranges only. Use this SIR to validate copy/paste from AMP Events into XDR Investigate search bar.",
    maliciousIpv4: [
      { ip: "203.0.113.44", context: "TEST-NET — documented non-routable (RFC 5737)", firstSeenUtc: "2025-04-10T22:38:11.000Z" },
    ],
    maliciousDomains: [{ domain: "lab-injector.soc-training.local", context: "Internal only", observedVia: "Hosts file (sim)" }],
    dnsQueriesSample: ["lab-injector.soc-training.local"],
    ttps: ["T1071 (Application Layer Protocol)", "T1041 (Exfiltration Over C2 Channel)"],
    relatedIntelNote: "Banner in UI should read TRAINING — if not, you are on the wrong tenant (simulated message).",
  },

  "inc-4": {
    sirId: "SIR0017733",
    sirTitle: "FIN-EXEC-01 — dual-use RMM + payroll-themed ISO staging",
    msisacFeedId: "MS-ISAC-2025-FIN-RMM-0312",
    sectorContext:
      "Finance executive workstation: high-value target. MS-ISAC correlates same hash family with payroll fraud BEC threads in NA insurance vertical.",
    firstSeenUtc: "2025-03-20T07:30:00.000Z",
    lastObservedUtc: "2025-04-10T22:38:11.000Z",
    narrative:
      "Four events: updater drop, PowerShell staging, lateral SMB probe, and DLL side-load. Same SHA-256 anchors as inc-1 narrative but on FacStaff policy with stricter exploit prevention — still quarantine failures due to tamper attempt on AMP driver (simulated).",
    maliciousIpv4: [
      { ip: "203.0.113.44", context: "Shared C2 with inc-1 cluster (sector graph edge)", firstSeenUtc: "2025-04-10T22:38:09.000Z" },
      { ip: "198.51.100.77", context: "DoH resolver — JA3 overlap with inc-1", firstSeenUtc: "2025-04-10T22:38:10.000Z" },
      { ip: "192.0.2.15", context: "Second-stage", firstSeenUtc: "2025-04-10T21:12:44.000Z" },
      { ip: "10.0.0.0", context: "Invalid subnet ping sweep (artifact)", firstSeenUtc: "2025-04-10T21:12:40.000Z" },
    ],
    maliciousDomains: [
      { domain: "cdn-bgassist.net", context: "Shared with inc-1", observedVia: "DNS" },
      { domain: "payroll-hrportal.net", context: "BEC lookalike registered 48h before event", observedVia: "Email header trace" },
    ],
    dnsQueriesSample: ["payroll-hrportal.net", "a7f3.cdn-bgassist.net"],
    ttps: ["T1566.002 (Spearphishing Link)", "T1059.001", "T1572 (Protocol Tunneling)"],
    relatedIntelNote: "Board briefing slide deck SOC-BRD-2025-04 references this SIR id.",
  },

  "inc-5": {
    sirId: "SIR0016884",
    sirTitle: "PrintNightmare follow-up — spooler abuse + driver hotfix MSI conflict",
    msisacFeedId: "MS-ISAC-2025-PRINT-0401",
    sectorContext: "Print servers remain attractive for lateral movement; MS-ISAC tracks PowerShell from spooler context across K–12 and SMB print shops.",
    firstSeenUtc: "2025-03-28T12:00:00.000Z",
    lastObservedUtc: "2025-04-10T20:01:00.000Z",
    narrative:
      "High-severity script under SYSTEM, then suspicious unidrv32.dll load, then quarantined MSI. Domains tie to fake driver catalog; IP 203.0.113.88 hosts a Let’s Encrypt cert issued to “print-fix-now.xyz”.",
    maliciousIpv4: [
      { ip: "203.0.113.88", context: "Fake driver CDN", firstSeenUtc: "2025-04-10T20:01:00.000Z" },
      { ip: "10.4.50.1", context: "Print server DC — unexpected SMB from spooler", firstSeenUtc: "2025-04-10T19:55:12.000Z" },
    ],
    maliciousDomains: [
      { domain: "print-fix-now.xyz", context: "Registered via privacy proxy", observedVia: "TLS cert SAN" },
      { domain: "driver-catalog-updates.ru", context: "Homoglyph of vendor portal", observedVia: "User-Agent in proxy" },
    ],
    dnsQueriesSample: ["print-fix-now.xyz", "ctldl.driver-catalog-updates.ru"],
    ttps: ["T1068 (Exploitation for Privilege Escalation)", "T1547.012 (Print Processors)", "T1059.001"],
    relatedIntelNote: "Patch Tuesday overlap: discuss reboot debt vs. hotfix MSI.",
  },

  "inc-6": {
    sirId: "SIR0017455",
    sirTitle: "HR-themed XLSM — macro droppers aligned with payroll fraud BEC",
    msisacFeedId: "MS-ISAC-2025-BEC-HR-0177",
    sectorContext: "HR laptop: Excel macro enabling content, second-stage binary quarantined; email path shows external SMTP 192.0.2.199.",
    firstSeenUtc: "2025-03-25T14:00:00.000Z",
    lastObservedUtc: "2025-04-10T18:23:01.000Z",
    narrative:
      "Q2_Bonus.xlsm uses Auto_Open to write macro_payload.bin; MS-ISAC ties domain bonus-payout-excel.net to prior campaigns. Same TTPs as FIN-7 facsimile in training catalog.",
    maliciousIpv4: [
      { ip: "192.0.2.199", context: "SMTP submission from compromised marketing SaaS", firstSeenUtc: "2025-04-10T18:22:33.000Z" },
      { ip: "10.4.8.5", context: "Internal relay — mail trace", firstSeenUtc: "2025-04-10T18:22:40.000Z" },
    ],
    maliciousDomains: [
      { domain: "bonus-payout-excel.net", context: "Sender envelope", observedVia: "Message-ID + SPF fail" },
      { domain: "excel-template-cdn.io", context: "Macro remote template", observedVia: "VBA Project stream" },
    ],
    dnsQueriesSample: ["excel-template-cdn.io", "msoid.bonus-payout-excel.net"],
    ttps: ["T1566.001", "T1204.002 (Malicious File)", "T1119 (Automated Collection)"],
    relatedIntelNote: "Mailbox rule hunt: same user had Inbox rule forwarding to external folder (simulated finding).",
  },

  "inc-7": {
    sirId: "SIR0018120",
    sirTitle: "Sales VPN host — fake invoice PE + encoded PowerShell in one session",
    msisacFeedId: "MS-ISAC-2025-VPN-SALES-0089",
    sectorContext: "Split-tunnel VPN users in sales org; MS-ISAC highlights invoice.exe with remote 198.51.100.33:8080 (non-standard HTTPS).",
    firstSeenUtc: "2025-03-27T09:00:00.000Z",
    lastObservedUtc: "2025-04-10T17:11:02.000Z",
    narrative:
      "Blocked execution on invoice.exe followed by encoded PowerShell. Domains invoice-tracker.io and pay-verify.net appear in MS-ISAC bulletins for NA retail.",
    maliciousIpv4: [
      { ip: "198.51.100.33", context: "C2 on 8080 — TLS with self-signed", firstSeenUtc: "2025-04-10T17:10:44.000Z" },
      { ip: "172.27.10.1", context: "VPN concentrator — anomalous UDP encapsulation", firstSeenUtc: "2025-04-10T17:10:50.000Z" },
    ],
    maliciousDomains: [
      { domain: "invoice-tracker.io", context: "DGA subdomain rotation", observedVia: "SNI" },
      { domain: "pay-verify.net", context: "Credential harvest form", observedVia: "HTTP redirect chain" },
    ],
    dnsQueriesSample: ["api.invoice-tracker.io", "cdn.pay-verify.net"],
    ttps: ["T1204.002", "T1027 (Obfuscated Files)", "T1105 (Ingress Tool Transfer)"],
    relatedIntelNote: "Cross-reference with HR SIR if same hash appears — possible shared attachment builder.",
  },

  "inc-8": {
    sirId: "SIR0019003",
    sirTitle: "DMZ IIS — ASP.NET webshell with POST to rare China VPS (simulated attribution)",
    xdrTitle: "Webshell on DMZ IIS — WEB-APP-01",
    xdrPriority: 910,
    xdrState: "New",
    xdrTactics: ["Initial Access", "Persistence", "Impact"],
    xdrBlurb: "Critical webshell under w3wp.exe — assume breach tabletop; correlate WAF and endpoint trajectory.",
    msisacFeedId: "MS-ISAC-2025-WEB-DMZ-0221",
    sectorContext: "Lab DMZ web server; MS-ISAC notes webshell SHA tied to AS4134-like VPS 45.33.32.156 in student exercises only.",
    firstSeenUtc: "2025-03-15T10:00:00.000Z",
    lastObservedUtc: "2025-04-10T16:40:00.000Z",
    narrative:
      "Critical event on aspnet_client.aspx — w3wp.exe child cmd.exe pattern. Domain upload-cdn.site used for one-shot credential dump. This SIR drives “assume breach” tabletop for Data Group.",
    maliciousIpv4: [
      { ip: "45.33.32.156", context: "VPS — student exercise IP (documented)", firstSeenUtc: "2025-04-10T16:40:00.000Z" },
      { ip: "10.9.0.1", context: "DMZ firewall internal hop", firstSeenUtc: "2025-04-10T16:39:58.000Z" },
    ],
    maliciousDomains: [
      { domain: "upload-cdn.site", context: "One-shot staging", observedVia: "POST body host header" },
      { domain: "shell-backup.azureedge.invalid", context: "Fake CDN", observedVia: "Referer" },
    ],
    dnsQueriesSample: ["upload-cdn.site", "shell-backup.azureedge.invalid"],
    ttps: ["T1505.003 (Web Shell)", "T1078", "T1048 (Exfiltration Over Alternative Protocol)"],
    relatedIntelNote: "WAF virtual patch rule WAF-DMZ-14 would block this path — discuss compensating controls.",
  },

  "inc-polc": {
    sirId: "SIR0019007",
    sirTitle: "FacStaff endpoint — Simple_Custom_Detection + quarantine outcome mismatch",
    msisacFeedId: "MS-ISAC-2024-EDU-AMP-EVENTS-DRILL",
    sectorContext: "Classic teaching set: File Detection, Quarantine Failed, then Quarantine Succeeded on loader.js hash.",
    firstSeenUtc: "2024-04-01T04:16:00.000Z",
    lastObservedUtc: "2024-04-01T19:09:04.000Z",
    narrative:
      "POLC-MJ0LQLRR shows the same SHA-256 for loader.js with one failed then successful quarantine attempt — use this row to explain race conditions and policy precedence in class.",
    maliciousIpv4: [
      { ip: "203.0.113.201", context: "HTTPS callback observed from wscript child", firstSeenUtc: "2024-04-01T04:16:37.000Z" },
      { ip: "192.0.2.88", context: "Staging host for suspicious_payload.bin", firstSeenUtc: "2024-04-01T04:16:39.000Z" },
    ],
    maliciousDomains: [
      { domain: "stage-cdn.lab-datagroup.invalid", context: "Loader pulls second stage", observedVia: "HTTPS SNI" },
    ],
    dnsQueriesSample: ["stage-cdn.lab-datagroup.invalid", "telemetry.faculty.datagroup.lab"],
    ttps: ["T1059.007 (JavaScript)", "T1204.002 (Malicious File)", "T1562.001 (Disable or Modify Tools)"],
    relatedIntelNote: "Search AMP global bar for f712b4e1 (SocGholish) or 10.3.0.215 — ties to this host.",
    xdrTitle: "Custom detection hits — POLC-MJ0LQLRR",
    xdrPriority: 820,
    xdrState: "New",
    xdrTactics: ["Execution", "Defense Evasion", "Command and Control"],
    xdrBlurb: "Medium-severity cluster: Simple_Custom_Detection fired; one quarantine failure then success on loader.js.",
  },

  "inc-xdr-ssh": {
    sirId: "SIR0018700",
    sirTitle: "New Remote Access on 10.109.0.61 — first-seen SSH sources",
    msisacFeedId: "MS-ISAC-2024-ACCESS-SSH-DRILL",
    sectorContext: "Institute file server; analytics compares historical SSH peers and flags new external origins.",
    firstSeenUtc: "2024-04-01T02:35:00.000Z",
    lastObservedUtc: "2024-04-01T02:40:35.000Z",
    narrative:
      "Device 10.109.0.61 accepted SSH from 111.237.111.214 and opened TLS to 108.140.103.28 shortly after — graph this in XDR as potential tunnel or exfil prep (training scenario only).",
    maliciousIpv4: [
      { ip: "111.237.111.214", context: "First-seen inbound SSH — no prior asset relationship", firstSeenUtc: "2024-04-01T02:40:31.000Z" },
      { ip: "108.140.103.28", context: "Outbound TLS immediately after login burst", firstSeenUtc: "2024-04-01T02:40:35.000Z" },
    ],
    maliciousDomains: [{ domain: "pastebin-anon.invalid", context: "Possible C2 config paste (simulated)", observedVia: "Proxy log" }],
    dnsQueriesSample: ["pastebin-anon.invalid", "update.azureedge-test.invalid"],
    ttps: ["T1021.004 (SSH)", "T1071.001 (Web Protocols)", "T1048 (Exfiltration)"],
    relatedIntelNote: "Practice pivots: search 10.109.0.61, 111.237.111.214, or 108.140.103.28 in the AMP/XDR search bar.",
    xdrTitle: "New Remote Access on 10.109.0.61",
    xdrPriority: 870,
    xdrState: "New",
    xdrTactics: ["Initial Access", "Defense Evasion", "Command and Control"],
    xdrBlurb:
      "Device has been accessed from a remote host for the first time in recent history. Validate jump-box inventory vs. rogue SSH.",
  },

  "inc-res-1": {
    sirId: "SIR0014001",
    sirTitle: "Resolved — retired kiosk false positive cleanup tool",
    msisacFeedId: "MS-ISAC-ARCHIVE-2024-KIOSK-0001",
    sectorContext: "Historical: kiosk cleanup.exe signed by retired vendor; MS-ISAC no longer tracks hash.",
    firstSeenUtc: "2024-03-01T12:00:00.000Z",
    lastObservedUtc: "2024-03-28T09:00:00.000Z",
    narrative:
      "Low severity quarantine on decommissioned hardware. No active malicious IPs; domains empty. Retained for student “resolved queue” practice only.",
    maliciousIpv4: [],
    maliciousDomains: [],
    dnsQueriesSample: [],
    ttps: ["T1204.002 (benign user execution)"],
    relatedIntelNote: "Do not escalate — closed in change record CHG-44921.",
  },
};
