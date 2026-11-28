// "Video20": War of the Pacific, History Rush #12.
// "Three Countries Went to War Over Bird Poop"
// 9 adegan (L1 hook, L2, L3, L4, L5, L6, L7 laut, L8 darat, L9+L10 peta+foto),
// 3 beat: L1-3 (harta gurun), L4-6 (pajak jadi perang), L7-10 (perang +
// harga + twist). 2 lokasi: Gurun Atacama + laut/peta Pasifik.
// KARAKTER: pekerja oficina (kind "miner", baju cokelat + topi jerami),
// pemilik perusahaan tambang Chile (kind "owner", jas gelap + topi bowler),
// pejabat Bolivia (kind "official", jas gelap + selempang merah-kuning-hijau),
// prajurit Chile (kind "chilean", seragam biru gelap + kepi merah),
// perwira Peru (kind "peruvian", seragam putih + topi biru gelap).
// Prat dan Grau HANYA disebut di VO/karaoke (hormat, tidak digambar gugur).
// BATAS KEJUJURAN: semua fakta dari RESEARCH.md; tidak ada adegan/
// dialog/quote karangan; nada ringan/absurd pada premis, tetap hormat
// pada yang gugur (Prat, Grau).
// TIDAK ADA karakter duduk di video ini (aturan duduk TIDAK BERLAKU).
// KAMERA (aturan kamera bill 28 Nov): LOCKED-OFF; hanya 2 push-in
// (cepat 1->1.18 di hook S1, lambat 1->1.08 di S7 Huascar);
// panX = 0, panY = 0.
// GAYA @tauugaksih (aturan bill 28 Nov, berlaku semua video selanjutnya):
// palet komplementer KONSISTEN jingga/terakota gurun lawan biru laut Pasifik;
// SATU kata kunci BESAR per beat (GUANO, TAX, WAR, SEA, LOST) di
// tengah frame di samping karaoke; kedalaman tiga lapis dengan foreground
// framing (tumpukan guano, tiang dermaga, semak); motif yang diulang:
// tumpukan guano (S1, S2, S9) dan kapal Huascar (S7 3D, S9 foto asli);
// ekspresi SNAP (mata "> <" marah, "^ ^" tertawa, mulut "O" kaget);
// S9 (twist) lebih gelap dan dingin (subuh biru gelap).
// TIMING: karaoke.ts TERUKUR WhisperX Tahap 7, 28 Nov 2026.
// Teks karaoke Poppins ExtraBold putih outline hitam tebal, 46px,
// maxWidth 920, bottom 430 (spesifikasi Lustig v3 / Peshtigo / Wojtek).
// TOTAL_FRAMES = 1800.
import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { KARAOKE } from "./karaoke";
import { World3D } from "./world3d";
import { MAP_A, MAP_B, PHOTO_A } from "./story";

const INK = "#241726"; // plum ink, bean-head canon (v01/toon.ts)
const SKIN = "#ffe2c2";
const SKIN_SHADE = "#f0c09e";
const MOUTH_DARK = "#5a1e28";
const MINER_BROWN = "#7a5a34"; // baju cokelat pekerja oficina
const OWNER_NAVY = "#2a2a3a"; // jas gelap pemilik perusahaan tambang
const OFFICIAL_GREEN = "#2e4a34"; // jas hijau gelap pejabat Bolivia
const CHILE_BLUE = "#1f2a44"; // seragam biru gelap prajurit Chile
const PERU_WHITE = "#e8e6da"; // seragam putih perwira Peru
const KEPI_RED = "#a02a22"; // kepi merah prajurit Chile
const TROUSER = "#4a3826";
const TROUSER_DARK = "#33261a";
const BOOT = "#3a2a1a";
const SWEAT = "#9fd4ff";

/* ------------------------------------------------------------------ */
/* Character: BEAN-HEAD (basis v16/Video16.tsx + v01/toon.ts).          */
/* Kotak natural 360 x 520 (kaki menapak y=500). Kepala bean 200x192   */
/* = 38% tinggi total. Badan ramping 130x190.                           */
/* Gerakan (aturan bill 27 Nov): kaki jalan KANAN lalu KIRI bergantian */
/* MENGANGKAT KE ATAS (vertikal, sinus 12 f/langkah, lift 20 px);      */
/* badan maju ke depan lewat y/scale di Scene (bukan di komponen);     */
/* bob berdiri = 0 (karakter diam benar-benar diam); bob jalan hanya   */
/* untuk pose "walk". Lengan berlawanan dengan kaki (6 px).            */
/* ------------------------------------------------------------------ */

type CharKind = "miner" | "owner" | "official" | "chilean" | "peruvian";
type CharPose = "stand" | "point" | "pointL" | "walk" | "worried" | "salute" | "wave" | "stop";
type Expr = "amazed" | "stern" | "worried" | "shock" | "star" | "smile" | "content" | "sad" | "angry" | "laugh";

const starPath = (cx: number, cy: number, ro = 16, ri = 6.5): string =>
  `M ${cx} ${cy - ro} L ${cx + ri * 0.7} ${cy - ri * 0.7} L ${cx + ro} ${cy} ` +
  `L ${cx + ri * 0.7} ${cy + ri * 0.7} L ${cx} ${cy + ro} L ${cx - ri * 0.7} ${cy + ri * 0.7} ` +
  `L ${cx - ro} ${cy} L ${cx - ri * 0.7} ${cy - ri * 0.7} Z`;

