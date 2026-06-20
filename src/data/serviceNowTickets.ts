import { classroomApi } from "../lib/apiClient";

export type SnState = "New" | "In Progress" | "On Hold" | "Resolved" | "Closed";
export type SnImpact = "1 - High" | "2 - Medium" | "3 - Low";
export type SnUrgency = "1 - High" | "2 - Medium" | "3 - Low";
export type SnPriority = "1 - Critical" | "2 - High" | "3 - Moderate" | "4 - Low" | "5 - Planning";

export type SnResolutionCode = 
  | "Solved (Permanently)"
  | "Solved (Work Around)"
  | "Solved Remotely (Permanently)"
  | "Not Solved (Not Reproducible)"
  | "Not Solved (Too Costly)"
  | "Closed/Resolved by Caller";

export type SnAttachment = {
  id: string;
  name: string;
  size: string;
  type: "image" | "file";
  isSpreadsheet: boolean;
};

export type SnEmail = {
  from: string;
  date: string;
  subject: string;
  to: string;
  bodyHtml: string;
};

export type SnActivityEntryBase = {
  id: string;
  timestamp: string;
};

export type SnActivityWorkNote = SnActivityEntryBase & {
  type: "work_note";
  authorName: string;
  authorInitials: string;
  text: string;
};

export type SnActivityComment = SnActivityEntryBase & {
  type: "comment";
  authorName: string;
  authorInitials: string;
  text: string;
};

export type SnActivityFieldChange = SnActivityEntryBase & {
  type: "field_change";
  authorName: string;
  authorInitials: string;
  field: string;
  oldValue: string;
  newValue: string;
};

export type SnActivityEmail = SnActivityEntryBase & {
  type: "email";
  authorName: string;
  authorInitials: string;
  subject: string;
  emailDetails: SnEmail;
};

export type SnActivityAttachment = SnActivityEntryBase & {
  type: "attachment";
  authorName: string;
  authorInitials: string;
  fileName: string;
  size: string;
};

export type SnActivityEntry = 
  | SnActivityWorkNote
  | SnActivityComment
  | SnActivityFieldChange
  | SnActivityEmail
  | SnActivityAttachment;

export type SnAmpBlocklistRef = {
  domains?: string[];
  urls?: string[];
  ips?: string[];
  hashes?: string[];
};

export type SnTicket = {
  number: string;
  openedAt: string;
  shortDescription: string;
  description: string;
  caller: string;
  email: string;
  phone: string;
  location: string;
  category: string;
  subcategory: string;
  businessServices: string;
  configurationItem: string;
  channel: string;
  state: SnState;
  impact: SnImpact;
  urgency: SnUrgency;
  priority: SnPriority;
  assignmentGroup: string;
  assignedTo: string;
  attachments: SnAttachment[];
  activities: SnActivityEntry[];
  resolutionCode?: SnResolutionCode;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  linkedXdrIncidentId?: string;
  linkedDefenderIncidentId?: string;
  linkedSentinelIncidentId?: string;
  /** IOCs to push into AMP blocklist when ticket is resolved. */
  ampBlocklist?: SnAmpBlocklistRef;
  /** Import MS-ISAC spreadsheet IOC set on resolve (1 = week of 4/20, 2 = week of 4/27). */
  importMsisacWeek?: 1 | 2;
  /** Domains already blocked in AMP before ticket resolution (e.g. false positives). */
  ampPreBlockedDomains?: string[];
  relatedEmail?: SnEmail;
};

// Priority Matrix Logic:
// High x High = 1 - Critical
// High x Medium = 2 - High
// High x Low = 3 - Moderate
// Medium x High = 2 - High
// Medium x Medium = 3 - Moderate
// Medium x Low = 4 - Low
// Low x High = 3 - Moderate
// Low x Medium = 4 - Low
// Low x Low = 5 - Planning
export function derivePriority(impact: SnImpact, urgency: SnUrgency): SnPriority {
  const i = parseInt(impact[0], 10);
  const u = parseInt(urgency[0], 10);
  const score = i + u; // lower score means higher priority

  if (score === 2) return "1 - Critical"; // 1 + 1
  if (score === 3) return "2 - High"; // 1 + 2 or 2 + 1
  if (score === 4) return "3 - Moderate"; // 2 + 2 or 1 + 3 or 3 + 1
  if (score === 5) return "4 - Low"; // 2 + 3 or 3 + 2
  return "5 - Planning"; // 3 + 3
}

