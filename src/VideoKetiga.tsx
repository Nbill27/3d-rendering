import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * VideoKetiga — Kebobrokan Pemerintah (satir fiktif), 60 detik, 1080x1920 VERTIKAL 9:16, 30fps.
 * Dibuat ulang dari nol setelah video kedua dinilai berantakan dan alurnya aneh.
 * VERSI VERTIKAL: untuk posting TikTok — BUKAN landscape 1920x1080.
 * DENSITAS (feedback bill 2026-11-24): tiap adegan 8-10+ elemen terlihat,
 * 4-6 karakter, latar berlapis, tidak ada area kosong besar di mana pun.
 *
 * Skills yang diterapkan:
 * - motion_design: kepribadian Playful, checklist 8 langkah, 3 lapis gerak,
 *   aturan kritis (tanpa gerak spasial linear, tanpa opacity-only, max 1/3 layar,
 *   stagger total < 500ms).
 * - remotion_best_practices / remotion-markup: useCurrentFrame di komponen
 *   terkecil, interpolate inline di prop, scale/translate/rotate, bukan transform.
 * - anatomy: satu objek nyata per adegan, dibangun dari banyak bagian kecil yang
 *   punya fungsi; tidak ada muka kosong; bagian duduk di atas bagian lain.
 *
 * Layout grid VERTIKAL (mengikat, lihat SCRIPT.md):
 * - Kanvas 1080 x 1920.
 * - Bar atas: progress 8px di y 0; badge kiri + label fiktif kanan di y 140
 *   (badge max 220px, label max 400px, font 18-24). Jarak tengah min 60px.
 * - Zona panggung y 260-1240 (tinggi 980): semua aksi di sini. Garis tanah y 1090
 *   absolut (relatif panggung 830). Tidak ada elemen panggung melewati y 1240.
 * - Zona judul y 1280-1520 (tinggi 240): font 54, maks 2 baris, rata tengah, max 984.
 * - Zona aman bawah y 1520-1920 (400px): KOSONG — ruang untuk caption & tombol TikTok.
 *   Tidak ada teks, karakter, atau elemen penting di zona ini.
 * - Zona aman kanan bawah TikTok (tombol like/komen) juga dihindari: tidak ada
 *   elemen penting di x 900-1080, y 1240-1920.
 */

const SCENE_FRAMES = 300;
const ACCENT = "#C2410C";
const INK = "#191930";
const SKIN = "#FFDBAC";

const SCENES = [
  { badge: "ADEGAN 1", title: "Jalan Berlubang, Dompet Tipis", bg: "#BFE3FF" },
  { badge: "ADEGAN 2", title: "Janji di Panggung", bg: "#FFE4C7" },
  { badge: "ADEGAN 3", title: "Proyek Besar, Mangkrak", bg: "#D6D3D1" },
  { badge: "ADEGAN 4", title: "Anggaran Bocor", bg: "#14532D" },
  { badge: "ADEGAN 5", title: "Antre Terus, Cap Terus", bg: "#FEF3C7" },
  { badge: "ADEGAN 6", title: "Selanjutnya, Kamu Mau Jadi Apa?", bg: "#FDE68A" },
];

function sceneIndex(frame: number): number {
  return Math.min(5, Math.floor(frame / SCENE_FRAMES));
}

/** Spring masuk Playful: overshoot kecil, 150-300ms. */
function enterSpring(local: number, delay: number, fps: number): number {
  return spring({
    frame: Math.max(0, local - delay),
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.8 },
  });
}

/** Masuk = posisi + skala + opacity sekaligus (bukan opacity-only). */
function enterStyle(local: number, delay: number, fps: number): React.CSSProperties {
  const e = enterSpring(local, delay, fps);
  return {
    opacity: e,
    scale: interpolate(e, [0, 1], [0.85, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translate: `0px ${interpolate(e, [0, 1], [40, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })}px`,
  };
}

/** Keluar 15 frame terakhir = posisi + skala + opacity, dipercepat (ease-in). */
function exitStyle(local: number): React.CSSProperties {
  const p = interpolate(local, [SCENE_FRAMES - 15, SCENE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.3, 0, 1, 1),
  });
  return {
    opacity: 1 - p,
    scale: 1 - 0.03 * p,
    translate: `0px ${20 * p}px`,
  };
}

export const VideoKetiga: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = sceneIndex(frame);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: SCENES[idx].bg,
        fontFamily: "Inter, Arial, sans-serif",
        color: INK,
        overflow: "hidden",
      }}
    >
      <TopBar />
      <Sequence from={0} durationInFrames={SCENE_FRAMES} name="Adegan 1 — Jalan berlubang">
        <Scene1 />
      </Sequence>
      <Sequence from={300} durationInFrames={SCENE_FRAMES} name="Adegan 2 — Janji di panggung">
        <Scene2 />
      </Sequence>
      <Sequence from={600} durationInFrames={SCENE_FRAMES} name="Adegan 3 — Proyek mangkrak">
        <Scene3 />
      </Sequence>
      <Sequence from={900} durationInFrames={SCENE_FRAMES} name="Adegan 4 — Anggaran bocor">
        <Scene4 />
      </Sequence>
      <Sequence from={1200} durationInFrames={SCENE_FRAMES} name="Adegan 5 — Birokrasi antre">
        <Scene5 />
      </Sequence>
      <Sequence from={1500} durationInFrames={SCENE_FRAMES} name="Adegan 6 — Penutup">
        <Scene6 />
      </Sequence>
      <Title />
    </AbsoluteFill>
  );
};