const BeanHead: React.FC<{
  x: number;
  y: number;
  scale?: number;
  kind?: CharKind;
  pose?: CharPose;
  expr?: Expr;
  local?: number;
}> = ({
  x,
  y,
  scale = 1,
  kind = "miner",
  pose = "stand",
  expr = "smile",
  local = 0,
}) => {
  const uid = useId().replace(/:/g, "");
  const walking = pose === "walk";
  const stepIdx = Math.floor(local / 12);
  const stepT = (local % 12) / 12;
  const liftPhase = Math.sin(stepT * Math.PI);
  const LIFT = 20;
  const leftLifting = stepIdx % 2 === 0;
  const liftL = walking && leftLifting ? LIFT * liftPhase : 0;
  const liftR = walking && !leftLifting ? LIFT * liftPhase : 0;
  // Bob berdiri = 0 (koreksi bill 27 Nov): karakter diam tidak boleh
  // bergoyang; bob hanya untuk pose "walk".
  const bob = walking ? -Math.abs(Math.sin(local * 0.26)) * 12 : 0;
  const armLiftL = walking && !leftLifting ? 6 * liftPhase : 0;
  const armLiftR = walking && leftLifting ? 6 * liftPhase : 0;
  const blink = local % 90 < 4;
  // Lambaian tangan (pose wave): naik-turun pelan, bukan putaran.
  const waveY = pose === "wave" ? Math.sin(local * 0.25) * 8 : 0;

  const EX = 152;
  const EX2 = 208;
  const EY = 118;
  const MX = 180;
  const MY = 152;

  const eyes = () => {
    if (blink) {
      return (
        <>
          <line x1={EX - 13} y1={EY} x2={EX + 13} y2={EY} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <line x1={EX2 - 13} y1={EY} x2={EX2 + 13} y2={EY} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </>
      );
    }
    switch (expr) {
      case "amazed":
      case "shock": {
        const r = expr === "shock" ? 17 : 15;
        return (
          <>
            <ellipse cx={EX} cy={EY} rx={r} ry={r + 1} fill="#ffffff" stroke={INK} strokeWidth={4} />
            <ellipse cx={EX2} cy={EY} rx={r} ry={r + 1} fill="#ffffff" stroke={INK} strokeWidth={4} />
            <circle cx={EX} cy={EY + 1} r={5} fill={INK} />
            <circle cx={EX2} cy={EY + 1} r={5} fill={INK} />
          </>
        );
      }
      case "stern":
        return (
          <>
            <path d={`M ${EX - 14} ${EY} A 14 12 0 0 1 ${EX + 14} ${EY} Z`} fill={INK} />
            <line x1={EX - 15} y1={EY} x2={EX + 15} y2={EY} stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <path d={`M ${EX2 - 14} ${EY} A 14 12 0 0 1 ${EX2 + 14} ${EY} Z`} fill={INK} />
            <line x1={EX2 - 15} y1={EY} x2={EX2 + 15} y2={EY} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          </>
        );
      case "angry":
        // mata "> <" (snap, seperti video referensi @tauugaksih)
        return (
          <>
            <path d={`M ${EX - 12} ${EY - 10} L ${EX + 12} ${EY} L ${EX - 12} ${EY + 10}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M ${EX2 + 12} ${EY - 10} L ${EX2 - 12} ${EY} L ${EX2 + 12} ${EY + 10}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      case "laugh":
        // mata "^ ^" (snap)
        return (
          <>
            <path d={`M ${EX - 14} ${EY + 4} Q ${EX} ${EY - 14} ${EX + 14} ${EY + 4}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <path d={`M ${EX2 - 14} ${EY + 4} Q ${EX2} ${EY - 14} ${EX2 + 14} ${EY + 4}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          </>
        );
      case "worried":
      case "sad":
        return (
          <>
            <ellipse cx={EX} cy={EY} rx={5.5} ry={8} fill={INK} />
            <ellipse cx={EX2} cy={EY} rx={5.5} ry={8} fill={INK} />
          </>
        );
      case "star":
        return (
          <>
            <path d={starPath(EX, EY)} fill="#ffd84a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <path d={starPath(EX2, EY)} fill="#ffd84a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          </>
        );
      case "smile":
      case "content":
        return (
          <>
            <path d={`M ${EX - 14} ${EY + 4} A 15 12 0 0 1 ${EX + 14} ${EY + 4}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <path d={`M ${EX2 - 14} ${EY + 4} A 15 12 0 0 1 ${EX2 + 14} ${EY + 4}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <ellipse cx={EX} cy={EY} rx={7} ry={10} fill={INK} />
            <ellipse cx={EX2} cy={EY} rx={7} ry={10} fill={INK} />
          </>
        );
    }
  };

  const brows = () => {
    const sw = 6;
    switch (expr) {
      case "amazed":
      case "shock":
      case "star":
        return (
          <>
            <path d={`M ${EX - 14} ${EY - 24} Q ${EX} ${EY - 32} ${EX + 14} ${EY - 24}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <path d={`M ${EX2 - 14} ${EY - 24} Q ${EX2} ${EY - 32} ${EX2 + 14} ${EY - 24}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      case "angry":
        return (
          <>
            <line x1={EX - 14} y1={EY - 28} x2={EX + 14} y2={EY - 12} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <line x1={EX2 + 14} y1={EY - 28} x2={EX2 - 14} y2={EY - 12} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      case "stern":
        return (
          <>
            <line x1={EX - 14} y1={EY - 24} x2={EX + 14} y2={EY - 16} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <line x1={EX2 + 14} y1={EY - 24} x2={EX2 - 14} y2={EY - 16} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      case "worried":
      case "sad":
        return (
          <>
            <line x1={EX - 14} y1={EY - 16} x2={EX + 14} y2={EY - 24} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <line x1={EX2 + 14} y1={EY - 16} x2={EX2 - 14} y2={EY - 24} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <path d={`M ${EX - 13} ${EY - 20} Q ${EX} ${EY - 25} ${EX + 13} ${EY - 20}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <path d={`M ${EX2 - 13} ${EY - 20} Q ${EX2} ${EY - 25} ${EX2 + 13} ${EY - 20}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
    }
  };

  const mouth = () => {
    switch (expr) {
      case "amazed":
        return <ellipse cx={MX + 4} cy={MY} rx={7} ry={8} fill={MOUTH_DARK} stroke={INK} strokeWidth={3} />;
      case "shock":
        return <ellipse cx={MX} cy={MY + 2} rx={15} ry={18} fill={MOUTH_DARK} stroke={INK} strokeWidth={4} />;
      case "angry":
        return <path d={`M ${MX - 14} ${MY + 2} L ${MX + 14} ${MY + 2}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      case "laugh":
        // mulut tertawa lebar + gigi kotak (snap, seperti video referensi)
        return (
          <>
            <path d={`M ${MX - 22} ${MY - 6} A 22 14 0 0 0 ${MX + 22} ${MY - 6} Z`} fill={MOUTH_DARK} stroke={INK} strokeWidth={4} />
            <rect x={MX - 16} y={MY - 5} width={32} height={9} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
            <line x1={MX - 5} y1={MY - 5} x2={MX - 5} y2={MY + 4} stroke={INK} strokeWidth={2} />
            <line x1={MX + 6} y1={MY - 5} x2={MX + 6} y2={MY + 4} stroke={INK} strokeWidth={2} />
          </>
        );
      case "stern":
        return <path d={`M ${MX - 12} ${MY + 6} A 13 9 0 0 1 ${MX + 12} ${MY + 6}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      case "worried":
        return <path d={`M ${MX - 14} ${MY} Q ${MX - 7} ${MY - 5} ${MX} ${MY} Q ${MX + 7} ${MY + 5} ${MX + 14} ${MY}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
      case "sad":
        return <path d={`M ${MX - 12} ${MY + 4} A 13 9 0 0 1 ${MX + 12} ${MY + 4}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      case "star":
      case "smile":
        return <path d={`M ${MX - 20} ${MY - 4} A 20 12 0 0 0 ${MX + 20} ${MY - 4}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      case "content":
        return <path d={`M ${MX - 14} ${MY - 2} A 14 9 0 0 0 ${MX + 14} ${MY - 2}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      default:
        return <line x1={MX - 12} y1={MY} x2={MX + 12} y2={MY - 1} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    }
  };

  const sweat = expr === "stern" || expr === "worried";

  // Lengan: kiri menggantung / mengayun, atau menunjuk ke kiri (pose
  // "pointL" untuk karakter di sisi kanan frame); kanan menggantung,
  // menunjuk, memberi hormat (ke pelipis), melambai, khawatir, atau
  // menolak (pose "stop": tangan kanan terangkat, telapak terbuka).
  const armLPath =
    pose === "pointL"
      ? "M115,228 Q71,198 49,166"
      : pose === "worried"
        ? "M115,228 Q89,276 85,322"
        : "M115,228 Q101,282 107,336";
  const armLHand: [number, number] = pose === "pointL" ? [49, 166] : pose === "worried" ? [85, 322] : [107, 336];
  const armRPath =
    pose === "point"
      ? "M245,228 Q289,198 311,166"
      : pose === "salute"
        ? "M245,228 Q305,175 292,108"
        : pose === "wave"
          ? "M245,228 Q292,190 306,140"
          : pose === "stop"
            ? "M245,228 Q296,176 304,120"
            : pose === "worried"
              ? "M245,228 Q271,276 275,322"
              : "M245,228 Q259,282 253,336";
  const armRHand: [number, number] =
    pose === "point" ? [311, 166] : pose === "salute" ? [292, 108] : pose === "wave" ? [306, 140] : pose === "stop" ? [304, 120] : pose === "worried" ? [275, 322] : [253, 336];

  const bodyFill =
    kind === "miner"
      ? MINER_BROWN
      : kind === "owner"
        ? OWNER_NAVY
        : kind === "official"
          ? OFFICIAL_GREEN
          : kind === "chilean"
            ? CHILE_BLUE
            : PERU_WHITE;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bob,
        width: 360,
        height: 520,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <svg width={360} height={520} viewBox="0 0 360 520">
        <defs>
          <clipPath id={`head-${uid}`}>
            <path d="M180,6 C235,6 278,48 278,100 C278,150 250,192 180,200 C110,192 82,150 82,100 C82,48 125,6 180,6 Z" />
          </clipPath>
          <clipPath id={`body-${uid}`}>
            <path d="M180,198 C220,198 245,228 245,286 C245,340 220,388 180,388 C140,388 115,340 115,286 C115,228 140,198 180,198 Z" />
          </clipPath>
        </defs>

        {/* kaki: celana panjang gelap + sepatu bot (semua karakter) */}
        <g transform={`translate(0 ${-liftL})`}>
          <line x1={160} y1={378} x2={157} y2={490} stroke={TROUSER_DARK} strokeWidth={14} strokeLinecap="round" />
          <line x1={160} y1={378} x2={157} y2={490} stroke={TROUSER} strokeWidth={10} strokeLinecap="round" />
          <rect x={138} y={484} width={40} height={18} rx={7} fill={BOOT} stroke={INK} strokeWidth={3.5} />
        </g>
        <g transform={`translate(0 ${-liftR})`}>
          <line x1={200} y1={378} x2={203} y2={490} stroke={TROUSER_DARK} strokeWidth={14} strokeLinecap="round" />
          <line x1={200} y1={378} x2={203} y2={490} stroke={TROUSER} strokeWidth={10} strokeLinecap="round" />
          <rect x={184} y={484} width={40} height={18} rx={7} fill={BOOT} stroke={INK} strokeWidth={3.5} />
        </g>

        {/* badan ramping: kapsul 130x190, outline plum */}
        <path
          d="M180,198 C220,198 245,228 245,286 C245,340 220,388 180,388 C140,388 115,340 115,286 C115,228 140,198 180,198 Z"
          fill={bodyFill}
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {/* miner: kancing kayu + saku dada + noda guano putih di bahu */}
                {kind === "miner" && (
          <>
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#d8cba8" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#d8cba8" stroke={INK} strokeWidth={2.5} />
            <rect x={132} y={232} width={30} height={24} rx={4} fill="#5a3a22" stroke={INK} strokeWidth={3} />
            <ellipse cx={140} cy={210} rx={14} ry={6} fill="#f2efe6" stroke={INK} strokeWidth={2.5} />
          </>
        )}
        {/* owner: dasi + kancing emas + saku jas */}
                {kind === "owner" && (
          <>
            <path d="M172,206 L180,232 L188,206 L188,344 L172,344 Z" fill="#8a2a22" stroke={INK} strokeWidth={3} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <rect x={204} y={232} width={30} height={24} rx={4} fill="#1f1f2a" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* official: selempang merah-kuning-hijau (Bolivia) + kancing */}
                {kind === "official" && (
          <>
            <path d="M128,214 L232,352 L214,360 L118,232 Z" fill="#c23a12" stroke={INK} strokeWidth={3} />
            <path d="M140,214 L232,330 L222,344 L128,228 Z" fill="#ffd84a" stroke={INK} strokeWidth={2} />
            <path d="M156,214 L232,308 L224,320 L144,226 Z" fill="#2e7a44" stroke={INK} strokeWidth={2} />
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#1f2a1c" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
          </>
        )}
        {/* chilean: ikat pinggang gelap + kancing + tanda pangkat merah */}
                {kind === "chilean" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#141c30" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <rect x={118} y={202} width={40} height={14} rx={4} fill="#a02a22" stroke={INK} strokeWidth={3} />
            <rect x={202} y={202} width={40} height={14} rx={4} fill="#a02a22" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* peruvian: ikat pinggang biru gelap + kancing emas + kerah putih */}
                {kind === "peruvian" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#1f2a44" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <path d="M150,202 L180,224 L210,202 L210,214 L180,232 L150,214 Z" fill="#f5f2ea" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* topi */}

        {/* kepala bean */}
        <path
          d="M180,6 C235,6 278,48 278,100 C278,150 250,192 180,200 C110,192 82,150 82,100 C82,48 125,6 180,6 Z"
          fill={SKIN}
          stroke={INK}
          strokeWidth={7}
          strokeLinejoin="round"
        />
        <g clipPath={`url(#head-${uid})`}>
          <path d="M252,36 C276,72 280,132 250,188 C264,140 264,82 252,36 Z" fill={SKIN_SHADE} opacity={0.7} />
        </g>
        <path d="M262,60 C276,100 272,150 238,182" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={0.55} />

        {/* miner: topi jerami lebar */}
                {kind === "miner" && (
          <>
            <ellipse cx={180} cy={52} rx={112} ry={12} fill="#d8c88a" stroke={INK} strokeWidth={4} />
            <path d="M118,52 C118,18 146,8 180,8 C214,8 242,18 242,52 L242,56 L118,56 Z" fill="#c9b878" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <line x1={122} y1={44} x2={238} y2={44} stroke="#8a7a3a" strokeWidth={5} />
          </>
        )}
        {/* owner: topi bowler gelap */}
                {kind === "owner" && (
          <>
            <ellipse cx={180} cy={56} rx={104} ry={9} fill="#1f1f2a" stroke={INK} strokeWidth={4} />
            <path d="M126,56 C126,16 150,6 180,6 C210,6 234,16 234,56 L234,60 L126,60 Z" fill="#2a2a3a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          </>
        )}
        {/* official: topi puncak hijau gelap + pita emas */}
                {kind === "official" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={OFFICIAL_GREEN} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#1f2a1c" stroke={INK} strokeWidth={4} />
            <line x1={96} y1={52} x2={264} y2={52} stroke="#ffd84a" strokeWidth={5} />
          </>
        )}
        {/* chilean: kepi biru + pita merah */}
                {kind === "chilean" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={CHILE_BLUE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#141c30" stroke={INK} strokeWidth={4} />
            <line x1={96} y1={52} x2={264} y2={52} stroke={KEPI_RED} strokeWidth={5} />
          </>
        )}
        {/* peruvian: topi puncak putih + pita biru gelap */}
                {kind === "peruvian" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={PERU_WHITE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#1f2a44" stroke={INK} strokeWidth={4} />
            <line x1={96} y1={52} x2={264} y2={52} stroke="#1f2a44" strokeWidth={5} />
          </>
        )}
        {/* wajah */}
        {brows()}
        {eyes()}
        {mouth()}
        {sweat && (
          <ellipse cx={262} cy={92} rx={7} ry={11} fill={SWEAT} stroke={INK} strokeWidth={2.5} />
        )}
        {/* lengan digambar SETELAH kepala supaya lengan hormat (tangan di
            pelipis) terlihat di depan wajah, bukan tertutup kepala */}
        <g transform={`translate(0 ${-armLiftL})`}>
          <path d={armLPath} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <circle cx={armLHand[0]} cy={armLHand[1]} r={6.5} fill={INK} />
        </g>
        <g transform={`translate(0 ${-armLiftR + waveY})`}>
          <path d={armRPath} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <circle cx={armRHand[0]} cy={armRHand[1] + waveY} r={6.5} fill={INK} />
        </g>
      </svg>
    </div>
  );
};

/** Bayangan kontak kecil di bawah kaki supaya karakter "menapak".
 *  foot = offset kaki dalam kotak komponen (BeanHead 500). */
const ContactShadow: React.FC<{ x: number; y: number; scale?: number; foot?: number }> = ({ x, y, scale = 1, foot = 500 }) => {
  const w = 130 * scale;
  return (
    <div
      style={{
        position: "absolute",
        left: x + 180 * scale - w / 2,
        top: y + (foot - 4) * scale,
        width: w,
        height: 22 * scale,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 70%)",
        borderRadius: "50%",
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/** Tiga bendera (S1, hook): Chile, Peru, Bolivia berdampingan — tiga
 *  negara yang berperang. 3 tiang + 3 bendera 150x90, warna bendera
 *  asli masing-masing negara. */
const FlagTrio: React.FC<{ x: number; y: number; scale?: number; local?: number }> = ({ x, y, scale = 1, local = 0 }) => {
  const wave = Math.sin(local * 0.08) * 2;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 626, height: 340, transform: `scale(${scale})`, transformOrigin: "top left" }}>
    <svg width={626} height={340} viewBox="0 0 626 340">
      {/* tiang */}
      <rect x={68} y={0} width={8} height={340} fill="#5a3a22" stroke={INK} strokeWidth={3} />
      <rect x={268} y={0} width={8} height={340} fill="#5a3a22" stroke={INK} strokeWidth={3} />
      <rect x={468} y={0} width={8} height={340} fill="#5a3a22" stroke={INK} strokeWidth={3} />
      {/* bendera Chile: putih-merah + bintang biru */}
      <g transform={`translate(0 ${wave})`}>
        <rect x={76} y={0} width={150} height={90} fill="#ffffff" stroke={INK} strokeWidth={4} />
        <rect x={76} y={45} width={150} height={45} fill="#c23a12" />
        <rect x={76} y={0} width={50} height={45} fill="#2a4a8a" />
        <path d={starPath(101, 22, 12, 5)} fill="#ffffff" stroke={INK} strokeWidth={2} />
      </g>
      {/* bendera Peru: merah-putih-merah vertikal */}
      <g transform={`translate(0 ${-wave})`}>
        <rect x={276} y={0} width={50} height={90} fill="#c23a12" stroke={INK} strokeWidth={4} />
        <rect x={326} y={0} width={50} height={90} fill="#ffffff" stroke={INK} strokeWidth={4} />
        <rect x={376} y={0} width={50} height={90} fill="#c23a12" stroke={INK} strokeWidth={4} />
      </g>
      {/* bendera Bolivia: merah-kuning-hijau horizontal */}
      <g transform={`translate(0 ${wave})`}>
        <rect x={476} y={0} width={150} height={30} fill="#c23a12" stroke={INK} strokeWidth={4} />
        <rect x={476} y={30} width={150} height={30} fill="#ffd84a" stroke={INK} strokeWidth={4} />
        <rect x={476} y={60} width={150} height={30} fill="#2e7a44" stroke={INK} strokeWidth={4} />
      </g>
    </svg>
    </div>
  );
};

/** Timbangan (S3): guano di satu piring lawan koin emas di piring lain —
 *  "worth a fortune". Balok kayu + 2 piring gantung + tumpukan guano
 *  putih + 5 koin emas. Balok miring sedikit lalu seimbang (local). */
const ScaleProp: React.FC<{ x: number; y: number; scale?: number; local?: number }> = ({ x, y, scale = 1, local = 0 }) => {
  const tilt = Math.max(0, 8 - local * 0.12);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 440, height: 310, transform: `scale(${scale})`, transformOrigin: "top left" }}>
    <svg width={440} height={310} viewBox="0 0 440 310">
      {/* tiang + kaki */}
      <rect x={212} y={40} width={16} height={260} fill="#5a3a22" stroke={INK} strokeWidth={4} />
      <rect x={140} y={296} width={160} height={14} rx={6} fill="#5a3a22" stroke={INK} strokeWidth={4} />
      {/* balok miring lalu seimbang */}
      <g transform={`rotate(${-tilt} 220 60)`}>
        <rect x={40} y={52} width={360} height={16} rx={8} fill="#8a6a42" stroke={INK} strokeWidth={4} />
        <circle cx={220} cy={60} r={10} fill="#ffd84a" stroke={INK} strokeWidth={3} />
        {/* tali kiri + piring guano */}
        <line x1={80} y1={68} x2={80} y2={120} stroke={INK} strokeWidth={3} />
        <line x1={60} y1={68} x2={80} y2={120} stroke={INK} strokeWidth={3} />
        <line x1={100} y1={68} x2={80} y2={120} stroke={INK} strokeWidth={3} />
        <path d="M40,120 L120,120 L112,132 L48,132 Z" fill="#8a8a8a" stroke={INK} strokeWidth={3} />
        <path d="M52,120 Q60,92 70,120 Q80,84 90,120 Q100,92 108,120 Z" fill="#f2efe6" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* tali kanan + piring koin emas */}
        <line x1={360} y1={68} x2={360} y2={120} stroke={INK} strokeWidth={3} />
        <line x1={340} y1={68} x2={360} y2={120} stroke={INK} strokeWidth={3} />
        <line x1={380} y1={68} x2={360} y2={120} stroke={INK} strokeWidth={3} />
        <path d="M320,120 L400,120 L392,132 L328,132 Z" fill="#8a8a8a" stroke={INK} strokeWidth={3} />
        <circle cx={344} cy={112} r={12} fill="#ffd84a" stroke={INK} strokeWidth={3} />
        <circle cx={368} cy={108} r={12} fill="#ffd84a" stroke={INK} strokeWidth={3} />
        <circle cx={356} cy={96} r={12} fill="#ffd84a" stroke={INK} strokeWidth={3} />
        <circle cx={380} cy={114} r={12} fill="#ffd84a" stroke={INK} strokeWidth={3} />
        <circle cx={336} cy={98} r={12} fill="#ffd84a" stroke={INK} strokeWidth={3} />
      </g>
    </svg>
    </div>
  );
};

/** Surat pajak (S4): kertas putih + kop "REPUBLICA DE BOLIVIA" + baris
 *  "TAX 10 CENTS" besar merah + segel. Dipegang pejabat Bolivia. */
const TaxPaper: React.FC<{ x: number; y: number; scale?: number; rot?: number; local?: number }> = ({ x, y, scale = 1, rot = 0, local = 0 }) => {
  const pop = local < 30 ? 0.9 + local * 0.0033 : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 300, height: 380, transform: `scale(${scale * pop}) rotate(${rot}deg)`, transformOrigin: "top left" }}>
    <svg width={300} height={380} viewBox="0 0 300 380">
      <rect x={0} y={0} width={300} height={380} rx={8} fill="#f5f2ea" stroke={INK} strokeWidth={5} />
      <text x={150} y={44} textAnchor="middle" fontSize={20} fontWeight={800} fill="#2a2a2e" fontFamily="Poppins, sans-serif">REPUBLICA DE BOLIVIA</text>
      <line x1={24} y1={58} x2={276} y2={58} stroke="#2a2a2e" strokeWidth={3} />
      <text x={150} y={104} textAnchor="middle" fontSize={22} fontWeight={700} fill="#2a2a2e" fontFamily="Poppins, sans-serif">DECRETO 1878</text>
      <text x={150} y={140} textAnchor="middle" fontSize={20} fontWeight={600} fill="#2a2a2e" fontFamily="Poppins, sans-serif">Impuesto sobre</text>
      <text x={150} y={168} textAnchor="middle" fontSize={20} fontWeight={600} fill="#2a2a2e" fontFamily="Poppins, sans-serif">el salitre:</text>
      <text x={150} y={232} textAnchor="middle" fontSize={40} fontWeight={900} fill="#c23a12" fontFamily="Poppins, sans-serif">10 CENTS</text>
      <text x={150} y={272} textAnchor="middle" fontSize={20} fontWeight={600} fill="#2a2a2e" fontFamily="Poppins, sans-serif">per quintal</text>
      <circle cx={60} cy={330} r={26} fill="#c23a12" stroke={INK} strokeWidth={3} />
      <text x={60} y={338} textAnchor="middle" fontSize={22} fontWeight={900} fill="#ffffff" fontFamily="Poppins, sans-serif">B</text>
    </svg>
    </div>
  );
};

/** Surat perjanjian rahasia (S6): kertas + kop "TRATADO SECRETO" + dua
 *  meterai (Peru + Bolivia) + jatuh dari atas meja saat adegan berjalan. */
const DeclarationPaper: React.FC<{ x: number; y: number; scale?: number; local?: number }> = ({ x, y, scale = 1, local = 0 }) => {
  const drop = Math.min(local * 4, 160);
  const rot = Math.min(local * 0.15, 6);
  return (
    <div style={{ position: "absolute", left: x, top: y + drop, width: 280, height: 340, transform: `scale(${scale}) rotate(${rot}deg)`, transformOrigin: "top left" }}>
    <svg width={280} height={340} viewBox="0 0 280 340">
      <rect x={0} y={0} width={280} height={340} rx={8} fill="#f5f2ea" stroke={INK} strokeWidth={5} />
      <text x={140} y={44} textAnchor="middle" fontSize={22} fontWeight={800} fill="#2a2a2e" fontFamily="Poppins, sans-serif">TRATADO SECRETO</text>
      <line x1={24} y1={58} x2={256} y2={58} stroke="#2a2a2e" strokeWidth={3} />
      <text x={140} y={100} textAnchor="middle" fontSize={18} fontWeight={600} fill="#2a2a2e" fontFamily="Poppins, sans-serif">Bolivia — Peru</text>
      <text x={140} y={128} textAnchor="middle" fontSize={18} fontWeight={600} fill="#2a2a2e" fontFamily="Poppins, sans-serif">1873</text>
      <text x={140} y={180} textAnchor="middle" fontSize={18} fontWeight={600} fill="#2a2a2e" fontFamily="Poppins, sans-serif">Si uno es atacado,</text>
      <text x={140} y={206} textAnchor="middle" fontSize={18} fontWeight={600} fill="#2a2a2e" fontFamily="Poppins, sans-serif">el otro ayuda.</text>
      <circle cx={80} cy={290} r={24} fill="#c23a12" stroke={INK} strokeWidth={3} />
      <circle cx={200} cy={290} r={24} fill="#2a4a8a" stroke={INK} strokeWidth={3} />
    </svg>
    </div>
  );
};


/** Karaoke text: satu frasa, Poppins ExtraBold, putih outline hitam tebal,
 *  satu baris, bawah-tengah (bottom 430, zona aman TikTok). Ukuran
 *  menyesuaikan frasa ke ~920 px (cap 46 px, floor 30 px). */
const fitFontSize = (phrase: string): number => {
  const est = phrase.length * 0.68;
  return Math.max(30, Math.min(46, Math.floor(920 / est)));
};

const OUTLINE =
  "0 3px 0 #000000, 3px 0 0 #000000, -3px 0 0 #000000, 0 -3px 0 #000000, 2px 2px 0 #000000, -2px 2px 0 #000000, 2px -2px 0 #000000, -2px -2px 0 #000000, 0 6px 12px rgba(0,0,0,0.55)";

const KaraokeText: React.FC<{ phrase: string }> = ({ phrase }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 430, display: "flex", justifyContent: "center", paddingLeft: 30, paddingRight: 30, textAlign: "center" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: fitFontSize(phrase), lineHeight: 1.05, color: "#ffffff", textShadow: OUTLINE, whiteSpace: "nowrap" }}>
      {phrase}
    </div>
  </div>
);

/** Label tahun + tempat (wajib sejak video 5): tampil di awal tiap beat. */
const DateLabel: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 110, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 44, lineHeight: 1.15, color: "#ffffff", textShadow: OUTLINE, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 18, padding: "14px 28px", textAlign: "center" }}>
      {text}
    </div>
  </div>
);

