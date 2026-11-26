// "TobaTestV2": TEST composition v2, Danau Toba, Bahasa Indonesia.
// v4 (2026-11-26): KARAKTER DIBANGUN ULANG JADI BEAN-HEAD (basis v01/toon.ts
// Bajak Jawa / Negara Sistem Bobrok, arahan bill 10:13 WIB) + EKSPRESI
// HIDUP dari 5 referensi stikman (toba-test-v2/ref/). Bukan stikman generik:
// kepala superellipse bean (mahkota agak runcing, rahang penuh, dagu
// meruncing), kulit peach #ffe2c2, outline plum #241726, shading crescent
// lembut di sisi jauh cahaya, mata lidded datar ala toon.ts, torso bean,
// lengan/kaki stroke tunggal garis tipis + tangan titik tinta + kaki datar.
// Kepala BESAR 38% tinggi karakter (200 dari 520), badan bulat pendek,
// karakter 50-70% tinggi frame. Ekspresi per adegan: S1 takjub, S2 serius +
// keringat, S3 khawatir, S4 kaget, S5 mata bintang, S6 senyum, S7 ramah,
// S8 senyum puas. Mulut garis lurus kecil / "o" kecil saat bicara, BUKAN
// oval merah besar (kecuali "O" kaget dan senyum lebar).
//
// YANG TETAP: cerita/naskah sama; 8 adegan sama; karaoke.ts dan
// TOTAL_FRAMES 1396 (timing terukur VO m41, jangan diubah); VO; teks
// karaoke Poppins ExtraBold putih outline hitam tebal kata per kata;
// dunia 3D world3d.tsx.
//
// TIMING: karaoke.ts adalah SATU-SATUNYA sumber timing teks (TERUKUR dari VO
// v2, karaoke.json, mix 46,528 dtk / 1396 frame, voice vg_id_m41 speed 120).
// Adegan diturunkan dari baris frasa yang sedang aktif (S1=L1-2, S2=L3,
// S3=L4-5, S4=L6, S5=L7, S6=L8, S7=L9, S8=L10). TOTAL_FRAMES = 1396.
// v5 (2026-11-26): OUTFIT DEFAULT = C flanel (pilihan bill 10:36 WIB):
// flanel kotak-kotak merah terbuka di atas kaos putih + jeans biru +
// sneakers putih + rambut messy modern, di semua 8 adegan. Kakek S7 tetap
// baju lama + sarung (tidak pakai outfit). Badan tetap kapsul ramping
// 130x190. Tahap 5 motion: kamera + langkah + S3/S4/S5 di-ease (lihat
// motion-tabel.md); tidak ada gerakan linear spasial tersisa.
import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { KARAOKE } from "./karaoke";
import { World3D } from "./world3d";

const W = 1080;
const H = 1920;
const TOTAL_FRAMES = 1396;

const BEANIE_YELLOW = "#f2c230"; // yellow knit beanie (guide), from bill's reference image
const BEANIE_DARK = "#d9a521";
const INK = "#241726"; // plum ink, bean-head canon (v01/toon.ts), bukan hitam pekat
const SKIN = "#ffe2c2"; // peach skin, bean-head canon
const SKIN_SHADE = "#f0c09e"; // crescent shading di sisi jauh cahaya
const MOUTH_DARK = "#5a1e28"; // mulut terbuka kecil (toon.ts MOUTH)
const GREEN_SHIRT = "#2fa383"; // teal/tosca shirt, from bill's reference image
const JEANS = "#4a7ab5"; // denim biru (celana jeans varian anak muda)
const JEANS_DARK = "#2f5d8a"; // denim gelap (pinggang/outline jeans)
const CAP_RED = "#d93a2e"; // topi merah (varian B, seperti topi tukang las)
const FLANEL_RED = "#c0392b"; // flanel kotak-kotak merah (varian C)
const SWEAT = "#9fd4ff"; // tetes keringat biru (toon.ts nervous)

