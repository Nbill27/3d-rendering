// world3d.tsx — DUNIA 3D Wojtek (Video16, History Rush #7).
// Pola dari v14/world3d.tsx: ThreeCanvas Remotion + three.js,
// kamera meluncur pelan per adegan, lapisan depan/tengah/belakang.
// Semua prop dibangun dari kode (box/cone/cylinder/sphere + tekstur
// canvas prosedural). TIDAK ADA prop GLB Kenney (folder public/bridge/
// tidak ada). Karakter 2D bean-head + beruang tetap overlay DOM di
// depan canvas ini (lihat Video16.tsx); titik pijakan karakter ada di
// z = 0. Lokasi: jalan + kamp Iran (S1-3), dermaga + kapal (S4),
// garis suplai Monte Cassino (S5-6), kandang Edinburgh Zoo (S7-9).
// Semua animasi adalah fungsi deterministik dari `local` (frame sejak
// adegan mulai) supaya still Remotion stabil.
import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";

/* ------------------------------------------------------------------ */
/* Tekstur canvas prosedural.                                          */
/* ------------------------------------------------------------------ */

const texCache = new Map<string, THREE.CanvasTexture>();

function canvasTex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const sandTex = () =>
  canvasTex("sand16", 256, 256, (g) => {
    g.fillStyle = "#e8d5a0";
    g.fillRect(0, 0, 256, 256);
    const r = rng(55);
    for (let i = 0; i < 1100; i++) {
      const v = 200 + Math.floor(r() * 55);
      g.fillStyle = `rgb(${v},${v - 25},${v - 90})`;
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
  });

const grassTex = () =>
  canvasTex("grass16", 256, 256, (g) => {
    g.fillStyle = "#55a266";
    g.fillRect(0, 0, 256, 256);
    const r = rng(33);
    for (let i = 0; i < 46; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(120,190,130,0.22)" : "rgba(46,122,68,0.20)";
      g.beginPath();
      g.arc(r() * 256, r() * 256, 8 + r() * 18, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = r() > 0.5 ? "#3f8a52" : "#5fb56e";
      g.fillRect(r() * 256, r() * 256, 2, 5 + r() * 6);
    }
  });

const woodTex = () =>
  canvasTex("wood16", 256, 256, (g) => {
    g.fillStyle = "#a8724a";
    g.fillRect(0, 0, 256, 256);
    const r = rng(7);
    for (let y = 0; y < 256; y += 42) {
      g.fillStyle = y % 84 === 0 ? "#96643e" : "#b57e52";
      g.fillRect(0, y, 256, 40);
      g.fillStyle = "rgba(60,35,15,0.55)";
      g.fillRect(0, y + 40, 256, 3);
    }
    g.strokeStyle = "rgba(70,40,18,0.35)";
    g.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const y = r() * 256;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(80, y + r() * 6 - 3, 170, y + r() * 6 - 3, 256, y);
      g.stroke();
    }
  });

const stoneTex = () =>
  canvasTex("stone16", 256, 256, (g) => {
    g.fillStyle = "#c9bfa8";
    g.fillRect(0, 0, 256, 256);
    const r = rng(21);
    for (let i = 0; i < 900; i++) {
      const v = 175 + Math.floor(r() * 50);
      g.fillStyle = `rgb(${v},${v - 8},${v - 30})`;
      g.fillRect(r() * 256, r() * 256, 3, 3);
    }
    g.strokeStyle = "rgba(90,75,55,0.5)";
    g.lineWidth = 2;
    for (let y = 0; y < 256; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
    for (let x = 0; x < 256; x += 64) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 256);
      g.stroke();
    }
  });

const skyTex = (top: string, hor: string) =>
  canvasTex(`sky-${top}-${hor}`, 16, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, hor);
    gr.addColorStop(0.35, hor);
    gr.addColorStop(0.62, mix2(hor, top));
    gr.addColorStop(1, top);
    g.fillStyle = gr;
    g.fillRect(0, 0, 16, 256);
  });

const mix2 = (a: string, b: string): string => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round((((A >> s) & 255) + ((B >> s) & 255)) / 2).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

/* ------------------------------------------------------------------ */
/* Material helpers + potongan bangun kecil.                           */
/* ------------------------------------------------------------------ */

const lamCache = new Map<string, THREE.MeshLambertMaterial>();
const lam = (color: string, map?: THREE.Texture | null, extra?: Partial<THREE.MeshLambertMaterialParameters>): THREE.MeshLambertMaterial => {
  const norm = extra && extra.opacity !== undefined ? { ...extra, opacity: Math.round(extra.opacity * 100) / 100 } : extra;
  const key = `${color}|${map ? (map as THREE.CanvasTexture).uuid : ""}|${JSON.stringify(norm ?? {})}`;
  let m = lamCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, map: map ?? null, ...(norm ?? {}) });
    lamCache.set(key, m);
  }
  return m;
};
const basic = (color: string, opacity = 1): THREE.MeshBasicMaterial =>
  new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, fog: false });