/** Bar atas vertikal: progress, badge kiri, label fiktif kanan, y 140. */
function TopBar() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = sceneIndex(frame);
  const local = frame - idx * SCENE_FRAMES;
  const e = enterSpring(local, 0, fps);
  const overall = interpolate(frame, [0, 1800], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 8,
          width: `${overall * 100}%`,
          backgroundColor: ACCENT,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 48,
          maxWidth: 220,
          backgroundColor: ACCENT,
          color: "#fff",
          borderRadius: 999,
          padding: "10px 20px",
          fontSize: 24,
          fontWeight: 800,
          whiteSpace: "nowrap",
          opacity: e,
        }}
      >
        {SCENES[idx].badge}
      </div>
      <div
        style={{
          position: "absolute",
          top: 140,
          right: 48,
          maxWidth: 400,
          backgroundColor: "#EA580C",
          color: "#fff",
          borderRadius: 999,
          padding: "10px 18px",
          fontSize: 18,
          fontWeight: 700,
          whiteSpace: "nowrap",
          opacity: e,
        }}
      >
        Cerita ini fiktif belaka
      </div>
    </>
  );
}

/** Judul vertikal: y 1280-1520, font 54, maks 2 baris, di atas zona aman bawah. */
function Title() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = sceneIndex(frame);
  const local = frame - idx * SCENE_FRAMES;
  const e = enterSpring(local, 8, fps);
  const exit = exitStyle(local);
  const dark = idx === 3;
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        right: 48,
        top: 1280,
        height: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity: (e as number) * (exit.opacity as number),
        scale: (exit.scale as number) * interpolate(e, [0, 1], [0.94, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: `0px ${interpolate(e, [0, 1], [30, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}px`,
      }}
    >
      <div
        style={{
          fontSize: 54,
          fontWeight: 900,
          lineHeight: 1.15,
          color: dark ? "#fff" : INK,
        }}
      >
        {SCENES[idx].title}
      </div>
    </div>
  );
}

/** Zona panggung vertikal: y 260-1240, tinggi 980, lebar 1080. Garis tanah relatif y 830. */
function Stage({
  children,
  bg,
}: {
  children: React.ReactNode;
  bg: string;
}) {
  const frame = useCurrentFrame();
  const local = frame;
  return (
    <div
      style={{
        position: "absolute",
        top: 260,
        left: 0,
        width: 1080,
        height: 980,
        overflow: "hidden",
        backgroundColor: bg,
      }}
    >
      <div style={{ ...exitStyle(local), width: "100%", height: "100%" }}>{children}</div>
    </div>
  );
}

/** Tokoh kartun berkepala bulat, DIPERBESAR untuk vertikal (lebar ~130px). Label di bawah kaki. */
function Person({
  x,
  y,
  shirt,
  pants = "#334155",
  label,
  scale = 1,
  bob = 0,
  flip = false,
  enter,
}: {
  x: number;
  y: number;
  shirt: string;
  pants?: string;
  label?: string;
  scale?: number;
  bob?: number;
  flip?: boolean;
  enter?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bob,
        width: 130 * scale,
        transform: flip ? "scaleX(-1)" : undefined,
        ...enter,
      }}
    >
      <div
        style={{
          width: 84 * scale,
          height: 84 * scale,
          borderRadius: "50%",
          backgroundColor: SKIN,
          margin: "0 auto",
          position: "relative",
          border: "3px solid rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40%",
            borderRadius: "42px 42px 0 0",
            backgroundColor: "#1F2937",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "52%",
            left: "26%",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#111",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "52%",
            right: "26%",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#111",
          }}
        />
      </div>
      <div
        style={{
          width: 96 * scale,
          height: 115 * scale,
          backgroundColor: shirt,
          borderRadius: 16,
          margin: `${8 * scale}px auto 0`,
          border: "3px solid rgba(0,0,0,0.12)",
        }}
      />
      <div style={{ display: "flex", justifyContent: "center", gap: 10 * scale, marginTop: 2 }}>
        <div style={{ width: 26 * scale, height: 50 * scale, backgroundColor: pants, borderRadius: 8 }} />
        <div style={{ width: 26 * scale, height: 50 * scale, backgroundColor: pants, borderRadius: 8 }} />
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: -42,
            backgroundColor: "#fff",
            borderRadius: 999,
            padding: "5px 14px",
            fontSize: 22,
            fontWeight: 700,
            textAlign: "center",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}

