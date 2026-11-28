// "DiBalikLayarVcenter": format "Di Balik Layar" EP 02.
// Topik: CVE-2026-123890, auth bypass di VMware Directory Service (vmdird).
// 5 slide, 60 detik, 1800 frame @30fps, 1080x1920.
// Palet: sama seperti EP 01 (Devnoobie). Latar cokelat-hitam #1B140D,
// panel #251C12, oranye #EF7D1A, amber #F2A93B, merah #E5484D,
// hijau mint #35C48D, teks putih hangat #F7F2E9, sekunder #AB9E8A.
// EFFECT PAPER (sama seperti EP 01): tekstur kertas halus di latar
// (SVG feTurbulence, opacity rendah), panel seperti potongan kertas
// berlapis (bayangan bertumpuk + tepi atas lebih terang), tepi sobek
// halus di strip kode dan strip peringatan slide 5, nuansa vintage lewat
// vignette hangat tipis. Kertasnya kertas GELAP, palet tidak berubah.
// Layout FORMAT.md: kicker + chip EP 02, judul pendek, rel langkah vertikal
// 5 titik di kiri, panggung diagram, angka hero tabular-nums, strip kode
// mono maks 2 baris, kalimat penjelas per kalimat, zona aman bawah 300px.
// Subtitle karaoke per kalimat sejak awal (pelajaran EP 01): kalimat
// penjelas adalah naskah VO PERSIS kata per kata, hanya kalimat yang sedang
// diucapkan yang tampil, maksimal 2 baris, font 40px. Waktu tiap kata
// masih ESTIMASI proporsional (captions23.ts); setelah VO direkam diganti
// hasil WhisperX per baris seperti EP 01.
// Motion: Corporate 200-400ms, easing cubic-bezier(0.2,0,0,1), tiga layer,
// reveal node lalu edge lalu label, stagger 6-10 frame, hard cut antar slide.
// Kamera LOCKED-OFF kecuali satu push-in lambat di slide 2.
// Semua diagram dari div/SVG, tanpa prop GLB, tanpa karakter, tanpa watermark
// (watermark "newdev" tengah ditempel belakangan pakai ffmpeg seperti EP 01).
// FAKTA (laporan riset 28 Nov 2026): skor 9.8 dari Broadcom; penyerang
// memulai SENDIRI login yang ia bajak, tanpa admin online; ARMORY CASTLE
// diduga terkait Tiongkok; vCenter 7.0 tanpa patch publik; angka 52.989
// TIDAK dipakai; CVE-2026-123903 TIDAK disamakan.
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
import { CAPTIONS, type KaraokeWord } from "./captions23";

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
  { start: 0, title: "Ruang Kendali", step: 0 },
  { start: 270, title: "Kunci Sesi Dicuri", step: 1 },
  { start: 660, title: "ARMORY CASTLE", step: 2 },
  { start: 1080, title: "Skor 9.8", step: 3 },
  { start: 1440, title: "Patch dan Berburu", step: 4 },
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
// hanya kalimat yang sedang diucapkan VO yang tampil di layar, maks 2 baris.
// Kata-kata tetap naskah VO PERSIS, waktu tiap kata masih ESTIMASI
// proporsional (captions23.ts). Kalimat ditentukan dari kata yang diakhiri
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
      EP 02
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
/* Slide 1: hook. vCenter ruang kendali semua VM dan host, direbut   */
/* tanpa password. Hero kata DIREBUT merah, badge TANPA PASSWORD.      */
/* ---------------------------------------------------------------- */

