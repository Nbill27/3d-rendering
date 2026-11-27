// "Video14": Peshtigo Fire, History Rush #5 (pengganti Annie Taylor).
// "The Deadliest Wildfire in American History. Nobody Remembers It."
// 10 adegan (satu per baris VO), 3 beat: L1-4 (hook + kota kayu musim
// kering + angin 100 mph), L5-8 (tornado api, warga di sungai, angka
// 1,200-2,500, pertanyaan), L9-10 (peta Peshtigo vs Chicago 250 mil,
// koran Chicago + twist). KARAKTER: 3 warga generik (kind "town", prop
// town 1/2/3, konsisten di semua adegan): 1 = penebang flanel cokelat +
// suspender + topi datar (SATU-SATUNYA yang bertopi); 2 = rambut belah
// samping + celemek, tanpa topi; 3 = rambut keriting + rompi hijau gelap,
// tanpa topi. Kakek (kind "elder", ikat kepala + kumis) tidak berubah.
// Tanpa tokoh bernama, tanpa dialog — sesuai SCRIPT.md.
// BATAS KEJUJURAN: angka korban SELALU rentang 1,200-2,500; pemicu api
// TIDAK diketahui (tidak ada teori komet / sapi Mrs. O'Leary); kota hilang
// dalam "kurang dari dua jam". Foto asli domain publik: G. J. Tisdale,
// Harper's Weekly 25 Nov 1871 (Wikimedia Commons, public domain).
// TIMING: karaoke.ts adalah SATU-SATUNYA sumber timing teks (TERUKUR dari
// VO, WhisperX tiny word timings, mix 60.000 dtk / 1800 frame, voice
// avocado_v2:casper). Teks karaoke Poppins ExtraBold putih outline hitam
// tebal kata per kata; fontSize 46px, outline 3px, maxWidth 920, bottom 430
// (spesifikasi Molasses, Video05 captions.ts). Label tanggal + peta + koran
// memakai gaya teks yang sama. TOTAL_FRAMES = 1800.
import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { KARAOKE } from "./karaoke";
import { World3D } from "./world3d";

const W = 1080;
const H = 1920;
const TOTAL_FRAMES = 1800;

const BEANIE_YELLOW = "#f2c230"; // yellow knit beanie (guide), from bill's reference image
const BEANIE_DARK = "#d9a521";
const INK = "#241726"; // plum ink, bean-head canon (v01/toon.ts), bukan hitam pekat
const SKIN = "#ffe2c2"; // peach skin, bean-head canon
const SKIN_SHADE = "#f0c09e"; // crescent shading di sisi jauh cahaya
const MOUTH_DARK = "#5a1e28"; // mulut terbuka kecil (toon.ts MOUTH)
const GREEN_SHIRT = "#2fa383"; // teal/tosca shirt, from bill's reference image
// Celana wol 1871 (koreksi bill 27 Nov 13:33 WIB: baju sesuai zamannya).
// Denim jeans biru DIHAPUS: paten rivet Levi's baru 1873, jeans belum jadi
// pakaian kerja umum tahun 1871. Warga + kakek pakai celana panjang wol
// gelap (cokelat tua/arang) + sepatu bot kerja kulit, bukan jeans/sneakers.
const WOOL_TROUSER = "#4a3826"; // wol cokelat tua (celana panjang 1871)
const WOOL_TROUSER_DARK = "#33261a"; // wol gelap (outline/pinggang celana)
const BOOT = "#3a2a1a"; // kulit cokelat tua (sepatu bot kerja 1871)
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

