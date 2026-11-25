import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const ACCENT = "#4F46E5";
const BG = "#FFF8EC";
const INK = "#191930";
const CARD = "#FFFFFF";

const SCENES = [
  { start: 0, duration: 180, badge: "HOOK", title: "Punya ide bagus?" },
  { start: 180, duration: 240, badge: "MASALAH", title: "Dulu: berhari-hari" },
  { start: 420, duration: 300, badge: "LANGKAH 1", title: "1. Ide jadi naskah" },
  { start: 720, duration: 330, badge: "LANGKAH 2", title: "2. Naskah jadi gerak" },
  { start: 1050, duration: 360, badge: "LANGKAH 3", title: "3. Adegan jadi video" },
  { start: 1410, duration: 270, badge: "PENUTUP", title: "Ide jadi video" },
];

export const VideoPertama: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneIndex =
    frame < 180
      ? 0
      : frame < 420
        ? 1
        : frame < 720
          ? 2
          : frame < 1050
            ? 3
            : frame < 1410
              ? 4
              : 5;
  const scene = SCENES[sceneIndex];
  const local = frame - scene.start;
  // Render the active scene with its local frame by keying a wrapper:
  // Remotion hooks read the global frame, so we shift via a nested component
  // that receives local frame through context-free prop and uses it directly.
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <SceneWithLocal
        index={sceneIndex}
        local={local}
        duration={scene.duration}
        badge={scene.badge}
        title={scene.title}
      />
    </AbsoluteFill>
  );
};

// Local-frame wrapper: hooks below use the scene-local frame passed as a prop.
function SceneWithLocal({
  index,
  local,
  duration,
  badge,
  title,
}: {
  index: number;
  local: number;
  duration: number;
  badge: string;
  title: string;
}) {
  // This component is only a placeholder in the tree; the real rendering
  // happens in SceneContent which is driven by Sequence-local frames.
  return (
    <SceneContent index={index} local={local} duration={duration} badge={badge} title={title} />
  );
}

function SceneContent({
  index,
  local,
  duration,
  badge,
  title,
}: {
  index: number;
  local: number;
  duration: number;
  badge: string;
  title: string;
}) {
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: Math.max(0, local),
    fps,
    config: { damping: 16, stiffness: 180, mass: 0.8 },
  });
  const exit = interpolate(
    local,
    [duration - 15, duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const titleEnter = spring({
    frame: Math.max(0, local - 8),
    fps,
    config: { damping: 16, stiffness: 180, mass: 0.8 },
  });
  const progress = interpolate(local, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = 1 + 0.04 * Math.sin(local * 0.06);
  return (
    <AbsoluteFill
      style={{ backgroundColor: BG, opacity: exit, fontFamily: "Inter, Arial, sans-serif", color: INK }}
    >
      <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", backgroundColor: ACCENT, opacity: 0.08, top: 60, right: 120, transform: `scale(${pulse})` }} />
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", backgroundColor: ACCENT, opacity: 0.06, bottom: 180, left: 90, transform: `scale(${1 + 0.05 * Math.sin(local * 0.05 + 2)})` }} />
      <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${progress * 100}%`, backgroundColor: ACCENT }} />
      <div style={{ position: "absolute", top: 48, left: 80, backgroundColor: ACCENT, color: "#fff", borderRadius: 999, padding: "10px 22px", fontSize: 26, fontWeight: 800, letterSpacing: 1, opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)` }}>
        {badge}
      </div>
      <div style={{ position: "absolute", top: 130, left: 0, right: 0, height: 560, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {index === 0 && <BulbLocal local={local} fps={fps} />}
        {index === 1 && <CalendarLocal local={local} fps={fps} />}
        {index === 2 && <SplitCardsLocal local={local} fps={fps} />}
        {index === 3 && <VideoScreenLocal local={local} fps={fps} />}
        {index === 4 && <MergeClipsLocal local={local} fps={fps} />}
        {index === 5 && <FinalCardLocal local={local} fps={fps} />}
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 110, textAlign: "center", opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [30, 0])}px) scale(${interpolate(titleEnter, [0, 1], [0.96, 1])})` }}>
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1.05 }}>{title}</div>
      </div>
    </AbsoluteFill>
  );
}

function spr(local: number, delay: number, fps: number) {
  return spring({ frame: Math.max(0, local - delay), fps, config: { damping: 16, stiffness: 180, mass: 0.8 } });
}

function BulbLocal({ local, fps }: { local: number; fps: number }) {
  const enter = spr(local, 5, fps);
  const pulse = 1 + 0.04 * Math.sin(local * 0.09);
  const glow = 0.55 + 0.25 * Math.sin(local * 0.09);
  return (
    <div style={{ opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.7, 1]) * pulse})`, textAlign: "center" }}>
      <div style={{ width: 260, height: 260, borderRadius: "50%", backgroundColor: "#FFD93D", boxShadow: `0 0 ${Math.round(90 * glow)}px ${Math.round(50 * glow)}px rgba(255,217,61,0.55)`, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 130 }}>💡</div>
      <div style={{ width: 90, height: 56, backgroundColor: INK, borderRadius: 12, margin: "18px auto 0" }} />
    </div>
  );
}

