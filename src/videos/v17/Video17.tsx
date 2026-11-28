// "Video17": Pig War, History Rush #9.
// "A Pig Almost Started a War Between America and Britain."
// 9 adegan (satu per baris VO), 3 beat: L1-4 (kebun 1859, lucu),
// L5-7 (eskalasi + laksamana menolak, unik), L8-9 (okupasi bersama
// 12 tahun + arbitrase 1872, twist). KARAKTER: Lyman Cutlar (kind
// "farmer", topi jerami + kemeja kotak merah), Charles Griffin (kind
// "british", topi datar + jaket cokelat), Kapten George Pickett (kind
// "officer", seragam biru + kepi), tentara AS (kind "soldier", biru),
// tentara Inggris (kind "redcoat", mantel merah + shako), Laksamana
// Baynes (kind "admiral", janggut putih + bicorne). BABI: komponen Pig
// (Berkshire hitam, dari kode — moncong mengorek, ekor keriting,
// pose "lie" di S4 tanpa darah).
// BATAS KEJUJURAN: semua fakta dari RESEARCH.md (NPS, Canadian
// Encyclopedia, HistoryLink, Smithsonian); tidak ada tembakan antar
// manusia di video ini (tidak pernah terjadi); tidak ada dialog/quote
// karangan; angka 64 orang Pickett pakai versi NPS (Canadian
// Encyclopedia bilang 66 — dicatat di RESEARCH.md, tidak dipakai).
// TIDAK ADA karakter duduk di video ini (aturan duduk TIDAK BERLAKU).
// KAMERA (aturan kamera bill 28 Nov): LOCKED-OFF; hanya 2 push-in
// (cepat 1->1.3 di hook S1, lambat 1->1.08 di S6); panX = 0, panY = 0.
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
const US_BLUE = "#2e3a5a"; // seragam tentara AS 1859 (biru gelap)
const US_BLUE_DARK = "#232c46";
const REDCOAT = "#a02a22"; // mantel merah tentara Inggris
const REDCOAT_DARK = "#7c1e18";
const NAVY = "#1e2a4a"; // laksamana Inggris
const FARMER_RED = "#a83a2e"; // kemeja kotak Cutlar
const BRITISH_BROWN = "#6a4a2e"; // jaket Griffin
const TROUSER = "#4a3826";
const TROUSER_DARK = "#33261a";
const BOOT = "#3a2a1a";
const SWEAT = "#9fd4ff";
const STRAW = "#d9b45a";
const PIG_BLACK = "#211a17";
const PIG_SNOUT = "#e8a0a0";

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

