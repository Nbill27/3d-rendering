// "Video22": Battle of Myeongnyang, History Rush #13.
// "13 Ships Beat 133. And Lost None."
// 9 adegan x 200 frame (L1 hook, L2, L3+L4, L5, L6, L7, L8 peta, L9 foto),
// 3 beat: L1-L4 (kehancuran + penolakan menyerah), L5-L6 (selat + arus),
// L7-L10 (pertempuran + hasil + twist). 2 lokasi: darat Korea +
// Selat Myeongnyang. 1 tokoh bernama: Yi Sun-sin.
// KARAKTER: Yi Sun-sin (kind "yi", jubah biru navy + topi gat hitam +
// janggut pendek), pelaut Korea (kind "sailor", jubah terang + topi gat).
// Armada Jepang HANYA kapal 3D (tidak ada komandan Jepang digambar).
// BATAS KEJUJURAN: semua fakta dari RESEARCH.md; tidak ada adegan/
// dialog/quote karangan; satu-satunya kutipan ("I still have twelve
// ships") terdokumentasi dari surat Yi. Kapal kura-kura TIDAK dipakai:
// 13 kapal Yi adalah panokseon. NADA: hormat dan serius.
// TIDAK ADA karakter duduk di video ini (aturan duduk TIDAK BERLAKU).
// TIDAK ADA anak di video ini (aturan anak TIDAK BERLAKU).
// KAMERA (aturan kamera bill 28 Nov): LOCKED-OFF; hanya 2 push-in
// (cepat 1->1.18 di hook S1, lambat 1->1.08 ke pusaran S5);
// panX = 0, panY = 0.
// GAYA @tauugaksih (aturan bill 28 Nov, berlaku semua video selanjutnya):
// palet komplementer KONSISTEN navy laut dalam #1B3A5C lawan amber/oranye
// matahari terbenam #F2A93B; SATU kata kunci BESAR per beat (13 VS 133,
// DESTROYED, 12 SHIPS, THE STRAIT, ROARING, ALONE, TURNED, NONE LOST,
// THE SEA) di tengah frame di samping karaoke; kedalaman tiga lapis
// dengan foreground framing (tebing selat, tiang dermaga, batu karang);
// motif yang diulang: pusaran/spiral arus (S5 besar, S7 di titik pasang
// berbalik, S9 kecil di laut matahari terbenam); ekspresi SNAP (mata
// "> <" marah, "^ ^" tertawa, mulut "O" kaget); S6-S7 (pertempuran)
// lebih gelap dan dingin, S9 kembali hangat amber.
// TIMING: karaoke.ts PROVISIONAL (estimasi 3 kata/detik); HARUS diganti
// timing TERUKUR WhisperX di Tahap 7.
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
const YI_NAVY = "#1b3a5c"; // jubah biru navy Laksamana Yi (palet video)
const SAILOR_LIGHT = "#d8d2c2"; // jubah terang pelaut Korea
const GAT_BLACK = "#1f1f24"; // topi gat hitam
const TROUSER = "#4a3826";
const TROUSER_DARK = "#33261a";
const BOOT = "#3a2a1a";
const SWEAT = "#9fd4ff";
const AMBER = "#f2a93b";

/* ------------------------------------------------------------------ */
/* Character: BEAN-HEAD (basis v20/Video20.tsx + v01/toon.ts).          */
/* Kotak natural 360 x 520 (kaki menapak y=500). Kepala bean 200x192   */
/* = 38% tinggi total. Badan ramping 130x190.                           */
/* Gerakan (aturan bill 27 Nov): kaki jalan KANAN lalu KIRI bergantian */
/* MENGANGKAT KE ATAS (vertikal, sinus 12 f/langkah, lift 20 px);      */
/* badan maju ke depan lewat y/scale di Scene (bukan di komponen);     */
/* bob berdiri = 0 (karakter diam benar-benar diam); bob jalan hanya   */
/* untuk pose "walk". Lengan berlawanan dengan kaki (6 px).            */
/* MULUT: bentuk tetap sesuai ekspresi, TIDAK PERNAH bergerak mengikuti */
/* narasi (aturan mulut bill 28 Nov). TIDAK ADA prop speaking.         */
/* ------------------------------------------------------------------ */

