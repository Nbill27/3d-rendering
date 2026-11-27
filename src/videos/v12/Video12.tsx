// "Video12": DANCING PLAGUE — History Rush #7, "A Whole Town Danced Until They Died".
// v4 (28 Nov 2026): KEMBALI ke bean-head v1 — bill menolak rebuild stikman v5
// ("jlk bgt karakternya", 28 Nov 06:37 WIB) dan minta "kaya sebelumnya ajaa".
// Karakter bean-head gaya Bajak Jawa (basis v01/toon.ts + TobaTestV2):
// kepala superellipse bean 200x192 = 38% tinggi karakter, kulit peach #ffe2c2,
// outline plum #241726, badan kapsul ramping 130x190. Kostum abad-16 Strasbourg:
// Frau Troffea gaun merah bata + celemek krem + kerudung putih; pejabat kota jubah
// gelap + topi datar; kerumunan penari baju beda warna. Wajah ekspresif per adegan.
// HOST DIHAPUS 28 Nov 2026 atas perintah bill ("karakter saya jelek"):
// karakter time-traveler TIDAK ADA lagi di video ini — adegan kembali ke
// komposisi v1 (Frau Troffea figur utama, tanpa host). Stikman v5 dicadangkan
// sebagai dancing-plague/Video12-v5-stickman.tsx (JANGAN dipakai).
// TIMING: karaoke.ts adalah SATU-SATUNYA sumber timing teks (TERUKUR dari VO,
// WhisperX tiny + align, mix 56,000 dtk / 1680 frame, suara Casper semua
// 8 baris, speed 120). Adegan diturunkan dari baris VO yang sedang aktif
// (S1=L1 ... S8=L8).
// Label tahun+tempat, shot peta (f901-991), frame foto domain publik
// (f1560-akhir) wajib sejak 27 Nov — lihat MAP_A/MAP_B/PHOTO_A.
// TOTAL_FRAMES = 1680. Subtitle Inggris burned-in, kata SAMA PERSIS dengan VO:
// fontSize 46px (auto-fit, floor 30), outline 3px, maxWidth 920, bottom 430,
// font Poppins ExtraBold weight 800 (spesifikasi Molasses).
// Semua prop dunia 3D dari boxGeo/kode (world3d.tsx); TIDAK ADA prop GLB Kenney.
import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { KARAOKE } from "./karaoke";
import { World3D } from "./world3d";

const W = 1080;
const H = 1920;
const TOTAL_FRAMES = 1680;

const INK = "#241726"; // plum ink, bean-head canon (v01/toon.ts)
const SKIN = "#ffe2c2"; // peach skin
const SKIN_SHADE = "#f0c09e";
const MOUTH_DARK = "#5a1e28";
const SWEAT = "#9fd4ff";
const DRESS_RED = "#7a3b2e";
const DRESS_BLUE = "#2e4a6e";
const DRESS_GREEN = "#4a6e3a";
const DRESS_BROWN = "#6e4a2e";
const APRON = "#e8dcc0";
const ROBE = "#2c2c3a";

/** ease-out-back Playful (overshoot ~10%): untuk transisi gerak karakter. */
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const u = Math.min(1, Math.max(0, t));
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

const starPath = (cx: number, cy: number, ro = 16, ri = 6.5): string =>
  `M ${cx} ${cy - ro} L ${cx + ri * 0.7} ${cy - ri * 0.7} L ${cx + ro} ${cy} ` +
  `L ${cx + ri * 0.7} ${cy + ri * 0.7} L ${cx} ${cy + ro} L ${cx - ri * 0.7} ${cy + ri * 0.7} ` +
  `L ${cx - ro} ${cy} L ${cx - ri * 0.7} ${cy - ri * 0.7} Z`;

type CharKind = "woman" | "official" | "crowd";
type CharPose = "stand" | "point" | "walk" | "dance" | "worried";
type Expr = "amazed" | "stern" | "worried" | "shock" | "star" | "smile" | "content" | "tired" | "puzzled";

