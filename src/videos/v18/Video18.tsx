// "Video18": Paraguayan War, History Rush #10.
// "The Deadliest War in South American History. America Never Heard of It."
// 9 adegan (L1+L2 hook, L3, L4, L5, L6a Riachuelo, L6b Tuyuti + peta,
// L7, L8, L9+L10 penutup), 3 beat: L1-5 (penyebab 1864-65), L6-7
// (eskalasi Riachuelo + Tuyuti + Asuncion jatuh), L8-10 (akhir + biaya).
// KARAKTER: Francisco Solano Lopez (kind "lopez", seragam biru gelap +
// emas + janggut), tentara Paraguay (kind "paraguay", tunik merah),
// tentara Brasil (kind "brazil", hijau), Argentina (kind "argentina",
// biru muda), Uruguay (kind "uruguay", putih), anak-anak Acosta Nu
// (kind "child", baju cokelat, tanpa topi; ATURAN ANAK bill 28 Nov 2026:
// tinggi total anak 60-65% tentara dewasa + kepala diperbesar 1.12x
// (kepala ~43% tinggi total anak, dewasa ~38%), supaya langsung
// terbaca sebagai anak, bukan orang dewasa kecil).
// MERIAM: komponen Cannon (laras recoil lurus, dari anatomy fig2).
// BATAS KEJUJURAN: semua fakta dari RESEARCH.md; angka korban yang
// diperdebatkan TIDAK dipakai sebagai fakta tunggal; tidak ada adegan/
// dialog/quote karangan; Acosta Nu digambar hening, tanpa dramatisasi.
// TIDAK ADA karakter duduk di video ini (aturan duduk TIDAK BERLAKU).
// KAMERA (aturan kamera bill 28 Nov): LOCKED-OFF; hanya 2 push-in
// (cepat 1->1.18 di hook S1, lambat 1->1.08 di S3 kapal Olinda);
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
const LOPEZ_NAVY = "#232c46"; // seragam López (biru gelap + emas)
const PARAGUAY_RED = "#a02a22"; // tunik merah tentara Paraguay
const BRAZIL_GREEN = "#2e5a34"; // tunik hijau tentara Brasil
const ARG_BLUE = "#7ab8d9"; // tunik biru muda tentara Argentina
const CHILD_BROWN = "#6a4a2e"; // baju cokelat anak-anak Acosta Ñu
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

