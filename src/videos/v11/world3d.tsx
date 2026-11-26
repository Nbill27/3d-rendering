// world3d.tsx — DUNIA 3D Danau Toba untuk TobaTestV2.
// Pola dari cartoon_3d_short / v01: ThreeCanvas Remotion + three.js, kamera
// meluncur pelan per adegan, lapisan depan/tengah/belakang, pencahayaan hangat.
// Semua prop dibangun dari kode (box/cone/cylinder/sphere + tekstur canvas
// prosedural kayu/batu/rumput/pasir). TIDAK ADA prop GLB Kenney (folder
// public/bridge/ tidak ada). Karakter 2D stikman tetap overlay DOM di depan
// canvas ini (lihat TobaTestV2.tsx); titik pijakan karakter ada di z = 0.
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
/* Tekstur canvas prosedural (kayu, batu, rumput, pasir, langit).      */
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
    for (let i = 0; i < 12; i++) {
      g.fillStyle = "rgba(60,35,15,0.5)";
      g.beginPath();
      g.arc(r() * 256, r() * 256, 2 + r() * 3, 0, Math.PI * 2);
      g.fill();
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
    // bercak gelap/terang lembut: batu tidak satu warna datar
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

const grassTex = () =>
  canvasTex("grass", 256, 256, (g) => {
    g.fillStyle = "#55a266";
    g.fillRect(0, 0, 256, 256);
    const r = rng(33);
    // bercak lembut warna rumput lain (variasi, bukan satu blok datar)
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
    for (let i = 0; i < 60; i++) {
      g.fillStyle = "#2e7a44";
      g.beginPath();
      g.arc(r() * 256, r() * 256, 3 + r() * 6, 0, Math.PI * 2);
      g.fill();
    }
  });

const sandTex = () =>
  canvasTex("sand", 256, 256, (g) => {
    g.fillStyle = "#e8d5a0";
    g.fillRect(0, 0, 256, 256);
    const r = rng(55);
    for (let i = 0; i < 1100; i++) {
      const v = 200 + Math.floor(r() * 55);
      g.fillStyle = `rgb(${v},${v - 25},${v - 90})`;
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
  });

const scorchedTex = () =>
  canvasTex("scorched", 256, 256, (g) => {
    g.fillStyle = "#4a3423";
    g.fillRect(0, 0, 256, 256);
    const r = rng(77);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() > 0.5 ? "#3a2a1c" : "#5d4630";
      g.fillRect(r() * 256, r() * 256, 3 + r() * 5, 3 + r() * 5);
    }
    g.strokeStyle = "rgba(20,10,5,0.6)";
    g.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      let x = r() * 256;
      let y = r() * 256;
      g.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += r() * 60 - 30;
        y += r() * 60 - 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });

const skyTex = (top: string, hor: string) =>
  canvasTex(`sky-${top}-${hor}`, 16, 256, (g) => {
    // Canvas di-upload terbalik (flipY): baris bawah canvas tampil di ATAS
    // bidang, jadi warna atas langit digambar di bawah canvas.
    // Gradien 3-stop (bukan 2): ada pita tengah lembut supaya langit tidak
    // terlihat seperti dua blok warna datar.
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, hor);
    gr.addColorStop(0.35, hor);
    gr.addColorStop(0.62, mix2(hor, top));
    gr.addColorStop(1, top);
    g.fillStyle = gr;
    g.fillRect(0, 0, 16, 256);
  });

/** campur dua warna hex 50/50 (untuk pita tengah langit). */
const mix2 = (a: string, b: string): string => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round((((A >> s) & 255) + ((B >> s) & 255)) / 2).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

/* ------------------------------------------------------------------ */
/* Material helpers (Lambert = look kartun datar, murah; Basic =      */
/* emissive/tanpa cahaya untuk matahari, lava, bara, kilau).           */
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

/* ------------------------------------------------------------------ */
/* Potongan bangun kecil (JSX ringkas).                                */
/* ------------------------------------------------------------------ */

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
/* Konfigurasi per adegan: langit, kabut, tanah, air, matahari,       */
/* kamera (posisi + tatapan; glide kecil ditambah di Inner), cahaya.   */
/* ------------------------------------------------------------------ */

type Cfg = {
  skyTop: string;
  skyHor: string;
  fog: string;
  groundTex: () => THREE.Texture;
  groundColor: string;
  water?: string;
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
  // S1 danau luas, siang terang
  { skyTop: "#4a86cf", skyHor: "#b8d0ec", fog: "#b8d0ec", groundTex: grassTex, groundColor: "#ffffff", water: "#2f80c6", sunPos: [8, 13, -55], sunR: 3.2, sunColor: "#ffcf6e", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 32, fogFar: 100 },
  // S2 letusan, langit merah-oranye, cahaya hangat dari lava
  { skyTop: "#d84a2a", skyHor: "#ff8a3d", fog: "#e0703a", groundTex: scorchedTex, groundColor: "#ffffff", sunPos: [-14, 12, -55], sunR: 2.6, sunColor: "#ffb36b", camPos: [0, 3.4, 16.5], camLook: [0, 2.2, -4], fov: 46, dirColor: "#ffb36b", dirPos: [0, 10, 8], dirInt: 1.4, amb: 0.45, fogNear: 26, fogFar: 95 },
  // S3 sebaran abu, langit kelabu
  { skyTop: "#7a8288", skyHor: "#a8b0b5", fog: "#9aa2a8", groundTex: stoneTex, groundColor: "#8a7d68", water: undefined, sunPos: [13, 14, -55], sunR: 2.2, sunColor: "#e8dcc0", camPos: [0, 3.4, 16], camLook: [0, 1.4, -3], fov: 46, dirColor: "#d8d8d8", dirPos: [-6, 12, 6], dirInt: 1.0, amb: 0.6, fogNear: 24, fogFar: 90 },
  // S4 runtuh / kaldera, langit berdebu
  { skyTop: "#b09a76", skyHor: "#d8c49a", fog: "#c9b18a", groundTex: scorchedTex, groundColor: "#c9b18a", sunPos: [14, 13, -55], sunR: 2.4, sunColor: "#e8c98a", camPos: [0, 3.4, 16.5], camLook: [0, 1.8, -4], fov: 46, dirColor: "#ffe0ae", dirPos: [8, 12, 6], dirInt: 1.3, amb: 0.5, fogNear: 26, fogFar: 95 },
  // S5 kaldera terisi air, siang cerah kembali
  { skyTop: "#4a86cf", skyHor: "#b8d0ec", fog: "#b8d0ec", groundTex: grassTex, groundColor: "#ffffff", water: "#2f80c6", sunPos: [8, 13, -55], sunR: 3.0, sunColor: "#ffcf6e", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 32, fogFar: 100 },
  // S6 Pulau Samosir
  { skyTop: "#4a86cf", skyHor: "#b8d0ec", fog: "#b8d0ec", groundTex: sandTex, groundColor: "#ffffff", water: "#2f80c6", sunPos: [-14, 13, -55], sunR: 3.0, sunColor: "#ffcf6e", camPos: [0, 3.4, 16], camLook: [0, 1.2, -3], fov: 46, dirColor: "#ffe9bb", dirPos: [-8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 32, fogFar: 100 },
  // S7 desa Batak
  { skyTop: "#4a86cf", skyHor: "#b8d0ec", fog: "#b8d0ec", groundTex: grassTex, groundColor: "#ffffff", sunPos: [8, 13, -55], sunR: 2.8, sunColor: "#ffcf6e", camPos: [0, 3.4, 16], camLook: [0, 1.6, -3], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 32, fogFar: 100 },
  // S8 sunset
  { skyTop: "#7a4a7a", skyHor: "#ff9d45", fog: "#e88a5a", groundTex: sandTex, groundColor: "#d8b088", water: "#5a4a8a", sunPos: [0, 3.2, -55], sunR: 4.2, sunColor: "#ff9d45", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#ffb36b", dirPos: [0, 6, 8], dirInt: 1.3, amb: 0.45, fogNear: 30, fogFar: 100, sunSink: 0.008 },
];

/* ------------------------------------------------------------------ */
/* Potongan bersama: langit gradien, matahari, awan, bukit, tanah,     */
/* air + riak, perahu, pohon, latar depan.                             */
/* ------------------------------------------------------------------ */

const drift = (local: number, amp: number, speed: number, phase = 0) => Math.sin(local * speed + phase) * amp;
const pulse = (local: number, speed: number, min: number, max: number, phase = 0) => min + (max - min) * (0.5 + 0.5 * Math.sin(local * speed + phase));

const Sky: React.FC<{ cfg: Cfg; local: number }> = ({ cfg, local }) => {
  const sunPos: [number, number, number] = [cfg.sunPos[0], cfg.sunPos[1] - (cfg.sunSink ?? 0) * local, cfg.sunPos[2]];
  return (
    <group>
      <color attach="background" args={[cfg.skyTop]} />
      <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
      {/* bidang langit gradien jauh di belakang (tanpa kabut) */}
      <mesh position={[0, 16, -58]} material={new THREE.MeshBasicMaterial({ map: skyTex(cfg.skyTop, cfg.skyHor), fog: false })}>
        <planeGeometry args={[220, 120]} />
      </mesh>
      <Disc p={sunPos} s={cfg.sunR} c={cfg.sunColor} />
      <Disc p={sunPos} s={cfg.sunR * 1.5} c={cfg.sunColor} op={0.2} />
      {/* halo hangat lebar: matahari terasa lebih hangat, tidak sekadar cakram datar */}
      <Disc p={sunPos} s={cfg.sunR * 2.2} c={cfg.sunColor} op={0.12} />
    </group>
  );
};

const warmWinMat = () => {
  let m = lamCache.get("warmWin");
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: "#ffd97a", emissive: "#ffbf5a", emissiveIntensity: 0.7 });
    lamCache.set("warmWin", m);
  }
  return m;
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

