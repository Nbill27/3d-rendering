// Cartoon map of France with Paris marked (code only: SVG paths, no GLB,
// no downloaded image). North is up: the English Channel at the top,
// Paris in the north-centre with a little Eiffel Tower marker, the Seine
// flowing north-west from Paris to the Channel, the Mediterranean at the
// bottom. Shown f150-240 (start of L2, "In May nineteen twenty-five..."):
// the map answers "where" before the cafe scene shows "what".
// The bottom 500 px stay plain parchment so the burned-in caption stays readable.
import React from "react";
import { useCurrentFrame } from "remotion";

const MAP_A = 150, MAP_B = 240;

const LABEL: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fill: "#2a2018",
  paintOrder: "stroke", stroke: "#f2e6c4", strokeWidth: 6, strokeLinejoin: "round",
};

export const MapOverlay: React.FC = () => {
  const f = useCurrentFrame();
  if (f < MAP_A || f >= MAP_B) return null;
  const opacity = Math.min(1, (f - MAP_A) / 8, (MAP_B - f) / 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect x={0} y={0} width={1080} height={1920} fill="#f2e6c4" />
        <rect x={30} y={30} width={1020} height={1860} fill="none" stroke="#8a7a5a" strokeWidth={8} />
        <text x={540} y={118} textAnchor="middle" fontSize={62} style={LABEL}>PARIS, FRANCE</text>
        <text x={540} y={172} textAnchor="middle" fontSize={34} style={{ ...LABEL, fontWeight: 700 }}>May 1925 &middot; where the tower stood</text>

        {/* English Channel (north, top) */}
        <path d="M 180 250 Q 540 210 900 250 L 900 310 Q 540 270 180 310 Z" fill="#8ec3ea" stroke="#3a6a9a" strokeWidth={5} />
        <text x={540} y={292} textAnchor="middle" fontSize={30} style={LABEL}>English Channel</text>

        {/* France (rough hexagon, north up) */}
        <path d="M 340 420 L 430 330 L 570 300 L 700 330 L 790 480 L 760 700 L 700 900 L 640 1080 L 480 1120 L 360 1000 L 300 780 L 290 560 Z"
          fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
        <text x={620} y={900} textAnchor="middle" fontSize={44} style={LABEL}>FRANCE</text>

        {/* the Seine: from Paris north-west to the Channel */}
        <path d="M 545 470 Q 500 420 460 390 Q 430 365 410 330" fill="none" stroke="#3a6a9a" strokeWidth={14} strokeLinecap="round" />
        <path d="M 545 470 Q 500 420 460 390 Q 430 365 410 330" fill="none" stroke="#8ec3ea" strokeWidth={8} strokeLinecap="round" />
        <text x={380} y={430} fontSize={28} style={LABEL}>Seine</text>

        {/* Mediterranean Sea (south, bottom) */}
        <path d="M 330 1180 Q 540 1140 760 1180 L 760 1240 Q 540 1200 330 1240 Z" fill="#8ec3ea" stroke="#3a6a9a" strokeWidth={5} />
        <text x={540} y={1230} textAnchor="middle" fontSize={28} style={LABEL}>Mediterranean Sea</text>

        {/* Paris: red dot (the tower glyph drawn inside it read as a letter "A",
            so the dot stands alone; the arrow + label name the tower) */}
        <circle cx={545} cy={470} r={26} fill="#c23a12" stroke="#241726" strokeWidth={5} />
        <text x={545} y={420} textAnchor="middle" fontSize={48} style={LABEL}>PARIS</text>
        <text x={700} y={520} fontSize={30} style={LABEL}>the Eiffel Tower</text>
        <path d="M 585 505 L 660 512" stroke="#c23a12" strokeWidth={5} markerEnd="url(#arrow)" />
        <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#c23a12" /></marker></defs>

        {/* compass */}
        <g transform="translate(920 300)">
          <circle r={34} fill="#f2e6c4" stroke="#8a7a5a" strokeWidth={4} />
          <path d="M0,-24 L8,10 L0,4 L-8,10 Z" fill="#c0353a" />
          <text y={-40} textAnchor="middle" fontSize={28} style={LABEL}>N</text>
        </g>
        <text x={540} y={1330} textAnchor="middle" fontSize={26} style={{ ...LABEL, fontWeight: 700 }}>Not to scale</text>
      </svg>
    </div>
  );
};
