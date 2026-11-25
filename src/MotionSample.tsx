import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * MotionSample v2 — 6 detik contoh motion effect dari gambar inti desain.md.
 * 1080x1920 vertikal, 30 fps, 180 frame.
 * Perbaikan atas feedback bill: "gambar diem saja, ga ada gerakan".
 * Motion v1 terlalu halus (push-in 1.00->1.12, bobbing ±8px) sehingga
 * tidak terlihat. v2 memakai gerakan BESAR dan JELAS di setiap detik:
 * - Push-in kuat 1.00 -> 1.35 + pan horizontal jelas (+120 -> -120 px)
 * - Bobbing besar ±30 px + tilt/rotasi ±2 derajat berirama
 * - Splash besar: ripple 30 -> 320 px berulang tiap 1 detik + droplet terbang
 * - Awan BESAR meluncur penuh melintasi langit
 * - Label pil pop-in spring overshoot besar + pulsing terus-menerus
 * - Sapuan cahaya (sun-ray sweep) melintasi adegan setiap ~2 detik
 */

const W = 1080;
const H = 1920;

const Pill: React.FC<{
  lines: string[];
  left: number;
  top: number;
  width: number;
  delay: number;
  bg: string;
}> = ({ lines, left, top, width, delay, bg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Spring overshoot BESAR: damping rendah, stiffness sedang
  const pop = spring({
    frame: frame - delay,
    fps,
    config: { damping: 7, stiffness: 120 },
  });
  // Pulsing terus setelah pop-in: 1.00 -> 1.07, jelas terlihat
  const pulse =
    frame > delay + 20
      ? 1 + Math.sin(((frame - delay - 20) / 30) * Math.PI * 2) * 0.05
      : 1;
  const scale = Math.max(pop, 0.001) * pulse;
  const opacity = interpolate(frame - delay, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height: 110,
        backgroundColor: bg,
        borderRadius: 60,
        border: "5px solid #2F5D8A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          color: "#FFFFFF",
          fontFamily: "Arial, sans-serif",
          fontSize: 44,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
};

const Cloud: React.FC<{
  top: number;
  fromX: number;
  toX: number;
  width: number;
  opacity: number;
}> = ({ top, fromX, toX, width, opacity }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 180], [fromX, toX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top,
        width,
        height: width * 0.36,
        backgroundColor: "#FFFFFF",
        borderRadius: width * 0.18,
        opacity,
      }}
    />
  );
};

/** Ripple BESAR: radius 30 -> 320 px, berulang tiap 30 frame (1 detik). */
const Ripple: React.FC<{ cx: number; cy: number; phase: number }> = ({
  cx,
  cy,
  phase,
}) => {
  const frame = useCurrentFrame();
  const local = (frame + phase) % 30;
  const p = local / 30;
  const radius = interpolate(p, [0, 1], [30, 320]);
  const opacity = interpolate(p, [0, 1], [1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - radius,
        top: cy - radius * 0.45,
        width: radius * 2,
        height: radius * 0.9,
        borderRadius: "50%",
        border: "10px solid #FFFFFF",
        opacity,
      }}
    />
  );
};

/** Droplet yang terbang ke atas dari genangan, parabola jelas. */
const Droplet: React.FC<{
  x: number;
  baseY: number;
  phase: number;
  size: number;
  color: string;
}> = ({ x, baseY, phase, size, color }) => {
  const frame = useCurrentFrame();
  const local = (frame + phase) % 30;
  const p = local / 30;
  // Naik cepat lalu jatuh: tinggi sampai 160 px
  const y = baseY - Math.sin(p * Math.PI) * 160;
  const opacity = interpolate(p, [0, 0.15, 0.9, 1], [0, 1, 1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity,
      }}
    />
  );
};

export const MotionSample: React.FC = () => {
  const frame = useCurrentFrame();

  // 1. Push-in KUAT + pan horizontal jelas: scale 1.00 -> 1.35, x +120 -> -120
  const zoom = interpolate(frame, [0, 180], [1.0, 1.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panX = interpolate(frame, [0, 180], [120, -120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 2. Bobbing BESAR ±30 px, 0.75 Hz + tilt ±2 derajat berirama
  const bob = Math.sin((frame / 30) * Math.PI * 2 * 0.75) * 30;
  const tilt = Math.sin((frame / 30) * Math.PI * 2 * 0.75) * 2;

  // 6. Sapuan cahaya: bar diagonal melintasi adegan setiap 60 frame (~2 dtk)
  const sweepCycle = frame % 60;
  const sweepX = interpolate(sweepCycle, [0, 60], [-500, 1600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepOpacity = interpolate(sweepCycle, [0, 10, 50, 60], [0, 0.28, 0.28, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#A8C4DE", overflow: "hidden" }}>
      <div
        style={{
          width: W,
          height: H,
          transform: `translate(${panX}px, ${bob}px) rotate(${tilt}deg) scale(${zoom})`,
          transformOrigin: "50% 55%",
        }}
      >
        <Img
          src={staticFile("contoh-inti.webp")}
          style={{ width: W, height: H, objectFit: "cover", display: "block" }}
        />
      </div>

      {/* 4. Awan BESAR meluncur penuh melintasi langit */}
      <Cloud top={300} fromX={-450} toX={1100} width={440} opacity={0.7} />
      <Cloud top={480} fromX={1150} toX={-420} width={380} opacity={0.6} />
      <Cloud top={180} fromX={-300} toX={1200} width={300} opacity={0.5} />

      {/* 3. Splash BESAR di genangan (sekitar x 540, y 1480), berulang tiap 1 dtk */}
      <Ripple cx={540} cy={1480} phase={0} />
      <Ripple cx={540} cy={1480} phase={10} />
      <Ripple cx={540} cy={1480} phase={20} />
      <Droplet x={460} baseY={1460} phase={0} size={30} color="#FFFFFF" />
      <Droplet x={620} baseY={1470} phase={10} size={26} color="#BFE3FF" />
      <Droplet x={540} baseY={1450} phase={20} size={34} color="#D6ECFF" />
      <Droplet x={380} baseY={1475} phase={5} size={22} color="#FFFFFF" />
      <Droplet x={700} baseY={1475} phase={15} size={22} color="#BFE3FF" />

      {/* 6. Sapuan cahaya diagonal melintasi adegan */}
      <div
        style={{
          position: "absolute",
          left: sweepX,
          top: -400,
          width: 320,
          height: 2800,
          backgroundColor: "#FFFFFF",
          opacity: sweepOpacity,
          transform: "rotate(25deg)",
        }}
      />

      {/* 5. Label pil pop-in spring overshoot besar + pulsing, satu per satu */}
      <Pill
        lines={["JALAN", "BERLUBANG"]}
        left={60}
        top={1760}
        width={440}
        delay={10}
        bg="#7A9BB8"
      />
      <Pill
        lines={["DOMPET TIPIS"]}
        left={580}
        top={1760}
        width={440}
        delay={30}
        bg="#8FA9C0"
      />
    </AbsoluteFill>
  );
};