const Hills = ({ local, colors, z1 = -30 }: { local: number; colors: [string, string, string]; z1?: number }) => (
  <group>
    <Sph p={[-13, -1.5, z1]} s={[13, 4.2, 5]} c={colors[0]} />
    <Sph p={[11, -1.8, z1 - 3]} s={[14, 4.8, 5]} c={colors[1]} />
    <Sph p={[0, -2.2, z1 - 7]} s={[16, 5.2, 5]} c={colors[2]} />
    {/* pepohonan di punggung bukit jauh */}
    <Sph p={[-8, 0.9, z1 + 1]} s={[1.1, 1.1, 1.1]} c="#2e7a44" />
    <Sph p={[-4, 1.2, z1]} s={[0.9, 0.9, 0.9]} c="#2e7a44" />
    <Sph p={[7, 1.0, z1 - 1]} s={[1.2, 1.2, 1.2]} c="#2e7a44" />
    <Sph p={[9.5, 0.8, z1 + 1]} s={[0.9, 0.9, 0.9]} c="#3f8a52" />
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

const Water = ({ cfg, local, z0 = -30, z1 = 9 }: { cfg: Cfg; local: number; z0?: number; z1?: number }) => {
  if (!cfg.water) return null;
  const ripples: [number, number, number][] = [
    [-4, -6, 1.4], [3, -12, 1.7], [-7, -16, 1.2], [6, -3, 1.1], [0, -20, 1.6], [-2, -9, 1.0],
  ];
  return (
    <group>
      <mesh position={[0, 0.07, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={lam(cfg.water)}>
        <planeGeometry args={[140, z1 - z0]} />
      </mesh>
      {ripples.map(([x, z, w], i) => (
        <mesh key={i} position={[x + drift(local, 0.5, 0.06, i * 1.7), 0.12, z]} scale={[w / 2, 0.05, 0.05]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={pulse(local, 0.15, 0.4, 0.9, i)} />
        </mesh>
      ))}
      {/* kilau air: 3 garis cahaya memanjang, variasi halus di permukaan */}
      {[[-5, -8, 2.6], [4, -14, 3.2], [-1, -19, 2.2]].map(([x, z, w], i) => (
        <mesh key={`st${i}`} position={[x + drift(local, 0.4, 0.05, i * 2.1), 0.1, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, 0.14]} />
          <meshBasicMaterial color="#bfe0f5" transparent opacity={pulse(local, 0.12, 0.15, 0.3, i)} />
        </mesh>
      ))}
    </group>
  );
};

const Boat = ({ x, z, local, scale = 1, lanternLit = false, rower = false, sailsDown = false }: { x: number; z: number; local: number; scale?: number; lanternLit?: boolean; rower?: boolean; sailsDown?: boolean }) => {
  const bob = Math.sin(local * 0.12) * 0.09;
  const roll = Math.sin(local * 0.12) * 0.03;
  const billow = Math.sin(local * 0.11) * 0.03; // layar mengembang/kendur mengikuti angin
  return (
    <group position={[x, 0.15 + bob, z]} rotation={[0, 0.15, roll]} scale={[scale, scale, scale]}>
      {/* riak haluan + buritan (elips di air) */}
      <mesh position={[-1.5, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.68, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={pulse(local, 0.15, 0.3, 0.6)} />
      </mesh>
      <mesh position={[1.5, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.55, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={pulse(local, 0.15, 0.3, 0.6, 2)} />
      </mesh>
      {/* lunas + lambung: 3 lajur papan kayu */}
      <B p={[0, 0.08, 0]} s={[2.6, 0.12, 0.7]} c="#4a2c1e" />
      <B p={[0, 0.22, 0]} s={[2.6, 0.16, 0.85]} c="#6b4423" map={woodTex()} />
      <B p={[0, 0.38, 0]} s={[2.6, 0.16, 0.9]} c="#7a4a2b" map={woodTex()} />
      <B p={[0, 0.52, 0]} s={[2.6, 0.14, 0.92]} c="#8a5a34" map={woodTex()} />
      {/* alur horizontal antar papan lambung (Hairline no.3 diputar 90 derajat) */}
      {[0.15, 0.3, 0.45].map((gy, i) => (
        <B key={i} p={[0, gy, 0.47]} s={[2.6, 0.035, 0.02]} c="#3a2c22" />
      ))}
      {/* bibir perahu (gunwale) */}
      <B p={[0, 0.62, 0.44]} s={[2.6, 0.08, 0.08]} c="#5d4023" />
      <B p={[0, 0.62, -0.44]} s={[2.6, 0.08, 0.08]} c="#5d4023" />
      {/* gading (rusuk) di atas bibir */}
      {[-0.8, 0, 0.8].map((gx, i) => (
        <B key={i} p={[gx, 0.72, 0]} s={[0.1, 0.22, 0.9]} c="#5d4023" />
      ))}
      {/* bangku dayung */}
      <B p={[-0.7, 0.66, 0]} s={[0.5, 0.08, 0.8]} c="#a8724a" map={woodTex()} />
      <B p={[0.7, 0.66, 0]} s={[0.5, 0.08, 0.8]} c="#a8724a" map={woodTex()} />
      {/* tiang layar (sorotan Fig 3 #22) duduk di bangku tengah */}
      <Cyl p={[0, 1.9, 0]} s={[0.07, 0.1, 2.7, 0]} c="#5d4023" />
      {/* satu alur vertikal di tiang (Hairline no.5) */}
      <B p={[0, 1.9, 0.1]} s={[0.035, 2.4, 0.02]} c="#3a2c22" />
      {/* layar utama + layar depan, mengembang/kendur (diturunkan saat senja) */}
      {!sailsDown && (
        <group rotation={[0, 0, billow]}>
          <B p={[0.62, 1.85, 0]} s={[1.15, 1.5, 0.06]} c="#fdf6e3" />
          <B p={[-0.62, 1.65, 0]} s={[0.95, 1.15, 0.06]} c="#f2e6c8" />
        </group>
      )}
      {/* tali halyard (puncak tiang -> haluan) + sheet (layar -> buritan) */}
      {!sailsDown && (
        <>
          <Cyl p={[0.65, 1.9, 0]} s={[0.02, 0.02, 2.9, 0]} c="#3a2c22" r={[0, 0, -0.47]} />
          <B p={[0.95, 1.0, 0]} s={[0.9, 0.05, 0.05]} c="#3a2c22" r={[0, 0, 0.35]} />
        </>
      )}
      {/* bendera di puncak tiang, berkibar penanda arah angin */}
      <group position={[0, 3.25, 0]} rotation={[0, Math.sin(local * 0.2) * 0.5, 0]}>
        <B p={[0.22, 0, 0]} s={[0.42, 0.22, 0.04]} c="#c0392b" />
      </group>
      {/* dayung bersandar di bibir perahu */}
      <Cyl p={[-1.0, 0.95, 0.42]} s={[0.04, 0.05, 1.1, 0]} c="#8a6a42" r={[0, 0, 0.5]} />
      <Cyl p={[1.05, 0.95, -0.42]} s={[0.04, 0.05, 1.1, 0]} c="#8a6a42" r={[0, 0, -0.5]} />
      {/* lentera di tiang: mati di siang hari, menyala di senja (S8) */}
      {lanternLit ? (
        <group>
          <B p={[0, 2.5, 0.35]} s={[0.3, 0.42, 0.3]} c="#ffb36b" />
          <B p={[0, 2.74, 0.35]} s={[0.38, 0.08, 0.38]} c="#3a2c22" />
          <mesh position={[0, 2.5, 0.35]} material={basic("#ffcf9e", pulse(local, 0.12, 0.5, 0.9))}>
            <sphereGeometry args={[0.42, 12, 10]} />
          </mesh>
          <pointLight position={[0, 2.5, 0.8]} color="#ffb36b" intensity={8} distance={8} decay={1.8} />
        </group>
      ) : (
        <B p={[0, 2.5, 0.35]} s={[0.26, 0.36, 0.26]} c="#3a2c22" />
      )}
      {/* pendayung duduk di bangku belakang (S8): pola bean-head yang sama,
          versi kecil — kepala bulat BESAR + topi rambut, badan bulat pendek */}
      {rower && (
        <group position={[-0.85, 0.7, 0]}>
          <B p={[0, 0.22, 0]} s={[0.5, 0.42, 0.4]} c="#e8e8e8" />
          <Sph p={[0, 0.62, 0]} s={[0.3, 0.3, 0.3]} c="#ffe2c2" />
          <Sph p={[0, 0.76, 0]} s={[0.3, 0.2, 0.3]} c="#241726" />
        </group>
      )}
    </group>
  );
};

const Tree = ({ x, z, local, s = 1, phase = 0, y = 0 }: { x: number; z: number; local: number; s?: number; phase?: number; y?: number }) => (
  <group position={[x, y, z]} rotation={[0, 0, Math.sin(local * 0.05 + phase) * 0.02]} scale={[s, s, s]}>
    {/* bayangan lembut di bawah pohon (tanpa shadow map, elips gelap) */}
    <mesh position={[0.3, 0.03, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.9, 24]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.16} />
    </mesh>
    <Cyl p={[0, 1.6, 0]} s={[0.28, 0.42, 3.2, 0]} c="#5d4023" map={woodTex()} />
    <Sph p={[0, 3.9, 0]} s={[1.9, 1.5, 1.6]} c="#2e7a44" />
    <Sph p={[1.2, 3.2, 0.4]} s={[1.3, 1.0, 1.1]} c="#3f8a52" />
    <Sph p={[-1.2, 3.3, -0.3]} s={[1.2, 1.0, 1.1]} c="#3f8a52" />
    {/* gumpalan keempat tak simetris: kanopi bukan bola sempurna */}
    <Sph p={[-0.8, 3.5, 0.6]} s={[0.85, 0.7, 0.8]} c="#57a86a" />
  </group>
);

/** Latar depan dekat kamera: batu, rumpun rumput, bunga — memberi kedalaman.
 *  pineDrop: turunkan rumpun pinus (khusus S2 — sneakers menapak di atas
 *  ujung pinus kalau tidak diturunkan). Default 0 = tidak berubah. */
const Foreground = ({ local, tone = "green", pineDrop = 0 }: { local: number; tone?: "green" | "dark" | "sand"; pineDrop?: number }) => (
  <group>
    <Sph p={[-1.7, 0.25, 8]} s={[0.9, 0.5, 0.7]} c={tone === "dark" ? "#3a2c22" : "#9a9a9a"} />
    <Sph p={[-1.0, 0.18, 8.4]} s={[0.55, 0.32, 0.45]} c={tone === "dark" ? "#2c2118" : "#7a7a7a"} />
    <Sph p={[1.7, 0.3, 7.8]} s={[1.0, 0.55, 0.7]} c={tone === "dark" ? "#3a2c22" : "#9a9a9a"} />
    <Sph p={[1.0, 0.2, 8.4]} s={[0.6, 0.35, 0.5]} c={tone === "dark" ? "#2c2118" : "#7a7a7a"} />
    {/* bayangan lembut di bawah batu latar depan */}
    <mesh position={[-1.7, 0.02, 8.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.0, 20]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.14} />
    </mesh>
    <mesh position={[1.7, 0.02, 8.0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.1, 20]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.14} />
    </mesh>
    {[-1.4, 1.3, -0.4].map((x, i) => (
      <group key={i} position={[x, -pineDrop, 8.6]} rotation={[0, 0, Math.sin(local * 0.07 + i) * 0.05]}>
        <Cone p={[0, 0.35, 0]} s={[0.28, 0.7, 0]} c={tone === "dark" ? "#4a5d3a" : "#3e7d4e"} seg={6} />
        <Cone p={[0.3, 0.3, 0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e9d5e"} seg={6} />
        <Cone p={[-0.3, 0.3, -0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e9d5e"} seg={6} />
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
/* Rumah adat Batak 3D: tiang, dinding papan kayu, tangga, atap        */
/* pelana bertanduk, jendela + pintu. Dibangun dari box/cylinder.      */
/* ------------------------------------------------------------------ */

const BatakHouse = ({ x, z, local, s = 1, roof = "#3a2c22", wall = "#c9a06a", rotY = 0 }: { x: number; z: number; local: number; s?: number; roof?: string; wall?: string; rotY?: number }) => (
  <group position={[x, 0, z]} rotation={[0, rotY, 0]} scale={[s, s, s]}>
    {/* tiang panggung, tiap tiang depan satu alur vertikal (urat kayu) */}
    <Cyl p={[-1.5, 0.8, 0.7]} s={[0.16, 0.18, 1.6, 0]} c="#5d4023" />
    <Cyl p={[1.5, 0.8, 0.7]} s={[0.16, 0.18, 1.6, 0]} c="#5d4023" />
    <Cyl p={[-1.5, 0.8, -0.7]} s={[0.16, 0.18, 1.6, 0]} c="#5d4023" />
    <Cyl p={[1.5, 0.8, -0.7]} s={[0.16, 0.18, 1.6, 0]} c="#5d4023" />
    <B p={[-1.5, 0.8, 0.88]} s={[0.05, 1.3, 0.03]} c="#4a3423" />
    <B p={[1.5, 0.8, 0.88]} s={[0.05, 1.3, 0.03]} c="#4a3423" />
    {/* tangga + pegangan miring di kedua sisi */}
    <B p={[0, 0.25, 1.35]} s={[1.0, 0.22, 0.5]} c="#7a5a34" map={woodTex()} />
    <B p={[0, 0.65, 1.2]} s={[0.9, 0.22, 0.45]} c="#7a5a34" map={woodTex()} />
    <B p={[0, 1.05, 1.05]} s={[0.8, 0.22, 0.4]} c="#7a5a34" map={woodTex()} />
    <B p={[-0.55, 0.85, 1.3]} s={[0.08, 0.08, 1.3]} c="#5d4023" r={[0.85, 0, 0]} />
    <B p={[0.55, 0.85, 1.3]} s={[0.08, 0.08, 1.3]} c="#5d4023" r={[0.85, 0, 0]} />
    {/* balok lantai melintang + lantai papan di atas tiang */}
    <B p={[0, 1.55, 0]} s={[3.8, 0.22, 1.9]} c="#5d4023" />
    <B p={[0, 1.72, 0]} s={[3.6, 0.14, 1.7]} c="#a8724a" map={woodTex()} />
    {/* dinding papan kayu + lajur papan dinding */}
    <B p={[0, 2.6, 0]} s={[3.6, 1.9, 1.7]} c={wall} map={woodTex()} />
    <B p={[0, 2.6, 0.88]} s={[3.6, 0.18, 0.06]} c="#5d4023" />
    {/* sela papan dinding: 5 alur vertikal, tidak sampai tepi atas/bawah */}
    {[-1.2, -0.6, 0, 0.6, 1.2].map((px, i) => (
      <B key={i} p={[px, 2.6, 0.91]} s={[0.07, 1.5, 0.04]} c="#8a6a42" />
    ))}
    {/* pintu + kusen + gorga merah di atas pintu */}
    <B p={[0, 2.45, 0.9]} s={[0.7, 1.2, 0.08]} c="#3a2c22" />
    {/* satu crease vertikal di pintu */}
    <B p={[0, 2.45, 0.95]} s={[0.04, 1.0, 0.02]} c="#2c2118" />
    <B p={[0, 3.1, 0.92]} s={[0.86, 0.1, 0.06]} c="#5d4023" />
    <B p={[0, 3.32, 0.92]} s={[0.95, 0.26, 0.08]} c="#b03a2e" />
    {[-0.28, 0, 0.28].map((gx, i) => (
      <B key={i} p={[gx, 3.32, 0.97]} s={[0.12, 0.14, 0.04]} c="#ffd97a" />
    ))}
    {/* jendela menyala hangat (desa berpenghuni) + jeruji */}
    <mesh position={[-1.15, 2.8, 0.9]} material={warmWinMat()}>
      <boxGeometry args={[0.65, 0.65, 0.08]} />
    </mesh>
    <mesh position={[1.15, 2.8, 0.9]} material={warmWinMat()}>
      <boxGeometry args={[0.65, 0.65, 0.08]} />
    </mesh>
    <B p={[-1.15, 2.8, 0.95]} s={[0.06, 0.65, 0.04]} c="#3a2c22" />
    <B p={[-1.15, 2.8, 0.95]} s={[0.65, 0.06, 0.04]} c="#3a2c22" />
    <B p={[1.15, 2.8, 0.95]} s={[0.06, 0.65, 0.04]} c="#3a2c22" />
    <B p={[1.15, 2.8, 0.95]} s={[0.65, 0.06, 0.04]} c="#3a2c22" />
    {/* atap pelana: dua lereng + bubungan, ujung menanduk ke atas */}
    <B p={[-0.95, 4.15, 0]} s={[2.3, 0.22, 2.3]} c={roof} r={[0, 0, 0.5]} map={woodTex()} />
    <B p={[0.95, 4.15, 0]} s={[2.3, 0.22, 2.3]} c={roof} r={[0, 0, -0.5]} map={woodTex()} />
    {/* lapisan ijuk di bawah tiap lereng */}
    <B p={[-0.95, 4.0, 0]} s={[2.35, 0.1, 2.35]} c="#2c2118" r={[0, 0, 0.5]} map={woodTex()} />
    <B p={[0.95, 4.0, 0]} s={[2.35, 0.1, 2.35]} c="#2c2118" r={[0, 0, -0.5]} map={woodTex()} />
    <B p={[0, 4.75, 0]} s={[4.4, 0.18, 2.4]} c="#ffd97a" />
    {/* tanduk di keempat ujung atap; tanduk KIRI (sorotan Fig 2 #30) lebih
        tinggi dengan ujung emas */}
    <Cone p={[-2.1, 5.05, 1.05]} s={[0.22, 1.15, 0]} c={roof} r={[0, 0, 0.5]} seg={6} />
    <Cone p={[-2.1, 5.05, -1.05]} s={[0.22, 1.15, 0]} c={roof} r={[0, 0, 0.5]} seg={6} />
    <Cone p={[-2.38, 5.62, 1.05]} s={[0.1, 0.35, 0]} c="#ffd97a" r={[0, 0, 0.5]} seg={6} />
    <Cone p={[-2.38, 5.62, -1.05]} s={[0.1, 0.35, 0]} c="#ffd97a" r={[0, 0, 0.5]} seg={6} />
    <Cone p={[2.1, 4.9, 1.05]} s={[0.22, 0.9, 0]} c={roof} r={[0, 0, -0.5]} seg={6} />
    <Cone p={[2.1, 4.9, -1.05]} s={[0.22, 0.9, 0]} c={roof} r={[0, 0, -0.5]} seg={6} />
    {/* satu alur mengikuti lengkung tiap tanduk */}
    <Cyl p={[-2.28, 5.1, 1.22]} s={[0.03, 0.03, 0.95, 0]} c="#2c2118" r={[0, 0, 0.5]} />
    <Cyl p={[-2.28, 5.1, -0.88]} s={[0.03, 0.03, 0.95, 0]} c="#2c2118" r={[0, 0, 0.5]} />
    <Cyl p={[2.28, 4.95, 1.22]} s={[0.03, 0.03, 0.8, 0]} c="#2c2118" r={[0, 0, -0.5]} />
    <Cyl p={[2.28, 4.95, -0.88]} s={[0.03, 0.03, 0.8, 0]} c="#2c2118" r={[0, 0, -0.5]} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Gunung berapi Fig 1: kerucut 5 strata + bibir kawah. Dipakai S2    */
/* (letusan) dan S4 (runtuh) supaya penonton melihat gunung yang sama. */
/* ------------------------------------------------------------------ */

const STRATA = ["#4a2c1e", "#5d3a28", "#6b4a34", "#7a5a40", "#8a6a4a"];
const VOLC_Z = -18;
const VOLC_TOP = 9;
const VOLC_BASE_R = 7;

const VolcanoCone = () => {
  const bands = 5;
  const bandH = VOLC_TOP / bands;
  const topR = 1.6;
  const rAt = (y: number) => VOLC_BASE_R - (VOLC_BASE_R - topR) * (y / VOLC_TOP);
  return (
    <group>
      {STRATA.map((c, i) => {
        const y0 = i * bandH;
        const y1 = (i + 1) * bandH;
        return <Cyl key={i} p={[0, (y0 + y1) / 2, VOLC_Z]} s={[rAt(y1), rAt(y0), bandH, 0]} c={c} seg={24} />;
      })}
      {/* bibir kawah: cincin di puncak */}
      <mesh position={[0, VOLC_TOP, VOLC_Z]} rotation={[Math.PI / 2, 0, 0]} material={lam("#3a2c22")}>
        <torusGeometry args={[1.75, 0.35, 10, 24]} />
      </mesh>
    </group>
  );
};

/** Burung: dua garis tipis membentuk V, drift pelan. s = skala masuk (1 = penuh). */
const Bird = ({ x, y, z, local, phase, s = 1 }: { x: number; y: number; z: number; local: number; phase: number; s?: number }) => (
  <group position={[x + drift(local, 1.2, 0.02, phase), y, z]} scale={[s, s, s]}>
    <B p={[-0.28, 0, 0]} s={[0.55, 0.07, 0.07]} c="#3d5a80" r={[0, 0, 0.5]} />
    <B p={[0.28, 0, 0]} s={[0.55, 0.07, 0.07]} c="#3d5a80" r={[0, 0, -0.5]} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Adegan 3D — satu fungsi per adegan, semua dari `local`.             */
/* ------------------------------------------------------------------ */

const Scene1World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-9} y={11} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={6} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Cloud x={1} y={9} z={-30} s={0.8} local={local} phase={4} />
    <Hills local={local} colors={["#57a86a", "#3f8a52", "#2e7a44"]} />
    <Ground cfg={cfg} />
    <Water cfg={cfg} local={local} z0={-30} z1={2.5} />
    {/* pantai pasir di depan danau */}
    <mesh position={[0, 0.05, 6.0]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#e8d5a0", sandTex())}>
      <planeGeometry args={[60, 4]} />
    </mesh>
    <Boat x={3.0} z={-6} local={local} />
    <Boat x={-4.2} z={-12} local={local} scale={0.7} />
    <Tree x={4.6} z={-5} local={local} s={1.25} />
    <Tree x={-4.5} z={-6} local={local} s={0.85} phase={1.5} />
    <Foreground local={local} />
  </group>
);


const Scene2World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  const embers: [number, number][] = [[-1.5, 2], [0.5, 5], [1.8, 1], [-0.5, 8], [2.6, 4]];
  const ash: [number, number][] = [[-8, 3], [-4, 6], [5, 2], [8, 7], [-10, 8], [10, 4]];
  const ashCloud: [number, number, number, number, number, string, number][] = [
    [-4.5, 12.8, -24, 4.2, 1.9, "#5d5d5d", 0],
    [4.5, 12.2, -24, 3.7, 1.7, "#4a4a4a", 2],
    [0.5, 14.8, -26, 3.5, 1.7, "#7a7a7a", 4],
    [-8.5, 11.8, -22, 2.6, 1.3, "#6e6e6e", 1],
  ];
  // Aliran lava menempel di lereng: dimiringkan -0,58 rad mengikuti
  // kemiringan kerucut. Alur tengah = garis terang, dua samping redup.
  const flows: { x: number; y: number; z: number; len: number; w: number; bright: boolean; phase: number }[] = [
    { x: 0, y: 4.9, z: -14.2, len: 8.8, w: 0.5, bright: true, phase: 0 },
    { x: -1.7, y: 5.6, z: -14.6, len: 6.5, w: 0.35, bright: false, phase: 1.5 },
    { x: 1.8, y: 5.2, z: -14.4, len: 7, w: 0.35, bright: false, phase: 3 },
  ];
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      {/* kolom abu: 4 gumpalan berlapis, mengembang berlawanan fase + drift angin */}
      {ashCloud.map(([cx, cy, cz, rx, ry, c, ph], i) => (
        <Sph key={i} p={[cx + drift(local, 0.5, 0.02, ph), cy, cz]} s={[rx * (1 + 0.04 * Math.sin(local * 0.04 + ph)), ry * (1 + 0.04 * Math.sin(local * 0.04 + ph)), 3]} c={c} />
      ))}
      <Ground cfg={cfg} />
      <VolcanoCone />
      {/* danau lava (sorotan Fig 1 #16) di dalam mangkuk kawah */}
      <mesh position={[0, 9.05, VOLC_Z]} rotation={[-Math.PI / 2, 0, 0]} material={basic("#ff6b1a", pulse(local, 0.2, 0.7, 1))}>
        <circleGeometry args={[1.5, 24]} />
      </mesh>
      <Disc p={[0, 9.1, VOLC_Z]} s={0.7} c="#ffd97a" op={pulse(local, 0.25, 0.7, 1, 1)} />
      {/* aliran lava menuruni lereng, makin jauh makin gelap (mendingin) */}
      {flows.map((f, i) => (
        <group key={i} position={[f.x, f.y, f.z]} rotation={[-0.58, 0, 0]}>
          <B p={[0, f.len * 0.28, 0]} s={[f.w, f.len * 0.55, 0.3]} c={f.bright ? "#ff6b1a" : "#e05a1a"} op={f.bright ? pulse(local, 0.25, 0.75, 1, f.phase) : 0.85} />
          <B p={[0, -f.len * 0.28, 0]} s={[f.w * 0.8, f.len * 0.45, 0.3]} c={f.bright ? "#c24a12" : "#a03a10"} op={0.9} />
        </group>
      ))}
      {/* kolam lava di kaki gunung: menempel ke dasar kerucut (z=-11) */}
      <Sph p={[0, 0.15, -11]} s={[1.6, 0.22, 0.9]} c="#ff6b1a" op={pulse(local, 0.18, 0.75, 1)} />
      <Sph p={[-2.0, 0.2, -10.2]} s={[0.7, 0.4, 0.55]} c="#2c2c2c" />
      <Sph p={[2.1, 0.2, -10.4]} s={[0.8, 0.45, 0.6]} c="#2c2c2c" />
      {/* fumarol: asap tipis dari bahu kiri */}
      {[0, 1, 2].map((i) => (
        <Sph key={i} p={[-3.6 + drift(local, 0.2, 0.08, i), 6.2 + ((local * 0.05 + i * 0.9) % 2.5), -15.2]} s={[0.28, 0.28, 0.28]} c="#9a9a9a" op={0.5} />
      ))}
      {/* mata air panas di kaki kiri: kolam kecil beruap */}
      <mesh position={[-4.8, 0.1, -8]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#7ec8e8")}>
        <circleGeometry args={[0.9, 20]} />
      </mesh>
      {[0, 1].map((i) => (
        <Sph key={i} p={[-4.8 + drift(local, 0.15, 0.08, i), 0.6 + ((local * 0.04 + i * 0.7) % 1.4), -8]} s={[0.2, 0.2, 0.2]} c="#e8e8e8" op={0.4} />
      ))}
      {/* bara beterbangan dari kawah */}
      {embers.map(([x, off], i) => (
        <Sph key={i} p={[x + drift(local, 0.4, 0.1, i), 10.5 + ((off + local * 0.09) % 4), -17]} s={[0.14, 0.14, 0.14]} c="#ffd97a" op={pulse(local, 0.3, 0.5, 1, i)} />
      ))}
      {/* abu jatuh */}
      {ash.map(([x, off], i) => {
        const ax = x + drift(local, 0.5, 0.08, i);
        const ay = 9 - ((off + local * 0.06) % 8);
        const az = -10 + (i % 3) * 2;
        return <Sph key={i} p={[ax, ay, az]} s={[0.13, 0.13, 0.13]} c="#d8d8d8" op={0.8} />;
      })}
      {/* retakan menyala di tanah + batu + tunggul hangus */}
      <B p={[-3, 0.12, 4]} s={[2.4, 0.06, 0.14]} c="#ff6b1a" r={[0, 0.2, 0]} op={pulse(local, 0.22, 0.6, 1)} />
      <B p={[4, 0.12, 5]} s={[2.0, 0.06, 0.14]} c="#ff8a3d" r={[0, -0.15, 0]} op={pulse(local, 0.22, 0.6, 1, 1)} />
      <Sph p={[-7, 0.3, 6]} s={[0.8, 0.5, 0.6]} c="#2c2c2c" />
      <Sph p={[7.5, 0.35, 5.5]} s={[0.9, 0.55, 0.7]} c="#2c2c2c" />
      <Cyl p={[-7.5, 0.9, 2]} s={[0.16, 0.2, 1.8, 0]} c="#1e140e" r={[0, 0, 0.1]} />
      <Cyl p={[7.8, 0.8, 3]} s={[0.16, 0.2, 1.6, 0]} c="#1e140e" r={[0, 0, -0.12]} />
      {/* pinus foreground diturunkan 0,5: sneakers S2 menapak di tanah,
          bukan di atas ujung pinus (hanya S2, adegan lain tidak berubah) */}
      <Foreground local={local} tone="dark" pineDrop={0.5} />
      {/* cahaya lava: point light hangat di kawah */}
      <pointLight position={[0, 10, -16]} color="#ff7a2a" intensity={90} distance={40} decay={1.6} />
    </group>
  );
};


const Scene3World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
  const ash: [number, number][] = [[-8, 2], [-4, 5], [0, 3], [4, 6], [8, 2], [-6, 8], [6, 8], [2, 1]];
  // Kolom abu (sorotan): 5 gumpalan besar + 3 gumpalan kecil di tepi bawah.
  const ashCloud: [number, number, number, number, number, string, number][] = [
    [-9, 12, -26, 6.4, 2.4, "#555555", 0],
    [4, 13, -28, 7.2, 2.6, "#666666", 2],
    [0, 10.5, -22, 5.6, 2.1, "#6e6e6e", 4],
    [-5, 9, -19, 3.6, 1.4, "#7a7a7a", 1],
    [8, 9.3, -19, 3.2, 1.3, "#7a7a7a", 3],
    [-10, 8.2, -18, 1.8, 0.8, "#5d5d5d", 5],
    [1.5, 8.0, -18, 2.1, 0.9, "#6e6e6e", 2.5],
    [9.5, 8.3, -18, 1.6, 0.7, "#5d5d5d", 4.5],
  ];
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      {/* massa abu drift ke kanan (angin), tiap gumpalan mengembang berlawanan fase.
          Drift total ease-in-out sine selama 120 frame (bukan linear). */}
      <group position={[1.2 * easeInOutSine(Math.min(local / 120, 1)), 0, 0]}>
        {ashCloud.map(([cx, cy, cz, rx, ry, c, ph], i) => (
          <Sph key={i} p={[cx, cy, cz]} s={[rx * (1 + 0.03 * Math.sin(local * 0.05 + ph)), ry * (1 + 0.03 * Math.sin(local * 0.05 + ph)), 3]} c={c} />
        ))}
      </group>
      {/* garis angin menyapu searah drift abu */}
      {[0, 1, 2].map((i) => (
        <B key={i} p={[(((-6 + i * 7 + local * 0.12) % 26) - 13), 5.0 + i * 1.0, -10 - i * 2]} s={[3.2, 0.08, 0.08]} c="#e8e8e8" op={0.55 - i * 0.1} />
      ))}
      <Hills local={local} colors={["#6b6252", "#5d5648", "#4a4438"]} />
      {/* punggung batu berstrata di depan bukit (tempat pohon menancap) */}
      <B p={[0, 0.7, -16]} s={[18, 1.4, 2]} c="#6b6252" />
      <B p={[0, 1.6, -16]} s={[14, 0.8, 1.8]} c="#5d5648" />
      <Sph p={[-5, 2.2, -15.5]} s={[0.9, 0.6, 0.7]} c="#4a4438" />
      <Sph p={[4, 2.1, -15.5]} s={[0.8, 0.55, 0.6]} c="#4a4438" />
      <Ground cfg={cfg} />
      {/* pohon miring tertiup angin */}
      <group position={[-3.2, 0, -2]} rotation={[0, 0, 0.3 + Math.sin(local * 0.05) * 0.03]}>
        <Cyl p={[0, 1.5, 0]} s={[0.22, 0.32, 3, 0]} c="#4a3a28" />
        <Sph p={[0, 3.4, 0]} s={[1.5, 1.2, 1.2]} c="#4a5d3a" />
      </group>
      <group position={[3.2, 0, -3]} rotation={[0, 0, -0.32 - Math.sin(local * 0.05 + 1) * 0.03]}>
        <Cyl p={[0, 1.4, 0]} s={[0.2, 0.3, 2.8, 0]} c="#4a3a28" />
        <Sph p={[0, 3.1, 0]} s={[1.4, 1.1, 1.1]} c="#4a5d3a" />
      </group>
      {/* abu jatuh berlapis kedalaman */}
      {ash.map(([x, off], i) => (
        <Sph key={i} p={[x + drift(local, 0.5, 0.08, i), 8.5 - ((off + local * 0.07) % 8), -8 + (i % 4) * 2]} s={[0.13, 0.13, 0.13]} c="#e8e8e8" op={0.75} />
      ))}
      <Foreground local={local} tone="dark" />
    </group>
  );
};


const Scene4World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // Koreografi S4 (koreografi-s4-s5.md): sebab-akibat, sekali jalan.
  // local 0 = f664. "Gunungnya" f664-683 (local 0-19), "runtuh," f686-700
  // (22-36), "membentuk" f703-720 (39-56), "cekungan raksasa" f722-750
  // (58-86), hold f772-799 (108-135). 1 world ~ 73 px di z lereng.
  const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
  const cl01 = (v: number) => Math.max(0, Math.min(1, v));
  // Retakan membuka 1x -> 1,3x ("Gunungnya") lalu -> 1,8x ("runtuh,").
  // Ease-out per segmen (bukan linear); nilai di batas frasa tetap sama.
  const crackOpen = 1 + 0.3 * easeOut(cl01(local / 19)) + 0.5 * easeOut(cl01((local - 22) / 14));
  const crackW = 0.22 * crackOpen; // maks 0,396
  // Slab: DIAM sampai "runtuh," (local 22), lalu +12 px (22-36),
  // +28 px ("membentuk", 39-56), +40 px lalu BERHENTI ("cekungan", 58-86).
  // Tiap segmen di-ease-out (bukan linear); nilai di batas frasa tetap sama.
  const slidePx =
    local < 22 ? 0
    : local < 37 ? 12 * easeOut((local - 22) / 14)
    : local < 39 ? 12
    : local < 57 ? 12 + 16 * easeOut((local - 39) / 17)
    : local < 87 ? 28 + 12 * easeOut((local - 58) / 28)
    : 40;
  const slide = slidePx * 0.0137; // 40 px = 0,55 world
  // Debu: TIDAK ada sebelum slab mendarat; mengembang 0,5 -> 1,15 saat
  // "cekungan raksasa" (58-86), lalu menipis ke 0,85 saat hold (108-135).
  const dustT = cl01((local - 58) / 28);
  const dust = 0.5 + 0.65 * easeOut(dustT);
  const dustOp = dustT * (local > 108 ? 1 - 0.15 * ((local - 108) / 27) : 1);
  // Kaldera #45: TIDAK ada sebelum "cekungan raksasa" (local 58).
  const calScale = local < 58 ? 0.001 : 0.3 + 0.7 * easeOut(dustT);
  // Lava/retakan meredup setelah slab mendarat (mendingin, bukan padam).
  const cool = local > 86 ? 0.5 : 1;
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      <Cloud x={-8} y={12} z={-34} s={1} local={local} phase={1} />
      <Cloud x={7} y={11} z={-36} s={0.9} local={local} phase={3} />
      <Ground cfg={cfg} />
      <VolcanoCone />
      {/* retakan lereng (sorotan): celah gelap + tepi pijar, menempel di lereng */}
      <group position={[0.2, 4.6, -14.0]} rotation={[-0.58, 0, 0.03]}>
        <B p={[0, 0, 0]} s={[crackW, 9.5, 0.14]} c="#2c2118" />
        <B p={[-(crackW / 2 + 0.12), 0, 0.06]} s={[0.1, 9.0, 0.1]} c="#ff6b1a" op={pulse(local, 0.22, 0.6 * cool, 1 * cool)} />
        <B p={[crackW / 2 + 0.12, 0, 0.06]} s={[0.1, 8.5, 0.1]} c="#ff8a3d" op={pulse(local, 0.22, 0.6 * cool, 1 * cool, 1.5)} />
      </group>
      {/* arsir batu: 3 garis diagonal pendek di lereng (Hairline) */}
      <B p={[-3, 5, -15.2]} s={[0.7, 0.05, 0.05]} c="#4a2c1e" r={[-0.58, 0, 0.6]} />
      <B p={[-3.2, 3.5, -14.0]} s={[0.6, 0.05, 0.05]} c="#4a2c1e" r={[-0.58, 0, -0.5]} />
      <B p={[3, 4, -14.35]} s={[0.65, 0.05, 0.05]} c="#4a2c1e" r={[-0.58, 0, 0.5]} />
      {/* lempeng lereng kanan melorot sepanjang retakan: lebih kecil, yaw
          0,15 supaya muka tidak sejajar kamera, garis strata di muka */}
      <group position={[2.8, 4.2 - slide, -15.4 + slide * 0.5]} rotation={[-0.58, 0.15, -0.1 - slidePx * 0.0005]}>
        <B p={[0, 0, 0]} s={[2.8, 5.0, 1.4]} c="#5d3f2c" />
        <B p={[0, 2.1, 0.75]} s={[2.8, 0.9, 0.15]} c="#4a2c1e" />
        <B p={[0, -0.5, 0.75]} s={[2.2, 0.35, 0.1]} c="#6b4a34" r={[0, 0, 0.35]} />
      </group>
      {/* awan debu di kaki gunung, mengembang */}
      <Sph p={[-6.5, 0.9, -3]} s={[2.6 * dust, 1.1 * dust, 1.8]} c="#a08a6a" op={0.75 * dustOp} />
      <Sph p={[4.5, 1.2, -6]} s={[3.0 * dust, 1.3 * dust, 1.8]} c="#8a7a5e" op={0.75 * dustOp} />
      <Sph p={[-0.5, 1.7, -9]} s={[2.3 * dust, 1.0 * dust, 1.8]} c="#b09a76" op={0.7 * dustOp} />
      {/* batu jatuh #32-33: lepas dari slab saat "membentuk" (local 39),
          menggelinding turun menempel lereng, lalu BERHENTI di dasar */}
      {[0, 1].map((i) => {
        // Batu menggelinding melambat (ease-out) sampai berhenti di dasar.
        const rt = easeOut(cl01((local - 39 - i * 8) / 50));
        const ry = (i === 0 ? 6.0 : 5.0) - rt * 5.0;
        const rx = (i === 0 ? 2.6 : 3.8) + rt * (i === 0 ? 2.4 : 2.2);
        const rAt = 7 - 5.4 * (ry / 9); // jari-jari kerucut di ketinggian ry
        const rz = -18 + Math.sqrt(Math.max(rAt * rAt - rx * rx, 0)) + 0.4;
        return (
          <mesh key={i} position={[rx, ry, rz]} rotation={[0, 0, -rt * 5]} material={lam("#3a2c22")}>
            <dodecahedronGeometry args={[i === 0 ? 0.42 : 0.34, 0]} />
          </mesh>
        );
      })}
      {/* kaldera: cekungan gelap lebar, muncul setelah slab melorot */}
      <group position={[0, 0, -1]} scale={[calScale, 1, calScale]}>
        <Cyl p={[0, 0.25, 0]} s={[7.5, 7.5, 0.5, 0]} c="#4a3828" seg={28} />
        <Cyl p={[0, 0.4, 0]} s={[5.5, 5.5, 0.5, 0]} c="#2c2118" seg={28} />
      </group>
      {/* tanah retak di dasar: 2 garis tipis miring (Hairline) */}
      <B p={[-4, 0.12, 5]} s={[2.4, 0.06, 0.14]} c="#4a3828" r={[0, 0.15, 0]} />
      <B p={[4.5, 0.12, 6]} s={[2.0, 0.06, 0.14]} c="#4a3828" r={[0, -0.12, 0]} />
      <Foreground local={local} tone="dark" />
      <pointLight position={[0, 5, -13]} color="#ff7a2a" intensity={30 * cool} distance={25} decay={1.6} />
    </group>
  );
};


const Scene5World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // Koreografi S5 (koreografi-s4-s5.md): air naik LINEAR pelan mengikuti
  // frasa. local 0 = f809. "Cekungan itu" f810-831 (1-22), "terisi air,"
  // f833-855 (24-46), "dan jadilah" f857-878 (48-69), "danau vulkanik"
  // f880-905 (71-96), "terbesar" f908-924 (99-115), "di dunia." f926-942
  // (117-133). Air mulai sebagai cakram kecil di dasar kaldera, membesar
  // 4,2 -> 11 (tepi kaldera) selama local 22-133; bibir kaldera (cincin
  // batu r=11,6) tetap terlihat di atas air sampai akhir.
  const cl01 = (v: number) => Math.max(0, Math.min(1, v));
  const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
  // Air naik dengan ease-out (melambat saat mendekati tepi kaldera),
  // bukan linear; nilai awal/akhir tetap sama (cakram 4,2 -> 11).
  const riseT = easeOutQuad(cl01((local - 22) / 111));
  const lakeR = 4.2 + 6.8 * riseT; // cakram air membesar dari dasar ke tepi
  const waterY = 0.06 + riseT * 0.04; // permukaan naik sedikit di y
  // Air terjun tumbuh ke bawah dari bibir (scaleY) + fade, bukan fade saja.
  const fallT = cl01((local - 24) / 18);
  const fallGrow = easeOutQuad(fallT);
  // Burung masuk dengan scale 0 -> 1 selama 9 frame (300 ms), bukan pop-in.
  const birdS = 0.001 + 0.999 * easeOutQuad(cl01((local - 99) / 9));
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      <Cloud x={-9} y={11} z={-34} s={1} local={local} phase={0} />
      <Cloud x={6} y={12} z={-38} s={0.9} local={local} phase={2} />
      {/* burung kembali saat "terbesar" (local 99+) — penanda alam pulih */}
      {local >= 99 && (
        <>
          <Bird x={-3} y={11.5} z={-25} local={local} phase={0} s={birdS} />
          <Bird x={2} y={12.5} z={-27} local={local} phase={2} s={birdS} />
        </>
      )}
      {/* cincin bukit kawah mengelilingi danau */}
      <Sph p={[-11, -1, -24]} s={[10, 3.6, 4]} c="#4e9d5e" />
      <Sph p={[11, -1.2, -26]} s={[11, 4, 4]} c="#3f8a52" />
      <Sph p={[0, -2.4, -32]} s={[15, 4.6, 4]} c="#2e7a44" />
      {/* pohon di punggung rim kaldera */}
      <Tree x={-6.5} z={-20} local={local} s={0.7} />
      <Tree x={6.5} z={-21} local={local} s={0.65} phase={1} />
      <Ground cfg={cfg} />
      {/* dasar kaldera gelap (cekungan kosong sebelum terisi) */}
      <mesh position={[0, 0.02, -12]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#5d4a34")}>
        <circleGeometry args={[11.4, 32]} />
      </mesh>
      {/* air mengisi kaldera: cakram membesar dari dasar ke tepi */}
      <mesh position={[0, waterY, -12]} rotation={[-Math.PI / 2, 0, 0]} material={lam(cfg.water ?? "#2a7fd8")}>
        <circleGeometry args={[lakeR, 32]} />
      </mesh>
      {/* bibir kaldera: cincin 12 batu tak beraturan di sekeliling danau
          (bukan torus halus — torus terbaca seperti tembok). Batu tetap di
          atas permukaan air (puncak y ~0,8 > air 0,10). */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const a = (i / 12) * Math.PI * 2 + (i % 2) * 0.12;
        const rr = 11.6 + ((i * 37) % 5) * 0.12 - 0.24;
        const sx = 0.9 + ((i * 53) % 10) * 0.06;
        return (
          <Sph
            key={i}
            p={[Math.cos(a) * rr, 0.25 + ((i * 29) % 3) * 0.08, -12 + Math.sin(a) * rr]}
            s={[sx, 0.5 + ((i * 17) % 3) * 0.1, sx * 0.8]}
            c={i % 3 === 0 ? "#8a7a5e" : i % 3 === 1 ? "#a08a6a" : "#6b6252"}
          />
        );
      })}
      {/* riak tenang: 4 garis pendek membulat, muncul saat air naik dan
          hanya di dalam cakram air (jarak dari tengah danau < lakeR) */}
      {[[-4, -10, 1.4], [3, -14, 1.7], [-7, -18, 1.2], [5, -12, 1.0]].map(([x, z, w], i) => {
        const rr = Math.hypot(x, z + 12);
        const inLake = cl01((lakeR - rr) / 1.5);
        return (
          <mesh key={i} position={[x + drift(local, 0.5, 0.06, i * 1.7), waterY + 0.02, z]} scale={[w / 2, 0.05, 0.05]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={pulse(local, 0.15, 0.4, 0.85, i) * cl01((local - 24) / 30) * inLake} />
          </mesh>
        );
      })}
      {/* air terjun kecil di punggung kiri: SATU alur mengalir ke danau,
          tumbuh ke bawah dari bibir (scaleY) sambil fade-in, mulai saat
          "terisi air," (local 24), penuh saat "dan jadilah" */}
      <group position={[-6, 2.0, -20.8]} scale={[1, Math.max(0.02, fallGrow), 1]}>
        <B p={[0, -1.0, 0]} s={[0.5, 2.0, 0.12]} c="#dff2fb" r={[0, 0, 0.1]} op={pulse(local, 0.2, 0.7, 1) * fallT} />
      </group>
      <Sph p={[-5.8, 0.25, -19.8]} s={[0.7, 0.2, 0.5]} c="#ffffff" op={0.8 * fallT} />
      {/* pantai depan */}
      <mesh position={[0, 0.05, 6.0]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#e8d5a0", sandTex())}>
        <planeGeometry args={[60, 4]} />
      </mesh>
      <Tree x={4.6} z={-4} local={local} s={1.1} />
      <Tree x={-4.5} z={-5} local={local} s={0.9} phase={1} />
      <Foreground local={local} />
    </group>
  );
};


const Scene6World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={7} y={12} z={-34} s={1} local={local} phase={0} />
    <Cloud x={-7} y={13} z={-38} s={0.85} local={local} phase={2} />
    <Ground cfg={cfg} />
    <Water cfg={cfg} local={local} z0={-30} z1={2.5} />
    {/* Pulau Samosir: bukit hijau + pantai pasir (elips) di tengah danau */}
    <mesh position={[0, 0.3, -10]} scale={[1, 1, 0.6]} material={lam("#e8d5a0")}>
      <cylinderGeometry args={[8.2, 8.2, 0.6, 28]} />
    </mesh>
    <Sph p={[0, 0.4, -10]} s={[7.6, 2.2, 4.6]} c="#3f8a52" />
    <Sph p={[-1.5, 1.6, -11]} s={[4.2, 1.8, 2.8]} c="#4e9d5e" />
    <Sph p={[2, 1.9, -11.5]} s={[3.2, 1.5, 2.4]} c="#57a86a" />
    {/* riak keliling pulau mengikuti lengkung tepi */}
    {[8.0, 8.8].map((r, i) => (
      <mesh key={i} position={[0, 0.12, -10]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]}>
        <ringGeometry args={[r, r + 0.28, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={pulse(local, 0.15, 0.25, 0.5, i * 2)} />
      </mesh>
    ))}
    {/* pohon di pulau, duduk di permukaan bukit */}
    <Tree x={-4.5} z={-9} local={local} s={0.85} y={1.95} />
    <Tree x={5} z={-9.5} local={local} s={0.8} phase={1.2} y={1.9} />
    <Tree x={0.5} z={-12} local={local} s={0.7} phase={2} y={2.9} />
    {/* rumah kecil di pulau, duduk di permukaan bukit */}
    <group position={[3.2, 2.05, -8.2]} rotation={[0, -0.3, 0]}>
      <B p={[0, 0.4, 0]} s={[1.3, 0.8, 1]} c="#e8d5a0" />
      <Cone p={[0, 1.15, 0]} s={[1.1, 0.7, 0]} c="#c0392b" r={[0, Math.PI / 4, 0]} seg={4} />
    </group>
    <group position={[-3.4, 1.95, -8]} rotation={[0, 0.25, 0]}>
      <B p={[0, 0.35, 0]} s={[1.1, 0.7, 0.9]} c="#fdf6e3" />
      <Cone p={[0, 1.0, 0]} s={[0.95, 0.6, 0]} c="#8e3a3a" r={[0, Math.PI / 4, 0]} seg={4} />
    </group>
    <Boat x={3.0} z={-3} local={local} scale={0.85} />
    {/* pantai depan */}
    <mesh position={[0, 0.05, 6.0]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#e8d5a0", sandTex())}>
      <planeGeometry args={[60, 4]} />
    </mesh>
    <Foreground local={local} />
  </group>
);


const Scene7World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1} local={local} phase={0} />
    <Hills local={local} colors={["#5d7a52", "#4e6b44", "#3f5a3a"]} z1={-32} />
    <Ground cfg={cfg} />
    {/* desa: dua rumah adat + satu kecil di belakang */}
    <BatakHouse x={-3.2} z={-6} local={local} s={0.95} roof="#3a2c22" wall="#c9a06a" rotY={0.12} />
    <BatakHouse x={3.4} z={-7} local={local} s={0.85} roof="#4a3a2c" wall="#b98d5f" rotY={-0.1} />
    <BatakHouse x={0.3} z={-12} local={local} s={0.7} roof="#3a2c22" wall="#c9a06a" rotY={0} />
    {/* jalan tanah ke depan */}
    <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#c9a06a", sandTex())}>
      <planeGeometry args={[3.4, 14]} />
    </mesh>
    {/* batu bulat polos di jalan (Hairline: 2-3 batu, jangan penuhi) */}
    <Sph p={[-0.6, 0.12, 1]} s={[0.28, 0.16, 0.24]} c="#9a9a9a" />
    <Sph p={[0.7, 0.1, 3]} s={[0.24, 0.14, 0.2]} c="#8a8a8a" />
    <Sph p={[-0.3, 0.1, 4.5]} s={[0.2, 0.12, 0.18]} c="#9a9a9a" />
    {/* dinding batu desa: batu membulat + bintik, celah di jalan */}
    {[-2.8, -2.0, 2.0, 2.8].map((wx, i) => (
      <Sph key={i} p={[wx, 0.28, -3.5]} s={[0.55, 0.32, 0.4]} c="#b7ab98" map={stoneTex()} />
    ))}
    {[-2.4, 2.4].map((wx, i) => (
      <Sph key={i} p={[wx, 0.55, -3.5]} s={[0.45, 0.28, 0.35]} c="#a89a86" map={stoneTex()} />
    ))}
    {/* pagar bambu di depan rumah, berhenti di jalan (celah masuk) */}
    {[-3.0, -2.5, -2.0, 2.0, 2.5, 3.0].map((x, i) => (
      <B key={i} p={[x, 0.5, 2.5]} s={[0.14, 1.0, 0.14]} c="#7a5a34" />
    ))}
    <B p={[-2.5, 0.85, 2.5]} s={[1.2, 0.12, 0.1]} c="#7a5a34" />
    <B p={[2.5, 0.85, 2.5]} s={[1.2, 0.12, 0.1]} c="#7a5a34" />
    {/* semak bunga kiri */}
    <Sph p={[-3.3, 0.6, 2.2]} s={[1.0, 0.65, 0.75]} c="#3e7d4e" />
    <Sph p={[-3.3, 1.0, 2.2]} s={[0.18, 0.18, 0.18]} c="#ff8a8a" />
    <Sph p={[-2.9, 0.9, 2.4]} s={[0.16, 0.16, 0.16]} c="#ffe14d" />
    <Tree x={-5.5} z={-10} local={local} s={1.1} />
    <Tree x={5.8} z={-11} local={local} s={1.0} phase={1.4} />
    {/* lentera hangat di tiang dekat jalan (cahaya hangat ala contoh gua) */}
    <Cyl p={[2.6, 1.1, 1.5]} s={[0.09, 0.11, 2.2, 0]} c="#5d4023" />
    <B p={[2.6, 2.35, 1.5]} s={[0.4, 0.55, 0.4]} c="#ffb36b" />
    <B p={[2.6, 2.65, 1.5]} s={[0.5, 0.1, 0.5]} c="#3a2c22" />
    <pointLight position={[2.6, 2.4, 2.5]} color="#ffb36b" intensity={14} distance={12} decay={1.8} />
    <Foreground local={local} />
  </group>
);


const Scene8World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-9} y={10} z={-34} s={1} local={local} phase={0} />
    <Cloud x={8} y={12} z={-38} s={0.9} local={local} phase={2} />
    {/* siluet bukit ungu */}
    <Sph p={[-12, -1.5, -30]} s={[13, 4.5, 5]} c="#7a4a5e" />
    <Sph p={[11, -1.8, -32]} s={[14, 4.8, 5]} c="#6b3f52" />
    <Ground cfg={cfg} />
    <Water cfg={cfg} local={local} z0={-30} z1={2.5} />
    {/* pantulan oranye: strip mengikuti urutan lebar v2 (100,140,180,140 px) */}
    {[1.2, 1.7, 2.2, 1.7].map((w, i) => (
      <mesh key={i} position={[drift(local, 0.2, 0.08, i), 0.12, -4 - i * 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, 0.16]} />
        <meshBasicMaterial color="#ff9d45" transparent opacity={pulse(local, 0.15, 0.45, 0.85, i)} />
      </mesh>
    ))}
    {/* pantai depan */}
    <mesh position={[0, 0.05, 6.0]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#c9a06a", sandTex())}>
      <planeGeometry args={[60, 4]} />
    </mesh>
    {/* perahu senja: lentera menyala (sorotan) + pendayung, layar diturunkan */}
    <Boat x={3.6} z={-4} local={local} scale={0.9} lanternLit rower sailsDown />
    {/* dermaga kayu kecil di kanan: papan di atas tiang, tali tambat ke perahu */}
    {[5, 3, 1, -1].map((z, i) => (
      <B key={i} p={[2.7, 0.35, z]} s={[1.1, 0.12, 1.9]} c="#7a5a34" map={woodTex()} />
    ))}
    <Cyl p={[2.3, 0.18, 5.6]} s={[0.09, 0.11, 0.36, 0]} c="#5d4023" />
    <Cyl p={[3.1, 0.18, 5.6]} s={[0.09, 0.11, 0.36, 0]} c="#5d4023" />
    <Cyl p={[2.3, 0.18, -1.6]} s={[0.09, 0.11, 0.36, 0]} c="#5d4023" />
    <Cyl p={[3.1, 0.18, -1.6]} s={[0.09, 0.11, 0.36, 0]} c="#5d4023" />
    <B p={[3.79, 0.5, -2.9]} s={[0.06, 0.06, 3.4]} c="#d8c9a0" r={[0, 2.44, 0]} />
    <Tree x={-4.5} z={-4} local={local} s={1.0} phase={0.6} />
    <Foreground local={local} tone="sand" />
    <pointLight position={[0, 4, -20]} color="#ff9d45" intensity={40} distance={50} decay={1.6} />
  </group>
);


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
  const [warmHandle] = useState(() => delayRender("toba3d warmup"));
  useEffect(() => {
    const id = setTimeout(() => {
      advance(performance.now());
      continueRender(warmHandle);
    }, 0);
    return () => clearTimeout(id);
  }, [advance, warmHandle]);

  const cam = camera as THREE.PerspectiveCamera;
  // Glide pelan: dolly-in + geser halus selama adegan (bukan diam total).
  // Di-ease (bukan linear): ease-in-out sine untuk dolly, ease-out untuk
  // zoom-out hold S4. Nilai akhir sama seperti sebelum di-ease.
  // S4 (scene 3): kamera DIAM selama retakan/slab, zoom-out sangat pelan
  // (~2%) saat hold (local 108-135) — sesuai koreografi-s4-s5.md.
  const easeInOutSine = (v: number) => -(Math.cos(Math.PI * v) - 1) / 2;
  const easeOutQ = (v: number) => 1 - (1 - v) * (1 - v);
  const t = easeInOutSine(Math.min(local / 200, 1));
  let gx = Math.sin(local * 0.01) * 0.12;
  let gy = -t * 0.25;
  let gz = -t * 0.9;
  if (scene === 3) {
    gx = 0;
    gy = 0;
    gz = 0.35 * easeOutQ(Math.max(0, Math.min((local - 108) / 27, 1)));
  }
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

/** Dunia 3D untuk satu adegan. Dipakai TobaTestV2 di bawah overlay karakter. */
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
