import { useMemo } from "react";

interface IdentityShieldProps {
  cloud: number;
  onPrem: number;
  hybrid: number;
}

type Hex = { x: number; y: number; zone: 0 | 1 | 2 };

const ZONE_FILL = ["#1f6feb", "#bf3989", "#2ea88f"];

// Pointy-top hexagon path centered at (cx, cy) with circumradius r.
function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

export function IdentityShield({ cloud, onPrem, hybrid }: IdentityShieldProps) {
  const fmt = (n: number) => n.toLocaleString();

  // Build a honeycomb clustered into a rounded shield silhouette via a small loop.
  const { hexes, dots } = useMemo(() => {
    const R = 13; // hex circumradius
    const hStep = R * 1.5; // horizontal spacing (pointy-top)
    const vStep = R * Math.sqrt(3); // vertical spacing
    const cx = 150;
    const cy = 140;
    const out: Hex[] = [];
    for (let col = -5; col <= 5; col++) {
      for (let row = -5; row <= 5; row++) {
        const x = cx + col * hStep;
        const y = cy + row * vStep + (col % 2 ? vStep / 2 : 0);
        // shield silhouette: rounded top, tapering point at the bottom
        const dx = (x - cx) / 75;
        const topLobe = dx * dx + Math.pow((y - cy + 20) / 70, 2) <= 1;
        const pointPart = y > cy + 30 && Math.abs(x - cx) < (180 - (y - cy)) / 2.6;
        if (!topLobe && !pointPart) continue;
        const zone: 0 | 1 | 2 = x < cx - 14 ? 0 : x > cx + 14 ? 1 : 2;
        out.push({ x, y, zone });
      }
    }
    // faint static particle field around the shield
    const d: { x: number; y: number; r: number }[] = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 60; i++) {
      d.push({ x: 20 + rand() * 260, y: 20 + rand() * 250, r: 0.8 + rand() * 1.8 });
    }
    return { hexes: out, dots: d };
  }, []);

  return (
    <div className="def-itdr-shield-wrap">
      <svg
        viewBox="0 0 300 290"
        className="def-itdr-shield-svg"
        role="img"
        aria-label={`Identity population: ${fmt(cloud)} cloud users, ${fmt(onPrem)} on-premises users, ${fmt(hybrid)} hybrid users.`}
      >
        {dots.map((p, i) => (
          <circle key={`d${i}`} cx={p.x} cy={p.y} r={p.r} fill="#58a6ff" opacity={0.12} />
        ))}
        {hexes.map((h, i) => (
          <path key={`h${i}`} d={hexPath(h.x, h.y, 12)} fill={ZONE_FILL[h.zone]} opacity={0.85} stroke="#0d1117" strokeWidth={1.4} />
        ))}
      </svg>

      <div className="def-itdr-callout def-itdr-cloud">
        <span className="def-itdr-bullet" style={{ background: ZONE_FILL[0] }} aria-hidden />
        <div><div className="def-itdr-num">{fmt(cloud)}</div><div className="def-itdr-cap">Cloud Users</div></div>
      </div>
      <div className="def-itdr-callout def-itdr-onprem">
        <span className="def-itdr-bullet" style={{ background: ZONE_FILL[1] }} aria-hidden />
        <div><div className="def-itdr-num">{fmt(onPrem)}</div><div className="def-itdr-cap">On-Prem Users</div></div>
      </div>
      <div className="def-itdr-callout def-itdr-hybrid">
        <span className="def-itdr-bullet" style={{ background: ZONE_FILL[2] }} aria-hidden />
        <div><div className="def-itdr-num">{fmt(hybrid)}</div><div className="def-itdr-cap">Hybrid Users</div></div>
      </div>
    </div>
  );
}
