/** MS-ISAC / CIS CTI indicator sets used in ServiceNow lab tickets and AMP blocklist sync. */

export type MsisacIocRow = { value: string; source: string; notes?: string };

export const MSISAC_IPS: MsisacIocRow[] = [
  { value: "104.243.35.76", source: "CIS CTI", notes: "C2 or scanning activity observed" },
  { value: "141.98.10.37", source: "CIS CTI", notes: "C2 or scanning activity observed" },
  { value: "192.109.139.16", source: "CIS CTI", notes: "C2 or scanning activity observed" },
  { value: "98.142.252.140", source: "CIS CTI", notes: "C2 or scanning activity observed" },
  { value: "185.234.218.116", source: "CIS CTI", notes: "AsyncRAT beacon infrastructure" },
  { value: "45.142.212.100", source: "CIS CTI", notes: "Payload staging server" },
  { value: "91.240.118.168", source: "CIS CTI", notes: "Emotet loader download" },
  { value: "151.101.65.91", source: "Monitoring Services", notes: "Suspicious redirect chain" },
  { value: "94.232.41.155", source: "CIS CTI", notes: "Scanning activity observed" },
  { value: "185.220.101.47", source: "CIS CTI", notes: "Tor exit / anonymization" },
  { value: "185.234.219.21", source: "CIS CTI", notes: "C2 infrastructure" },
  { value: "203.0.113.47", source: "CIS CTI", notes: "Lab sinkhole reference" },
  { value: "194.165.16.78", source: "CIS CTI", notes: "Brute-force source" },
  { value: "82.165.13.29", source: "CIS CTI", notes: "Credential stuffing source" },
  { value: "176.12.11.45", source: "CIS CTI", notes: "Fast-flux host" },
];

export const MSISAC_DOMAINS: MsisacIocRow[] = [
  { value: "ad.screenconnect.com", source: "Monitoring Services", notes: "Abused remote access subdomain" },
  { value: "allgreenlandscape.screenconnect.com", source: "CIS CTI", notes: "ScreenConnect instance abuse" },
  { value: "ancomsystems.screenconnect.com", source: "CIS CTI", notes: "ScreenConnect instance abuse" },
  { value: "bodyandball.screenconnect.com", source: "CIS CTI", notes: "ScreenConnect instance abuse" },
  { value: "ahec.digital", source: "CIS CTI", notes: "Suspicious .digital TLD registration" },
  { value: "sheq.digital", source: "CIS CTI", notes: "Suspicious .digital TLD registration" },
  { value: "ahew.digital", source: "CIS CTI", notes: "Suspicious .digital TLD registration" },
  { value: "akap.digital", source: "CIS CTI", notes: "Suspicious .digital TLD registration" },
  { value: "akuv.digital", source: "CIS CTI", notes: "Suspicious .digital TLD registration" },
  { value: "ddos.dnsnb8.net", source: "CIS CTI", notes: "DDoS-related infrastructure" },
  { value: "15kg.goldensilks.com.cn", source: "CIS CTI", notes: "Phishing landing page" },
  { value: "fsh.co", source: "CIS CTI", notes: "Credential harvesting" },
  { value: "2000pearls.com", source: "CIS CTI", notes: "Fast-flux domain" },
  { value: "aaronbsystems.mobility.cfd", source: "CIS CTI", notes: "Suspicious TLD / fast-flux" },
  { value: "update-cdn.microsoftservices.workers.dev", source: "CIS CTI", notes: "Typosquat / impersonation" },
  { value: "invoicesystem.duckdns.org", source: "CIS CTI", notes: "Dynamic DNS abuse" },
];

export const MSISAC_URLS: MsisacIocRow[] = [
  { value: "http://185.234.218.116/payload.exe", source: "CIS CTI", notes: "Payload delivery URL" },
  { value: "http://45.142.212.100/config.bin", source: "CIS CTI", notes: "Stage-2 download" },
  { value: "https://invoicesystem.duckdns.org/download.php?id=882", source: "CIS CTI", notes: "Phishing kit download" },
  { value: "http://151.101.65.91/logo.png", source: "CIS CTI", notes: "Steganography / redirect" },
  { value: "https://ahec.digital/login", source: "CIS CTI", notes: "Credential phishing page" },
];

export const MSISAC_HASHES: MsisacIocRow[] = [
  { value: "b2a965c5e4f3a1d8c9b7e6f5a4d3c2b1a0f9e8d7c6b5a4938271605f4e3d2c1", source: "CIS CTI", notes: "AsyncRAT sample (truncated for lab)" },
  { value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", source: "CIS CTI", notes: "Emotet loader DLL" },
];

/** Week 2 IOC set (4/27–5/3) — overlapping plus new entries for the second ticket. */
export const MSISAC_WEEK2_DOMAINS: MsisacIocRow[] = [
  ...MSISAC_DOMAINS.slice(0, 8),
  { value: "secure-login.portal-update.net", source: "CIS CTI", notes: "New phishing domain this week" },
  { value: "cdn.static-resource-sys.net", source: "CIS CTI", notes: "Malware CDN" },
];

export function iocValues(rows: MsisacIocRow[]): string[] {
  return rows.map((r) => r.value);
}