type CharKind = "lopez" | "paraguay" | "brazil" | "argentina" | "uruguay" | "child";
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
  kind = "paraguay",
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
  const moustache = kind === "lopez";

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
    kind === "lopez"
      ? LOPEZ_NAVY
      : kind === "paraguay"
        ? PARAGUAY_RED
        : kind === "brazil"
          ? BRAZIL_GREEN
          : kind === "argentina"
            ? ARG_BLUE
            : kind === "uruguay"
              ? "#f5f2ea"
              : CHILD_BROWN;

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
        {/* lopez: ikat pinggang gelap + kancing emas + tanda pangkat emas */}
                {kind === "lopez" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#1a2038" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#ffd84a" stroke={INK} strokeWidth={2.5} />
            <rect x={118} y={202} width={40} height={14} rx={4} fill="#ffd84a" stroke={INK} strokeWidth={3} />
            <rect x={202} y={202} width={40} height={14} rx={4} fill="#ffd84a" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* paraguay: sabuk silang putih di dada */}
                {kind === "paraguay" && (
          <>
            <line x1={132} y1={216} x2={228} y2={352} stroke="#f5f2ea" strokeWidth={12} />
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#f5f2ea" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
          </>
        )}
        {/* brazil: ikat pinggang hijau tua + kancing */}
                {kind === "brazil" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#1e3a24" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
          </>
        )}
        {/* argentina: ikat pinggang putih */}
                {kind === "argentina" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#f5f2ea" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#7ab8d9" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
          </>
        )}
        {/* uruguay: ikat pinggang biru */}
                {kind === "uruguay" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#2e4a8a" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
          </>
        )}
        {/* topi */}

        {/* ANAK (kind "child", aturan bill 28 Nov 2026): kepala diperbesar
            1.12x tentang pusatnya + geser 8 ke bawah supaya tidak terpotong
            tepi atas; kepala anak jadi ~43% tinggi totalnya (dewasa ~38%).
            Skala luar anak di Scene dibuat ~0.62x tentara dewasa. */}
        <g transform={kind === "child" ? "translate(180 103) scale(1.12) translate(-180 -103) translate(0 8)" : undefined}>
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

        {/* lopez: kepi biru gelap + pita emas */}
                {kind === "lopez" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={LOPEZ_NAVY} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#1a2038" stroke={INK} strokeWidth={4} />
            <line x1={96} y1={52} x2={264} y2={52} stroke="#ffd84a" strokeWidth={5} />
          </>
        )}
        {/* paraguay: kepi gelap + pita merah */}
                {kind === "paraguay" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill="#1e1a18" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#1e1a18" stroke={INK} strokeWidth={4} />
            <line x1={96} y1={52} x2={264} y2={52} stroke="#a02a22" strokeWidth={5} />
          </>
        )}
        {/* brazil: kepi hijau gelap */}
                {kind === "brazil" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={BRAZIL_GREEN} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#1e3a24" stroke={INK} strokeWidth={4} />
          </>
        )}
        {/* argentina: kepi biru muda */}
                {kind === "argentina" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill={ARG_BLUE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#5a8ab0" stroke={INK} strokeWidth={4} />
          </>
        )}
        {/* uruguay: kepi putih + pita biru */}
                {kind === "uruguay" && (
          <>
            <path d="M92,62 C92,20 132,4 180,4 C228,4 268,20 268,62 L268,66 L92,66 Z" fill="#f5f2ea" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={64} rx={98} ry={8} fill="#e8e6da" stroke={INK} strokeWidth={4} />
            <line x1={96} y1={52} x2={264} y2={52} stroke="#2e4a8a" strokeWidth={5} />
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
        {/* lopez: janggut cokelat gelap di DAGU saja (di bawah mulut y=152),
            bukan menutupi seluruh wajah bawah */}
                {kind === "lopez" && (
          <path d="M140,158 C142,196 158,208 180,208 C202,208 218,196 220,158 C208,178 196,182 180,182 C164,182 152,178 140,158 Z" fill="#3a2a1a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        )}
        {mouth()}
        {sweat && (
          <ellipse cx={262} cy={92} rx={7} ry={11} fill={SWEAT} stroke={INK} strokeWidth={2.5} />
        )}
        </g>
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
 *  foot = offset kaki dalam kotak komponen (BeanHead 500, Cannon 280). */
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
/* Meriam lapangan — SVG dari kode (bukan GLB), acuan anatomy          */
/* fig2-cannon.html: laras + cincin moncong + pangkal, 2 roda besar,   */
/* ekor sungsang. Kotak 360 x 300, roda menapak y=280. Gerakan: laras  */
/* recoil lurus ke belakang saat menembak (S6 Tuyuti), lalu kembali;   */
/* roda diam.                                                           */
/* ------------------------------------------------------------------ */

const Cannon: React.FC<{ x: number; y: number; scale?: number; firing?: boolean; local?: number }> = ({ x, y, scale = 1, firing = false, local = 0 }) => {
  const recoil = firing ? Math.abs(Math.sin(local * 0.2)) * 14 : 0;
  const flash = firing && local % 40 < 6;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 360, height: 300, transform: `scale(${scale})`, transformOrigin: "top left" }}>
      <svg width={360} height={300} viewBox="0 0 360 300">
        {/* ekor sungsang */}
        <polygon points="230,200 240,200 300,272 286,280" fill="#6a4a2e" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {/* roda jauh + dekat */}
        <circle cx={190} cy={240} r={48} fill="#4a2a18" stroke={INK} strokeWidth={5} />
        <circle cx={190} cy={240} r={12} fill="#8a6f3d" stroke={INK} strokeWidth={3} />
        <circle cx={170} cy={240} r={48} fill="#5e3a22" stroke={INK} strokeWidth={5} />
        <circle cx={170} cy={240} r={12} fill="#8a6f3d" stroke={INK} strokeWidth={3} />
        <line x1={170} y1={192} x2={170} y2={288} stroke="#8a6f3d" strokeWidth={4} />
        <line x1={122} y1={240} x2={218} y2={240} stroke="#8a6f3d" strokeWidth={4} />
        {/* laras (recoil lurus) */}
        <g transform={`translate(${recoil} 0)`}>
          <polygon points="60,124 250,116 252,146 60,154" fill="#2a2030" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <rect x={50} y={118} width={18} height={42} rx={4} fill="#3a2a3a" stroke={INK} strokeWidth={4} />
          <circle cx={252} cy={131} r={13} fill="#3a2a3a" stroke={INK} strokeWidth={4} />
        </g>
        {/* kilat moncong saat menembak */}
        {flash && (
          <polygon points="52,110 20,131 52,152 34,131" fill="#ffd84a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        )}
        {/* peluru di tanah */}
        <circle cx={300} cy={282} r={10} fill="#1a1426" stroke={INK} strokeWidth={3} />
        <circle cx={324} cy={282} r={10} fill="#1a1426" stroke={INK} strokeWidth={3} />
        <circle cx={312} cy={264} r={10} fill="#1a1426" stroke={INK} strokeWidth={3} />
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

/** Shot peta (S6, f960-1050): Paraguay + 3 tetangga (Brasil, Argentina,
 *  Uruguay), sungai Paraguay + Paraná, 4 penanda pertempuran
 *  (Riachuelo, Tuyutí, Acosta Ñu, Cerro Corá). Sketsa kartun dari kode
 *  (bukan peta geografis presisi). Bawah 500 px polos supaya caption
 *  terbaca. */
const MapOverlay: React.FC = () => (
  <div style={{ position: "absolute", left: 60, right: 60, top: 180, bottom: 560, backgroundColor: "#f2e8d0", borderRadius: 24, border: "6px solid #5d4023", boxShadow: "0 12px 32px rgba(0,0,0,0.55)", overflow: "hidden" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 46, color: "#2a2018", textAlign: "center", paddingTop: 26 }}>
      PARAGUAY, 1864–1870
    </div>
    <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, color: "#5d4023", textAlign: "center", paddingTop: 6 }}>
      One country. Three enemies. Five years.
    </div>
    <svg viewBox="0 0 960 860" style={{ width: "100%", height: "76%" }}>
      {/* sungai Paraguay (kiri) + Paraná (kanan) */}
      <path d="M180,60 C220,240 160,480 220,780 L300,780 C250,480 300,240 260,60 Z" fill="#7ab8d9" stroke="#3a6a8a" strokeWidth={4} />
      <path d="M640,60 C600,240 680,480 620,780 L700,780 C760,480 680,240 720,60 Z" fill="#7ab8d9" stroke="#3a6a8a" strokeWidth={4} />
      {/* Paraguay di tengah */}
      <path d="M330,140 C430,110 560,130 600,220 C640,310 600,420 610,520 C620,620 560,700 470,720 C380,740 320,660 330,560 C340,460 300,340 310,240 C315,180 300,160 330,140 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
      <text x={430} y={410} fontSize={38} fontWeight={800} fill="#241726" textAnchor="middle">PARAGUAY</text>
      <text x={120} y={430} fontSize={28} fontWeight={700} fill="#2c546e" transform="rotate(90 120 430)">PARAGUAY RIVER</text>
      <text x={830} y={430} fontSize={28} fontWeight={700} fill="#2c546e" transform="rotate(90 830 430)">PARANÁ RIVER</text>
      {/* Brasil (utara), Argentina (selatan), Uruguay (tenggara) */}
      <text x={480} y={80} fontSize={34} fontWeight={800} fill="#2e5a34" textAnchor="middle">BRAZIL</text>
      <text x={480} y={800} fontSize={34} fontWeight={800} fill="#5a8ab0" textAnchor="middle">ARGENTINA</text>
      <text x={820} y={700} fontSize={30} fontWeight={800} fill="#2e4a8a" textAnchor="middle">URUGUAY</text>
      {/* Riachuelo (barat laut, di sungai) */}
      <circle cx={250} cy={200} r={22} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={250} y={160} fontSize={30} fontWeight={800} fill="#241726" textAnchor="middle">RIACHUELO</text>
      <text x={250} y={245} fontSize={24} fontWeight={700} fill="#c23a12" textAnchor="middle">1865 · FLEET LOST</text>
      {/* Tuyutí (selatan) */}
      <circle cx={430} cy={600} r={22} fill="#a02a22" stroke="#241726" strokeWidth={5} />
      <text x={430} y={560} fontSize={30} fontWeight={800} fill="#241726" textAnchor="middle">TUYUTÍ</text>
      <text x={430} y={645} fontSize={24} fontWeight={700} fill="#a02a22" textAnchor="middle">1866 · BLOODIEST BATTLE</text>
      {/* Acosta Ñu (timur) */}
      <circle cx={590} cy={480} r={22} fill="#8a6a2a" stroke="#241726" strokeWidth={5} />
      <text x={590} y={440} fontSize={30} fontWeight={800} fill="#241726" textAnchor="middle">ACOSTA ÑU</text>
      <text x={590} y={525} fontSize={24} fontWeight={700} fill="#8a6a2a" textAnchor="middle">1869 · DAY OF THE CHILDREN</text>
      {/* Cerro Corá (utara) */}
      <circle cx={480} cy={280} r={22} fill="#241726" stroke="#f5f2ea" strokeWidth={5} />
      <text x={480} y={240} fontSize={30} fontWeight={800} fill="#241726" textAnchor="middle">CERRO CORÁ</text>
      <text x={480} y={325} fontSize={24} fontWeight={700} fill="#241726" textAnchor="middle">1870 · LÓPEZ KILLED</text>
      {/* Asunción */}
      <circle cx={330} cy={380} r={14} fill="#f5f2ea" stroke="#241726" strokeWidth={4} />
      <text x={308} y={388} fontSize={26} fontWeight={800} fill="#241726" textAnchor="end">ASUNCIÓN</text>
      {/* kompas */}
      <g transform="translate(850 180)">
        <circle r={34} fill="#f2e6c4" stroke="#8a7a5a" strokeWidth={4} />
        <path d="M0,-24 L8,10 L0,4 L-8,10 Z" fill="#c0353a" />
        <text y={-40} textAnchor="middle" fontSize={28} fontWeight={800} fill="#2a2018">N</text>
      </g>
      <text x={480} y={845} textAnchor="middle" fontSize={26} fontWeight={700} fill="#5d4023">Not to scale</text>
    </svg>
  </div>
);

/** Frame foto asli domain publik (f1700-1800): Francisco Solano López,
 *  foto 1859 — foto dari masa sebelum perang (Wikimedia Commons,
 *  domain publik — dari Washburn "The History of Paraguay" Vol. II,
 *  1871). File: public/lopez-1859.jpg (872x1028). */
const PhotoFrame: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ backgroundColor: "#f5f2ea", padding: 18, borderRadius: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.6)", transform: "rotate(-1.5deg)" }}>
      <img src={staticFile("lopez-1859.jpg")} alt="Francisco Solano López, photographed in 1859" style={{ width: 560, height: 658, objectFit: "cover", display: "block" }} />
      <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1.25, color: "#2a2018", textAlign: "center", paddingTop: 14 }}>
        Francisco Solano López, photographed in 1859
        <br />
        Photo: public domain (Wikimedia Commons)
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SCENES — 9 adegan (satu per baris VO), hard cut. Tiap Scene HANYA   */
/* overlay karakter 2D + bayangan kontak; latarnya dunia 3D dari       */
/* world3d.tsx. Kaki menapak: BeanHead y + 500*scale; Cannon y + 280*scale. */
/* ------------------------------------------------------------------ */