type CharKind = "yi" | "sailor";
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
  kind = "sailor",
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
        // mulut garis datar (tegas) — dulu busur senyum kecil, bentrok
        // dengan mata sipit + alis miring "stern" di still S3/S6
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

  const bodyFill = kind === "yi" ? YI_NAVY : SAILOR_LIGHT;

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
        {/* yi: ikat pinggang emas + kancing emas + kerah putih */}
        {kind === "yi" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#141c30" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill={AMBER} stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill={AMBER} stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill={AMBER} stroke={INK} strokeWidth={2.5} />
            <path d="M150,202 L180,224 L210,202 L210,214 L180,232 L150,214 Z" fill="#f5f2ea" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* sailor: ikat pinggang tali + kancing kayu + saku dada */}
        {kind === "sailor" && (
          <>
            <rect x={122} y={352} width={116} height={16} rx={5} fill="#8a7a5a" stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={360} r={4} fill="#d8cba8" stroke={INK} strokeWidth={2.5} />
            <line x1={180} y1={206} x2={180} y2={344} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#8a7a5a" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#8a7a5a" stroke={INK} strokeWidth={2.5} />
            <rect x={132} y={232} width={30} height={24} rx={4} fill="#b8b09a" stroke={INK} strokeWidth={3} />
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

        {/* topi gat (Joseon): pinggiran lebar hitam + mahkota tinggi.
            Dipakai Yi dan pelaut; Yi lebih gelap + pita emas. */}
        <ellipse cx={180} cy={52} rx={112} ry={12} fill={GAT_BLACK} stroke={INK} strokeWidth={4} />
        <path d="M118,52 C118,18 146,8 180,8 C214,8 242,18 242,52 L242,56 L118,56 Z" fill={kind === "yi" ? "#2a2a30" : "#3a3a40"} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {kind === "yi" && <line x1={122} y1={44} x2={238} y2={44} stroke={AMBER} strokeWidth={5} />}
        {/* wajah */}
        {brows()}
        {eyes()}
        {mouth()}
        {/* yi: janggut pendek gelap di bawah mulut */}
        {kind === "yi" && (
          <path d="M162,168 Q180,196 198,168 Q194,182 180,184 Q166,182 162,168 Z" fill="#3a2a2a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        )}
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

/** Surat Yi kepada raja (S3): kertas + kop "TO HIS MAJESTY" + kutipan
 *  TERDOKUMENTASI "I STILL HAVE TWELVE SHIPS" besar navy + segel merah.
 *  Kutipan dari surat Yi (RESEARCH.md), bukan dialog karangan. */
const YiLetter: React.FC<{ x: number; y: number; scale?: number; rot?: number; local?: number }> = ({ x, y, scale = 1, rot = 0, local = 0 }) => {
  const pop = local < 30 ? 0.9 + local * 0.0033 : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 340, height: 380, transform: `scale(${scale * pop}) rotate(${rot}deg)`, transformOrigin: "top left" }}>
    <svg width={340} height={380} viewBox="0 0 340 380">
      <rect x={0} y={0} width={340} height={380} rx={8} fill="#f5f2ea" stroke={INK} strokeWidth={5} />
      <text x={170} y={44} textAnchor="middle" fontSize={20} fontWeight={800} fill="#2a2a2e" fontFamily="Poppins, sans-serif">TO HIS MAJESTY</text>
      <line x1={24} y1={58} x2={316} y2={58} stroke="#2a2a2e" strokeWidth={3} />
      <text x={170} y={104} textAnchor="middle" fontSize={22} fontWeight={700} fill="#2a2a2e" fontFamily="Poppins, sans-serif">Your Majesty,</text>
      <text x={170} y={140} textAnchor="middle" fontSize={22} fontWeight={700} fill="#2a2a2e" fontFamily="Poppins, sans-serif">this vassal</text>
      <text x={170} y={176} textAnchor="middle" fontSize={22} fontWeight={700} fill="#2a2a2e" fontFamily="Poppins, sans-serif">still has</text>
      <text x={170} y={232} textAnchor="middle" fontSize={44} fontWeight={900} fill={YI_NAVY} fontFamily="Poppins, sans-serif">12 SHIPS</text>
      <text x={170} y={272} textAnchor="middle" fontSize={20} fontWeight={600} fill="#2a2a2e" fontFamily="Poppins, sans-serif">— Yi Sun-sin, 1597 —</text>
      <circle cx={60} cy={330} r={26} fill="#c23a12" stroke={INK} strokeWidth={3} />
      <text x={60} y={338} textAnchor="middle" fontSize={22} fontWeight={900} fill="#ffffff" fontFamily="Poppins, sans-serif">Y</text>
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

/** Shot peta (S8, f1541-1642): Selat Myeongnyang — Pulau Jindo (kiri),
 *  Haenam (kanan), selat sempit di tengah; panah arus 10 knot berbalik;
 *  31 kapal Jepang tenggelam ditandai X merah; 0 kapal Korea hilang;
 *  caption bawah "KOREA LOST NO SHIPS". Palet peta ikut pasangan
 *  komplementer: laut navy lawan darat amber. */
const MapOverlay: React.FC<{ local?: number }> = ({ local = 0 }) => (
  <div style={{ position: "absolute", top: 180, left: 40, width: 1000, height: 1180, zIndex: 4 }}>
    <svg width={1000} height={1180} viewBox="0 0 1080 1180" style={{ display: "block" }}>
      <rect x={0} y={0} width={1080} height={1180} rx={18} fill="#f5f2ea" stroke="#241726" strokeWidth={5} />
      <text x={540} y={62} fontSize={34} fontWeight={900} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">MYEONGNYANG STRAIT, OCT 26, 1597</text>
      {/* laut (navy) di tengah, darat (amber) di kiri-kanan */}
      <polygon points="380,100 700,100 700,1060 380,1060" fill="#1b3a5c" stroke="#241726" strokeWidth={4} />
      <polygon points="60,100 380,100 380,1060 60,1060" fill="#d8a878" stroke="#241726" strokeWidth={4} />
      <polygon points="700,100 1020,100 1020,1060 700,1060" fill="#c98a5a" stroke="#241726" strokeWidth={4} />
      {/* selat sempit: garis pantai bergerigi */}
      <path d="M380,100 L400,220 L375,380 L405,540 L380,700 L400,880 L380,1060" fill="none" stroke="#241726" strokeWidth={5} strokeLinecap="round" />
      <path d="M700,100 L680,220 L705,380 L675,540 L700,700 L680,880 L700,1060" fill="none" stroke="#241726" strokeWidth={5} strokeLinecap="round" />
      {/* label pulau + daratan */}
      <text x={220} y={300} fontSize={36} fontWeight={900} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">JINDO</text>
      <text x={220} y={340} fontSize={24} fontWeight={700} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">ISLAND</text>
      <text x={860} y={300} fontSize={36} fontWeight={900} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">HAENAM</text>
      <text x={860} y={340} fontSize={24} fontWeight={700} fill="#241726" textAnchor="middle" fontFamily="Poppins, sans-serif">MAINLAND</text>
      <text x={540} y={560} fontSize={26} fontWeight={800} fill="#ffffff" textAnchor="middle" fontFamily="Poppins, sans-serif">290 m WIDE</text>
      {/* panah arus: masuk dari selatan, berbalik ke selatan */}
      <path d="M540,1000 L540,880" stroke="#f2a93b" strokeWidth={10} strokeLinecap="round" />
      <path d="M525,910 L540,880 L555,910" fill="none" stroke="#f2a93b" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M540,880 L540,700" stroke="#f2a93b" strokeWidth={10} strokeLinecap="round" />
      <path d="M525,730 L540,700 L555,730" fill="none" stroke="#f2a93b" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M600,700 Q660,640 640,560" fill="none" stroke="#f2a93b" strokeWidth={8} strokeLinecap="round" />
      <path d="M620,560 L640,560 L635,585" fill="none" stroke="#f2a93b" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <text x={540} y={1040} fontSize={24} fontWeight={800} fill="#ffffff" textAnchor="middle" fontFamily="Poppins, sans-serif">CURRENT 10 KNOTS, THEN TURNS</text>
      {/* 13 kapal Korea (titik navy) di utara + 31 kapal Jepang tenggelam (X merah) */}
      {[
        [500, 180], [540, 170], [580, 180], [510, 210], [560, 210], [530, 240],
        [500, 260], [580, 260], [540, 290], [510, 310], [570, 310], [530, 340], [560, 340],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={8} fill="#f2a93b" stroke="#241726" strokeWidth={2} />
      ))}
      <text x={620} y={200} fontSize={24} fontWeight={800} fill="#f2a93b" textAnchor="start" fontFamily="Poppins, sans-serif">13 KOREAN SHIPS</text>
      {[
        [480, 700], [520, 730], [560, 700], [600, 730], [500, 780], [560, 780],
        [620, 700], [480, 830], [540, 830], [600, 830], [520, 880], [580, 880],
      ].map(([cx, cy], i) => (
        <g key={i} stroke="#c23a12" strokeWidth={6} strokeLinecap="round">
          <line x1={cx - 9} y1={cy - 9} x2={cx + 9} y2={cy + 9} />
          <line x1={cx + 9} y1={cy - 9} x2={cx - 9} y2={cy + 9} />
        </g>
      ))}
      <text x={620} y={800} fontSize={24} fontWeight={800} fill="#c23a12" textAnchor="start" fontFamily="Poppins, sans-serif">31 JAPANESE SHIPS LOST</text>
      {/* caption bawah */}
      <rect x={180} y={1090} width={720} height={64} rx={32} fill="#1b3a5c" stroke="#241726" strokeWidth={4} />
      <text x={540} y={1132} fontSize={32} fontWeight={900} fill="#ffffff" textAnchor="middle" fontFamily="Poppins, sans-serif">KOREA LOST NO SHIPS</text>
    </svg>
    <div style={{ textAlign: "center", marginTop: 8, fontFamily: "Poppins, sans-serif", fontSize: 20, color: "#cfe3f2", opacity: 0.6 }}>Not to scale</div>
  </div>
);

/** Frame foto asli domain publik (f1700-1800): potret Yi Sun-sin,
 *  akhir periode Joseon. File: studio/public/yi-sun-sin-portrait.jpg
 *  (Wikimedia Commons, File:이순신.jpg — Portrait of Yi Sun-sin,
 *  Busan Cultural Heritage Material No. 56, unknown artist, Dong-A
 *  University Museum; faithful reproduction of a 2D public domain work).
 *  Motif yang diulang: Yi yang sama muncul sebagai karakter 2D di S3/S6,
 *  lalu sebagai foto asli di akhir — "balasan" visual untuk twist. */
const PhotoFrame: React.FC = () => (
  <div style={{ position: "absolute", top: 560, left: 240, width: 600, zIndex: 4, transform: "rotate(-1.5deg)" }}>
    <div style={{ background: "#f5f2ea", padding: 16, paddingBottom: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.45)", borderRadius: 6 }}>
      <img src={staticFile("yi-sun-sin-portrait.jpg")} alt="Portrait of Admiral Yi Sun-sin" style={{ width: "100%", display: "block", borderRadius: 3 }} />
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 26, fontWeight: 700, color: "#241726", textAlign: "center", marginTop: 12, lineHeight: 1.3 }}>
        Admiral Yi Sun-sin, portrait from the late Joseon period
      </div>
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 20, fontWeight: 600, color: "#5a5a5a", textAlign: "center", marginTop: 4 }}>
        Portrait: public domain (Wikimedia Commons)
      </div>
    </div>
  </div>
);

