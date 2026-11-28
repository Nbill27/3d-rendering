// "DiBalikLayarRaceCondition": format "Di Balik Layar" EP 01.
// Topik: race condition, stok jadi minus (dua pembeli berebut barang terakhir).
// 5 slide, 60 detik, 1800 frame @30fps, 1080x1920.
// Palet: mengikuti video TikTok Devnoobie atas perintah bill (28 Nov 2026),
// bukan palet invented sendiri. Latar cokelat-hitam #1B140D, panel #251C12,
// oranye #EF7D1A sebagai aksen utama, amber-oranye #F2A93B untuk peringatan,
// merah #E5484D untuk gagal, hijau mint #35C48D untuk berhasil,
// teks putih hangat #F7F2E9, sekunder #AB9E8A. Cyan dan biru navy dihapus.
// Layout FORMAT.md: kicker + chip EP 01, judul pendek, rel langkah
// vertikal 5 titik di kiri, panggung diagram, angka hero tabular-nums,
// strip kode mono maks 2 baris, satu kalimat penjelas, zona aman bawah 300px.
// Kalimat penjelas adalah subtitle karaoke (revisi 28 Nov 2026, perintah
// bill): tiap kata oranye hanya saat diucapkan VO, kata lain putih hangat.
// Motion: Corporate 200-400ms, easing cubic-bezier(0.2,0,0,1),
// tiga layer (primary, secondary, ambient), reveal node lalu edge lalu
// label, stagger 6-10 frame, total stagger di bawah 500ms.
// Kamera LOCKED-OFF kecuali satu push-in lambat di slide 3.
// Semua diagram dari div/SVG, tanpa prop GLB, tanpa karakter, tanpa watermark.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
} from "remotion";
// Font terbundel lokal lewat Fontsource, bukan font sistem, supaya hasil
// render lokal dan GitHub Actions sama persis. Anton (display, 400) untuk
// judul dan angka hero, Poppins (400-800) untuk badan teks, JetBrains Mono
// (400/500/700) untuk strip kode.
import "@fontsource/anton/400.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";

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
  { start: 0, title: "Stok Jadi Minus", step: 0 },
  { start: 270, title: "Keduanya Baca 1", step: 1 },
  { start: 660, title: "1, 0, Minus 1", step: 2 },
  { start: 1080, title: "Cek Dulu Itu Tidak Aman", step: 3 },
  { start: 1440, title: "Satu Langkah Atomik", step: 4 },
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
/* Chrome tetap: latar gelombang, kicker, judul, rel langkah,         */
/* strip kode, kalimat penjelas.                                     */
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

type KaraokeWord = { t: string; start: number; end: number };

