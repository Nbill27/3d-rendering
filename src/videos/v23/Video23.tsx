// "Video23": Ghost Army, History Rush #14.
// "The Fake Army of 1,100 Men That Fooled Hitler"
// 9 adegan x 180 frame (L1 hook, L2, L3, L4, L5, L6, L7 peta, L8, L9+L10 foto),
// 3 beat: L1-L3 (unit rahasia + tiga trik), L4-L6 (cara kerja + skala),
// L7-L10 (Viersen + hasil + twist). 2 lokasi: Camp Forrest, Tennessee +
// Eropa / Sungai Rhine. 2 tokoh: prajurit AS (olive drab) + pengamat Jerman
// (field grey, S8). TIDAK ADA karakter bernama yang digambar sebagai tokoh
// utama; unitnya 23rd Headquarters Special Troops.
// BATAS KEJUJURAN: semua fakta dari RESEARCH.md; tidak ada adegan/
// dialog/quote karangan. NADA: cerdas dan penuh trik, tetap hormat (WWII).
// TIDAK ADA karakter duduk di video ini (aturan duduk TIDAK BERLAKU).
// TIDAK ADA anak di video ini (aturan anak TIDAK BERLAKU).
// TIDAK ADA karakter host/time-traveler.
// KAMERA (aturan kamera bill 28 Nov): LOCKED-OFF; hanya 2 push-in
// (cepat 1->1.18 di hook S1, lambat 1->1.08 ke tank tiup S4);
// panX = 0, panY = 0.
// GAYA @tauugaksih (aturan bill 28 Nov, berlaku semua video selanjutnya):
// palet komplementer KONSISTEN olive drab #4B5320 lawan amber/oranye
// #F2A93B; SATU kata kunci BESAR per beat (FAKE ARMY, 1,100 MEN,
// THREE TRICKS, RUBBER TANK, 15 MILES, 30,000, THE RHINE, WRONG PLACE,
// UNTOUCHED, SECRET) di tengah frame di samping karaoke; kedalaman tiga
// lapis dengan foreground framing (semak, pohon, peti); motif yang
// diulang: tank Sherman tiup (S1 hook mengembang, S9 penutup di tepi
// Rhine); ekspresi SNAP (mata "> <" marah, "^ ^" tertawa, mulut "O"
// kaget); S8 suasana mendingin ke biru-abu (Jerman tertipu), S9 kembali
// hangat amber (payoff).
// TIMING: karaoke.ts + captions.ts ESTIMASI (6 detik/baris, dari
// story.ts); HARUS diganti timing TERUKUR WhisperX di Tahap 7.
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
const OLIVE = "#4b5320"; // seragam olive drab prajurit AS (palet video)
const OLIVE_DARK = "#3a4218";
const GERMAN_GREY = "#6a6a62"; // seragam field grey pengamat Jerman
const GERMAN_DARK = "#54544a";
const HELMET_US = "#4b5320";
const HELMET_DE = "#6a6a62";
const TROUSER = "#3a4218";
const TROUSER_DARK = "#2a3010";
const BOOT = "#3a2a1a";
const SWEAT = "#9fd4ff";
const AMBER = "#f2a93b";

/* ------------------------------------------------------------------ */
/* Character: BEAN-HEAD (basis v22/Video22.tsx + v01/toon.ts).          */
/* Kotak natural 360 x 520 (kaki menapak y=500). Kepala bean 200x192   */
/* = 38% tinggi total. Badan ramping 130x190.                           */
/* Gerakan (aturan bill 27 Nov): kaki jalan KANAN lalu KIRI bergantian */
/* MENGANGKAT KE ATAS (vertikal, sinus 12 f/langkah, lift 20 px);      */
/* badan maju ke depan lewat y/scale di Scene (bukan di komponen);     */
/* bob berdiri = 0 (karakter diam benar-benar diam); bob jalan hanya   */
/* untuk pose "walk". Lengan berlawanan dengan kaki (6 px).            */
/* MULUT: bentuk tetap sesuai ekspresi, TIDAK PERNAH bergerak mengikuti */
/* narasi (aturan mulut bill 28 Nov). TIDAK ADA prop speaking.         */
/* Helm: M1 AS (olive) vs Stahlhelm Jerman (grey, pinggiran lebar).    */
/* ------------------------------------------------------------------ */

