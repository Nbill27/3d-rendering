// "Video19": Operation Mincemeat, History Rush #11.
// "The Dead Body That Fooled Hitler"
// 9 adegan (L1 hook, L2, L3, L4, L5, L6, L7+L8 + peta, L9, L10 penutup),
// 3 beat: L1-5 (rencana London), L6-8 (penemuan + penipuan berhasil),
// L9-10 (invasi + twist). 2 lokasi: London + laut/peta Mediterania.
// KARAKTER: Ewen Montagu (kind "montagu", seragam laut biru gelap +
// emas), Charles Cholmondeley (kind "cholmondeley", RAF biru), nelayan
// Huelva (kind "fisherman", jaket cokelat + topi datar; hanya di S6
// sebagai figuran satu shot, digambar 3D di dunia), tentara Sekutu
// (kind "allied", khaki + helm, berjalan merapat di S8).
// MAYAT tidak pernah tampil sebagai karakter: S3 hanya seragam
// terhampar + kartu dicap, S6 hanya sosok kecil mengapung di laut (3D).
// BATAS KEJUJURAN: semua fakta dari RESEARCH.md; tidak ada adegan/
// dialog/quote karangan; nada hormat dan serius (bukan lelucon).
// TIDAK ADA karakter duduk di video ini (aturan duduk TIDAK BERLAKU).
// KAMERA (aturan kamera bill 28 Nov): LOCKED-OFF; hanya 2 push-in
// (cepat 1->1.18 di hook S1, lambat 1->1.08 di S5 briefcase);
// panX = 0, panY = 0.
// TIMING: karaoke.ts TERUKUR WhisperX Tahap 7, 28 Nov 2026.
// Teks karaoke Poppins ExtraBold putih outline hitam tebal, 46px,
// maxWidth 920, bottom 430 (spesifikasi Lustig v3 / Peshtigo / Wojtek).
// TOTAL_FRAMES = 1800.
import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { KARAOKE } from "./karaoke";
import { World3D } from "./world3d";
import { MAP_A, MAP_B, PHOTO_A, TOTAL_FRAMES } from "./story";

const INK = "#241726"; // plum ink, bean-head canon (v01/toon.ts)
const SKIN = "#ffe2c2";
const SKIN_SHADE = "#f0c09e";
const MOUTH_DARK = "#5a1e28";
const MONTAGU_NAVY = "#1f2a44"; // seragam laut Montagu (biru gelap + emas)
const RAF_BLUE = "#3a5a8a"; // seragam RAF Cholmondeley (biru)
const FISHER_BROWN = "#6a4a2e"; // jaket cokelat nelayan Huelva
const ALLIED_KHAKI = "#6a6a3a"; // khaki tentara Sekutu
const GERMAN_GREY = "#5a5a48"; // feldgrau perwira Jerman
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