type CharKind = "guide" | "elder" | "ed" | "town";
type CharPose = "stand" | "point" | "walk" | "worried" | "smile";
/** Ekspresi wajah per adegan (rentang dari 5 referensi + toon.ts Expr). */
type Expr = "amazed" | "stern" | "worried" | "shock" | "star" | "smile" | "content";
/** Varian baju ANAK MUDA pemandu (warisan TobaTestV2, TIDAK dipakai di
 *  v14 — tidak ada karakter guide di adegan Peshtigo; kaki varian ini
 *  sudah diganti ke celana wol + bot kerja 1871 seperti semua karakter). */
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
  /** Varian warga kota (kind "town" saja): 1 = penebang flanel +
      suspender + topi datar; 2 = belah samping + celemek; 3 = keriting
      + rompi. Konsisten per karakter di semua adegan (koreksi bill
      27 Nov 13:26 WIB: baju dan topi warga sebelumnya sama semua). */
  town?: 1 | 2 | 3;
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
  town = 1,
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
  // Bob berdiri DIHAPUS (koreksi bill 27 Nov 14:21 WIB): bob idle
  // Math.sin(local * 0.09) * 4 membuat semua karakter berdiri naik-turun
  // SERENTAK ~7-8px di layar (skala 1.8-2.0, periode ~2,3 detik), terbaca
  // seperti joget di detik 5-10. Karakter berdiri sekarang benar-benar
  // diam (bob = 0); bob jalan hanya untuk pose "walk".
  const bob = walking ? -Math.abs(Math.sin(local * 0.26)) * 12 : 0;
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
  const moustache = kind === "elder" || kind === "ed";

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
          {/* flanel COKELAT (varian warga 1): dasar cokelat #8a6a42 supaya
              identitas warna karakternya tetap, kotak lebih gelap */}
          <pattern id={`flanel-brown-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill="#8a6a42" />
            <rect width="12" height="12" fill="#6e5232" />
            <rect x="12" y="12" width="12" height="12" fill="#6e5232" />
            <rect x="0" y="11" width="24" height="2" fill="#f5f2ea" opacity="0.35" />
            <rect x="11" y="0" width="2" height="24" fill="#f5f2ea" opacity="0.35" />
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

        {/* kaki 1871 (koreksi bill 27 Nov 13:33 WIB): celana panjang wol
            gelap + sepatu bot kerja kulit untuk SEMUA karakter. Denim jeans
            biru + sneakers putih DIHAPUS (paten rivet Levi's baru 1873). */}
        {outfit ? (
          <>
            <g transform={`rotate(${legL} 160 378)`}>
              <line x1={160} y1={378} x2={157} y2={492} stroke={WOOL_TROUSER_DARK} strokeWidth={18} strokeLinecap="round" />
              <line x1={160} y1={378} x2={157} y2={492} stroke={WOOL_TROUSER} strokeWidth={13} strokeLinecap="round" />
              <rect x={136} y={484} width={44} height={20} rx={7} fill={BOOT} stroke={INK} strokeWidth={3.5} />
              <line x1={138} y1={501} x2={178} y2={501} stroke={INK} strokeWidth={2} opacity={0.5} />
            </g>
            <g transform={`rotate(${legR} 200 378)`}>
              <line x1={200} y1={378} x2={203} y2={492} stroke={WOOL_TROUSER_DARK} strokeWidth={18} strokeLinecap="round" />
              <line x1={200} y1={378} x2={203} y2={492} stroke={WOOL_TROUSER} strokeWidth={13} strokeLinecap="round" />
              <rect x={182} y={484} width={44} height={20} rx={7} fill={BOOT} stroke={INK} strokeWidth={3.5} />
              <line x1={184} y1={501} x2={224} y2={501} stroke={INK} strokeWidth={2} opacity={0.5} />
            </g>
          </>
        ) : (
          <>
            <g transform={`rotate(${legL} 160 378)`}>
              <line x1={160} y1={378} x2={157} y2={490} stroke={WOOL_TROUSER_DARK} strokeWidth={14} strokeLinecap="round" />
              <line x1={160} y1={378} x2={157} y2={490} stroke={WOOL_TROUSER} strokeWidth={10} strokeLinecap="round" />
              <rect x={138} y={484} width={40} height={18} rx={7} fill={BOOT} stroke={INK} strokeWidth={3.5} />
            </g>
            <g transform={`rotate(${legR} 200 378)`}>
              <line x1={200} y1={378} x2={203} y2={490} stroke={WOOL_TROUSER_DARK} strokeWidth={14} strokeLinecap="round" />
              <line x1={200} y1={378} x2={203} y2={490} stroke={WOOL_TROUSER} strokeWidth={10} strokeLinecap="round" />
              <rect x={184} y={484} width={40} height={18} rx={7} fill={BOOT} stroke={INK} strokeWidth={3.5} />
            </g>
          </>
        )}

        {/* badan ramping: kapsul (130x190), outline plum. Varian C (flanel)
            badannya kaos putih, flanelnya jadi panel di sisi; A/B tosca. */}
        <path
          d="M180,198 C220,198 245,228 245,286 C245,340 220,388 180,388 C140,388 115,340 115,286 C115,228 140,198 180,198 Z"
          fill={
            outfit === "c"
              ? "#f7f4ec"
              : kind === "town" && town === 1
                ? `url(#flanel-brown-${uid})`
                : kind === "town"
                  ? shirt
                  : kind === "elder"
                    // kakek: tosca solid redup, bukan gradien neon (1871)
                    ? "#4a7a72"
                    : `url(#shirt-${uid})`
          }
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {!outfit && kind !== "town" && (
          <>
            {/* kemeja kerja polos 1871 (kakek): kantong putih besar modern
                DIHAPUS (koreksi bill 27 Nov 13:33 WIB). Hanya garis placket
                tengah + 3 kancing kecil. */}
            <line x1={180} y1={206} x2={180} y2={360} stroke={INK} strokeWidth={3} opacity={0.45} />
            <circle cx={180} cy={252} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={296} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={180} cy={340} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            {/* garis hem baju (baju lama) */}
            <line x1={124} y1={364} x2={236} y2={364} stroke={INK} strokeWidth={3} opacity={0.3} />
          </>
        )}
        {/* Warga 1 (penebang): suspender cokelat gelap di atas flanel +
            kancing suspender + garis hem. */}
        {!outfit && kind === "town" && town === 1 && (
          <>
            <rect x={144} y={200} width={15} height={182} rx={5} fill="#4a3423" stroke={INK} strokeWidth={3} />
            <rect x={201} y={200} width={15} height={182} rx={5} fill="#4a3423" stroke={INK} strokeWidth={3} />
            <circle cx={151} cy={252} r={4.5} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={208} cy={252} r={4.5} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <line x1={124} y1={364} x2={236} y2={364} stroke={INK} strokeWidth={3} opacity={0.3} />
          </>
        )}
        {/* Warga 2: celemek kerja kanvas terang (bib + tali bahu + panel
            depan + simpul pinggang) di atas baju abu-biru. */}
        {!outfit && kind === "town" && town === 2 && (
          <>
            <line x1={158} y1={240} x2={140} y2={204} stroke="#ece5d3" strokeWidth={8} strokeLinecap="round" />
            <line x1={202} y1={240} x2={220} y2={204} stroke="#ece5d3" strokeWidth={8} strokeLinecap="round" />
            <rect x={150} y={238} width={60} height={50} rx={6} fill="#ece5d3" stroke={INK} strokeWidth={4} />
            <rect x={132} y={282} width={96} height={102} rx={8} fill="#ece5d3" stroke={INK} strokeWidth={4} />
            <circle cx={180} cy={330} r={5} fill="#d8cfb8" stroke={INK} strokeWidth={2.5} />
            <line x1={140} y1={372} x2={220} y2={372} stroke={INK} strokeWidth={3} opacity={0.3} />
          </>
        )}
        {/* Warga 3: rompi hijau gelap terbuka (dua panel samping, baju
            merah gelap terlihat di tengah) + kancing rompi. */}
        {!outfit && kind === "town" && town === 3 && (
          <>
            <g clipPath={`url(#body-${uid})`}>
              <rect x={112} y={198} width={58} height={192} fill="#2e5d43" />
              <rect x={190} y={198} width={58} height={192} fill="#2e5d43" />
            </g>
            <line x1={170} y1={204} x2={170} y2={384} stroke={INK} strokeWidth={3} />
            <line x1={190} y1={204} x2={190} y2={384} stroke={INK} strokeWidth={3} />
            <circle cx={141} cy={258} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={141} cy={300} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={219} cy={258} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
            <circle cx={219} cy={300} r={4} fill="#e8e6da" stroke={INK} strokeWidth={2.5} />
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
        {/* garis pinggang celana wol tipis di bawah badan (varian anak muda) */}
        {outfit && (
          <>
            <rect x={146} y={380} width={68} height={12} rx={5} fill={WOOL_TROUSER_DARK} stroke={INK} strokeWidth={3} />
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
        {/* Ed + warga 1 (penebang): topi datar kerja (flat cap) cokelat
            gelap + brim pendek. Warga 2/3 TANPA topi (koreksi bill
            27 Nov 13:26 WIB: maks satu karakter bertopi per adegan). */}
        {(kind === "ed" || (kind === "town" && town === 1)) && (
          <>
            <path d="M86,80 C86,30 132,6 180,6 C228,6 274,30 274,80 L274,86 L86,86 Z" fill="#5d4023" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <line x1={92} y1={48} x2={268} y2={48} stroke="#3a2c22" strokeWidth={3} opacity={0.5} />
            <ellipse cx={180} cy={84} rx={100} ry={8} fill="#4a3423" stroke={INK} strokeWidth={4} />
            <circle cx={180} cy={10} r={5} fill="#4a3423" stroke={INK} strokeWidth={3} />
          </>
        )}
        {/* Warga 2: rambut belah samping yang rapi — mahkota halus +
            garis belah miring (kulit) dari puncak ke kanan, tanpa topi. */}
        {kind === "town" && town === 2 && (
          <>
            <path
              d="M86,96 C86,36 132,8 180,8 C228,8 274,36 274,96 C256,64 228,54 196,60 C164,66 132,58 110,68 C96,74 88,84 86,96 Z"
              fill={INK}
            />
            <path d="M150,14 Q172,30 188,58" fill="none" stroke={SKIN} strokeWidth={5} strokeLinecap="round" />
          </>
        )}
        {/* Warga 3: rambut keriting — mahkota bergelombang (tepi bawah
            berlekuk) + 3 jambul bulat mencuat di atas mahkota, tanpa topi. */}
        {kind === "town" && town === 3 && (
          <>
            <g clipPath={`url(#head-${uid})`}>
              <path
                d="M82,112 C82,44 128,6 180,6 C232,6 278,44 278,112 C264,88 252,98 240,76 C228,96 214,74 200,88 C186,70 172,90 158,74 C144,94 130,72 116,92 C102,74 92,94 82,112 Z"
                fill={INK}
              />
            </g>
            <circle cx={132} cy={8} r={11} fill={INK} />
            <circle cx={180} cy={4} r={12} fill={INK} />
            <circle cx={228} cy={8} r={11} fill={INK} />
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
 *  Font size auto-fits the phrase into ~920 px (cap 46 px, floor 30 px)
 *  so long phrases stay on one line. Size matches the burned-in captions
 *  of the History Rush videos already on YouTube (Molasses, Video05:
 *  46 px for normal captions, maxWidth 920) — set 2026-11-26 after bill
 *  asked for the YouTube size. Was cap 170 / width 1000, then cap 120. */
const fitFontSize = (phrase: string): number => {
  const est = phrase.length * 0.68; // conservative em-width of Poppins ExtraBold lowercase (wide letters like m/g/a)
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

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* SCENES — 10 adegan (satu per baris VO), hard cut. Tiap Scene HANYA  */
/* overlay karakter 2D (posisi/skala/pose/ekspresi di bawah) +         */
/* bayangan kontak; latarnya dunia 3D dari world3d.tsx yang dirender   */
/* di bawahnya. Kaki menapak di y + 500*scale (kotak 360x520).          */
/* Warga Peshtigo generik (kind "town", prop town 1/2/3 — identitas
   baju + rambut KONSISTEN per karakter di semua adegan; lihat komentar
   di BeanHead): 1 = flanel cokelat + suspender + topi datar, 2 = belah
   samping + celemek, 3 = keriting + rompi. Tanpa nama, tanpa dialog —
   sesuai SCRIPT.md. Ekspresi: worried/shock di beat 2, sedih di beat 3.
   S6: warga BERDIRI DI AIR — kaki di bawah garis air (WaterBand
   menutup badan bawah). S9/S10 tanpa karakter: overlay DOM peta / koran
   menutup tengah frame. */
/* ------------------------------------------------------------------ */

/** Label tahun + tempat (wajib sejak video 5): tampil di awal beat 1
 *  (adegan 1-2), gaya teks sama seperti subtitle (Poppins ExtraBold
 *  putih outline hitam tebal). */
const DateLabel: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 110,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif",
        fontWeight: 800,
        fontSize: 44,
        lineHeight: 1.15,
        color: "#ffffff",
        textShadow:
          "0 3px 0 #000000, 3px 0 0 #000000, -3px 0 0 #000000, 0 -3px 0 #000000, 2px 2px 0 #000000, -2px 2px 0 #000000, 2px -2px 0 #000000, -2px -2px 0 #000000, 0 6px 12px rgba(0,0,0,0.55)",
        backgroundColor: "rgba(0,0,0,0.45)",
        borderRadius: 18,
        padding: "14px 28px",
        textAlign: "center",
      }}
    >
      October 8, 1871
      <br />
      Peshtigo, Wisconsin
    </div>
  </div>
);

/** Angka korban di layar (S7): SELALU rentang 1,200–2,500, tidak pernah
 *  angka tunggal (SCRIPT.md / RESEARCH.md). */
const DeathToll: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 300,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif",
        fontWeight: 800,
        fontSize: 118,
        lineHeight: 1,
        color: "#ffd23a",
        textShadow:
          "0 4px 0 #000000, 4px 0 0 #000000, -4px 0 0 #000000, 0 -4px 0 #000000, 3px 3px 0 #000000, -3px 3px 0 #000000, 3px -3px 0 #000000, -3px -3px 0 #000000, 0 8px 18px rgba(0,0,0,0.7)",
      }}
    >
      1,200–2,500
    </div>
    <div
      style={{
        fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif",
        fontWeight: 800,
        fontSize: 54,
        lineHeight: 1.1,
        color: "#ffffff",
        textShadow:
          "0 3px 0 #000000, 3px 0 0 #000000, -3px 0 0 #000000, 0 -3px 0 #000000, 2px 2px 0 #000000, -2px 2px 0 #000000, 2px -2px 0 #000000, -2px -2px 0 #000000, 0 6px 12px rgba(0,0,0,0.55)",
        marginTop: 10,
      }}
    >
      PEOPLE DIED
    </div>
  </div>
);

/** Frame foto asli domain publik (S8): G. J. Tisdale, Harper's Weekly
 *  25 November 1871, "people seeking refuge in the Peshtigo River",
 *  via Wikimedia Commons (public domain, file terverifikasi).
 *  File: public/peshtigo-river-1871.jpg (1024x768). */
const PhotoFrame: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 330,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <div
      style={{
        backgroundColor: "#f5f2ea",
        padding: 18,
        borderRadius: 6,
        boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
        transform: "rotate(-1.5deg)",
      }}
    >
      <img
        src={staticFile("peshtigo-river-1871.jpg")}
        alt="People seeking refuge in the Peshtigo River, 1871"
        style={{ width: 880, height: 660, objectFit: "cover", display: "block" }}
      />
      <div
        style={{
          fontFamily: "Poppins, Arial, sans-serif",
          fontWeight: 700,
          fontSize: 28,
          lineHeight: 1.25,
          color: "#2a2018",
          textAlign: "center",
          paddingTop: 14,
        }}
      >
        People seeking refuge in the Peshtigo River
        <br />
        Harper&apos;s Weekly, Nov. 25, 1871 (public domain)
      </div>
    </div>
  </div>
);

/** Shot peta kartun dari kode (S9): Wisconsin + Peshtigo vs Chicago,
 *  jarak 250 mil, api di malam yang sama. Bukan peta geografis presisi —
 *  sketsa kartun: Danau Michigan di kanan, Peshtigo di utara,
 *  Chicago di selatan, garis putus-putus 250 MILES. */
const MapOverlay: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 60,
      right: 60,
      top: 180,
      bottom: 560,
      backgroundColor: "#f2e8d0",
      borderRadius: 24,
      border: "6px solid #5d4023",
      boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif",
        fontWeight: 800,
        fontSize: 46,
        color: "#2a2018",
        textAlign: "center",
        paddingTop: 26,
      }}
    >
      OCTOBER 8, 1871 — THE SAME NIGHT
    </div>
    <svg viewBox="0 0 960 900" style={{ width: "100%", height: "78%" }}>
      {/* Danau Michigan (kanan) */}
      <path d="M640,60 C700,120 720,260 690,420 C670,540 640,640 600,700 L600,60 Z" fill="#7ab8d9" stroke="#3a6a8a" strokeWidth={4} />
      <text x={660} y={380} fontSize={30} fontWeight={700} fill="#2c546e" transform="rotate(90 660 380)">LAKE MICHIGAN</text>
      {/* daratan Wisconsin/Illinois (sketsa) */}
      <path d="M120,80 L620,60 L640,700 L560,840 L140,820 Z" fill="#c9d6a0" stroke="#5d4023" strokeWidth={5} />
      {/* Peshtigo (utara) */}
      <circle cx={330} cy={190} r={26} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={330} y={130} fontSize={44} fontWeight={800} fill="#241726" textAnchor="middle">PESHTIGO</text>
      <text x={330} y={255} fontSize={30} fontWeight={700} fill="#c23a12" textAnchor="middle">TOWN BURNED</text>
      {/* Chicago (selatan) */}
      <circle cx={430} cy={660} r={26} fill="#c23a12" stroke="#241726" strokeWidth={5} />
      <text x={430} y={600} fontSize={44} fontWeight={800} fill="#241726" textAnchor="middle">CHICAGO</text>
      <text x={430} y={725} fontSize={30} fontWeight={700} fill="#c23a12" textAnchor="middle">CITY BURNED</text>
      {/* garis penghubung + jarak */}
      <line x1={330} y1={216} x2={430} y2={634} stroke="#241726" strokeWidth={6} strokeDasharray="18 14" />
      <rect x={330} y={400} width={230} height={64} rx={12} fill="#241726" />
      <text x={445} y={444} fontSize={40} fontWeight={800} fill="#ffffff" textAnchor="middle">250 MILES</text>
    </svg>
  </div>
);

