// "DiBalikLayarFail2Install": format "Di Balik Layar" EP 01.
// Topik: CVE-2026-132165 Fail2Install, RCE pre-auth di Drupal core.
// 5 slide, 60 detik, 1800 frame @30fps, 1080x1920.
// Palet: sama seperti EP 01 (Devnoobie). Latar cokelat-hitam #1B140D,
// panel #251C12, oranye #EF7D1A, amber #F2A93B, merah #E5484D,
// hijau mint #35C48D, teks putih hangat #F7F2E9, sekunder #AB9E8A.
// EFFECT PAPER (perintah bill, 28 Nov 2026, khusus EP 01): tekstur kertas
// halus di latar (SVG feTurbulence, opacity rendah), panel seperti potongan
// kertas berlapis (bayangan bertumpuk + tepi atas lebih terang), tepi sobek
// halus di strip kode dan strip peringatan slide 5, nuansa vintage lewat
// vignette hangat tipis. Kertasnya kertas GELAP, palet tidak berubah.
// Layout FORMAT.md: kicker + chip EP 01, judul pendek, rel langkah vertikal
// 5 titik di kiri, panggung diagram, angka hero tabular-nums, strip kode
// mono maks 2 baris, kalimat penjelas per kalimat, zona aman bawah 300px.
// Subtitle karaoke per kalimat sejak awal (pelajaran video tes race condition): kalimat
// penjelas adalah naskah VO PERSIS kata per kata, hanya kalimat yang sedang
// diucapkan yang tampil, 1-2 baris, font 40px. Waktu tiap kata dari
// WhisperX per baris (captions22.ts, offset trim-corrected, VO Casper
// direkam 28 Nov 2026; L1 145, L2 135, L3 150, L4 200, L5 160).
// Motion: Corporate 200-400ms, easing cubic-bezier(0.2,0,0,1), tiga layer,
// reveal node lalu edge lalu label, stagger 6-10 frame, hard cut antar slide.
// Kamera LOCKED-OFF kecuali satu push-in lambat di slide 3.
// Semua diagram dari div/SVG, tanpa prop GLB, tanpa karakter, tanpa watermark
// (watermark "newdev" tengah ditempel belakangan pakai ffmpeg seperti EP 01).
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
} from "remotion";
// Font terbundel lokal lewat Fontsource, sama seperti EP 01.
import "@fontsource/anton/400.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import { CAPTIONS, type KaraokeWord } from "./captions22";

const FPS = 30;
const BG = "#1B140D";
const PANEL = "#251C12";
const PANEL_LINE = "#3E301D";
const INK = "#F7F2E9";
const SLATE = "#AB9E8A";
const ACCENT = "#EF7D1A";
const AMBER = "#F2A93B";
const RED = "#E5484D";
const GREEN = "#35C48D";
const DISPLAY = "'Anton', 'Arial Narrow', sans-serif";
const SANS = "'Poppins', Arial, Helvetica, sans-serif";
const MONO = "'JetBrains Mono', Menlo, Consolas, monospace";

const SLIDES = [
  { start: 0, title: "Admin Tanpa Login", step: 0 },
  { start: 270, title: "Banjir Request", step: 1 },
  { start: 660, title: "Installer Bangun Lagi", step: 2 },
  { start: 1080, title: "Skor 9.8", step: 3 },
  { start: 1440, title: "Update dan Kunci", step: 4 },
];

const slideIndex = (frame: number): number => {
  if (frame < 270) return 0;
  if (frame < 660) return 1;
  if (frame < 1080) return 2;
  if (frame < 1440) return 3;
  return 4;
};