type CharKind = "montagu" | "cholmondeley" | "fisherman" | "allied" | "german";
type CharPose = "stand" | "point" | "pointL" | "walk" | "worried" | "salute" | "wave" | "stop";
type Expr = "amazed" | "stern" | "worried" | "shock" | "star" | "smile" | "content" | "sad";

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
  speaking?: boolean;
}> = ({
  x,
  y,
  scale = 1,
  kind = "montagu",
  pose = "stand",
  expr = "smile",
  local = 0,
  speaking = false,
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
  const mouthOpen = 6 + Math.abs(Math.sin(local * 0.55)) * 5;
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
    if (speaking && (expr === "stern" || expr === "worried" || expr === "smile" || expr === "content")) {
      return <ellipse cx={MX} cy={MY} rx={10} ry={mouthOpen} fill={MOUTH_DARK} stroke={INK} strokeWidth={3} />;
    }
    switch (expr) {
      case "amazed":
        return <ellipse cx={MX + 4} cy={MY} rx={7} ry={8} fill={MOUTH_DARK} stroke={INK} strokeWidth={3} />;
      case "shock":
        return <ellipse cx={MX} cy={MY + 2} rx={15} ry={18} fill={MOUTH_DARK} stroke={INK} strokeWidth={4} />;
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
    kind === "montagu"
      ? MONTAGU_NAVY
      : kind === "cholmondeley"
        ? RAF_BLUE
        : kind === "fisherman"
          ? FISHER_BROWN
          : kind === "german"
            ? GERMAN_GREY
            : ALLIED_KHAKI;

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
        {/* montagu: ikat pinggang gelap + kancing emas + tanda pangkat emas */}
                {kind === "montagu" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#141c30" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <rect x={118} y={202} width={40} height={14} rx={4} fill="#ffd84a" stroke={INK} strokeWidth={3} />
            <rect x={202} y={202} width={40} height={14} rx={4} fill="#ffd84a" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* cholmondeley: ikat pinggang RAF + sayap RAF di dada */}
                {kind === "cholmondeley" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#2a4266" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <path d="M150,252 Q180,236 210,252 Q180,262 150,252 Z" fill="#e8e6da" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* fisherman: kancing kayu + saku dada */}
                {kind === "fisherman" && (
          <>
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#d8cba8" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#d8cba8" stroke={INK} strokeWidth={2.5} />
            <rect x={132} y={232} width={30} height={24} rx={4} fill="#5a3a22" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* allied: ikat pinggang khaki gelap + kancing */}
                {kind === "allied" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#4a4a26" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
          </>
        )}
        {/* german: ikat pinggang gelap + kancing + kerah tinggi */}
                {kind === "german" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#3a3a2e" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <rect x={118} y={202} width={40} height={14} rx={4} fill="#8a8a7a" stroke={INK} strokeWidth={3} />
            <rect x={202} y={202} width={40} height={14} rx={4} fill="#8a8a7a" stroke={INK} strokeWidth={3} />
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

        {/* montagu: topi puncak seragam laut + pita emas */}
                {kind === "montagu" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={MONTAGU_NAVY} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#141c30" stroke={INK} strokeWidth={4} />
            <line x1={96} y1={52} x2={264} y2={52} stroke="#ffd84a" strokeWidth={5} />
          </>
        )}
        {/* cholmondeley: topi puncak RAF biru */}
                {kind === "cholmondeley" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={RAF_BLUE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#2a4266" stroke={INK} strokeWidth={4} />
            <line x1={96} y1={52} x2={264} y2={52} stroke="#e8e6da" strokeWidth={5} />
          </>
        )}
        {/* fisherman: topi datar cokelat */}
                {kind === "fisherman" && (
          <>
            <path d="M92,58 C100,22 140,8 180,8 C220,8 260,22 268,58 L268,62 L92,62 Z" fill="#4a3220" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={60} rx={100} ry={8} fill="#4a3220" stroke={INK} strokeWidth={4} />
          </>
        )}
        {/* allied: helm baja khaki */}
                {kind === "allied" && (
          <>
            <path d="M88,66 C88,18 130,4 180,4 C230,4 272,18 272,66 L272,70 L88,70 Z" fill="#5a5a30" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={68} rx={100} ry={9} fill="#4a4a26" stroke={INK} strokeWidth={4} />
          </>
        )}
        {/* german: topi puncak feldgrau */}
                {kind === "german" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={GERMAN_GREY} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#3a3a2e" stroke={INK} strokeWidth={4} />
            <line x1={96} y1={52} x2={264} y2={52} stroke="#8a8a7a" strokeWidth={5} />
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
/* Prop 2D — semua dibangun dari kode (bukan GLB).                     */
/* Kartu identitas, koper, seragam terhampar, pocket litter, dan       */
/* lengan diborgol + surat. Acuan: anatomy fig2 (briefcase) dan        */
/* figur Hairline briefcase (tutup geser, surat naik lurus, rantai     */
/* berayun stagger).                                                   */
/* ------------------------------------------------------------------ */

/** Kartu identitas "WILLIAM MARTIN" — 380x220 (lebar supaya nama dan
 *  pangkat muat satu baris). */
const IdCard: React.FC<{ x: number; y: number; scale?: number; rot?: number }> = ({ x, y, scale = 1, rot = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 380, height: 220, transform: `scale(${scale}) rotate(${rot}deg)`, transformOrigin: "top left" }}>
    <svg width={380} height={220} viewBox="0 0 380 220">
      <rect x={4} y={4} width={372} height={212} rx={10} fill="#f2e8d0" stroke={INK} strokeWidth={5} />
      <rect x={4} y={4} width={372} height={40} rx={10} fill="#1f2a44" stroke={INK} strokeWidth={5} />
      <text x={190} y={33} fontSize={22} fontWeight={800} fill="#f5f2ea" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">ROYAL MARINES</text>
      <rect x={22} y={62} width={84} height={104} rx={6} fill="#c9bfa8" stroke={INK} strokeWidth={4} />
      <circle cx={64} cy={104} r={22} fill="#ffe2c2" stroke={INK} strokeWidth={3} />
      <path d="M40,166 C44,138 58,128 64,128 C70,128 84,138 88,166 Z" fill="#1f2a44" stroke={INK} strokeWidth={3} />
      <text x={126} y={92} fontSize={22} fontWeight={800} fill="#241726" fontFamily="Poppins, Arial, sans-serif">WILLIAM MARTIN</text>
      <text x={126} y={122} fontSize={18} fontWeight={700} fill="#5d4023" fontFamily="Poppins, Arial, sans-serif">CAPT. (ACTING MAJ.)</text>
      <text x={126} y={152} fontSize={18} fontWeight={700} fill="#5d4023" fontFamily="Poppins, Arial, sans-serif">No. 123456</text>
      <rect x={22} y={182} width={336} height={4} fill="#c9bfa8" />
    </svg>
  </div>
);

/** Briefcase kulit — 420x300: badan, tutup, 2 latch kuningan, pegangan. */
const BriefcaseProp: React.FC<{ x: number; y: number; scale?: number; open?: number }> = ({ x, y, scale = 1, open = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 420, height: 300, transform: `scale(${scale})`, transformOrigin: "top left" }}>
    <svg width={420} height={300} viewBox="0 0 420 300">
      {/* tutup bergeser ke kanan saat open (0 -> 40) */}
      <g transform={`translate(${open * 40} ${-open * 14})`}>
        <rect x={30} y={40} width={360} height={70} rx={12} fill="#6a4a2e" stroke={INK} strokeWidth={5} />
        <rect x={160} y={14} width={100} height={40} rx={14} fill="#5a3a22" stroke={INK} strokeWidth={5} />
      </g>
      {/* badan koper */}
      <rect x={30} y={100} width={360} height={160} rx={12} fill="#7a5a34" stroke={INK} strokeWidth={5} />
      <line x1={40} y1={120} x2={380} y2={120} stroke="#5a3a22" strokeWidth={4} strokeDasharray="8 6" />
      {/* 2 latch kuningan */}
      <rect x={120} y={92} width={34} height={40} rx={6} fill="#c9a83a" stroke={INK} strokeWidth={4} />
      <rect x={266} y={92} width={34} height={40} rx={6} fill="#c9a83a" stroke={INK} strokeWidth={4} />
      {/* surat naik dari dalam koper saat open */}
      <g opacity={open} transform={`translate(0 ${-open * 60})`}>
        <rect x={150} y={60} width={120} height={90} rx={4} fill="#f5f2ea" stroke={INK} strokeWidth={4} />
        <text x={210} y={105} fontSize={26} fontWeight={800} fill="#a02a22" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">GREECE</text>
        <line x1={165} y1={120} x2={255} y2={120} stroke="#8a7a5a" strokeWidth={3} />
        <line x1={165} y1={132} x2={255} y2={132} stroke="#8a7a5a" strokeWidth={3} />
      </g>
    </svg>
  </div>
);

/** Seragam Royal Marines terhampar (flat-lay) — 760x430: jaket, celana,
 *  topi, kancing, ikat pinggang. Stempel turun saat local 30-60. */
const UniformFlat: React.FC<{ x: number; y: number; scale?: number; local?: number }> = ({ x, y, scale = 1, local = 0 }) => {
  const stampY = interpolate(local, [30, 45, 60], [0, 46, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 760, height: 430, transform: `scale(${scale})`, transformOrigin: "top left" }}>
      <svg width={760} height={430} viewBox="0 0 760 430">
        {/* jaket: badan + 2 lengan terhampar */}
        <path d="M300,40 L460,40 L520,90 L500,340 L260,340 L240,90 Z" fill="#1f2a44" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M300,40 L240,90 L180,320 L240,340 L280,120 Z" fill="#1a2338" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M460,40 L520,90 L580,320 L520,340 L480,120 Z" fill="#1a2338" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* kerah + kancing emas + ikat pinggang */}
        <path d="M340,40 L380,80 L420,40 L420,60 L380,96 L340,60 Z" fill="#f5f2ea" stroke={INK} strokeWidth={4} />
        <circle cx={380} cy={140} r={7} fill="#ffd84a" stroke={INK} strokeWidth={3} />
        <circle cx={380} cy={200} r={7} fill="#ffd84a" stroke={INK} strokeWidth={3} />
        <circle cx={380} cy={260} r={7} fill="#ffd84a" stroke={INK} strokeWidth={3} />
        <rect x={268} y={300} width={224} height={22} rx={6} fill="#141c30" stroke={INK} strokeWidth={3} />
        {/* celana terhampar di bawah jaket */}
        <path d="M300,360 L460,360 L450,420 L390,420 L380,372 L370,420 L310,420 Z" fill="#2a2a2e" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* topi puncak di atas jaket (menempel di kerah, bukan di pojok) */}
        <path d="M330,48 C330,14 356,4 380,4 C404,4 430,14 430,48 L430,54 L330,54 Z" fill="#1f2a44" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <ellipse cx={380} cy={52} rx={54} ry={6} fill="#141c30" stroke={INK} strokeWidth={4} />
        {/* stempel yang turun ke kartu */}
        <g transform={`translate(0 ${stampY})`}>
          <rect x={40} y={120} width={120} height={60} rx={8} fill="#8a2a22" stroke={INK} strokeWidth={4} />
          <rect x={80} y={90} width={40} height={34} rx={6} fill="#5a1e18" stroke={INK} strokeWidth={4} />
          <text x={100} y={158} fontSize={20} fontWeight={800} fill="#f5f2ea" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">STAMP</text>
        </g>
      </svg>
    </div>
  );
};

/** Pocket litter — foto tunangan, kartu identitas, kuitansi (S4).
 *  Masuk satu per satu: foto f0, kartu f25, kuitansi f50 (local). */
const PocketLitter: React.FC<{ x: number; y: number; local?: number }> = ({ x, y, local = 0 }) => {
  const o1 = interpolate(local, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o2 = interpolate(local, [25, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o3 = interpolate(local, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 1000, height: 420 }}>
      {/* foto tunangan */}
      <div style={{ position: "absolute", left: 0, top: 0, opacity: o1, transform: "rotate(-3deg)" }}>
        <svg width={300} height={380} viewBox="0 0 300 380">
          <rect x={6} y={6} width={288} height={368} rx={8} fill="#f5f2ea" stroke={INK} strokeWidth={5} />
          <rect x={26} y={26} width={248} height={280} fill="#8a9a6a" stroke={INK} strokeWidth={4} />
          <circle cx={150} cy={140} r={52} fill="#ffe2c2" stroke={INK} strokeWidth={4} />
          <path d="M150,88 C110,88 96,118 96,148 C96,158 104,164 112,160 C108,120 124,104 150,104 C176,104 192,120 188,160 C196,164 204,158 204,148 C204,118 190,88 150,88 Z" fill="#5a3a22" stroke={INK} strokeWidth={3} />
          <path d="M92,306 C100,240 122,210 150,210 C178,210 200,240 208,306 Z" fill="#a02a22" stroke={INK} strokeWidth={4} />
          <text x={150} y={348} fontSize={24} fontWeight={700} fill="#5d4023" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">Pam</text>
        </svg>
      </div>
      {/* kartu identitas */}
      <div style={{ position: "absolute", left: 350, top: 40, opacity: o2, transform: "rotate(2deg)" }}>
        <IdCard x={0} y={0} scale={0.9} />
      </div>
      {/* kuitansi: cincin tunangan + tagihan penjahit */}
      <div style={{ position: "absolute", left: 700, top: 0, opacity: o3, transform: "rotate(-2deg)" }}>
        <svg width={280} height={380} viewBox="0 0 280 380">
          <rect x={6} y={6} width={268} height={368} rx={6} fill="#f5f2ea" stroke={INK} strokeWidth={5} />
          <text x={140} y={56} fontSize={24} fontWeight={800} fill="#241726" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">RECEIPT</text>
          <line x1={30} y1={76} x2={250} y2={76} stroke={INK} strokeWidth={3} />
          <circle cx={140} cy={150} r={34} fill="none" stroke="#c9a83a" strokeWidth={10} />
          <circle cx={140} cy={116} r={12} fill="#cfe3f2" stroke={INK} strokeWidth={3} />
          <text x={140} y={220} fontSize={22} fontWeight={700} fill="#5d4023" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">Engagement ring</text>
          <text x={140} y={252} fontSize={22} fontWeight={700} fill="#5d4023" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">Tailor's bill</text>
          <text x={140} y={284} fontSize={22} fontWeight={700} fill="#5d4023" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">Theatre ticket</text>
          <line x1={30} y1={310} x2={250} y2={310} stroke={INK} strokeWidth={3} />
          <text x={140} y={348} fontSize={24} fontWeight={800} fill="#a02a22" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">PAID</text>
        </svg>
      </div>
    </div>
  );
};

/** Lengan berseragam diborgol ke koper + surat naik (S5).
 *  Surat naik 0 -> 60 px selama local 20-80 (dari figur Hairline). */
const HandcuffedArm: React.FC<{ x: number; y: number; local?: number }> = ({ x, y, local = 0 }) => {
  const rise = interpolate(local, [20, 80], [0, 50], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const swing = Math.sin(local * 0.08) * 4;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 1000, height: 500 }}>
      <svg width={1000} height={500} viewBox="0 0 1000 500">
        {/* lengan berseragam dari kiri: meruncing dari bahu (di luar frame,
            ~118 px) ke pergelangan (~76 px), supaya terbaca sebagai lengan,
            bukan balok persegi panjang */}
        <path d="M-40,190 Q180,198 395,212 L395,288 Q180,296 -40,308 Z" fill="#1f2a44" stroke={INK} strokeWidth={5} />
        {/* sorot atas + bayang bawah mengikuti runcingan lengan */}
        <path d="M-40,198 Q180,206 388,219" fill="none" stroke="#2e4266" strokeWidth={7} strokeLinecap="round" />
        <path d="M-40,298 Q180,288 388,280" fill="none" stroke="#141c30" strokeWidth={10} strokeLinecap="round" opacity={0.45} />
        {/* manset di pergelangan: sedikit lebih lebar dari pergelangan, trim emas di tepi kiri */}
        <rect x={382} y={204} width={56} height={92} rx={8} fill="#141c30" stroke={INK} strokeWidth={4} />
        <line x1={390} y1={212} x2={390} y2={288} stroke="#ffd84a" strokeWidth={4} />
        {/* borgol logam di pergelangan, melingkari manset */}
        <circle cx={425} cy={250} r={38} fill="none" stroke="#3a3a3a" strokeWidth={13} />
        <circle cx={425} cy={250} r={38} fill="none" stroke="#8a8a8a" strokeWidth={4} />
        {/* kepalan tangan di depan borgol (digambar setelah borgol supaya
            menutupi sisi kanan cincin): persegi membulat + garis jari */}
        <rect x={438} y={208} width={78} height={84} rx={22} fill="#ffe2c2" stroke={INK} strokeWidth={5} />
        <line x1={464} y1={222} x2={464} y2={278} stroke="#d8a878" strokeWidth={4} />
        <line x1={482} y1={222} x2={482} y2={278} stroke="#d8a878" strokeWidth={4} />
        <line x1={500} y1={222} x2={500} y2={278} stroke="#d8a878" strokeWidth={4} />
        {/* rantai borgol: 3 mata ke koper, berayun stagger */}
        <g transform={`translate(${swing} 0)`}>
          <circle cx={530} cy={280} r={18} fill="none" stroke="#3a3a3a" strokeWidth={8} />
          <circle cx={580} cy={306} r={18} fill="none" stroke="#3a3a3a" strokeWidth={8} />
          <circle cx={628} cy={330} r={18} fill="none" stroke="#3a3a3a" strokeWidth={8} />
        </g>
        {/* koper di kanan */}
        <rect x={660} y={200} width={300} height={220} rx={14} fill="#7a5a34" stroke={INK} strokeWidth={5} />
        <rect x={660} y={200} width={300} height={60} rx={14} fill="#6a4a2e" stroke={INK} strokeWidth={5} />
        <rect x={770} y={180} width={80} height={36} rx={12} fill="#5a3a22" stroke={INK} strokeWidth={5} />
        <rect x={730} y={252} width={30} height={36} rx={6} fill="#c9a83a" stroke={INK} strokeWidth={4} />
        <rect x={860} y={252} width={30} height={36} rx={6} fill="#c9a83a" stroke={INK} strokeWidth={4} />
        {/* surat naik dari koper (ujung bawahnya tetap menempel di koper) */}
        <g transform={`translate(0 ${-rise})`} opacity={rise > 0 ? 1 : 0}>
          <rect x={730} y={140} width={160} height={120} rx={4} fill="#f5f2ea" stroke={INK} strokeWidth={4} />
          <text x={810} y={190} fontSize={34} fontWeight={800} fill="#a02a22" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif">GREECE</text>
          <line x1={750} y1={210} x2={870} y2={210} stroke="#8a7a5a" strokeWidth={3} />
          <line x1={750} y1={228} x2={870} y2={228} stroke="#8a7a5a" strokeWidth={3} />
        </g>
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

/** Label pil kecil di tengah adegan (kata-kata dari VO). */
const PillLabel: React.FC<{ text: string; top: number }> = ({ text, top }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 40, lineHeight: 1.15, color: "#ffd23a", textShadow: OUTLINE, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 18, padding: "12px 26px", textAlign: "center" }}>
      {text}
    </div>
  </div>
);