const Scene1: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* ANAK (aturan bill 28 Nov 2026): skala 0.80 / 0.69 (rasio kedalaman
        lama 1.1 : 0.95 dipertahankan) = tinggi total ~62% tentara tengah
        (skala 1.3); y dinaikkan supaya kaki tetap menapak di titik yang
        sama (kaki lama y 1252 / 1177). */}
    <ContactShadow x={120} y={850} scale={0.8} />
    <BeanHead x={120} y={850} scale={0.8} kind="child" pose="stand" expr="sad" speaking={speaking} local={local} />
    <ContactShadow x={420} y={640} scale={1.3} />
    <BeanHead x={420} y={640} scale={1.3} kind="paraguay" pose="stand" expr="sad" speaking={speaking} local={local} />
    <ContactShadow x={700} y={831} scale={0.69} />
    <BeanHead x={700} y={831} scale={0.69} kind="child" pose="stand" expr="worried" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={80} y={680} scale={1.35} />
    <BeanHead x={80} y={680} scale={1.35} kind="lopez" pose="point" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={720} y={700} scale={1.05} />
    <BeanHead x={720} y={700} scale={1.05} kind="brazil" pose="stand" expr="stern" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={60} y={700} scale={1.2} />
    <BeanHead x={60} y={700} scale={1.2} kind="lopez" pose="point" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={780} y={740} scale={1.0} />
    <BeanHead x={780} y={740} scale={1.0} kind="brazil" pose="worried" expr="worried" speaking={speaking} local={local} />
    <PillLabel text="ONE SHIP" top={470} />
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={40} y={680} scale={1.0} />
    <BeanHead x={40} y={680} scale={1.0} kind="brazil" pose="stand" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={300} y={660} scale={1.05} />
    <BeanHead x={300} y={660} scale={1.05} kind="argentina" pose="stand" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={570} y={680} scale={1.0} />
    <BeanHead x={570} y={680} scale={1.0} kind="uruguay" pose="stand" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={800} y={720} scale={0.9} />
    <BeanHead x={800} y={720} scale={0.9} kind="paraguay" pose="stand" expr="worried" speaking={speaking} local={local} />
    <PillLabel text="THREE AGAINST ONE" top={470} />
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={80} y={680} scale={1.3} />
    <BeanHead x={80} y={680} scale={1.3} kind="brazil" pose="point" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={700} y={700} scale={1.05} />
    <BeanHead x={700} y={700} scale={1.05} kind="paraguay" pose="worried" expr="worried" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene6: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={60} y={680} scale={1.2} />
    <BeanHead x={60} y={680} scale={1.2} kind="paraguay" pose="stand" expr="stern" speaking={speaking} local={local} />
    <ContactShadow x={360} y={960} scale={1.3} foot={280} />
    <Cannon x={360} y={960} scale={1.3} firing local={local} />
    <ContactShadow x={740} y={700} scale={1.0} />
    <BeanHead x={740} y={700} scale={1.0} kind="brazil" pose="stand" expr="stern" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => {
  // Tentara Aliansi BERJALAN KE DEPAN (ke arah kamera): pose "walk"
  // (kaki kanan lalu kiri bergantian mengangkat ke atas) + y dan scale
  // naik terhadap local. S7 = baris 7 karaoke, frame global 1073-1243
  // (terukur WhisperX, L7 35.75-41.44 dtk), local 0..170. x tetap.
  // ContactShadow ikut y dan scale yang sama.
  const yB = interpolate(local, [0, 170], [540, 630]);
  const sB = interpolate(local, [0, 170], [1.55, 1.65]);
  const yL = interpolate(local, [0, 170], [680, 800]);
  const sL = interpolate(local, [0, 170], [1.3, 1.42]);
  const yR = interpolate(local, [0, 170], [700, 820]);
  const sR = interpolate(local, [0, 170], [1.25, 1.35]);
  return (
    <AbsoluteFill>
      <ContactShadow x={0} y={yL} scale={sL} />
      <BeanHead x={0} y={yL} scale={sL} kind="brazil" pose="walk" expr="stern" speaking={speaking} local={local} />
      <ContactShadow x={340} y={yB} scale={sB} />
      <BeanHead x={340} y={yB} scale={sB} kind="argentina" pose="walk" expr="stern" speaking={speaking} local={local} />
      <ContactShadow x={700} y={yR} scale={sR} />
      <BeanHead x={700} y={yR} scale={sR} kind="uruguay" pose="walk" expr="stern" speaking={speaking} local={local} />
    </AbsoluteFill>
  );
};

