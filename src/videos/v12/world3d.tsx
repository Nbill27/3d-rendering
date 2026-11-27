// world3d.tsx — DUNIA 3D Dancing Plague (Strasbourg 1518) untuk Video12.
// Pola dari test-toba-v2/world3d.tsx: ThreeCanvas Remotion + three.js, kamera
// meluncur pelan per adegan, lapisan depan/tengah/belakang, pencahayaan hangat.
// Semua prop dibangun dari kode (box/cone/cylinder/sphere + tekstur canvas
// prosedural kayu/batu/rumput). TIDAK ADA prop GLB Kenney (folder
// public/bridge/ tidak ada). Karakter 2D bean-head tetap overlay DOM di depan
// canvas ini (lihat Video12.tsx); titik pijakan karakter ada di z = 0.
//
// Koordinat dunia: tanah y = 0, karakter berdiri di z = 0, kamera di z ~13.
// Semua animasi adalah fungsi deterministik dari `local` (frame sejak adegan
// mulai) supaya still Remotion stabil.
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

// mulberry32: acak deterministik (tekstur stabil antar render)
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const woodTex = () =>
  canvasTex("wood", 256, 256, (g) => {
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
  canvasTex("stone", 256, 256, (g) => {
    g.fillStyle = "#b7ab98";
    g.fillRect(0, 0, 256, 256);
    const r = rng(21);
    for (let i = 0; i < 900; i++) {
      const v = 150 + Math.floor(r() * 90);
      g.fillStyle = `rgb(${v},${v - 8},${v - 22})`;
      g.fillRect(r() * 256, r() * 256, 2 + r() * 4, 2 + r() * 4);
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(90,78,60,0.16)" : "rgba(220,210,190,0.14)";
      g.beginPath();
      g.arc(r() * 256, r() * 256, 10 + r() * 22, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(70,60,45,0.5)";
    g.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      let x = r() * 256;
      let y = r() * 256;
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += r() * 50 - 25;
        y += r() * 50 - 25;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });

const cobbleTex = () =>
  canvasTex("cobble", 256, 256, (g) => {
    g.fillStyle = "#8a7d68";
    g.fillRect(0, 0, 256, 256);
    const r = rng(31);
    // baris batu bulat: tiap batu elips abu-abu dengan celah gelap
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const x = col * 32 + (row % 2 ? 16 : 0);
        const y = row * 32;
        const v = 130 + Math.floor(r() * 60);
        g.fillStyle = `rgb(${v},${v - 6},${v - 18})`;
        g.beginPath();
        g.ellipse(x + 16, y + 16, 14, 12, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "rgba(50,42,30,0.6)";
        g.lineWidth = 2;
        g.stroke();
      }
    }
  });

const grassTex = () =>
  canvasTex("grass", 256, 256, (g) => {
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
  sunSink?: number;
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
  // S1 jalan Strasbourg, siang hangat
  { skyTop: "#4a86cf", skyHor: "#b8d0ec", fog: "#b8d0ec", groundTex: cobbleTex, groundColor: "#ffffff", sunPos: [8, 13, -55], sunR: 3.2, sunColor: "#ffcf6e", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 32, fogFar: 100 },
  // S2 senja ke malam, lentera menyala
  { skyTop: "#3a3a6e", skyHor: "#c97a5a", fog: "#8a6a7a", groundTex: cobbleTex, groundColor: "#c9b8a8", sunPos: [-10, 5, -55], sunR: 2.8, sunColor: "#ff9d45", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#ffb36b", dirPos: [-6, 10, 6], dirInt: 1.0, amb: 0.4, fogNear: 28, fogFar: 95 },
  // S3 pagi, puluhan ikut menari
  { skyTop: "#4a86cf", skyHor: "#ffd9a0", fog: "#d8c49a", groundTex: cobbleTex, groundColor: "#ffffff", sunPos: [10, 12, -55], sunR: 3.0, sunColor: "#ffcf6e", camPos: [0, 3.4, 16.5], camLook: [0, 1.2, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 30, fogFar: 100 },
  // S4 kelabu, ratusan + roboh
  { skyTop: "#6a7076", skyHor: "#a8b0b5", fog: "#9aa2a8", groundTex: cobbleTex, groundColor: "#b8b0a0", sunPos: [13, 14, -55], sunR: 2.2, sunColor: "#e8dcc0", camPos: [0, 3.4, 16], camLook: [0, 1.4, -3], fov: 46, dirColor: "#d8d8d8", dirPos: [-6, 12, 6], dirInt: 0.9, amb: 0.6, fogNear: 24, fogFar: 90 },
  // S5 jalan menanjak ke kapel St. Vitus
  { skyTop: "#4a86cf", skyHor: "#b8d0ec", fog: "#b8d0ec", groundTex: grassTex, groundColor: "#ffffff", sunPos: [8, 13, -55], sunR: 3.0, sunColor: "#ffcf6e", camPos: [0, 3.6, 15], camLook: [0, 2.2, -8], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 30, fogFar: 100 },
  // S6 September cerah, tarian berhenti
  { skyTop: "#3e7fd2", skyHor: "#cfe4f5", fog: "#cfe4f5", groundTex: grassTex, groundColor: "#ffffff", sunPos: [6, 15, -55], sunR: 3.0, sunColor: "#ffcf6e", camPos: [0, 3.6, 15], camLook: [0, 2.0, -8], fov: 46, dirColor: "#ffe9bb", dirPos: [6, 15, 6], dirInt: 1.5, amb: 0.6, fogNear: 32, fogFar: 100 },
  // S7 malam misteri, bulan + kabut
  { skyTop: "#14142e", skyHor: "#3a3a6e", fog: "#2a2a4a", groundTex: cobbleTex, groundColor: "#8a8aa8", sunPos: [-8, 14, -55], sunR: 2.4, sunColor: "#e8ecff", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#b8c0e8", dirPos: [-6, 12, 6], dirInt: 0.6, amb: 0.35, fogNear: 22, fogFar: 85 },
  // S8 senja penutup, kota di belakang
  { skyTop: "#7a4a7a", skyHor: "#ff9d45", fog: "#e88a5a", groundTex: cobbleTex, groundColor: "#d8b088", sunPos: [0, 3.2, -55], sunR: 4.2, sunColor: "#ff9d45", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#ffb36b", dirPos: [0, 6, 8], dirInt: 1.3, amb: 0.45, fogNear: 30, fogFar: 100, sunSink: 0.008 },
];

/* ------------------------------------------------------------------ */
/* Potongan bersama: langit, awan, bukit, tanah, pohon, latar depan.   */
/* ------------------------------------------------------------------ */

const drift = (local: number, amp: number, speed: number, phase = 0) => Math.sin(local * speed + phase) * amp;
const pulse = (local: number, speed: number, min: number, max: number, phase = 0) => min + (max - min) * (0.5 + 0.5 * Math.sin(local * speed + phase));

const Sky: React.FC<{ cfg: Cfg; local: number }> = ({ cfg, local }) => {
  const sunPos: [number, number, number] = [cfg.sunPos[0], cfg.sunPos[1] - (cfg.sunSink ?? 0) * local, cfg.sunPos[2]];
  return (
    <group>
      <color attach="background" args={[cfg.skyTop]} />
      <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
      <mesh position={[0, 16, -58]} material={new THREE.MeshBasicMaterial({ map: skyTex(cfg.skyTop, cfg.skyHor), fog: false })}>
        <planeGeometry args={[220, 120]} />
      </mesh>
      <Disc p={sunPos} s={cfg.sunR} c={cfg.sunColor} />
      <Disc p={sunPos} s={cfg.sunR * 1.5} c={cfg.sunColor} op={0.2} />
      <Disc p={sunPos} s={cfg.sunR * 2.2} c={cfg.sunColor} op={0.12} />
    </group>
  );
};

const cloudMat = () => {
  let m = lamCache.get("cloud");
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.45 });
    lamCache.set("cloud", m);
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

const Hills = ({ colors, z1 = -30 }: { colors: [string, string, string]; z1?: number }) => (
  <group>
    <Sph p={[-13, -1.5, z1]} s={[13, 4.2, 5]} c={colors[0]} />
    <Sph p={[11, -1.8, z1 - 3]} s={[14, 4.8, 5]} c={colors[1]} />
    <Sph p={[0, -2.2, z1 - 7]} s={[16, 5.2, 5]} c={colors[2]} />
    <Sph p={[-8, 0.9, z1 + 1]} s={[0.7, 0.7, 0.7]} c="#2e7a44" />
    <Sph p={[7, 1.0, z1 - 1]} s={[0.75, 0.75, 0.75]} c="#2e7a44" />
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

const Tree = ({ x, z, local, s = 1, phase = 0, y = 0 }: { x: number; z: number; local: number; s?: number; phase?: number; y?: number }) => (
  <group position={[x, y, z]} rotation={[0, 0, Math.sin(local * 0.05 + phase) * 0.02]} scale={[s, s, s]}>
    <mesh position={[0.3, 0.03, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.9, 24]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.16} />
    </mesh>
    <Cyl p={[0, 1.6, 0]} s={[0.28, 0.42, 3.2, 0]} c="#5d4023" map={woodTex()} />
    <Sph p={[0, 3.9, 0]} s={[1.9, 1.5, 1.6]} c="#2e7a44" />
    <Sph p={[1.2, 3.2, 0.4]} s={[1.3, 1.0, 1.1]} c="#3f8a52" />
    <Sph p={[-1.2, 3.3, -0.3]} s={[1.2, 1.0, 1.1]} c="#3f8a52" />
    <Sph p={[-0.8, 3.5, 0.6]} s={[0.85, 0.7, 0.8]} c="#57a86a" />
  </group>
);

const Foreground = ({ local }: { local: number }) => (
  <group>
    <Sph p={[-1.7, 0.25, 9.2]} s={[0.6, 0.35, 0.5]} c="#9a9a9a" />
    <Sph p={[-1.0, 0.18, 9.5]} s={[0.4, 0.25, 0.35]} c="#7a7a7a" />
    <Sph p={[1.7, 0.3, 9.0]} s={[0.65, 0.38, 0.5]} c="#9a9a9a" />
    <Sph p={[1.0, 0.2, 9.5]} s={[0.42, 0.26, 0.35]} c="#7a7a7a" />
    <mesh position={[-1.7, 0.02, 9.4]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.7, 20]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.14} />
    </mesh>
    <mesh position={[1.7, 0.02, 9.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.75, 20]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.14} />
    </mesh>
    {[-1.4, 1.3, -0.4].map((x, i) => (
      <group key={i} position={[x, 0, 9.6]} rotation={[0, 0, Math.sin(local * 0.07 + i) * 0.05]}>
        <Cone p={[0, 0.35, 0]} s={[0.28, 0.7, 0]} c="#3e7d4e" seg={6} />
        <Cone p={[0.3, 0.3, 0.1]} s={[0.22, 0.55, 0]} c="#4e9d5e" seg={6} />
        <Cone p={[-0.3, 0.3, -0.1]} s={[0.22, 0.55, 0]} c="#4e9d5e" seg={6} />
      </group>
    ))}
    {[-1.15, 1.05].map((x, i) => (
      <group key={i} position={[x, 0, 9.0]}>
        <Cyl p={[0, 0.3, 0]} s={[0.05, 0.05, 0.6, 0]} c="#3e7d4e" />
        <Sph p={[0, 0.62, 0]} s={[0.12, 0.12, 0.12]} c={i === 0 ? "#ff8a8a" : "#ffe14d"} />
      </group>
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Rumah timber-frame Strasbourg, sumur, gerobak, tong, lentera, kapel.*/
/* ------------------------------------------------------------------ */

const warmWinMat = () => {
  let m = lamCache.get("warmWin");
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: "#ffd97a", emissive: "#ffbf5a", emissiveIntensity: 0.7 });
    lamCache.set("warmWin", m);
  }
  return m;
};

const TimberHouse = ({ x, z, s = 1, plaster = "#e8dcc0", roof = "#8a3b2e", rotY = 0, lit = false }: { x: number; z: number; s?: number; plaster?: string; roof?: string; rotY?: number; lit?: boolean }) => (
  <group position={[x, 0, z]} rotation={[0, rotY, 0]} scale={[s, s, s]}>
    {/* dinding plester + rangka kayu gelap di depan */}
    <B p={[0, 1.5, 0]} s={[3.4, 3.0, 2.4]} c={plaster} />
    <B p={[0, 1.5, 1.22]} s={[3.4, 0.18, 0.06]} c="#4a3423" />
    <B p={[0, 2.6, 1.22]} s={[3.4, 0.18, 0.06]} c="#4a3423" />
    {[-1.2, 0, 1.2].map((wx, i) => (
      <B key={i} p={[wx, 1.5, 1.22]} s={[0.18, 3.0, 0.06]} c="#4a3423" />
    ))}
    <B p={[-0.6, 1.5, 1.22]} s={[0.14, 3.0, 0.06]} c="#4a3423" r={[0, 0, 0.5]} />
    <B p={[0.6, 1.5, 1.22]} s={[0.14, 3.0, 0.06]} c="#4a3423" r={[0, 0, -0.5]} />
    {/* atap pelana: piramida 4 sisi */}
    <Cone p={[0, 3.9, 0]} s={[2.9, 1.6, 0]} c={roof} seg={4} r={[0, Math.PI / 4, 0]} />
    <B p={[0, 3.15, 0]} s={[3.6, 0.18, 2.6]} c="#5d4023" />
    {/* cerobong + asap tipis */}
    <B p={[1.1, 4.4, -0.4]} s={[0.4, 1.0, 0.4]} c="#8a7d68" map={stoneTex()} />
    {/* pintu + jendela */}
    <B p={[0, 0.85, 1.22]} s={[0.9, 1.7, 0.1]} c="#5d4023" map={woodTex()} />
    <mesh position={[-1.15, 1.9, 1.26]} material={lit ? warmWinMat() : lam("#2c2c3a")}>
      <boxGeometry args={[0.7, 0.8, 0.06]} />
    </mesh>
    <mesh position={[1.15, 1.9, 1.26]} material={lit ? warmWinMat() : lam("#2c2c3a")}>
      <boxGeometry args={[0.7, 0.8, 0.06]} />
    </mesh>
    <B p={[-1.15, 1.9, 1.28]} s={[0.78, 0.08, 0.04]} c="#4a3423" />
    <B p={[1.15, 1.9, 1.28]} s={[0.78, 0.08, 0.04]} c="#4a3423" />
    {/* anak tangga batu di depan pintu */}
    <B p={[0, 0.12, 1.6]} s={[1.2, 0.24, 0.6]} c="#b7ab98" map={stoneTex()} />
  </group>
);

const Well = ({ x, z, local }: { x: number; z: number; local: number }) => (
  <group position={[x, 0, z]}>
    <Cyl p={[0, 0.6, 0]} s={[0.9, 1.0, 1.2, 0]} c="#b7ab98" map={stoneTex()} seg={10} />
    <Cyl p={[-0.7, 1.6, 0]} s={[0.08, 0.08, 2.0, 0]} c="#5d4023" />
    <Cyl p={[0.7, 1.6, 0]} s={[0.08, 0.08, 2.0, 0]} c="#5d4023" />
    <Cone p={[0, 3.0, 0]} s={[1.2, 0.9, 0]} c="#8a3b2e" seg={4} r={[0, Math.PI / 4, 0]} />
    {/* ember tergantung, bergoyang pelan */}
    <group rotation={[0, 0, Math.sin(local * 0.08) * 0.06]}>
      <Cyl p={[0, 1.9, 0]} s={[0.02, 0.02, 0.7, 0]} c="#3a2c22" />
      <Cyl p={[0, 1.45, 0]} s={[0.22, 0.18, 0.35, 0]} c="#7a5a34" map={woodTex()} />
    </group>
  </group>
);

const Cart = ({ x, z, rotY = 0 }: { x: number; z: number; rotY?: number }) => (
  <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
    <B p={[0, 0.7, 0]} s={[2.2, 0.18, 1.2]} c="#7a5a34" map={woodTex()} />
    <B p={[-1.05, 1.0, 0.55]} s={[0.14, 0.7, 0.1]} c="#5d4023" />
    <B p={[1.05, 1.0, 0.55]} s={[0.14, 0.7, 0.1]} c="#5d4023" />
    <B p={[0, 1.0, 0.55]} s={[2.2, 0.14, 0.1]} c="#5d4023" />
    <B p={[-1.05, 1.0, -0.55]} s={[0.14, 0.7, 0.1]} c="#5d4023" />
    <B p={[1.05, 1.0, -0.55]} s={[0.14, 0.7, 0.1]} c="#5d4023" />
    <B p={[0, 1.0, -0.55]} s={[2.2, 0.14, 0.1]} c="#5d4023" />
    {/* karung jerami di bak */}
    <Sph p={[-0.4, 1.0, 0]} s={[0.7, 0.45, 0.5]} c="#d8c49a" />
    <Sph p={[0.5, 1.0, 0]} s={[0.6, 0.4, 0.45]} c="#c9b18a" />
    {/* roda */}
    <Cyl p={[-0.8, 0.45, 0.65]} s={[0.45, 0.45, 0.12, 0]} c="#4a3423" r={[Math.PI / 2, 0, 0]} seg={10} />
    <Cyl p={[-0.8, 0.45, -0.65]} s={[0.45, 0.45, 0.12, 0]} c="#4a3423" r={[Math.PI / 2, 0, 0]} seg={10} />
    <Cyl p={[0.8, 0.45, 0.65]} s={[0.45, 0.45, 0.12, 0]} c="#4a3423" r={[Math.PI / 2, 0, 0]} seg={10} />
    <Cyl p={[0.8, 0.45, -0.65]} s={[0.45, 0.45, 0.12, 0]} c="#4a3423" r={[Math.PI / 2, 0, 0]} seg={10} />
    {/* tangkai penarik */}
    <B p={[1.6, 0.5, 0]} s={[1.0, 0.1, 0.1]} c="#5d4023" r={[0, 0, -0.2]} />
  </group>
);

const Barrel = ({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z]}>
    <Cyl p={[0, 0.55, 0]} s={[0.42, 0.48, 1.1, 0]} c="#7a5a34" map={woodTex()} seg={10} />
    <Cyl p={[0, 0.85, 0]} s={[0.5, 0.5, 0.08, 0]} c="#3a2c22" seg={10} />
    <Cyl p={[0, 0.25, 0]} s={[0.5, 0.5, 0.08, 0]} c="#3a2c22" seg={10} />
  </group>
);

const LanternPost = ({ x, z, local, lit }: { x: number; z: number; local: number; lit: boolean }) => (
  <group position={[x, 0, z]}>
    <Cyl p={[0, 1.1, 0]} s={[0.09, 0.11, 2.2, 0]} c="#3a2c22" />
    <B p={[0, 2.35, 0]} s={[0.4, 0.55, 0.4]} c={lit ? "#ffb36b" : "#3a2c22"} />
    <B p={[0, 2.65, 0]} s={[0.5, 0.1, 0.5]} c="#3a2c22" />
    {lit && (
      <>
        <mesh position={[0, 2.35, 0]} material={basic("#ffcf9e", pulse(local, 0.12, 0.5, 0.9))}>
          <sphereGeometry args={[0.42, 12, 10]} />
        </mesh>
        <pointLight position={[0, 2.4, 0.8]} color="#ffb36b" intensity={8} distance={8} decay={1.8} />
      </>
    )}
  </group>
);

const Chapel = ({ x, z, y = 0, s = 1, local }: { x: number; z: number; y?: number; s?: number; local: number }) => (
  <group position={[x, y, z]} scale={[s, s, s]}>
    {/* badan kapel batu */}
    <B p={[0, 1.6, 0]} s={[4.0, 3.2, 3.0]} c="#c9bda6" map={stoneTex()} />
    {/* atap pelana */}
    <Cone p={[0, 3.9, 0]} s={[3.1, 1.5, 0]} c="#5d4030" seg={4} r={[0, Math.PI / 4, 0]} />
    {/* menara + salib */}
    <B p={[-1.4, 4.2, 0]} s={[1.0, 2.4, 1.0]} c="#b7ab98" map={stoneTex()} />
    <Cone p={[-1.4, 5.9, 0]} s={[0.9, 1.0, 0]} c="#5d4030" seg={4} r={[0, Math.PI / 4, 0]} />
    <B p={[-1.4, 6.8, 0]} s={[0.12, 0.9, 0.12]} c="#c9a227" />
    <B p={[-1.4, 6.7, 0]} s={[0.6, 0.12, 0.12]} c="#c9a227" />
    {/* pintu lengkung + jendela */}
    <B p={[0, 0.9, 1.52]} s={[1.1, 1.8, 0.1]} c="#4a3423" map={woodTex()} />
    <mesh position={[0, 1.85, 1.54]} material={basic("#2c2c3a")}>
      <circleGeometry args={[0.55, 20, 0, Math.PI]} />
    </mesh>
    <mesh position={[1.3, 2.2, 1.52]} material={warmWinMat()}>
      <boxGeometry args={[0.5, 0.9, 0.06]} />
    </mesh>
    <mesh position={[-1.3, 2.2, 1.52]} material={warmWinMat()}>
      <boxGeometry args={[0.5, 0.9, 0.06]} />
    </mesh>
    {/* lilin votive berderet di depan pintu, nyala kecil */}
    {[-0.9, -0.45, 0, 0.45, 0.9].map((cx, i) => (
      <group key={i} position={[cx, 0, 2.1]}>
        <Cyl p={[0, 0.18, 0]} s={[0.09, 0.11, 0.36, 0]} c="#f5ecd7" seg={8} />
        <mesh position={[0, 0.44 + Math.sin(local * 0.2 + i) * 0.02, 0]} material={basic("#ffd84a", pulse(local, 0.2, 0.6, 1, i))}>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>
      </group>
    ))}
    {/* anak tangga */}
    <B p={[0, 0.12, 2.0]} s={[2.2, 0.24, 0.8]} c="#b7ab98" map={stoneTex()} />
  </group>
);

const WheatSheaf = ({ x, z, local }: { x: number; z: number; local: number }) => (
  <group position={[x, 0, z]} rotation={[0, 0, Math.sin(local * 0.05) * 0.02]}>
    <Cyl p={[0, 0.7, 0]} s={[0.28, 0.36, 1.4, 0]} c="#c9a227" seg={8} />
    {[-0.5, -0.25, 0, 0.25, 0.5].map((ox, i) => (
      <Cone key={i} p={[ox, 1.7, 0]} s={[0.22, 1.0, 0]} c={i % 2 ? "#d8b13a" : "#c9a227"} seg={6} />
    ))}
    <B p={[0, 0.9, 0.4]} s={[0.7, 0.12, 0.06]} c="#8a6a3b" />
  </group>
);

/* ------------------------------------------------------------------ */
/* Jalanan Strasbourg (S1-S4, S7, S8) + jalan ke kapel (S5, S6).       */
/* ------------------------------------------------------------------ */

const StreetWorld: React.FC<{ local: number; cfg: Cfg; night: boolean; grey: boolean; litWindows: boolean }> = ({ local, cfg, night, grey, litWindows }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    {!night && <Cloud x={-9} y={11} z={-34} s={1} local={local} phase={0} />}
    {!night && <Cloud x={8} y={13} z={-38} s={0.9} local={local} phase={2} />}
    {night && (
      <>
        {[[-9, 15], [-3, 18], [4, 16], [9, 13], [0, 20]].map(([sx, sy], i) => (
          <Disc key={i} p={[sx, sy, -55]} s={0.14} c="#ffffff" op={pulse(local, 0.1, 0.5, 1, i)} />
        ))}
      </>
    )}
    <Hills colors={night ? ["#1e1e3a", "#232348", "#191930"] : grey ? ["#6a7076", "#757b81", "#5d6369"] : ["#4a7a52", "#3f8a52", "#2e7a44"]} z1={-30} />
    <Ground cfg={cfg} />
    {/* jalan batu tengah, lebih terang dari trotoar gelap */}
    <mesh position={[0, 0.04, -6]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#c9bda6", cobbleTex())}>
      <planeGeometry args={[5.5, 46]} />
    </mesh>
    {/* deret rumah kiri + kanan */}
    <TimberHouse x={-6.2} z={-6} s={1.05} plaster="#e8dcc0" roof="#8a3b2e" lit={litWindows} />
    <TimberHouse x={-6.5} z={-13} s={0.95} plaster="#d8c9a0" roof="#5d4030" lit={litWindows} />
    <TimberHouse x={-6.0} z={1} s={1.0} plaster="#e8dcc0" roof="#7a3b2e" lit={litWindows} />
    <TimberHouse x={6.2} z={-6} s={1.05} plaster="#d8c9a0" roof="#8a3b2e" lit={litWindows} />
    <TimberHouse x={6.5} z={-13} s={0.95} plaster="#e8dcc0" roof="#5d4030" lit={litWindows} />
    <TimberHouse x={6.0} z={1} s={1.0} plaster="#d8c9a0" roof="#7a3b2e" lit={litWindows} />
    {/* sumur kota di kiri jalan */}
    <Well x={-4.6} z={-2.5} local={local} />
    {/* gerobak + tong di kanan jalan */}
    <Cart x={4.8} z={-1.5} rotY={0.3} />
    <Barrel x={5.2} z={-4.2} />
    <Barrel x={5.6} z={-3.4} />
    <Barrel x={-5.4} z={-8.5} />
    {/* lentera jalan */}
    <LanternPost x={-3.4} z={3.5} local={local} lit={night || grey} />
    <LanternPost x={3.4} z={-9} local={local} lit={night || grey} />
    {/* pohon di ujung jalan */}
    <Tree x={-5.2} z={-17} local={local} s={1.1} />
    <Tree x={5.4} z={-18} local={local} s={1.0} phase={1.4} />
    <Foreground local={local} />
  </group>
);

const RoadWorld: React.FC<{ local: number; cfg: Cfg; night?: boolean }> = ({ local, cfg, night }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-9} y={11} z={-34} s={1} local={local} phase={0} />
    <Cloud x={8} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Hills colors={["#4a7a52", "#3f8a52", "#2e7a44"]} z1={-32} />
    <Ground cfg={cfg} />
    {/* bukit kapel di ujung jalan */}
    <Sph p={[0, -0.5, -24]} s={[11, 3.2, 4]} c="#4a7a52" />
    <Sph p={[-7, -0.8, -26]} s={[8, 2.6, 4]} c="#3f8a52" />
    <Sph p={[7, -0.8, -26]} s={[8, 2.6, 4]} c="#3f8a52" />
    {/* jalan tanah menanjak ke kapel */}
    <mesh position={[0, 0.06, -10]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#b89a6a", stoneTex())}>
      <planeGeometry args={[4.5, 34]} />
    </mesh>
    {/* kapel St. Vitus di atas bukit */}
    <Chapel x={3.4} z={-22} y={2.2} s={1.0} local={local} />
    {/* pohon + gandum di tepi jalan */}
    <Tree x={-5.5} z={-8} local={local} s={1.1} />
    <Tree x={5.8} z={-12} local={local} s={1.0} phase={1.4} />
    <Tree x={-6.0} z={-16} local={local} s={0.9} phase={0.7} />
    <WheatSheaf x={4.2} z={-6} local={local} />
    <WheatSheaf x={-4.4} z={-10} local={local} />
    {/* batu penanda jalan (wayside cross) */}
    <B p={[3.6, 0.9, -3]} s={[0.18, 1.8, 0.18]} c="#8a8a8a" map={stoneTex()} />
    <B p={[3.6, 1.3, -3]} s={[0.9, 0.18, 0.18]} c="#8a8a8a" map={stoneTex()} />
    <Foreground local={local} />
  </group>
);

const Scene1World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => <StreetWorld local={local} cfg={cfg} night={false} grey={false} litWindows={false} />;
const Scene2World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => <StreetWorld local={local} cfg={cfg} night litWindows grey={false} />;
const Scene3World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => <StreetWorld local={local} cfg={cfg} night={false} grey={false} litWindows />;
const Scene4World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => <StreetWorld local={local} cfg={cfg} night={false} grey litWindows={false} />;
const Scene5World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => <RoadWorld local={local} cfg={cfg} />;
const Scene6World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => <RoadWorld local={local} cfg={cfg} />;
const Scene7World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <StreetWorld local={local} cfg={cfg} night grey={false} litWindows />
    {/* kabut tipis + berkas gandum (teori ergot) di depan */}
    <mesh position={[0, 0.5, 4]} rotation={[-Math.PI / 2, 0, 0]} material={basic("#c9c9e8", 0.10)}>
      <planeGeometry args={[30, 10]} />
    </mesh>
    <WheatSheaf x={-3.2} z={5.5} local={local} />
    <WheatSheaf x={3.4} z={5.8} local={local} />
  </group>
);
const Scene8World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => <StreetWorld local={local} cfg={cfg} night={false} grey={false} litWindows />;

const WORLDS: React.FC<{ local: number; cfg: Cfg }>[] = [
  Scene1World, Scene2World, Scene3World, Scene4World,
  Scene5World, Scene6World, Scene7World, Scene8World,
];

/* ------------------------------------------------------------------ */
/* Inner: kamera + cahaya per adegan, glide pelan.                     */
/* Warmup delayRender ala v01 supaya still tidak blank.                */
/* ------------------------------------------------------------------ */

const Inner: React.FC<{ scene: number; local: number }> = ({ scene, local }) => {
  const { camera, advance } = useThree();
  const cfg = CFGS[scene];
  const World = WORLDS[scene];
  const [warmHandle] = useState(() => delayRender("dancing3d warmup"));
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
  const gx = Math.sin(local * 0.01) * 0.12;
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

/** Dunia 3D untuk satu adegan. Dipakai Video12 di bawah overlay karakter. */
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