// Entrance 0..1, Corporate ease-out cubic, durasi ~12 frame (400ms).
const enter = (local: number, delay: number, dur = 12): number =>
  interpolate(local - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

const enterStyle = (
  local: number,
  delay: number,
  rise = 20,
): React.CSSProperties => {
  const e = enter(local, delay);
  return {
    opacity: e,
    transform: `translateY(${(1 - e) * rise}px)`,
  };
};

/* ---------------------------------------------------------------- */
/* Effect paper: tekstur kertas, vignette, tepi sobek.               */
/* Semua fungsi di sini murni (tanpa Math.random), supaya render      */
/* frame-deterministik seperti yang diminta Remotion.                 */
/* ---------------------------------------------------------------- */

// Tepi sobek deterministik: polygon dengan gigi acak semu dari sin().
const tornClip = (
  w: number,
  h: number,
  seed: number,
  top = true,
  bottom = false,
): string => {
  const teeth = 24;
  const rnd = (i: number) => {
    const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const pts: string[] = [];
  if (top) {
    for (let i = 0; i <= teeth; i++) {
      const x = (i / teeth) * w;
      const y = 2 + rnd(i) * 12;
      pts.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
    }
  } else {
    pts.push("0px 0px", `${w}px 0px`);
  }
  if (bottom) {
    for (let i = teeth; i >= 0; i--) {
      const x = (i / teeth) * w;
      const y = h - (2 + rnd(i + 50) * 12);
      pts.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
    }
  } else {
    pts.push(`${w}px ${h}px`, `0px ${h}px`);
  }
  return `polygon(${pts.join(", ")})`;
};

// Tekstur kertas halus: noise fractal di atas latar, opacity sangat rendah.
const PaperGrain: React.FC = () => (
  <svg
    width={1080}
    height={1920}
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", left: 0, top: 0, opacity: 0.07 }}
  >
    <filter id="paperNoise">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.9"
        numOctaves="2"
        stitchTiles="stitch"
      />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0.9  0 0 0 0 0.85  0 0 0 0 0.72  0 0 0 0.55 0"
      />
    </filter>
    <rect width={1080} height={1920} filter="url(#paperNoise)" />
  </svg>
);

// Vignette hangat tipis, nuansa kertas vintage di tepi frame.
const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: 1080,
      height: 1920,
      background:
        "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(10,6,2,0.30) 100%)",
    }}
  />
);

/* ---------------------------------------------------------------- */
/* Chrome tetap: latar gelombang + serat kertas, kicker, judul,       */
/* rel langkah, strip kode, kalimat penjelas.                         */
/* ---------------------------------------------------------------- */

const Waves: React.FC = () => (
  <svg
    width={1080}
    height={1920}
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", left: 0, top: 0, opacity: 0.55 }}
  >
    <path
      d="M0 300 C 270 260, 540 340, 810 300 S 1080 280, 1080 280"
      fill="none"
      stroke="#332619"
      strokeWidth={2}
    />
    <path
      d="M0 700 C 270 660, 540 740, 810 700 S 1080 680, 1080 680"
      fill="none"
      stroke="#332619"
      strokeWidth={2}
    />
    <path
      d="M0 1180 C 270 1140, 540 1220, 810 1180 S 1080 1160, 1080 1160"
      fill="none"
      stroke="#332619"
      strokeWidth={2}
    />
    <path
      d="M0 1700 C 270 1660, 540 1740, 810 1700 S 1080 1680, 1080 1680"
      fill="none"
      stroke="#2A2013"
      strokeWidth={2}
    />
    {/* Serat kertas: dua garis sangat tipis tambahan. */}
    <path
      d="M0 500 C 300 480, 600 520, 1080 495"
      fill="none"
      stroke="#3A2C17"
      strokeWidth={1}
      opacity={0.5}
    />
    <path
      d="M0 1450 C 300 1430, 600 1470, 1080 1445"
      fill="none"
      stroke="#3A2C17"
      strokeWidth={1}
      opacity={0.5}
    />
  </svg>
);

