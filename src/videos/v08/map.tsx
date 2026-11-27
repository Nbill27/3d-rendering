// The barrel's route, drawn as a cartoon map (code only: SVG paths, no GLB, no
// downloaded image). North is up: the Niagara River flows north from Lake Erie,
// past Goat Island, over the Horseshoe Falls, into the gorge toward Lake Ontario.
// Shown f240-360 (during L2, "had one wild idea"): the dot traces the route the
// barrel took on 24 Oct 1901, from the boat launch south of Goat Island, up the
// river, over the Horseshoe Falls, down 167 ft into the pool below.
// The bottom 500 px stay plain parchment so the burned-in caption stays readable.
import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, premium } from "./story";

const MAP_A = 240, MAP_B = 360, DOT_END = 330;

/** route waypoints (SVG coords, north up): launch -> river -> Goat Island -> crest -> pool */
const ROUTE: [number, number][] = [
  [610, 980], [600, 880], [560, 820], [500, 760], [440, 700], [430, 620], [430, 500],
];
const SEGS = ROUTE.slice(1).map((p, i) => {
  const [x0, y0] = ROUTE[i];
  return Math.hypot(p[0] - x0, p[1] - y0);
});
const TOTAL = SEGS.reduce((a, b) => a + b, 0);
const pointAt = (u: number): [number, number] => {
  let d = clamp01(u) * TOTAL;
  for (let i = 0; i < SEGS.length; i++) {
    if (d <= SEGS[i] || i === SEGS.length - 1) {
      const k = SEGS[i] === 0 ? 0 : d / SEGS[i];
      const [x0, y0] = ROUTE[i], [x1, y1] = ROUTE[i + 1];
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    }
    d -= SEGS[i];
  }
  return ROUTE[ROUTE.length - 1];
};

const LABEL: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fill: "#2a2018",
  paintOrder: "stroke", stroke: "#f2e6c4", strokeWidth: 6, strokeLinejoin: "round",
};