/** Awan ambien: bergerak pelan dengan sinus (bukan linear). */
function Cloud({ x, y, scale = 1, local }: { x: number; y: number; scale?: number; local: number }) {
  const drift = Math.sin(local * 0.02) * 18;
  return (
    <div
      style={{
        position: "absolute",
        left: x + drift,
        top: y,
        width: 180 * scale,
        height: 70 * scale,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 22, width: 180, height: 48, borderRadius: 24, backgroundColor: "#fff", opacity: 0.95 }} />
      <div style={{ position: "absolute", left: 34, top: 0, width: 96, height: 52, borderRadius: 26, backgroundColor: "#fff", opacity: 0.95 }} />
    </div>
  );
}

function Sun({ x, y, local, color = "#FFD93D" }: { x: number; y: number; local: number; color?: string }) {
  const pulse = 1 + 0.03 * Math.sin(local * 0.05);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 130,
        height: 130,
        borderRadius: "50%",
        backgroundColor: color,
        scale: pulse,
        boxShadow: `0 0 60px ${color}`,
      }}
    />
  );
}

/** Burung kecil (dua garis) — pengisi langit. */
function Bird({ x, y, local }: { x: number; y: number; local: number }) {
  const drift = Math.sin(local * 0.03) * 10;
  return (
    <div style={{ position: "absolute", left: x + drift, top: y, fontSize: 30, fontWeight: 900, color: "#334155" }}>
      ⌄⌄
    </div>
  );
}

/** Gedung jauh (latar berlapis) — warna redup, di belakang objek utama. */
function FarBuilding({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, backgroundColor: color, opacity: 0.75 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ width: 18, height: 22, backgroundColor: "#FDE68A", opacity: 0.9 }} />
        ))}
      </div>
    </div>
  );
}

/** Pohon kecil — pengisi latar. */
function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      <div style={{ width: 30 * scale, height: 100 * scale, backgroundColor: "#78350F", borderRadius: 6, margin: "0 auto" }} />
      <div style={{ position: "absolute", top: -50 * scale, left: -35 * scale, width: 100 * scale, height: 70 * scale, borderRadius: "50%", backgroundColor: "#16A34A" }} />
    </div>
  );
}

/** Jalan aspal dengan lubang — objek nyata adegan 1 dan 6. */
function Road({ dusk = false }: { dusk?: boolean }) {
  const potholes = [
    { x: 150, w: 150 },
    { x: 500, w: 190 },
    { x: 850, w: 130 },
  ];
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 150,
          backgroundColor: dusk ? "#57534E" : "#44403C",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 68,
          height: 10,
          backgroundColor: "#fff",
          opacity: 0.7,
        }}
      />
      {potholes.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            bottom: 30,
            width: p.w,
            height: 46,
            borderRadius: "50%",
            backgroundColor: "#1C1917",
            border: "4px solid #78716C",
          }}
        />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, height: 6, backgroundColor: "#A8A29E" }} />
    </>
  );
}

/** Motor — satu SVG utuh supaya roda, rangka, jok dan setang tersambung. */
function Motorbike({ x, local, fps }: { x: number; local: number; fps: number }) {
  const e = enterSpring(local, 4, fps);
  const wobble = Math.sin(local * 0.25) * 3;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        bottom: 130,
        width: 300,
        height: 170,
        opacity: e,
        translate: `${interpolate(e, [0, 1], [-300, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px 0px`,
      }}
    >
      <svg width="300" height="170" viewBox="0 0 260 150">
        <circle cx="46" cy="114" r="32" fill="#111" stroke="#444" strokeWidth="8" />
        <circle cx="214" cy="114" r="32" fill="#111" stroke="#444" strokeWidth="8" />
        <line x1="46" y1="114" x2="130" y2="60" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
        <line x1="214" y1="114" x2="130" y2="60" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
        <line x1="46" y1="114" x2="100" y2="52" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
        <line x1="100" y1="52" x2="130" y2="60" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
        <line x1="214" y1="114" x2="196" y2="52" stroke="#444" strokeWidth="8" strokeLinecap="round" />
        <rect x="72" y="38" width="62" height="14" rx="7" fill="#111" transform={`rotate(${-4 + wobble} 103 45)`} />
        <rect x="188" y="34" width="36" height="12" rx="6" fill="#111" transform={`rotate(12 206 40)`} />
      </svg>
    </div>
  );
}