/** SATU KATA KUNCI BESAR per beat (aturan @tauugaksih, berlaku semua video
 *  selanjutnya): satu kata per beat, huruf tebal Poppins ExtraBold putih
 *  outline hitam, di tengah frame di samping karaoke. Kata mengatur ritme,
 *  bukan gerakan karakter. Muncul dengan pop kecil lalu diam. */
const BeatWord: React.FC<{ word: string; local: number; top?: number }> = ({ word, local, top = 380 }) => {
  const pop = local < 12 ? interpolate(local, [0, 6, 12], [0.85, 1.06, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        width: 1080,
        textAlign: "center",
        fontFamily: "Poppins, sans-serif",
        fontWeight: 900,
        fontSize: 110,
        letterSpacing: 6,
        color: "#ffffff",
        textShadow: "6px 0 0 #241726, -6px 0 0 #241726, 0 6px 0 #241726, 0 -6px 0 #241726, 4px 4px 0 #241726, -4px -4px 0 #241726, 4px -4px 0 #241726, -4px 4px 0 #241726, 0 10px 18px rgba(0,0,0,0.45)",
        transform: `scale(${pop})`,
        zIndex: 5,
      }}
    >
      {word}
    </div>
  );
};

/** Shot peta (S9, f1450-1610): pantai Pasifik 1879-1884 — Peru, Bolivia,
 *  Chile; Tarapaca (hilang Peru 1883) + Litoral/Antofagasta (hilang
 *  Bolivia 1884) disorot merah; panah Chile ke utara; caption bawah
 *  "BOLIVIA LOST ITS COAST". Palet peta ikut pasangan komplementer:
 *  laut biru lawan darat terakota. */