/** STIKMAN SEJATI (v5, 28 Nov 2026, perintah bill "kita buat versi stikman"):
 *  karakter digambar ulang total dari kode, mengikuti spek
 *  STYLE-REF-BESTANIMATIONSW.md + prinsip B1 stickman-video-director:
 *  - Kepala LINGKARAN r=30 (diameter 60 = 11,5% tinggi total 520),
 *    kulit krem persik #F0C49E, outline #2B2118.
 *  - Badan SATU garis vertikal bahu (180,98) -> pinggul (180,320),
 *    warna gaun (Frau merah #B93A2E, pejabat hitam, kerumunan per baju).
 *  - Lengan/kaki GARIS TIPIS 9 unit (~1,7% lebar frame pada skala 2,1)
 *    dengan sendi titik; lengan Frau kuning moster #D9A441, kaki biru-abu
 *    #55677A, sepatu oval cokelat #7A4A2B. Tanpa jari, tanpa gaun berisi,
 *    tanpa panel dada/tali/keranjang.
 *  - Identitas lewat penutup kepala: Frau kerudung putih, pejabat topi
 *    tinggi hitam, kerumunan kerudung putih / topi hijau (fase ganjil).
 *  - Ekspresi dilebihkan (B1): mata oval besar saat takjub, alis terangkat/
 *    miring, mulut berubah jelas; keringat biru #7FB3D5.
 *  Gerak: tari = kaki rotate bergantian + badan goyang +-6 derajat
 *  (putar di kaki, bukan drift); jalan = kaki translateY lift bergantian
 *  20 px (aturan bill, pola Wojtek); berdiri bob = 0. */
