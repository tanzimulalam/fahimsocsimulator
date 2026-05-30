import { useState } from "react";

const IPS = [
  "185.234.218.116",
  "45.142.212.100",
  "91.240.118.168",
  "151.101.65.91",
  "94.232.41.155",
  "185.220.101.47",
  "185.234.219.21",
  "203.0.113.47",
  "10.129.0.44",
  "194.165.16.78",
  "82.165.13.29",
  "176.12.11.45"
];

const DOMAINS = [
  "update-cdn.microsoftservices.workers.dev",
  "invoicesystem.duckdns.org",
  "windowsupdate-cdn.azureedge.net",
  "data.tunnel-c2.xyz",
  "avsvmcloud.com",
  "auth-portal.service-desk-update.com",
  "cdn.static-resource-sys.net"
];

const URLS = [
  "http://185.234.218.116/payload.exe",
  "http://45.142.212.100/config.bin",
  "https://invoicesystem.duckdns.org/download.php?id=882",
  "http://151.101.65.91/logo.png"
];

export function ServiceNowSpreadsheetViewer({ fileName, onClose }: { fileName: string, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("readme");

  const handleDownload = () => {
    const csvContent = "indicator,type\n" + 
      IPS.map(ip => `${ip},IP`).join("\n") + "\n" +
      DOMAINS.map(d => `${d},Domain`).join("\n") + "\n" +
      URLS.map(u => `${u},URL`).join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName.replace('.xlsx', '.csv'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ backgroundColor: "#110e24", width: 900, height: 600, maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, display: "flex", flexDirection: "column", border: "1px solid #3b3366", overflow: "hidden" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #3b3366", backgroundColor: "#181531" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Spreadsheet Preview: {fileName}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#e6e6e6", fontSize: 20, cursor: "pointer" }}>&times;</button>
        </div>

        {/* TLP AMBER Banner */}
        <div style={{ backgroundColor: "#cc6600", color: "white", padding: "4px 16px", fontSize: 12, fontWeight: "bold", textAlign: "center", letterSpacing: 1 }}>
          TLP:AMBER
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", backgroundColor: "#1b1736", borderBottom: "1px solid #3b3366" }}>
          <div style={{ fontSize: 13, color: "#8b949e", alignSelf: "center" }}>Read-only preview</div>
          <button className="sn-btn" onClick={handleDownload}>⬇ Download CSV</button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, backgroundColor: "white", color: "black", overflowY: "auto", position: "relative" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "#f3f4f6", borderBottom: "2px solid #ccc" }}>
              {activeTab === "readme" && (
                <tr><th style={{ padding: 8, textAlign: "left" }}>README / Instructions</th></tr>
              )}
              {activeTab === "ips" && (
                <tr>
                  <th style={{ padding: 8, textAlign: "left", width: "40%" }}>IP Address</th>
                  <th style={{ padding: 8, textAlign: "left" }}>Notes</th>
                </tr>
              )}
              {activeTab === "domains" && (
                <tr>
                  <th style={{ padding: 8, textAlign: "left", width: "50%" }}>Domain</th>
                  <th style={{ padding: 8, textAlign: "left" }}>Notes</th>
                </tr>
              )}
              {activeTab === "urls" && (
                <tr>
                  <th style={{ padding: 8, textAlign: "left", width: "60%" }}>URL</th>
                  <th style={{ padding: 8, textAlign: "left" }}>Notes</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === "readme" && (
                <tr>
                  <td style={{ padding: "16px 24px", lineHeight: 1.6 }}>
                    <strong>MS-ISAC Malicious Indicators</strong><br/><br/>
                    This spreadsheet contains indicators observed in active campaigns targeting the sector.<br/>
                    Please ingest these into your SIEM, Firewall, and Proxy blocklists.<br/><br/>
                    <strong>WARNING:</strong> Treat this data as TLP:AMBER. Do not submit these indicators to public sandboxes or VirusTotal.<br/>
                    Age out indicators after 30 days unless noted otherwise.
                  </td>
                </tr>
              )}
              {activeTab === "ips" && IPS.map((ip, i) => (
                <tr key={ip} style={{ borderBottom: "1px solid #eee", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: 8 }}>{ip}</td>
                  <td style={{ padding: 8 }}>C2 or scanning activity observed</td>
                </tr>
              ))}
              {activeTab === "domains" && DOMAINS.map((d, i) => (
                <tr key={d} style={{ borderBottom: "1px solid #eee", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: 8 }}>{d}</td>
                  <td style={{ padding: 8 }}>Suspicious domain registration / Fast-flux</td>
                </tr>
              ))}
              {activeTab === "urls" && URLS.map((u, i) => (
                <tr key={u} style={{ borderBottom: "1px solid #eee", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: 8 }}>{u}</td>
                  <td style={{ padding: 8 }}>Payload delivery URL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Tab Strip */}
        <div style={{ display: "flex", backgroundColor: "#f3f4f6", borderTop: "1px solid #ccc" }}>
          <button onClick={() => setActiveTab("readme")} style={{ padding: "8px 16px", border: "none", borderRight: "1px solid #ccc", background: activeTab === "readme" ? "#fff" : "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === "readme" ? "bold" : "normal" }}>
            README
          </button>
          <button onClick={() => setActiveTab("ips")} style={{ padding: "8px 16px", border: "none", borderRight: "1px solid #ccc", background: activeTab === "ips" ? "#fff" : "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === "ips" ? "bold" : "normal" }}>
            IPs ({IPS.length})
          </button>
          <button onClick={() => setActiveTab("domains")} style={{ padding: "8px 16px", border: "none", borderRight: "1px solid #ccc", background: activeTab === "domains" ? "#fff" : "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === "domains" ? "bold" : "normal" }}>
            Domains ({DOMAINS.length})
          </button>
          <button onClick={() => setActiveTab("urls")} style={{ padding: "8px 16px", border: "none", background: activeTab === "urls" ? "#fff" : "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === "urls" ? "bold" : "normal" }}>
            URLs ({URLS.length})
          </button>
        </div>

      </div>
    </div>
  );
}