const MapOverlay: React.FC<{ local?: number }> = ({ local = 0 }) => (
  <div style={{ position: "absolute", top: 180, left: 40, width: 1000, height: 1180, zIndex: 4 }}>
    <svg width={1000} height={1180} viewBox="0 0 1080 1180" style={{ display: "block" }}>
      <rect x={0} y={0} width={1080} height={1180} rx={18} fill="#f5f2ea" stroke="#241726" strokeWidth={5} />
      <text x={540} y={62} fontSize={34} fontWeight={900} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">THE PACIFIC COAST, 1879–1884</text>
      {/* laut (biru) di kiri, darat (terakota) di kanan */}
      <polygon points="60,100 400,100 520,1060 60,1060" fill="#2a6a9a" stroke="#241726" strokeWidth={4} />
      <polygon points="400,100 1020,100 1020,1060 520,1060" fill="#d8a878" stroke="#241726" strokeWidth={4} />
      {/* wilayah: Peru (atas), Bolivia (tengah), Chile (bawah) */}
      <polygon points="400,100 1020,100 1020,500 460,500" fill="#e8c898" stroke="#241726" strokeWidth={3} />
      <polygon points="460,500 1020,500 1020,760 500,760" fill="#d8b078" stroke="#241726" strokeWidth={3} />
      <polygon points="500,760 1020,760 1020,1060 520,1060" fill="#c98a5a" stroke="#241726" strokeWidth={3} />
      {/* wilayah yang hilang: Tarapaca (Peru, 1883) + Litoral (Bolivia, 1884) */}
      <polygon points="455,470 560,470 575,620 470,620" fill="#c23a12" stroke="#7a1a08" strokeWidth={4} strokeDasharray="12 8" />
      <polygon points="470,620 575,620 590,760 485,760" fill="#e86a2a" stroke="#7a1a08" strokeWidth={4} strokeDasharray="12 8" />
      {/* panah Chile ke utara */}
      <path d="M540,980 L540,830" stroke="#a02a22" strokeWidth={10} strokeLinecap="round" />
      <path d="M525,860 L540,830 L555,860" fill="none" stroke="#a02a22" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M540,800 L540,660" stroke="#a02a22" strokeWidth={10} strokeLinecap="round" />
      <path d="M525,690 L540,660 L555,690" fill="none" stroke="#a02a22" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      {/* titik pelabuhan */}
      <circle cx={500} cy={700} r={10} fill="#241726" />
      <circle cx={475} cy={560} r={10} fill="#241726" />
      <circle cx={560} cy={300} r={10} fill="#241726" />
      <circle cx={700} cy={900} r={10} fill="#241726" />
      {/* label */}
      <text x={220} y={560} fontSize={34} fontWeight={900} fill="#ffffff" textAnchor="middle" fontFamily="Poppins, sans-serif" transform="rotate(-90 220 560)">PACIFIC OCEAN</text>
      <text x={760} y={300} fontSize={36} fontWeight={900} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">PERU</text>
      <text x={760} y={620} fontSize={36} fontWeight={900} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">BOLIVIA</text>
      <text x={760} y={970} fontSize={36} fontWeight={900} fill="#ffffff" textAnchor="middle" fontFamily="Poppins, sans-serif">CHILE</text>
      <text x={600} y={545} fontSize={26} fontWeight={800} fill="#241726" textAnchor="start" fontFamily="Poppins, sans-serif">TARAPACA</text>
      <text x={600} y={575} fontSize={22} fontWeight={700} fill="#241726" textAnchor="start" fontFamily="Poppins, sans-serif">PERU LOST 1883</text>
      <text x={610} y={690} fontSize={26} fontWeight={800} fill="#241726" textAnchor="start" fontFamily="Poppins, sans-serif">LITORAL</text>
      <text x={610} y={720} fontSize={22} fontWeight={700} fill="#241726" textAnchor="start" fontFamily="Poppins, sans-serif">BOLIVIA LOST 1884</text>
      <text x={430} y={700} fontSize={24} fontWeight={800} fill="#241726" textAnchor="end" fontFamily="Poppins, sans-serif">ANTOFAGASTA</text>
      <text x={430} y={560} fontSize={24} fontWeight={800} fill="#241726" textAnchor="end" fontFamily="Poppins, sans-serif">IQUIQUE</text>
      <text x={580} y={300} fontSize={24} fontWeight={800} fill="#241726" textAnchor="start" fontFamily="Poppins, sans-serif">LIMA</text>
      <text x={680} y={908} fontSize={24} fontWeight={800} fill="#ffffff" textAnchor="end" fontFamily="Poppins, sans-serif">SANTIAGO</text>
      {/* caption bawah */}
      <rect x={180} y={1090} width={720} height={64} rx={32} fill="#a02a22" stroke="#241726" strokeWidth={4} />
      <text x={540} y={1132} fontSize={32} fontWeight={900} fill="#ffffff" textAnchor="middle" fontFamily="Poppins, sans-serif">BOLIVIA LOST ITS COAST</text>
    </svg>
    <div style={{ textAlign: "center", marginTop: 8, fontFamily: "Poppins, sans-serif", fontSize: 20, color: "#cfe3f2", opacity: 0.6 }}>Not to scale</div>
  </div>
);

