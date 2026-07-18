const fs = require('fs');

// 1. Append missing XDR incidents to xdrIncidents.ts
let xdrContent = fs.readFileSync('src/data/xdrIncidents.ts', 'utf8');

if (!xdrContent.includes('INC-XDR-021')) {
  const newXdrIncidents = `,
  {
    id: "INC-XDR-021", priority: 850, state: "New", title: "Suspicious Rclone Execution",
    description: "Data Exfiltration via Rclone",
    affectedHosts: ["SALES-LAPTOP-08"],
    graphData: {
      nodes: [
        { id: "n1", type: "endpoint", label: "SALES-LAPTOP-08" },
        { id: "n2", type: "process", label: "rclone.exe" },
        { id: "n3", type: "network", label: "anon-cloud-storage.com" }
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
    assigned: "Unassigned"
  },
  {
    id: "INC-XDR-022", priority: 910, state: "New", title: "XMRig Cryptominer",
    description: "macOS Cryptominer",
    affectedHosts: ["MKT-MAC-02"],
    graphData: {
      nodes: [
        { id: "n1", type: "endpoint", label: "MKT-MAC-02" },
        { id: "n2", type: "process", label: "xmrig" },
        { id: "n3", type: "network", label: "supportxmr.com" }
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
    assigned: "Unassigned"
  },
  {
    id: "INC-XDR-023", priority: 880, state: "In Progress", title: "Web Shell Activity",
    description: "Linux Web Shell",
    affectedHosts: ["DEV-LNX-01"],
    graphData: {
      nodes: [
        { id: "n1", type: "endpoint", label: "DEV-LNX-01" },
        { id: "n2", type: "process", label: "bash" },
        { id: "n3", type: "network", label: "198.51.100.50" }
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
    assigned: "Unassigned"
  },
  {
    id: "INC-XDR-024", priority: 950, state: "New", title: "Credential Dumping Attempt",
    description: "Mimikatz Credential Dumping",
    affectedHosts: ["HR-WS-05"],
    graphData: {
      nodes: [
        { id: "n1", type: "endpoint", label: "HR-WS-05" },
        { id: "n2", type: "process", label: "mimikatz.exe" },
        { id: "n3", type: "process", label: "lsass.exe" }
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
    assigned: "Unassigned"
  },
  {
    id: "INC-XDR-025", priority: 990, state: "In Progress", title: "Ransomware Precursor",
    description: "LockBit Precursor",
    affectedHosts: ["FIN-LAPTOP-02"],
    graphData: {
      nodes: [
        { id: "n1", type: "endpoint", label: "FIN-LAPTOP-02" },
        { id: "n2", type: "process", label: "cobaltstrike.exe" },
        { id: "n3", type: "network", label: "c2.malicious.net" }
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
    assigned: "Unassigned"
  },
  {
    id: "INC-XDR-026", priority: 750, state: "New", title: "Supply Chain Attack",
    description: "Malicious npm Package",
    affectedHosts: ["EXEC-MAC-01"],
    graphData: {
      nodes: [
        { id: "n1", type: "endpoint", label: "EXEC-MAC-01" },
        { id: "n2", type: "process", label: "node" },
        { id: "n3", type: "file", label: "package.json" }
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
    assigned: "Unassigned"
  },
  {
    id: "INC-XDR-027", priority: 820, state: "New", title: "AnyDesk Installation via Phishing",
    description: "Phishing to AnyDesk",
    affectedHosts: ["LAB-WS-0188"],
    graphData: {
      nodes: [
        { id: "n1", type: "endpoint", label: "LAB-WS-0188" },
        { id: "n2", type: "process", label: "anydesk.exe" },
        { id: "n3", type: "network", label: "anydesk.com" }
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
    assigned: "Unassigned"
  }
];`;
  xdrContent = xdrContent.replace(/\n\];/, newXdrIncidents);
  fs.writeFileSync('src/data/xdrIncidents.ts', xdrContent);
}