const BeanHead: React.FC<{
  x: number;
  y: number;
  scale?: number;
  kind?: CharKind;
  shirt?: string;
  pose?: CharPose;
  expr?: Expr;
  local?: number;
  speaking?: boolean;
  phase?: number;
}> = ({
  x, y, scale = 1, kind = "woman", shirt = DRESS_RED, pose = "stand",
  expr = "smile", local = 0, speaking = false, phase = 0,
}) => {
  const uid = useId().replace(/:/g, "");
  const dancing = pose === "dance";
  const walking = pose === "walk";
  // Langkah tari: kaki mengayun bergantian (rotate), tidak pernah menyilang.
  const stepIdx = Math.floor((local + phase) / 12);
  const stepT = ((local + phase) % 12) / 12;
  const swingAmt = easeOutBack(Math.min(1, stepT * 2));
  const swing = stepIdx % 2 === 0 ? swingAmt : 1 - swingAmt;
  const legAmp = 20;
  const legL = dancing ? -legAmp * swing : 0;
  const legR = dancing ? legAmp * (1 - swing) : 0;
  // Langkah jalan (aturan bill 27 Nov, pola Wojtek v16): kaki KANAN lalu
  // KIRI bergantian MENGANGKAT KE ATAS (translateY, sinus 12 f/langkah,
  // lift 20 px), BUKAN rotate/scissor. Badan maju lewat y/scale di Scene.
  const liftPhase = Math.sin(stepT * Math.PI);
  const LIFT = 20;
  const leftLifting = stepIdx % 2 === 0;
  const liftL = walking && leftLifting ? LIFT * liftPhase : 0;
  const liftR = walking && !leftLifting ? LIFT * liftPhase : 0;
  // Bob berdiri = 0 (koreksi bill 27 Nov): karakter diam tidak boleh
  // bergoyang. Bob hanya untuk dance/walk.
  const bob = dancing
    ? -Math.abs(Math.sin((local + phase) * 0.26)) * 14
    : walking
      ? -Math.abs(Math.sin((local + phase) * 0.26)) * 12
      : 0;
  const armSwing = dancing ? 20 - 40 * swing : 0;
  const armLiftL = walking && !leftLifting ? 6 * liftPhase : 0;
  const armLiftR = walking && leftLifting ? 6 * liftPhase : 0;
  const blink = (local + phase) % 90 < 4;
  const mouthOpen = 6 + Math.abs(Math.sin((local + phase) * 0.55)) * 5;

  const EX = 152;
  const EX2 = 208;
  const EY = 118;
  const MX = 180;
  const MY = 152;

  const eyes = () => {
    if (blink || expr === "tired") {
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
      case "puzzled":
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
      case "tired":
        return (
          <>
            <line x1={EX - 14} y1={EY - 16} x2={EX + 14} y2={EY - 24} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <line x1={EX2 + 14} y1={EY - 16} x2={EX2 - 14} y2={EY - 24} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      case "puzzled":
        // satu alis terangkat, satu datar
        return (
          <>
            <path d={`M ${EX - 14} ${EY - 26} Q ${EX} ${EY - 34} ${EX + 14} ${EY - 26}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <path d={`M ${EX2 - 13} ${EY - 20} Q ${EX2} ${EY - 25} ${EX2 + 13} ${EY - 20}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
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
    if (speaking && (expr === "stern" || expr === "worried" || expr === "smile" || expr === "content" || expr === "puzzled")) {
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
      case "tired":
        return <path d={`M ${MX - 14} ${MY} Q ${MX - 7} ${MY - 5} ${MX} ${MY} Q ${MX + 7} ${MY + 5} ${MX + 14} ${MY}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
      case "puzzled":
        return <path d={`M ${MX - 10} ${MY} L ${MX + 12} ${MY - 4}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      case "star":
      case "smile":
        return <path d={`M ${MX - 20} ${MY - 4} A 20 12 0 0 0 ${MX + 20} ${MY - 4}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      case "content":
        return <path d={`M ${MX - 14} ${MY - 2} A 14 9 0 0 0 ${MX + 14} ${MY - 2}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      default:
        return <line x1={MX - 12} y1={MY} x2={MX + 12} y2={MY - 1} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    }
  };

  const sweat = expr === "stern" || expr === "worried" || expr === "tired";
  const isOfficial = kind === "official";
  // Lengan: tari = terangkat ke atas; point = menunjuk; worried = merenggang.
  const armLPath = dancing
    ? "M115,228 Q80,170 92,108"
    : pose === "point"
      ? "M115,228 Q101,282 107,336"
      : pose === "worried"
        ? "M115,228 Q89,276 85,322"
        : "M115,228 Q101,282 107,336";
  const armLHand: [number, number] = dancing ? [92, 108] : pose === "worried" ? [85, 322] : [107, 336];
  const armRPath = dancing
    ? "M245,228 Q280,170 268,108"
    : pose === "point"
      ? "M245,228 Q289,198 311,166"
      : pose === "worried"
        ? "M245,228 Q271,276 275,322"
        : "M245,228 Q259,282 253,336";
  const armRHand: [number, number] = dancing ? [268, 108] : pose === "point" ? [311, 166] : pose === "worried" ? [275, 322] : [253, 336];

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

        {/* kaki jalan: translateY lift bergantian (Wojtek). Kaki tari:
            rotate scissor seperti dulu. garis tipis + sepatu datar. */}
        {walking ? (
          <>
            {/* sepatu 14 px DI BAWAH keliman rok (y510 vs keliman y492):
                saat kaki di bawah, sepatu tampak di bawah rok; saat kaki
                terangkat (lift -20), sepatu naik ke y490 dan hilang di
                balik rok. Jadi angkatan kaki kanan/kiri BERGANTIAN terbaca
                sebagai sepatu yang muncul-hilang selang-seling. */}
            <g transform={`translate(0 ${-liftL})`}>
              <line x1={160} y1={378} x2={157} y2={506} stroke={INK} strokeWidth={9} strokeLinecap="round" />
              <line x1={141} y1={510} x2={173} y2={510} stroke={INK} strokeWidth={10} strokeLinecap="round" />
            </g>
            <g transform={`translate(0 ${-liftR})`}>
              <line x1={200} y1={378} x2={203} y2={506} stroke={INK} strokeWidth={9} strokeLinecap="round" />
              <line x1={187} y1={510} x2={219} y2={510} stroke={INK} strokeWidth={10} strokeLinecap="round" />
            </g>
          </>
        ) : (
          <>
            <g transform={`rotate(${legL} 160 378)`}>
              <line x1={160} y1={378} x2={157} y2={492} stroke={INK} strokeWidth={9} strokeLinecap="round" />
              <line x1={141} y1={496} x2={173} y2={496} stroke={INK} strokeWidth={10} strokeLinecap="round" />
            </g>
            <g transform={`rotate(${legR} 200 378)`}>
              <line x1={200} y1={378} x2={203} y2={492} stroke={INK} strokeWidth={9} strokeLinecap="round" />
              <line x1={187} y1={496} x2={219} y2={496} stroke={INK} strokeWidth={10} strokeLinecap="round" />
            </g>
          </>
        )}


        {/* gaun (wanita/kerumunan): rok trapesium di bawah bodice kapsul.
            Pejabat: jubah gelap panjang menutup kaki. */}
        {isOfficial ? (
          <path
            d="M180,198 C220,198 245,228 245,286 C245,360 232,440 224,492 L136,492 C128,440 115,360 115,286 C115,228 140,198 180,198 Z"
            fill={ROBE}
            stroke={INK}
            strokeWidth={6}
            strokeLinejoin="round"
          />
        ) : (
          <>
            <path
              d="M180,198 C220,198 245,228 245,286 C245,340 220,388 180,388 C140,388 115,340 115,286 C115,228 140,198 180,198 Z"
              fill={shirt}
              stroke={INK}
              strokeWidth={6}
              strokeLinejoin="round"
            />
            {/* rok: trapesium melebar ke bawah, berayun mengikuti langkah */}
            <g transform={`rotate(${Math.sin((local + phase) * 0.26) * 3} 180 388)`}>
              <path d="M132,380 L228,380 L252,492 L108,492 Z" fill={shirt} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
              <path d="M156,388 L204,388 L210,470 L150,470 Z" fill={APRON} opacity={0.92} />
              <line x1={108} y1={486} x2={252} y2={486} stroke={INK} strokeWidth={3} opacity={0.4} />
            </g>
          </>
        )}
        {/* kerah putih + bros (wanita) / kerah + rantai jabatan (pejabat) */}
        {!isOfficial && (
          <>
            <path d="M142,296 Q180,318 218,296 L216,312 Q180,330 144,312 Z" fill={APRON} />
            <circle cx={180} cy={330} r={10} fill="#c9a227" />
            <circle cx={180} cy={330} r={4} fill="#7a1e1e" />
          </>
        )}
        {isOfficial && (
          <>
            <path d="M142,296 Q180,318 218,296 L216,312 Q180,330 144,312 Z" fill="#f5f2ea" />
            <circle cx={180} cy={340} r={9} fill="#c9a227" stroke={INK} strokeWidth={3} />
          </>
        )}

        {/* lengan: stroke tipis + tangan titik tinta. Jalan: lengan
            berlawanan dengan kaki (translateY, pola Wojtek). */}
        <g transform={walking ? `translate(0 ${-armLiftL})` : `rotate(${armSwing} 115 228)`}>
          <path d={armLPath} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <circle cx={armLHand[0]} cy={armLHand[1]} r={6.5} fill={INK} />
        </g>
        <g transform={walking ? `translate(0 ${-armLiftR})` : `rotate(${-armSwing} 245 228)`}>
          <path d={armRPath} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <circle cx={armRHand[0]} cy={armRHand[1]} r={6.5} fill={INK} />
        </g>

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

        {/* kerudung putih wanita: pita di dahi + sanggul; pejabat: topi datar hitam */}
        {!isOfficial && (
          <>
            <g clipPath={`url(#head-${uid})`}>
              <path d="M82,112 C82,44 128,6 180,6 C232,6 278,44 278,112 C264,88 252,98 240,76 C228,96 214,74 200,88 C186,70 172,90 158,74 C144,94 130,72 116,92 C102,74 92,94 82,112 Z" fill="#4a3020" />
            </g>
            {/* kerudung: pita putih di dahi + ujung kain di sisi kanan */}
            <path d="M84,52 C84,22 128,6 180,6 C232,6 276,22 276,52 L276,70 L84,70 Z" fill="#f5f2ea" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M272,70 Q288,110 276,150 L262,146 Q272,110 264,72 Z" fill="#f5f2ea" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            {/* poni rambut di bawah pita kerudung */}
            <rect x={96} y={70} width={168} height={10} fill="#4a3020" />
            {[110, 138, 166, 194, 222, 250].map((cx) => (
              <circle key={cx} cx={cx} cy={80} r={9} fill="#4a3020" />
            ))}
          </>
        )}
        {isOfficial && (
          <>
            <path d="M86,90 C86,36 132,8 180,8 C228,8 274,36 274,90 Z" fill={INK} />
            <rect x={80} y={72} width={200} height={22} rx={8} fill="#1e1e28" stroke={INK} strokeWidth={4} />
          </>
        )}

        {brows()}
        {eyes()}
        {isOfficial && (
          <>
            <path d="M180,136 L150,148" stroke="#4a3020" strokeWidth={9} strokeLinecap="round" />
            <path d="M180,136 L210,148" stroke="#4a3020" strokeWidth={9} strokeLinecap="round" />
          </>
        )}
        {mouth()}
        {sweat && <ellipse cx={262} cy={92} rx={7} ry={11} fill={SWEAT} stroke={INK} strokeWidth={2.5} />}
      </svg>
    </div>
  );
};

const ContactShadow: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => {
  const w = 130 * scale;
  return (
    <div
      style={{
        position: "absolute",
        left: x + 180 * scale - w / 2,
        top: y + 496 * scale,
        width: w,
        height: 22 * scale,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 70%)",
        borderRadius: "50%",
      }}
    />
  );
};

/** Penari roboh stikman: figur berbaring khusus (SVG horizontal 360x140),
 *  kepala lingkaran di kiri, badan SATU garis horizontal, kaki terentang
 *  ke kanan. Digambar langsung berbaring, bukan BeanHead yang di-rotate
 *  (rotate wrapper pernah menendang figur keluar frame di still_600 pertama). */
const CollapsedDancer: React.FC<{ x: number; y: number; scale?: number; shirt?: string; flip?: boolean }> = ({ x, y, scale = 1, shirt = DRESS_BLUE, flip = false }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 360,
      height: 140,
      transform: `scale(${scale})${flip ? " scaleX(-1)" : ""}`,
      transformOrigin: "top left",
    }}
  >
    <svg width={360} height={140} viewBox="0 0 360 140">
      <ellipse cx={180} cy={128} rx={150} ry={10} fill="rgba(0,0,0,0.35)" />
      {/* kaki terentang + sepatu */}
      <line x1={268} y1={72} x2={338} y2={58} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <line x1={268} y1={92} x2={338} y2={104} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <line x1={330} y1={52} x2={352} y2={58} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <line x1={330} y1={98} x2={352} y2={106} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      {/* badan kapsul horizontal + celemek */}
      <rect x={96} y={52} width={180} height={62} rx={31} fill={shirt} stroke={INK} strokeWidth={5} />
      <rect x={150} y={58} width={56} height={50} rx={6} fill={APRON} opacity={0.92} />
      {/* lengan terkulai di atas badan */}
      <line x1={130} y1={66} x2={196} y2={86} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <circle cx={198} cy={87} r={6} fill={INK} />
      {/* kepala bean di kiri, mata tertutup, mulut gelombang, keringat */}
      <circle cx={66} cy={80} r={46} fill={SKIN} stroke={INK} strokeWidth={5} />
      <path d="M26,52 C26,22 46,8 66,8 C86,8 106,22 106,52 L106,60 L26,60 Z" fill="#f5f2ea" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <line x1={44} y1={78} x2={62} y2={78} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <line x1={74} y1={78} x2={92} y2={78} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M52,100 Q60,95 66,100 Q72,105 80,100" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={104} cy={46} rx={6} ry={9} fill={SWEAT} stroke={INK} strokeWidth={2} />
    </svg>
  </div>
);

/** Kerumunan kecil penari di latar (skala kecil, fase langkah acak). */
const Crowd: React.FC<{ local: number; items: { x: number; y: number; scale: number; shirt: string; phase: number; expr?: Expr }[] }> = ({ local, items }) => (
  <>
    {items.map((it, i) => (
      <React.Fragment key={i}>
        <ContactShadow x={it.x} y={it.y} scale={it.scale} />
        <BeanHead x={it.x} y={it.y} scale={it.scale} kind="crowd" shirt={it.shirt} pose="dance" expr={it.expr ?? "worried"} local={local} phase={it.phase} />
      </React.Fragment>
    ))}
  </>
);

/** Karaoke text: satu frasa, Poppins ExtraBold, putih outline hitam tebal,
 *  satu baris, bawah (marginBottom 430, spesifikasi Molasses). */
const fitFontSize = (phrase: string): number => {
  const est = phrase.length * 0.68;
  return Math.max(30, Math.min(46, Math.floor(920 / est)));
};

const KaraokeText: React.FC<{ phrase: string }> = ({ phrase }) => {
  const outline =
    "0 3px 0 #000000, 3px 0 0 #000000, -3px 0 0 #000000, 0 -3px 0 #000000, 2px 2px 0 #000000, -2px 2px 0 #000000, 2px -2px 0 #000000, -2px -2px 0 #000000, 0 6px 12px rgba(0,0,0,0.55)";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 430,
        display: "flex",
        justifyContent: "center",
        paddingLeft: 30,
        paddingRight: 30,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif",
          fontWeight: 800,
          fontSize: fitFontSize(phrase),
          lineHeight: 1.05,
          color: "#ffffff",
          textShadow: outline,
          whiteSpace: "nowrap",
        }}
      >
        {phrase}
      </div>
    </div>
  );
};