/** Frame foto asli domain publik (f1700-1800): monitor Huascar, 1903.
 *  File: studio/public/huascar-1903.jpg (Wikimedia Commons, File:Monitor
 *  _Huascar_1903.jpg, public domain). Motif yang diulang: kapal yang sama
 *  muncul sebagai 3D di S7, lalu sebagai foto asli di akhir — "balasan"
 *  visual untuk twist. */
const PhotoFrame: React.FC = () => (
  <div style={{ position: "absolute", top: 560, left: 140, width: 800, zIndex: 4, transform: "rotate(-1.5deg)" }}>
    <div style={{ background: "#f5f2ea", padding: 16, paddingBottom: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.45)", borderRadius: 6 }}>
      <img src={staticFile("huascar-1903.jpg")} alt="The monitor Huascar, 1903" style={{ width: "100%", display: "block", borderRadius: 3 }} />
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 26, fontWeight: 700, color: "#241726", textAlign: "center", marginTop: 12, lineHeight: 1.3 }}>
        The monitor Huascar, photographed in 1903
      </div>
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 20, fontWeight: 600, color: "#5a5a5a", textAlign: "center", marginTop: 4 }}>
        Photo: public domain (Wikimedia Commons)
      </div>
    </div>
  </div>
);

const Scene1: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Hook: tiga bendera berdampingan di gurun — tiga negara, satu perang. */}
    <FlagTrio x={227} y={480} scale={1.0} local={local} />
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Dua pekerja oficina di depan mesin salitrera (3D); satu menunjuk. */}
    <ContactShadow x={80} y={700} scale={1.35} />
    <BeanHead x={80} y={700} scale={1.35} kind="miner" pose="stand" expr="content" local={local} />
    <ContactShadow x={700} y={720} scale={1.2} />
    <BeanHead x={700} y={720} scale={1.2} kind="miner" pose="point" expr="smile" local={local} />
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Timbangan: guano lawan koin emas; pekerja tertawa (absurd, SNAP "^ ^"). */}
    <ScaleProp x={430} y={900} scale={1.15} local={local} />
    <ContactShadow x={60} y={700} scale={1.3} />
    <BeanHead x={60} y={700} scale={1.3} kind="miner" pose="point" expr="laugh" local={local} />
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Pejabat Bolivia (marah, mata "> <", SNAP) menunjukkan surat pajak;
        pemilik perusahaan menolak membayar (khawatir, keringat). */}
    <ContactShadow x={100} y={680} scale={1.35} />
    <BeanHead x={100} y={680} scale={1.35} kind="official" pose="point" expr="angry" local={local} />
    <ContactShadow x={700} y={700} scale={1.2} />
    <BeanHead x={700} y={700} scale={1.2} kind="owner" pose="worried" expr="worried" local={local} />
    <TaxPaper x={310} y={1000} scale={0.8} rot={-8} local={local} />
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number }> = ({ local }) => {
  // Tiga prajurit Chile berjalan maju ke pelabuhan (aturan jalan: kaki
  // kanan lalu kiri mengangkat ke ATAS, badan maju ke DEPAN, tanpa
  // goyang kiri-kanan; x tetap, y/scale naik pelan = maju ke kamera).
  const yL = 700 + Math.min(local / 60, 1) * 80;
  const sL = 1.15 + Math.min(local / 60, 1) * 0.1;
  const yB = 700 + Math.min(local / 60, 1) * 80;
  const sB = 1.2 + Math.min(local / 60, 1) * 0.1;
  const yR = 700 + Math.min(local / 60, 1) * 80;
  const sR = 1.1 + Math.min(local / 60, 1) * 0.1;
  return (
    <AbsoluteFill>
      <ContactShadow x={0} y={yL} scale={sL} />
      <BeanHead x={0} y={yL} scale={sL} kind="chilean" pose="walk" expr="stern" local={local} />
      <ContactShadow x={340} y={yB} scale={sB} />
      <BeanHead x={340} y={yB} scale={sB} kind="chilean" pose="walk" expr="stern" local={local} />
      <ContactShadow x={700} y={yR} scale={sR} />
      <BeanHead x={700} y={yR} scale={sR} kind="chilean" pose="walk" expr="stern" local={local} />
    </AbsoluteFill>
  );
};