/** Shot peta (S7, f1140-1260): Mediterania 1943 — Spanyol, Italia,
 *  Sisilia, Sardinia, Yunani, Balkan. Panah divisi Jerman bergerak dari
 *  Sisilia ke Yunani (1 divisi panzer) dan ke Balkan (10 divisi).
 *  Sketsa kartun dari kode (bukan peta geografis presisi). Panah digambar
 *  bertahap selama jendela peta (local = frame - MAP_A). Bawah 500 px
 *  polos supaya caption terbaca. */
const MapOverlay: React.FC<{ local?: number }> = ({ local = 0 }) => {
  const p1 = interpolate(local, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p2 = interpolate(local, [20, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const labO = interpolate(local, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
  <div style={{ position: "absolute", left: 60, right: 60, top: 180, bottom: 700, backgroundColor: "#f2e8d0", borderRadius: 24, border: "6px solid #5d4023", boxShadow: "0 12px 32px rgba(0,0,0,0.55)", overflow: "hidden" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 46, color: "#2a2018", textAlign: "center", paddingTop: 26 }}>
      THE MEDITERRANEAN, 1943
    </div>
    <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, color: "#5d4023", textAlign: "center", paddingTop: 6 }}>
      Hitler moved his armies to the wrong place.
    </div>
    <svg viewBox="0 0 960 860" style={{ width: "100%", height: "76%" }}>
      {/* laut Mediterania */}
      <rect x={0} y={0} width={960} height={860} fill="#7ab8d9" />
      {/* Afrika Utara (bawah) */}
      <path d="M0,700 L960,700 L960,860 L0,860 Z" fill="#d8cba8" stroke="#5d4023" strokeWidth={4} />
      {/* Spanyol (kiri atas) */}
      <path d="M60,120 L300,100 L340,220 L260,320 L120,300 L60,200 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
      <text x={180} y={210} fontSize={34} fontWeight={800} fill="#241726" textAnchor="middle">SPAIN</text>
      {/* Italia (tengah atas) */}
      <path d="M470,110 L560,120 L540,220 L560,300 L520,330 L500,300 L480,220 L460,150 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
      <text x={510} y={190} fontSize={30} fontWeight={800} fill="#241726" textAnchor="middle">ITALY</text>
      {/* Sardinia */}
      <path d="M370,280 L410,275 L415,320 L375,325 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={4} />
      <text x={392} y={360} fontSize={24} fontWeight={800} fill="#241726" textAnchor="middle">SARDINIA</text>
      {/* Sisilia */}
      <path d="M440,390 L520,385 L530,410 L450,415 Z" fill="#e8a06a" stroke="#5d4023" strokeWidth={5} />
      <text x={485} y={450} fontSize={30} fontWeight={800} fill="#241726" textAnchor="middle">SICILY</text>
      {/* Balkan (kanan atas) */}
      <path d="M660,180 L820,160 L840,260 L700,280 L660,240 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
      <text x={750} y={225} fontSize={30} fontWeight={800} fill="#241726" textAnchor="middle">BALKANS</text>
      {/* Yunani (kanan) */}
      <path d="M700,300 L820,280 L860,360 L800,440 L720,420 L690,350 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
      <text x={775} y={370} fontSize={30} fontWeight={800} fill="#241726" textAnchor="middle">GREECE</text>
      {/* Huelva — mayat ditemukan */}
      <circle cx={140} cy={300} r={20} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={140} y={340} fontSize={26} fontWeight={800} fill="#241726" textAnchor="middle">HUELVA</text>
      <text x={140} y={368} fontSize={22} fontWeight={700} fill="#c23a12" textAnchor="middle">BODY FOUND</text>
      {/* panah 1: Sisilia -> Yunani (1 divisi panzer) */}
      <path d="M500,395 C590,360 640,360 700,360" fill="none" stroke="#a02a22" strokeWidth={9} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - p1 * 100} />
      <polygon points="700,360 676,344 676,376" fill="#a02a22" opacity={p1 >= 1 ? 1 : 0} />
      {/* panah 2: Italia -> Balkan (10 divisi) */}
      <path d="M530,290 C590,255 630,240 672,230" fill="none" stroke="#5a1e18" strokeWidth={9} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - p2 * 100} />
      <polygon points="672,230 648,218 654,244" fill="#5a1e18" opacity={p2 >= 1 ? 1 : 0} />
      {/* label panah */}
      <g opacity={labO}>
        <text x={620} y={330} fontSize={28} fontWeight={800} fill="#a02a22" textAnchor="middle">1 PANZER DIVISION</text>
        <text x={620} y={300} fontSize={28} fontWeight={800} fill="#a02a22" textAnchor="middle">TO GREECE</text>
        <text x={700} y={140} fontSize={24} fontWeight={800} fill="#5a1e18" textAnchor="middle">10 DIVISIONS</text>
        <text x={700} y={168} fontSize={24} fontWeight={800} fill="#5a1e18" textAnchor="middle">TO BALKANS</text>
      </g>
      {/* kompas */}
      <g transform="translate(880 120)">
        <circle r={34} fill="#f2e6c4" stroke="#8a7a5a" strokeWidth={4} />
        <path d="M0,-24 L8,10 L0,4 L-8,10 Z" fill="#c0353a" />
        <text y={-40} textAnchor="middle" fontSize={28} fontWeight={800} fill="#2a2018">N</text>
      </g>
      <text x={480} y={845} textAnchor="middle" fontSize={26} fontWeight={700} fill="#5d4023">Not to scale</text>
    </svg>
  </div>
  );
};