const Scene1: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Hook sepenuhnya 3D: 13 panokseon vs armada Jepang di laut. */}
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Chilcheollyang sepenuhnya 3D: kapal Korea terbakar dan tenggelam. */}
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Yi berdiri diam (bob 0) menunjuk ke laut; suratnya kepada raja
        di depan. Hormat: Yi tidak digambar menyerah atau ketakutan. */}
    <ContactShadow x={100} y={680} scale={1.35} />
    <BeanHead x={100} y={680} scale={1.35} kind="yi" pose="point" expr="stern" local={local} />
    <ContactShadow x={700} y={720} scale={1.1} />
    <BeanHead x={700} y={720} scale={1.1} kind="sailor" pose="stand" expr="worried" local={local} />
    <YiLetter x={330} y={1020} scale={0.85} rot={-6} local={local} />
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Selat sempit sepenuhnya 3D: tebing Jindo + Haenam, kapal ke-13
        meluncur masuk bergabung dengan 12 kapal. */}
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Pusaran besar sepenuhnya 3D (motif yang diulang). */}
  </AbsoluteFill>
);

const Scene6: React.FC<{ local: number }> = ({ local }) => (
  <AbsoluteFill>
    {/* Yi di tepi pantai utara menunjuk ke arah armada Jepang yang masuk;
        pelaut di sampingnya memberi hormat. Kapal bendera 3D di laut. */}
    <ContactShadow x={80} y={700} scale={1.3} />
    <BeanHead x={80} y={700} scale={1.3} kind="yi" pose="point" expr="stern" local={local} />
    <ContactShadow x={700} y={720} scale={1.15} />
    <BeanHead x={700} y={720} scale={1.15} kind="sailor" pose="salute" expr="stern" local={local} />
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Pertempuran sepenuhnya 3D: pasang berbalik, kapal Jepang terdorong
        mundur, meriam chongtong menembak, kapal Korea maju. */}
  </AbsoluteFill>
);