type CharKind = "farmer" | "british" | "officer" | "soldier" | "redcoat" | "admiral";
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
  kind = "soldier",
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
  const moustache = kind === "british" || kind === "farmer";

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
    kind === "farmer"
      ? FARMER_RED
      : kind === "british"
        ? BRITISH_BROWN
        : kind === "redcoat"
          ? REDCOAT
          : kind === "admiral"
            ? NAVY
            : US_BLUE;

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
        {/* seragam AS / perwira: ikat pinggang + kancing + saku dada */}
        {(kind === "soldier" || kind === "officer") && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill={US_BLUE_DARK} stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <rect x={132} y={216} width={34} height={26} rx={4} fill={US_BLUE_DARK} stroke={INK} strokeWidth={3} />
            <rect x={194} y={216} width={34} height={26} rx={4} fill={US_BLUE_DARK} stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* perwira: tanda pangkat emas di bahu */}
        {kind === "officer" && (
          <>
            <rect x={118} y={202} width={40} height={14} rx={4} fill="#ffd84a" stroke={INK} strokeWidth={3} />
            <rect x={202} y={202} width={40} height={14} rx={4} fill="#ffd84a" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* redcoat: sabuk silang putih di dada */}
        {kind === "redcoat" && (
          <>
            <line x1={132} y1={216} x2={228} y2={352} stroke="#f5f2ea" strokeWidth={12} />
            <line x1={228} y1={216} x2={132} y2={352} stroke="#f5f2ea" strokeWidth={12} />
            <rect x={122} y={352} width={116} height={16} rx={5} fill={REDCOAT_DARK} stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
          </>
        )}
        {/* laksamana: kancing emas + tali bahu emas */}
        {kind === "admiral" && (
          <>
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <rect x={118} y={202} width={40} height={14} rx={4} fill="#ffd84a" stroke={INK} strokeWidth={3} />
            <rect x={202} y={202} width={40} height={14} rx={4} fill="#ffd84a" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* petani: garis kotak-kotak kemeja */}
        {kind === "farmer" && (
          <g clipPath={`url(#body-${uid})`}>
            <line x1={150} y1={200} x2={150} y2={386} stroke="#7c241a" strokeWidth={5} opacity={0.7} />
            <line x1={210} y1={200} x2={210} y2={386} stroke="#7c241a" strokeWidth={5} opacity={0.7} />
            <line x1={115} y1={260} x2={245} y2={260} stroke="#7c241a" strokeWidth={5} opacity={0.7} />
            <line x1={115} y1={320} x2={245} y2={320} stroke="#7c241a" strokeWidth={5} opacity={0.7} />
          </g>
        )}
        {/* manajer farm Inggris: kerah + kancing jaket */}
        {kind === "british" && (
          <>
            <path d="M168,200 L180,224 L192,200 L192,196 L168,196 Z" fill="#f5f2ea" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <line x1={180} y1={224} x2={180} y2={360} stroke={INK} strokeWidth={3} opacity={0.4} />
          </>
        )}
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

        {/* petani: topi jerami lebar */}
        {kind === "farmer" && (
          <>
            <ellipse cx={180} cy={52} rx={112} ry={14} fill={STRAW} stroke={INK} strokeWidth={4} />
            <path d="M104,52 C104,4 140,-6 180,-6 C220,-6 256,4 256,52 L256,54 L104,54 Z" fill={STRAW} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <line x1={104} y1={40} x2={256} y2={40} stroke="#8a6a2a" strokeWidth={5} />
          </>
        )}
        {/* manajer Inggris: topi datar */}
        {kind === "british" && (
          <>
            <path d="M92,66 C92,22 132,4 180,4 C228,4 268,22 268,66 L268,70 L92,70 Z" fill={BRITISH_BROWN} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={68} rx={100} ry={8} fill={BRITISH_BROWN} stroke={INK} strokeWidth={4} />
          </>
        )}
        {/* tentara / perwira AS: kepi biru */}
        {(kind === "soldier" || kind === "officer") && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={US_BLUE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill={US_BLUE_DARK} stroke={INK} strokeWidth={4} />
            {kind === "officer" && <line x1={96} y1={52} x2={264} y2={52} stroke="#ffd84a" strokeWidth={5} />}
          </>
        )}
        {/* redcoat: shako hitam tinggi */}
        {kind === "redcoat" && (
          <>
            <path d="M104,70 L112,-2 L248,-2 L256,70 Z" fill="#1e1a18" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={70} rx={80} ry={8} fill="#1e1a18" stroke={INK} strokeWidth={4} />
            <circle cx={180} cy={14} r={8} fill="#ffd84a" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* laksamana: bicorne + janggut putih */}
        {kind === "admiral" && (
          <>
            <path d="M84,58 C84,18 128,2 180,2 C232,2 276,18 276,58 L276,62 L84,62 Z" fill={NAVY} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={60} rx={104} ry={10} fill={NAVY} stroke={INK} strokeWidth={4} />
            <circle cx={180} cy={12} r={6} fill="#ffd84a" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* wajah */}
        {brows()}
        {eyes()}
        {moustache && (
          <>
            <path d="M180,136 L150,148" stroke="#4a3020" strokeWidth={9} strokeLinecap="round" />
            <path d="M180,136 L210,148" stroke="#4a3020" strokeWidth={9} strokeLinecap="round" />
          </>
        )}
        {/* laksamana: janggut putih di DAGU saja (di bawah mulut y=152),
            bukan menutupi seluruh wajah bawah */}
        {kind === "admiral" && (
          <path d="M140,158 C142,196 158,208 180,208 C202,208 218,196 220,158 C208,178 196,182 180,182 C164,182 152,178 140,158 Z" fill="#f5f2ea" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        )}
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
 *  foot = offset kaki dalam kotak komponen (BeanHead 500, Pig 280). */
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
/* Babi Berkshire — SVG dari kode (bukan GLB, bukan gambar), acuan     */
/* anatomy fig1-pig.html: badan hitam, moncong + kaki putih (ciri      */
/* Berkshire), ekor keriting, telinga jatuh. Kotak 360 x 300, kaki     */
/* menapak y=280. Pose "root": kepala menunduk + moncong menggali      */
/* (naik-turun sinus pelan, bukan goyang lateral); "stand": kepala     */
/* tegak + ekor bergoyang pelan; "lie": terbaring di sisi (S4, tanpa   */
/* darah — babi ditembak, divisualkan diam terbaring, bukan grafis).   */
/* ------------------------------------------------------------------ */

type PigPose = "root" | "stand" | "lie";

const Pig: React.FC<{ x: number; y: number; scale?: number; pose?: PigPose; local?: number }> = ({ x, y, scale = 1, pose = "root", local = 0 }) => {
  const dig = pose === "root" ? Math.abs(Math.sin(local * 0.35)) * 10 : 0;
  const wag = Math.sin(local * 0.3) * 8;
  const paw = pose === "root" ? Math.abs(Math.sin(local * 0.35 + 1.2)) * 8 : 0;
  if (pose === "lie") {
    return (
      <div style={{ position: "absolute", left: x, top: y, width: 360, height: 300, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <svg width={360} height={300} viewBox="0 0 360 300">
          {/* badan terbaring: elips horizontal di tanah */}
          <ellipse cx={185} cy={238} rx={118} ry={48} fill={PIG_BLACK} stroke={INK} strokeWidth={6} />
          {/* kaki terlipat ke depan, diam */}
          <line x1={110} y1={252} x2={70} y2={272} stroke={PIG_BLACK} strokeWidth={13} strokeLinecap="round" />
          <line x1={130} y1={258} x2={96} y2={278} stroke={PIG_BLACK} strokeWidth={13} strokeLinecap="round" />
          <line x1={250} y1={252} x2={292} y2={270} stroke={PIG_BLACK} strokeWidth={13} strokeLinecap="round" />
          <line x1={232} y1={258} x2={268} y2={278} stroke={PIG_BLACK} strokeWidth={13} strokeLinecap="round" />
          {/* kepala rebah di tanah, mata tertutup */}
          <circle cx={78} cy={232} r={44} fill={PIG_BLACK} stroke={INK} strokeWidth={6} />
          <ellipse cx={42} cy={240} rx={18} ry={13} fill={PIG_SNOUT} stroke={INK} strokeWidth={4} />
          <line x1={66} y1={222} x2={88} y2={222} stroke="#f5f2ea" strokeWidth={5} strokeLinecap="round" />
          <path d="M78,192 Q66,172 52,168" fill="none" stroke={PIG_BLACK} strokeWidth={12} strokeLinecap="round" />
          {/* ekor keriting lemas di tanah */}
          <path d="M296,232 q22,-6 16,10 q-4,12 -14,8" fill="none" stroke={PIG_BLACK} strokeWidth={9} strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  const headDown = pose === "root";
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 360, height: 300, transform: `scale(${scale})`, transformOrigin: "top left" }}>
      <svg width={360} height={300} viewBox="0 0 360 300">
        {/* ekor keriting (bergoyang pelan) */}
        <g transform={`rotate(${wag} 300 130)`}>
          <path d="M296,132 q26,-10 22,12 q-3,18 -18,14 q-10,-3 -6,-12" fill="none" stroke={PIG_BLACK} strokeWidth={10} strokeLinecap="round" />
        </g>
        {/* kaki belakang + depan (putih di ujung = ciri Berkshire);
            kaki depan kanan mengais tanah saat mengorek */}
        <g transform={`translate(0 ${-paw})`}>
          <line x1={120} y1={200} x2={118} y2={272} stroke={PIG_BLACK} strokeWidth={15} strokeLinecap="round" />
          <rect x={106} y={262} width={26} height={16} rx={5} fill="#f5f2ea" stroke={INK} strokeWidth={3} />
        </g>
        <line x1={150} y1={200} x2={150} y2={272} stroke={PIG_BLACK} strokeWidth={15} strokeLinecap="round" />
        <rect x={138} y={262} width={26} height={16} rx={5} fill="#f5f2ea" stroke={INK} strokeWidth={3} />
        <line x1={240} y1={200} x2={242} y2={272} stroke={PIG_BLACK} strokeWidth={15} strokeLinecap="round" />
        <rect x={230} y={262} width={26} height={16} rx={5} fill="#f5f2ea" stroke={INK} strokeWidth={3} />
        <line x1={268} y1={200} x2={270} y2={272} stroke={PIG_BLACK} strokeWidth={15} strokeLinecap="round" />
        <rect x={258} y={262} width={26} height={16} rx={5} fill="#f5f2ea" stroke={INK} strokeWidth={3} />
        {/* badan: elips besar hitam */}
        <ellipse cx={195} cy={168} rx={122} ry={76} fill={PIG_BLACK} stroke={INK} strokeWidth={6} />
        <ellipse cx={195} cy={150} rx={90} ry={48} fill="#2e2521" opacity={0.8} />
        {/* kepala: menunduk saat mengorek, tegak saat berdiri */}
        <g transform={headDown ? `translate(0 ${dig}) rotate(28 95 150)` : "rotate(-6 95 150)"}>
          <circle cx={92} cy={148} r={52} fill={PIG_BLACK} stroke={INK} strokeWidth={6} />
          {/* telinga jatuh */}
          <path d="M88,100 Q70,76 52,82 Q66,102 84,112 Z" fill={PIG_BLACK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M112,100 Q126,74 144,80 Q132,102 114,112 Z" fill={PIG_BLACK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {/* mata */}
          <circle cx={86} cy={140} r={6} fill="#f5f2ea" stroke={INK} strokeWidth={3} />
          {/* moncong merah muda + 2 lubang hidung */}
          <ellipse cx={46} cy={166} rx={24} ry={17} fill={PIG_SNOUT} stroke={INK} strokeWidth={4} />
          <circle cx={40} cy={164} r={3.5} fill={INK} />
          <circle cx={52} cy={168} r={3.5} fill={INK} />
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

/** Tanda harga kayu (S3): papan + tiang, angka dari VO L3. */
const PriceSign: React.FC<{ text: string; x: number; y: number }> = ({ text, x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ backgroundColor: "#a8724a", border: "5px solid #241726", borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,0.5)", padding: "10px 22px", fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 44, color: "#f5f2ea", textShadow: "2px 2px 0 #000" }}>
      {text}
    </div>
    <div style={{ width: 12, height: 90, backgroundColor: "#7a5a34", border: "3px solid #241726", marginTop: -4 }} />
  </div>
);

/** Senapan laras panjang (S4): disandarkan di sisi Cutlar, miring. */
const Rifle: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "rotate(14deg)", transformOrigin: "top left" }}>
    <div style={{ width: 14, height: 300, backgroundColor: "#3a3a3a", border: "3px solid #241726", borderRadius: 6 }} />
    <div style={{ width: 22, height: 130, backgroundColor: "#7a5a34", border: "3px solid #241726", borderRadius: 6, marginTop: -6, marginLeft: -4 }} />
  </div>
);

/** Shot peta (S6, f920-1010): Pulau San Juan + selat di kedua sisi,
 *  kamp Amerika (selatan) vs kamp Inggris (utara), 5 kapal perang di
 *  Haro Strait. Sketsa kartun dari kode (bukan peta geografis presisi).
 *  Bawah 500 px polos supaya caption terbaca. */
const MapOverlay: React.FC = () => (
  <div style={{ position: "absolute", left: 60, right: 60, top: 180, bottom: 560, backgroundColor: "#f2e8d0", borderRadius: 24, border: "6px solid #5d4023", boxShadow: "0 12px 32px rgba(0,0,0,0.55)", overflow: "hidden" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 46, color: "#2a2018", textAlign: "center", paddingTop: 26 }}>
      SAN JUAN ISLAND, 1859
    </div>
    <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, color: "#5d4023", textAlign: "center", paddingTop: 6 }}>
      One island. Two armies. Zero shots fired.
    </div>
    <svg viewBox="0 0 960 860" style={{ width: "100%", height: "76%" }}>
      {/* Haro Strait (barat, kiri) + Rosario Strait (timur, kanan) */}
      <path d="M60,80 L900,60 L920,760 L80,780 Z" fill="#7ab8d9" stroke="#3a6a8a" strokeWidth={4} />
      {/* pulau di tengah */}
      <path d="M330,120 C420,90 560,100 600,180 C640,260 590,380 610,480 C630,580 560,700 470,720 C380,740 320,660 330,560 C340,460 300,340 310,240 C315,180 300,140 330,120 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
      <text x={120} y={430} fontSize={28} fontWeight={700} fill="#2c546e" transform="rotate(90 120 430)">HARO STRAIT</text>
      <text x={800} y={430} fontSize={28} fontWeight={700} fill="#2c546e" transform="rotate(90 800 430)">ROSARIO STRAIT</text>
      {/* 5 kapal perang Inggris di Haro Strait */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${195 + (i % 2) * 55} ${180 + i * 105})`}>
          <rect x={-34} y={0} width={68} height={20} rx={6} fill="#3a3a3a" stroke="#241726" strokeWidth={3} />
          <line x1={0} y1={0} x2={0} y2={-42} stroke="#241726" strokeWidth={4} />
          <path d="M0,-42 L26,-26 L0,-26 Z" fill="#f5f2ea" stroke="#241726" strokeWidth={2} />
        </g>
      ))}
      <text x={220} y={745} fontSize={26} fontWeight={700} fill="#2c546e" textAnchor="middle">5 BRITISH WARSHIPS</text>
      {/* English Camp (utara pulau) */}
      <circle cx={470} cy={180} r={24} fill="#a02a22" stroke="#241726" strokeWidth={5} />
      <text x={470} y={140} fontSize={34} fontWeight={800} fill="#241726" textAnchor="middle">ENGLISH CAMP</text>
      <text x={470} y={240} fontSize={26} fontWeight={700} fill="#a02a22" textAnchor="middle">2,140 MEN</text>
      {/* Belle Vue Sheep Farm (selatan) */}
      <circle cx={430} cy={540} r={24} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={430} y={600} fontSize={30} fontWeight={800} fill="#241726" textAnchor="middle">BELLE VUE FARM</text>
      <text x={430} y={635} fontSize={26} fontWeight={700} fill="#c23a12" textAnchor="middle">THE PIG LIVED HERE</text>
      {/* American Camp / redoubt (selatan) */}
      <circle cx={500} cy={665} r={24} fill="#2e3a5a" stroke="#241726" strokeWidth={5} />
      <text x={500} y={720} fontSize={34} fontWeight={800} fill="#241726" textAnchor="middle">AMERICAN CAMP</text>
      <text x={500} y={765} fontSize={26} fontWeight={700} fill="#2e3a5a" textAnchor="middle">461 MEN · 14 CANNONS</text>
      {/* kompas */}
      <g transform="translate(850 180)">
        <circle r={34} fill="#f2e6c4" stroke="#8a7a5a" strokeWidth={4} />
        <path d="M0,-24 L8,10 L0,4 L-8,10 Z" fill="#c0353a" />
        <text y={-40} textAnchor="middle" fontSize={28} fontWeight={800} fill="#2a2018">N</text>
      </g>
      <text x={480} y={830} textAnchor="middle" fontSize={26} fontWeight={700} fill="#5d4023">Not to scale</text>
    </svg>
  </div>
);

/** Frame foto asli domain publik (f1700-1800): Belle Vue Sheep Farm,
 *  San Juan Island, September 1859 — foto dari masa krisis Pig War
 *  (National Park Service, domain publik — karya pemerintah federal AS).
 *  File: public/pig-war-1859.jpg (688x229). */
const PhotoFrame: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ backgroundColor: "#f5f2ea", padding: 18, borderRadius: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.6)", transform: "rotate(-1.5deg)" }}>
      <img src={staticFile("pig-war-1859.jpg")} alt="Belle Vue Sheep Farm, San Juan Island, September 1859" style={{ width: 940, height: 313, objectFit: "cover", display: "block" }} />
      <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1.25, color: "#2a2018", textAlign: "center", paddingTop: 14 }}>
        Belle Vue Sheep Farm, San Juan Island, September 1859
        <br />
        Photo: U.S. National Park Service (public domain)
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SCENES — 9 adegan (satu per baris VO), hard cut. Tiap Scene HANYA   */
/* overlay karakter 2D + bayangan kontak; latarnya dunia 3D dari       */
/* world3d.tsx. Kaki menapak: BeanHead y + 500*scale; Pig y + 280*scale. */
/* ------------------------------------------------------------------ */

const Scene1: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={90} y={700} scale={1.2} />
    <BeanHead x={90} y={700} scale={1.2} kind="farmer" pose="point" expr="amazed" speaking={speaking} local={local} />
    <ContactShadow x={400} y={980} scale={1.1} foot={280} />
    <Pig x={400} y={980} scale={1.1} pose="root" local={local} />
    <ContactShadow x={650} y={720} scale={1.0} />
    <BeanHead x={650} y={720} scale={1.0} kind="british" pose="pointL" expr="stern" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={80} y={680} scale={1.35} />
    <BeanHead x={80} y={680} scale={1.35} kind="farmer" pose="worried" expr="worried" speaking={speaking} local={local} />
    <ContactShadow x={380} y={1000} scale={1.2} foot={280} />
    <Pig x={380} y={1000} scale={1.2} pose="root" local={local} />
    <ContactShadow x={720} y={700} scale={1.05} />
    <BeanHead x={720} y={700} scale={1.05} kind="british" pose="stand" expr="stern" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={70} y={680} scale={1.2} />
    <BeanHead x={70} y={680} scale={1.2} kind="farmer" pose="stand" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={400} y={1020} scale={1.05} foot={280} />
    <Pig x={400} y={1020} scale={1.05} pose="root" local={local} />
    <ContactShadow x={700} y={680} scale={1.1} />
    <BeanHead x={700} y={680} scale={1.1} kind="british" pose="stand" expr="stern" speaking={speaking} local={local} />
    {/* tanda harga digambar SETELAH karakter supaya tampak tertancap di
        depan tulang kering mereka (bukan tertutup badan) */}
    <PriceSign text="$10" x={270} y={1080} />
    <PriceSign text="$100" x={890} y={1080} />
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={120} y={640} scale={1.45} />
    <BeanHead x={120} y={640} scale={1.45} kind="farmer" pose="stand" expr="stern" speaking={speaking} local={local} />
    <Rifle x={455} y={900} />
    <ContactShadow x={420} y={1040} scale={1.3} foot={280} />
    <Pig x={420} y={1040} scale={1.3} pose="lie" local={local} />
    <ContactShadow x={680} y={660} scale={1.1} />
    <BeanHead x={680} y={660} scale={1.1} kind="redcoat" pose="pointL" expr="stern" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => {
  // Pickett + 2 tentara BERJALAN KE DEPAN (ke arah kamera): pose "walk"
  // (kaki kanan lalu kiri bergantian mengangkat ke atas) + y dan scale
  // naik LINEAR terhadap local (jalan kaki kecepatannya konstan).
  // S5 = baris 5 karaoke, frame global 723-875 (terukur WhisperX,
  // L5 24.11-29.18 dtk), local 0..152. x tetap. Kaki awal ~y1430, maju
  // ~130-170 px dan tetap di atas caption. ContactShadow ikut y dan
  // scale yang sama.
  const yB = interpolate(local, [0, 152], [540, 630]);
  const sB = interpolate(local, [0, 152], [1.6, 1.7]);
  const yL = interpolate(local, [0, 152], [680, 800]);
  const sL = interpolate(local, [0, 152], [1.3, 1.42]);
  const yR = interpolate(local, [0, 152], [700, 820]);
  const sR = interpolate(local, [0, 152], [1.25, 1.35]);
  return (
    <AbsoluteFill>
      <ContactShadow x={0} y={yL} scale={sL} />
      <BeanHead x={0} y={yL} scale={sL} kind="soldier" pose="walk" expr="stern" speaking={speaking} local={local} />
      <ContactShadow x={340} y={yB} scale={sB} />
      <BeanHead x={340} y={yB} scale={sB} kind="officer" pose="walk" expr="stern" speaking={speaking} local={local} />
      <ContactShadow x={640} y={yR} scale={sR} />
      <BeanHead x={640} y={yR} scale={sR} kind="soldier" pose="walk" expr="stern" speaking={speaking} local={local} />
    </AbsoluteFill>
  );
};

const Scene6: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={80} y={650} scale={1.35} />
    <BeanHead x={80} y={650} scale={1.35} kind="officer" pose="point" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={360} y={700} scale={1.2} />
    <BeanHead x={360} y={700} scale={1.2} kind="soldier" pose="stand" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={720} y={700} scale={1.05} />
    <BeanHead x={720} y={700} scale={1.05} kind="redcoat" pose="stand" expr="stern" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={40} y={720} scale={1.25} />
    <BeanHead x={40} y={720} scale={1.25} kind="redcoat" pose="stand" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={360} y={560} scale={1.45} />
    <BeanHead x={360} y={560} scale={1.45} kind="admiral" pose="stop" expr="worried" speaking={speaking} local={local} />
    <ContactShadow x={740} y={720} scale={1.0} />
    <BeanHead x={740} y={720} scale={1.0} kind="redcoat" pose="stand" expr="stern" speaking={speaking} local={local} />
    <PillLabel text="A SQUABBLE ABOUT A PIG" top={470} />
  </AbsoluteFill>
);

const Scene8: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={120} y={680} scale={1.35} />
    <BeanHead x={120} y={680} scale={1.35} kind="soldier" pose="stand" expr="smile" speaking={speaking} local={local} />
    <ContactShadow x={690} y={680} scale={1.1} />
    <BeanHead x={690} y={680} scale={1.1} kind="redcoat" pose="stand" expr="smile" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene9: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={80} y={700} scale={1.35} />
    <BeanHead x={80} y={700} scale={1.35} kind="soldier" pose="salute" expr="smile" speaking={speaking} local={local} />
    <ContactShadow x={380} y={600} scale={1.6} />
    <BeanHead x={380} y={600} scale={1.6} kind="officer" pose="salute" expr="smile" speaking={speaking} local={local} />
    <ContactShadow x={700} y={700} scale={1.1} />
    <BeanHead x={700} y={700} scale={1.1} kind="soldier" pose="salute" expr="smile" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const SCENES: React.FC<{ local: number; speaking: boolean }>[] = [
  Scene1, Scene2, Scene3, Scene4, Scene5,
  Scene6, Scene7, Scene8, Scene9,
];

/* Scene is derived from the karaoke line ONLY. Satu adegan per baris. */
/* ------------------------------------------------------------------ */

const SCENE_LINES: number[][] = [[1], [2], [3], [4], [5], [6], [7], [8], [9]];

const lineToScene = (line: number): number => Math.min(Math.max(line - 1, 0), 8);

const sceneSpan = (scene: number): [number, number] => {
  const lines = SCENE_LINES[scene];
  const ps = KARAOKE.filter((p) => lines.includes(p.line));
  return [ps[0].startFrame, ps[ps.length - 1].endFrame];
};

const BEAT_LABEL_TEXT: Record<number, string> = {
  0: "1859, San Juan Island",
  5: "August 1859",
  7: "1859–1872, San Juan Island",
  8: "1872",
};

export const Video17: React.FC = () => {
  const frame = useCurrentFrame();
  const phrase = KARAOKE.find((p) => frame >= p.startFrame && frame < p.endFrame);
  let line: number;
  if (phrase) {
    line = phrase.line;
  } else if (frame < KARAOKE[0].startFrame) {
    line = 1;
  } else {
    const next = KARAOKE.find((p) => p.startFrame > frame);
    line = next ? next.line : 9;
  }
  const scene = lineToScene(line);
  const [sStart, sEnd] = sceneSpan(scene);
  const local = Math.max(0, Math.min(frame - sStart, sEnd - sStart));
  const len = Math.max(1, sEnd - sStart);
  // KAMERA (aturan kamera bill 28 Nov): LOCKED-OFF. Hanya 2 push-in:
  // S1 hook cepat 1 -> 1.3 dalam 60 frame pertama, lalu tahan; S6
  // lambat 1 -> 1.08 sepanjang adegan (objek kunci: standoff).
  // Adegan lain zoom = 1. panX = 0, panY = 0 (tidak ada geser).
  const zoom =
    scene === 0
      ? interpolate(local, [0, 60], [1, 1.18], { easing: Easing.out(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : scene === 5
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
      {showMap && <MapOverlay />}
      {beatLabel && local < 150 && !showMap && <DateLabel text={beatLabel} />}
      {frame >= PHOTO_A && <PhotoFrame />}
      {phrase && <KaraokeText phrase={phrase.phrase} />}
    </AbsoluteFill>
  );
};

export const VIDEO17_FRAMES = TOTAL_FRAMES;
