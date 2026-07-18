const fs = require('fs');

let md = fs.readFileSync('src/data/mockData.ts', 'utf8');

const rcloneEvent = \`events: [
      {
        id: "e21",
        severity: "medium",
        eventType: "Executed Malware",
        sha256Prefix: "7f83b1657ff1",
        sha256Suffix: "b41a54728509",
        sha256Full: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        timestampUtc: new Date().toISOString(),
        filename: "rclone.exe",
        disposition: "Malicious",
        detectionName: "W32.RcloneExfil.Tool",
        detectionEngine: "TETRA",
        filePath: "C:\\\\Temp\\\\rclone.exe",
        processPath: "C:\\\\Temp\\\\rclone.exe",
        parentProcess: "C:\\\\Windows\\\\System32\\\\cmd.exe",
      }
    ],\`;

const xmrigEvent = \`events: [
      {
        id: "e22",
        severity: "high",
        eventType: "Malicious Activity",
        sha256Prefix: "9c3b123d",
        sha256Suffix: "a991b5",
        sha256Full: "9c3b123dc10b912384a5a54ab93a90ab0192ca1923cbab1099279a991b5c",
        timestampUtc: new Date().toISOString(),
        filename: "xmrig-mac",
        disposition: "Malicious",
        detectionName: "OSX.CoinMiner.XMRig",
        detectionEngine: "TETRA",
        filePath: "/tmp/xmrig-mac",
        processPath: "/tmp/xmrig-mac",
        parentProcess: "/bin/bash",
      }
    ],\`;

const shellEvent = \`events: [
      {
        id: "e23",
        severity: "critical",
        eventType: "Compromise Event",
        sha256Prefix: "00b12a",
        sha256Suffix: "87c992",
        sha256Full: "00b12a5cb999aa734289a912bb6732cb12999cb87361ab887c992d991b5c",
        timestampUtc: new Date().toISOString(),
        filename: "shell.php",
        disposition: "Malicious",
        detectionName: "PHP.WebShell.C99",
        detectionEngine: "ETHOS",
        filePath: "/var/www/html/shell.php",
        processPath: "/usr/bin/php",
        parentProcess: "/usr/sbin/apache2",
      }
    ],\`;

const mimikatzEvent = \`events: [
      {
        id: "e24",
        severity: "critical",
        eventType: "Threat Detected",
        sha256Prefix: "11aab2",
        sha256Suffix: "33ccdd",
        sha256Full: "11aab23456789bbcdd999238383aabbaabbcc11223344556677889900aa33ccdd",
        timestampUtc: new Date().toISOString(),
        filename: "mimikatz.exe",
        disposition: "Malicious",
        detectionName: "W32.Mimikatz.CredentialDumper",
        detectionEngine: "SPERO",
        filePath: "C:\\\\Users\\\\Public\\\\mimikatz.exe",
        processPath: "C:\\\\Users\\\\Public\\\\mimikatz.exe",
        parentProcess: "C:\\\\Windows\\\\System32\\\\cmd.exe",
      }
    ],\`;

const beaconEvent = \`events: [
      {
        id: "e25",
        severity: "critical",
        eventType: "Malware Detected",
        sha256Prefix: "ff1122",
        sha256Suffix: "ee8833",
        sha256Full: "ff112233445566778899aabbccddeeff00112233445566778899aabbccee8833",
        timestampUtc: new Date().toISOString(),
        filename: "beacon.exe",
        disposition: "Malicious",
        detectionName: "W32.CobaltStrike.Beacon",
        detectionEngine: "ETHOS",
        filePath: "C:\\\\Temp\\\\beacon.exe",
        processPath: "C:\\\\Temp\\\\beacon.exe",
        parentProcess: "C:\\\\Windows\\\\System32\\\\WindowsPowerShell\\\\v1.0\\\\powershell.exe",
      }
    ],\`;

const npmEvent = \`events: [
      {
        id: "e26",
        severity: "medium",
        eventType: "Suspicious Download",
        sha256Prefix: "77aa88",
        sha256Suffix: "99bb00",
        sha256Full: "77aa88bb990011223344556677889900aabbccddeeff0011223344556699bb00",
        timestampUtc: new Date().toISOString(),
        filename: "index.js",
        disposition: "Unknown",
        detectionName: "Gen.Suspicious.NPM",
        detectionEngine: "TETRA",
        filePath: "/Users/dev/project/node_modules/malicious-pkg/index.js",
        processPath: "/usr/local/bin/node",
        parentProcess: "/bin/zsh",
      }
    ],\`;

const anydeskEvent = \`events: [
      {
        id: "e27",
        severity: "high",
        eventType: "Quarantine Failure",
        sha256Prefix: "dd3344",
        sha256Suffix: "55aa77",
        sha256Full: "dd3344556677889900aabbccddeeff0011223344556677889900aabbcc55aa77",
        timestampUtc: new Date().toISOString(),
        filename: "anydesk_setup.exe",
        disposition: "Malicious",
        detectionName: "W32.AnyDesk.RMM.Abuse",
        detectionEngine: "SPERO",
        filePath: "C:\\\\Users\\\\Student\\\\Downloads\\\\anydesk_setup.exe",
        processPath: "C:\\\\Users\\\\Student\\\\Downloads\\\\anydesk_setup.exe",
        parentProcess: "C:\\\\Windows\\\\explorer.exe",
      }
    ],\`;

md = md.replace(/id: "inc-21",([\\s\\S]*?)events: \\[\\]/g, 'id: "inc-21",$1' + rcloneEvent);
md = md.replace(/id: "inc-22",([\\s\\S]*?)events: \\[\\]/g, 'id: "inc-22",$1' + xmrigEvent);
md = md.replace(/id: "inc-23",([\\s\\S]*?)events: \\[\\]/g, 'id: "inc-23",$1' + shellEvent);
md = md.replace(/id: "inc-24",([\\s\\S]*?)events: \\[\\]/g, 'id: "inc-24",$1' + mimikatzEvent);
md = md.replace(/id: "inc-25",([\\s\\S]*?)events: \\[\\]/g, 'id: "inc-25",$1' + beaconEvent);
md = md.replace(/id: "inc-26",([\\s\\S]*?)events: \\[\\]/g, 'id: "inc-26",$1' + npmEvent);
md = md.replace(/id: "inc-27",([\\s\\S]*?)events: \\[\\]/g, 'id: "inc-27",$1' + anydeskEvent);

fs.writeFileSync('src/data/mockData.ts', md);
