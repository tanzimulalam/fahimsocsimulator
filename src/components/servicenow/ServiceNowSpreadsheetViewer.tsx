import { useState } from "react";
import { MSISAC_DOMAINS, MSISAC_HASHES, MSISAC_IPS, MSISAC_URLS } from "../../data/msisacIocs";

export function ServiceNowSpreadsheetViewer({ fileName, onClose }: { fileName: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("readme");
  const isWeek2 = fileName.includes("2026-04-27") || fileName.includes("2026-05-03");
  const domains = isWeek2 ? MSISAC_DOMAINS.slice(0, 10) : MSISAC_DOMAINS;

  const handleDownload = () => {
    const csvContent =
      "indicator,type,source\n" +
      MSISAC_IPS.map((r) => `${r.value},IP,${r.source}`).join("\n") +
      "\n" +
      domains.map((r) => `${r.value},Domain,${r.source}`).join("\n") +
      "\n" +
      MSISAC_URLS.map((r) => `${r.value},URL,${r.source}`).join("\n") +
      "\n" +
      MSISAC_HASHES.map((r) => `${r.value},Hash,${r.source}`).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName.replace(".xlsx", ".csv"));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sn-modal-overlay">
      <div className="sn-modal sn-modal-wide">
        <div className="sn-modal-header">
          <h3>Spreadsheet Preview: {fileName}</h3>
          <button type="button" className="sn-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="sn-tlp-banner">TLP:AMBER</div>

        <div className="sn-modal-toolbar">
          <span>Read-only preview — ingest into AMP block list after review</span>
          <button type="button" className="sn-btn" onClick={handleDownload}>
            Download CSV
          </button>
        </div>

        <div className="sn-spreadsheet-body">
          <table className="sn-spreadsheet-table">
            <thead>
              {activeTab === "readme" && (
                <tr>
                  <th>README / Instructions</th>
                </tr>
              )}
              {activeTab === "ips" && (
                <tr>
                  <th>IP</th>
                  <th>SOURCE</th>
                </tr>
              )}
              {activeTab === "domains" && (
                <tr>
                  <th>DOMAIN</th>
                  <th>SOURCE</th>
                </tr>
              )}
              {activeTab === "urls" && (
                <tr>
                  <th>URL</th>
                  <th>SOURCE</th>
                </tr>
              )}
              {activeTab === "hashes" && (
                <tr>
                  <th>SHA-256</th>
                  <th>SOURCE</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === "readme" && (
                <tr>
                  <td className="sn-readme-cell">
                    <strong>Additional Context and Description of Product</strong>
                    <br />
                    <br />
                    This file contains IOCs (IPs, domains, URLs) associated with malicious activity observed by MS-ISAC
                    during the reporting period. Data is aggregated, validated, and vetted by CIS CTI analysts before
                    publication.
                    <br />
                    <br />
                    <strong>Recommendations</strong>
                    <br />
                    Review and remove old indicators from previous lists — they may no longer be malicious. Remove IOCs
                    from network security devices no later than 4 weeks after their last appearance in the list.
                    <br />
                    <br />
                    <strong>WARNING:</strong> Treat as TLP:AMBER. Do not submit to public sandboxes or VirusTotal.
                  </td>
                </tr>
              )}
              {activeTab === "ips" &&
                MSISAC_IPS.map((row, i) => (
                  <tr key={row.value} className={i % 2 === 0 ? "even" : "odd"}>
                    <td>{row.value}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              {activeTab === "domains" &&
                domains.map((row, i) => (
                  <tr key={row.value} className={i % 2 === 0 ? "even" : "odd"}>
                    <td>{row.value}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              {activeTab === "urls" &&
                MSISAC_URLS.map((row, i) => (
                  <tr key={row.value} className={i % 2 === 0 ? "even" : "odd"}>
                    <td>{row.value}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              {activeTab === "hashes" &&
                MSISAC_HASHES.map((row, i) => (
                  <tr key={row.value} className={i % 2 === 0 ? "even" : "odd"}>
                    <td>
                      <code>{row.value.slice(0, 16)}…</code>
                    </td>
                    <td>{row.source}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="sn-spreadsheet-tabs">
          <button type="button" className={activeTab === "readme" ? "active" : ""} onClick={() => setActiveTab("readme")}>
            README
          </button>
          <button type="button" className={activeTab === "ips" ? "active" : ""} onClick={() => setActiveTab("ips")}>
            IPs ({MSISAC_IPS.length})
          </button>
          <button
            type="button"
            className={activeTab === "domains" ? "active" : ""}
            onClick={() => setActiveTab("domains")}
          >
            Domains ({domains.length})
          </button>
          <button type="button" className={activeTab === "urls" ? "active" : ""} onClick={() => setActiveTab("urls")}>
            URLs ({MSISAC_URLS.length})
          </button>
          <button type="button" className={activeTab === "hashes" ? "active" : ""} onClick={() => setActiveTab("hashes")}>
            Hashes ({MSISAC_HASHES.length})
          </button>
        </div>
      </div>
    </div>
  );
}