/** Frame foto asli domain publik (f1700-1800): Charles Cholmondeley dan
 *  Ewen Montagu, 1943, di depan kendaraan yang mengangkut jenazah
 *  Glyndwr Michael, 17 April 1943. Fotografer St. John "Jock" Horsfall,
 *  sumber The Times. Domain publik (karya pemerintah Inggris, foto
 *  sebelum 1 Juni 1957, Crown copyright kedaluwarsa) — Wikimedia
 *  Commons, File:Charles_Cholmondeley_and_Ewen_Montagu.jpg.
 *  File: public/mincemeat-1943.jpg (931x620). */
const PhotoFrame: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ backgroundColor: "#f5f2ea", padding: 18, borderRadius: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.6)", transform: "rotate(-1.5deg)" }}>
      <img src={staticFile("mincemeat-1943.jpg")} alt="Charles Cholmondeley and Ewen Montagu, 1943" style={{ width: 760, height: 506, objectFit: "cover", display: "block" }} />
      <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1.25, color: "#2a2018", textAlign: "center", paddingTop: 14 }}>
        Charles Cholmondeley and Ewen Montagu, 1943
        <br />
        Photo: public domain (Wikimedia Commons)
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SCENES — 9 adegan (satu per baris VO), hard cut. Tiap Scene HANYA   */
/* overlay karakter 2D + prop 2D + bayangan kontak; latarnya dunia 3D  */
/* dari world3d.tsx. Kaki menapak: BeanHead y + 500*scale.             */
/* S6 dan S9 tidak punya overlay 2D (semua 3D / foto).                 */
/* ------------------------------------------------------------------ */

