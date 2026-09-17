import { useMemo } from 'react';

/**
 * Simulated SAR (Synthetic Aperture Radar) image preview.
 * Renders a procedurally generated dark ocean backscatter scene with a
 * low-backscatter slick region and an optional segmentation mask overlay.
 * Replace with a real raster tile / COG endpoint when SAR ingestion lands.
 */
export function SarPreview({
  showMask = true,
  showBoundingBox = true,
  seed = 7,
}: {
  showMask?: boolean;
  showBoundingBox?: boolean;
  seed?: number;
}) {
  // Deterministic pseudo-random speckle cells for the SAR backscatter texture.
  const cells = useMemo(() => {
    const rand = mulberry32(seed);
    const out: Array<{ x: number; y: number; v: number }> = [];
    const cols = 48;
    const rows = 34;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        out.push({ x, y, v: rand() });
      }
    }
    return { out, cols, rows };
  }, [seed]);

  // Slick polygon in viewBox coordinates (irregular elongated shape).
  const slickPath =
    'M 210 120 C 240 95 300 88 340 105 C 385 124 420 110 455 130 ' +
    'C 480 145 470 175 440 185 C 400 200 350 195 315 210 ' +
    'C 275 226 225 215 205 185 C 190 160 190 138 210 120 Z';

  const cellW = 640 / cells.cols;
  const cellH = 460 / cells.rows;

  return (
    <svg
      viewBox="0 0 640 460"
      className="w-full h-full block"
      role="img"
      aria-label="Simulated Sentinel-1 SAR scene"
    >
      <defs>
        <filter id="sar-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.08  0 0 0 0 0.12  0 0 0 0.35 0" />
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
        <linearGradient id="sar-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#101a28" />
          <stop offset="55%" stopColor="#0d1520" />
          <stop offset="100%" stopColor="#0a1119" />
        </linearGradient>
      </defs>

      {/* Ocean backscatter background */}
      <rect width="640" height="460" fill="url(#sar-bg)" />
      <g filter="url(#sar-grain)">
        {cells.out.map((c, i) => (
          <rect
            key={i}
            x={c.x * cellW}
            y={c.y * cellH}
            width={cellW + 0.5}
            height={cellH + 0.5}
            fill={`rgba(148, 184, 220, ${0.02 + c.v * 0.10})`}
          />
        ))}
      </g>

      {/* Dark slick region (low backscatter) */}
      <path d={slickPath} fill="#05090f" opacity="0.85" />
      <path d={slickPath} fill="none" stroke="#0a1520" strokeWidth="6" opacity="0.5" />

      {/* A few bright point scatterers (vessels / rigs) */}
      <circle cx="150" cy="90" r="2.5" fill="#cbd5e1" opacity="0.9" />
      <circle cx="520" cy="300" r="2" fill="#cbd5e1" opacity="0.8" />
      <circle cx="95" cy="330" r="1.8" fill="#cbd5e1" opacity="0.7" />

      {/* Segmentation mask overlay */}
      {showMask && (
        <g>
          <path d={slickPath} fill="#22d3ee" opacity="0.22" />
          <path
            d={slickPath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeDasharray="6 3"
            opacity="0.9"
          />
        </g>
      )}

      {/* Bounding geometry */}
      {showBoundingBox && (
        <g>
          <rect
            x="185"
            y="82"
            width="300"
            height="150"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.8"
          />
          <text x="189" y="78" fill="#f59e0b" fontSize="10" fontFamily="monospace">
            SLICK-01 · conf 0.947
          </text>
        </g>
      )}

      {/* Graticule + scale hints */}
      <g stroke="#1e2d45" strokeWidth="0.5" opacity="0.6">
        {[80, 160, 240, 320, 400, 480, 560].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="460" />
        ))}
        {[76, 152, 228, 304, 380].map((y) => (
          <line key={y} x1="0" y1={y} x2="640" y2={y} />
        ))}
      </g>

      {/* Corner metadata */}
      <text x="10" y="450" fill="#64748b" fontSize="9" fontFamily="monospace">
        S1A_IW_GRDH_VV · SIMULATED SCENE · 10m/px
      </text>
      <text x="540" y="16" fill="#64748b" fontSize="9" fontFamily="monospace">
        LIVE FEED
      </text>
    </svg>
  );
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