const Slide1: React.FC<{ local: number }> = ({ local }) => {
  const heroPop = spring({
    frame: local - 24,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  return (
    <Chrome
      title="Ruang Kendali"
      activeStep={0}
      local={local}
      time={local / FPS}
      caption={CAPTIONS[0]}
    >
      <Panel x={0} y={10} w={870} h={150} style={enterStyle(local, 6, 16)}>
        <div style={{ fontSize: 40, fontWeight: 800, color: INK }}>
          vCenter
        </div>
        <div style={{ fontSize: 26, color: SLATE, marginTop: 10 }}>
          ruang kendali semua VM dan host
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
          KONTROL PENUH
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
        DIREBUT
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
          TANPA PASSWORD
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
          Penyerang
        </div>
        <div style={{ fontSize: 26, color: SLATE, marginTop: 10 }}>
          jadi admin tanpa login
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
/* Slide 2: mekanisme inti. Tiga langkah (mulai login, minta kunci,   */
/* jadi admin) lalu hero angka 2012 merah, satu push-in lambat.        */
/* FAKTA: penyerang memulai SENDIRI login yang ia bajak, tidak ada     */
/* admin yang harus sedang online (Rapid7).                            */
/* ---------------------------------------------------------------- */

const Slide2: React.FC<{ local: number }> = ({ local }) => {
  // Satu push-in lambat, 1 ke 1.08, saat kunci sesi diminta.
  const zoom = interpolate(local, [90, 300], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const steps = [
    { n: "1", t: "MULAI LOGIN" },
    { n: "2", t: "MINTA KUNCI" },
    { n: "3", t: "JADI ADMIN" },
  ];
  return (
    <Chrome
      title="Kunci Sesi Dicuri"
      activeStep={1}
      local={local}
      time={(270 + local) / FPS}
      stageScale={zoom}
      code={[
        <>DCE/RPC : 2012</>,
        <span key="r" style={{ color: SLATE }}>
          kunci sesi login diberikan tanpa bukti password
        </span>,
      ]}
      caption={CAPTIONS[1]}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 10,
          width: 870,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div
              style={{
                width: 260,
                height: 140,
                background: PANEL,
                border: `1px solid ${PANEL_LINE}`,
                borderRadius: 18,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 2px 0 rgba(0,0,0,0.35), 6px 6px 0 #1D1409, 6px 6px 0 1px #3E301D, 10px 12px 24px rgba(0,0,0,0.45)",
                transform: `rotate(${i % 2 === 0 ? -0.8 : 0.8}deg)`,
                ...enterStyle(local, 6 + i * 10, 16),
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: i === 2 ? RED : PANEL_LINE,
                  color: INK,
                  fontSize: 28,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: 1,
                  marginTop: 10,
                }}
              >
                {s.t}
              </div>
            </div>
            {i < 2 && (
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: ACCENT,
                  ...enterStyle(local, 14 + i * 10, 10),
                }}
              >
                {"\u2192"}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 190,
          width: 870,
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 260,
          lineHeight: 1,
          fontWeight: 400,
          color: RED,
          fontVariantNumeric: "tabular-nums",
          ...enterStyle(local, 30, 10),
        }}
      >
        2012
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 470,
          width: 870,
          textAlign: "center",
          ...enterStyle(local, 42, 10),
        }}
      >
        <Label>PORT TCP · DCE/RPC</Label>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 520,
          width: 870,
          textAlign: "center",
          fontSize: 26,
          color: SLATE,
          ...enterStyle(local, 48, 16),
        }}
      >
        penyerang memulai sendiri login yang ia bajak
      </div>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 3: siapa pelakunya. Masuk lewat BeyondTrust, SAML palsu      */
/* lolos MFA, NTDS.dit dicuri dari disk VM. Hero kata SAML merah.      */
/* ---------------------------------------------------------------- */

const Slide3: React.FC<{ local: number }> = ({ local }) => {
  const heroPop = spring({
    frame: local - 90,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  const badgeIn = enter(local, 120, 10);
  return (
    <Chrome
      title="ARMORY CASTLE"
      activeStep={2}
      local={local}
      time={(660 + local) / FPS}
      code={[
        <>CVE-2026-102764</>,
        <span key="r" style={{ color: SLATE }}>
          BeyondTrust, pintu masuk penyerang
        </span>,
      ]}
      caption={CAPTIONS[2]}
    >
      <Panel x={0} y={10} w={870} h={150} style={enterStyle(local, 6, 16)}>
        <div style={{ fontSize: 34, fontWeight: 800, color: INK }}>
          BEYONDTRUST
        </div>
        <div style={{ fontSize: 26, color: SLATE, marginTop: 10 }}>
          celah CVE-2026-102764, pintu masuk
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
          AGU 2026
        </div>
      </Panel>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 185,
          width: 870,
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 280,
          lineHeight: 1,
          fontWeight: 400,
          color: RED,
          transform: `scale(${heroPop})`,
        }}
      >
        SAML
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 480,
          width: 870,
          textAlign: "center",
          ...enterStyle(local, 96, 10),
        }}
      >
        <Label>LOGIN PALSU</Label>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 530,
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
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 3,
            transform: "rotate(1deg)",
          }}
        >
          LOLOS MFA
        </div>
      </div>
      <Panel
        x={0}
        y={630}
        w={870}
        h={150}
        border={RED}
        style={enterStyle(local, 132, 16)}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: INK,
            fontFamily: MONO,
          }}
        >
          NTDS.dit
        </div>
        <div style={{ fontSize: 26, color: SLATE, marginTop: 10 }}>
          database Active Directory dicuri dari disk VM
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
          DICURI
        </div>
      </Panel>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 4: kenapa ini parah. Hero 9.8 merah, badge CISA KEV,        */