const Scene1: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* Kantor gelap London: koper + kartu identitas di atas meja.
        y dinaikkan supaya tidak tabrakan dengan caption (bottom 430). */}
    <BriefcaseProp x={280} y={1020} scale={1.0} open={0} />
    <IdCard x={600} y={980} scale={0.85} rot={-6} />
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* Montagu menunjuk peta di meja, Cholmondeley berdiri di kanan. */}
    <ContactShadow x={80} y={680} scale={1.35} />
    <BeanHead x={80} y={680} scale={1.35} kind="montagu" pose="point" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={700} y={700} scale={1.1} />
    <BeanHead x={700} y={700} scale={1.1} kind="cholmondeley" pose="stand" expr="stern" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* Seragam Royal Marines terhampar + kartu identitas dicap.
        Hormat: tidak ada wajah mayat, hanya seragam dan kartu. */}
    <UniformFlat x={140} y={900} scale={1.0} local={local} />
    <IdCard x={700} y={1180} scale={0.9} rot={4} />
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* Pocket litter masuk satu per satu: foto, kartu, kuitansi. */}
    <PocketLitter x={40} y={1000} local={local} />
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* Lengan berseragam diborgol ke koper; surat "GREECE" naik. */}
    <HandcuffedArm x={40} y={950} local={local} />
  </AbsoluteFill>
);