/** Label tahun + tempat (wajib sejak video 5, pola Wojtek):
 *  tampil di awal adegan. */
const DateLabel: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 110, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 44, lineHeight: 1.15, color: "#ffffff", textShadow: "0 3px 0 #000000, 3px 0 0 #000000, -3px 0 0 #000000, 0 -3px 0 #000000, 2px 2px 0 #000000, -2px 2px 0 #000000, 2px -2px 0 #000000, -2px -2px 0 #000000, 0 6px 12px rgba(0,0,0,0.55)", backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 18, padding: "14px 28px", textAlign: "center" }}>
      {text}
    </div>
  </div>
);

/** Shot peta ziarah (f901-991, di dalam L5, 90 frame): Strasbourg ->
 *  Saverne, tempat suci St. Vitus. Sketsa kartun dari kode (bukan peta
 *  geografis presisi). Bawah 500 px polos supaya caption terbaca. */
const MapOverlay: React.FC = () => (
  <div style={{ position: "absolute", left: 60, right: 60, top: 180, bottom: 560, backgroundColor: "#f2e8d0", borderRadius: 24, border: "6px solid #5d4023", boxShadow: "0 12px 32px rgba(0,0,0,0.55)", overflow: "hidden" }}>
    <div style={{ fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif", fontWeight: 800, fontSize: 46, color: "#2a2018", textAlign: "center", paddingTop: 26 }}>
      THE PILGRIMAGE
    </div>
    <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 28, color: "#5d4023", textAlign: "center", paddingTop: 6 }}>
      September 1518 &middot; Strasbourg to Saverne
    </div>
    <svg viewBox="0 0 960 860" style={{ width: "100%", height: "76%" }}>
      {/* daratan + sungai Rhine di timur (kanan) */}
      <path d="M60,80 L900,60 L920,760 L80,780 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
      <path d="M820,60 L920,60 L920,780 L820,780 Z" fill="#7ab8d9" stroke="#3a6a8a" strokeWidth={4} />
      <text x={872} y={430} fontSize={28} fontWeight={700} fill="#2c546e" transform="rotate(90 872 430)">RHINE</text>
      {/* rute putus-putus Strasbourg -> Saverne */}
      <path d="M700,560 Q560,420 470,320 Q430,280 420,230" fill="none" stroke="#241726" strokeWidth={6} strokeDasharray="18 14" />
      {/* Strasbourg, di tepi Rhine */}
      <circle cx={700} cy={560} r={26} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={700} y={610} fontSize={40} fontWeight={800} fill="#241726" textAnchor="middle">STRASBOURG</text>
      <text x={700} y={680} fontSize={28} fontWeight={700} fill="#c23a12" textAnchor="middle">JULY 1518</text>
      {/* Saverne + kapel St. Vitus */}
      <g>
        <rect x={398} y={150} width={44} height={40} fill="#f5f2ea" stroke="#241726" strokeWidth={4} />
        <path d="M392,150 L420,122 L448,150 Z" fill="#c23a12" stroke="#241726" strokeWidth={4} strokeLinejoin="round" />
        <line x1={420} y1={104} x2={420} y2={122} stroke="#241726" strokeWidth={5} strokeLinecap="round" />
        <line x1={412} y1={110} x2={428} y2={110} stroke="#241726" strokeWidth={5} strokeLinecap="round" />
      </g>
      <circle cx={420} cy={230} r={26} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={420} y={300} fontSize={40} fontWeight={800} fill="#241726" textAnchor="middle">SAVERNE</text>
      <text x={420} y={360} fontSize={28} fontWeight={700} fill="#c23a12" textAnchor="middle">SHRINE OF ST. VITUS</text>
      {/* kompas */}
      <g transform="translate(150 180)">
        <circle r={34} fill="#f2e6c4" stroke="#8a7a5a" strokeWidth={4} />
        <path d="M0,-24 L8,10 L0,4 L-8,10 Z" fill="#c0353a" />
        <text y={-40} textAnchor="middle" fontSize={28} fontWeight={800} fill="#2a2018">N</text>
      </g>
      <text x={480} y={820} textAnchor="middle" fontSize={26} fontWeight={700} fill="#5d4023">Not to scale</text>
    </svg>
  </div>
);