/** Koran Chicago (S10): headline besar + kotak kecil Peshtigo.
 *  Fakta di koran sudah terverifikasi (RESEARCH.md): Chicago ~300 tewas,
 *  17.000+ bangunan hancur; Peshtigo 1,200–2,500 tewas, malam yang sama.
 *  Masthead NETRAL hanya tanggal (koreksi 27 Nov 13:34 WIB): tidak ada
 *  koran bernama "Daily News" di Chicago 1871 (Chicago Daily News baru
 *  1875) dan RESEARCH.md tidak menyebut nama koran apa pun — nama koran
 *  spesifik adalah karangan, jadi tidak dipakai. */
const NewspaperOverlay: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 70,
      right: 70,
      top: 280,
      backgroundColor: "#f5f2ea",
      borderRadius: 8,
      border: "4px solid #2a2018",
      boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
      padding: "28px 36px 32px",
      transform: "rotate(-1deg)",
    }}
  >
    <div
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontWeight: 700,
        fontSize: 40,
        color: "#2a2018",
        textAlign: "center",
        borderBottom: "3px solid #2a2018",
        paddingBottom: 10,
      }}
    >
      OCTOBER 9, 1871
    </div>
    <div
      style={{
        fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif",
        fontWeight: 800,
        fontSize: 92,
        lineHeight: 1.05,
        color: "#1a1a1a",
        textAlign: "center",
        paddingTop: 22,
      }}
    >
      CHICAGO
      <br />
      IN FLAMES
    </div>
    <div
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 32,
        lineHeight: 1.35,
        color: "#3a322a",
        textAlign: "center",
        paddingTop: 14,
      }}
    >
      300 dead. 17,000 buildings destroyed.
      <br />
      The whole nation reads about Chicago.
    </div>
    {/* garis teks koran (abstrak, bukan kutipan) */}
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ height: 12, backgroundColor: "#b8b0a0", borderRadius: 6, marginTop: 14, marginLeft: i * 30, marginRight: i * 24 }} />
    ))}
    <div
      style={{
        marginTop: 26,
        border: "3px solid #c23a12",
        borderRadius: 10,
        padding: "16px 20px",
        backgroundColor: "#fdeeda",
      }}
    >
      <div
        style={{
          fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif",
          fontWeight: 800,
          fontSize: 34,
          lineHeight: 1.2,
          color: "#c23a12",
          textAlign: "center",
        }}
      >
        PESHTIGO, WISCONSIN — burned the same night.
        <br />
        1,200–2,500 dead. Almost nobody heard.
      </div>
    </div>
    {/* kutipan penutup (baris VO L10) sebagai pull-quote koran */}
    <div
      style={{
        marginTop: 26,
        borderTop: "3px solid #2a2018",
        paddingTop: 20,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontStyle: "italic",
        fontSize: 32,
        lineHeight: 1.4,
        color: "#2a2018",
        textAlign: "center",
      }}
    >
      “The deadliest wildfire in America was forgotten because a bigger
      city burned on the same night.”
    </div>
  </div>
);