/** Pill caption kecil di atas panggung — tidak menabrak elemen lain. */
function CaptionPill({ x, y, text, dark = false }: { x: number; y: number; text: string; dark?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        backgroundColor: dark ? "#191930" : "#fff",
        color: dark ? "#fff" : INK,
        borderRadius: 999,
        padding: "8px 18px",
        fontSize: 24,
        fontWeight: 800,
        whiteSpace: "nowrap",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      {text}
    </div>
  );
}

function Scene1() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bob = Math.sin(frame * 0.15) * 4;
  return (
    <Stage bg="#BFE3FF">
      <Sun x={880} y={30} local={frame} />
      <Cloud x={60} y={60} local={frame} />
      <Cloud x={520} y={110} scale={0.8} local={frame} />
      <Cloud x={820} y={200} scale={0.7} local={frame} />
      <Bird x={350} y={80} local={frame} />
      <Bird x={650} y={60} local={frame} />
      <CaptionPill x={340} y={290} text="Aspal tinggal nama" dark />
      <FarBuilding x={40} y={360} w={130} h={180} color="#93C5FD" />
      <FarBuilding x={210} y={400} w={110} h={140} color="#60A5FA" />
      <FarBuilding x={720} y={340} w={140} h={200} color="#93C5FD" />
      <FarBuilding x={900} y={390} w={120} h={150} color="#60A5FA" />
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 60, top: 470 }}>
        <div style={{ width: 200, height: 130, backgroundColor: "#FDE68A", borderRadius: 12, border: "4px solid #92400E" }}>
          <div style={{ width: 60, height: 40, backgroundColor: "#BFDBFE", margin: "18px auto 0", border: "3px solid #92400E" }} />
          <div style={{ width: 120, height: 8, backgroundColor: "#92400E", margin: "12px auto 0", opacity: 0.6 }} />
        </div>
      </div>
      <div style={{ ...enterStyle(frame, 4, fps), position: "absolute", left: 300, top: 500 }}>
        <Tree x={0} y={0} />
      </div>
      <div style={{ ...enterStyle(frame, 4, fps), position: "absolute", left: 540, top: 520, width: 180, height: 130 }}>
        <div style={{ width: 180, height: 34, backgroundColor: "#DC2626", borderRadius: "8px 8px 0 0" }} />
        <div style={{ width: 180, height: 90, backgroundColor: "#78350F", borderRadius: "0 0 10px 10px", border: "4px solid #451A03" }}>
          <div style={{ textAlign: "center", fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 26 }}>WARUNG</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 720, top: 790 }}>
        <div style={{ width: 110, height: 40, borderRadius: "50%", backgroundColor: "#16A34A" }} />
        <div style={{ position: "absolute", left: 60, top: -14, width: 80, height: 34, borderRadius: "50%", backgroundColor: "#15803D" }} />
      </div>
      <Road />
      <Motorbike x={400} local={frame} fps={fps} />
      <Person x={70} y={580} shirt="#16A34A" label="Rakyat" bob={bob} enter={enterStyle(frame, 8, fps)} />
      <Person x={240} y={580} shirt="#DB2777" label="Rakyat" bob={-bob} enter={enterStyle(frame, 12, fps)} />
      <Person x={820} y={580} shirt="#0EA5E9" label="Dompet kosong" enter={enterStyle(frame, 12, fps)} />
    </Stage>
  );
}