const B = ({ p, s, c, r, map, op }: { p: [number, number, number]; s: [number, number, number]; c: string; r?: [number, number, number]; map?: THREE.Texture | null; op?: number }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} material={lam(c, map, op !== undefined ? { transparent: true, opacity: op } : undefined)}>
    <boxGeometry args={s} />
  </mesh>
);
const Sph = ({ p, s, c, r, op, map }: { p: [number, number, number]; s: [number, number, number]; c: string; r?: [number, number, number]; op?: number; map?: THREE.Texture | null }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} scale={s} material={lam(c, map ?? null, op !== undefined ? { transparent: true, opacity: op } : undefined)}>
    <sphereGeometry args={[1, 20, 14]} />
  </mesh>
);
const Cyl = ({ p, s, c, r, seg, map }: { p: [number, number, number]; s: [number, number, number, number]; c: string; r?: [number, number, number]; seg?: number; map?: THREE.Texture | null }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} material={lam(c, map ?? null)}>
    <cylinderGeometry args={[s[0], s[1], s[2], seg ?? 12]} />
  </mesh>
);
const Cone = ({ p, s, c, r, seg }: { p: [number, number, number]; s: [number, number, number]; c: string; r?: [number, number, number]; seg?: number }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} material={lam(c)}>
    <coneGeometry args={[s[0], s[1], seg ?? 12]} />
  </mesh>
);
const Disc = ({ p, s, c, op }: { p: [number, number, number]; s: number; c: string; op?: number }) => (
  <mesh position={p} material={basic(c, op ?? 1)}>
    <circleGeometry args={[s, 32]} />
  </mesh>
);

/* ------------------------------------------------------------------ */
/* Konfigurasi per adegan.                                             */
/* ------------------------------------------------------------------ */

type Cfg = {
  skyTop: string;
  skyHor: string;
  fog: string;
  groundTex: () => THREE.Texture;
  groundColor: string;
  sunPos: [number, number, number];
  sunR: number;
  sunColor: string;
  camPos: [number, number, number];
  camLook: [number, number, number];
  fov: number;
  dirColor: string;
  dirPos: [number, number, number];
  dirInt: number;
  amb: number;
  fogNear: number;
  fogFar: number;
};