/** Frame foto asli domain publik (f1560-1680): ukiran Hendrik Hondius
 *  1642, dari gambar Pieter Bruegel the Elder 1564, tentang peziarah
 *  yang terkena penyakit menari yang sama di Molenbeek dekat Brussels.
 *  BUKAN Strasbourg 1518 — caption jujur di bawah (Wikimedia Commons,
 *  public domain). File: public/dancing-plague-1518.jpg (1660x2116). */
const PhotoFrame: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 240, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ backgroundColor: "#f5f2ea", padding: 18, borderRadius: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.6)", transform: "rotate(-1.5deg)" }}>
      <img src={staticFile("dancing-plague-1518.jpg")} alt="Dancers struck by the same sickness, engraving 1642 after Bruegel 1564" style={{ width: 660, height: 842, objectFit: "cover", display: "block" }} />
      <div style={{ fontFamily: "Poppins, Arial, sans-serif", fontWeight: 700, fontSize: 27, lineHeight: 1.3, color: "#2a2018", textAlign: "center", paddingTop: 14, maxWidth: 660 }}>
        Dancers struck by the same sickness — engraving 1642, after Bruegel 1564 (public domain)
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SCENES — 8 adegan, hard cut, satu adegan per baris VO.              */
/* Kaki menapak di y + 500*scale. Wajah selalu di atas pita teks       */
/* karaoke (teks mulai ~y 1430); teks boleh menutupi badan/kaki.       */
/* ------------------------------------------------------------------ */

