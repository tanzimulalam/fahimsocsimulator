const fs = require('fs');

let xdrContent = fs.readFileSync('src/data/xdrIncidents.ts', 'utf8');

// I will overwrite the end of the file starting from INC-XDR-021
const startIdx = xdrContent.indexOf('  {\n    id: "INC-XDR-021"');
if (startIdx !== -1) {
  xdrContent = xdrContent.substring(0, startIdx);
} else {
  // If not found, cut off the trailing \n];
  xdrContent = xdrContent.replace(/\n];\s*$/, '');
  xdrContent += ',\n';
}

const incidents = `  {
    id: "INC-XDR-021",
    priority: 850,
    status: "New: Presented",
    title: "Suspicious Rclone Execution",
    source: ["Cisco XDR Analytics"],
    tactics: ["Exfiltration"],
    description: "Data Exfiltration via Rclone",
    host: "SALES-LAPTOP-08",
    users: [],
    sha256: [],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "SALES-LAPTOP-08", disposition: "asset" },
        { id: "n2", type: "process", label: "rclone.exe", disposition: "suspicious" },
        { id: "n3", type: "network", label: "anon-cloud-storage.com", disposition: "suspicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "2 hours ago", severity: "High", source: "Cisco Secure Endpoint", indicators: ["Exfiltration"], observables: ["rclone.exe"], assets: ["SALES-LAPTOP-08"] }
    ],
    created: new Date().toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-022",
    priority: 910,
    status: "New: Presented",
    title: "XMRig Cryptominer",
    source: ["Cisco XDR Analytics"],
    tactics: ["Execution", "Impact"],
    description: "macOS Cryptominer",
    host: "MKT-MAC-02",
    users: [],
    sha256: [],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "MKT-MAC-02", disposition: "asset" },
        { id: "n2", type: "process", label: "xmrig", disposition: "malicious" },
        { id: "n3", type: "network", label: "supportxmr.com", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "1 hour ago", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["Cryptomining"], observables: ["xmrig"], assets: ["MKT-MAC-02"] }
    ],
    created: new Date().toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-023",
    priority: 880,
    status: "Open: Investigating",
    title: "Web Shell Activity",
    source: ["Cisco XDR Analytics"],
    tactics: ["Persistence"],
    description: "Linux Web Shell",
    host: "DEV-LNX-01",
    users: [],
    sha256: [],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "DEV-LNX-01", disposition: "asset" },
        { id: "n2", type: "process", label: "bash", disposition: "suspicious" },
        { id: "n3", type: "network", label: "198.51.100.50", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "5 mins ago", severity: "High", source: "Cisco Secure Endpoint", indicators: ["Web Shell"], observables: ["bash"], assets: ["DEV-LNX-01"] }
    ],
    created: new Date().toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-024",
    priority: 950,
    status: "New: Presented",
    title: "Credential Dumping Attempt",
    source: ["Cisco XDR Analytics"],
    tactics: ["Credential Access"],
    description: "Mimikatz Credential Dumping",
    host: "HR-WS-05",
    users: [],
    sha256: [],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "HR-WS-05", disposition: "asset" },
        { id: "n2", type: "process", label: "mimikatz.exe", disposition: "malicious" },
        { id: "n3", type: "process", label: "lsass.exe", disposition: "suspicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "10 mins ago", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["Credential Access"], observables: ["mimikatz.exe"], assets: ["HR-WS-05"] }
    ],
    created: new Date().toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-025",
    priority: 990,
    status: "Open: Investigating",
    title: "Ransomware Precursor",
    source: ["Cisco XDR Analytics"],
    tactics: ["Lateral Movement"],
    description: "LockBit Precursor",
    host: "FIN-LAPTOP-02",
    users: [],
    sha256: [],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "FIN-LAPTOP-02", disposition: "asset" },
        { id: "n2", type: "process", label: "cobaltstrike.exe", disposition: "malicious" },
        { id: "n3", type: "network", label: "c2.malicious.net", disposition: "malicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "Active now", severity: "Critical", source: "Cisco Secure Endpoint", indicators: ["Lateral Movement"], observables: ["cobaltstrike.exe"], assets: ["FIN-LAPTOP-02"] }
    ],
    created: new Date().toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-026",
    priority: 750,
    status: "New: Presented",
    title: "Supply Chain Attack",
    source: ["Cisco XDR Analytics"],
    tactics: ["Initial Access"],
    description: "Malicious npm Package",
    host: "EXEC-MAC-01",
    users: [],
    sha256: [],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "EXEC-MAC-01", disposition: "asset" },
        { id: "n2", type: "process", label: "node", disposition: "suspicious" },
        { id: "n3", type: "file", label: "package.json", disposition: "suspicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "30 mins ago", severity: "Medium", source: "Cisco Secure Endpoint", indicators: ["Initial Access"], observables: ["node"], assets: ["EXEC-MAC-01"] }
    ],
    created: new Date().toISOString(),
    assigned: null
  },
  {
    id: "INC-XDR-027",
    priority: 820,
    status: "New: Presented",
    title: "AnyDesk Installation via Phishing",
    source: ["Cisco XDR Analytics"],
    tactics: ["Command and Control"],
    description: "Phishing to AnyDesk",
    host: "LAB-WS-0188",
    users: [],
    sha256: [],
    c2Ips: [],
    c2Domains: [],
    cves: [],
    attackGraph: {
      nodes: [
        { id: "n1", type: "endpoint", label: "LAB-WS-0188", disposition: "asset" },
        { id: "n2", type: "process", label: "anydesk.exe", disposition: "suspicious" },
        { id: "n3", type: "network", label: "anydesk.com", disposition: "suspicious" }
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" }
      ]
    },
    detectionEvents: [
      { id: "ev1", firstSeen: "2 hours ago", severity: "High", source: "Cisco Secure Endpoint", indicators: ["Command and Control"], observables: ["anydesk.exe"], assets: ["LAB-WS-0188"] }
    ],
    created: new Date().toISOString(),
    assigned: null
  }
];
`;

xdrContent += incidents;
fs.writeFileSync('src/data/xdrIncidents.ts', xdrContent);
