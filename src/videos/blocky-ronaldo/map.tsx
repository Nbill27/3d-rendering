// Map overlays — BLOCKY-RONALDO. Code only: SVG paths, no GLB, no downloaded image.
// (anatomy: isometric map figure; hairline_create: the route line; hairline_adopt:
// the airport sign and scoreboard are adopted line figures.)
// Scene 3 (Prolog): Madeira island in the middle of the blue Atlantic, one tin-roof
// house and one ball. Scene 21 (Babak 4): world map, flight line Manchester -> Riyadh.
// The bottom 500 px stay plain so the burned-in caption stays readable.
import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, premium, FPS, SCENES } from "./story";

const LABEL: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fill: "#2a2018",
  paintOrder: "stroke", stroke: "#f2e6c4", strokeWidth: 6, strokeLinejoin: "round",
};

/** Madeira map, shown during scene 3 (f660-900, estimated). */
const MadeiraMap: React.FC<{ f: number }> = ({ f }) => {
  const u = clamp01((f - 660) / 120);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <rect width={1080} height={1420} fill="#2a7ab8" />
      <text x={540} y={200} textAnchor="middle" fontSize={54} style={LABEL}>SAMUDRA ATLANTIK</text>
      {/* Madeira island, blocky */}
      <g opacity={u}>
        <polygon points="380,650 700,620 760,760 620,860 420,840 360,740" fill="#5a8a4a" stroke="#2a2018" strokeWidth={6} />
        <text x={540} y={760} textAnchor="middle" fontSize={48} style={LABEL}>MADEIRA</text>
        <text x={540} y={820} textAnchor="middle" fontSize={30} style={LABEL}>FUNCHAL</text>
        {/* tin-roof house + ball */}
        <rect x={500} y={900} width={80} height={60} fill="#f4e6c4" stroke="#2a2018" strokeWidth={5} />
        <polygon points="490,900 590,900 540,860" fill="#8a8f96" stroke="#2a2018" strokeWidth={5} />
        <circle cx={640} cy={940} r={26} fill="#ffffff" stroke="#2a2018" strokeWidth={5} />
      </g>
    </svg>
  );
};

/** World map flight line, shown during scene 21 (f6060-6420, estimated). */
const FlightMap: React.FC<{ f: number }> = ({ f }) => {
  const u = clamp01((f - 6060) / 240);
  const x0 = 420, y0 = 500, x1 = 760, y1 = 720;
  const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 220;
  const px = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1;
  const py = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <rect width={1080} height={1420} fill="#2a7ab8" />
      <text x={200} y={500} fontSize={40} style={LABEL}>MANCHESTER</text>
      <text x={700} y={780} fontSize={40} style={LABEL}>RIYADH</text>
      <path d={`M ${x0} ${y0} Q ${mx} ${my} ${x1} ${y1}`} fill="none" stroke="#ffffff" strokeWidth={6} strokeDasharray="18 14" />
      <g transform={`translate(${px} ${py})`}>
        <rect x={-30} y={-8} width={60} height={16} fill="#ffffff" stroke="#2a2018" strokeWidth={4} />
        <rect x={-8} y={-30} width={16} height={60} fill="#1d4fa1" stroke="#2a2018" strokeWidth={4} />
      </g>
    </svg>
  );
};

export const MapOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const scene = SCENES.find((s) => f >= s.a && f < s.b) ?? SCENES[0];
  if (scene.id === 3) return <MadeiraMap f={f} />;
  if (scene.id === 21) return <FlightMap f={f} />;
  return null;
};

/** Scoreboard numbers overlay (Prolog scene 2, Babak 5 scene 25, Epilog scene 27).
 *  Only numbers that are in the script: 980+, 146, 140, 42, 17, 807, 234, 1000. */
export const NumbersOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const scene = SCENES.find((s) => f >= s.a && f < s.b) ?? SCENES[0];
  if (!scene.numbers) return null;
  const shown = scene.numbers.filter((_, i) => f >= scene.a + i * ((scene.b - scene.a) / scene.numbers!.length));
  return (
    <div style={{ position: "absolute", top: 320, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      {shown.map((n) => (
        <div key={n} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, fontSize: 110, color: "#ffffff", textShadow: "4px 0 0 #000, -4px 0 0 #000, 0 4px 0 #000, 0 -4px 0 #000" }}>
          {n}
        </div>
      ))}
    </div>
  );
};
export { premium, FPS };