function Scene2() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cheer = Math.sin(frame * 0.3) * 6;
  return (
    <Stage bg="#FFE4C7">
      <Sun x={750} y={230} local={frame} color="#FB923C" />
      <Cloud x={60} y={230} local={frame} />
      <FarBuilding x={60} y={300} w={120} h={180} color="#FDBA74" />
      <FarBuilding x={900} y={320} w={130} h={160} color="#FDBA74" />
      <div style={{ ...enterStyle(frame, 8, fps), position: "absolute", left: 140, top: 60, width: 800, height: 100, backgroundColor: "#DC2626", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 56, fontWeight: 900, boxShadow: "0 12px 30px rgba(0,0,0,0.25)" }}>
        JANJI
      </div>
      <div style={{ position: "absolute", left: 200, right: 200, top: 270, height: 4, backgroundColor: "#92400E" }} />
      {[
        { x: 250, c: "#FFD93D" },
        { x: 350, c: "#4F46E5" },
        { x: 450, c: "#16A34A" },
        { x: 550, c: "#DB2777" },
        { x: 650, c: "#0EA5E9" },
        { x: 750, c: "#F59E0B" },
        { x: 830, c: "#7C3AED" },
      ].map((f, i) => (
        <div key={i} style={{ position: "absolute", left: f.x, top: 274, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: `30px solid ${f.c}` }} />
      ))}
      <Person x={260} y={500} shirt="#0EA5E9" scale={0.9} enter={enterStyle(frame, 10, fps)} />
      <Person x={380} y={500} shirt="#16A34A" scale={0.9} enter={enterStyle(frame, 10, fps)} />
      <Person x={700} y={500} shirt="#DB2777" scale={0.9} enter={enterStyle(frame, 10, fps)} />
      <Person x={920} y={500} shirt="#F59E0B" scale={0.9} enter={enterStyle(frame, 10, fps)} />
      <div style={{ ...enterStyle(frame, 8, fps), position: "absolute", left: 180, top: 160, width: 14, height: 380, backgroundColor: "#78350F" }} />
      <div style={{ ...enterStyle(frame, 8, fps), position: "absolute", left: 886, top: 160, width: 14, height: 380, backgroundColor: "#78350F" }} />
      <div style={{ position: "absolute", left: 60, top: 500, fontSize: 34 }}>🚩</div>
      <div style={{ position: "absolute", left: 1040, top: 500, fontSize: 34 }}>🚩</div>
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 0, right: 0, bottom: 0, height: 150, backgroundColor: "#78716C" }} />
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 190, bottom: 150, width: 700, height: 90, backgroundColor: "#7C2D12", borderRadius: "12px 12px 0 0" }} />
      <div style={{ ...enterStyle(frame, 4, fps), position: "absolute", left: 440, bottom: 240, width: 200, height: 130, backgroundColor: "#78350F", borderRadius: 10 }} />
      <div style={{ position: "absolute", left: 340, top: 700, width: 144, height: 40, backgroundColor: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 900, color: "#78350F" }}>
        PENGUASA
      </div>
      <div style={{ ...enterStyle(frame, 4, fps), position: "absolute", left: 680, bottom: 360, width: 14, height: 90, backgroundColor: "#444" }} />
      <div style={{ ...enterStyle(frame, 4, fps), position: "absolute", left: 651, bottom: 430, width: 44, height: 44, borderRadius: "50%", backgroundColor: "#111", border: "8px solid #666" }} />
      {[
        { x: 100, y: 230, c: "#FFD93D" },
        { x: 300, y: 280, c: "#4F46E5" },
        { x: 500, y: 220, c: "#16A34A" },
        { x: 950, y: 360, c: "#DB2777" },
        { x: 950, y: 240, c: "#0EA5E9" },
      ].map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x, top: d.y + Math.sin(frame * 0.1 + i) * 12, width: 22, height: 22, borderRadius: "50%", backgroundColor: d.c }} />
      ))}
      <Person x={490} y={490} shirt="#F59E0B" bob={cheer} enter={enterStyle(frame, 12, fps)} />
      <Person x={60} y={580} shirt="#16A34A" label="Sorak" bob={cheer} enter={enterStyle(frame, 12, fps)} />
      <Person x={240} y={580} shirt="#DB2777" label="Percaya" bob={-cheer} enter={enterStyle(frame, 12, fps)} />
      <Person x={720} y={580} shirt="#0EA5E9" label="Tepuk" bob={cheer} enter={enterStyle(frame, 12, fps)} />
      <Person x={880} y={580} shirt="#7C3AED" label="Menunggu" bob={-cheer} enter={enterStyle(frame, 12, fps)} />
    </Stage>
  );
}