const Scene6: React.FC<{ local: number; speaking: boolean }> = () => (
  <AbsoluteFill>
    {/* Semua 3D: HMS Seraph + sosok mengapung + nelayan di perahu. */}
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* Perwira Jerman membaca surat-surat itu (di luar jendela peta). */}
    <ContactShadow x={360} y={640} scale={1.4} />
    <BeanHead x={360} y={640} scale={1.4} kind="german" pose="stand" expr="amazed" speaking={speaking} local={local} />
    <PillLabel text="HITLER BELIEVED EVERY WORD" top={470} />
  </AbsoluteFill>
);

const Scene8: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => {
  // Tentara Sekutu BERJALAN KE DEPAN (ke arah kamera): pose "walk"
  // (kaki kanan lalu kiri bergantian mengangkat ke atas) + y dan scale
  // naik terhadap local. S8 = L9 terukur, frame global 1293-1537,
  // local 0..244. x tetap. ContactShadow ikut y dan scale yang sama.
  const yB = interpolate(local, [0, 244], [540, 630]);
  const sB = interpolate(local, [0, 244], [1.55, 1.65]);
  const yL = interpolate(local, [0, 244], [680, 800]);
  const sL = interpolate(local, [0, 244], [1.3, 1.42]);
  const yR = interpolate(local, [0, 244], [700, 820]);
  const sR = interpolate(local, [0, 244], [1.25, 1.35]);
  return (
    <AbsoluteFill>
      <ContactShadow x={0} y={yL} scale={sL} />
      <BeanHead x={0} y={yL} scale={sL} kind="allied" pose="walk" expr="stern" speaking={speaking} local={local} />
      <ContactShadow x={340} y={yB} scale={sB} />
      <BeanHead x={340} y={yB} scale={sB} kind="allied" pose="walk" expr="stern" speaking={speaking} local={local} />
      <ContactShadow x={700} y={yR} scale={sR} />
      <BeanHead x={700} y={yR} scale={sR} kind="allied" pose="walk" expr="stern" speaking={speaking} local={local} />
    </AbsoluteFill>
  );
};