type CharKind = "soldier" | "german";
type CharPose = "stand" | "point" | "pointL" | "walk" | "worried" | "salute" | "wave" | "stop" | "scope";
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
  kind = "soldier",
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

  // MULUT: bentuk TETAP sesuai ekspresi saja (aturan mulut bill 28 Nov).
  // Tidak ada animasi mulut mengikuti narasi; tidak ada prop speaking.
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
        return <path d={`M ${MX - 13} ${MY + 2} L ${MX + 13} ${MY + 2}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
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
  // "pointL"); kanan menggantung, menunjuk, memberi hormat (ke pelipis),
  // melambai, khawatir, menolak (pose "stop"), atau memegang teropong
  // (pose "scope": kedua tangan naik ke mata).
  const armLPath =
    pose === "pointL"
      ? "M115,228 Q71,198 49,166"
      : pose === "scope"
        ? "M115,228 Q92,182 118,138"
        : pose === "worried"
          ? "M115,228 Q89,276 85,322"
          : "M115,228 Q101,282 107,336";
  const armLHand: [number, number] = pose === "pointL" ? [49, 166] : pose === "scope" ? [118, 138] : pose === "worried" ? [85, 322] : [107, 336];
  const armRPath =
    pose === "point"
      ? "M245,228 Q289,198 311,166"
      : pose === "salute"
        ? "M245,228 Q305,175 292,108"
        : pose === "wave"
          ? "M245,228 Q292,190 306,140"
          : pose === "stop"
            ? "M245,228 Q296,176 304,120"
            : pose === "scope"
              ? "M245,228 Q268,182 242,138"
              : pose === "worried"
                ? "M245,228 Q271,276 275,322"
                : "M245,228 Q259,282 253,336";
  const armRHand: [number, number] =
    pose === "point" ? [311, 166] : pose === "salute" ? [292, 108] : pose === "wave" ? [306, 140] : pose === "stop" ? [304, 120] : pose === "scope" ? [242, 138] : pose === "worried" ? [275, 322] : [253, 336];

  const bodyFill = kind === "soldier" ? OLIVE : GERMAN_GREY;
  const helmetFill = kind === "soldier" ? HELMET_US : HELMET_DE;

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
        {/* ikat pinggang + kancing + kerah (warna ikut kind) */}
        <rect x={122} y={352} width={116} height={16} rx={5} fill={kind === "soldier" ? "#2a2a18" : "#3a3a34"} stroke={INK} strokeWidth={3} />
        <circle cx={180} cy={360} r={4} fill={kind === "soldier" ? AMBER : "#c9c9c9"} stroke={INK} strokeWidth={2.5} />
        <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
        <circle cx={180} cy={252} r={4} fill={kind === "soldier" ? "#2a2a18" : "#3a3a34"} stroke={INK} strokeWidth={2.5} />
        <circle cx={180} cy={296} r={4} fill={kind === "soldier" ? "#2a2a18" : "#3a3a34"} stroke={INK} strokeWidth={2.5} />
        <path d="M150,202 L180,224 L210,202 L210,214 L180,232 L150,214 Z" fill={kind === "soldier" ? "#c9b896" : "#8a8a82"} stroke={INK} strokeWidth={3} />
        {/* saku dada prajurit AS / lencana Jerman */}
        {kind === "soldier" ? (
          <rect x={132} y={232} width={30} height={24} rx={4} fill="#5a6234" stroke={INK} strokeWidth={3} />
        ) : (
          <rect x={196} y={232} width={26} height={20} rx={3} fill="#8a8a82" stroke={INK} strokeWidth={3} />
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

        {/* helm: M1 AS (olive, pinggiran sempit) atau Stahlhelm Jerman
            (grey, pinggiran lebar menjorok). */}
        {kind === "soldier" ? (
          <>
            <ellipse cx={180} cy={56} rx={104} ry={10} fill={OLIVE_DARK} stroke={INK} strokeWidth={4} />
            <path d="M120,56 C120,20 146,10 180,10 C214,10 240,20 240,56 L240,60 L120,60 Z" fill={helmetFill} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <line x1={180} y1={12} x2={180} y2={52} stroke={OLIVE_DARK} strokeWidth={3} opacity={0.6} />
          </>
        ) : (
          <>
            <ellipse cx={180} cy={58} rx={118} ry={12} fill={GERMAN_DARK} stroke={INK} strokeWidth={4} />
            <path d="M116,58 C116,16 144,6 180,6 C216,6 244,16 244,58 L244,62 L116,62 Z" fill={helmetFill} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <line x1={180} y1={8} x2={180} y2={54} stroke={GERMAN_DARK} strokeWidth={3} opacity={0.6} />
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
        {/* teropong (pose scope): dua lensa gelap di depan mata */}
        {pose === "scope" && (
          <g>
            <rect x={136} y={100} width={30} height={34} rx={8} fill="#1a1a18" stroke={INK} strokeWidth={3} />
            <rect x={194} y={100} width={30} height={34} rx={8} fill="#1a1a18" stroke={INK} strokeWidth={3} />
            <rect x={162} y={108} width={36} height={10} rx={4} fill="#2a2a22" stroke={INK} strokeWidth={2.5} />
            <circle cx={151} cy={117} r={8} fill="#7a9ab8" stroke={INK} strokeWidth={2} />
            <circle cx={209} cy={117} r={8} fill="#7a9ab8" stroke={INK} strokeWidth={2} />
          </g>
        )}
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

/** Meja cetak biru + stempel TOP SECRET (S2): rencana unit rahasia di
 *  atas meja; stempel merah miring. Semua teks bahasa Inggris. */
const BlueprintTable: React.FC<{ x: number; y: number; scale?: number; rot?: number; local?: number }> = ({ x, y, scale = 1, rot = 0, local = 0 }) => {
  const pop = local < 30 ? 0.9 + local * 0.0033 : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 420, height: 300, transform: `scale(${scale * pop}) rotate(${rot}deg)`, transformOrigin: "top left" }}>
      <svg width={420} height={300} viewBox="0 0 420 300">
        {/* meja kayu */}
        <rect x={10} y={40} width={400} height={24} rx={6} fill="#6a4a2e" stroke={INK} strokeWidth={4} />
        <rect x={30} y={64} width={18} height={120} fill="#4a3220" stroke={INK} strokeWidth={3} />
        <rect x={372} y={64} width={18} height={120} fill="#4a3220" stroke={INK} strokeWidth={3} />
        {/* cetak biru: kertas biru + garis putih + sketsa tank */}
        <rect x={50} y={80} width={320} height={180} rx={6} fill="#1b3a5c" stroke={INK} strokeWidth={4} />
        <line x1={70} y1={110} x2={350} y2={110} stroke="#f5f2ea" strokeWidth={2} opacity={0.8} />
        <line x1={70} y1={140} x2={350} y2={140} stroke="#f5f2ea" strokeWidth={2} opacity={0.8} />
        <rect x={110} y={170} width={140} height={50} rx={8} fill="none" stroke="#f5f2ea" strokeWidth={3} />
        <rect x={150} y={150} width={60} height={30} rx={6} fill="none" stroke="#f5f2ea" strokeWidth={3} />
        <line x1={250} y1={195} x2={310} y2={195} stroke="#f5f2ea" strokeWidth={4} strokeLinecap="round" />
        <text x={210} y={245} textAnchor="middle" fontSize={18} fontWeight={700} fill="#f5f2ea" fontFamily="Poppins, sans-serif">23rd HQ SPECIAL TROOPS</text>
        {/* stempel TOP SECRET merah miring */}
        <g transform="rotate(-12 310 90)">
          <rect x={250} y={66} width={150} height={48} rx={6} fill="none" stroke="#c23a12" strokeWidth={4} />
          <text x={325} y={98} textAnchor="middle" fontSize={26} fontWeight={900} fill="#c23a12" fontFamily="Poppins, sans-serif">TOP SECRET</text>
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

/** SATU KATA KUNCI BESAR per beat (aturan @tauugaksih, berlaku semua video
 *  selanjutnya): satu kata per beat, huruf tebal Poppins ExtraBold putih
 *  outline hitam, di tengah frame di samping karaoke. Kata mengatur ritme,
 *  bukan gerakan karakter. Muncul dengan pop kecil lalu diam. */
const BeatWord: React.FC<{ word: string; local: number; top?: number; fontSize?: number }> = ({ word, local, top = 380, fontSize = 110 }) => {
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
        fontSize,
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

/** Shot peta (S7, f1150-1280): Sungai Rhine — penyeberangan PALSU di
 *  Viersen (selatan) lawan penyeberangan ASLI 10 mil di utara; panah
 *  merah putus-putus = tipuan, panah amber = yang asli; caption bawah
 *  "FAKE CROSSING 10 MILES SOUTH OF THE REAL ONE". Palet peta ikut
 *  pasangan komplementer: sungai biru lawan darat olive/amber. Semua
 *  label bahasa Inggris. */
const MapOverlay: React.FC<{ local?: number }> = ({ local = 0 }) => (
  <div style={{ position: "absolute", top: 180, left: 40, width: 1000, height: 1180, zIndex: 4 }}>
    <svg width={1000} height={1180} viewBox="0 0 1080 1180" style={{ display: "block" }}>
      <rect x={0} y={0} width={1080} height={1180} rx={18} fill="#f5f2ea" stroke="#241726" strokeWidth={5} />
      <text x={540} y={62} fontSize={34} fontWeight={900} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">RHINE RIVER, MARCH 1945</text>
      {/* darat (olive) di kiri-kanan, sungai (biru) di tengah */}
      <polygon points="60,100 420,100 420,1060 60,1060" fill="#8a8a5a" stroke="#241726" strokeWidth={4} />
      <polygon points="660,100 1020,100 1020,1060 660,1060" fill="#a8906a" stroke="#241726" strokeWidth={4} />
      <polygon points="420,100 660,100 660,1060 420,1060" fill="#2a5a8a" stroke="#241726" strokeWidth={4} />
      {/* garis tepi sungai bergerigi */}
      <path d="M420,100 L440,220 L415,380 L445,540 L420,700 L440,880 L420,1060" fill="none" stroke="#241726" strokeWidth={5} strokeLinecap="round" />
      <path d="M660,100 L640,220 L665,380 L635,540 L660,700 L640,880 L660,1060" fill="none" stroke="#241726" strokeWidth={5} strokeLinecap="round" />
      <text x={540} y={560} fontSize={26} fontWeight={800} fill="#ffffff" textAnchor="middle" fontFamily="Poppins, sans-serif">RHINE</text>
      {/* penyeberangan ASLI (utara): panah amber tebal menyeberang sungai */}
      <line x1={300} y1={300} x2={780} y2={300} stroke="#f2a93b" strokeWidth={12} strokeLinecap="round" />
      <path d="M740,275 L785,300 L740,325" fill="none" stroke="#f2a93b" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <text x={240} y={250} fontSize={30} fontWeight={900} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">REAL CROSSING</text>
      <text x={240} y={285} fontSize={22} fontWeight={700} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">NINTH ARMY</text>
      {/* penyeberangan PALSU (selatan, Viersen): panah merah putus-putus */}
      <line x1={300} y1={780} x2={780} y2={780} stroke="#c23a12" strokeWidth={12} strokeLinecap="round" strokeDasharray="26 18" />
      <path d="M740,755 L785,780 L740,805" fill="none" stroke="#c23a12" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <text x={240} y={730} fontSize={30} fontWeight={900} fill="#c23a12" textAnchor="middle" fontFamily="Poppins, sans-serif">FAKE CROSSING</text>
      <text x={240} y={765} fontSize={22} fontWeight={700} fill="#c23a12" textAnchor="middle" fontFamily="Poppins, sans-serif">VIERSEN</text>
      {/* jarak 10 mil di antara keduanya */}
      <line x1={120} y1={330} x2={120} y2={750} stroke="#241726" strokeWidth={4} strokeDasharray="10 10" />
      <text x={150} y={545} fontSize={28} fontWeight={900} fill="#241726" fontFamily="Poppins, sans-serif">10 MILES APART</text>
      {/* tank tiup kecil di sisi palsu (barisan di tepi sungai) */}
      {[340, 400, 460].map((y) => (
        <g key={y}>
          <rect x={180} y={y - 18} width={90} height={36} rx={10} fill="#4b5320" stroke="#241726" strokeWidth={3} />
          <line x1={270} y1={y} x2={310} y2={y} stroke="#241726" strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      <text x={240} y={880} fontSize={22} fontWeight={700} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">600 RUBBER TANKS</text>
      {/* caption bawah */}
      <rect x={90} y={1090} width={900} height={64} rx={32} fill="#4b5320" stroke="#241726" strokeWidth={4} />
      <text x={540} y={1132} fontSize={28} fontWeight={900} fill="#ffffff" textAnchor="middle" fontFamily="Poppins, sans-serif">FAKE CROSSING 10 MILES SOUTH OF THE REAL ONE</text>
    </svg>
    <div style={{ textAlign: "center", marginTop: 8, fontFamily: "Poppins, sans-serif", fontSize: 20, color: "#cfe3f2", opacity: 0.6 }}>Not to scale</div>
  </div>
);

/** Frame foto asli domain publik (f1700-1800): tank Sherman tiup,
 *  U.S. Army. File: studio/public/ghost-army-dummy-tank.jpg
 *  (Wikimedia Commons, File:DummyShermanTank.jpg — U.S. Army,
 *  public domain). Motif yang diulang: tank tiup yang sama muncul
 *  sebagai prop 3D di S1/S4/S8, lalu sebagai foto asli di akhir —
 *  "balasan" visual untuk twist. */
const PhotoFrame: React.FC = () => (
  <div style={{ position: "absolute", top: 560, left: 240, width: 600, zIndex: 4, transform: "rotate(-1.5deg)" }}>
    <div style={{ background: "#f5f2ea", padding: 16, paddingBottom: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.45)", borderRadius: 6 }}>
      <img src={staticFile("ghost-army-dummy-tank.jpg")} alt="A dummy Sherman tank" style={{ width: "100%", display: "block", borderRadius: 3 }} />
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 26, fontWeight: 700, color: "#241726", textAlign: "center", marginTop: 12, lineHeight: 1.3 }}>
        A dummy Sherman tank, U.S. Army
      </div>
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 20, fontWeight: 600, color: "#5a5a5a", textAlign: "center", marginTop: 4 }}>
        Photo: public domain (Wikimedia Commons)
      </div>
    </div>
  </div>
);

const Scene1: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Hook: prajurit AS berdiri diam (bob 0) menunjuk ke tank tiup yang
        mengembang di lapangan Camp Forrest. */}
    <ContactShadow x={90} y={700} scale={1.3} />
    <BeanHead x={90} y={700} scale={1.3} kind="soldier" pose="point" expr="amazed" local={local} />
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Unit dibentuk: dua prajurit di meja cetak biru + stempel TOP SECRET.
        Keduanya berdiri diam (bob 0). */}
    <ContactShadow x={80} y={700} scale={1.3} />
    <BeanHead x={80} y={700} scale={1.3} kind="soldier" pose="point" expr="stern" local={local} />
    <ContactShadow x={700} y={720} scale={1.1} />
    <BeanHead x={700} y={720} scale={1.1} kind="soldier" pose="stand" expr="smile" local={local} />
    <BlueprintTable x={300} y={1020} scale={0.9} rot={-4} local={local} />
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Tiga trik sepenuhnya 3D: tank karet + stasiun radio + truk suara. */}
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Tank mengembang sepenuhnya 3D (motif hero, push-in lambat). */}
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Malam sepenuhnya 3D: truk suara + gelombang amber ke pos pendengar. */}
  </AbsoluteFill>
);

const Scene6: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* 22 pin operasi sepenuhnya 3D di lapangan Eropa. */}
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Peta Rhine (f1150-1280) tampil lewat MapOverlay; sebelum peta buka,
        kata kunci THE RHINE tampil di atas dunia 3D sungai. */}
  </AbsoluteFill>
);

const Scene8: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Pengamat Jerman dengan teropong (pose scope) menoleh ke arah yang
        salah; rekannya di samping khawatir. Keduanya berdiri diam (bob 0).
        Tank tiup berbaris sepenuhnya 3D di tepi Rhine. */}
    <ContactShadow x={680} y={720} scale={1.15} />
    <BeanHead x={680} y={720} scale={1.15} kind="german" pose="scope" expr="stern" local={local} />
    <ContactShadow x={120} y={730} scale={1.05} />
    <BeanHead x={120} y={730} scale={1.05} kind="german" pose="stand" expr="worried" local={local} />
  </AbsoluteFill>
);

const Scene9: React.FC<{ local: number }> = ({ local }) => {
  // Penutup: matahari terbit hangat 3D + kata kunci UNTOUCHED lalu
  // SECRET, lalu foto asli tank tiup (f1700-1800).
  // Pasukan asli menyeberang: dua prajurit berjalan di atas jembatan
  // (pose walk — kaki bergantian naik, badan maju ke depan lewat x,
  // aturan jalan bill), kiri ke kanan mengikuti truk; hilang saat foto
  // asli tampil (local >= 247). Kaki di dek jembatan (y layar ~870):
  // tinggi karakter ~577*scale, jadi y atas = 870 - 577*scale.
  const show = local < 247;
  const wx1 = 120 + local * 2.2;
  const wx2 = 40 + local * 2.2;
  return (
    <AbsoluteFill>
      {show && (
        <>
          <ContactShadow x={wx1} y={553} scale={0.55} />
          <BeanHead x={wx1} y={553} scale={0.55} kind="soldier" pose="walk" expr="stern" local={local} />
          <ContactShadow x={wx2} y={582} scale={0.5} />
          <BeanHead x={wx2} y={582} scale={0.5} kind="soldier" pose="walk" expr="smile" local={local} />
        </>
      )}
    </AbsoluteFill>
  );
};

const SCENES: React.FC<{ local: number }>[] = [
  Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9,
];

const SCENE_SPANS: [number, number][] = [
  [0, 152], [153, 427], [428, 607], [608, 778], [779, 975], [976, 1095], [1096, 1299], [1300, 1452], [1453, 1800],
];

const sceneFromFrame = (frame: number): number => {
  const i = SCENE_SPANS.findIndex(([a, b]) => frame >= a && frame <= b);
  return i < 0 ? 0 : i;
};

const BEAT_LABEL_TEXT: Record<number, string> = {
  0: "1944, Camp Forrest, Tennessee",
  1: "1944, Camp Forrest, Tennessee",
  2: "1944",
  3: "1944, Camp Forrest",
  4: "1944-1945, Europe",
  5: "1944-1945, Europe",
  6: "March 1945, Rhine River",
  7: "March 1945, Rhine River",
  8: "1945-1996",
};

/** Satu kata kunci BESAR per beat (aturan @tauugaksih): scene -> daftar
 *  kata, local awal tampil, durasi (frame). S7 THE RHINE tampil sebelum
 *  peta buka (local 0-53, peta f1150 = local 54); S8 WRONG PLACE tampil
 *  setelah peta tutup (local 20, peta tutup f1280); S9 dua kata:
 *  UNTOUCHED (local 0-179) lalu SECRET (local 260, bersamaan foto f1700;
 *  kata di top 380, foto di top 560 — tidak bertabrakan). */
const BEAT_WORDS: Record<number, { word: string; at: number; dur: number; fontSize?: number }[]> = {
  0: [{ word: "FAKE ARMY", at: 0, dur: 150, fontSize: 100 }],
  1: [{ word: "1,100 MEN", at: 0, dur: 150, fontSize: 100 }],
  2: [{ word: "THREE TRICKS", at: 0, dur: 150, fontSize: 96 }],
  3: [{ word: "RUBBER TANK", at: 0, dur: 150, fontSize: 96 }],
  4: [{ word: "15 MILES", at: 0, dur: 150 }],
  5: [{ word: "30,000", at: 0, dur: 150 }],
  6: [{ word: "THE RHINE", at: 0, dur: 60, fontSize: 100 }],
  7: [{ word: "WRONG PLACE", at: 20, dur: 140, fontSize: 92 }],
  8: [
    { word: "UNTOUCHED", at: 0, dur: 180, fontSize: 100 },
    { word: "SECRET", at: 260, dur: 140 },
  ],
};

export const Video23: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = sceneFromFrame(frame);
  const [start] = SCENE_SPANS[scene];
  const local = frame - start;
  const showMap = frame >= MAP_A && frame < MAP_B;
  const showPhoto = frame >= PHOTO_A;
  const showLabel = !showMap && !showPhoto && local < 150;
  const label = BEAT_LABEL_TEXT[scene] ?? "";
  // KAMERA LOCKED-OFF (aturan kamera bill 28 Nov): hanya 2 push-in.
  // S1 hook: cepat 1 -> 1.18 dalam 60 frame; S4 tank tiup: lambat 1 -> 1.08.
  const zoom =
    scene === 0
      ? interpolate(local, [0, 60], [1, 1.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) })
      : scene === 3
        ? interpolate(local, [0, 180], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) })
        : 1;
  const panX = 0;
  const panY = 0;

  const phrase = KARAOKE.find((p) => frame >= p.startFrame && frame <= p.endFrame);
  const bws = BEAT_WORDS[scene] ?? [];
  // Kata kunci disembunyikan saat peta tampil; S9 SECRET sengaja tetap
  // tampil saat foto muncul (kata di top 380, foto di top 560).
  const activeBeatWords = bws.filter((bw) => !showMap && local >= bw.at && local < bw.at + bw.dur);

  const Current = SCENES[scene];
  return (
    <AbsoluteFill style={{ background: "#3a4a2a" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: "50% 55%" }}>
        <World3D scene={scene} local={local} />
        {!showMap && !showPhoto && <Current local={local} />}
        {showMap && <MapOverlay local={local} />}
        {showPhoto && <PhotoFrame />}
      </div>
      {showLabel && label && <DateLabel text={label} />}
      {activeBeatWords.map((bw) => (
        <BeatWord key={bw.word} word={bw.word} local={local - bw.at} fontSize={bw.fontSize} />
      ))}
      {phrase && <KaraokeText phrase={phrase.phrase} />}
    </AbsoluteFill>
  );
};