function Scene3() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sway = Math.sin(frame * 0.05) * 4;
  return (
    <Stage bg="#D6D3D1">
      <Cloud x={80} y={60} local={frame} />
      <Cloud x={850} y={240} scale={0.8} local={frame} />
      <CaptionPill x={560} y={300} text="Ditunggu warga" dark />
      <div style={{ position: "absolute", left: 60, right: 60, top: 420, height: 10, backgroundColor: "#78716C" }} />
      {[60, 300, 540, 780, 960].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x, top: 420, width: 12, height: 60, backgroundColor: "#57534E" }} />
      ))}
      <div style={{ ...enterStyle(frame, 8, fps), position: "absolute", left: 140, top: 60, width: 800, height: 110, backgroundColor: "#191930", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 38, fontWeight: 900, transform: "rotate(-2deg)", boxShadow: "0 12px 30px rgba(0,0,0,0.3)" }}>
        PROYEK BESAR
      </div>
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 0, right: 0, bottom: 0, height: 150, backgroundColor: "#6B7280" }} />
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 80, bottom: 150, width: 360, height: 340 }}>
        <div style={{ position: "absolute", left: 0, bottom: 0, width: 40, height: 340, backgroundColor: "#9CA3AF" }} />
        <div style={{ position: "absolute", left: 160, bottom: 0, width: 40, height: 340, backgroundColor: "#9CA3AF" }} />
        <div style={{ position: "absolute", left: 320, bottom: 0, width: 40, height: 340, backgroundColor: "#9CA3AF" }} />
        <div style={{ position: "absolute", left: 0, bottom: 140, width: 360, height: 30, backgroundColor: "#6B7280" }} />
        <div style={{ position: "absolute", left: 0, bottom: 280, width: 360, height: 30, backgroundColor: "#6B7280" }} />
        <div style={{ position: "absolute", left: 14, bottom: 310, width: 8, height: 60, backgroundColor: "#4B5563" }} />
        <div style={{ position: "absolute", left: 174, bottom: 310, width: 8, height: 60, backgroundColor: "#4B5563" }} />
        <div style={{ position: "absolute", left: 334, bottom: 310, width: 8, height: 60, backgroundColor: "#4B5563" }} />
      </div>
      <div style={{ ...enterStyle(frame, 4, fps), position: "absolute", left: 500, bottom: 150, transform: `rotate(${sway * 0.2}deg)` }}>
        <div style={{ width: 30, height: 380, backgroundColor: "#F59E0B" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 360, height: 26, backgroundColor: "#F59E0B" }} />
        <div style={{ position: "absolute", left: 200, top: 26, width: 4, height: 120, backgroundColor: "#374151" }} />
        <div style={{ position: "absolute", left: 182, top: 146, width: 40, height: 40, backgroundColor: "#374151", borderRadius: 8 }} />
      </div>
      <CaptionPill x={580} y={650} text="Bata menumpuk" />
      <div style={{ ...enterStyle(frame, 8, fps), position: "absolute", left: 630, bottom: 170 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 70, height: 44, backgroundColor: "#B45309", borderRadius: 6 }} />
          <div style={{ width: 70, height: 44, backgroundColor: "#B45309", borderRadius: 6, marginTop: -22 }} />
          <div style={{ width: 70, height: 44, backgroundColor: "#B45309", borderRadius: 6 }} />
        </div>
      </div>
      {[480, 560].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x, bottom: 170 + Math.sin(frame * 0.08 + i) * 8, width: 26, height: 26, borderRadius: "50%", backgroundColor: "#D6D3D1", border: "2px solid #9CA3AF", opacity: 0.9 }} />
      ))}
      <Person x={100} y={580} shirt="#F97316" label="Pekerja" enter={enterStyle(frame, 12, fps)} />
      <Person x={460} y={580} shirt="#7C3AED" label="Mangkrak?" enter={enterStyle(frame, 12, fps)} />
      <Person x={780} y={580} shirt="#16A34A" label="Menunggu" enter={enterStyle(frame, 12, fps)} />
      <Person x={920} y={580} shirt="#DB2777" label="Menunggu" enter={enterStyle(frame, 12, fps)} />
    </Stage>
  );
}