const Rail: React.FC<{ active: number; local: number }> = ({
  active,
  local,
}) => {
  const dots = [340, 480, 620, 760, 900];
  const pulse = 1 + Math.sin(local * 0.12) * 0.06; // ambient, denyut pelan
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      <div
        style={{
          position: "absolute",
          left: 77,
          top: 340,
          width: 2,
          height: 560,
          background: PANEL_LINE,
        }}
      />
      {dots.map((y, i) => {
        const done = i < active;
        const isActive = i === active;
        const size = isActive ? 30 : 20;
        const color = done ? GREEN : isActive ? ACCENT : "#3E301D";
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: 78 - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                background: color,
                border: isActive ? `3px solid ${BG}` : "none",
                boxShadow: isActive
                  ? `0 0 0 3px ${ACCENT}55, 0 0 24px ${ACCENT}88`
                  : done
                    ? `0 0 12px ${GREEN}66`
                    : "none",
                transform: isActive ? `scale(${pulse})` : "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 104,
                top: y - 13,
                fontFamily: SANS,
                fontSize: 20,
                fontWeight: 700,
                color: isActive ? ACCENT : done ? GREEN : SLATE,
              }}
            >
              {i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Strip kode dengan tepi atas sobek (effect paper).
const CodeStrip: React.FC<{
  lines: React.ReactNode[];
  local: number;
  dividerAfter?: number;
}> = ({ lines, local, dividerAfter }) => (
  <div
    style={{
      position: "absolute",
      left: 70,
      top: 1200,
      width: 940,
      background: "#221709",
      border: `1px solid ${PANEL_LINE}`,
      borderLeft: `4px solid ${ACCENT}`,
      borderRadius: 14,
      padding: "22px 26px",
      clipPath: tornClip(940, 200, 7, true, false),
      ...enterStyle(local, 30, 12),
    }}
  >
    <div
      style={{
        fontFamily: SANS,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 4,
        color: ACCENT,
        marginBottom: 12,
      }}
    >
      KODE
    </div>
    {lines.map((line, i) => (
      <div key={i}>
        {dividerAfter === i && (
          <div
            style={{
              borderTop: `2px dashed ${RED}`,
              margin: "10px 0",
              opacity: 0.9,
            }}
          />
        )}
        <div
          style={{
            fontFamily: MONO,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.5,
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          {line}
        </div>
      </div>
    ))}
  </div>
);

// Subtitle karaoke per kalimat (pelajaran EP 01, diterapkan sejak awal):
// hanya kalimat yang sedang diucapkan VO yang tampil di layar, 1-2 baris.
// Kata-kata tetap naskah VO PERSIS, waktu tiap kata masih ESTIMASI
// proporsional (captions22.ts). Kalimat ditentukan dari kata yang diakhiri
// titik atau tanda tanya. Di jeda antar kalimat tidak ada subtitle yang
// tampil, kalimat berikutnya muncul saat kata pertamanya mulai diucapkan.
// Hanya kata yang sedang diucapkan yang oranye, kata lain putih hangat.
const Caption: React.FC<{
  words: KaraokeWord[];
  local: number;
  time: number;
}> = ({ words, local, time }) => {
  // Kelompokkan kata menjadi kalimat, pisah setelah kata yang diakhiri . atau ?
  const sentences: KaraokeWord[][] = [];
  let current: KaraokeWord[] = [];
  for (const w of words) {
    current.push(w);
    if (/[.?]$/.test(w.t.trim())) {
      sentences.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    sentences.push(current);
  }
  // Kalimat aktif: waktu berada di antara kata pertama dan kata terakhirnya.
  // Di jeda antar kalimat tidak ada yang tampil.
  const active = sentences.find(
    (s) => time >= s[0].start && time < s[s.length - 1].end,
  );
  if (!active) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 1470,
        width: 940,
        fontFamily: SANS,
        fontSize: 40,
        lineHeight: 1.3,
        fontWeight: 700,
        letterSpacing: -0.5,
        color: INK,
        ...enterStyle(local, 40, 12),
      }}
    >
      {active.map((w, i) => {
        const isActive = time >= w.start && time < w.end;
        return (
          <span key={i} style={isActive ? { color: ACCENT } : undefined}>
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

const Chrome: React.FC<{
  title: string;
  activeStep: number;
  local: number;
  code?: React.ReactNode[];
  dividerAfter?: number;
  caption: KaraokeWord[];
  children: React.ReactNode;
  stageScale?: number;
  time: number;
}> = ({
  title,
  activeStep,
  local,
  code,
  dividerAfter,
  caption,
  children,
  stageScale = 1,
  time,
}) => (
  <AbsoluteFill style={{ background: BG, fontFamily: SANS }}>
    <Waves />
    <PaperGrain />
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 92,
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: 5,
        color: ACCENT,
        ...enterStyle(local, 0, 10),
      }}
    >
      DI BALIK LAYAR
    </div>
    <div
      style={{
        position: "absolute",
        right: 70,
        top: 84,
        border: `2px solid ${ACCENT}`,
        borderRadius: 999,
        padding: "10px 22px",
        fontSize: 26,
        fontWeight: 800,
        letterSpacing: 2,
        color: ACCENT,
        ...enterStyle(local, 3, 10),
      }}
    >
      EP 01
    </div>
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 168,
        width: 940,
        fontFamily: DISPLAY,
        fontSize: 78,
        fontWeight: 400,
        letterSpacing: 0.5,
        lineHeight: 1.02,
        color: INK,
        whiteSpace: "nowrap",
        ...enterStyle(local, 6, 14),
      }}
    >
      {title}
    </div>
    <Rail active={activeStep} local={local} />
    <div
      style={{
        position: "absolute",
        left: 140,
        top: 340,
        width: 870,
        height: 810,
        transform: `scale(${stageScale})`,
        transformOrigin: "435px 405px",
      }}
    >
      {children}
    </div>
    {code && (
      <CodeStrip lines={code} local={local} dividerAfter={dividerAfter} />
    )}
    <Vignette />
    <Caption words={caption} local={local} time={time} />
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- */
/* Elemen kecil                                                       */
/* ---------------------------------------------------------------- */

// Panel kertas berlapis: bayangan bertumpuk mensimulasikan lembaran
// kertas kedua yang mengintip di kanan bawah, plus highlight tepi atas.
const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
  border?: string;
  bg?: string;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, children, border, bg, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: bg ?? PANEL,
      border: `1px solid ${border ?? PANEL_LINE}`,
      borderRadius: 18,
      padding: 24,
      boxSizing: "border-box",
      boxShadow:
        "0 2px 0 rgba(0,0,0,0.35), 7px 7px 0 #1D1409, 7px 7px 0 1px #3E301D, 14px 16px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(247,242,233,0.08)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color,
}) => (
  <div
    style={{
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: 3,
      color: color ?? SLATE,
    }}
  >
    {children}
  </div>
);

/* ---------------------------------------------------------------- */
/* Slide 1: hook. Situs aman bertahun-tahun, tiba-tiba ada admin      */
/* baru tanpa login. Hero kata ADMIN merah, badge AKUN BARU.           */
/* ---------------------------------------------------------------- */

const Slide1: React.FC<{ local: number }> = ({ local }) => {
  const heroPop = spring({
    frame: local - 24,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  return (
    <Chrome
      title="Admin Tanpa Login"
      activeStep={0}
      local={local}
      time={local / FPS}
      caption={CAPTIONS[0]}
    >
      <Panel x={0} y={10} w={870} h={150} style={enterStyle(local, 6, 16)}>
        <div style={{ fontSize: 40, fontWeight: 800, color: INK }}>
          Situs Drupal
        </div>
        <div style={{ fontSize: 26, color: SLATE, marginTop: 10 }}>
          jalan bertahun-tahun, aman-aman saja
        </div>
        <div
          style={{
            position: "absolute",
            right: 24,
            top: 24,
            border: `2px solid ${GREEN}`,
            color: GREEN,
            borderRadius: 999,
            padding: "10px 20px",
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          AKTIF
        </div>
      </Panel>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 190,
          width: 870,
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 190,
          lineHeight: 1,
          fontWeight: 400,
          color: RED,
          transform: `scale(${heroPop})`,
          ...enterStyle(local, 18, 10),
        }}
      >
        ADMIN
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 400,
          width: 870,
          display: "flex",
          justifyContent: "center",
          ...enterStyle(local, 30, 12),
        }}
      >
        <div
          style={{
            border: `2px solid ${AMBER}`,
            background: "rgba(242,169,59,0.10)",
            color: AMBER,
            borderRadius: 999,
            padding: "14px 36px",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 3,
            transform: "rotate(-1.5deg)",
          }}
        >
          AKUN BARU
        </div>
      </div>
      <Panel
        x={0}
        y={500}
        w={870}
        h={170}
        border={RED}
        style={enterStyle(local, 42, 20)}
      >
        <div style={{ fontSize: 40, fontWeight: 800, color: INK }}>
          Orang asing
        </div>
        <div style={{ fontSize: 26, color: SLATE, marginTop: 10 }}>
          tanpa login, tanpa password
        </div>
        <div
          style={{
            position: "absolute",
            right: 24,
            top: 24,
            border: `2px solid ${RED}`,
            color: RED,
            borderRadius: 999,
            padding: "10px 20px",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          TANPA LOGIN
        </div>
      </Panel>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 2: kronologi. Ribuan request, dua resource mengering         */
/* (koneksi database dan port TCP) sampai nol. Hero angka 0 merah.     */
/* ---------------------------------------------------------------- */

const Slide2: React.FC<{ local: number }> = ({ local }) => {
  const drain = interpolate(local, [24, 180], [1, 0.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const resources = [
    { label: "KONEKSI DATABASE", delay: 12 },
    { label: "PORT TCP", delay: 20 },
  ];
  return (
    <Chrome
      title="Banjir Request"
      activeStep={1}
      local={local}
      time={(270 + local) / FPS}
      code={[
        <>GET /install.php</>,
        <span key="r" style={{ color: SLATE }}>
          diulang ribuan kali sampai habis
        </span>,
      ]}
      caption={CAPTIONS[1]}
    >
      <Panel x={0} y={10} w={520} h={120} style={enterStyle(local, 6, 16)}>
        <div style={{ fontSize: 30, fontWeight: 800, color: INK }}>
          PENYERANG
        </div>
        <div style={{ fontSize: 24, color: SLATE, marginTop: 8 }}>
          ribuan request ke install.php
        </div>
      </Panel>
      {/* Dua bar saja: file descriptor HANYA titik awal riset Searchlight,
          tidak praktis melawan Drupal, jadi tidak disajikan sebagai vektor.
          Vektor terbukti: koneksi database dan port TCP. */}
      {resources.map((r, i) => (
        <div
          key={r.label}
          style={{
            position: "absolute",
            left: 0,
            top: 170 + i * 130,
            width: 520,
            ...enterStyle(local, r.delay, 16),
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2,
              color: SLATE,
              marginBottom: 10,
            }}
          >
            {r.label}
          </div>
          <div
            style={{
              width: 520,
              height: 34,
              background: "#1D1409",
              border: `1px solid ${PANEL_LINE}`,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${drain * 100}%`,
                height: "100%",
                background: drain > 0.4 ? AMBER : RED,
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 440,
          width: 520,
          fontSize: 26,
          lineHeight: 1.4,
          color: SLATE,
          ...enterStyle(local, 36, 16),
        }}
      >
        banjir request, database menolak koneksi baru
      </div>
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 170,
          width: 310,
          textAlign: "center",
          ...enterStyle(local, 36, 10),
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 300,
            lineHeight: 1,
            fontWeight: 400,
            color: RED,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          0
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 2,
            color: SLATE,
            marginTop: 8,
          }}
        >
          RESOURCE TERSISA
        </div>
      </div>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 3: mekanisme inti. Installer bangun lagi, akun admin baru    */
/* dibuat. Hero angka 1 merah, satu push-in lambat.                    */
/* ---------------------------------------------------------------- */

const Slide3: React.FC<{ local: number }> = ({ local }) => {
  const pop = spring({
    frame: local - 90,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  // Satu push-in lambat, 1 ke 1.08, saat akun admin dibuat.
  const zoom = interpolate(local, [90, 300], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const badgeIn = enter(local, 120, 10);
  return (
    <Chrome
      title="Installer Bangun Lagi"
      activeStep={2}
      local={local}
      time={(660 + local) / FPS}
      stageScale={zoom}
      code={[
        <>POST /install.php</>,
        <>
          database = "db.sqlite
          <span style={{ color: RED }}>.php</span>"
        </>,
      ]}
      caption={CAPTIONS[2]}
    >
      <Panel x={0} y={10} w={870} h={150} style={enterStyle(local, 6, 16)}>
        <div style={{ fontSize: 34, fontWeight: 800, color: INK }}>
          INSTALL DRUPAL
        </div>
        <div style={{ fontSize: 26, color: SLATE, marginTop: 10 }}>
          pilih bahasa, atur database, buat akun admin
        </div>
        <div
          style={{
            position: "absolute",
            right: 24,
            top: 24,
            border: `2px solid ${AMBER}`,
            color: AMBER,
            borderRadius: 999,
            padding: "10px 20px",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          WIZARD
        </div>
      </Panel>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 180,
          width: 870,
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 320,
          lineHeight: 1,
          fontWeight: 400,
          color: RED,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${pop})`,
        }}
      >
        1
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 540,
          width: 870,
          display: "flex",
          justifyContent: "center",
          opacity: badgeIn,
          transform: `translateY(${(1 - badgeIn) * 12}px)`,
        }}
      >
        <div
          style={{
            border: `2px solid ${RED}`,
            background: "rgba(229,72,77,0.10)",
            color: RED,
            borderRadius: 999,
            padding: "14px 36px",
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 3,
            transform: "rotate(1deg)",
          }}
        >
          USER 1 DIBUAT
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 640,
          width: 870,
          textAlign: "center",
          fontSize: 30,
          color: SLATE,
          opacity: badgeIn,
        }}
      >
        installer mengira situs belum terinstall
      </div>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 4: kenapa ini parah. Hero 9.8 merah, badge CISA KEV,        */
/* empat chip versi semuanya KENA.                                    */
/* ---------------------------------------------------------------- */

const Slide4: React.FC<{ local: number }> = ({ local }) => {
  const heroPop = spring({
    frame: local - 12,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  const badgeIn = enter(local, 60, 10);
  const versions = ["8.9", "9", "10", "11"];
  return (
    <Chrome
      title="Skor 9.8"
      activeStep={3}
      local={local}
      time={(1080 + local) / FPS}
      code={[
        <>CVE-2026-132165</>,
        <span key="r" style={{ color: SLATE }}>
          pre-auth RCE, tanpa login
        </span>,
      ]}
      caption={CAPTIONS[3]}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 6,
          width: 870,
          textAlign: "center",
          ...enterStyle(local, 6, 10),
        }}
      >
        {/* Atribusi skor: 9.8 adalah skor NVD/NIST. Drupal sendiri
            sebagai CNA memberi 8.1. Jangan tampilkan 9.8 tanpa sumber. */}
        <Label>CVSS · NVD</Label>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 36,
          width: 870,
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 320,
          lineHeight: 1,
          fontWeight: 400,
          color: RED,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${heroPop})`,
        }}
      >
        9.8
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 400,
          width: 870,
          display: "flex",
          justifyContent: "center",
          opacity: badgeIn,
          transform: `translateY(${(1 - badgeIn) * 12}px)`,
        }}
      >
        <div
          style={{
            border: `2px solid ${AMBER}`,
            background: "rgba(242,169,59,0.10)",
            color: AMBER,
            borderRadius: 999,
            padding: "14px 36px",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 3,
          }}
        >
          CISA KEV, DIEKSPLOITASI
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 520,
          width: 870,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {versions.map((v, i) => (
          <div
            key={v}
            style={{
              width: 200,
              height: 150,
              background: PANEL,
              border: `1px solid ${RED}`,
              borderRadius: 18,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 2px 0 rgba(0,0,0,0.35), 6px 6px 0 #1D1409, 6px 6px 0 1px #3E301D, 10px 12px 24px rgba(0,0,0,0.45)",
              transform: `rotate(${i % 2 === 0 ? -0.8 : 0.8}deg)`,
              ...enterStyle(local, 72 + i * 8, 16),
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 64,
                lineHeight: 1,
                color: INK,
              }}
            >
              {v}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: RED,
                letterSpacing: 2,
                marginTop: 8,
              }}
            >
              KENA
            </div>
          </div>
        ))}
      </div>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 5: solusi. Hero AMAN hijau, tiga kartu langkah, strip        */
/* peringatan amber tepi sobek soal patch susulan.                     */
/* ---------------------------------------------------------------- */

const Slide5: React.FC<{ local: number }> = ({ local }) => {
  const heroPop = spring({
    frame: local - 12,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  const steps = [
    {
      n: "1",
      t: "Update ke versi patch",
      s: "11.4.13, 11.3.22, 10.6.22",
    },
    {
      n: "2",
      t: "Jalankan update.php",
      s: "sampai tuntas, jangan diskip",
    },
    {
      n: "3",
      t: "Blokir install.php",
      s: "cek akun user 1, emailnya masih milikmu",
    },
  ];
  const warnIn = enter(local, 96, 12);
  return (
    <Chrome
      title="Update dan Kunci"
      activeStep={4}
      local={local}
      time={(1440 + local) / FPS}
      code={[
        <>composer update drupal/core</>,
        // Panduan resmi Drupal: JANGAN pakai exact match `location =`,
        // tidak menangkap /core/install.php/foo. Yang benar ^~ + 404.
        <>location ^~ /core/install.php {"{ return 404; }"}</>,
      ]}
      caption={CAPTIONS[4]}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 870,
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 150,
          lineHeight: 1,
          fontWeight: 400,
          color: GREEN,
          transform: `scale(${heroPop})`,
          ...enterStyle(local, 6, 10),
        }}
      >
        AMAN
      </div>
      {steps.map((st, i) => (
        <Panel
          key={st.n}
          x={0}
          y={170 + i * 140}
          w={870}
          h={126}
          style={enterStyle(local, 24 + i * 10, 16)}
        >
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 27,
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: PANEL_LINE,
              color: INK,
              fontSize: 36,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {st.n}
          </div>
          <div style={{ marginLeft: 110 }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: INK,
                lineHeight: 1.15,
              }}
            >
              {st.t}
            </div>
            <div
              style={{
                fontSize: 24,
                color: SLATE,
                marginTop: 4,
                lineHeight: 1.3,
              }}
            >
              {st.s}
            </div>
          </div>
        </Panel>
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 600,
          width: 870,
          background: "rgba(242,169,59,0.10)",
          border: `2px solid ${AMBER}`,
          padding: "18px 24px",
          boxSizing: "border-box",
          clipPath: tornClip(870, 110, 21, true, true),
          opacity: warnIn,
          transform: `translateY(${(1 - warnIn) * 12}px)`,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: AMBER,
          }}
        >
          Patch pertama belum cukup, ada CVE-2026-136716
        </div>
        <div style={{ fontSize: 24, color: INK, marginTop: 6 }}>
          update ke 11.4.14 / 11.3.23 / 10.6.23
        </div>
      </div>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Komposisi utama: hard cut antar slide.                            */
/* ---------------------------------------------------------------- */

export const Video22Fail2Install: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = slideIndex(frame);
  const local = frame - SLIDES[idx].start;
  if (idx === 0) return <Slide1 local={local} />;
  if (idx === 1) return <Slide2 local={local} />;
  if (idx === 2) return <Slide3 local={local} />;
  if (idx === 3) return <Slide4 local={local} />;
  return <Slide5 local={local} />;
};