const Scene9: React.FC<{ local: number; speaking: boolean }> = () => (
  <AbsoluteFill>
    {/* Senja Huelva, hening (semua 3D); foto asli f1700-1800. */}
  </AbsoluteFill>
);

const SCENES: React.FC<{ local: number; speaking: boolean }>[] = [
  Scene1, Scene2, Scene3, Scene4, Scene5,
  Scene6, Scene7, Scene8, Scene9,
];

/* [startFrame, endFrame] per scene, from karaoke.ts (WhisperX-measured). */
const SCENE_SPANS: [number, number][] = [
  [0, 130], [131, 251], [252, 408], [409, 576], [577, 820],
  [821, 958], [959, 1292], [1293, 1537], [1538, 1800],
];

const sceneFromFrame = (frame: number): number => {
  if (frame <= 130) return 0;
  if (frame <= 251) return 1;
  if (frame <= 408) return 2;
  if (frame <= 576) return 3;
  if (frame <= 820) return 4;
  if (frame <= 958) return 5;
  if (frame <= 1292) return 6;
  if (frame <= 1537) return 7;
  return 8;
};

const BEAT_LABEL_TEXT: Record<number, string> = {
  0: "1943, London",
  1: "1943, London",
  2: "1943, London",
  5: "30 April 1943, Huelva, Spain",
  7: "9 July 1943, Sicily",
};