const Scene6: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Perjanjian rahasia: pejabat Bolivia + perwira Peru berhadapan dalam
        bayangan; surat perjanjian jatuh dari atas meja. */}
    <ContactShadow x={80} y={680} scale={1.3} />
    <BeanHead x={80} y={680} scale={1.3} kind="official" pose="stand" expr="stern" local={local} />
    <ContactShadow x={700} y={680} scale={1.3} />
    <BeanHead x={700} y={680} scale={1.3} kind="peruvian" pose="stand" expr="stern" local={local} />
    <DeclarationPaper x={400} y={900} scale={0.9} local={local} />
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Pertempuran laut Iquique sepenuhnya 3D: Huascar (menara berputar,
        menembak) lawan Esmeralda (miring, tenggelam pelan). Hormat: tanpa
        ledakan, tanpa karakter gugur digambar. */}
  </AbsoluteFill>
);

const Scene8: React.FC<{ local: number }> = ({ local }) => {
  // Tiga prajurit Chile berjalan maju di darat Tacna (pola jalan sama
  // seperti S5); meriam Krupp 3D menembak sekali di belakang mereka.
  const yL = 720 + Math.min(local / 60, 1) * 70;
  const sL = 1.15 + Math.min(local / 60, 1) * 0.1;
  const yB = 720 + Math.min(local / 60, 1) * 70;
  const sB = 1.2 + Math.min(local / 60, 1) * 0.1;
  const yR = 720 + Math.min(local / 60, 1) * 70;
  const sR = 1.1 + Math.min(local / 60, 1) * 0.1;
  return (
    <AbsoluteFill>
      <ContactShadow x={0} y={yL} scale={sL} />
      <BeanHead x={0} y={yL} scale={sL} kind="chilean" pose="walk" expr="stern" local={local} />
      <ContactShadow x={340} y={yB} scale={sB} />
      <BeanHead x={340} y={yB} scale={sB} kind="chilean" pose="walk" expr="stern" local={local} />
      <ContactShadow x={700} y={yR} scale={sR} />
      <BeanHead x={700} y={yR} scale={sR} kind="chilean" pose="walk" expr="stern" local={local} />
    </AbsoluteFill>
  );
};

