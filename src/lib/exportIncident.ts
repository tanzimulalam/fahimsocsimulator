// @ts-ignore - html2pdf has no bundled types
import html2pdf from "html2pdf.js";

export function exportJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface PdfSection {
  heading: string;
  rows?: { label: string; value: string }[];
  bullets?: string[];
}

export function exportPdf(opts: { title: string; subtitle: string; filename: string; sections: PdfSection[] }) {
  const { title, subtitle, filename, sections } = opts;
  const el = document.createElement("div");
  el.innerHTML = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#24292f;background:#fff;">
      <div style="text-align:center;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:28px;">
        <h1 style="color:#2563eb;margin:0 0 6px;font-size:24px;letter-spacing:1.5px;font-weight:800;">DATA GROUP SOC SIMULATION LAB BY FAHIM</h1>
        <p style="color:#57606a;margin:0;font-size:14px;font-weight:600;">${subtitle}</p>
      </div>
      <h2 style="color:#0969da;font-size:18px;border-bottom:1px solid #d0d7de;padding-bottom:6px;">${title}</h2>
      ${sections
        .map(
          (s) => `
        <h3 style="color:#0969da;font-size:15px;margin-top:22px;">${s.heading}</h3>
        ${
          s.rows
            ? `<table style="width:100%;border-collapse:collapse;font-size:13px;">${s.rows
                .map(
                  (r) =>
                    `<tr><td style="padding:8px;border:1px solid #d0d7de;font-weight:600;width:30%;background:#f6f8fa;">${r.label}</td><td style="padding:8px;border:1px solid #d0d7de;">${r.value}</td></tr>`
                )
                .join("")}</table>`
            : ""
        }
        ${
          s.bullets
            ? `<ul style="font-size:13px;line-height:1.6;">${s.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`
            : ""
        }
      `
        )
        .join("")}
    </div>`;

  const opt = {
    margin: 0.4,
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };
  html2pdf().set(opt as any).from(el).save();
}