export const Video19: React.FC = () => {
  const frame = useCurrentFrame();
  const phrase = KARAOKE.find((p) => frame >= p.startFrame && frame < p.endFrame);
  const scene = sceneFromFrame(frame);
  const [sStart, sEnd] = SCENE_SPANS[scene];
  const local = Math.max(0, Math.min(frame - sStart, sEnd - sStart));
  const len = Math.max(1, sEnd - sStart);
  // KAMERA (aturan kamera bill 28 Nov): LOCKED-OFF. Hanya 2 push-in:
  // S1 hook cepat 1 -> 1.18 dalam 60 frame pertama, lalu tahan; S5
  // lambat 1 -> 1.08 sepanjang adegan (objek kunci: briefcase).
  // Adegan lain zoom = 1. panX = 0, panY = 0 (tidak ada geser).
  const zoom =
    scene === 0
      ? interpolate(local, [0, 60], [1, 1.18], { easing: Easing.out(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : scene === 4
        ? interpolate(local, [0, len], [1, 1.08], { easing: Easing.inOut(Easing.sin) })
        : 1;
  const Scene = SCENES[scene];
  const beatLabel = BEAT_LABEL_TEXT[scene];
  const showMap = frame >= MAP_A && frame < MAP_B;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})` }}>
        <World3D scene={scene} local={local} />
        {!showMap && frame < PHOTO_A && <Scene local={local} speaking={!!phrase} />}
      </div>
      {showMap && <MapOverlay local={frame - MAP_A} />}
      {beatLabel && local < 150 && !showMap && <DateLabel text={beatLabel} />}
      {frame >= PHOTO_A && <PhotoFrame />}
      {phrase && <KaraokeText phrase={phrase.phrase} />}
    </AbsoluteFill>
  );
};

export const VIDEO19_FRAMES = TOTAL_FRAMES;
