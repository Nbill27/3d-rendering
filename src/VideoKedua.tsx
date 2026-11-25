import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// VideoKedua — Kebobrokan Pemerintah (satir fiktif), 60s, 1920x1080, 30fps
// Dense scenes: every scene has a full background + 5+ elements + primary,
// secondary and ambient motion. No blank-background scene.
const INK = "#191930";
const ACCENT = "#C2410C";

const SCENES = [
  { start: 0, duration: 300, badge: "HOOK", title: "Mau Berkuasa? Ikuti Ini", bg: "#BFE3FF" },
  { start: 300, duration: 300, badge: "LANGKAH 1", title: "Langkah 1: Janji Dulu", bg: "#FFE4C7" },
  { start: 600, duration: 300, badge: "LANGKAH 2", title: "Langkah 2: Proyek Besar", bg: "#D6D3D1" },
  { start: 900, duration: 300, badge: "LANGKAH 3", title: "Langkah 3: Bocorkan Anggaran", bg: "#14532D" },
  { start: 1200, duration: 300, badge: "LANGKAH 4", title: "Langkah 4: Bikin Antre", bg: "#FEF3C7" },
  { start: 1500, duration: 300, badge: "PENUTUP", title: "Selanjutnya, Kamu Mau Jadi Apa?", bg: "#FDE68A" },
];

export const VideoKedua: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = frame < 300 ? 0 : frame < 600 ? 1 : frame < 900 ? 2 : frame < 1200 ? 3 : frame < 1500 ? 4 : 5;
  const scene = SCENES[idx];
  return (
    <AbsoluteFill style={{ backgroundColor: scene.bg }}>
      <SceneContent index={idx} local={frame - scene.start} duration={scene.duration} badge={scene.badge} title={scene.title} bg={scene.bg} />
    </AbsoluteFill>
  );
};

function spr(local: number, delay: number, fps: number) {
  return spring({ frame: Math.max(0, local - delay), fps, config: { damping: 16, stiffness: 180, mass: 0.8 } });
}

function SceneContent({ index, local, duration, badge, title, bg }: { index: number; local: number; duration: number; badge: string; title: string; bg: string }) {
  const { fps } = useVideoConfig();
  const enter = spr(local, 0, fps);
  const titleEnter = spr(local, 8, fps);
  const exit = interpolate(local, [duration - 15, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const progress = interpolate(local, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cloudX = interpolate(local, [0, duration], [0, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dark = index === 3;
  return (
    <AbsoluteFill style={{ backgroundColor: bg, opacity: exit, fontFamily: "Inter, Arial, sans-serif", color: dark ? "#fff" : INK, overflow: "hidden" }}>
      {/* ambient: moving clouds / sun */}
      <div style={{ position: "absolute", top: 50, left: 80 + cloudX, fontSize: 90, opacity: 0.9 }}>☁️</div>
      <div style={{ position: "absolute", top: 30, right: 100 - cloudX * 0.5, fontSize: 110 }}>☀️</div>
      <div style={{ position: "absolute", top: 90, left: 700 + cloudX * 0.7, fontSize: 70, opacity: 0.8 }}>☁️</div>
      {/* ground */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 180, backgroundColor: dark ? "#052e16" : "#78716C", opacity: 0.85 }} />
      <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${progress * 100}%`, backgroundColor: ACCENT }} />
      <div style={{ position: "absolute", top: 40, left: 80, backgroundColor: ACCENT, color: "#fff", borderRadius: 999, padding: "10px 22px", fontSize: 26, fontWeight: 800, opacity: enter }}>{badge}</div>
      <div style={{ position: "absolute", top: 36, right: 80, backgroundColor: "#EA580C", color: "#fff", borderRadius: 999, padding: "10px 20px", fontSize: 22, fontWeight: 700, opacity: enter }}>Cerita fiktif belaka</div>
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, height: 620, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {index === 0 && <Scene1 local={local} fps={fps} />}
        {index === 1 && <Scene2 local={local} fps={fps} />}
        {index === 2 && <Scene3 local={local} fps={fps} />}
        {index === 3 && <Scene4 local={local} fps={fps} />}
        {index === 4 && <Scene5 local={local} fps={fps} />}
        {index === 5 && <Scene6 local={local} fps={fps} />}
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 200, textAlign: "center", opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [30, 0])}px)` }}>
        <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1.05, color: dark ? "#fff" : INK }}>{title}</div>
      </div>
    </AbsoluteFill>
  );
}