function CalendarLocal({ local, fps }: { local: number; fps: number }) {
  const delays = [0, 12, 24, 36];
  const timeline = interpolate(local, [0, 200], [8, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "relative", width: 900, height: 420, display: "flex", gap: 28, alignItems: "flex-start", justifyContent: "center" }}>
      {delays.map((d, i) => {
        const e = spr(local, d, fps);
        return (
          <div key={i} style={{ width: 190, height: 240, backgroundColor: CARD, borderRadius: 20, border: `3px solid ${INK}14`, boxShadow: "0 18px 40px rgba(25,25,48,0.14)", opacity: e, transform: `translateY(${interpolate(e, [0, 1], [-260, 0])}px) rotate(${interpolate(e, [0, 1], [-14, (i - 1.5) * 4])}deg)`, padding: 22 }}>
            <div style={{ height: 34, borderRadius: 8, backgroundColor: i === 3 ? ACCENT : "#EDEAFD", marginBottom: 16 }} />
            {[0, 1, 2].map((r) => (
              <div key={r} style={{ height: 14, borderRadius: 7, backgroundColor: "#E5E7EB", marginBottom: 12, width: r === 2 ? "60%" : "100%" }} />
            ))}
          </div>
        );
      })}
      <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", width: 700, height: 10, borderRadius: 5, backgroundColor: "#E5E7EB" }}>
        <div style={{ height: 10, borderRadius: 5, backgroundColor: ACCENT, width: `${timeline}%` }} />
      </div>
    </div>
  );
}

function SplitCardsLocal({ local, fps }: { local: number; fps: number }) {
  const cards = [
    { n: "1", label: "Ide" },
    { n: "2", label: "Adegan" },
    { n: "3", label: "Naskah" },
  ];
  return (
    <div style={{ display: "flex", gap: 32 }}>
      {cards.map((c, i) => {
        const e = spr(local, 10 + i * 14, fps);
        return (
          <div key={c.n} style={{ width: 280, height: 340, backgroundColor: i === 0 ? ACCENT : CARD, color: i === 0 ? "#fff" : INK, borderRadius: 24, boxShadow: "0 20px 44px rgba(25,25,48,0.16)", opacity: e, transform: `translateY(${interpolate(e, [0, 1], [60, 0])}px) scale(${interpolate(e, [0, 1], [0.9, 1])})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 90, fontWeight: 900 }}>{c.n}</div>
            <div style={{ fontSize: 36, fontWeight: 800 }}>{c.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function VideoScreenLocal({ local, fps }: { local: number; fps: number }) {
  const e = spr(local, 5, fps);
  const slide = interpolate(local, [40, 180], [0, -260], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: e, transform: `scale(${interpolate(e, [0, 1], [0.9, 1])})`, display: "flex", gap: 30, alignItems: "center" }}>
      <div style={{ width: 620, height: 360, backgroundColor: INK, borderRadius: 28, overflow: "hidden", position: "relative", boxShadow: "0 24px 50px rgba(25,25,48,0.25)" }}>
        <div style={{ position: "absolute", left: slide, top: 0, width: 1140, height: "100%", background: `linear-gradient(90deg, ${ACCENT} 0%, #8B7CFF 35%, #FFD93D 70%, ${ACCENT} 100%)`, opacity: 0.9 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110, color: "#fff" }}>▶</div>
      </div>
      <div style={{ width: 300 }}>
        {[0, 1, 2].map((r) => {
          const le = spr(local, 30 + r * 16, fps);
          return (
            <div key={r} style={{ height: 22, borderRadius: 11, backgroundColor: r === 0 ? ACCENT : "#E5E7EB", marginBottom: 20, width: r === 2 ? "55%" : "100%", opacity: le, transform: `translateX(${interpolate(le, [0, 1], [40, 0])}px)` }} />
          );
        })}
      </div>
    </div>
  );
}

function MergeClipsLocal({ local, fps }: { local: number; fps: number }) {
  const clips = ["#FFD93D", "#8B7CFF", ACCENT];
  const pill = spr(local, 70, fps);
  return (
    <div style={{ position: "relative", width: 900, height: 380 }}>
      {clips.map((c, i) => {
        const e = spr(local, 10 + i * 14, fps);
        const x = interpolate(e, [0, 1], [(i - 1) * 320, (i - 1) * 110]);
        return (
          <div key={i} style={{ position: "absolute", left: "50%", top: 40, width: 300, height: 300, marginLeft: -150, backgroundColor: c, borderRadius: 24, border: "6px solid #fff", boxShadow: "0 20px 44px rgba(25,25,48,0.18)", opacity: e, transform: `translateX(${x}px) rotate(${interpolate(e, [0, 1], [(i - 1) * 10, 0])}deg)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, fontWeight: 900, color: "#fff" }}>
            {i + 1}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: "50%", bottom: -10, transform: "translateX(-50%)", backgroundColor: INK, color: "#fff", borderRadius: 999, padding: "12px 26px", fontSize: 28, fontWeight: 800, opacity: pill, whiteSpace: "nowrap" }}>
        ▶ &nbsp; 1 video utuh &nbsp; 🔊
      </div>
    </div>
  );
}

function FinalCardLocal({ local, fps }: { local: number; fps: number }) {
  const e = spr(local, 5, fps);
  const shrink = interpolate(local, [120, 210], [1, 0.72], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const check = spr(local, 90, fps);
  return (
    <div style={{ opacity: e, transform: `scale(${interpolate(e, [0, 1], [0.85, 1]) * shrink}) translateY(${interpolate(local, [120, 210], [0, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`, textAlign: "center" }}>
      <div style={{ width: 560, height: 320, backgroundColor: INK, borderRadius: 28, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100, boxShadow: "0 24px 50px rgba(25,25,48,0.28)" }}>🎬</div>
      <div style={{ marginTop: 28, fontSize: 40, fontWeight: 800, color: ACCENT, opacity: check }}>✓ &nbsp;Siap ditonton</div>
    </div>
  );
}