const Scene8: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Penutup: kata kunci NONE LOST (local 0-59) lalu peta (f1541-1642).
        Peta dan kata kunci tidak tampil bersamaan. */}
  </AbsoluteFill>
);

const Scene9: React.FC<{ local: number }> = () => (
  <AbsoluteFill>
    {/* Penutup: laut matahari terbenam 3D + kata kunci THE SEA, lalu foto
        potret Yi Sun-sin (f1700-1800). */}
  </AbsoluteFill>
);

const SCENES: React.FC<{ local: number }>[] = [
  Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9,
];

const SCENE_SPANS: [number, number][] = [
  [0, 194], [195, 366], [367, 650], [651, 884], [885, 1087], [1088, 1342], [1343, 1480], [1481, 1673], [1674, 1800],
];

const sceneFromFrame = (frame: number): number => {
  const i = SCENE_SPANS.findIndex(([a, b]) => frame >= a && frame <= b);
  return i < 0 ? 0 : i;
};

const BEAT_LABEL_TEXT: Record<number, string> = {
  0: "October 26, 1597",
  1: "July 1597, Chilcheollyang",
  2: "1597, Korea",
  3: "1597, Myeongnyang Strait",
  4: "Myeongnyang Strait",
  5: "October 26, 1597",
  6: "October 26, 1597",
  7: "October 26, 1597",
  8: "1597",
};