export const MapOverlay: React.FC = () => {
  const f = useCurrentFrame();
  if (f < MAP_A || f >= MAP_B) return null;
  const u = premium((f - MAP_A) / (DOT_END - MAP_A));
  const [dx, dy] = pointAt(u);
  const opacity = Math.min(1, (f - MAP_A) / 8, (MAP_B - f) / 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect x={0} y={0} width={1080} height={1920} fill="#f2e6c4" />
        <rect x={30} y={30} width={1020} height={1860} fill="none" stroke="#8a7a5a" strokeWidth={8} />
        <text x={540} y={118} textAnchor="middle" fontSize={62} style={LABEL}>THE BARREL&rsquo;S ROUTE</text>
        <text x={540} y={172} textAnchor="middle" fontSize={34} style={{ ...LABEL, fontWeight: 700 }}>Niagara River &middot; October 24, 1901</text>

        {/* Lake Ontario (north, top) */}
        <ellipse cx={540} cy={285} rx={330} ry={55} fill="#8ec3ea" stroke="#3a6a9a" strokeWidth={5} />
        <text x={540} y={298} textAnchor="middle" fontSize={32} style={LABEL}>Lake Ontario</text>
        {/* gorge: the river north of the falls */}
        <path d="M 500 340 L 470 470 L 610 470 L 580 340 Z" fill="#8ec3ea" stroke="#3a6a9a" strokeWidth={5} />
        {/* American Falls (east branch) */}
        <rect x={628} y={600} width={46} height={120} fill="#f4fbff" stroke="#3a6a9a" strokeWidth={5} />
        <text x={700} y={640} fontSize={30} style={LABEL}>American</text>
        <text x={700} y={676} fontSize={30} style={LABEL}>Falls</text>
        {/* Horseshoe Falls: the arch, opening north (downstream) */}
        <path d="M 330 720 Q 330 560 430 545 Q 530 560 530 720" fill="none" stroke="#3a6a9a" strokeWidth={46} strokeLinecap="round" />
        <path d="M 330 720 Q 330 560 430 545 Q 530 560 530 720" fill="none" stroke="#f4fbff" strokeWidth={34} strokeLinecap="round" />
        <text x={180} y={620} fontSize={34} style={LABEL}>Horseshoe</text>
        <text x={180} y={658} fontSize={34} style={LABEL}>Falls</text>
        {/* 167 ft drop tag */}
        <text x={180} y={520} fontSize={36} style={{ ...LABEL, fill: "#c0353a" }}>167 ft drop</text>
        <path d="M 300 500 L 380 540" stroke="#c0353a" strokeWidth={5} markerEnd="url(#arrow)" />
        <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#c0353a" /></marker></defs>
        {/* the river: Lake Erie up to the island split */}
        <path d="M 540 1200 C 520 1100 560 1000 540 900" fill="none" stroke="#3a6a9a" strokeWidth={100} strokeLinecap="round" />
        <path d="M 540 1200 C 520 1100 560 1000 540 900" fill="none" stroke="#8ec3ea" strokeWidth={88} strokeLinecap="round" />
        {/* west branch: island to the Horseshoe crest */}
        <path d="M 500 860 Q 450 780 430 700" fill="none" stroke="#3a6a9a" strokeWidth={62} strokeLinecap="round" />
        <path d="M 500 860 Q 450 780 430 700" fill="none" stroke="#8ec3ea" strokeWidth={50} strokeLinecap="round" />
        {/* east branch: island to the American Falls */}
        <path d="M 580 860 Q 630 780 650 720" fill="none" stroke="#3a6a9a" strokeWidth={56} strokeLinecap="round" />
        <path d="M 580 860 Q 630 780 650 720" fill="none" stroke="#8ec3ea" strokeWidth={44} strokeLinecap="round" />
        {/* Goat Island, painted AFTER the branches so the island covers them and
         *  its label reads: v2 had the branches paint over the label ("at Isla") */}
        <ellipse cx={540} cy={810} rx={95} ry={62} fill="#b5d99a" stroke="#6a8a4a" strokeWidth={5} />
        <text x={540} y={838} textAnchor="middle" fontSize={26} style={LABEL}>Goat Island</text>
        <text x={700} y={1080} fontSize={32} style={LABEL}>Niagara River</text>
        {/* Lake Erie (south, bottom): kept above y 1250 so the burned-in caption
         *  (which sits at y ~1300-1380 during L2) does not cover its label */}
        <ellipse cx={540} cy={1200} rx={330} ry={55} fill="#8ec3ea" stroke="#3a6a9a" strokeWidth={5} />
        <text x={540} y={1213} textAnchor="middle" fontSize={32} style={LABEL}>Lake Erie</text>

        {/* the route: dashed red, traced by the barrel */}
        <polyline points={ROUTE.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="#c0353a" strokeWidth={6} strokeDasharray="14 10" strokeLinejoin="round" strokeLinecap="round" />
        <text x={700} y={980} fontSize={30} style={LABEL}>Boat launch</text>
        {/* the barrel, riding the route */}
        <g transform={`translate(${dx} ${dy})`}>
          <rect x={-15} y={-19} width={30} height={38} rx={8} fill="#a8763e" stroke="#2a2018" strokeWidth={4} />
          <rect x={-17} y={-10} width={34} height={6} fill="#3a3f46" />
          <rect x={-17} y={6} width={34} height={6} fill="#3a3f46" />
        </g>
        {/* compass */}
        <g transform="translate(920 300)">
          <circle r={34} fill="#f2e6c4" stroke="#8a7a5a" strokeWidth={4} />
          <path d="M0,-24 L8,10 L0,4 L-8,10 Z" fill="#c0353a" />
          <text y={-40} textAnchor="middle" fontSize={28} style={LABEL}>N</text>
        </g>
        <text x={540} y={1400} textAnchor="middle" fontSize={26} style={{ ...LABEL, fontWeight: 700 }}>Not to scale</text>
      </svg>
    </div>
  );
};
