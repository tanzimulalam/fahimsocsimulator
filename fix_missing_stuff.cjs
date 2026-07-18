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

// 2. Update mockData.ts to add realistic events to inc-21 through inc-27
let md = fs.readFileSync('src/data/mockData.ts', 'utf8');

const replacementEvents = {
  "inc-21": "events: [\n      {\n        id: \"e21\",\n        severity: \"medium\",\n        eventType: \"Executed Malware\",\n        sha256Prefix: \"7f83b1657ff1\",\n        sha256Suffix: \"b41a54728509\",\n        sha256Full: \"7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069\",\n        timestampUtc: \"2026-07-17T12:00:00Z\",\n        filename: \"rclone.exe\",\n        disposition: \"Malicious\",\n        detectionName: \"W32.RcloneExfil.Tool\",\n        detectionEngine: \"TETRA\",\n        filePath: \"C:\\\\\\\\Temp\\\\\\\\rclone.exe\",\n        processPath: \"C:\\\\\\\\Temp\\\\\\\\rclone.exe\",\n        parentProcess: \"C:\\\\\\\\Windows\\\\\\\\System32\\\\\\\\cmd.exe\",\n      }\n    ],",
  "inc-22": "events: [\n      {\n        id: \"e22\",\n        severity: \"high\",\n        eventType: \"Malicious Activity\",\n        sha256Prefix: \"9c3b123d\",\n        sha256Suffix: \"a991b5\",\n        sha256Full: \"9c3b123dc10b912384a5a54ab93a90ab0192ca1923cbab1099279a991b5c\",\n        timestampUtc: \"2026-07-17T13:00:00Z\",\n        filename: \"xmrig-mac\",\n        disposition: \"Malicious\",\n        detectionName: \"OSX.CoinMiner.XMRig\",\n        detectionEngine: \"TETRA\",\n        filePath: \"/tmp/xmrig-mac\",\n        processPath: \"/tmp/xmrig-mac\",\n        parentProcess: \"/bin/bash\",\n      }\n    ],",
  "inc-23": "events: [\n      {\n        id: \"e23\",\n        severity: \"critical\",\n        eventType: \"Compromise Event\",\n        sha256Prefix: \"00b12a\",\n        sha256Suffix: \"87c992\",\n        sha256Full: \"00b12a5cb999aa734289a912bb6732cb12999cb87361ab887c992d991b5c\",\n        timestampUtc: \"2026-07-17T14:00:00Z\",\n        filename: \"shell.php\",\n        disposition: \"Malicious\",\n        detectionName: \"PHP.WebShell.C99\",\n        detectionEngine: \"ETHOS\",\n        filePath: \"/var/www/html/shell.php\",\n        processPath: \"/usr/bin/php\",\n        parentProcess: \"/usr/sbin/apache2\",\n      }\n    ],",
  "inc-24": "events: [\n      {\n        id: \"e24\",\n        severity: \"critical\",\n        eventType: \"Threat Detected\",\n        sha256Prefix: \"11aab2\",\n        sha256Suffix: \"33ccdd\",\n        sha256Full: \"11aab23456789bbcdd999238383aabbaabbcc11223344556677889900aa33ccdd\",\n        timestampUtc: \"2026-07-17T15:00:00Z\",\n        filename: \"mimikatz.exe\",\n        disposition: \"Malicious\",\n        detectionName: \"W32.Mimikatz.CredentialDumper\",\n        detectionEngine: \"SPERO\",\n        filePath: \"C:\\\\\\\\Users\\\\\\\\Public\\\\\\\\mimikatz.exe\",\n        processPath: \"C:\\\\\\\\Users\\\\\\\\Public\\\\\\\\mimikatz.exe\",\n        parentProcess: \"C:\\\\\\\\Windows\\\\\\\\System32\\\\\\\\cmd.exe\",\n      }\n    ],",
  "inc-25": "events: [\n      {\n        id: \"e25\",\n        severity: \"critical\",\n        eventType: \"Malware Detected\",\n        sha256Prefix: \"ff1122\",\n        sha256Suffix: \"ee8833\",\n        sha256Full: \"ff112233445566778899aabbccddeeff00112233445566778899aabbccee8833\",\n        timestampUtc: \"2026-07-17T16:00:00Z\",\n        filename: \"beacon.exe\",\n        disposition: \"Malicious\",\n        detectionName: \"W32.CobaltStrike.Beacon\",\n        detectionEngine: \"ETHOS\",\n        filePath: \"C:\\\\\\\\Temp\\\\\\\\beacon.exe\",\n        processPath: \"C:\\\\\\\\Temp\\\\\\\\beacon.exe\",\n        parentProcess: \"C:\\\\\\\\Windows\\\\\\\\System32\\\\\\\\WindowsPowerShell\\\\\\\\v1.0\\\\\\\\powershell.exe\",\n      }\n    ],",
  "inc-26": "events: [\n      {\n        id: \"e26\",\n        severity: \"medium\",\n        eventType: \"Suspicious Download\",\n        sha256Prefix: \"77aa88\",\n        sha256Suffix: \"99bb00\",\n        sha256Full: \"77aa88bb990011223344556677889900aabbccddeeff0011223344556699bb00\",\n        timestampUtc: \"2026-07-17T17:00:00Z\",\n        filename: \"index.js\",\n        disposition: \"Unknown\",\n        detectionName: \"Gen.Suspicious.NPM\",\n        detectionEngine: \"TETRA\",\n        filePath: \"/Users/dev/project/node_modules/malicious-pkg/index.js\",\n        processPath: \"/usr/local/bin/node\",\n        parentProcess: \"/bin/zsh\",\n      }\n    ],",
  "inc-27": "events: [\n      {\n        id: \"e27\",\n        severity: \"high\",\n        eventType: \"Quarantine Failure\",\n        sha256Prefix: \"dd3344\",\n        sha256Suffix: \"55aa77\",\n        sha256Full: \"dd3344556677889900aabbccddeeff0011223344556677889900aabbcc55aa77\",\n        timestampUtc: \"2026-07-17T18:00:00Z\",\n        filename: \"anydesk_setup.exe\",\n        disposition: \"Malicious\",\n        detectionName: \"W32.AnyDesk.RMM.Abuse\",\n        detectionEngine: \"SPERO\",\n        filePath: \"C:\\\\\\\\Users\\\\\\\\Student\\\\\\\\Downloads\\\\\\\\anydesk_setup.exe\",\n        processPath: \"C:\\\\\\\\Users\\\\\\\\Student\\\\\\\\Downloads\\\\\\\\anydesk_setup.exe\",\n        parentProcess: \"C:\\\\\\\\Windows\\\\\\\\explorer.exe\",\n      }\n    ],"
};

for (const incId of Object.keys(replacementEvents)) {
  const eventCode = replacementEvents[incId];
  const regex = new RegExp("id: \\"" + incId + "\\",[\\\\s\\\\S]*?events: \\\\[\\\\],?", "g");
  md = md.replace(regex, (match) => {
    return match.replace(/events: \[\],?/, eventCode);
  });
}

fs.writeFileSync('src/data/mockData.ts', md);