const CFGS: Cfg[] = [
  // S1 Iran, jalan siang terik (Hamadan): langit biru + horizon pasir
  { skyTop: "#4a86cf", skyHor: "#e8d5a0", fog: "#d8c49a", groundTex: sandTex, groundColor: "#c9a06a", sunPos: [8, 13, -55], sunR: 3.2, sunColor: "#ffcf6e", camPos: [0, 3.4, 16], camLook: [0, 1.5, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S2 kamp pengungsi Iran, siang hangat
  { skyTop: "#4a86cf", skyHor: "#e8c98a", fog: "#d8c49a", groundTex: sandTex, groundColor: "#c9a06a", sunPos: [8, 13, -55], sunR: 3.2, sunColor: "#ffcf6e", camPos: [0, 3.2, 15], camLook: [0, 1.4, -3], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S3 kamp, sore keemasan
  { skyTop: "#5a7ab0", skyHor: "#ffb36b", fog: "#d8a878", groundTex: sandTex, groundColor: "#c9a06a", sunPos: [-8, 7, -55], sunR: 3.4, sunColor: "#ff9d45", camPos: [0, 3.0, 14], camLook: [0, 1.2, -2], fov: 46, dirColor: "#ffcf9e", dirPos: [-8, 10, 6], dirInt: 1.4, amb: 0.55, fogNear: 26, fogFar: 90 },
  // S4 dermaga + kapal, pagi biru laut
  { skyTop: "#3a6a9a", skyHor: "#cfe3f2", fog: "#9ab8cc", groundTex: sandTex, groundColor: "#b89a6a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2ead0", camPos: [0, 3.4, 16], camLook: [0, 1.6, -3], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.3, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S5 Monte Cassino, garis suplai siang berdebu + biara hancur di bukit
  { skyTop: "#6a7a9a", skyHor: "#d8c9a8", fog: "#b8a888", groundTex: sandTex, groundColor: "#a8895a", sunPos: [8, 12, -55], sunR: 3.2, sunColor: "#ffcf6e", camPos: [0, 3.6, 15], camLook: [0, 2.0, -3], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.4, amb: 0.5, fogNear: 26, fogFar: 90 },
  // S6 Monte Cassino, senja keemasan upacara
  { skyTop: "#4a3a5a", skyHor: "#ffb36b", fog: "#a87858", groundTex: sandTex, groundColor: "#a8895a", sunPos: [-8, 6, -55], sunR: 3.6, sunColor: "#ff9d45", camPos: [0, 3.4, 15], camLook: [0, 1.8, -3], fov: 46, dirColor: "#ffcf9e", dirPos: [-8, 10, 6], dirInt: 1.3, amb: 0.5, fogNear: 26, fogFar: 90 },
  // S7 Edinburgh Zoo, kelabu hujan
  { skyTop: "#6a6a72", skyHor: "#b8b8b0", fog: "#8a8a88", groundTex: grassTex, groundColor: "#6a8a5a", sunPos: [8, 10, -55], sunR: 2.6, sunColor: "#e8e8e0", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#d8d8d0", dirPos: [8, 12, 6], dirInt: 0.9, amb: 0.6, fogNear: 26, fogFar: 90 },
  // S8 Edinburgh Zoo, siang lembut
  { skyTop: "#5a7ab0", skyHor: "#d8d8c8", fog: "#a8b0a8", groundTex: grassTex, groundColor: "#6a8a5a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2ead0", camPos: [0, 3.2, 15], camLook: [0, 1.2, -2], fov: 46, dirColor: "#e8e6da", dirPos: [8, 14, 6], dirInt: 1.1, amb: 0.55, fogNear: 26, fogFar: 90 },
  // S9 Edinburgh Zoo, senja redup penutup
  { skyTop: "#3a3a4a", skyHor: "#c98a6a", fog: "#7a6a62", groundTex: grassTex, groundColor: "#5a7a4a", sunPos: [-8, 6, -55], sunR: 3.2, sunColor: "#ff9d45", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#e8c9a8", dirPos: [-8, 10, 6], dirInt: 1.0, amb: 0.5, fogNear: 26, fogFar: 90 },
];

/* ------------------------------------------------------------------ */
/* Potongan bersama: langit, awan, bukit, tanah, latar depan, burung.  */
/* ------------------------------------------------------------------ */

const drift = (local: number, amp: number, speed: number, phase = 0) => Math.sin(local * speed + phase) * amp;
const pulse = (local: number, speed: number, min: number, max: number, phase = 0) => min + (max - min) * (0.5 + 0.5 * Math.sin(local * speed + phase));

const Sky: React.FC<{ cfg: Cfg; local: number }> = ({ cfg }) => (
  <group>
    <color attach="background" args={[cfg.skyTop]} />
    <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
    <mesh position={[0, 16, -58]} material={new THREE.MeshBasicMaterial({ map: skyTex(cfg.skyTop, cfg.skyHor), fog: false })}>
      <planeGeometry args={[220, 120]} />
    </mesh>
    <Disc p={cfg.sunPos} s={cfg.sunR} c={cfg.sunColor} />
    <Disc p={cfg.sunPos} s={cfg.sunR * 1.5} c={cfg.sunColor} op={0.2} />
    <Disc p={cfg.sunPos} s={cfg.sunR * 2.2} c={cfg.sunColor} op={0.12} />
  </group>
);

const cloudMat = () => {
  let m = lamCache.get("cloud16");
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.45 });
    lamCache.set("cloud16", m);
  }
  return m;
};
const Cloud = ({ x, y, z, s, local, phase }: { x: number; y: number; z: number; s: number; local: number; phase: number }) => (
  <group position={[x + drift(local, 0.9, 0.02, phase), y, z]}>
    <mesh position={[0, 0, 0]} scale={[2.2 * s, 0.9 * s, 1.2 * s]} material={cloudMat()}>
      <sphereGeometry args={[1, 20, 14]} />
    </mesh>
    <mesh position={[1.8 * s, -0.15 * s, 0]} scale={[1.6 * s, 0.7 * s, 1 * s]} material={cloudMat()}>
      <sphereGeometry args={[1, 20, 14]} />
    </mesh>
    <mesh position={[-1.8 * s, -0.2 * s, 0]} scale={[1.4 * s, 0.65 * s, 1 * s]} material={cloudMat()}>
      <sphereGeometry args={[1, 20, 14]} />
    </mesh>
  </group>
);

const Hills = ({ colors, z1 = -30, trees = true }: { colors: [string, string, string]; z1?: number; trees?: boolean }) => (
  <group>
    <Sph p={[-13, -1.5, z1]} s={[13, 4.2, 5]} c={colors[0]} />
    <Sph p={[11, -1.8, z1 - 3]} s={[14, 4.8, 5]} c={colors[1]} />
    <Sph p={[0, -2.2, z1 - 7]} s={[16, 5.2, 5]} c={colors[2]} />
    {trees && (
      <>
        <Sph p={[-8, 0.9, z1 + 1]} s={[1.1, 1.1, 1.1]} c="#2e7a44" />
        <Sph p={[-4, 1.2, z1]} s={[0.9, 0.9, 0.9]} c="#2e7a44" />
        <Sph p={[7, 1.0, z1 - 1]} s={[1.2, 1.2, 1.2]} c="#2e7a44" />
        <Sph p={[9.5, 0.8, z1 + 1]} s={[0.9, 0.9, 0.9]} c="#3f8a52" />
      </>
    )}
  </group>
);

/** Pegunungan Zagros (Iran): puncak batu besar berlapis, tanpa pohon. */
const Mountains = () => (
  <group>
    <Sph p={[-14, -2, -34]} s={[12, 7, 5]} c="#8a6a52" />
    <Sph p={[-4, -3, -38]} s={[14, 9, 5]} c="#7a5a44" />
    <Sph p={[8, -2.5, -36]} s={[13, 8, 5]} c="#8a6a52" />
    <Sph p={[16, -3, -32]} s={[10, 6, 5]} c="#6a4a3a" />
    {/* salju di puncak */}
    <Sph p={[-4, 4.2, -38]} s={[4.5, 2.2, 3]} c="#f2f0ea" />
    <Sph p={[8, 3.4, -36]} s={[3.8, 1.8, 3]} c="#f2f0ea" />
  </group>
);

const Ground = ({ cfg }: { cfg: Cfg }) => {
  const tex = useMemo(() => {
    const t = cfg.groundTex();
    t.repeat.set(8, 8);
    return t;
  }, [cfg]);
  return (
    <mesh position={[0, 0, -12]} rotation={[-Math.PI / 2, 0, 0]} material={lam(cfg.groundColor, tex)}>
      <planeGeometry args={[140, 70]} />
    </mesh>
  );
};

const Foreground = ({ local, tone = "sand" }: { local: number; tone?: "sand" | "green" | "dark" }) => (
  <group>
    <Sph p={[-1.7, 0.18, 8.6]} s={[0.6, 0.32, 0.45]} c={tone === "dark" ? "#3a2c22" : tone === "green" ? "#7a8a6a" : "#c9bfa8"} />
    <Sph p={[1.7, 0.2, 8.4]} s={[0.65, 0.35, 0.45]} c={tone === "dark" ? "#3a2c22" : tone === "green" ? "#7a8a6a" : "#c9bfa8"} />
    {[-1.4, 1.3, -0.4].map((x, i) => (
      <group key={i} position={[x, 0, 8.6]} rotation={[0, 0, Math.sin(local * 0.07 + i) * 0.05]}>
        <Cone p={[0, 0.35, 0]} s={[0.28, 0.7, 0]} c={tone === "dark" ? "#4a5d3a" : "#3e7d4e"} seg={6} />
        <Cone p={[0.3, 0.3, 0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e9d5e"} seg={6} />
        <Cone p={[-0.3, 0.3, -0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e9d5e"} seg={6} />
      </group>
    ))}
  </group>
);

const Bird = ({ x, y, z, local, phase, s = 1 }: { x: number; y: number; z: number; local: number; phase: number; s?: number }) => (
  <group position={[x + drift(local, 1.2, 0.02, phase), y, z]} scale={[s, s, s]}>
    <B p={[-0.28, 0, 0]} s={[0.55, 0.07, 0.07]} c="#3d5a80" r={[0, 0, 0.5]} />
    <B p={[0.28, 0, 0]} s={[0.55, 0.07, 0.07]} c="#3d5a80" r={[0, 0, -0.5]} />
  </group>
);

const Stars = ({ local }: { local: number }) => {
  const pts: [number, number, number][] = [
    [-9, 13, -40], [-4, 15, -42], [2, 14, -40], [7, 12, -41], [11, 15, -43],
    [-12, 10, -38], [-1, 11, -39], [5, 16, -44], [9, 9, -37], [-7, 16, -43],
    [0, 17, -44], [13, 11, -39], [-11, 14, -41], [4, 10, -38],
  ];
  return (
    <group>
      {pts.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} material={basic("#ffffff", pulse(local, 0.1, 0.5, 1, i * 1.3))}>
          <sphereGeometry args={[0.09, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Prop — semua dibangun dari kode (box/cone/cylinder/sphere).         */
/* ------------------------------------------------------------------ */

/** Tenda kamp segitiga: kain kanvas + tiang + pasak. */
const Tent = ({ x, z, s = 1, color = "#d8cba8" }: { x: number; z: number; s?: number; color?: string }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    <Cone p={[0, 1.1, 0]} s={[1.6, 2.2, 0]} c={color} seg={4} r={[0, Math.PI / 4, 0]} />
    <B p={[0, 0.5, 1.1]} s={[0.9, 1.0, 0.06]} c="#5d4023" />
    <Cyl p={[0, 1.2, 0]} s={[0.05, 0.05, 2.4, 0]} c="#5d4023" />
    <B p={[-1.2, 0.06, 1.2]} s={[0.5, 0.12, 0.3]} c="#8a7a5a" />
    <B p={[1.2, 0.06, 1.2]} s={[0.5, 0.12, 0.3]} c="#8a7a5a" />
  </group>
);

/** Api unggun kecil: batu + kayu + lidah api flicker + asap tipis. */
const Campfire = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const f = 0.5 + 0.5 * Math.sin(local * 0.5 + x * 2);
  return (
    <group position={[x, 0, z]} scale={[s, s, s]}>
      {[-0.5, 0.5].map((dx, i) => (
        <Sph key={i} p={[dx, 0.14, 0]} s={[0.22, 0.16, 0.2]} c="#8a8a88" />
      ))}
      <B p={[0, 0.22, 0]} s={[0.9, 0.12, 0.12]} c="#5d4023" r={[0, 0, 0.5]} />
      <B p={[0, 0.22, 0]} s={[0.9, 0.12, 0.12]} c="#6e4a2a" r={[0, 0, -0.5]} />
      <Cone p={[0, 0.45 + f * 0.08, 0]} s={[0.22, 0.65 + f * 0.2, 0]} c="#ff7a2a" seg={8} />
      <Cone p={[0, 0.38, 0]} s={[0.14, 0.42, 0]} c="#ffd23a" seg={8} />
      <Sph p={[0, 1.4 + ((local * 0.02) % 1) * 1.2, 0]} s={[0.3 + ((local * 0.02) % 1) * 0.4, 0.3 + ((local * 0.02) % 1) * 0.4, 0.3]} c="#c9c9c9" op={0.35} />
    </group>
  );
};

/** Tumpukan peti amunisi: kotak kayu + pita + peluru. */
const CrateStack3D = ({ x, z, n = 3, s = 1 }: { x: number; z: number; n?: number; s?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    {Array.from({ length: n }).map((_, i) => (
      <B key={i} p={[(i % 2) * 0.9 - 0.45, 0.35 + Math.floor(i / 2) * 0.72, (i % 2) * 0.2]} s={[0.85, 0.7, 0.85]} c={i % 2 ? "#8a6a42" : "#a8875f"} map={woodTex()} />
    ))}
    <Cyl p={[0.4, 1.15, 0.3]} s={[0.09, 0.09, 0.5, 0]} c="#3a3a3a" r={[0, 0, 0.4]} />
  </group>
);

/** Tiang bendera Polandia (putih atas, merah bawah) + bendera berkibar. */
const FlagPole = ({ x, z, local, phase = 0 }: { x: number; z: number; local: number; phase?: number }) => {
  const wave = Math.sin(local * 0.12 + phase) * 0.12;
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 2.2, 0]} s={[0.06, 0.08, 4.4, 0]} c="#5d4023" />
      <Sph p={[0, 4.45, 0]} s={[0.1, 0.1, 0.1]} c="#c9a83a" />
      <group position={[0.65, 3.9, 0]} rotation={[0, 0, wave * 0.4]}>
        <B p={[0, 0.28, 0]} s={[1.2, 0.28, 0.04]} c="#f5f2ea" />
        <B p={[0, 0, 0]} s={[1.2, 0.28, 0.04]} c="#c23a12" />
      </group>
    </group>
  );
};

/** Palem kurma: batang + 6 pelepah. */
const Palm = ({ x, z, local, s = 1, phase = 0 }: { x: number; z: number; local: number; s?: number; phase?: number }) => {
  const sway = Math.sin(local * 0.06 + phase) * 0.05;
  return (
    <group position={[x, 0, z]} scale={[s, s, s]} rotation={[0, 0, sway]}>
      <Cyl p={[0, 1.6, 0]} s={[0.16, 0.24, 3.2, 0]} c="#7a5a34" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <Cone
            key={i}
            p={[Math.cos(a) * 0.9, 3.3, Math.sin(a) * 0.9]}
            s={[0.35, 1.6, 0]}
            c="#3f7a4a"
            seg={6}
            r={[Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9 + 0.6]}
          />
        );
      })}
      <Sph p={[0, 3.1, 0]} s={[0.3, 0.25, 0.3]} c="#8a6a42" />
    </group>
  );
};

/** Jalan tanah membujur ke kejauhan. */
const Road = ({ w = 3.6 }: { w?: number }) => (
  <mesh position={[0, 0.06, -2]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#c9a06a", sandTex())}>
    <planeGeometry args={[w, 30]} />
  </mesh>
);

/** Kapal transport: lambung + geladak + cerobong + tiang + bendera. */
const Ship = ({ x, z, local }: { x: number; z: number; local: number }) => {
  const bobY = Math.sin(local * 0.08) * 0.06;
  return (
    <group position={[x, bobY, z]}>
      {/* lambung hitam + garis air merah */}
      <B p={[0, 1.0, 0]} s={[9, 2.0, 2.6]} c="#2a2a2e" />
      <B p={[0, 0.3, 0]} s={[9.1, 0.5, 2.7]} c="#8a2a22" />
      <B p={[0, 2.2, 0]} s={[8.2, 0.5, 2.2]} c="#f5f2ea" />
      {/* geladak + anjungan */}
      <B p={[-2.2, 2.9, 0]} s={[2.2, 1.0, 1.8]} c="#e8e2d2" />
      <B p={[-2.2, 3.6, 0]} s={[1.6, 0.5, 1.4]} c="#c9c2b2" />
      {/* cerobong + tiang */}
      <Cyl p={[1.6, 3.4, 0]} s={[0.35, 0.45, 1.6, 0]} c="#c23a12" />
      <Cyl p={[3.2, 3.6, 0]} s={[0.05, 0.07, 3.0, 0]} c="#5d4023" />
      {/* jendela kapal */}
      {[-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((dx, i) => (
        <B key={i} p={[dx, 1.2, 1.32]} s={[0.4, 0.4, 0.04]} c="#ffd23a" />
      ))}
      {/* asap cerobong */}
      <Sph p={[1.6, 4.6 + ((local * 0.02) % 1) * 1.4, 0]} s={[0.5 + ((local * 0.02) % 1) * 0.5, 0.5 + ((local * 0.02) % 1) * 0.5, 0.5]} c="#c9c9c9" op={0.4} />
    </group>
  );
};

/** Dermaga kayu: papan + tiang. */
const Dock = () => (
  <group>
    {[0, 1, 2, 3, 4].map((i) => (
      <B key={i} p={[-2 + i * 1.0, 0.18, -1]} s={[0.9, 0.12, 6]} c="#8a6a42" map={woodTex()} />
    ))}
    {[-2, 0, 2].map((dx, i) => (
      <Cyl key={i} p={[dx, 0.1, -3.5]} s={[0.12, 0.12, 0.5, 0]} c="#5d4023" />
    ))}
  </group>
);

/** Laut: bidang biru bergelombang di belakang dermaga. */
const Sea = ({ local }: { local: number }) => (
  <group>
    <mesh position={[0, 0.12, -14]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#3a6a9a")}>
      <planeGeometry args={[140, 40]} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[-6 + ((local * 0.3 + i * 5) % 12), 0.16, -10 - i * 3]} rotation={[-Math.PI / 2, 0, 0]} material={basic("#9fd4e8", 0.6)}>
        <planeGeometry args={[3, 0.18]} />
      </mesh>
    ))}
  </group>
);

/** Truk amunisi militer: kabin + bak + roda + peti di bak. */
const AmmoTruck = ({ x, z, s = 1, color = "#5d6a3a" }: { x: number; z: number; s?: number; color?: string }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    {/* bak + kabin */}
    <B p={[0.9, 0.9, 0]} s={[2.4, 1.1, 1.4]} c={color} />
    <B p={[-1.4, 0.9, 0]} s={[1.2, 1.0, 1.3]} c="#4a5530" />
    <B p={[-1.4, 1.6, 0]} s={[1.0, 0.5, 1.2]} c="#6a7a4a" />
    <B p={[-1.75, 1.0, 0.66]} s={[0.04, 0.4, 0.5]} c="#9fd4e8" />
    {/* peti di bak */}
    <B p={[0.5, 1.7, 0]} s={[0.8, 0.6, 0.8]} c="#8a6a42" map={woodTex()} />
    <B p={[1.4, 1.7, 0]} s={[0.8, 0.6, 0.8]} c="#a8875f" map={woodTex()} />
    {/* roda */}
    {[-1.5, 0.6, 1.5].map((dx, i) => (
      <Cyl key={i} p={[dx, 0.35, 0.72]} s={[0.35, 0.35, 0.12, 0]} c="#1e1e1e" r={[Math.PI / 2, 0, 0]} seg={16} />
    ))}
    {[-1.5, 0.6, 1.5].map((dx, i) => (
      <Cyl key={i} p={[dx, 0.35, -0.72]} s={[0.35, 0.35, 0.12, 0]} c="#1e1e1e" r={[Math.PI / 2, 0, 0]} seg={16} />
    ))}
  </group>
);

/** Biara Monte Cassino hancur di atas bukit: dinding batu + menara
 *  patah + jendela kosong. Bukan replika arsitektur presisi — siluet
 *  reruntuhan di puncak bukit, sesuai foto 19 Mei 1944. */
const Monastery = ({ x, z, y = 0 }: { x: number; z: number; y?: number }) => (
  <group position={[x, y, z]}>
    <B p={[0, 1.2, 0]} s={[5.5, 2.4, 3.2]} c="#c9bfa8" map={stoneTex()} />
    <B p={[-1.8, 3.0, 0]} s={[1.6, 1.4, 2.6]} c="#b8ab98" map={stoneTex()} />
    <B p={[1.8, 2.8, 0]} s={[1.2, 1.0, 2.4]} c="#a89a88" map={stoneTex()} />
    {/* menara patah */}
    <Cyl p={[-2.2, 3.6, -0.6]} s={[0.5, 0.6, 2.4, 0]} c="#c9bfa8" map={stoneTex()} seg={8} />
    {/* jendela kosong (hitam) */}
    {[-1.5, 0, 1.5].map((dx, i) => (
      <B key={i} p={[dx, 1.4, 1.62]} s={[0.6, 1.0, 0.06]} c="#1e1a16" />
    ))}
    <B p={[0, 0.6, 1.62]} s={[1.0, 1.2, 0.06]} c="#1e1a16" />
    {/* atap runtuh miring */}
    <B p={[0.8, 2.5, 0]} s={[3.4, 0.2, 3.0]} c="#6e5a44" r={[0, 0, 0.18]} />
  </group>
);

/** Pohon sipres Italia: kerucut tinggi ramping. */
const Cypress = ({ x, z, local, s = 1, phase = 0 }: { x: number; z: number; local: number; s?: number; phase?: number }) => {
  const sway = Math.sin(local * 0.06 + phase) * 0.03;
  return (
    <group position={[x, 0, z]} scale={[s, s, s]} rotation={[0, 0, sway]}>
      <Cyl p={[0, 0.5, 0]} s={[0.12, 0.18, 1.0, 0]} c="#5d4023" />
      <Cone p={[0, 2.2, 0]} s={[0.7, 3.6, 0]} c="#2e5d3a" seg={10} />
      <Cone p={[0, 3.4, 0]} s={[0.45, 2.0, 0]} c="#3f7a4a" seg={10} />
    </group>
  );
};

/** Pohon rindang kebun binatang: batang + 3 bola daun. */
const ZooTree = ({ x, z, local, s = 1, phase = 0 }: { x: number; z: number; local: number; s?: number; phase?: number }) => {
  const sway = Math.sin(local * 0.05 + phase) * 0.04;
  return (
    <group position={[x, 0, z]} scale={[s, s, s]} rotation={[0, 0, sway]}>
      <Cyl p={[0, 1.0, 0]} s={[0.18, 0.26, 2.0, 0]} c="#5d4023" />
      <Sph p={[0, 2.6, 0]} s={[1.3, 1.1, 1.3]} c="#3f7a4a" />
      <Sph p={[-0.9, 2.1, 0.3]} s={[0.8, 0.7, 0.8]} c="#4a8a52" />
      <Sph p={[0.9, 2.2, -0.2]} s={[0.85, 0.75, 0.85]} c="#2e6a3a" />
    </group>
  );
};

/** Dinding batu kandang (belakang) + pagar jeruji 3D (depan, z -1). */
const Enclosure = () => (
  <group>
    <B p={[0, 1.0, -8]} s={[14, 2.0, 0.6]} c="#a89a88" map={stoneTex()} />
    <B p={[0, 2.1, -8]} s={[14, 0.25, 0.7]} c="#8a7a68" />
    {[-6, -3, 0, 3, 6].map((dx, i) => (
      <Cyl key={i} p={[dx, 1.1, -1]} s={[0.07, 0.07, 2.2, 0]} c="#3a3a3a" />
    ))}
    <B p={[0, 0.9, -1]} s={[13.5, 0.1, 0.08]} c="#3a3a3a" />
    <B p={[0, 1.9, -1]} s={[13.5, 0.1, 0.08]} c="#3a3a3a" />
    {/* papan nama kebun binatang (tanpa teks — label sudah di DateLabel) */}
    <B p={[-4.5, 2.6, -7.6]} s={[2.4, 0.9, 0.1]} c="#f5f2ea" />
    <B p={[-4.5, 2.6, -7.55]} s={[2.0, 0.06, 0.02]} c="#2a2018" />
    <B p={[-4.5, 2.35, -7.55]} s={[1.4, 0.06, 0.02]} c="#2a2018" />
  </group>
);

/** Bangku taman di luar pagar (untuk veteran S8). */
const Bench = ({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z]}>
    <B p={[0, 0.5, 0]} s={[1.8, 0.1, 0.6]} c="#7a5a34" map={woodTex()} />
    <B p={[0, 1.0, -0.28]} s={[1.8, 0.5, 0.08]} c="#7a5a34" map={woodTex()} />
    <B p={[-0.8, 0.25, 0]} s={[0.1, 0.5, 0.55]} c="#3a3a3a" />
    <B p={[0.8, 0.25, 0]} s={[0.1, 0.5, 0.55]} c="#3a3a3a" />
  </group>
);

/** Kolom asap (Monte Cassino): bola naik + membesar, memudar. */
const SmokeColumn = ({ x, z, local, s = 1, phase = 0, dark = false }: { x: number; z: number; local: number; s?: number; phase?: number; dark?: boolean }) => (
  <group>
    {[0, 1, 2, 3, 4].map((i) => {
      const rise = (local * 0.02 + phase + i * 0.16) % 1;
      return (
        <Sph
          key={i}
          p={[x + rise * 1.2, 1 + rise * 7, z]}
          s={[0.7 + rise * 1.1, 0.7 + rise * 1.1, 0.7 + rise * 1.1].map((v) => v * s) as [number, number, number]}
          c={dark ? "#3a2c22" : "#8a8a88"}
          op={0.32 - rise * 0.2}
        />
      );
    })}
  </group>
);

/** Bara api beterbangan (Monte Cassino). */
const Embers = ({ local, n = 10, area = 8, phase = 0 }: { local: number; n?: number; area?: number; phase?: number }) => (
  <group>
    {Array.from({ length: n }).map((_, i) => {
      const rise = (local * 0.03 + i * 0.13 + phase) % 1;
      const x = Math.sin(i * 12.9898) * area - area / 2 + rise * 3;
      const z = -2 - ((i * 7.233) % 10);
      return (
        <mesh key={i} position={[x, 0.3 + rise * 6, z]} material={basic("#ff9d45", 0.9 - rise * 0.5)}>
          <sphereGeometry args={[0.08, 8, 6]} />
        </mesh>
      );
    })}
  </group>
);

/* ------------------------------------------------------------------ */
/* Adegan 3D — satu fungsi per baris VO (9 adegan, hard cut).           */
/* Kamera: FOV vertikal 46 + aspek 9:16 = setengah lebar horizontal     */
/* hanya 0,239 x jarak kamera (cam z=16): di z=-2 lebarnya ~4,1 unit,  */
/* di z=-6 ~5,3 unit. Prop kunci duduk di |x| < 4,5, z -12..0.          */
/* ------------------------------------------------------------------ */

const Scene1World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.2} local={local} phase={0} />
    <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Mountains />
    <Ground cfg={cfg} />
    <Road />
    {/* jalan Iran: palem + batu + semak di tepi jalan */}
    <Palm x={-5.2} z={-8} local={local} s={1.2} phase={0} />
    <Palm x={5.4} z={-10} local={local} s={1.0} phase={2} />
    <Palm x={-5.8} z={-3} local={local} s={0.9} phase={1} />
    <Sph p={[-2.6, 0.3, -4]} s={[0.7, 0.45, 0.6]} c="#a89878" />
    <Sph p={[3.0, 0.25, -5]} s={[0.6, 0.4, 0.5]} c="#a89878" />
    <Sph p={[2.2, 0.2, -1.5]} s={[0.45, 0.3, 0.4]} c="#b8a888" />
    <Bird x={-3} y={11} z={-20} local={local} phase={0} />
    <Bird x={3} y={12} z={-22} local={local} phase={2} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene2World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Mountains />
    <Ground cfg={cfg} />
    <Road />
    {/* kamp pengungsi: tenda + api unggun + peti + bendera Polandia */}
    <Tent x={-3.6} z={-7} s={1.1} />
    <Tent x={3.8} z={-8} s={1.0} color="#c9bfa8" />
    <Tent x={-4.2} z={-12} s={0.9} color="#c2b49a" />
    <Campfire x={-2.0} z={-2.5} local={local} s={0.9} />
    <CrateStack3D x={2.6} z={-3.5} n={3} />
    <CrateStack3D x={-2.8} z={-5.5} n={2} s={0.9} />
    <FlagPole x={4.0} z={-5} local={local} phase={0} />
    <Palm x={-5.6} z={-9} local={local} s={1.1} phase={1} />
    <Palm x={5.6} z={-13} local={local} s={0.9} phase={2} />
    <Bird x={-2} y={11} z={-20} local={local} phase={1} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene3World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1} local={local} phase={1} />
    <Mountains />
    <Ground cfg={cfg} />
    {/* kamp sore: tenda dekat + api besar + tong bir + bendera */}
    <Tent x={-3.8} z={-6} s={1.15} />
    <Tent x={3.9} z={-7} s={1.0} color="#c9bfa8" />
    <Campfire x={0} z={-4} local={local} s={1.15} />
    <CrateStack3D x={-2.8} z={-2.5} n={3} />
    <CrateStack3D x={3.0} z={-3} n={2} s={0.9} />
    {/* tong bir kayu di dekat api */}
    <Cyl p={[-1.8, 0.5, -1.5]} s={[0.4, 0.45, 1.0, 0]} c="#7a5a34" map={woodTex()} seg={12} />
    <Cyl p={[1.9, 0.5, -1.8]} s={[0.4, 0.45, 1.0, 0]} c="#8a6a42" map={woodTex()} seg={12} />
    <FlagPole x={-4.2} z={-4} local={local} phase={1} />
    <Palm x={5.6} z={-8} local={local} s={1.0} phase={0} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene4World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={6} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Ground cfg={cfg} />
    {/* dermaga + laut + kapal transport di belakang */}
    <Sea local={local} />
    <Ship x={0} z={-14} local={local} />
    <Dock />
    <CrateStack3D x={-3.2} z={-2} n={3} />
    <CrateStack3D x={3.4} z={-2.5} n={2} s={0.9} />
    <FlagPole x={-4.0} z={-3} local={local} phase={0} />
    <Bird x={-3} y={11} z={-20} local={local} phase={0} />
    <Bird x={3} y={12} z={-22} local={local} phase={2} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene5World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.2} local={local} phase={0} />
    <Hills colors={["#6a7a52", "#5a6a44", "#4a5a3a"]} />
    <Ground cfg={cfg} />
    <Road />
    {/* biara hancur di atas bukit (latar) + asap */}
    <group position={[0, 3.4, -24]}>
      <Sph p={[0, -1.5, 0]} s={[7, 3.2, 4]} c="#6a6a52" />
      <Monastery x={0} z={0} y={0} />
    </group>
    <SmokeColumn x={-2} z={-18} local={local} s={1.1} phase={0} dark />
    <SmokeColumn x={3} z={-20} local={local} s={0.9} phase={2} dark />
    {/* garis suplai: truk amunisi + peti + sipres */}
    <AmmoTruck x={-2.6} z={-7} s={1.0} />
    <AmmoTruck x={3.6} z={-10} s={0.9} color="#5d5a3a" />
    <CrateStack3D x={-2.2} z={-3} n={3} />
    <CrateStack3D x={2.8} z={-4} n={2} s={0.9} />
    <Cypress x={-5.4} z={-8} local={local} s={1.1} phase={0} />
    <Cypress x={5.6} z={-9} local={local} s={1.0} phase={2} />
    <Cypress x={5.0} z={-4} local={local} s={0.85} phase={1} />
    <Embers local={local} n={8} area={8} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene6World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1} local={local} phase={1} />
    <Hills colors={["#5a4a3a", "#4a3a30", "#3a2c26"]} />
    <Ground cfg={cfg} />
    <Road />
    {/* senja upacara: biara + bendera + peti + sipres */}
    <group position={[0, 3.4, -24]}>
      <Sph p={[0, -1.5, 0]} s={[7, 3.2, 4]} c="#5a4a3a" />
      <Monastery x={0} z={0} y={0} />
    </group>
    <SmokeColumn x={-2} z={-18} local={local} s={0.7} phase={1} dark />
    <FlagPole x={-4.0} z={-4} local={local} phase={0} />
    <FlagPole x={4.6} z={-5} local={local} phase={2} />
    <CrateStack3D x={-2.6} z={-3} n={2} />
    <CrateStack3D x={2.8} z={-3.5} n={3} s={0.9} />
    <AmmoTruck x={3.8} z={-9} s={0.85} color="#5d5a3a" />
    <Cypress x={-5.4} z={-8} local={local} s={1.1} phase={0} />
    <Cypress x={5.6} z={-9} local={local} s={1.0} phase={2} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene7World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.2} local={local} phase={0} />
    <Cloud x={7} y={12} z={-38} s={1} local={local} phase={2} />
    <Hills colors={["#5a6a52", "#4a5a44", "#3a4a38"]} />
    <Ground cfg={cfg} />
    {/* kandang: dinding batu + pagar + pohon + papan nama */}
    <Enclosure />
    <ZooTree x={-5.2} z={-5} local={local} s={1.1} phase={0} />
    <ZooTree x={5.4} z={-6} local={local} s={0.95} phase={2} />
    <Sph p={[-2.4, 0.3, -3]} s={[0.7, 0.45, 0.6]} c="#8a8a7a" />
    <Sph p={[2.6, 0.25, -4]} s={[0.6, 0.4, 0.5]} c="#8a8a7a" />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene8World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1} local={local} phase={1} />
    <Hills colors={["#5a7a52", "#4a6a44", "#3a5a38"]} />
    <Ground cfg={cfg} />
    <Enclosure />
    <ZooTree x={-5.2} z={-5} local={local} s={1.1} phase={0} />
    <ZooTree x={5.4} z={-6} local={local} s={0.95} phase={2} />
    {/* bangku di luar pagar untuk veteran */}
    <Bench x={-3.4} z={2.5} />
    <Bench x={3.6} z={2.8} />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene9World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Stars local={local} />
    <Hills colors={["#3a3a44", "#2c2c38", "#24242e"]} />
    <Ground cfg={cfg} />
    <Enclosure />
    <ZooTree x={-5.2} z={-5} local={local} s={1.1} phase={0} />
    <ZooTree x={5.4} z={-6} local={local} s={0.95} phase={2} />
    <Foreground local={local} tone="dark" />
  </group>
);