const Scene1: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={140} y={430} scale={2.1} />
    <BeanHead x={140} y={430} scale={2.1} kind="woman" pose="dance" expr="amazed" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={140} y={430} scale={2.1} />
    <BeanHead x={140} y={430} scale={2.1} kind="woman" pose="dance" expr="tired" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={200} y={480} scale={1.9} />
    <BeanHead x={200} y={480} scale={1.9} kind="woman" pose="dance" expr="worried" speaking={speaking} local={local} />
    <Crowd
      local={local}
      items={[
        { x: 560, y: 960, scale: 0.85, shirt: DRESS_BLUE, phase: 2 },
        { x: 680, y: 1000, scale: 0.8, shirt: DRESS_GREEN, phase: 6 },
        { x: 790, y: 940, scale: 0.9, shirt: DRESS_BROWN, phase: 1 },
        { x: 600, y: 1080, scale: 0.75, shirt: DRESS_BLUE, phase: 8 },
        { x: 730, y: 1100, scale: 0.8, shirt: DRESS_RED, phase: 4 },
      ]}
    />
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={80} y={520} scale={1.9} />
    <BeanHead x={80} y={520} scale={1.9} kind="woman" pose="dance" expr="tired" speaking={speaking} local={local} />
    <Crowd
      local={local}
      items={[
        { x: 480, y: 900, scale: 0.95, shirt: DRESS_GREEN, phase: 3, expr: "tired" },
        { x: 640, y: 960, scale: 0.9, shirt: DRESS_BLUE, phase: 8, expr: "tired" },
        { x: 800, y: 880, scale: 0.9, shirt: DRESS_BROWN, phase: 5, expr: "tired" },
        { x: 560, y: 1080, scale: 0.8, shirt: DRESS_RED, phase: 10, expr: "tired" },
        { x: 740, y: 1100, scale: 0.8, shirt: DRESS_GREEN, phase: 1, expr: "tired" },
        { x: 880, y: 1040, scale: 0.75, shirt: DRESS_BLUE, phase: 6, expr: "tired" },
      ]}
    />
    {/* dua penari roboh tergeletak di depan, di atas pita teks */}
    <CollapsedDancer x={10} y={1330} scale={1.0} shirt={DRESS_BLUE} />
    <CollapsedDancer x={730} y={1360} scale={0.9} shirt={DRESS_GREEN} />
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={120} y={500} scale={2.0} />
    <BeanHead x={120} y={500} scale={2.0} kind="official" pose="point" expr="stern" speaking={speaking} local={local} />
    {/* rombongan ziarah berjalan ke kapel */}
    <ContactShadow x={560} y={980} scale={0.95} />
    <BeanHead x={560} y={980} scale={0.95} kind="woman" pose="walk" expr="worried" speaking={false} local={local} phase={3} />
    <ContactShadow x={730} y={1020} scale={0.9} />
    <BeanHead x={730} y={1020} scale={0.9} kind="crowd" shirt={DRESS_BLUE} pose="walk" expr="worried" speaking={false} local={local} phase={8} />
    <ContactShadow x={860} y={960} scale={0.85} />
    <BeanHead x={860} y={960} scale={0.85} kind="crowd" shirt={DRESS_GREEN} pose="walk" expr="tired" speaking={false} local={local} phase={5} />
  </AbsoluteFill>
);