export const INITIAL_SERVICENOW_TICKETS: SnTicket[] = [
  {
    number: "INC0162203",
    openedAt: "2026-04-27",
    shortDescription: "FW: [EXTERNAL]Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 - 4/26/26 - TLP:AMBER",
    description: "Forwarded MS-ISAC weekly threat intelligence. Review attached spreadsheet and ingest IOCs into firewall, proxy, and Cisco Secure Endpoint blocklists.",
    caller: "Bari Snyder",
    email: "Bari.Snyder@datagroup.com",
    phone: "9107754994",
    location: "Room 244 Joseph B Oxendine Admin Bldg",
    category: "Network & Telephony",
    subcategory: "Network Security",
    businessServices: "",
    configurationItem: "",
    channel: "Email/Chat",
    state: "Resolved",
    impact: "3 - Low",
    urgency: "3 - Low",
    priority: "5 - Planning",
    assignmentGroup: "Network & Telephony",
    assignedTo: "System Administrator",
    importMsisacWeek: 1,
    resolutionCode: "Solved (Permanently)",
    resolutionNotes: "Blocked Malicious SHAs and Domains",
    resolvedBy: "System Administrator",
    resolvedAt: "2026-05-26 04:42:21 PM",
    attachments: [
      { id: "att-1", name: "IPs Domains and URLs of Interest 2026-04-20 to 2026-04-26.xlsx", size: "49.5 KB", type: "file", isSpreadsheet: true },
      { id: "att-2", name: "image001.png", size: "9.79 KB", type: "image", isSpreadsheet: false },
      { id: "att-2b", name: "image002.png", size: "1.84 KB", type: "image", isSpreadsheet: false },
      { id: "att-2c", name: "image003.png", size: "3.03 KB", type: "image", isSpreadsheet: false },
      { id: "att-2d", name: "image004.png", size: "1.72 KB", type: "image", isSpreadsheet: false },
    ],
    relatedEmail: {
      from: "MS-ISAC Advisory <MS-ISAC_Advisory@msisac.org>",
      date: "Monday, April 27, 2026 2:06:57 PM (UTC-05:00) Eastern Time (US & Canada)",
      subject: "[EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 - 4/26/26 - TLP:AMBER",
      to: "Bari.Snyder@datagroup.com",
      bodyHtml: `
        <div style="font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          <p><a href="#">Click here to view the full details of the email</a></p>
          <p><em>forwarded by: Bari.Snyder@datagroup.com</em></p>
          <div style="background-color: #ffcccc; padding: 10px; border: 1px solid #cc0000; margin: 12px 0;">
            <strong>CAUTION: External Sender</strong> — This email originated from outside of DATA GROUP. Do NOT click on links or open files from senders you do not trust.
          </div>
          <p style="color: #cc6600; font-weight: bold;">TLP:AMBER</p>
          <p>This advisory contains malicious IPs, domains, and URLs observed by MS-ISAC monitoring and CIS CTI between April 20 and April 26, 2026.</p>
          <p><strong>Recommendations:</strong> Consider blocking and alerting on these IOCs. Check source hosts for signs of infection if traffic to these IOCs is found. Remove indicators from blocklists no later than 4 weeks after their last appearance.</p>
          <p>CIS CTI automated lists:<br>
          <a href="#">cti-lists.cisecurity.org/lists/IPs-30days.txt</a><br>
          <a href="#">cti-lists.cisecurity.org/lists/Domains-30days.txt</a><br>
          <a href="#">cti-lists.cisecurity.org/lists/URLs-30days.txt</a><br>
          <a href="#">cti-lists.cisecurity.org/lists/Hashes-1year.txt</a></p>
          <p>MS-ISAC 24x7 SOC: soc@cisecurity.org · 1-866-787-4722</p>
        </div>
      `,
    },
    activities: [
      {
        id: "act-1",
        timestamp: "2026-04-27 02:07:29 PM",
        type: "email",
        authorName: "System",
        authorInitials: "SYS",
        subject: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 - 4/26/26 - TLP:AMBER",
        emailDetails: {
          from: "Bari.Snyder@datagroup.com",
          date: "2026-04-27 02:07:29 PM",
          subject: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 - 4/26/26 - TLP:AMBER",
          to: "helpdesk@datagroup.com",
          bodyHtml: "<p>Please process these new IOCs.</p>",
        },
      },
      {
        id: "act-2",
        timestamp: "2026-04-20",
        type: "attachment",
        authorName: "System",
        authorInitials: "SYS",
        fileName: "IPs Domains and URLs of Interest 2026-04-20 to 2026-04-26.xlsx",
        size: "49.5 KB",
      },
      {
        id: "act-2b",
        timestamp: "2026-05-20 09:15:00 AM",
        type: "work_note",
        authorName: "System Administrator",
        authorInitials: "SA",
        text: "Started IOC review. Downloaded spreadsheet and cross-referenced against Sentinel and AMP logs.",
      },
      {
        id: "act-2c",
        timestamp: "2026-05-24 02:30:00 PM",
        type: "field_change",
        authorName: "System Administrator",
        authorInitials: "SA",
        field: "Incident state",
        oldValue: "New",
        newValue: "In Progress",
      },
      {
        id: "act-3",
        timestamp: "2026-05-26 04:42:21 PM",
        type: "field_change",
        authorName: "System Administrator",
        authorInitials: "SA",
        field: "Incident state",
        oldValue: "In Progress",
        newValue: "Resolved",
      },
      {
        id: "act-4",
        timestamp: "2026-05-26 04:42:21 PM",
        type: "field_change",
        authorName: "System Administrator",
        authorInitials: "SA",
        field: "Resolution code",
        oldValue: "",
        newValue: "Solved (Permanently)",
      },
      {
        id: "act-5",
        timestamp: "2026-05-26 04:42:21 PM",
        type: "field_change",
        authorName: "System Administrator",
        authorInitials: "SA",
        field: "Resolution notes",
        oldValue: "",
        newValue: "Blocked Malicious SHAs and Domains",
      },
      {
        id: "act-6",
        timestamp: "2026-05-26 04:42:21 PM",
        type: "email",
        authorName: "System",
        authorInitials: "SYS",
        subject: "INC0162203: Incident Resolved For - FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 - 4/26/26 - TLP:AMBER",
        emailDetails: {
          from: "Data Group Help Desk",
          date: "2026-05-26 04:42:21 PM",
          to: "Bari.Snyder@datagroup.com",
          subject: "INC0162203: Incident Resolved For - FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 - 4/26/26 - TLP:AMBER",
          bodyHtml: "<p>Your incident has been resolved. Resolution notes: Blocked Malicious SHAs and Domains</p>",
        },
      },
      {
        id: "act-7",
        timestamp: "2026-05-26 04:45:00 PM",
        type: "work_note",
        authorName: "System Administrator",
        authorInitials: "SA",
        text: "Part 6 done",
      },
    ],
  },
  {
    number: "INC0162675",
    openedAt: "2026-05-04",
    shortDescription: "FW: [EXTERNAL]Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/27/26 - 5/3/26 - TLP:AMBER",
    description: "Weekly MS-ISAC IOC feed for April 27 through May 3. Ingest new indicators and age out indicators from prior weeks per MS-ISAC guidance.",
    caller: "Bari Snyder",
    email: "Bari.Snyder@datagroup.com",
    phone: "9107754994",
    location: "Room 244 Joseph B Oxendine Admin Bldg",
    category: "Network & Telephony",
    subcategory: "Network Security",
    businessServices: "",
    configurationItem: "",
    channel: "Email/Chat",
    state: "Resolved",
    impact: "3 - Low",
    urgency: "3 - Low",
    priority: "5 - Planning",
    assignmentGroup: "Network & Telephony",
    assignedTo: "System Administrator",
    importMsisacWeek: 2,
    resolutionCode: "Solved (Permanently)",
    resolutionNotes: "Blocked Malicious SHAs and Domains",
    resolvedBy: "System Administrator",
    resolvedAt: "2026-05-26 05:10:00 PM",
    attachments: [
      { id: "att-3", name: "IPs Domains and URLs of Interest 2026-04-27 to 2026-05-03.xlsx", size: "48.2 KB", type: "file", isSpreadsheet: true },
    ],
    relatedEmail: {
      from: "MS-ISAC Advisory <MS-ISAC_Advisory@msisac.org>",
      date: "Monday, May 4, 2026 2:13:09 PM (UTC-05:00) Eastern Time (US & Canada)",
      subject: "[EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/27/26 - 5/3/26 - TLP:AMBER",
      to: "Bari.Snyder@datagroup.com",
      bodyHtml: `<p style="color:#cc6600;font-weight:bold">TLP:AMBER</p><p>New weekly IOCs attached. Review and block as appropriate.</p>`,
    },
    activities: [
      {
        id: "act-8",
        timestamp: "2026-05-04 02:13:09 PM",
        type: "email",
        authorName: "System",
        authorInitials: "SYS",
        subject: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/27/26 - 5/3/26 - TLP:AMBER",
        emailDetails: {
          from: "Bari.Snyder@datagroup.com",
          date: "2026-05-04 02:13:09 PM",
          subject: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/27/26 - 5/3/26 - TLP:AMBER",
          to: "helpdesk@datagroup.com",
          bodyHtml: "<p>New weekly IOCs.</p>",
        },
      },
      {
        id: "act-9",
        timestamp: "2026-05-26 05:10:00 PM",
        type: "field_change",
        authorName: "System Administrator",
        authorInitials: "SA",
        field: "Incident state",
        oldValue: "In Progress",
        newValue: "Resolved",
      },
      {
        id: "act-10",
        timestamp: "2026-05-26 05:10:00 PM",
        type: "field_change",
        authorName: "System Administrator",
        authorInitials: "SA",
        field: "Resolution notes",
        oldValue: "",
        newValue: "Blocked Malicious SHAs and Domains",
      },
    ],
  },
  {
    number: "INC0162810",
    openedAt: "2026-05-26 09:14:00 AM",
    shortDescription: "Suspicious email with attachment reported by Sarah Chen",
    description: "User reported receiving a strange email appearing to be from Microsoft, asking to update her credentials. She clicked the link and downloaded an attachment. Device is HR-LAPTOP-04. Cisco XDR case INC-XDR-001 and Defender incident DINC-0001 opened automatically.",
    caller: "Sarah Chen",
    email: "sarah.chen@datagroup.com",
    phone: "555-0192",
    location: "HR Department — Oxendine Admin Bldg",
    category: "Security",
    subcategory: "Phishing",
    businessServices: "Corporate Email",
    configurationItem: "HR-LAPTOP-04",
    channel: "Phone",
    state: "In Progress",
    impact: "1 - High",
    urgency: "1 - High",
    priority: "1 - Critical",
    assignmentGroup: "Security Operations Center",
    assignedTo: "System Administrator",
    attachments: [],
    linkedXdrIncidentId: "INC-XDR-001",
    linkedDefenderIncidentId: "DINC-0001",
    linkedSentinelIncidentId: "SENT-3001",
    activities: [
      {
        id: "act-11",
        timestamp: "2026-05-26 09:14:00 AM",
        type: "work_note",
        authorName: "Helpdesk Agent",
        authorInitials: "HA",
        text: "User called in panicking. Advised user to disconnect from network. Escalating to SOC.",
      },
      {
        id: "act-12",
        timestamp: "2026-05-26 09:22:00 AM",
        type: "field_change",
        authorName: "System",
        authorInitials: "SYS",
        field: "Incident state",
        oldValue: "New",
        newValue: "In Progress",
      },
      {
        id: "act-13",
        timestamp: "2026-05-26 09:30:00 AM",
        type: "work_note",
        authorName: "System Administrator",
        authorInitials: "SA",
        text: "Pivoting to Cisco XDR and Defender. AsyncRAT hash b2a965c5… detected on HR-LAPTOP-04.",
      },
    ],
  },
  {
    number: "INC0162822",
    openedAt: "2026-05-26 10:30:45 AM",
    shortDescription: "EDR Alert: Emotet Loader Detected on SALES-VM-22",
    description: "Automated ticket from Cisco Secure Endpoint. Emotet payload detected executing via PowerShell macro on SALES-VM-22. Linked to Defender DINC-0002 and XDR INC-XDR-005.",
    caller: "System",
    email: "alerts@datagroup.com",
    phone: "",
    location: "Datacenter",
    category: "Security",
    subcategory: "Malware",
    businessServices: "Endpoint Security",
    configurationItem: "SALES-VM-22",
    channel: "System",
    state: "In Progress",
    impact: "1 - High",
    urgency: "2 - Medium",
    priority: "2 - High",
    assignmentGroup: "Security Operations Center",
    assignedTo: "System Administrator",
    attachments: [],
    linkedXdrIncidentId: "INC-XDR-005",
    linkedDefenderIncidentId: "DINC-0002",
    linkedSentinelIncidentId: "SENT-3002",
    activities: [
      {
        id: "act-14",
        timestamp: "2026-05-26 10:30:45 AM",
        type: "work_note",
        authorName: "System",
        authorInitials: "SYS",
        text: "Auto-created from AMP retrospective event on SALES-VM-22.",
      },
    ],
  },
  {
    number: "INC0162845",
    openedAt: "2026-05-27 08:15:22 AM",
    shortDescription: "Multiple failed RDP logins for MdUsman, followed by successful login",
    description: "Sentinel analytic rule SENT-3017 correlated 847 failed RDP attempts followed by a successful login from 185.220.101.47 to LAB-WS-0142. Investigate for account compromise.",
    caller: "Security Monitoring",
    email: "soc-alerts@datagroup.com",
    phone: "",
    location: "Campus Lab",
    category: "Security",
    subcategory: "Account Compromise",
    businessServices: "Active Directory",
    configurationItem: "LAB-WS-0142",
    channel: "System",
    state: "New",
    impact: "2 - Medium",
    urgency: "1 - High",
    priority: "2 - High",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    linkedXdrIncidentId: "INC-XDR-009",
    linkedSentinelIncidentId: "SENT-3017",
    activities: [],
  },
  {
    number: "INC0162850",
    openedAt: "2026-05-27 11:22:10 AM",
    shortDescription: "Blocked access to legitimate marketing site — hubspot.com blocked by AMP",
    description: "Marketing team reports hubspot.com is unreachable. Cisco Secure Endpoint Web Filter blocked hubspot.com as suspicious (category: newly registered domain heuristic). Verify in AMP Outbreak Control block list and allow if false positive.",
    caller: "Marketing Team",
    email: "marketing@datagroup.com",
    phone: "555-0341",
    location: "Building B",
    category: "Network & Telephony",
    subcategory: "Web Filtering",
    businessServices: "Internet Access",
    configurationItem: "",
    channel: "Self-Service",
    state: "New",
    impact: "3 - Low",
    urgency: "3 - Low",
    priority: "5 - Planning",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    ampPreBlockedDomains: ["hubspot.com"],
    activities: [
      {
        id: "act-15",
        timestamp: "2026-05-27 11:22:10 AM",
        type: "work_note",
        authorName: "System",
        authorInitials: "SYS",
        text: "AMP Web Filter event: hubspot.com blocked on 14 endpoints in Marketing group.",
      },
    ],
  },
  {
    number: "INC0162861",
    openedAt: "2026-05-28 07:45:00 AM",
    shortDescription: "Sentinel incident SENT-3018 — impossible travel sign-in for svc_backup",
    description: "Microsoft Sentinel correlated impossible travel: svc_backup authenticated from Clifton Park NY and Bucharest RO within 12 minutes. Review identity risk in Defender (DINC-0013) and disable account if confirmed compromise.",
    caller: "Security Monitoring",
    email: "soc-alerts@datagroup.com",
    phone: "",
    location: "Identity Services",
    category: "Security",
    subcategory: "Identity",
    businessServices: "Azure AD",
    configurationItem: "svc_backup",
    channel: "System",
    state: "In Progress",
    impact: "1 - High",
    urgency: "2 - Medium",
    priority: "2 - High",
    assignmentGroup: "Security Operations Center",
    assignedTo: "System Administrator",
    attachments: [],
    linkedSentinelIncidentId: "SENT-3018",
    linkedDefenderIncidentId: "DINC-0013",
    activities: [
      {
        id: "act-16",
        timestamp: "2026-05-28 07:50:00 AM",
        type: "work_note",
        authorName: "System Administrator",
        authorInitials: "SA",
        text: "Opened Sentinel incident SENT-3018. Running KQL hunt for svc_backup sign-ins last 72h.",
      },
    ],
  },
  {
    number: "INC0162875",
    openedAt: "2026-05-28 02:15:00 PM",
    shortDescription: "BEC attempt — CFO wire transfer request from spoofed domain",
    description: "Finance received email from ceo-review@secure-login.portal-update.net requesting urgent wire transfer. Domain matches MS-ISAC IOC list. Block domain in AMP and purge mailbox.",
    caller: "Finance Department",
    email: "finance@datagroup.com",
    phone: "555-0188",
    location: "Finance Office",
    category: "Security",
    subcategory: "Phishing",
    businessServices: "Corporate Email",
    configurationItem: "",
    channel: "Email/Chat",
    state: "New",
    impact: "1 - High",
    urgency: "1 - High",
    priority: "1 - Critical",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    ampBlocklist: { domains: ["secure-login.portal-update.net"] },
    activities: [],
  },
  {
    number: "INC0162888",
    openedAt: "2026-05-29 09:00:00 AM",
    shortDescription: "Request to block ScreenConnect abuse domains from MS-ISAC feed",
    description: "IR team requests immediate block of ScreenConnect subdomains identified in INC0162203 spreadsheet (ad.screenconnect.com, allgreenlandscape.screenconnect.com). Confirm entries exist in AMP block list.",
    caller: "Incident Response",
    email: "ir-team@datagroup.com",
    phone: "",
    location: "SOC",
    category: "Security",
    subcategory: "Threat Intelligence",
    businessServices: "",
    configurationItem: "",
    channel: "Email/Chat",
    state: "New",
    impact: "2 - Medium",
    urgency: "2 - Medium",
    priority: "3 - Moderate",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    ampBlocklist: {
      domains: ["ad.screenconnect.com", "allgreenlandscape.screenconnect.com", "ancomsystems.screenconnect.com"],
    },
    activities: [],
  },
  {
    number: "INC0162898",
    openedAt: "2026-05-29 11:30:00 AM",
    shortDescription: "AMP retrospective alert — suspicious PowerShell on FIN-EXEC-01",
    description: "Cisco Secure Endpoint flagged encoded PowerShell on FIN-EXEC-01. Cross-reference with WannaCry incident DINC-0003 and isolate if encryption behavior confirmed.",
    caller: "System",
    email: "alerts@datagroup.com",
    phone: "",
    location: "Finance Segment",
    category: "Security",
    subcategory: "Malware",
    businessServices: "Endpoint Security",
    configurationItem: "FIN-EXEC-01",
    channel: "System",
    state: "New",
    impact: "1 - High",
    urgency: "1 - High",
    priority: "1 - Critical",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    linkedXdrIncidentId: "INC-XDR-004",
    linkedDefenderIncidentId: "DINC-0003",
    linkedSentinelIncidentId: "SENT-3003",
    activities: [],
  },
  {
    number: "INC0162855",
    openedAt: "2026-05-28 09:12:30 AM",
    shortDescription: "Cannot push code to github.com — site blocked",
    description: "Developer reports that github.com is blocked when trying to push their code to the repository. The block page says it is blocked by Cisco Secure Endpoint. Please investigate and allow if this is a false positive.",
    caller: "Dev Team",
    email: "dev@datagroup.com",
    phone: "555-0455",
    location: "Engineering Floor",
    category: "Network & Telephony",
    subcategory: "Web Filtering",
    businessServices: "Internet Access",
    configurationItem: "",
    channel: "Self-Service",
    state: "New",
    impact: "2 - Medium",
    urgency: "2 - Medium",
    priority: "3 - Moderate",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    ampPreBlockedDomains: ["github.com"],
    activities: [
      {
        id: "act-17",
        timestamp: "2026-05-28 09:12:30 AM",
        type: "work_note",
        authorName: "System",
        authorInitials: "SYS",
        text: "AMP Web Filter event: github.com blocked on 8 developer workstations.",
      },
    ],
  },
  {
    number: "INC0162856",
    openedAt: "2026-05-28 09:45:10 AM",
    shortDescription: "Finance cannot access quickbooks.intuit.com",
    description: "Finance department needs urgent access to QuickBooks Online to process payroll, but quickbooks.intuit.com is being blocked by a security policy. Verify if Cisco AMP is blocking this and allow the domain.",
    caller: "Finance Department",
    email: "finance@datagroup.com",
    phone: "555-0899",
    location: "Finance Office",
    category: "Network & Telephony",
    subcategory: "Web Filtering",
    businessServices: "Financial Systems",
    configurationItem: "",
    channel: "Phone",
    state: "New",
    impact: "1 - High",
    urgency: "1 - High",
    priority: "1 - Critical",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    ampPreBlockedDomains: ["quickbooks.intuit.com"],
    activities: [
      {
        id: "act-18",
        timestamp: "2026-05-28 09:45:10 AM",
        type: "work_note",
        authorName: "System",
        authorInitials: "SYS",
        text: "User called Helpdesk stating the block screen has the Cisco logo.",
      },
    ],
  },
  {
    number: "INC0162905",
    openedAt: "2026-05-30 08:00:00 AM",
    shortDescription: "Umbrella App Discovery: Review TikTok Usage",
    description: "The Umbrella App Discovery report (https://tinyurl.com/FahimUmbrella) shows 4.7 GB of traffic to TikTok. Since this is a High risk (78) Social Media app, please review if this violates our acceptable use policy and decide whether to mark it as Not Approved. Document your decision here.",
    caller: "Security Automation",
    email: "sec-auto@datagroup.com",
    phone: "",
    location: "Global",
    category: "Security",
    subcategory: "Cloud Access Security",
    businessServices: "Internet Access",
    configurationItem: "Cisco Umbrella",
    channel: "System",
    state: "New",
    impact: "2 - Medium",
    urgency: "2 - Medium",
    priority: "3 - Moderate",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    activities: [
      {
        id: "act-umb1",
        timestamp: "2026-05-30 08:00:00 AM",
        type: "work_note",
        authorName: "System",
        authorInitials: "SYS",
        text: "Please visit https://tinyurl.com/FahimUmbrella to investigate the app and update this ticket.",
      }
    ],
  },
  {
    number: "INC0162910",
    openedAt: "2026-05-30 11:15:00 AM",
    shortDescription: "Umbrella App Discovery: Anonymizer usage detected (Tor Browser)",
    description: "We detected traffic to Tor Browser. This is classified as an Anonymizer with Very High Risk (96). Review the app in the simulator (https://tinyurl.com/FahimUmbrella) and set it to Not Approved to enforce a block. Update the ticket when completed.",
    caller: "Compliance Team",
    email: "compliance@datagroup.com",
    phone: "555-0991",
    location: "Global",
    category: "Security",
    subcategory: "Cloud Access Security",
    businessServices: "Data Protection",
    configurationItem: "Cisco Umbrella",
    channel: "System",
    state: "New",
    impact: "1 - High",
    urgency: "2 - Medium",
    priority: "2 - High",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    activities: [],
  },
  {
    number: "INC0162915",
    openedAt: "2026-05-30 02:45:00 PM",
    shortDescription: "Umbrella App Discovery: Hacking Tool Detected on Network",
    description: "CRITICAL: Umbrella App Discovery has detected 42 MB of traffic to 'Cobalt Strike (Cracked)'. This is a Very High Risk (99) Hacking Tool. Review the app immediately (https://tinyurl.com/FahimUmbrella) and mark it as Not Approved. Coordinate with the SOC to locate the source identity.",
    caller: "Security Automation",
    email: "sec-auto@datagroup.com",
    phone: "",
    location: "Global",
    category: "Security",
    subcategory: "Cloud Access Security",
    businessServices: "Endpoint Security",
    configurationItem: "Cisco Umbrella",
    channel: "System",
    state: "New",
    impact: "1 - High",
    urgency: "1 - High",
    priority: "1 - Critical",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    activities: [],
  },
  {
    number: "INC0162920",
    openedAt: "2026-05-30 04:30:00 PM",
    shortDescription: "Umbrella App Discovery: Audit Generative AI Applications",
    description: "Several Generative AI applications (ChatGPT, Gemini, Claude) are in 'Under Audit' status. Please review their risk scores in Umbrella (https://tinyurl.com/FahimUmbrella) and update their approval statuses based on our new AI data handling policy.",
    caller: "Compliance Team",
    email: "compliance@datagroup.com",
    phone: "555-0991",
    location: "Global",
    category: "Security",
    subcategory: "Cloud Access Security",
    businessServices: "Data Protection",
    configurationItem: "Cisco Umbrella",
    channel: "Email/Chat",
    state: "New",
    impact: "3 - Low",
    urgency: "3 - Low",
    priority: "5 - Planning",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    activities: [],
  },
  {
    number: "INC0162925",
    openedAt: "2026-05-31 09:30:00 AM",
    shortDescription: "XDR Alert: Cobalt Strike Beacon on SOC-TRAINING-01",
    description: "Cisco XDR detected a Cobalt Strike beacon via named pipe communication on SOC-TRAINING-01. Please review XDR incident INC-XDR-011, trace the attack graph, and identify the C2 IP. If confirmed, initiate endpoint isolation via AMP.",
    caller: "Cisco XDR",
    email: "xdr-alerts@datagroup.com",
    phone: "",
    location: "Training Lab",
    category: "Security",
    subcategory: "Malware",
    businessServices: "Endpoint Security",
    configurationItem: "SOC-TRAINING-01",
    channel: "System",
    state: "New",
    impact: "1 - High",
    urgency: "1 - High",
    priority: "1 - Critical",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    linkedXdrIncidentId: "INC-XDR-011",
    linkedSentinelIncidentId: "SENT-3016",
    ampBlocklist: { ips: ["203.0.113.47"] },
    activities: [],
  },
  {
    number: "INC0162930",
    openedAt: "2026-05-31 01:45:00 PM",
    shortDescription: "Investigate Suspicious Outbound Traffic on FIN-EXEC-01",
    description: "XDR Analytics and CrowdStrike detected certutil.exe base64 encoding and PowerShell exfiltration on FIN-EXEC-01. Review INC-XDR-010. We need to block the malicious C2 IP and determine what data was exfiltrated. Update this ticket with the C2 IP so AMP blocklists can be updated.",
    caller: "Security Monitoring",
    email: "soc-alerts@datagroup.com",
    phone: "",
    location: "Finance",
    category: "Security",
    subcategory: "Data Exfiltration",
    businessServices: "Data Protection",
    configurationItem: "FIN-EXEC-01",
    channel: "System",
    state: "New",
    impact: "1 - High",
    urgency: "2 - Medium",
    priority: "2 - High",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    linkedXdrIncidentId: "INC-XDR-010",
    activities: [],
  },
  {
    number: "INC0162945",
    openedAt: "2026-06-01 10:10:00 AM",
    shortDescription: "Developer requests unblocking of python.org in AMP",
    description: "A new developer reported that they cannot download Python packages because python.org is blocked by the Cisco Secure Endpoint web filter. Please investigate the logs to confirm and remove the block if it is a false positive.",
    caller: "IT Helpdesk",
    email: "helpdesk@datagroup.com",
    phone: "555-1022",
    location: "Engineering",
    category: "Network & Telephony",
    subcategory: "Web Filtering",
    businessServices: "Internet Access",
    configurationItem: "Cisco AMP",
    channel: "Phone",
    state: "New",
    impact: "2 - Medium",
    urgency: "2 - Medium",
    priority: "3 - Moderate",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    ampPreBlockedDomains: ["python.org", "pypi.org"],
    activities: [],
  }
];