const Scene8: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={80} y={700} scale={1.15} />
    <BeanHead x={80} y={700} scale={1.15} kind="paraguay" pose="stand" expr="sad" speaking={speaking} local={local} />
    {/* ANAK (aturan bill 28 Nov 2026): skala 0.71 / 0.74 (rasio lama
        1.0 : 1.05 dipertahankan) = tinggi total ~62-64% tentara
        (skala 1.15); y dinaikkan supaya kaki tetap menapak di titik
        yang sama (kaki lama y 1162 / 1227). */}
    <ContactShadow x={400} y={806} scale={0.71} />
    <BeanHead x={400} y={806} scale={0.71} kind="child" pose="stand" expr="sad" speaking={speaking} local={local} />
    <ContactShadow x={700} y={856} scale={0.74} />
    <BeanHead x={700} y={856} scale={0.74} kind="child" pose="stand" expr="sad" speaking={speaking} local={local} />
    <PillLabel text="DAY OF THE CHILDREN" top={470} />
  </AbsoluteFill>
);

const Scene9: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={360} y={600} scale={1.6} />
    <BeanHead x={360} y={600} scale={1.6} kind="lopez" pose="stand" expr="sad" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const SCENES: React.FC<{ local: number; speaking: boolean }>[] = [
  Scene1, Scene2, Scene3, Scene4, Scene5,
  Scene6, Scene7, Scene8, Scene9,
];