const Scene6: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={140} y={430} scale={2.0} />
    <BeanHead x={140} y={430} scale={2.0} kind="woman" pose="stand" expr="content" speaking={speaking} local={local} />
    <ContactShadow x={80} y={1050} scale={0.9} />
    <BeanHead x={80} y={1050} scale={0.9} kind="crowd" shirt={DRESS_BLUE} pose="stand" expr="content" speaking={false} local={local} phase={2} />
    <ContactShadow x={820} y={1080} scale={0.85} />
    <BeanHead x={820} y={1080} scale={0.85} kind="crowd" shirt={DRESS_GREEN} pose="stand" expr="content" speaking={false} local={local} phase={6} />
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={140} y={430} scale={2.0} />
    <BeanHead x={140} y={430} scale={2.0} kind="woman" pose="stand" expr="puzzled" speaking={speaking} local={local} />
    <ContactShadow x={80} y={1050} scale={0.9} />
    <BeanHead x={80} y={1050} scale={0.9} kind="crowd" shirt={DRESS_BLUE} pose="stand" expr="puzzled" speaking={false} local={local} phase={2} />
    <ContactShadow x={820} y={1080} scale={0.85} />
    <BeanHead x={820} y={1080} scale={0.85} kind="crowd" shirt={DRESS_GREEN} pose="stand" expr="worried" speaking={false} local={local} phase={6} />
  </AbsoluteFill>
);