function Scene4() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flow = interpolate(frame, [30, 250], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  const blink = Math.sin(frame * 0.2) > 0 ? 1 : 0.55;
  return (
    <Stage bg="#14532D">
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 0, right: 0, bottom: 0, height: 150, backgroundColor: "#052E16" }} />
      <div style={{ ...enterStyle(frame, 4, fps), position: "absolute", left: 620, top: 60, width: 340, height: 90, backgroundColor: "#FDE68A", border: "4px solid #92400E", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "#92400E" }}>
        DANA RAKYAT
      </div>
      <div style={{ position: "absolute", left: 450, top: 400, backgroundColor: "#DC2626", color: "#fff", borderRadius: 999, padding: "8px 18px", fontSize: 24, fontWeight: 900, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
        BOCOR!
      </div>
      <div style={{ position: "absolute", left: 100, top: 300, width: 26, height: 26, borderRadius: "50%", backgroundColor: "#FDE68A" }} />
      <div style={{ position: "absolute", left: 950, top: 300, width: 26, height: 26, borderRadius: "50%", backgroundColor: "#FDE68A" }} />
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 80, bottom: 150, width: 360, height: 360, backgroundColor: "#374151", borderRadius: 20, border: "6px solid #1F2937" }}>
        <div style={{ position: "absolute", left: 30, top: 40, width: 300, height: 280, backgroundColor: "#4B5563", borderRadius: 14, border: "4px solid #111827" }} />
        <div style={{ position: "absolute", left: 140, top: 140, width: 80, height: 80, borderRadius: "50%", backgroundColor: "#F59E0B", border: "6px solid #111827" }} />
        <div style={{ position: "absolute", left: 166, top: 166, width: 28, height: 28, borderRadius: "50%", backgroundColor: "#111827" }} />
        <div style={{ position: "absolute", left: 30, top: 24, width: 12, height: 12, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
        <div style={{ position: "absolute", right: 30, top: 24, width: 12, height: 12, borderRadius: "50%", backgroundColor: "#9CA3AF" }} />
      </div>
      <div style={{ ...enterStyle(frame, 4, fps), position: "absolute", left: 120, top: 180, width: 840, height: 70, backgroundColor: "#9CA3AF", borderRadius: 35, border: "4px solid #4B5563" }}>
        <div style={{ position: "absolute", left: 20, top: 8, width: 800, height: 18, backgroundColor: "#D1D5DB", borderRadius: 9 }} />
      </div>
      {[300, 500, 700].map((x, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: 260 + flow * 90,
            width: 54,
            height: 54,
            borderRadius: "50%",
            backgroundColor: "#F59E0B",
            border: "4px solid #B45309",
            opacity: 0.4 + flow * 0.6,
            scale: 0.8 + flow * 0.2,
          }}
        />
      ))}
      <div style={{ ...enterStyle(frame, 8, fps), position: "absolute", left: 460, bottom: 150, width: 280, height: 180 }}>
        <div style={{ width: 56, height: 26, backgroundColor: "#7C2D12", margin: "0 auto", border: "4px solid #451A03", borderBottom: "none" }} />
        <div style={{ width: 72, height: 12, backgroundColor: "#F59E0B", margin: "0 auto" }} />
        <div style={{ width: 150, height: 130, backgroundColor: "#7C2D12", borderRadius: "50%", margin: "-4px auto 0", border: "4px solid #451A03" }} />
      </div>
      <CaptionPill x={460} y={600} text="Tas uang" />
      <div style={{ ...enterStyle(frame, 12, fps), position: "absolute", left: 720, bottom: 150, width: 260, height: 200, opacity: blink }}>
        <div style={{ width: 220, height: 120, backgroundColor: "#FDE68A", borderRadius: 12, margin: "0 auto", border: "4px solid #92400E", padding: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#92400E" }}>SEKOLAH</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#92400E" }}>menunggu</div>
        </div>
        <div style={{ width: 220, height: 50, backgroundColor: "#6B7280", borderRadius: 8, margin: "10px auto 0", border: "3px solid #374151" }} />
      </div>
      {[240, 430].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x, bottom: 160, width: 44, height: 44, borderRadius: "50%", backgroundColor: "#F59E0B", border: "3px solid #B45309" }} />
      ))}
      <Person x={880} y={580} shirt="#F59E0B" label="Kamu fiktif" enter={enterStyle(frame, 12, fps)} />
    </Stage>
  );
}

function Scene5() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stampDown = frame % 60 < 30 ? 0 : 14;
  const queueStep = interpolate(frame, [60, 240], [0, 40], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  return (
    <Stage bg="#FEF3C7">
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 0, right: 0, bottom: 0, height: 150, backgroundColor: "#8A7A66" }} />
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 80, top: 50, width: 140, height: 140, borderRadius: "50%", backgroundColor: "#fff", border: "6px solid #111" }}>
        <div style={{ position: "absolute", left: 64, top: 12, width: 6, height: 48, backgroundColor: "#111", transformOrigin: "bottom", transform: `rotate(${interpolate(frame, [0, 300], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}deg)` }} />
        <div style={{ position: "absolute", left: 64, top: 28, width: 6, height: 36, backgroundColor: "#DC2626", transformOrigin: "bottom", transform: `rotate(${interpolate(frame, [0, 300], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}deg)` }} />
        <div style={{ position: "absolute", left: 64, top: 64, width: 12, height: 12, borderRadius: "50%", backgroundColor: "#111" }} />
      </div>
      <div style={{ ...enterStyle(frame, 4, fps), position: "absolute", left: 600, top: 60, width: 400, height: 80, backgroundColor: "#fff", border: "4px solid #92400E", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#92400E" }}>
        KANTOR PELAYANAN
      </div>
      <div style={{ position: "absolute", left: 60, top: 320 }}>
        <Tree x={0} y={0} scale={0.9} />
      </div>
      <div style={{ position: "absolute", left: 60, top: 410, width: 90, height: 50, backgroundColor: "#92400E", borderRadius: 8 }} />
      <div style={{ position: "absolute", left: 300, top: 260, width: 280, height: 110, backgroundColor: "#fff", border: "4px solid #92400E", borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#92400E", textAlign: "center" }}>SABAR</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#92400E", textAlign: "center" }}>antrean panjang</div>
      </div>
      {[650, 850].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x, top: 280 + i * 40, width: 60, height: 80, backgroundColor: "#fff", border: "3px solid #111", transform: `rotate(${i === 0 ? -8 : 8}deg)` }} />
      ))}
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 80, bottom: 150, width: 920, height: 110, backgroundColor: "#92400E", borderRadius: "14px 14px 0 0" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 920, height: 22, backgroundColor: "#B45309", borderRadius: "14px 14px 0 0" }} />
      </div>
      {["LOKET 1", "LOKET 2", "LOKET 3"].map((t, i) => (
        <div
          key={t}
          style={{
            ...enterStyle(frame, 4 + i * 4, fps),
            position: "absolute",
            left: 80 + i * 320,
            top: 480,
            width: 280,
            height: 80,
            backgroundColor: "#fff",
            border: "4px solid #92400E",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 900,
            color: "#92400E",
          }}
        >
          {t}
        </div>
      ))}
      <div style={{ ...enterStyle(frame, 8, fps), position: "absolute", left: 600, bottom: 260, width: 170, height: 110 }}>
        <div style={{ width: 170, height: 26, backgroundColor: "#fff", border: "3px solid #111", margin: "0 auto" }} />
        <div style={{ width: 170, height: 26, backgroundColor: "#F1F5F9", border: "3px solid #111", margin: "-6px auto 0" }} />
        <div style={{ width: 170, height: 26, backgroundColor: "#fff", border: "3px solid #111", margin: "-6px auto 0" }} />
        <div style={{ textAlign: "center", fontSize: 20, fontWeight: 800, marginTop: 6 }}>Dokumen</div>
      </div>
      <div style={{ ...enterStyle(frame, 8, fps), position: "absolute", left: 800, bottom: 260 }}>
        <div style={{ width: 40, height: 90, backgroundColor: "#374151", borderRadius: 8, margin: "0 auto", transform: `translateY(${stampDown}px)` }} />
        <div style={{ width: 110, height: 34, backgroundColor: "#DC2626", borderRadius: 8, margin: "0 auto" }} />
        <div style={{ textAlign: "center", fontSize: 24, fontWeight: 900, color: "#DC2626", marginTop: 4 }}>CAP!</div>
      </div>
      <div style={{ translate: `${queueStep}px 0px` }}>
        <Person x={80} y={580} shirt="#16A34A" label="Antre 1" enter={enterStyle(frame, 12, fps)} />
        <Person x={260} y={580} shirt="#DB2777" label="Antre 2" enter={enterStyle(frame, 12, fps)} />
        <Person x={440} y={580} shirt="#0EA5E9" label="Antre 3" enter={enterStyle(frame, 12, fps)} />
      </div>
      <Person x={900} y={580} shirt="#7C3AED" label="Petugas" enter={enterStyle(frame, 12, fps)} />
    </Stage>
  );
}