const Scene9: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Penutup: peta (f1450-1610) lalu foto Huascar 1903 (f1700-1800).
        Kata kunci LOST muncul di antara keduanya (local 170-255),
        di atas pantai subuh biru gelap — suasana dingin penanda twist. */}
  </AbsoluteFill>
);

const SCENES: React.FC<{ local: number }>[] = [
  Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9,
];

const SCENE_SPANS: [number, number][] = [
  [0, 150], [151, 297], [298, 462], [463, 665], [666, 848], [849, 1019], [1020, 1251], [1252, 1442], [1443, 1800],
];

const sceneFromFrame = (frame: number): number => {
  const i = SCENE_SPANS.findIndex(([a, b]) => frame >= a && frame <= b);
  return i < 0 ? 0 : i;
};

const BEAT_LABEL_TEXT: Record<number, string> = {
  0: "1879, Atacama Desert",
  3: "1878, Antofagasta",
  4: "February 1879, Antofagasta",
  6: "1879, Iquique",
  7: "1880, Tacna",
  8: "1883-1884",
};

/** Satu kata kunci BESAR per beat (aturan @tauugaksih): scene -> kata,
 *  local awal tampil, durasi (frame). S9 LOST tampil setelah peta
 *  tutup (local 170) dan sebelum foto muncul (local 257). */