/* dua kartu: 7.0 tanpa patch publik, 23 Nov tenggat KEV lewat.       */
/* Atribusi skor: 9.8 adalah skor Broadcom/VMware sebagai CNA.        */
/* NVD belum menerbitkan skornya sendiri per 28 Nov 2026.             */
/* ---------------------------------------------------------------- */

const Slide4: React.FC<{ local: number }> = ({ local }) => {
  const heroPop = spring({
    frame: local - 12,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  const badgeIn = enter(local, 60, 10);
  const cards = [
    { big: "7.0", small: "TANPA PATCH PUBLIK" },
    { big: "23 NOV", small: "TENGGAT KEV LEWAT" },
  ];
  return (
    <Chrome
      title="Skor 9.8"
      activeStep={3}
      local={local}
      time={(1080 + local) / FPS}
      code={[
        <>CVE-2026-123890</>,
        <span key="r" style={{ color: SLATE }}>
          auth bypass, tanpa login
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
        <Label>CVSS · BROADCOM</Label>
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
        {cards.map((c, i) => (
          <div
            key={c.big}
            style={{
              width: 425,
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
              {c.big}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: RED,
                letterSpacing: 2,
                marginTop: 8,
              }}
            >
              {c.small}
            </div>
          </div>
        ))}
      </div>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 5: solusi. Hero PATCH hijau, tiga kartu langkah, strip       */
/* peringatan amber tepi sobek: patch saja tidak cukup.                */
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
      s: "8.0 U3m, 9.0.2.0200, 9.1.1.0200",
    },
    {
      n: "2",
      t: "Periksa admin SSO baru",
      s: "cari akun asing di vsphere.local",
    },
    {
      n: "3",
      t: "Rotasi kunci SAML",
      s: "kunci lama masih bisa dipakai",
    },
  ];
  const warnIn = enter(local, 96, 12);
  return (
    <Chrome
      title="Patch dan Berburu"
      activeStep={4}
      local={local}
      time={(1440 + local) / FPS}
      code={[
        <>8.0 U3m / 9.0.2.0200 / 9.1.1.0200</>,
        <span key="r" style={{ color: SLATE }}>
          batasi port 2012 hanya untuk yang berhak
        </span>,
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
        PATCH
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
          Patch saja tidak cukup
        </div>
        <div style={{ fontSize: 24, color: INK, marginTop: 6 }}>
          penyerang yang sudah masuk tidak ikut terhapus
        </div>
      </div>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Komposisi utama: hard cut antar slide.                            */
/* ---------------------------------------------------------------- */

export const Video23Vcenter: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = slideIndex(frame);
  const local = frame - SLIDES[idx].start;
  if (idx === 0) return <Slide1 local={local} />;
  if (idx === 1) return <Slide2 local={local} />;
  if (idx === 2) return <Slide3 local={local} />;
  if (idx === 3) return <Slide4 local={local} />;
  return <Slide5 local={local} />;
};