function Scene6() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sunset = interpolate(frame, [0, 280], [0, 50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  const walk = interpolate(frame, [40, 260], [0, 60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  return (
    <Stage bg="#FDE68A">
      <Sun x={800} y={120 + sunset} local={frame} color="#F97316" />
      <Cloud x={60} y={60} local={frame} />
      <Cloud x={750} y={260} scale={0.8} local={frame} />
      <Bird x={400} y={250} local={frame} />
      <Bird x={950} y={300} local={frame} />
      <FarBuilding x={40} y={340} w={120} h={170} color="#FDBA74" />
      <FarBuilding x={200} y={380} w={100} h={130} color="#FDBA74" />
      <div style={{ ...enterStyle(frame, 12, fps), position: "absolute", left: 140, top: 440, width: 800, height: 110, backgroundColor: "#fff", borderRadius: 16, border: "4px solid #92400E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}>
        Yang menanggung: rakyat
      </div>
      <div style={{ position: "absolute", left: 60, top: 400 }}>
        <Tree x={0} y={0} />
      </div>
      <div style={{ position: "absolute", left: 900, top: 420 }}>
        <Tree x={0} y={0} scale={0.9} />
      </div>
      <div style={{ ...enterStyle(frame, 0, fps), position: "absolute", left: 650, bottom: 150, width: 320, height: 220 }}>
        <div style={{ width: 320, height: 90, backgroundColor: "#F59E0B", borderRadius: 10, margin: "130px auto 0", border: "4px solid #92400E" }} />
        <div style={{ position: "absolute", left: 110, top: 50, width: 100, height: 80, backgroundColor: "#DC2626", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
        <div style={{ position: "absolute", left: 20, top: 150, width: 40, height: 50, backgroundColor: "#BFDBFE", border: "3px solid #92400E" }} />
        <div style={{ position: "absolute", right: 20, top: 150, width: 40, height: 50, backgroundColor: "#BFDBFE", border: "3px solid #92400E" }} />
      </div>
      <Road dusk />
      <div style={{ translate: `${walk}px 0px` }}>
        <Person x={80} y={580} shirt="#16A34A" label="Rakyat" enter={enterStyle(frame, 4, fps)} />
        <Person x={260} y={580} shirt="#DB2777" label="Dompet kosong" enter={enterStyle(frame, 8, fps)} />
        <Person x={440} y={580} shirt="#0EA5E9" label="Rakyat" enter={enterStyle(frame, 8, fps)} />
      </div>
    </Stage>
  );
}
