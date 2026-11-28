// "Video16": Wojtek the Bear Soldier, History Rush #7.
// "A Bear Enlisted in the Army. He Never Went Home."
// 9 adegan (satu per baris VO), 3 beat: L1-3 (Iran 1942, lucu),
// L4-6 (kapal + Monte Cassino 1944, unik), L7-9 (Edinburgh 1947-1963,
// sedih). KARAKTER: Wojtek (beruang, komponen Bear di bawah — anak di
// beat 1, dewasa berdiri di beat 2, tua di beat 3), tentara Polandia
// (kind "soldier", seragam khaki + helm, konsisten), 2 veteran tua
// (kind "elder", kunjungan S8).
// BATAS KEJUJURAN: Monte Cassino shell-carrying dipakai versi IPN +
// lambang unit (diperdebatkan satu memoar veteran, RESEARCH.md); tidak
// ada dialog/quote karangan. TIDAK ADA karakter duduk di video ini
// (aturan duduk TIDAK BERLAKU — semua berdiri/berjalan; Wojtek duduk
// hanya di foto asli 1942). TIMING: karaoke.ts PROVISIONAL proporsional
// kata (VO belum direkam) — ganti timing terukur WhisperX di Tahap 7.
// Teks karaoke Poppins ExtraBold putih outline hitam tebal, 46px,
// maxWidth 920, bottom 430 (spesifikasi Lustig v3 / Peshtigo).
// TOTAL_FRAMES = 1800.
import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { KARAOKE } from "./karaoke";
import { World3D } from "./world3d";
import { MAP_A, MAP_B, PHOTO_A, TOTAL_FRAMES } from "./story";

const W = 1080;
const H = 1920;

const INK = "#241726"; // plum ink, bean-head canon (v01/toon.ts)
const SKIN = "#ffe2c2";
const SKIN_SHADE = "#f0c09e";
const MOUTH_DARK = "#5a1e28";
const KHAKI = "#7a6a45"; // seragam tentara Polandia 1942
const KHAKI_DARK = "#5d5236";
const HELMET = "#6a6242";
const TROUSER = "#4a3826";
const TROUSER_DARK = "#33261a";
const BOOT = "#3a2a1a";
const SWEAT = "#9fd4ff";
const BEAR_BROWN = "#8a5a30";
const BEAR_LIGHT = "#b07a45";
const BEAR_DARK = "#6e4522";

/* ------------------------------------------------------------------ */
/* Character: BEAN-HEAD (basis v14/Video14.tsx + v01/toon.ts).          */
/* Kotak natural 360 x 520 (kaki menapak y=500). Kepala bean 200x192   */
/* = 38% tinggi total. Badan ramping 130x190.                           */
/* Gerakan (aturan bill 27 Nov): kaki jalan KANAN lalu KIRI bergantian */
/* MENGANGKAT KE ATAS (vertikal, sinus 12 f/langkah, lift 20 px);      */
/* badan maju ke depan lewat y/scale di Scene (bukan di komponen);     */
/* bob berdiri = 0 (karakter diam benar-benar diam); bob jalan hanya   */
/* untuk pose "walk". Lengan berlawanan dengan kaki (6 px).            */
/* ------------------------------------------------------------------ */

