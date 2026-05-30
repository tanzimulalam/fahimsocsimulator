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
    openedAt: "2026-04-27 02:07:29 PM",
    shortDescription: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 – 4/26/26 - TLP:AMBER",
    description: "Please see the forwarded threat intelligence email regarding malicious IPs and Domains.",
    caller: "Bari Snyder",
    email: "Bari.Snyder@uncp.edu",
    phone: "9107754994",
    location: "Room 244 Joseph B Oxendine Admin Bldg",
    category: "Network & Telephony",
    subcategory: "Network Security",
    businessServices: "",
    configurationItem: "",
    channel: "Email/Chat",
    state: "New",
    impact: "2 - Medium",
    urgency: "3 - Low",
    priority: "4 - Low",
    assignmentGroup: "Network & Telephony",
    assignedTo: "Shirsendu Mondal",
    attachments: [
      { id: "att-1", name: "IPs Domains and URLs of Interest 2026-04-20 to 2026-04-26.xlsx", size: "49.5 KB", type: "file", isSpreadsheet: true },
      { id: "att-2", name: "image001.png", size: "9.79 KB", type: "image", isSpreadsheet: false }
    ],
    relatedEmail: {
      from: "MS-ISAC Advisory <MS-ISAC.Advisory@msisac.org>",
      date: "Monday, April 27, 2026 2:06:57 PM (UTC-05:00) Eastern Time",
      subject: "[EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 – 4/26/26 - TLP:AMBER",
      to: "Bari.Snyder@uncp.edu",
      bodyHtml: `
        <div style="font-family: sans-serif; font-size: 14px;">
          <div style="background-color: #ffcccc; padding: 10px; border: 1px solid #cc0000; margin-bottom: 15px;">
            <strong>CAUTION:</strong> This email originated from outside of the organization. Do not click links or open attachments unless you recognize the sender and know the content is safe.
          </div>
          <p style="color: #cc6600; font-weight: bold;">TLP:AMBER</p>
          <p>This week's malicious IPs, Domains, and URLs observed by MS-ISAC monitoring and CIS CTI.</p>
          <p>Please review the attached spreadsheet and take necessary actions to block or alert on these indicators. Pay close attention to any internal hosts communicating with these external entities.</p>
          <p>Note: IP and domain relationships may change quickly (e.g., fast-flux DNS, shared hosting). Ensure indicators are aged out after 4 weeks.</p>
          <p>CIS Portal automated format links:<br>
          <a href="#">cti-lists.cisecurity.org/lists/IPs-30days.txt</a><br>
          <a href="#">cti-lists.cisecurity.org/lists/Domains-30days.txt</a><br>
          <a href="#">cti-lists.cisecurity.org/lists/URLs-30days.txt</a><br>
          <a href="#">cti-lists.cisecurity.org/lists/Hashes-1year.txt</a></p>
          <p>MS-ISAC 24x7 SOC Contact:<br>
          Phone: 1-866-787-4722<br>
          Email: soc@cisecurity.org</p>
          <p>Center for Internet Security (CIS)<br>
          Clifton Park, NY 12065</p>
        </div>
      `
    },
    activities: [
      {
        id: "act-1",
        timestamp: "2026-04-27 02:07:29 PM",
        type: "email",
        authorName: "System",
        authorInitials: "SYS",
        subject: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 – 4/26/26 - TLP:AMBER",
        emailDetails: {
          from: "Bari.Snyder@uncp.edu",
          date: "2026-04-27 02:07:29 PM",
          subject: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/20/26 – 4/26/26 - TLP:AMBER",
          to: "DoIT Helpdesk",
          bodyHtml: "<p>Please process these new IOCs.</p>"
        }
      },
      {
        id: "act-2",
        timestamp: "2026-04-27 02:07:31 PM",
        type: "attachment",
        authorName: "System",
        authorInitials: "SYS",
        fileName: "IPs Domains and URLs of Interest 2026-04-20 to 2026-04-26.xlsx",
        size: "49.5 KB"
      }
    ]
  },
  {
    number: "INC0162675",
    openedAt: "2026-05-04 02:13:09 PM",
    shortDescription: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/27/26 – 5/3/26 - TLP:AMBER",
    description: "Please see the forwarded threat intelligence email regarding malicious IPs and Domains.",
    caller: "Bari Snyder",
    email: "Bari.Snyder@uncp.edu",
    phone: "9107754994",
    location: "Room 244 Joseph B Oxendine Admin Bldg",
    category: "Network & Telephony",
    subcategory: "Network Security",
    businessServices: "",
    configurationItem: "",
    channel: "Email/Chat",
    state: "New",
    impact: "2 - Medium",
    urgency: "3 - Low",
    priority: "4 - Low",
    assignmentGroup: "Network & Telephony",
    assignedTo: "Shirsendu Mondal",
    attachments: [
      { id: "att-3", name: "IPs Domains and URLs of Interest 2026-04-27 to 2026-05-03.xlsx", size: "48.2 KB", type: "file", isSpreadsheet: true }
    ],
    activities: [
      {
        id: "act-3",
        timestamp: "2026-05-04 02:13:09 PM",
        type: "email",
        authorName: "System",
        authorInitials: "SYS",
        subject: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/27/26 – 5/3/26 - TLP:AMBER",
        emailDetails: {
          from: "Bari.Snyder@uncp.edu",
          date: "2026-05-04 02:13:09 PM",
          subject: "FW: [EXTERNAL] Malicious IPs, Domains, and URLs observed by MS-ISAC - 4/27/26 – 5/3/26 - TLP:AMBER",
          to: "DoIT Helpdesk",
          bodyHtml: "<p>New weekly IOCs.</p>"
        }
      }
    ]
  },
  {
    number: "INC0162810",
    openedAt: "2026-05-26 09:14:00 AM",
    shortDescription: "Suspicious email with attachment reported by Sarah Chen",
    description: "User reported receiving a strange email appearing to be from Microsoft, asking to update her credentials. She clicked the link and downloaded an attachment. Device is hr-laptop-04.",
    caller: "Sarah Chen",
    email: "sarah.chen@datagroup.local",
    phone: "555-0192",
    location: "HR Department",
    category: "Security",
    subcategory: "Phishing",
    businessServices: "Corporate Email",
    configurationItem: "hr-laptop-04",
    channel: "Phone",
    state: "New",
    impact: "1 - High",
    urgency: "1 - High",
    priority: "1 - Critical",
    assignmentGroup: "Security Operations Center",
    assignedTo: "",
    attachments: [],
    linkedXdrIncidentId: "INC-XDR-001", // AsyncRAT
    activities: [
      {
        id: "act-4",
        timestamp: "2026-05-26 09:14:00 AM",
        type: "work_note",
        authorName: "Helpdesk Agent",
        authorInitials: "HA",
        text: "User called in panicking. Advised user to disconnect from network. Escalating to SOC."
      }
    ]
  },
  {
    number: "INC0162822",
    openedAt: "2026-05-26 10:30:45 AM",
    shortDescription: "EDR Alert: Emotet Loader Detected on SALES-VM-22",
    description: "Automated ticket creation from Cisco Secure Endpoint. Emotet payload detected executing via PowerShell macro on SALES-VM-22.",
    caller: "System",
    email: "alerts@datagroup.local",
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
    assignedTo: "Shirsendu Mondal",
    attachments: [],
    linkedXdrIncidentId: "INC-XDR-005", // Emotet
    activities: []
  },
  {
    number: "INC0162845",
    openedAt: "2026-05-27 08:15:22 AM",
    shortDescription: "Multiple failed RDP logins for MdUsman, followed by successful login",
    description: "SIEM detected anomalous RDP brute force behavior. Account may be compromised. Investigate LAB-WS-0142.",
    caller: "Security Monitoring",
    email: "soc-alerts@datagroup.local",
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
    linkedXdrIncidentId: "INC-XDR-009", // RDP Brute force
    activities: []
  },
  {
    number: "INC0162850",
    openedAt: "2026-05-27 11:22:10 AM",
    shortDescription: "Blocked access to legitimate marketing site",
    description: "User cannot access hubspot.com. AMP blocked it as suspicious.",
    caller: "Marketing Team",
    email: "marketing@datagroup.local",
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
    activities: []
  }
];

export const SERVICENOW_TICKETS_KEY = "servicenow-tickets-v1";

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