const WORLDS: React.FC<{ local: number; cfg: Cfg }>[] = [
  Scene1World, Scene2World, Scene3World, Scene4World, Scene5World,
  Scene6World, Scene7World, Scene8World, Scene9World,
];

/* Inner: kamera + cahaya per adegan, glide pelan.                     */
/* Warmup delayRender ala v14 supaya still tidak blank.                */
/* ------------------------------------------------------------------ */

const Inner: React.FC<{ scene: number; local: number }> = ({ scene, local }) => {
  const { camera, advance } = useThree();
  const cfg = CFGS[scene];
  const World = WORLDS[scene];
  const [warmHandle] = useState(() => delayRender("wojtek3d warmup"));
  useEffect(() => {
    const id = setTimeout(() => {
      advance(performance.now());
      continueRender(warmHandle);
    }, 0);
    return () => clearTimeout(id);
  }, [advance, warmHandle]);

  const cam = camera as THREE.PerspectiveCamera;
  const easeInOutSine = (v: number) => -(Math.cos(Math.PI * v) - 1) / 2;
  const t = easeInOutSine(Math.min(local / 200, 1));
  // Drift lateral DIHAPUS (gx = 0 — pelajaran Peshtigo): kamera 3D yang
  // bergeser kiri-kanan membuat latar bergerak melawan karakter 2D.
  const gx = 0;
  const gy = -t * 0.25;
  const gz = -t * 0.9;
  cam.position.set(cfg.camPos[0] + gx, cfg.camPos[1] + gy, cfg.camPos[2] + gz);
  cam.lookAt(cfg.camLook[0], cfg.camLook[1], cfg.camLook[2]);
  cam.fov = cfg.fov;
  cam.updateProjectionMatrix();

  return (
    <group>
      <ambientLight intensity={cfg.amb} color="#fff4e0" />
      <hemisphereLight args={["#cfe4ff", "#8a6a4a", 0.5]} />
      <directionalLight position={cfg.dirPos} color={cfg.dirColor} intensity={cfg.dirInt} />
      <World local={local} cfg={cfg} />
    </group>
  );
};

/** Dunia 3D untuk satu adegan. Dipakai Video16 di bawah overlay karakter. */
export const World3D: React.FC<{ scene: number; local: number }> = ({ scene, local }) => (
  <AbsoluteFill>
    <ThreeCanvas
      width={1080}
      height={1920}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 46, near: 0.2, far: 400, position: [0, 3.4, 16] }}
    >
      <Inner scene={scene} local={local} />
    </ThreeCanvas>
  </AbsoluteFill>
);