/* ------------------------------------------------------------------ */
/* Character: BEAN-HEAD (basis v01/toon.ts) + ekspresi hidup.          */
/* Kotak natural 360 x 520 (kaki menapak y=500). Kepala bean 200x192   */
/* = 38% tinggi total. Badan ramping 130x190 (kapsul, 65% lebar kepala,  */
/* sesuai 5 referensi stikman: badan selalu jauh lebih ramping dari     */
/* kepala). Lengan/kaki stroke tipis plum, kaki datar kecil. Digambar   */
/* sebagai SATU SVG supaya bentuk bean, outline tebal-tipis, crescent,  */
/* ekspresif (bintang, keringat, kumis, alis) bisa digambar presisi.   */
/* Gerakan: bob naik-turun ritmis, kaki melangkah bergantian (walk),   */
/* lengan mengayun, mata berkedip tiap ~3 detik, mulut buka-tutup      */
/* kecil saat bicara.                                                   */
/* ------------------------------------------------------------------ */

type CharKind = "guide" | "elder";
type CharPose = "stand" | "point" | "walk" | "worried" | "smile";
/** Ekspresi wajah per adegan (rentang dari 5 referensi + toon.ts Expr). */
type Expr = "amazed" | "stern" | "worried" | "shock" | "star" | "smile" | "content";
/** Varian baju ANAK MUDA pemandu (arahan bill 10:30 WIB; pilihan bill
 *  10:36 WIB = C flanel, jadi DEFAULT di TobaTestV2). A = hoodie,
 *  B = kaos + topi terbalik, C = flanel kotak-kotak merah di atas kaos
 *  putih + jeans + sneakers. Kakek S7 TIDAK pakai outfit (tetap baju
 *  kerja lama + sarung kotak-kotak). */
type Outfit = "a" | "b" | "c";

/** ease-out-back Playful (overshoot ~10%): untuk transisi gerak karakter. */
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const u = Math.min(1, Math.max(0, t));
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

/** Bintang 4 ujung (mata bintang, toon.ts fxStars / Fafnir). */
const starPath = (cx: number, cy: number, ro = 16, ri = 6.5): string =>
  `M ${cx} ${cy - ro} L ${cx + ri * 0.7} ${cy - ri * 0.7} L ${cx + ro} ${cy} ` +
  `L ${cx + ri * 0.7} ${cy + ri * 0.7} L ${cx} ${cy + ro} L ${cx - ri * 0.7} ${cy + ri * 0.7} ` +
  `L ${cx - ro} ${cy} L ${cx - ri * 0.7} ${cy - ri * 0.7} Z`;