/* Scene is derived from the karaoke line ONLY, except line 6 which is
 * split: Riachuelo (S5) until frame 896, then Tuyuti + map (S6). */
/* ------------------------------------------------------------------ */

/* [startFrame, endFrame] per scene, from karaoke.ts (WhisperX-measured). */
const SCENE_SPANS: [number, number][] = [
  [2, 201], [205, 400], [412, 575], [588, 746], [774, 893],
  [896, 1061], [1073, 1243], [1266, 1459], [1472, 1782],
];

const sceneFromFrame = (frame: number): number => {
  if (frame < 2) return 0;
  if (frame <= 201) return 0;
  if (frame <= 400) return 1;
  if (frame <= 575) return 2;
  if (frame <= 746) return 3;
  if (frame <= 893) return 4;
  if (frame <= 1061) return 5;
  if (frame <= 1243) return 6;
  if (frame <= 1459) return 7;
  return 8;
};

const BEAT_LABEL_TEXT: Record<number, string> = {
  0: "1864–1870, Paraguay",
  1: "1864, Asunción",
  5: "1866, Tuyutí",
  6: "1869, Asunción",
  8: "1870, Cerro Corá",
};

export const Video18: React.FC = () => {
  const frame = useCurrentFrame();
  const phrase = KARAOKE.find((p) => frame >= p.startFrame && frame < p.endFrame);
  const scene = sceneFromFrame(frame);
  const [sStart, sEnd] = SCENE_SPANS[scene];
  const local = Math.max(0, Math.min(frame - sStart, sEnd - sStart));
  const len = Math.max(1, sEnd - sStart);
  // KAMERA (aturan kamera bill 28 Nov): LOCKED-OFF. Hanya 2 push-in:
  // S1 hook cepat 1 -> 1.18 dalam 60 frame pertama, lalu tahan; S3
  // lambat 1 -> 1.08 sepanjang adegan (objek kunci: kapal Olinda).
  // Adegan lain zoom = 1. panX = 0, panY = 0 (tidak ada geser).
  const zoom =
    scene === 0
      ? interpolate(local, [0, 60], [1, 1.18], { easing: Easing.out(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : scene === 2
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

export const VIDEO18_FRAMES = TOTAL_FRAMES;
