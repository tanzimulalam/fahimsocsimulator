/** Fake diagrams per treemap tab — teaching visuals only. */

export function TreemapTabDiagram({ tabIndex }: { tabIndex: number }) {
  if (tabIndex === 0) {
    return (
      <svg viewBox="0 0 320 120" className="treemap-diagram-svg" aria-hidden>
        <text x="8" y="14" fill="#8b949e" fontSize="10">
          Student Group — simplified org
        </text>
        <rect x="20" y="28" width="80" height="36" rx="4" fill="#1f6feb" opacity="0.35" stroke="#388bfd" />
        <text x="38" y="50" fill="#e6edf3" fontSize="9">
          Campus
        </text>
        <line x1="100" y1="46" x2="130" y2="46" stroke="#484f58" />
        <rect x="130" y="28" width="80" height="36" rx="4" fill="#e2231a" opacity="0.25" stroke="#f85149" />
        <text x="138" y="50" fill="#e6edf3" fontSize="9">
          LabClass
        </text>
        <line x1="210" y1="46" x2="240" y2="46" stroke="#484f58" />
        <rect x="240" y="28" width="72" height="36" rx="4" fill="#238636" opacity="0.3" stroke="#3fb950" />
        <text x="248" y="50" fill="#e6edf3" fontSize="9">
          Dorms
        </text>
        <text x="8" y="100" fill="#6e7681" fontSize="9">
          Higher block size ≈ more alerts in that segment (simulated).
        </text>
      </svg>
    );
  }
  if (tabIndex === 1) {
    return (
      <svg viewBox="0 0 320 120" className="treemap-diagram-svg" aria-hidden>
        <text x="8" y="14" fill="#8b949e" fontSize="10">
          Malicious activity — kill chain (example)
        </text>
        <circle cx="40" cy="60" r="14" fill="#f0883e" opacity="0.5" />
        <text x="22" y="64" fill="#e6edf3" fontSize="8">
          Deliv.
        </text>
        <line x1="54" y1="60" x2="90" y2="60" stroke="#8b949e" />
        <circle cx="110" cy="60" r="14" fill="#e2231a" opacity="0.55" />
        <text x="96" y="64" fill="#e6edf3" fontSize="8">
          Exec
        </text>
        <line x1="124" y1="60" x2="160" y2="60" stroke="#8b949e" />
        <circle cx="180" cy="60" r="14" fill="#a371f7" opacity="0.45" />
        <text x="162" y="64" fill="#e6edf3" fontSize="8">
          C2
        </text>
        <line x1="194" y1="60" x2="230" y2="60" stroke="#8b949e" />
        <rect x="230" y="46" width="78" height="28" rx="4" fill="#30363d" stroke="#484f58" />
        <text x="238" y="64" fill="#8b949e" fontSize="8">
          Lateral
        </text>
      </svg>
    );
  }
  if (tabIndex === 2) {
    return (
      <svg viewBox="0 0 320 120" className="treemap-diagram-svg" aria-hidden>
        <text x="8" y="14" fill="#8b949e" fontSize="10">
          AMP Everywhere — coverage sketch
        </text>
        <ellipse cx="100" cy="58" rx="70" ry="32" fill="none" stroke="#388bfd" strokeDasharray="4 3" opacity="0.7" />
        <ellipse cx="210" cy="58" rx="70" ry="32" fill="none" stroke="#388bfd" strokeDasharray="4 3" opacity="0.45" />
        <text x="60" y="62" fill="#8b949e" fontSize="9">
          Cloud
        </text>
        <text x="180" y="62" fill="#8b949e" fontSize="9">
          On-prem
        </text>
        <rect x="145" y="48" width="28" height="20" rx="3" fill="#1f6feb" opacity="0.35" />
        <text x="8" y="108" fill="#6e7681" fontSize="9">
          Overlap = dual telemetry (training metaphor).
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 120" className="treemap-diagram-svg" aria-hidden>
      <text x="8" y="14" fill="#8b949e" fontSize="10">
        ADOBE GROUP — app bundle
      </text>
      <rect x="24" y="32" width="120" height="48" rx="4" fill="#6e40c9" opacity="0.25" stroke="#8957e5" />
      <text x="36" y="58" fill="#e6edf3" fontSize="10">
        Creative Cloud
      </text>
      <rect x="160" y="32" width="120" height="48" rx="4" fill="#f0883e" opacity="0.2" stroke="#f0883e" />
      <text x="188" y="58" fill="#e6edf3" fontSize="10">
        PDF tools
      </text>
      <text x="8" y="104" fill="#6e7681" fontSize="9">
        Vendor-specific policy islands (demo).
      </text>
    </svg>
  );
}