// Subtitle karaoke per kalimat (revisi 28 Nov 2026, perintah bill): hanya
// kalimat yang sedang diucapkan VO yang tampil di layar, 1-2 baris saja.
// Kata-kata tetap naskah VO PERSIS, waktu tiap kata dari WhisperX per baris
// dengan offset trim-corrected (audio/verbatim_timings.json). Kalimat
// ditentukan dari kata yang diakhiri titik atau tanda tanya. Di jeda antar
// kalimat tidak ada subtitle yang tampil, kalimat berikutnya muncul saat kata
// pertamanya mulai diucapkan. Hanya kata yang sedang diucapkan yang oranye,
// kata lain putih hangat.
const Caption: React.FC<{ words: KaraokeWord[]; local: number; time: number }> = ({
  words,
  local,
  time,
}) => {
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
    (s) => time >= s[0].start && time < s[s.length - 1].end
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
}> = ({ title, activeStep, local, code, dividerAfter, caption, children, stageScale = 1, time }) => (
  <AbsoluteFill style={{ background: BG, fontFamily: SANS }}>
    <Waves />
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
    {code && <CodeStrip lines={code} local={local} dividerAfter={dividerAfter} />}
    <Caption words={caption} local={local} time={time} />
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- */
/* Elemen kecil                                                       */
/* ---------------------------------------------------------------- */

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
/* Slide 1: hook. Hero 1, dua pembeli tekan BELI, kotak Sneakers.    */
/* ---------------------------------------------------------------- */

const Slide1: React.FC<{ local: number }> = ({ local }) => {
  const press = enter(local, 36, 10); // tombol ditekan: scale ke 0.96
  const heroPop = spring({
    frame: local - 12,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  return (
    <Chrome
      title="Stok Jadi Minus"
      activeStep={0}
      local={local}
      time={local / FPS}
      caption={[
        { t: "Satu ", start: 0.123, end: 0.324 },
        { t: "barang ", start: 0.364, end: 0.565 },
        { t: "tersisa ", start: 0.625, end: 0.966 },
        { t: "di ", start: 1.006, end: 1.100 },
        { t: "toko ", start: 1.100, end: 1.288 },
        { t: "online. ", start: 1.328, end: 1.649 },
        { t: "Dua ", start: 1.950, end: 2.071 },
        { t: "orang ", start: 2.131, end: 2.312 },
        { t: "menekan ", start: 2.332, end: 2.573 },
        { t: "tombol ", start: 2.633, end: 2.834 },
        { t: "beli ", start: 2.895, end: 3.075 },
        { t: "di ", start: 3.115, end: 3.176 },
        { t: "detik ", start: 3.196, end: 3.397 },
        { t: "yang ", start: 3.417, end: 3.517 },
        { t: "sama. ", start: 3.598, end: 3.839 },
        { t: "Satu ", start: 4.180, end: 4.361 },
        { t: "dapat ", start: 4.401, end: 4.562 },
        { t: "barangnya, ", start: 4.622, end: 4.963 },
        { t: "satu ", start: 5.225, end: 5.385 },
        { t: "lagi ", start: 5.425, end: 5.586 },
        { t: "tetap ", start: 5.626, end: 5.827 },
        { t: "ditagih. ", start: 5.847, end: 6.831 },
        { t: "Kok ", start: 6.912, end: 6.992 },
        { t: "bisa?", start: 7.052, end: 7.293 },
      ]}
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
        <Label>SISA STOK</Label>
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
          color: ACCENT,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${heroPop})`,
        }}
      >
        1
      </div>
      {(["Pembeli A", "Pembeli B"] as const).map((name, i) => (
        <Panel
          key={name}
          x={i === 0 ? 0 : 450}
          y={380}
          w={420}
          h={190}
          style={enterStyle(local, 18 + i * 8, 20)}
        >
          <div style={{ fontSize: 40, fontWeight: 800, color: INK }}>
            {name}
          </div>
          <div style={{ fontSize: 26, color: SLATE, marginTop: 8 }}>
            menekan tombol beli
          </div>
          <div
            style={{
              marginTop: 22,
              display: "inline-block",
              background: ACCENT,
              color: "#2B1A05",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 2,
              borderRadius: 999,
              padding: "12px 34px",
              transform: `scale(${1 - 0.04 * press})`,
              boxShadow: `0 0 24px ${ACCENT}66`,
            }}
          >
            BELI
          </div>
        </Panel>
      ))}
      <Panel
        x={0}
        y={610}
        w={870}
        h={170}
        style={enterStyle(local, 36, 20)}
      >
        <div style={{ fontSize: 46, fontWeight: 800, color: INK }}>
          Sneakers
        </div>
        <div style={{ fontSize: 28, color: SLATE, marginTop: 10 }}>
          Rp899.000, satu unit terakhir di toko online
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
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          SISA 1
        </div>
      </Panel>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 2: kronologi. Dua jalur A/B ke DATABASE, titik berjalan,    */
/* label baca: 1.                                                    */
/* ---------------------------------------------------------------- */

const Slide2: React.FC<{ local: number }> = ({ local }) => {
  const travel = interpolate(local, [24, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const dotX = 240 + travel * 400;
  const chip = enter(local, 156, 10);
  return (
    <Chrome
      title="Keduanya Baca 1"
      activeStep={1}
      local={local}
      time={(270 + local) / FPS}
      code={[
        <>SELECT stok FROM produk WHERE id = 1;</>,
        <span key="r" style={{ color: SLATE }}>
          hasil: 1 (Request A dan B sama)
        </span>,
      ]}
      caption={[
        { t: "Begini ", start: 9.072, end: 9.332 },
        { t: "jalannya. ", start: 9.412, end: 9.773 },
        { t: "Request ", start: 10.435, end: 10.735 },
        { t: "A ", start: 10.795, end: 10.869 },
        { t: "baca ", start: 10.869, end: 11.236 },
        { t: "stok, ", start: 11.297, end: 11.557 },
        { t: "hasilnya ", start: 12.018, end: 12.359 },
        { t: "satu. ", start: 12.439, end: 12.720 },
        { t: "Request ", start: 13.421, end: 13.702 },
        { t: "B ", start: 13.802, end: 13.872 },
        { t: "baca ", start: 13.872, end: 14.223 },
        { t: "stok, ", start: 14.263, end: 14.523 },
        { t: "hasilnya ", start: 15.065, end: 15.385 },
        { t: "juga ", start: 15.445, end: 15.586 },
        { t: "satu. ", start: 15.666, end: 15.906 },
        { t: "Keduanya ", start: 16.608, end: 16.908 },
        { t: "membaca ", start: 16.928, end: 17.249 },
        { t: "di ", start: 17.289, end: 17.349 },
        { t: "saat ", start: 17.410, end: 17.550 },
        { t: "yang ", start: 17.590, end: 17.670 },
        { t: "sama, ", start: 17.730, end: 17.991 },
        { t: "sebelum ", start: 18.452, end: 18.672 },
        { t: "ada ", start: 18.712, end: 18.853 },
        { t: "yang ", start: 18.873, end: 18.953 },
        { t: "sempat ", start: 19.013, end: 19.213 },
        { t: "menulis ", start: 19.233, end: 19.514 },
        { t: "ke ", start: 19.554, end: 19.594 },
        { t: "database.", start: 19.634, end: 20.456 },
      ]}
    >
      <svg
        width={870}
        height={810}
        viewBox="0 0 870 810"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <line
          x1={240}
          y1={135}
          x2={640}
          y2={135}
          stroke={PANEL_LINE}
          strokeWidth={4}
        />
        <line
          x1={240}
          y1={135}
          x2={640}
          y2={135}
          stroke={ACCENT}
          strokeWidth={4}
          strokeDasharray="400"
          strokeDashoffset={400 * (1 - travel)}
          strokeLinecap="round"
        />
        <line
          x1={240}
          y1={415}
          x2={640}
          y2={415}
          stroke={PANEL_LINE}
          strokeWidth={4}
        />
        <line
          x1={240}
          y1={415}
          x2={640}
          y2={415}
          stroke={ACCENT}
          strokeWidth={4}
          strokeDasharray="400"
          strokeDashoffset={400 * (1 - travel)}
          strokeLinecap="round"
        />
        <circle cx={dotX} cy={135} r={13} fill={ACCENT} />
        <circle cx={dotX} cy={135} r={22} fill={ACCENT} opacity={0.25} />
        <circle cx={dotX} cy={415} r={13} fill={ACCENT} />
        <circle cx={dotX} cy={415} r={22} fill={ACCENT} opacity={0.25} />
      </svg>
      <Panel x={0} y={75} w={230} h={120} style={enterStyle(local, 6, 16)}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          Request A
        </div>
        <div style={{ fontSize: 24, color: SLATE, marginTop: 6 }}>
          klik BELI
        </div>
      </Panel>
      <Panel x={0} y={355} w={230} h={120} style={enterStyle(local, 12, 16)}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          Request B
        </div>
        <div style={{ fontSize: 24, color: SLATE, marginTop: 6 }}>
          klik BELI
        </div>
      </Panel>
      <Panel x={650} y={60} w={220} h={440} style={enterStyle(local, 18, 16)}>
        <Label>DATABASE</Label>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 130,
            lineHeight: 1,
            fontWeight: 400,
            color: ACCENT,
            fontVariantNumeric: "tabular-nums",
            marginTop: 60,
            textAlign: "center",
          }}
        >
          1
        </div>
        <div
          style={{
            fontSize: 28,
            color: SLATE,
            textAlign: "center",
            marginTop: 16,
          }}
        >
          stok tersisa
        </div>
        <div
          style={{
            fontSize: 24,
            color: SLATE,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          produk id 1
        </div>
      </Panel>
      {([95, 375] as const).map((y, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 400,
            top: y,
            background: "#221709",
            border: `1px solid ${ACCENT}`,
            color: ACCENT,
            borderRadius: 999,
            padding: "10px 22px",
            fontSize: 28,
            fontWeight: 800,
            opacity: chip,
            transform: `translateY(${(1 - chip) * 10}px)`,
          }}
        >
          baca: 1
        </div>
      ))}
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 3: twist. Count-down 1, 0, -1, label LOST UPDATE,           */
/* satu push-in lambat ke angka hero.                                */
/* ---------------------------------------------------------------- */

const Slide3: React.FC<{ local: number }> = ({ local }) => {
  const value = local < 45 ? 1 : local < 120 ? 0 : -1;
  const segStart = value === 1 ? 0 : value === 0 ? 45 : 120;
  const pop = spring({
    frame: local - segStart,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  const color = value === 1 ? ACCENT : value === 0 ? INK : RED;
  // Satu push-in lambat, 1 ke 1.1, saat angka jadi minus 1.
  const zoom = interpolate(local, [120, 300], [1, 1.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const labelIn = enter(local, 132, 10);
  return (
    <Chrome
      title="1, 0, Minus 1"
      activeStep={2}
      local={local}
      time={(660 + local) / FPS}
      stageScale={zoom}
      code={[
        <>A: stok = stok - 1, 1 jadi 0</>,
        <span key="b" style={{ color: RED }}>
          B: stok = stok - 1, 0 jadi -1
        </span>,
      ]}
      caption={[
        { t: "Lalu ", start: 22.082, end: 22.443 },
        { t: "keduanya ", start: 22.563, end: 22.924 },
        { t: "lolos ", start: 22.984, end: 23.265 },
        { t: "cek, ", start: 23.385, end: 23.545 },
        { t: "keduanya ", start: 23.766, end: 24.147 },
        { t: "kurangi ", start: 24.227, end: 24.447 },
        { t: "stok. ", start: 24.468, end: 24.848 },
        { t: "Satu ", start: 25.370, end: 25.590 },
        { t: "kurang ", start: 25.650, end: 25.831 },
        { t: "satu ", start: 25.911, end: 26.152 },
        { t: "jadi ", start: 26.232, end: 26.488 },
        { t: "nol, ", start: 26.488, end: 26.693 },
        { t: "nol ", start: 26.974, end: 27.114 },
        { t: "kurang ", start: 27.174, end: 27.374 },
        { t: "satu ", start: 27.455, end: 27.655 },
        { t: "jadi ", start: 27.755, end: 27.933 },
        { t: "minus ", start: 27.933, end: 28.156 },
        { t: "satu. ", start: 28.237, end: 28.557 },
        { t: "Update ", start: 28.938, end: 29.339 },
        { t: "yang ", start: 29.379, end: 29.459 },
        { t: "kedua ", start: 29.500, end: 29.780 },
        { t: "menimpa ", start: 29.820, end: 30.161 },
        { t: "yang ", start: 30.201, end: 30.281 },
        { t: "pertama. ", start: 30.321, end: 30.742 },
        { t: "Ini ", start: 31.123, end: 31.284 },
        { t: "namanya ", start: 31.304, end: 31.645 },
        { t: "race ", start: 31.685, end: 31.845 },
        { t: "condition, ", start: 31.985, end: 32.427 },
        { t: "dan ", start: 32.687, end: 32.787 },
        { t: "update ", start: 32.848, end: 33.108 },
        { t: "yang ", start: 33.128, end: 33.228 },
        { t: "hilang ", start: 33.248, end: 33.449 },
        { t: "itu ", start: 33.509, end: 33.730 },
        { t: "lost ", start: 33.970, end: 34.171 },
        { t: "update.", start: 34.251, end: 35.153 },
      ]}
    >
      <svg
        width={870}
        height={140}
        viewBox="0 0 870 140"
        style={{ position: "absolute", left: 0, top: 10, opacity: 0.5 }}
      >
        <line x1={70} y1={40} x2={620} y2={40} stroke={PANEL_LINE} strokeWidth={3} />
        <line x1={70} y1={100} x2={620} y2={100} stroke={PANEL_LINE} strokeWidth={3} />
        <circle cx={640} cy={40} r={8} fill={ACCENT} />
        <circle cx={640} cy={100} r={8} fill={ACCENT} />
        <rect x={660} y={10} width={180} height={120} rx={12} fill={PANEL} stroke={RED} />
        <text x={750} y={82} fill={RED} fontFamily={DISPLAY} fontSize={34} fontWeight={400} textAnchor="middle">
          -1
        </text>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 170,
          width: 870,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          fontFamily: DISPLAY,
          fontSize: 340,
          lineHeight: 1,
          fontWeight: 400,
          color,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${pop})`,
        }}
      >
        {value === -1 ? (
          <>
            <span>-</span>
            <span style={{ marginLeft: "-0.08em" }}>1</span>
          </>
        ) : (
          String(value)
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 540,
          width: 870,
          display: "flex",
          justifyContent: "center",
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 12}px)`,
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
          }}
        >
          LOST UPDATE
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
          opacity: labelIn,
        }}
      >
        cek pakai stok lama, kuranginya tetap jalan
      </div>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 4: aturan. Tiga langkah, celah amber antara langkah 2 dan 3.*/
/* ---------------------------------------------------------------- */

const Slide4: React.FC<{ local: number }> = ({ local }) => {
  const steps = [
    { n: "1", t: "Baca stok", s: "SELECT stok dari database" },
    { n: "2", t: "Cek stok cukup", s: "if stok >= 1, lanjut" },
    { n: "3", t: "Kurangi stok", s: "UPDATE stok jadi stok - 1" },
  ];
  const gapIn = enter(local, 60, 12);
  return (
    <Chrome
      title="Cek Dulu Itu Tidak Aman"
      activeStep={3}
      local={local}
      time={(1080 + local) / FPS}
      dividerAfter={1}
      code={[
        <>SELECT stok FROM produk WHERE id = 1;</>,
        <>if (stok &gt;= 1) UPDATE stok = stok - 1;</>,
      ]}
      caption={[
        { t: "Masalahnya ", start: 36.072, end: 36.712 },
        { t: "bukan ", start: 36.953, end: 37.173 },
        { t: "di ", start: 37.193, end: 37.284 },
        { t: "ceknya. ", start: 37.284, end: 37.693 },
        { t: "Masalahnya, ", start: 38.234, end: 38.815 },
        { t: "cek ", start: 39.095, end: 39.235 },
        { t: "dan ", start: 39.295, end: 39.395 },
        { t: "kurangi ", start: 39.455, end: 39.756 },
        { t: "itu ", start: 39.796, end: 40.276 },
        { t: "dua ", start: 40.296, end: 40.437 },
        { t: "langkah ", start: 40.497, end: 40.797 },
        { t: "terpisah. ", start: 40.857, end: 41.298 },
        { t: "Di ", start: 41.938, end: 42.052 },
        { t: "celah ", start: 42.052, end: 42.279 },
        { t: "antara ", start: 42.339, end: 42.579 },
        { t: "dua ", start: 42.659, end: 42.759 },
        { t: "langkah ", start: 42.799, end: 43.040 },
        { t: "itu, ", start: 43.100, end: 43.380 },
        { t: "request ", start: 43.620, end: 43.961 },
        { t: "lain ", start: 44.021, end: 44.281 },
        { t: "bisa ", start: 44.481, end: 44.702 },
        { t: "menyelinap ", start: 44.742, end: 45.162 },
        { t: "masuk.", start: 45.222, end: 45.563 },
      ]}
    >
      {steps.slice(0, 2).map((st, i) => (
        <Panel
          key={st.n}
          x={0}
          y={40 + i * 200}
          w={870}
          h={170}
          style={enterStyle(local, 6 + i * 8, 20)}
        >
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 48,
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
            <div style={{ fontSize: 42, fontWeight: 800, color: INK }}>
              {st.t}
            </div>
            <div style={{ fontSize: 28, color: SLATE, marginTop: 10 }}>
              {st.s}
            </div>
          </div>
        </Panel>
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 440,
          width: 870,
          height: 84,
          background: "rgba(242,169,59,0.08)",
          border: `2px dashed ${AMBER}`,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          boxSizing: "border-box",
          opacity: gapIn,
          transform: `translateY(${(1 - gapIn) * 12}px)`,
        }}
      >
        <span
          style={{
            color: AMBER,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 3,
          }}
        >
          CELAH
        </span>
        <span style={{ color: SLATE, fontSize: 28, marginLeft: 20 }}>
          request lain menyelinap masuk
        </span>
        <span
          style={{
            marginLeft: "auto",
            color: AMBER,
            fontSize: 44,
            fontWeight: 800,
          }}
        >
          {"->"}
        </span>
      </div>
      <Panel
        x={0}
        y={554}
        w={870}
        h={170}
        style={{
          ...enterStyle(local, 72, 20),
          border: `1px solid ${RED}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 48,
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#3A1E14",
            color: RED,
            fontSize: 36,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          3
        </div>
        <div style={{ marginLeft: 110 }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: INK }}>
            Kurangi stok
          </div>
          <div style={{ fontSize: 28, color: SLATE, marginTop: 10 }}>
            UPDATE stok jadi stok - 1
          </div>
        </div>
      </Panel>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Slide 5: solusi. Dua jalur menyatu ke satu query atomik,          */
/* angka hero 0 hijau, badge 1 baris / 0 baris.                      */
/* ---------------------------------------------------------------- */

const Slide5: React.FC<{ local: number }> = ({ local }) => {
  const merge = interpolate(local, [24, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const heroPop = spring({
    frame: local - 90,
    fps: FPS,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });
  const badgeIn = enter(local, 120, 10);
  return (
    <Chrome
      title="Satu Langkah Atomik"
      activeStep={4}
      local={local}
      time={(1440 + local) / FPS}
      code={[
        <>UPDATE produk SET stok = stok - 1</>,
        <>
          WHERE id = 1 AND{" "}
          <span style={{ color: ACCENT }}>stok &gt; 0</span>;
        </>,
      ]}
      caption={[
        { t: "Solusinya, ", start: 47.781, end: 48.221 },
        { t: "gabung ", start: 48.441, end: 48.722 },
        { t: "jadi ", start: 48.782, end: 48.922 },
        { t: "satu ", start: 48.982, end: 49.162 },
        { t: "langkah ", start: 49.222, end: 49.482 },
        { t: "atomik. ", start: 49.542, end: 49.842 },
        { t: "Kurangi ", start: 50.142, end: 50.302 },
        { t: "stok ", start: 50.342, end: 50.582 },
        { t: "dan ", start: 50.642, end: 50.723 },
        { t: "cek ", start: 50.783, end: 50.903 },
        { t: "stoknya ", start: 50.923, end: 51.183 },
        { t: "dalam ", start: 51.223, end: 51.383 },
        { t: "satu ", start: 51.443, end: 51.623 },
        { t: "query ", start: 51.703, end: 51.883 },
        { t: "yang ", start: 51.923, end: 52.023 },
        { t: "sama. ", start: 52.063, end: 52.303 },
        { t: "Kalau ", start: 52.683, end: 52.824 },
        { t: "query ", start: 52.864, end: 53.064 },
        { t: "mengubah ", start: 53.084, end: 53.304 },
        { t: "satu ", start: 53.344, end: 53.484 },
        { t: "baris, ", start: 53.524, end: 53.804 },
        { t: "berarti ", start: 53.964, end: 54.224 },
        { t: "berhasil. ", start: 54.244, end: 54.604 },
        { t: "Kalau ", start: 54.985, end: 55.125 },
        { t: "nol ", start: 55.185, end: 55.285 },
        { t: "baris, ", start: 55.345, end: 55.605 },
        { t: "berarti ", start: 55.745, end: 56.005 },
        { t: "stok ", start: 56.025, end: 56.165 },
        { t: "sudah ", start: 56.205, end: 56.305 },
        { t: "habis. ", start: 56.325, end: 56.605 },
        { t: "Jadi, ", start: 57.146, end: 57.366 },
        { t: "kalau ", start: 57.506, end: 57.626 },
        { t: "dua ", start: 57.666, end: 57.766 },
        { t: "request ", start: 57.786, end: 58.006 },
        { t: "sampai ", start: 58.046, end: 58.226 },
        { t: "persis ", start: 58.266, end: 58.486 },
        { t: "bersamaan, ", start: 58.526, end: 58.886 },
        { t: "siapa ", start: 59.107, end: 59.287 },
        { t: "yang ", start: 59.307, end: 59.387 },
        { t: "menang?", start: 59.407, end: 59.607 },
      ]}
    >
      <svg
        width={870}
        height={330}
        viewBox="0 0 870 330"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <line
          x1={210}
          y1={80}
          x2={435}
          y2={250}
          stroke={ACCENT}
          strokeWidth={5}
          strokeDasharray="340"
          strokeDashoffset={340 * (1 - merge)}
          strokeLinecap="round"
        />
        <line
          x1={210}
          y1={200}
          x2={435}
          y2={250}
          stroke={ACCENT}
          strokeWidth={5}
          strokeDasharray="300"
          strokeDashoffset={300 * (1 - merge)}
          strokeLinecap="round"
        />
        <line
          x1={435}
          y1={250}
          x2={435}
          y2={292}
          stroke={ACCENT}
          strokeWidth={12}
          strokeLinecap="round"
          opacity={merge}
        />
        <polygon points="435,317 415,287 455,287" fill={ACCENT} opacity={merge} />
      </svg>
      <Panel x={0} y={40} w={200} h={80} style={enterStyle(local, 6, 16)}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          Request A
        </div>
      </Panel>
      <Panel x={0} y={160} w={200} h={80} style={enterStyle(local, 12, 16)}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          Request B
        </div>
      </Panel>
      <Panel
        x={185}
        y={322}
        w={500}
        h={132}
        style={{
          ...enterStyle(local, 48, 16),
          border: `1px solid ${ACCENT}`,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, color: ACCENT }}>
          SATU QUERY ATOMIK
        </div>
        <div style={{ fontSize: 26, color: SLATE, marginTop: 8 }}>
          cek dan kurangi sekaligus
        </div>
      </Panel>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 460,
          width: 870,
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 300,
          lineHeight: 1,
          fontWeight: 400,
          color: GREEN,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${heroPop})`,
        }}
      >
        0
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 762,
          width: 870,
          display: "flex",
          justifyContent: "center",
          opacity: badgeIn,
          transform: `translateY(${(1 - badgeIn) * 12}px)`,
        }}
      >
        <div
          style={{
            border: `2px solid ${GREEN}`,
            background: "rgba(53,196,141,0.10)",
            color: GREEN,
            borderRadius: 999,
            padding: "14px 30px",
            fontSize: 30,
            fontWeight: 800,
          }}
        >
          1 baris = berhasil, 0 baris = habis
        </div>
      </div>
    </Chrome>
  );
};

/* ---------------------------------------------------------------- */
/* Komposisi utama: hard cut antar slide.                            */
/* ---------------------------------------------------------------- */

export const Video21: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = slideIndex(frame);
  const local = frame - SLIDES[idx].start;
  if (idx === 0) return <Slide1 local={local} />;
  if (idx === 1) return <Slide2 local={local} />;
  if (idx === 2) return <Slide3 local={local} />;
  if (idx === 3) return <Slide4 local={local} />;
  return <Slide5 local={local} />;
};