const Scene8: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={140} y={430} scale={2.1} />
    <BeanHead x={140} y={430} scale={2.1} kind="woman" pose="dance" expr="content" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const SCENE_LINES: number[][] = [[1], [2], [3], [4], [5], [6], [7], [8]];
const SCENES: React.FC<{ local: number; speaking: boolean }>[] = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8];

/** Label tahun + tempat per adegan (pola Wojtek BEAT_LABEL_TEXT). */
const BEAT_LABEL_TEXT: Record<number, string> = {
  0: "1518, Strasbourg",
  4: "September 1518, Saverne",
};

/** Peta ziarah: jendela 90 frame DI DALAM L5 Casper-only (723-1007),
 *  mulai tepat di frasa "on a pilgrimage" (896-917) sampai 991,
 *  mengiringi frasa-frasa ziarah ("to the shrine" 918-935,
 *  "of Saint Vitus," 936-960, "the saint of" 978-993). */
const MAP_A = 901;
const MAP_B = 991;
/** Foto domain publik: f1560 sampai akhir (1680). */
const PHOTO_A = 1560;

const lineToScene = (line: number): number => Math.min(7, Math.max(0, line - 1));

const sceneSpan = (scene: number): [number, number] => {
  const lines = SCENE_LINES[scene];
  const ps = KARAOKE.filter((p) => lines.includes(p.line));
  return [ps[0].startFrame, ps[ps.length - 1].endFrame];
};

export const Video12: React.FC = () => {
  const frame = useCurrentFrame();
  const phrase = KARAOKE.find((p) => frame >= p.startFrame && frame < p.endFrame);
  let line: number;
  if (phrase) {
    line = phrase.line;
  } else if (frame < KARAOKE[0].startFrame) {
    line = 1;
  } else {
    const next = KARAOKE.find((p) => p.startFrame > frame);
    line = next ? next.line : 8;
  }
  const scene = lineToScene(line);
  const [sStart, sEnd] = sceneSpan(scene);
  const local = Math.max(0, Math.min(frame - sStart, sEnd - sStart));
  const len = Math.max(1, sEnd - sStart);
  const zoom = interpolate(local, [0, len], [1, 1.02], { easing: Easing.inOut(Easing.sin) });
  // panX = 0 (geser kiri wrapper DIHAPUS — aturan bill 27 Nov, pola Wojtek:
  // geser lateral terbaca goyang kiri-kanan). Hanya zoom + panY kecil.
  const panX = 0;
  const panY = interpolate(local, [0, len], [0, -4], { easing: Easing.inOut(Easing.sin) });
  const Scene = SCENES[scene];
  const beatLabel = BEAT_LABEL_TEXT[scene];
  const showMap = frame >= MAP_A && frame < MAP_B;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}>
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

export const VIDEO12_FRAMES = TOTAL_FRAMES;
export const VIDEO12_SIZE = { width: W, height: H };