const BeanHead: React.FC<{
  x: number;
  y: number;
  scale?: number;
  kind?: CharKind;
  shirt?: string;
  pose?: CharPose;
  expr?: Expr;
  sarong?: boolean;
  local?: number;
  speaking?: boolean;
  outfit?: Outfit;
}> = ({
  x,
  y,
  scale = 1,
  kind = "guide",
  shirt = GREEN_SHIRT,
  pose = "stand",
  expr = "smile",
  sarong = false,
  local = 0,
  speaking = false,
  outfit,
}) => {
  const uid = useId().replace(/:/g, "");
  // Walk: march in place — kaki mengayun KELUAR bergantian, tidak pernah
  // menyilang (ayunan simetris +/- membentuk X yang terbaca kusut).
  // Di SVG rotate(+) = searah jarum jam: kaki kiri rotate(-) = kaki ke kiri.
  // Ayunan di-EASE selama 6 frame pertama tiap langkah (200 ms, Playful
  // 150-300 ms) dengan ease-out-back (overshoot ~10%), lalu TAHAN — bukan
  // snap instan. swing 1 = kaki kiri keluar.
  const walking = pose === "walk";
  const stepIdx = Math.floor(local / 12);
  const stepT = (local % 12) / 12;
  const swingAmt = easeOutBack(Math.min(1, stepT * 2));
  const swing = stepIdx % 2 === 0 ? swingAmt : 1 - swingAmt;
  const legL = walking ? -16 * swing : 0;
  const legR = walking ? 16 * (1 - swing) : 0;
  const bob = walking
    ? -Math.abs(Math.sin(local * 0.26)) * 12
    : Math.sin(local * 0.09) * 4;
  const armSwing = walking ? 14 - 28 * swing : 0;
  // Blink: mata menutup ~4 frame tiap ~90 frame.
  const blink = local % 90 < 4;
  // Mulut bicara: oval gelap KECIL (rx 10), bukan oval merah besar.
  const mouthOpen = 6 + Math.abs(Math.sin(local * 0.55)) * 5;

  const EX = 152; // mata kiri x
  const EX2 = 208; // mata kanan x
  const EY = 118; // mata y
  const MX = 180; // mulut x
  const MY = 152; // mulut y

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
        // mata lidded datar ala toon.ts: kubah setengah terisi + garis bawah
        return (
          <>
            <path d={`M ${EX - 14} ${EY} A 14 12 0 0 1 ${EX + 14} ${EY} Z`} fill={INK} />
            <line x1={EX - 15} y1={EY} x2={EX + 15} y2={EY} stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <path d={`M ${EX2 - 14} ${EY} A 14 12 0 0 1 ${EX2 + 14} ${EY} Z`} fill={INK} />
            <line x1={EX2 - 15} y1={EY} x2={EX2 + 15} y2={EY} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          </>
        );
      case "worried":
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
        // mata bahagia: lengkung ∩ (toon.ts "happy": arc 200-340)
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
        // alis terangkat tinggi
        return (
          <>
            <path d={`M ${EX - 14} ${EY - 24} Q ${EX} ${EY - 32} ${EX + 14} ${EY - 24}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <path d={`M ${EX2 - 14} ${EY - 24} Q ${EX2} ${EY - 32} ${EX2 + 14} ${EY - 24}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      case "stern":
        // alis miring ke dalam-bawah (toon.ts stern: brow [3,-2])
        return (
          <>
            <line x1={EX - 14} y1={EY - 24} x2={EX + 14} y2={EY - 16} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <line x1={EX2 + 14} y1={EY - 24} x2={EX2 - 14} y2={EY - 16} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      case "worried":
        // alis miring ke dalam-atas (khawatir, toon.ts nervous: brow [-3,2])
        return (
          <>
            <line x1={EX - 14} y1={EY - 16} x2={EX + 14} y2={EY - 24} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <line x1={EX2 + 14} y1={EY - 16} x2={EX2 - 14} y2={EY - 24} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      default:
        // alis santai, lengkung lembut
        return (
          <>
            <path d={`M ${EX - 13} ${EY - 20} Q ${EX} ${EY - 25} ${EX + 13} ${EY - 20}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
            <path d={`M ${EX2 - 13} ${EY - 20} Q ${EX2} ${EY - 25} ${EX2 + 13} ${EY - 20}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
    }
  };

  const mouth = () => {
    // Saat bicara, mulut jadi oval gelap KECIL — kecuali ekspresi yang
    // mulutnya memang khas (takjub "o", kaget "O", bintang senyum lebar).
    if (speaking && (expr === "stern" || expr === "worried" || expr === "smile" || expr === "content")) {
      return <ellipse cx={MX} cy={MY} rx={10} ry={mouthOpen} fill={MOUTH_DARK} stroke={INK} strokeWidth={3} />;
    }
    switch (expr) {
      case "amazed":
        return <ellipse cx={MX + 4} cy={MY} rx={7} ry={8} fill={MOUTH_DARK} stroke={INK} strokeWidth={3} />;
      case "shock":
        return <ellipse cx={MX} cy={MY + 2} rx={15} ry={18} fill={MOUTH_DARK} stroke={INK} strokeWidth={4} />;
      case "stern":
        // cemberut kecil (toon.ts frown: lengkung ∩)
        return <path d={`M ${MX - 12} ${MY + 6} A 13 9 0 0 1 ${MX + 12} ${MY + 6}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      case "worried":
        // mulut gelombang kecil (toon.ts wave)
        return <path d={`M ${MX - 14} ${MY} Q ${MX - 7} ${MY - 5} ${MX} ${MY} Q ${MX + 7} ${MY + 5} ${MX + 14} ${MY}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
      case "star":
      case "smile":
        // senyum lebar (toon.ts smileWide)
        return <path d={`M ${MX - 20} ${MY - 4} A 20 12 0 0 0 ${MX + 20} ${MY - 4}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      case "content":
        // senyum puas, lebih lembut
        return <path d={`M ${MX - 14} ${MY - 2} A 14 9 0 0 0 ${MX + 14} ${MY - 2}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      default:
        return <line x1={MX - 12} y1={MY} x2={MX + 12} y2={MY - 1} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    }
  };

  const sweat = expr === "stern" || expr === "worried";
  const moustache = kind === "elder";

  // Lengan: kiri menggantung / mengayun; kanan menggantung, menunjuk
  // (pose point), atau merenggang khawatir.
  const armLPath = pose === "worried" ? "M115,228 Q89,276 85,322" : "M115,228 Q101,282 107,336";
  const armLHand: [number, number] = pose === "worried" ? [85, 322] : [107, 336];
  const armRPath =
    pose === "point"
      ? "M245,228 Q289,198 311,166"
      : pose === "worried"
        ? "M245,228 Q271,276 275,322"
        : "M245,228 Q259,282 253,336";
  const armRHand: [number, number] =
    pose === "point" ? [311, 166] : pose === "worried" ? [275, 322] : [253, 336];

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
          <pattern id={`flanel-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill={FLANEL_RED} />
            <rect width="12" height="12" fill="#8e2a22" />
            <rect x="12" y="12" width="12" height="12" fill="#8e2a22" />
            <rect x="0" y="11" width="24" height="2" fill="#f5f2ea" opacity="0.45" />
            <rect x="11" y="0" width="2" height="24" fill="#f5f2ea" opacity="0.45" />
          </pattern>
          <linearGradient id={`shirt-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#38b28f" />
            <stop offset="0.45" stopColor={shirt} />
            <stop offset="1" stopColor="#238a6d" />
          </linearGradient>
          <pattern id={`sarong-${uid}`} width="26" height="26" patternUnits="userSpaceOnUse">
            <rect width="26" height="26" fill="#f5f2ea" />
            <rect width="13" height="13" fill="#2b5aa8" />
            <rect x="13" y="13" width="13" height="13" fill="#2b5aa8" />
          </pattern>
        </defs>

        {/* kaki: varian anak muda = celana jeans (denim, garis tebal dobel)
            + sneakers putih kecil; baju lama = garis tipis + kaki datar. */}
        {outfit ? (
          <>
            <g transform={`rotate(${legL} 160 378)`}>
              <line x1={160} y1={378} x2={157} y2={492} stroke={JEANS_DARK} strokeWidth={18} strokeLinecap="round" />
              <line x1={160} y1={378} x2={157} y2={492} stroke={JEANS} strokeWidth={13} strokeLinecap="round" />
              <rect x={136} y={486} width={42} height={17} rx={8} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
              <line x1={139} y1={499} x2={175} y2={499} stroke={INK} strokeWidth={2} opacity={0.4} />
              <line x1={152} y1={489} x2={152} y2={494} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
              <line x1={160} y1={489} x2={160} y2={494} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            </g>
            <g transform={`rotate(${legR} 200 378)`}>
              <line x1={200} y1={378} x2={203} y2={492} stroke={JEANS_DARK} strokeWidth={18} strokeLinecap="round" />
              <line x1={200} y1={378} x2={203} y2={492} stroke={JEANS} strokeWidth={13} strokeLinecap="round" />
              <rect x={182} y={486} width={42} height={17} rx={8} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
              <line x1={185} y1={499} x2={221} y2={499} stroke={INK} strokeWidth={2} opacity={0.4} />
              <line x1={198} y1={489} x2={198} y2={494} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
              <line x1={206} y1={489} x2={206} y2={494} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
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

        {/* badan ramping: kapsul (130x190), outline plum. Varian C (flanel)
            badannya kaos putih, flanelnya jadi panel di sisi; A/B tosca. */}
        <path
          d="M180,198 C220,198 245,228 245,286 C245,340 220,388 180,388 C140,388 115,340 115,286 C115,228 140,198 180,198 Z"
          fill={outfit === "c" ? "#f7f4ec" : `url(#shirt-${uid})`}
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {!outfit && (
          <>
            {/* saku krem di dada + garis lipatan saku (baju lama) */}
            <rect x={158} y={258} width={44} height={52} rx={6} fill="#f5ecd7" stroke={INK} strokeWidth={4} />
            <line x1={161} y1={272} x2={199} y2={272} stroke={INK} strokeWidth={3} opacity={0.7} />
            {/* kancing di bawah saku (baju lama) */}
            <circle cx={180} cy={328} r={5} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={352} r={5} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            {/* garis hem baju (baju lama) */}
            <line x1={124} y1={364} x2={236} y2={364} stroke={INK} strokeWidth={3} opacity={0.3} />
          </>
        )}
        {outfit === "a" && (
          <>
            {/* hoodie: saku kanguru di depan + tali serut di leher */}
            <path d="M138,316 L222,316 L214,366 Q180,376 146,366 Z" fill="#238a6d" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <line x1={141} y1={320} x2={156} y2={342} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
            <line x1={219} y1={320} x2={204} y2={342} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
            <line x1={168} y1={212} x2={166} y2={246} stroke="#f5ecd7" strokeWidth={4} strokeLinecap="round" />
            <line x1={192} y1={212} x2={194} y2={246} stroke="#f5ecd7" strokeWidth={4} strokeLinecap="round" />
            <circle cx={166} cy={250} r={4} fill="#f5ecd7" stroke={INK} strokeWidth={2.5} />
            <circle cx={194} cy={250} r={4} fill="#f5ecd7" stroke={INK} strokeWidth={2.5} />
            {/* garis hem hoodie */}
            <line x1={124} y1={378} x2={236} y2={378} stroke={INK} strokeWidth={3} opacity={0.3} />
          </>
        )}
        {outfit === "b" && (
          <>
            {/* kaos polos: kerah crew di leher + garis hem */}
            <path d="M146,204 Q180,226 214,204" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <path d="M152,212 Q180,230 208,212" fill="none" stroke="#1e7a5f" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
            <line x1={124} y1={364} x2={236} y2={364} stroke={INK} strokeWidth={3} opacity={0.3} />
          </>
        )}
        {outfit === "c" && (
          <>
            {/* flanel terbuka: panel kotak-kotak di sisi badan, kaos putih
                di tengah, kerah flanel segitiga di leher */}
            <g clipPath={`url(#body-${uid})`}>
              <rect x={100} y={190} width={64} height={210} fill={`url(#flanel-${uid})`} />
              <rect x={196} y={190} width={64} height={210} fill={`url(#flanel-${uid})`} />
            </g>
            <line x1={164} y1={206} x2={164} y2={382} stroke={INK} strokeWidth={3} opacity={0.6} />
            <line x1={196} y1={206} x2={196} y2={382} stroke={INK} strokeWidth={3} opacity={0.6} />
            <path d="M148,200 L180,200 L166,228 Z" fill={`url(#flanel-${uid})`} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <path d="M212,200 L180,200 L194,228 Z" fill={`url(#flanel-${uid})`} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          </>
        )}
        {/* garis pinggang jeans tipis di bawah badan (varian anak muda) */}
        {outfit && (
          <>
            <rect x={146} y={380} width={68} height={12} rx={5} fill={JEANS_DARK} stroke={INK} strokeWidth={3} />
            <circle cx={180} cy={386} r={3} fill="#f5ecd7" stroke={INK} strokeWidth={2} />
          </>
        )}

        {/* sarung kotak-kotak biru-putih (kakek), menutup pangkal kaki */}
        {sarong && (
          <rect x={120} y={384} width={120} height={88} rx={8} fill={`url(#sarong-${uid})`} stroke={INK} strokeWidth={5} />
        )}

        {/* hoodie (varian A): tudung menggembung di kiri-kanan leher,
            digambar sebelum lengan dan kepala supaya tampak di belakang */}
        {outfit === "a" && (
          <>
            <path
              d="M132,196 C112,200 104,222 110,244 C114,260 128,264 140,256 L146,240 C150,222 146,206 132,196 Z"
              fill="#238a6d"
              stroke={INK}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            <path
              d="M228,196 C248,200 256,222 250,244 C246,260 232,264 220,256 L214,240 C210,222 214,206 228,196 Z"
              fill="#238a6d"
              stroke={INK}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            <path d="M120,210 Q128,226 126,242" fill="none" stroke={INK} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
            <path d="M240,210 Q232,226 234,242" fill="none" stroke={INK} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
          </>
        )}

        {/* lengan: stroke tipis gelap + tangan titik tinta */}
        <g transform={`rotate(${armSwing} 115 228)`}>
          <path d={armLPath} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <circle cx={armLHand[0]} cy={armLHand[1]} r={6.5} fill={INK} />
        </g>
        <g transform={`rotate(${-armSwing} 245 228)`}>
          <path d={armRPath} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <circle cx={armRHand[0]} cy={armRHand[1]} r={6.5} fill={INK} />
        </g>

        {/* kepala bean: mahkota agak runcing, rahang penuh, dagu meruncing */}
        <path
          d="M180,6 C235,6 278,48 278,100 C278,150 250,192 180,200 C110,192 82,150 82,100 C82,48 125,6 180,6 Z"
          fill={SKIN}
          stroke={INK}
          strokeWidth={7}
          strokeLinejoin="round"
        />
        {/* crescent shading lembut di sisi kanan-bawah (jauh dari cahaya) */}
        <g clipPath={`url(#head-${uid})`}>
          <path d="M252,36 C276,72 280,132 250,188 C264,140 264,82 252,36 Z" fill={SKIN_SHADE} opacity={0.7} />
        </g>
        {/* outline tebal-tipis: busur lebih tebal di kanan-bawah (jauh cahaya) */}
        <path d="M262,60 C276,100 272,150 238,182" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={0.55} />

        {/* pemandu: beanie kuning rajut + poni rambut di bawah brim (baju lama).
            Varian anak muda: rambut messy modern, tanpa beanie. */}
        {kind === "guide" && !outfit && (
          <>
            <path d="M82,64 C82,20 128,4 180,4 C232,4 278,20 278,64 Z" fill={BEANIE_YELLOW} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            {[112, 142, 172, 202, 232, 258].map((rx) => (
              <line key={rx} x1={rx} y1={16} x2={rx} y2={58} stroke="#000000" strokeWidth={4} opacity={0.16} />
            ))}
            <rect x={78} y={56} width={204} height={26} rx={10} fill={BEANIE_DARK} stroke={INK} strokeWidth={5} />
            {/* poni: bar hitam + 6 ujung membulat di bawah brim */}
            <rect x={92} y={80} width={176} height={12} fill={INK} />
            {[105, 135, 165, 195, 225, 255].map((cx) => (
              <circle key={cx} cx={cx} cy={90} r={10} fill={INK} />
            ))}
          </>
        )}
        {/* rambut messy modern (varian A hoodie + varian C flanel): mahkota
            halus menutup penuh + poni zigzag, di-clip ke bentuk kepala;
            3 jambul runcing mencuat di atas mahkota */}
        {kind === "guide" && (outfit === "a" || outfit === "c") && (
          <>
            <g clipPath={`url(#head-${uid})`}>
              <path
                d="M82,112 C82,44 128,6 180,6 C232,6 278,44 278,112 C264,88 252,98 240,76 C228,96 214,74 200,88 C186,70 172,90 158,74 C144,94 130,72 116,92 C102,74 92,94 82,112 Z"
                fill={INK}
              />
            </g>
            <path d="M136,16 L148,0 L160,16 Z" fill={INK} />
            <path d="M172,16 L184,0 L196,16 Z" fill={INK} />
            <path d="M206,16 L218,2 L230,16 Z" fill={INK} />
          </>
        )}
        {/* topi merah TERBALIK (varian B): kubah + kancing atas, brim ke
            belakang (kanan layar), poni messy terlihat di bawah topi */}
        {kind === "guide" && outfit === "b" && (
          <>
            <path d="M82,64 C82,20 128,4 180,4 C232,4 278,20 278,64 Z" fill={CAP_RED} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <line x1={180} y1={10} x2={180} y2={58} stroke="#8e2a22" strokeWidth={3} opacity={0.6} />
            <line x1={128} y1={18} x2={140} y2={56} stroke="#8e2a22" strokeWidth={3} opacity={0.6} />
            <line x1={232} y1={18} x2={220} y2={56} stroke="#8e2a22" strokeWidth={3} opacity={0.6} />
            <circle cx={180} cy={8} r={6} fill="#b02a20" stroke={INK} strokeWidth={3} />
            <g transform="rotate(-10 272 60)">
              <rect x={268} y={50} width={46} height={18} rx={9} fill={CAP_RED} stroke={INK} strokeWidth={4} />
            </g>
            {/* poni messy di bawah tepi topi */}
            <rect x={92} y={80} width={176} height={12} fill={INK} />
            {[105, 135, 165, 195, 225, 255].map((cx) => (
              <circle key={cx} cx={cx} cy={90} r={10} fill={INK} />
            ))}
          </>
        )}
        {/* kakek: topi rambut hitam + headband polkadot cokelat */}
        {kind === "elder" && (
          <>
            <path d="M86,90 C86,36 132,8 180,8 C228,8 274,36 274,90 Z" fill={INK} />
            <rect x={84} y={80} width={192} height={20} rx={6} fill="#7a4a2b" stroke={INK} strokeWidth={4} />
            {[100, 118, 136, 154, 172, 190, 208, 226, 244, 262].map((cx) => (
              <circle key={cx} cx={cx} cy={90} r={3.5} fill="#ffffff" />
            ))}
          </>
        )}

        {/* wajah: alis, mata, kumis (kakek), mulut, keringat */}
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
      </svg>
    </div>
  );
};

/** Bayangan kontak kecil di bawah kaki bean-head supaya ia "menapak" di
 *  tanah dunia 3D (x, y, scale sama dengan BeanHead yang dibayanginya). */
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

/** Karaoke text: one phrase at a time, Poppins ExtraBold, white with thick
 *  black outline, single line, center-lower (60-75% of frame height).
 *  Font size auto-fits the phrase into ~1020 px (cap 170 px, floor 95 px)
 *  so long phrases stay on one line. */
const fitFontSize = (phrase: string): number => {
  const est = phrase.length * 0.68; // conservative em-width of Poppins ExtraBold lowercase (wide letters like m/g/a)
  return Math.max(90, Math.min(170, Math.floor(1000 / est)));
};

const KaraokeText: React.FC<{ phrase: string }> = ({ phrase }) => {
  const outline =
    "0 7px 0 #111111, 7px 0 0 #111111, -7px 0 0 #111111, 0 -7px 0 #111111, 5px 5px 0 #111111, -5px 5px 0 #111111, 5px -5px 0 #111111, -5px -5px 0 #111111, 0 10px 20px rgba(0,0,0,0.35)";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 470,
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

/* ------------------------------------------------------------------ */
/* SCENES — 8 adegan, hard cut. Tiap Scene HANYA overlay karakter 2D  */
/* (posisi/skala/pose/ekspresi di bawah) + bayangan kontak; latarnya   */
/* dunia 3D dari world3d.tsx yang dirender di bawahnya. Kaki menapak  */
/* di y + 500*scale (kotak 360x520): posisi y dihitung dari target    */
/* kaki per adegan (S1 1480, S2 1650, S3 1600, S4 1565, S5/S6 1500,    */
/* S7 1650, S8 1550). Kepala 200*scale — wajah selalu di atas pita    */
/* teks karaoke (teks mulai ~y 1270); teks boleh menutupi badan/kaki.  */
/* ------------------------------------------------------------------ */

const Scene1: React.FC<{ local: number; speaking: boolean; outfit?: Outfit }> = ({ local, speaking, outfit }) => (
  <AbsoluteFill>
    <ContactShadow x={150} y={430} scale={2.1} />
    <BeanHead x={150} y={430} scale={2.1} kind="guide" pose="point" expr="amazed" speaking={speaking} local={local} outfit={outfit} />
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number; speaking: boolean; outfit?: Outfit }> = ({ local, speaking, outfit }) => (
  <AbsoluteFill>
    <ContactShadow x={90} y={650} scale={2.0} />
    <BeanHead x={90} y={650} scale={2.0} kind="guide" pose="worried" expr="stern" speaking={speaking} local={local} outfit={outfit} />
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number; speaking: boolean; outfit?: Outfit }> = ({ local, speaking, outfit }) => (
  <AbsoluteFill>
    <ContactShadow x={300} y={550} scale={2.1} />
    <BeanHead x={300} y={550} scale={2.1} kind="guide" pose="worried" expr="worried" speaking={speaking} local={local} outfit={outfit} />
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number; speaking: boolean; outfit?: Outfit }> = ({ local, speaking, outfit }) => (
  <AbsoluteFill>
    <ContactShadow x={340} y={615} scale={1.9} />
    <BeanHead x={340} y={615} scale={1.9} kind="guide" pose="worried" expr="shock" speaking={speaking} local={local} outfit={outfit} />
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number; speaking: boolean; outfit?: Outfit }> = ({ local, speaking, outfit }) => (
  <AbsoluteFill>
    <ContactShadow x={150} y={450} scale={2.1} />
    <BeanHead x={150} y={450} scale={2.1} kind="guide" pose="walk" expr="star" speaking={speaking} local={local} outfit={outfit} />
  </AbsoluteFill>
);

const Scene6: React.FC<{ local: number; speaking: boolean; outfit?: Outfit }> = ({ local, speaking, outfit }) => (
  <AbsoluteFill>
    <ContactShadow x={90} y={450} scale={2.1} />
    <BeanHead x={90} y={450} scale={2.1} kind="guide" pose="point" expr="smile" speaking={speaking} local={local} outfit={outfit} />
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number; speaking: boolean; outfit?: Outfit }> = ({ local, speaking, outfit }) => (
  <AbsoluteFill>
    {/* ayam mematuk di kiri jalan (prop 2D kecil, tetap overlay) */}
    <div style={{ position: "absolute", left: 55, top: 1500, width: 90, height: 90, transform: `rotate(${Math.sin(local * 0.35) * 7}deg)`, transformOrigin: "bottom center" }}>
      <div style={{ position: "absolute", left: 0, top: 20, width: 56, height: 40, backgroundColor: "#ffffff", border: "4px solid #141414", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 44, top: 10, width: 26, height: 26, backgroundColor: "#ffffff", border: "4px solid #141414", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 48, top: 2, width: 16, height: 12, backgroundColor: "#e74c3c", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 16, top: 60, width: 6, height: 22, backgroundColor: "#e8a34a" }} />
      <div style={{ position: "absolute", left: 36, top: 60, width: 6, height: 22, backgroundColor: "#e8a34a" }} />
    </div>
    <ContactShadow x={0} y={750} scale={1.8} />
    <BeanHead x={0} y={750} scale={1.8} kind="guide" pose="smile" expr="smile" speaking={speaking} local={local} outfit={outfit} />
    <ContactShadow x={460} y={750} scale={1.8} />
    <BeanHead x={460} y={750} scale={1.8} kind="elder" shirt="#2b2b2b" sarong pose="point" expr="smile" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene8: React.FC<{ local: number; speaking: boolean; outfit?: Outfit }> = ({ local, speaking, outfit }) => (
  <AbsoluteFill>
    <ContactShadow x={160} y={500} scale={2.1} />
    <BeanHead x={160} y={500} scale={2.1} kind="guide" pose="walk" expr="content" speaking={speaking} local={local} outfit={outfit} />
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ */
/* Scene is derived from the karaoke line ONLY.                        */
/* ------------------------------------------------------------------ */

const SCENE_LINES: number[][] = [[1, 2], [3], [4, 5], [6], [7], [8], [9], [10]];
const SCENES: React.FC<{ local: number; speaking: boolean; outfit?: Outfit }>[] = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8];

const lineToScene = (line: number): number => {
  if (line <= 2) return 0;
  if (line === 3) return 1;
  if (line <= 5) return 2;
  if (line === 6) return 3;
  if (line === 7) return 4;
  if (line === 8) return 5;
  if (line === 9) return 6;
  return 7;
};

const sceneSpan = (scene: number): [number, number] => {
  const lines = SCENE_LINES[scene];
  const ps = KARAOKE.filter((p) => lines.includes(p.line));
  return [ps[0].startFrame, ps[ps.length - 1].endFrame];
};

export const TobaTestV2: React.FC<{ outfit?: Outfit }> = ({ outfit = "c" }) => {
  const frame = useCurrentFrame();
  // Current phrase (if any); in gaps, use the NEXT phrase's line so the
  // hard cut lands when the next line starts.
  const phrase = KARAOKE.find((p) => frame >= p.startFrame && frame < p.endFrame);
  let line: number;
  if (phrase) {
    line = phrase.line;
  } else if (frame < KARAOKE[0].startFrame) {
    line = 1;
  } else {
    const next = KARAOKE.find((p) => p.startFrame > frame);
    line = next ? next.line : 10;
  }
  const scene = lineToScene(line);
  const [sStart, sEnd] = sceneSpan(scene);
  const local = Math.max(0, Math.min(frame - sStart, sEnd - sStart));
  const len = Math.max(1, sEnd - sStart);
  // Very slow zoom-in, tiny pan, over the whole scene. Ease-in-out sine
  // (bukan linear — aturan motion_design: gerakan spasial tidak linear).
  const zoom = interpolate(local, [0, len], [1, 1.02], { easing: Easing.inOut(Easing.sin) });
  const panX = interpolate(local, [0, len], [0, -6], { easing: Easing.inOut(Easing.sin) });
  const panY = interpolate(local, [0, len], [0, -4], { easing: Easing.inOut(Easing.sin) });
  const Scene = SCENES[scene];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}>
        <World3D scene={scene} local={local} />
        <Scene local={local} speaking={!!phrase} outfit={outfit} />
      </div>
      {phrase && <KaraokeText phrase={phrase.phrase} />}
    </AbsoluteFill>
  );
};

export const TOBA_TEST_V2_FRAMES = TOTAL_FRAMES;
export const TOBA_TEST_V2_SIZE = { width: W, height: H };