function person(emoji: string, label: string) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 90 }}>{emoji}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function Scene1({ local, fps }: { local: number; fps: number }) {
  const e = spr(local, 5, fps);
  const bounce = 1 + 0.05 * Math.sin(local * 0.12);
  return (
    <div style={{ opacity: e, display: "flex", gap: 40, alignItems: "flex-end", transform: `scale(${bounce})` }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 150 }}>🏰</div><div style={{ fontSize: 26, fontWeight: 800 }}>ISTANA</div></div>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 100 }}>🏢</div><div style={{ fontSize: 22, fontWeight: 700 }}>Kota</div></div>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 100 }}>🏫</div><div style={{ fontSize: 22, fontWeight: 700 }}>Sekolah</div></div>
      <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, fontSize: 34, fontWeight: 900, boxShadow: "0 16px 36px rgba(0,0,0,0.2)" }}>JANJI MANIS 🍬</div>
      {person("🧑‍🌾", "Rakyat")}
      {person("👩‍🏫", "Guru")}
      {person("👷", "Pekerja")}
    </div>
  );
}

function Scene2({ local, fps }: { local: number; fps: number }) {
  const e = spr(local, 5, fps);
  const tear = interpolate(local, [150, 240], [0, 18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: e, display: "flex", gap: 36, alignItems: "flex-end" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 140 }}>🎤</div><div style={{ fontSize: 24, fontWeight: 800 }}>Panggung</div></div>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 150 }}>🤴</div><div style={{ fontSize: 24, fontWeight: 800 }}>Penguasa fiktif</div></div>
      <div style={{ backgroundColor: "#DC2626", color: "#fff", borderRadius: 20, padding: 20, fontSize: 40, fontWeight: 900, transform: `rotate(${-tear}deg)` }}>JANJI ✂️</div>
      {person("🧑", "Sorak")}
      {person("👩", "Percaya")}
      <div style={{ fontSize: 80 }}>🎊</div>
    </div>
  );
}

function Scene3({ local, fps }: { local: number; fps: number }) {
  const e = spr(local, 5, fps);
  const sway = Math.sin(local * 0.05) * 4;
  return (
    <div style={{ opacity: e, display: "flex", gap: 36, alignItems: "flex-end" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 150 }}>🏗️</div><div style={{ fontSize: 24, fontWeight: 800 }}>Setengah jadi</div></div>
      <div style={{ textAlign: "center", transform: `rotate(${sway}deg)` }}><div style={{ fontSize: 130 }}>🏚️</div><div style={{ fontSize: 22, fontWeight: 700 }}>Gedung mangkrak</div></div>
      <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 18, fontSize: 30, fontWeight: 900 }}>PROYEK BESAR</div>
      <div style={{ fontSize: 100 }}>🚧</div>
      {person("👷", "Menunggu")}
      {person("🧑‍💼", "Menunggu")}
    </div>
  );
}

function Scene4({ local, fps }: { local: number; fps: number }) {
  const e = spr(local, 5, fps);
  const flow = interpolate(local, [30, 250], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: e, display: "flex", gap: 36, alignItems: "flex-end", color: "#fff" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 140 }}>🔐</div><div style={{ fontSize: 24, fontWeight: 800 }}>Brankas</div></div>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 120 }}>🛢️</div><div style={{ fontSize: 22, fontWeight: 700 }}>Pipa bocor 💧</div></div>
      <div style={{ fontSize: 90, transform: `translateY(${flow * 40}px)` }}>💰💸</div>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 130 }}>👜</div><div style={{ fontSize: 22, fontWeight: 700 }}>Kantong salah</div></div>
      {person("🏫", "Sekolah menunggu")}
      {person("🛣️", "Jalan menunggu")}
    </div>
  );
}

function Scene5({ local, fps }: { local: number; fps: number }) {
  const e = spr(local, 5, fps);
  const stamp = local % 40 < 20 ? 0 : -14;
  return (
    <div style={{ opacity: e, display: "flex", gap: 30, alignItems: "flex-end" }}>
      {person("🧑", "Antre 1")}
      {person("👩", "Antre 2")}
      {person("👴", "Antre 3")}
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 120, transform: `translateY(${stamp}px)` }}>🔏</div><div style={{ fontSize: 22, fontWeight: 800 }}>CAP!</div></div>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 110 }}>📄📄📄</div><div style={{ fontSize: 22, fontWeight: 700 }}>Dokumen menumpuk</div></div>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 110 }}>🕐</div><div style={{ fontSize: 22, fontWeight: 700 }}>LOKET 1-2-3</div></div>
    </div>
  );
}

function Scene6({ local, fps }: { local: number; fps: number }) {
  const e = spr(local, 5, fps);
  const sunset = interpolate(local, [0, 280], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: e, display: "flex", gap: 36, alignItems: "flex-end" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 130 }}>🕳️</div><div style={{ fontSize: 24, fontWeight: 800 }}>Jalan berlubang</div></div>
      {person("🧑‍🌾", "Dompet kosong")}
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 110 }}>👛</div><div style={{ fontSize: 22, fontWeight: 700 }}>Kosong!</div></div>
      <div style={{ textAlign: "center", transform: `translateY(${sunset}px)` }}><div style={{ fontSize: 120 }}>🌇</div><div style={{ fontSize: 22, fontWeight: 700 }}>Matahari terbenam</div></div>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 130 }}>🏰</div><div style={{ fontSize: 22, fontWeight: 700 }}>Istana tetap megah</div></div>
    </div>
  );
}