type CharKind = "soldier" | "elder";
type CharPose = "stand" | "point" | "walk" | "worried" | "salute" | "wave";
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
        // mulut turun kecil (toon.ts frown, lebih lembut dari stern)
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
  const moustache = kind === "elder";

  // Lengan: kiri menggantung / mengayun; kanan menggantung, menunjuk,
  // memberi hormat (ke pelipis), melambai, atau khawatir.
  const armLPath = pose === "worried" ? "M115,228 Q89,276 85,322" : "M115,228 Q101,282 107,336";
  const armLHand: [number, number] = pose === "worried" ? [85, 322] : [107, 336];
  const armRPath =
    pose === "point"
      ? "M245,228 Q289,198 311,166"
      : pose === "salute"
        ? "M245,228 Q305,175 292,108"
        : pose === "wave"
          ? "M245,228 Q292,190 306,140"
          : pose === "worried"
            ? "M245,228 Q271,276 275,322"
            : "M245,228 Q259,282 253,336";
  const armRHand: [number, number] =
    pose === "point" ? [311, 166] : pose === "salute" ? [292, 108] : pose === "wave" ? [306, 140] : pose === "worried" ? [275, 322] : [253, 336];

  const bodyFill = kind === "soldier" ? KHAKI : "#3f3f4a";

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
        {/* tentara: ikat pinggang + 3 kancing + saku dada */}
        {kind === "soldier" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill={KHAKI_DARK} stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <rect x={132} y={216} width={34} height={26} rx={4} fill={KHAKI_DARK} stroke={INK} strokeWidth={3} />
            <rect x={194} y={216} width={34} height={26} rx={4} fill={KHAKI_DARK} stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* veteran tua: jas gelap + kemeja putih segitiga di leher */}
        {kind === "elder" && (
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

        {/* tentara: helm Brodie khaki + brim lebar */}
        {kind === "soldier" && (
          <>
            <path d="M86,84 C86,30 132,6 180,6 C228,6 274,30 274,84 L274,88 L86,88 Z" fill={HELMET} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={180} cy={86} rx={102} ry={9} fill={HELMET} stroke={INK} strokeWidth={4} />
            <circle cx={180} cy={12} r={5} fill={KHAKI_DARK} stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* veteran tua: rambut abu-abu tipis di pelipis */}
        {kind === "elder" && (
          <>
            <path d="M86,96 C86,36 132,8 180,8 C228,8 274,36 274,96 C258,62 230,52 196,58 C164,64 132,56 110,66 C96,72 88,82 86,96 Z" fill="#c9c9c9" />
            <path d="M150,14 Q172,30 188,58" fill="none" stroke={SKIN} strokeWidth={5} strokeLinecap="round" />
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
 *  foot = offset kaki dalam kotak komponen (BeanHead 500, Bear dewasa 540,
 *  anak beruang 280). */
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
/* Wojtek the bear — SVG dari kode (bukan GLB, bukan gambar).           */
/* Kotak dewasa/tua 360 x 560 (kaki menapak y=540); anak 360 x 300     */
/* (kaki menapak y=280, merangkak). Berdiri di kaki belakang seperti   */
/* di foto asli IWM 1942. Gait jalan sama seperti BeanHead: kaki       */
/* bergantian mengangkat ke atas, bob hanya saat berjalan.             */
/* ------------------------------------------------------------------ */

type BearAge = "cub" | "adult" | "old";
type BearPose = "stand" | "walk" | "salute" | "reach" | "carry";
type BearExpr = "smile" | "content" | "sad" | "amazed";

const Bear: React.FC<{
  x: number;
  y: number;
  scale?: number;
  age?: BearAge;
  pose?: BearPose;
  expr?: BearExpr;
  local?: number;
  /** menunduk (beat 3): kepala turun beberapa px */
  bow?: number;
  /** menoleh (S8): kepala geser ke kanan beberapa px */
  look?: number;
}> = ({ x, y, scale = 1, age = "adult", pose = "stand", expr = "content", local = 0, bow = 0, look = 0 }) => {
  const uid = useId().replace(/:/g, "");
  const walking = pose === "walk";
  const stepIdx = Math.floor(local / 12);
  const stepT = (local % 12) / 12;
  const liftPhase = Math.sin(stepT * Math.PI);
  const LIFT = 20;
  const leftLifting = stepIdx % 2 === 0;
  const liftL = walking && leftLifting ? LIFT * liftPhase : 0;
  const liftR = walking && !leftLifting ? LIFT * liftPhase : 0;
  const bob = walking ? -Math.abs(Math.sin(local * 0.26)) * 12 : 0;
  const blink = local % 90 < 4;
  const grey = age === "old";
  const fur = grey ? "#7d5a3a" : BEAR_BROWN;
  const furLight = grey ? "#a8875f" : BEAR_LIGHT;
  const muzzle = grey ? "#c9c2b8" : "#d9b98c";
  // Anak beruang: badan horizontal, kepala di kanan, ekor di kiri.
  if (age === "cub") {
    const reachLift = pose === "reach" ? 26 : 0;
    return (
      <div style={{ position: "absolute", left: x, top: y + bob, width: 360, height: 300, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <svg width={360} height={300} viewBox="0 0 360 300">
          {/* ekor */}
          <circle cx={52} cy={150} r={16} fill={fur} stroke={INK} strokeWidth={5} />
          {/* kaki belakang + depan (depan kanan terangkat saat reach) */}
          <g transform={`translate(0 ${-liftL})`}>
            <rect x={96} y={196} width={34} height={80} rx={14} fill={fur} stroke={INK} strokeWidth={5} />
            <ellipse cx={113} cy={280} rx={24} ry={10} fill={furLight} stroke={INK} strokeWidth={4} />
          </g>
          <g transform={`translate(0 ${-liftR})`}>
            <rect x={150} y={196} width={34} height={80} rx={14} fill={fur} stroke={INK} strokeWidth={5} />
            <ellipse cx={167} cy={280} rx={24} ry={10} fill={furLight} stroke={INK} strokeWidth={4} />
          </g>
          <g transform={`translate(0 ${-reachLift})`}>
            <rect x={238} y={196} width={34} height={80} rx={14} fill={fur} stroke={INK} strokeWidth={5} />
            <ellipse cx={255} cy={280} rx={24} ry={10} fill={furLight} stroke={INK} strokeWidth={4} />
          </g>
          <rect x={196} y={196} width={34} height={80} rx={14} fill={fur} stroke={INK} strokeWidth={5} />
          <ellipse cx={213} cy={280} rx={24} ry={10} fill={furLight} stroke={INK} strokeWidth={4} />
          {/* badan horizontal */}
          <ellipse cx={170} cy={160} rx={120} ry={72} fill={fur} stroke={INK} strokeWidth={6} />
          <ellipse cx={170} cy={186} rx={86} ry={40} fill={furLight} opacity={0.75} />
          {/* kepala + telinga */}
          <circle cx={272} cy={72} r={20} fill={fur} stroke={INK} strokeWidth={5} />
          <circle cx={272} cy={72} r={9} fill={furLight} />
          <circle cx={318} cy={86} r={20} fill={fur} stroke={INK} strokeWidth={5} />
          <circle cx={318} cy={86} r={9} fill={furLight} />
          <circle cx={296} cy={118} r={62} fill={fur} stroke={INK} strokeWidth={6} />
          <ellipse cx={318} cy={142} rx={30} ry={22} fill={muzzle} />
          <ellipse cx={332} cy={130} rx={10} ry={8} fill={INK} />
          {blink ? (
            <>
              <line x1={272} y1={104} x2={290} y2={104} stroke={INK} strokeWidth={5} strokeLinecap="round" />
              <line x1={306} y1={100} x2={324} y2={100} stroke={INK} strokeWidth={5} strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx={281} cy={104} r={6} fill={INK} />
              <circle cx={315} cy={100} r={6} fill={INK} />
            </>
          )}
          <path d="M312,158 Q322,166 332,158" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Dewasa / tua: berdiri di kaki belakang.
  const saluting = pose === "salute";
  const carrying = pose === "carry" || pose === "walk";
  const headY = 108 + bow;
  const headX = 180 + look;
  return (
    <div style={{ position: "absolute", left: x, top: y + bob, width: 360, height: 560, transform: `scale(${scale})`, transformOrigin: "top left" }}>
      <svg width={360} height={560} viewBox="0 0 360 560">
        <defs>
          <clipPath id={`bearhead-${uid}`}>
            <circle cx={headX} cy={headY} r={72} />
          </clipPath>
        </defs>
        {/* kaki belakang (kaki jalan bergantian naik) */}
        <g transform={`translate(0 ${-liftL})`}>
          <rect x={128} y={430} width={44} height={96} rx={18} fill={fur} stroke={INK} strokeWidth={5} />
          <ellipse cx={150} cy={530} rx={32} ry={12} fill={furLight} stroke={INK} strokeWidth={4} />
        </g>
        <g transform={`translate(0 ${-liftR})`}>
          <rect x={188} y={430} width={44} height={96} rx={18} fill={fur} stroke={INK} strokeWidth={5} />
          <ellipse cx={210} cy={530} rx={32} ry={12} fill={furLight} stroke={INK} strokeWidth={4} />
        </g>
        {/* badan besar tegak + perut terang */}
        <path
          d="M180,168 C246,168 272,236 272,330 C272,420 232,470 180,470 C128,470 88,420 88,330 C88,236 114,168 180,168 Z"
          fill={fur}
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <ellipse cx={180} cy={352} rx={62} ry={88} fill={furLight} opacity={0.7} />
        {/* peti peluru di depan dada (pose carry/walk) */}
        {carrying && (
          <g>
            <rect x={112} y={238} width={136} height={84} rx={8} fill="#8a6a42" stroke={INK} strokeWidth={5} />
            <line x1={112} y1={280} x2={248} y2={280} stroke={INK} strokeWidth={4} />
            <circle cx={150} cy={258} r={12} fill="#3a3a3a" stroke={INK} strokeWidth={3} />
            <circle cx={198} cy={258} r={12} fill="#3a3a3a" stroke={INK} strokeWidth={3} />
            <circle cx={174} cy={300} r={12} fill="#3a3a3a" stroke={INK} strokeWidth={3} />
            <text x={180} y={316} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={800} fontSize={20} fill="#f5f2ea">25-PR</text>
          </g>
        )}
        {/* lengan depan: memegang peti / hormat / menggantung */}
        {carrying ? (
          <>
            <path d="M108,240 Q92,290 128,300" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <circle cx={128} cy={300} r={12} fill={fur} stroke={INK} strokeWidth={4} />
            <path d="M252,240 Q268,290 232,300" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <circle cx={232} cy={300} r={12} fill={fur} stroke={INK} strokeWidth={4} />
          </>
        ) : saluting ? (
          <>
            <path d="M108,240 Q96,300 104,350" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <circle cx={104} cy={350} r={12} fill={fur} stroke={INK} strokeWidth={4} />
            <path d="M252,240 Q272,180 246,140" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <circle cx={246} cy={140} r={13} fill={fur} stroke={INK} strokeWidth={4} />
          </>
        ) : (
          <>
            <path d="M108,240 Q96,300 104,350" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <circle cx={104} cy={350} r={12} fill={fur} stroke={INK} strokeWidth={4} />
            <path d="M252,240 Q264,300 256,350" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <circle cx={256} cy={350} r={12} fill={fur} stroke={INK} strokeWidth={4} />
          </>
        )}
        {/* telinga bulat */}
        <circle cx={headX - 52} cy={headY - 52} r={22} fill={fur} stroke={INK} strokeWidth={5} />
        <circle cx={headX - 52} cy={headY - 52} r={10} fill={furLight} />
        <circle cx={headX + 52} cy={headY - 52} r={22} fill={fur} stroke={INK} strokeWidth={5} />
        <circle cx={headX + 52} cy={headY - 52} r={10} fill={furLight} />
        {/* kepala */}
        <circle cx={headX} cy={headY} r={72} fill={fur} stroke={INK} strokeWidth={6} />
        <g clipPath={`url(#bearhead-${uid})`}>
          <path d={`M ${headX + 44} ${headY - 56} C ${headX + 68} ${headY - 10} ${headX + 64} ${headY + 40} ${headX + 34} ${headY + 66} C ${headX + 52} ${headY + 20} ${headX + 52} ${headY - 30} ${headX + 44} ${headY - 56} Z`} fill={BEAR_DARK} opacity={0.35} />
        </g>
        {/* moncong + hidung */}
        <ellipse cx={headX} cy={headY + 30} rx={36} ry={26} fill={muzzle} />
        <ellipse cx={headX} cy={headY + 16} rx={12} ry={9} fill={INK} />
        <path d={`M ${headX} ${headY + 25} L ${headX} ${headY + 38} M ${headX - 16} ${headY + 44} Q ${headX} ${headY + (expr === "sad" ? 36 : 52)} ${headX + 16} ${headY + 44}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        {/* mata */}
        {blink ? (
          <>
            <line x1={headX - 36} y1={headY - 12} x2={headX - 18} y2={headY - 12} stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <line x1={headX + 18} y1={headY - 12} x2={headX + 36} y2={headY - 12} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          </>
        ) : expr === "amazed" ? (
          <>
            <circle cx={headX - 27} cy={headY - 12} r={9} fill="#ffffff" stroke={INK} strokeWidth={3} />
            <circle cx={headX + 27} cy={headY - 12} r={9} fill="#ffffff" stroke={INK} strokeWidth={3} />
            <circle cx={headX - 27} cy={headY - 11} r={4} fill={INK} />
            <circle cx={headX + 27} cy={headY - 11} r={4} fill={INK} />
          </>
        ) : (
          <>
            <circle cx={headX - 27} cy={headY - 12} r={6.5} fill={INK} />
            <circle cx={headX + 27} cy={headY - 12} r={6.5} fill={INK} />
          </>
        )}
        {/* alis sedih (tua / beat 3): ujung dalam TERANGKAT, bukan menukik
            (menukik = marah) */}
        {expr === "sad" && (
          <>
            <line x1={headX - 40} y1={headY - 26} x2={headX - 16} y2={headY - 34} stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <line x1={headX + 40} y1={headY - 26} x2={headX + 16} y2={headY - 34} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          </>
        )}
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

/** Label pil kecil di tengah adegan (nama/pangkat — kata-kata dari VO). */
const PillLabel: React.FC<{ text: string; top: number }> = ({ text, top }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 40, lineHeight: 1.15, color: "#ffd23a", textShadow: OUTLINE, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 18, padding: "12px 26px", textAlign: "center" }}>
      {text}
    </div>
  </div>
);

/** Shot peta perjalanan (S4, f474-564): Iran -> Italia -> Skotlandia.
 *  Sketsa kartun dari kode (bukan peta geografis presisi). Bawah 500 px
 *  polos supaya caption terbaca. */
const MapOverlay: React.FC = () => (
  <div style={{ position: "absolute", left: 60, right: 60, top: 180, bottom: 560, backgroundColor: "#f2e8d0", borderRadius: 24, border: "6px solid #5d4023", boxShadow: "0 12px 32px rgba(0,0,0,0.55)", overflow: "hidden" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 46, color: "#2a2018", textAlign: "center", paddingTop: 26 }}>
      WOJTEK&apos;S JOURNEY
    </div>
    <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, color: "#5d4023", textAlign: "center", paddingTop: 6 }}>
      1942 — 1947 &middot; from Iran to Scotland
    </div>
    <svg viewBox="0 0 960 860" style={{ width: "100%", height: "76%" }}>
      {/* laut (barat, kiri) + daratan (sketsa) */}
      <path d="M60,80 L900,60 L920,760 L80,780 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
      <path d="M60,80 L180,80 L170,780 L80,780 Z" fill="#7ab8d9" stroke="#3a6a8a" strokeWidth={4} />
      <text x={120} y={430} fontSize={28} fontWeight={700} fill="#2c546e" transform="rotate(90 120 430)">MEDITERRANEAN SEA</text>
      {/* rute putus-putus Iran -> Italia -> Skotlandia */}
      <path d="M700,560 Q560,420 480,330 Q420,260 420,170" fill="none" stroke="#241726" strokeWidth={6} strokeDasharray="18 14" />
      {/* Hamadan, Iran */}
      <circle cx={700} cy={560} r={26} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={700} y={610} fontSize={40} fontWeight={800} fill="#241726" textAnchor="middle">HAMADAN, IRAN</text>
      <text x={700} y={680} fontSize={28} fontWeight={700} fill="#c23a12" textAnchor="middle">1942 &middot; A CUB IS BOUGHT</text>
      {/* Monte Cassino, Italia */}
      <circle cx={480} cy={330} r={26} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={420} y={300} fontSize={40} fontWeight={800} fill="#241726" textAnchor="end">MONTE CASSINO</text>
      <text x={370} y={430} fontSize={28} fontWeight={700} fill="#c23a12" textAnchor="middle">ITALY 1944 &middot; CARRIES SHELLS</text>
      {/* Edinburgh, Skotlandia */}
      <circle cx={420} cy={170} r={26} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={420} y={110} fontSize={40} fontWeight={800} fill="#241726" textAnchor="middle">EDINBURGH</text>
      <text x={560} y={150} fontSize={28} fontWeight={700} fill="#c23a12">SCOTLAND 1947</text>
      {/* kompas */}
      <g transform="translate(850 180)">
        <circle r={34} fill="#f2e6c4" stroke="#8a7a5a" strokeWidth={4} />
        <path d="M0,-24 L8,10 L0,4 L-8,10 Z" fill="#c0353a" />
        <text y={-40} textAnchor="middle" fontSize={28} fontWeight={800} fill="#2a2018">N</text>
      </g>
      <text x={480} y={820} textAnchor="middle" fontSize={26} fontWeight={700} fill="#5d4023">Not to scale</text>
    </svg>
  </div>
);

/** Frame foto asli domain publik (f1680-1800): Wojtek dengan tentara
 *  Polandia, 1942, Imperial War Museum (IWM HU 16546). Public domain
 *  (Crown copyright kedaluwarsa — foto sebelum 1 Juni 1957).
 *  File: public/wojtek-bear-1942.jpg (1772x2436). */
const PhotoFrame: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ backgroundColor: "#f5f2ea", padding: 18, borderRadius: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.6)", transform: "rotate(-1.5deg)" }}>
      <img src={staticFile("wojtek-bear-1942.jpg")} alt="The real Wojtek with a Polish soldier, 1942" style={{ width: 700, height: 962, objectFit: "cover", display: "block" }} />
      <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1.25, color: "#2a2018", textAlign: "center", paddingTop: 14 }}>
        The real Wojtek with a Polish soldier, 1942
        <br />
        Photo: Imperial War Museum (public domain)
      </div>
    </div>
  </div>
);

/** Badge unit 22nd Company (S6): beruang membawa peluru — lambang resmi
 *  unit (IPN; Wikipedia). Digambar dari kode: lingkaran + siluet beruang
 *  membawa peluru + teks. Bukan logo asli yang disalin, melainkan sketsa
 *  kartun dari lambang yang sama. */
const BadgeOverlay: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ width: 300, height: 300, borderRadius: "50%", backgroundColor: "#f5f2ea", border: "8px solid #c23a12", boxShadow: "0 10px 30px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <svg width={200} height={150} viewBox="0 0 200 150">
        {/* siluet beruang berdiri membawa peluru */}
        <ellipse cx={100} cy={95} rx={52} ry={44} fill="#8a5a30" stroke="#241726" strokeWidth={4} />
        <circle cx={100} cy={42} r={30} fill="#8a5a30" stroke="#241726" strokeWidth={4} />
        <circle cx={76} cy={22} r={9} fill="#8a5a30" stroke="#241726" strokeWidth={3} />
        <circle cx={124} cy={22} r={9} fill="#8a5a30" stroke="#241726" strokeWidth={3} />
        <ellipse cx={100} cy={52} rx={14} ry={10} fill="#d9b98c" />
        <ellipse cx={100} cy={38} rx={5} ry={4} fill="#241726" />
        <circle cx={90} cy={38} r={3} fill="#241726" />
        <circle cx={110} cy={38} r={3} fill="#241726" />
        <rect x={118} y={78} width={52} height={22} rx={4} fill="#3a3a3a" stroke="#241726" strokeWidth={3} />
      </svg>
      <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 26, color: "#2a2018", textAlign: "center", lineHeight: 1.1, padding: "0 20px" }}>
        22nd COMPANY
        <br />
        BADGE
      </div>
    </div>
  </div>
);

/** Kertas pendaftaran (S4): kertas putih + garis isi + nomor seri.
 *  Kata-kata dari VO L4, bukan karangan. */
const EnlistPaper: React.FC = () => (
  <div style={{ position: "absolute", left: 300, top: 1000, transform: "rotate(-3deg)", backgroundColor: "#f5f2ea", border: "4px solid #2a2018", borderRadius: 8, boxShadow: "0 10px 26px rgba(0,0,0,0.5)", padding: "18px 22px", width: 280 }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 34, color: "#2a2018", textAlign: "center" }}>
      PRIVATE WOJTEK
    </div>
    <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, color: "#5d4023", textAlign: "center", marginTop: 6 }}>
      SERIAL No. 253
    </div>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ height: 10, backgroundColor: "#b8b0a0", borderRadius: 5, marginTop: 12, marginLeft: i * 18, marginRight: i * 12 }} />
    ))}
    <div style={{ marginTop: 14, width: 74, height: 74, borderRadius: "50%", border: "5px solid #c23a12", marginLeft: "auto", marginRight: "auto" }} />
  </div>
);

/** Tumpukan peti 2D (S5): peti amunisi di samping truk amunisi 3D. */
const CrateStack: React.FC = () => (
  <div style={{ position: "absolute", left: 780, top: 1290 }}>
    <div style={{ width: 230, height: 130, backgroundColor: "#8a6a42", border: "5px solid #241726", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.5)" }}>
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 30, color: "#f5f2ea", textShadow: "2px 2px 0 #000" }}>AMMO</div>
    </div>
    <div style={{ width: 180, height: 100, backgroundColor: "#a8875f", border: "5px solid #241726", borderRadius: 8, marginTop: -8, marginLeft: 25, boxShadow: "0 8px 20px rgba(0,0,0,0.5)" }} />
  </div>
);

/** Pagar kandang kebun binatang (S7-S9): jeruji vertikal + 2 rel, di depan
 *  Wojtek (digambar setelah beruang) tapi di belakang veteran
 *  (mereka di luar pagar). */
const FenceOverlay: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 1020, height: 460, pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 60, height: 16, backgroundColor: "#3a3a3a" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 240, height: 16, backgroundColor: "#3a3a3a" }} />
    {Array.from({ length: 19 }).map((_, i) => (
      <div key={i} style={{ position: "absolute", left: 20 + i * 56, top: 0, width: 10, height: 460, backgroundColor: "#4a4a4a", borderRadius: 5 }} />
    ))}
  </div>
);

/** Hujan rintik (S7, beat 3): garis diagonal turun pelan. */
const RainOverlay: React.FC<{ local: number }> = ({ local }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, overflow: "hidden", pointerEvents: "none" }}>
    {Array.from({ length: 14 }).map((_, i) => {
      const x0 = (i * 173 + 40) % 1080;
      const y = ((local * 14 + i * 260) % 1900) - 100;
      return <div key={i} style={{ position: "absolute", left: x0, top: y, width: 4, height: 46, backgroundColor: "rgba(180,200,220,0.5)", borderRadius: 2, transform: "rotate(12deg)" }} />;
    })}
  </div>
);

/** Mug bir + peti kecil (S3): di tanah antara anak beruang dan tentara. */
const BeerMug: React.FC = () => (
  <div style={{ position: "absolute", left: 600, top: 1260, display: "flex", alignItems: "flex-end", gap: 14 }}>
    <div style={{ width: 150, height: 110, backgroundColor: "#8a6a42", border: "5px solid #241726", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.45)" }} />
    <div>
      <div style={{ width: 74, height: 34, backgroundColor: "#ffffff", border: "4px solid #241726", borderRadius: "50%", marginBottom: -8, marginLeft: 6 }} />
      <div style={{ width: 84, height: 96, backgroundColor: "#e8a83a", border: "5px solid #241726", borderRadius: "8px 8px 12px 12px" }} />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SCENES — 9 adegan (satu per baris VO), hard cut. Tiap Scene HANYA   */
/* overlay karakter 2D + bayangan kontak; latarnya dunia 3D dari       */
/* world3d.tsx. Kaki menapak: BeanHead y + 500*scale; Bear dewasa      */
/* y + 540*scale; anak beruang y + 280*scale.                          */
/* ------------------------------------------------------------------ */

const Scene1: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={180} y={700} scale={1.2} />
    <BeanHead x={180} y={700} scale={1.2} kind="soldier" pose="point" expr="amazed" speaking={speaking} local={local} />
    <ContactShadow x={430} y={500} scale={1.7} foot={540} />
    <Bear x={430} y={500} scale={1.7} age="adult" pose="stand" expr="content" local={local} />
    <ContactShadow x={660} y={720} scale={1.05} />
    <BeanHead x={660} y={720} scale={1.05} kind="soldier" pose="point" expr="smile" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={80} y={700} scale={1.35} />
    <BeanHead x={80} y={700} scale={1.35} kind="soldier" pose="point" expr="smile" speaking={speaking} local={local} />
    <ContactShadow x={330} y={950} scale={1.5} foot={280} />
    <Bear x={330} y={950} scale={1.5} age="cub" pose="stand" expr="content" local={local} />
    <ContactShadow x={760} y={720} scale={1.25} />
    <BeanHead x={760} y={720} scale={1.25} kind="soldier" pose="stand" expr="smile" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={120} y={620} scale={1.5} />
    <BeanHead x={120} y={620} scale={1.5} kind="soldier" pose="salute" expr="smile" speaking={speaking} local={local} />
    <ContactShadow x={360} y={920} scale={1.45} foot={280} />
    <Bear x={360} y={920} scale={1.45} age="cub" pose="reach" expr="smile" local={local} />
    <BeerMug />
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* setelah peta (f474-564): dermaga + pendaftaran */}
    <ContactShadow x={90} y={620} scale={1.5} />
    <BeanHead x={90} y={620} scale={1.5} kind="soldier" pose="point" expr="smile" speaking={speaking} local={local} />
    <EnlistPaper />
    <ContactShadow x={430} y={520} scale={1.6} foot={540} />
    <Bear x={430} y={520} scale={1.6} age="adult" pose="stand" expr="content" local={local} />
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => {
  // Wojtek + 2 tentara BERJALAN KE DEPAN (ke arah kamera): pose "walk"
  // (kaki kanan lalu kiri bergantian mengangkat ke atas, sudah ada di
  // Bear/BeanHead) + y dan scale naik LINEAR terhadap local (jalan kaki
  // kecepatannya konstan). S5 = baris 5 karaoke, frame global 798-1033
  // (terukur WhisperX, L5 26.60-34.42 dtk), local 0..226 (interpolate
  // clamp di 9 frame terakhir L5). x tetap. Kaki awal ~y1430, maju
  // ~130-170 px dan tetap di atas caption. ContactShadow ikut y dan
  // scale yang sama.
  const yB = interpolate(local, [0, 226], [540, 630]);
  const sB = interpolate(local, [0, 226], [1.6, 1.7]);
  const yL = interpolate(local, [0, 226], [680, 800]);
  const sL = interpolate(local, [0, 226], [1.3, 1.42]);
  const yR = interpolate(local, [0, 226], [700, 820]);
  const sR = interpolate(local, [0, 226], [1.25, 1.35]);
  return (
    <AbsoluteFill>
      <ContactShadow x={0} y={yL} scale={sL} />
      <BeanHead x={0} y={yL} scale={sL} kind="soldier" pose="walk" expr="stern" speaking={speaking} local={local} />
      <ContactShadow x={340} y={yB} scale={sB} foot={540} />
      <Bear x={340} y={yB} scale={sB} age="adult" pose="walk" expr="content" local={local} />
      <ContactShadow x={680} y={yR} scale={sR} />
      <BeanHead x={680} y={yR} scale={sR} kind="soldier" pose="walk" expr="stern" speaking={speaking} local={local} />
      <CrateStack />
    </AbsoluteFill>
  );
};

const Scene6: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={80} y={650} scale={1.45} />
    <BeanHead x={80} y={650} scale={1.45} kind="soldier" pose="salute" expr="smile" speaking={speaking} local={local} />
    <ContactShadow x={380} y={520} scale={1.7} foot={540} />
    <Bear x={380} y={520} scale={1.7} age="adult" pose="salute" expr="content" local={local} />
    <ContactShadow x={740} y={650} scale={1.2} />
    <BeanHead x={740} y={650} scale={1.2} kind="soldier" pose="stand" expr="smile" speaking={speaking} local={local} />
    <BadgeOverlay />
    <PillLabel text="CORPORAL WOJTEK" top={470} />
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* Wojtek tua di DALAM pagar (digambar sebelum pagar).
        Kepala menunduk pelan (bow). */}
    <ContactShadow x={360} y={560} scale={1.7} foot={540} />
    <Bear x={360} y={560} scale={1.7} age="old" pose="stand" expr="sad" local={local} bow={14} />
    <FenceOverlay />
    <RainOverlay local={local} />
  </AbsoluteFill>
);

const Scene8: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={340} y={560} scale={1.7} foot={540} />
    <Bear x={340} y={560} scale={1.7} age="old" pose="stand" expr="content" local={local} look={18} />
    <FenceOverlay />
    <ContactShadow x={60} y={700} scale={1.4} />
    <BeanHead x={60} y={700} scale={1.4} kind="elder" pose="wave" expr="smile" speaking={speaking} local={local} />
    <ContactShadow x={700} y={720} scale={1.25} />
    <BeanHead x={700} y={720} scale={1.25} kind="elder" pose="wave" expr="content" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene9: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={380} y={560} scale={1.7} foot={540} />
    <Bear x={380} y={560} scale={1.7} age="old" pose="stand" expr="sad" local={local} bow={8} />
    <FenceOverlay />
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
  0: "1942, Iran",
  3: "1944, Monte Cassino",
  6: "1947-1963, Edinburgh",
};

export const Video16: React.FC = () => {
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
  // Zoom sangat pelan + panY kecil selama adegan, ease-in-out sine
  // (bukan linear — aturan motion_design). panX = 0 (geser kiri wrapper
  // DIHAPUS — pelajaran Peshtigo S2: terbaca goyang kiri-kanan).
  const zoom = interpolate(local, [0, len], [1, 1.02], { easing: Easing.inOut(Easing.sin) });
  const panX = 0;
  const panY = interpolate(local, [0, len], [0, -4], { easing: Easing.inOut(Easing.sin) });
  const Scene = SCENES[scene];
  const beatLabel = BEAT_LABEL_TEXT[scene];
  const showMap = frame >= MAP_A && frame < MAP_B;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}>
        <World3D scene={scene} local={local} />
        {!showMap && <Scene local={local} speaking={!!phrase} />}
      </div>
      {showMap && <MapOverlay />}
      {beatLabel && local < 150 && !showMap && <DateLabel text={beatLabel} />}
      {frame >= PHOTO_A && <PhotoFrame />}
      {phrase && <KaraokeText phrase={phrase.phrase} />}
    </AbsoluteFill>
  );
};

export const VIDEO16_FRAMES = TOTAL_FRAMES;
export const VIDEO16_SIZE = { width: W, height: H };