/** Air sungai menutup badan bawah karakter S6 (warga berdiri di air,
 *  bahu di atas permukaan). */
const WaterBand: React.FC<{ local: number }> = ({ local }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 1420,
      bottom: 0,
      background: "linear-gradient(180deg, rgba(46,93,122,0.88) 0%, rgba(28,60,86,0.96) 100%)",
      overflow: "hidden",
    }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: -40 + ((local * 2 + i * 360) % 1160),
          top: 30 + i * 90,
          width: 220,
          height: 10,
          borderRadius: 5,
          backgroundColor: "rgba(159,212,232,0.55)",
        }}
      />
    ))}
  </div>
);

const Scene1: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={120} y={430} scale={2.0} />
    <BeanHead x={120} y={430} scale={2.0} kind="town" town={1} shirt="#8a6a42" pose="point" expr="shock" speaking={speaking} local={local} />
    <ContactShadow x={620} y={520} scale={1.8} />
    <BeanHead x={620} y={520} scale={1.8} kind="town" town={2} shirt="#5a6a7a" pose="worried" expr="worried" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene2: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* Tiga warga BERJAJAR, kepala tidak saling menutup: pusat kepala
        252 / 594 / 936 (jarak 342px, lebar kepala ~275px) sehingga celah
        antar kepala 77px (kiri-tengah) dan 97px (tengah-kanan); kepala
        kanan berakhir x=1054 < 1080, tidak terpotong tepi. Kaki sejajar
        ~y1240-1260 (garis tanah sama). */}
    <ContactShadow x={0} y={560} scale={1.4} />
    {/* pose "walk" diganti "stand" (koreksi bill 27 Nov 14:21 WIB): x
        karakter TETAP (tidak berpindah), jadi siklus jalan hanya
        berbaris di tempat + memantul, terbaca seperti joget di detik
        6-10. Mereka memang berdiri berjajar, bukan berjalan. */}
    <BeanHead x={0} y={560} scale={1.4} kind="town" town={1} shirt="#8a6a42" pose="stand" expr="smile" speaking={speaking} local={local} />
    <ContactShadow x={360} y={600} scale={1.3} />
    <BeanHead x={360} y={600} scale={1.3} kind="elder" pose="stand" expr="content" speaking={speaking} local={local} />
    <ContactShadow x={720} y={640} scale={1.2} />
    <BeanHead x={720} y={640} scale={1.2} kind="town" town={3} shirt="#8a3a2e" pose="stand" expr="smile" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene3: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={150} y={500} scale={1.9} />
    <BeanHead x={150} y={500} scale={1.9} kind="town" town={1} shirt="#8a6a42" pose="point" expr="worried" speaking={speaking} local={local} />
    <ContactShadow x={560} y={580} scale={1.6} />
    <BeanHead x={560} y={580} scale={1.6} kind="elder" pose="worried" expr="worried" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene4: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={100} y={500} scale={1.9} />
    <BeanHead x={100} y={500} scale={1.9} kind="town" town={2} shirt="#5a6a7a" pose="worried" expr="shock" speaking={speaking} local={local} />
    <ContactShadow x={580} y={560} scale={1.6} />
    <BeanHead x={580} y={560} scale={1.6} kind="town" town={3} shirt="#8a3a2e" pose="worried" expr="worried" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene5: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* Dua warga digeser ke SISI (kepala kiri berakhir x=493, kepala
        kanan mulai x=763) supaya corong tornado api di tengah frame
        (layar x~277-803 di puncak, pangkal x~477-603) terlihat penuh di
        celah 270px di antara mereka + di atas kepala mereka. */}
    <ContactShadow x={20} y={520} scale={1.7} />
    {/* pose "walk" diganti "stand" (koreksi bill 27 Nov 14:21 WIB): sama
        seperti S2, x karakter TETAP, jadi siklus jalan hanya berbaris di
        tempat + memantul. Mereka berdiri di sisi membingkai tornado api. */}
    <BeanHead x={20} y={520} scale={1.7} kind="town" town={1} shirt="#8a6a42" pose="stand" expr="shock" speaking={speaking} local={local} />
    <ContactShadow x={640} y={580} scale={1.5} />
    <BeanHead x={640} y={580} scale={1.5} kind="town" town={2} shirt="#5a6a7a" pose="stand" expr="worried" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene6: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* warga berdiri di air: kaki di y+500*scale ≈ 1500-1600, di bawah
        garis air (WaterBand mulai y=1420); kepala + bahu di atas air */}
    <BeanHead x={40} y={1050} scale={1.7} kind="town" town={1} shirt="#8a6a42" pose="worried" expr="worried" speaking={speaking} local={local} />
    <BeanHead x={350} y={1100} scale={1.6} kind="elder" pose="worried" expr="shock" speaking={speaking} local={local} />
    <BeanHead x={620} y={1020} scale={1.55} kind="town" town={2} shirt="#5a6a7a" pose="worried" expr="worried" speaking={speaking} local={local} />
    <WaterBand local={local} />
  </AbsoluteFill>
);