/** Satu kata kunci BESAR per beat (aturan @tauugaksih): scene -> kata,
 *  local awal tampil, durasi (frame). S8 NONE LOST tampil sebelum peta
 *  buka (local 0-59, peta f1541); S9 THE SEA tampil di atas foto (foto
 *  f1700 di bawah kata, tidak bertabrakan: kata di top 380, foto di
 *  top 560). */
const BEAT_WORDS: Record<number, { word: string; at: number; dur: number; fontSize?: number }> = {
  0: { word: "13 VS 133", at: 0, dur: 120, fontSize: 100 },
  1: { word: "DESTROYED", at: 0, dur: 120 },
  2: { word: "12 SHIPS", at: 0, dur: 120 },
  3: { word: "THE STRAIT", at: 0, dur: 120, fontSize: 96 },
  4: { word: "ROARING", at: 0, dur: 120 },
  5: { word: "ALONE", at: 0, dur: 120 },
  6: { word: "TURNED", at: 0, dur: 120 },
  7: { word: "NONE LOST", at: 0, dur: 60, fontSize: 100 },
  8: { word: "THE SEA", at: 0, dur: 126 },
};

export const Video22: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = sceneFromFrame(frame);
  const [start] = SCENE_SPANS[scene];
  const local = frame - start;
  const showMap = frame >= MAP_A && frame < MAP_B;
  const showPhoto = frame >= PHOTO_A;
  const showLabel = !showMap && !showPhoto && local < 150;
  const label = BEAT_LABEL_TEXT[scene] ?? "";
  // KAMERA LOCKED-OFF (aturan kamera bill 28 Nov): hanya 2 push-in.
  // S1 hook: cepat 1 -> 1.18 dalam 60 frame; S5 pusaran: lambat 1 -> 1.08.
  const zoom =
    scene === 0
      ? interpolate(local, [0, 60], [1, 1.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) })
      : scene === 4
        ? interpolate(local, [0, 200], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) })
        : 1;
  const panX = 0;
  const panY = 0;

  const phrase = KARAOKE.find((p) => frame >= p.startFrame && frame <= p.endFrame);
  const bw = BEAT_WORDS[scene];
  // Kata kunci S9 (THE SEA) sengaja tetap tampil saat foto muncul
  // (kata di top 380, foto di top 560 — tidak bertabrakan); kata kunci
  // lain disembunyikan saat peta tampil.
  const showBeatWord = !!bw && !showMap && local >= bw.at && local < bw.at + bw.dur;

  const Current = SCENES[scene];
  return (
    <AbsoluteFill style={{ background: "#16324f" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: "50% 55%" }}>
        <World3D scene={scene} local={local} />
        {!showMap && !showPhoto && <Current local={local} />}
        {showMap && <MapOverlay local={local} />}
        {showPhoto && <PhotoFrame />}
      </div>
      {showLabel && label && <DateLabel text={label} />}
      {showBeatWord && bw && <BeatWord word={bw.word} local={local - bw.at} fontSize={bw.fontSize} />}
      {phrase && <KaraokeText phrase={phrase.phrase} />}
    </AbsoluteFill>
  );
};