const BEAT_WORDS: Record<number, { word: string; at: number; dur: number }> = {
  1: { word: "GUANO", at: 0, dur: 120 },
  3: { word: "TAX", at: 0, dur: 120 },
  5: { word: "WAR", at: 0, dur: 120 },
  6: { word: "SEA", at: 0, dur: 120 },
  8: { word: "LOST", at: 170, dur: 85 },
};

export const Video20: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = sceneFromFrame(frame);
  const [start] = SCENE_SPANS[scene];
  const local = frame - start;
  const showMap = frame >= MAP_A && frame < MAP_B;
  const showPhoto = frame >= PHOTO_A;
  const showLabel = !showMap && !showPhoto && local < 150;
  const label = BEAT_LABEL_TEXT[scene] ?? "";
  // KAMERA LOCKED-OFF (aturan kamera bill 28 Nov): hanya 2 push-in.
  // S1 hook: cepat 1 -> 1.18 dalam 60 frame; S7 laut: lambat 1 -> 1.08.
  const zoom =
    scene === 0
      ? interpolate(local, [0, 60], [1, 1.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) })
      : scene === 6
        ? interpolate(local, [0, 230], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) })
        : 1;
  const panX = 0;
  const panY = 0;

  const phrase = KARAOKE.find((p) => frame >= p.startFrame && frame <= p.endFrame);
  const bw = BEAT_WORDS[scene];
  const showBeatWord = !!bw && !showMap && !showPhoto && local >= bw.at && local < bw.at + bw.dur;

  const Current = SCENES[scene];
  return (
    <AbsoluteFill style={{ background: "#dcc49a" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: "50% 55%" }}>
        <World3D scene={scene} local={local} />
        {!showMap && !showPhoto && <Current local={local} />}
        {showMap && <MapOverlay local={local} />}
        {showPhoto && <PhotoFrame />}
      </div>
      {showLabel && label && <DateLabel text={label} />}
      {showBeatWord && bw && <BeatWord word={bw.word} local={local - bw.at} />}
      {phrase && <KaraokeText phrase={phrase.phrase} />}
      {scene === 8 && frame >= 1780 && (
        <div
          style={{
            position: "absolute",
            bottom: 170,
            left: 0,
            width: 1080,
            textAlign: "center",
            fontFamily: "Poppins, sans-serif",
            fontSize: 34,
            fontWeight: 800,
            color: "#ffffff",
            textShadow: OUTLINE,
            zIndex: 6,
          }}
        >
          Bolivia still has no sea.
        </div>
      )}
    </AbsoluteFill>
  );
};