const Scene7: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    <ContactShadow x={380} y={750} scale={1.9} />
    <BeanHead x={380} y={750} scale={1.9} kind="town" town={2} shirt="#5a6a7a" pose="stand" expr="worried" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene8: React.FC<{ local: number; speaking: boolean }> = ({ local, speaking }) => (
  <AbsoluteFill>
    {/* foto 1871 menutup tengah frame (sampai ~y1100); satu warga di bawahnya */}
    <ContactShadow x={400} y={1130} scale={1.2} />
    <BeanHead x={400} y={1130} scale={1.2} kind="elder" pose="stand" expr="worried" speaking={speaking} local={local} />
  </AbsoluteFill>
);

const Scene9: React.FC<{ local: number; speaking: boolean }> = () => (
  <AbsoluteFill>{/* tanpa karakter: overlay peta menutup tengah frame */}</AbsoluteFill>
);

const Scene10: React.FC<{ local: number; speaking: boolean }> = () => (
  <AbsoluteFill>{/* tanpa karakter: overlay koran menutup tengah frame */}</AbsoluteFill>
);

const SCENES: React.FC<{ local: number; speaking: boolean }>[] = [
  Scene1, Scene2, Scene3, Scene4, Scene5,
  Scene6, Scene7, Scene8, Scene9, Scene10,
];

/* Scene is derived from the karaoke line ONLY. Satu adegan per baris. */
/* ------------------------------------------------------------------ */

const SCENE_LINES: number[][] = [[1], [2], [3], [4], [5], [6], [7], [8], [9], [10]];

const lineToScene = (line: number): number => Math.min(Math.max(line - 1, 0), 9);

const sceneSpan = (scene: number): [number, number] => {
  const lines = SCENE_LINES[scene];
  const ps = KARAOKE.filter((p) => lines.includes(p.line));
  return [ps[0].startFrame, ps[ps.length - 1].endFrame];
};

export const Video14: React.FC = () => {
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
        <Scene local={local} speaking={!!phrase} />
      </div>
      {scene === 0 || scene === 1 ? <DateLabel /> : null}
      {scene === 6 ? <DeathToll /> : null}
      {scene === 7 ? <PhotoFrame /> : null}
      {scene === 8 ? <MapOverlay /> : null}
      {scene === 9 ? <NewspaperOverlay /> : null}
      {phrase && <KaraokeText phrase={phrase.phrase} />}
    </AbsoluteFill>
  );
};

export const VIDEO14_FRAMES = TOTAL_FRAMES;
export const VIDEO14_SIZE = { width: W, height: H };