export const SERVICENOW_TICKETS_KEY = "servicenow-tickets-v2";

export function loadServiceNowTickets(): SnTicket[] {
  const raw = localStorage.getItem(SERVICENOW_TICKETS_KEY);
  if (!raw) return JSON.parse(JSON.stringify(INITIAL_SERVICENOW_TICKETS));
  try {
    const parsed = JSON.parse(raw) as SnTicket[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : JSON.parse(JSON.stringify(INITIAL_SERVICENOW_TICKETS));
  } catch {
    return JSON.parse(JSON.stringify(INITIAL_SERVICENOW_TICKETS));
  }
}

export function saveServiceNowTickets(items: SnTicket[]) {
  localStorage.setItem(SERVICENOW_TICKETS_KEY, JSON.stringify(items));
  if (classroomApi.enabled) {
    void classroomApi.putLabState("default", SERVICENOW_TICKETS_KEY, items).catch((err) => {
      console.warn("Failed to sync ServiceNow tickets.", err);
    });
  }
}

export async function loadServiceNowTicketsFromBackend(): Promise<SnTicket[] | null> {
  if (!classroomApi.enabled) return null;
  const items = await classroomApi.getLabState<SnTicket[]>("default", SERVICENOW_TICKETS_KEY);
  if (!Array.isArray(items) || items.length === 0) return null;
  localStorage.setItem(SERVICENOW_TICKETS_KEY, JSON.stringify(items));
  return items;
}
