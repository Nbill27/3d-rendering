// world3d.tsx — DUNIA 3D Peshtigo Fire (Video14, History Rush #5).
// Pola dari v13/world3d.tsx: ThreeCanvas Remotion + three.js,
// kamera meluncur pelan per adegan, lapisan depan/tengah/belakang.
// Semua prop dibangun dari kode (box/cone/cylinder/sphere + tekstur
// canvas prosedural kayu/serbuk gergaji/pasir). TIDAK ADA prop GLB Kenney
// (folder public/bridge/ tidak ada).
// Karakter 2D bean-head tetap overlay DOM di depan canvas ini
// (lihat Video14.tsx); titik pijakan karakter ada di z = 0.
// Objek kunci (dari figure anatomy Tahap 2): kota kayu Peshtigo,
// gereja + menara air, tumpukan gelondong, pinus white pine 5 tier,
// corong tornado api, Sungai Peshtigo, rumah hangus + cerobong sisa.
// Koordinat dunia: tanah y = 0, karakter berdiri di z = 0, kamera di z ~13-16.
// Semua animasi adalah fungsi deterministik dari `local` (frame sejak
// adegan mulai) supaya still Remotion stabil.
import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";

/* ------------------------------------------------------------------ */
/* Tekstur canvas prosedural (kayu, batu kapur, rumput, pasir, langit). */
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

/** Batu kapur oolit: krem hangat dengan bintik-bintik kecil
 *  (oolite = butiran bulat kecil) + retak rambut + urat garis halus
 *  (tekstur garis Hairline Tahap 4: 2-3 garis gelap tipis per ubin). */
const limestoneTex = () =>
  canvasTex("limestone", 256, 256, (g) => {
    g.fillStyle = "#d8cbb2";
    g.fillRect(0, 0, 256, 256);
    const r = rng(31);
    // butiran oolit: bintik bulat kecil rapat
    for (let i = 0; i < 1400; i++) {
      const v = 190 + Math.floor(r() * 55);
      g.fillStyle = `rgb(${v},${v - 12},${v - 45})`;
      g.beginPath();
      g.arc(r() * 256, r() * 256, 1 + r() * 2.2, 0, Math.PI * 2);
      g.fill();
    }
    // bercak lembut: batu tidak satu warna datar
    for (let i = 0; i < 12; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(150,130,100,0.16)" : "rgba(235,225,205,0.16)";
      g.beginPath();
      g.arc(r() * 256, r() * 256, 12 + r() * 24, 0, Math.PI * 2);
      g.fill();
    }
    // retak rambut + urat garis halus (Hairline: garis tipis, menahan diri)
    g.strokeStyle = "rgba(110,95,70,0.5)";
    g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
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
    // 2 garis urat panjang horizontal (arah serat batu)
    g.strokeStyle = "rgba(110,95,70,0.35)";
    g.lineWidth = 1;
    for (const yy of [70, 180]) {
      g.beginPath();
      g.moveTo(0, yy);
      g.bezierCurveTo(80, yy + 6, 170, yy - 6, 256, yy + 3);
      g.stroke();
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

const skyTex = (top: string, hor: string) =>
  canvasTex(`sky-${top}-${hor}`, 16, 256, (g) => {
    // Canvas di-upload terbalik (flipY): baris bawah canvas tampil di ATAS
    // bidang, jadi warna atas langit digambar di bawah canvas.
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
/* emissive/tanpa cahaya untuk matahari, bulan, kilau).                 */
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
/* Konfigurasi per adegan: langit, kabut, tanah, matahari/bulan,       */
/* kamera (posisi + tatapan; glide kecil ditambah di Inner), cahaya.    */
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
  // S1 hook: senja ungu + horizon api oranye, kota terbakar di kejauhan
  { skyTop: "#3a2a4a", skyHor: "#ff8a4a", fog: "#c96a4a", groundTex: sandTex, groundColor: "#b89a6a", sunPos: [8, 4, -55], sunR: 3.4, sunColor: "#ff7a2a", camPos: [0, 3.4, 16], camLook: [0, 1.5, -2], fov: 46, dirColor: "#ffb36b", dirPos: [8, 10, 6], dirInt: 1.3, amb: 0.5, fogNear: 26, fogFar: 90 },
  // S2 kota kayu siang kering, langit kabut kuning
  { skyTop: "#4a86cf", skyHor: "#e8c98a", fog: "#d8c49a", groundTex: grassTex, groundColor: "#c9b088", sunPos: [8, 13, -55], sunR: 3.2, sunColor: "#ffcf6e", camPos: [0, 3.2, 15], camLook: [0, 1.4, -3], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S3 jalan serpihan kayu, close-up kering
  { skyTop: "#5a7ab0", skyHor: "#e8b878", fog: "#d8b088", groundTex: grassTex, groundColor: "#c9a06a", sunPos: [-8, 13, -55], sunR: 3.0, sunColor: "#ffcf6e", camPos: [0, 2.6, 13], camLook: [0, 1.0, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [-8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 26, fogFar: 90 },
  // S4 angin datang: senja merah, langit gelap
  { skyTop: "#2a2a4a", skyHor: "#ff6a3a", fog: "#a85a44", groundTex: sandTex, groundColor: "#b89a6a", sunPos: [8, 4, -55], sunR: 3.6, sunColor: "#ff5a2a", camPos: [0, 3.4, 16], camLook: [0, 1.5, -3], fov: 46, dirColor: "#ff7a3a", dirPos: [8, 10, 6], dirInt: 1.4, amb: 0.5, fogNear: 26, fogFar: 90 },
  // S5 firestorm malam: langit hitam + horizon api
  { skyTop: "#140a08", skyHor: "#c23a12", fog: "#4a1a0e", groundTex: sandTex, groundColor: "#6a4a34", sunPos: [0, 6, -55], sunR: 4.0, sunColor: "#ff5a1a", camPos: [0, 3.6, 15], camLook: [0, 2.0, -3], fov: 46, dirColor: "#ff7a3a", dirPos: [0, 10, 6], dirInt: 1.2, amb: 0.4, fogNear: 24, fogFar: 85 },
  // S6 sungai malam: langit biru gelap + cahaya api di tepi
  { skyTop: "#1a2340", skyHor: "#c25a3a", fog: "#3a2a3a", groundTex: sandTex, groundColor: "#8a7a62", sunPos: [-8, 8, -55], sunR: 2.6, sunColor: "#ffb36b", camPos: [0, 3.0, 15], camLook: [0, 0.8, -2], fov: 46, dirColor: "#ffb36b", dirPos: [-6, 10, 6], dirInt: 1.0, amb: 0.5, fogNear: 26, fogFar: 90 },
  // S7 kota hangus, fajar kelabu berasap
  { skyTop: "#5a4a5a", skyHor: "#c98a6a", fog: "#8a6a5a", groundTex: sandTex, groundColor: "#5a4a3a", sunPos: [8, 8, -55], sunR: 3.0, sunColor: "#ffcf9e", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#e8c9a8", dirPos: [8, 12, 6], dirInt: 1.1, amb: 0.5, fogNear: 26, fogFar: 90 },
  // S8 kehancuran close-up, fajar kelabu
  { skyTop: "#5a4a5a", skyHor: "#c98a6a", fog: "#8a6a5a", groundTex: sandTex, groundColor: "#5a4a3a", sunPos: [8, 8, -55], sunR: 3.0, sunColor: "#ffcf9e", camPos: [0, 2.8, 13], camLook: [0, 1.0, -2], fov: 46, dirColor: "#e8c9a8", dirPos: [8, 12, 6], dirInt: 1.1, amb: 0.5, fogNear: 26, fogFar: 90 },
  // S9 peta: latar redup biru malam (overlay DOM peta menutup tengah)
  { skyTop: "#2c3a5a", skyHor: "#8a9ab8", fog: "#5a6a8a", groundTex: sandTex, groundColor: "#3a4a5a", sunPos: [8, 12, -55], sunR: 2.6, sunColor: "#f2ead0", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#c9d4f2", dirPos: [6, 12, 6], dirInt: 0.9, amb: 0.55, fogNear: 26, fogFar: 90 },
  // S10 koran: latar gelap berasap (overlay DOM koran menutup tengah)
  { skyTop: "#1e1a24", skyHor: "#6a5a4a", fog: "#3a3230", groundTex: sandTex, groundColor: "#2a2622", sunPos: [0, 6, -55], sunR: 3.0, sunColor: "#ff9d45", camPos: [0, 3.4, 16], camLook: [0, 1.2, -2], fov: 46, dirColor: "#ffb36b", dirPos: [0, 8, 6], dirInt: 1.0, amb: 0.45, fogNear: 26, fogFar: 90 },
];

/* ------------------------------------------------------------------ */
/* Potongan bersama: langit, matahari/bulan, awan, bukit, tanah,       */
/* pohon palem, latar depan, bintang, burung.                           */
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

const Hills = ({ local, colors, z1 = -30, trees = true }: { local: number; colors: [string, string, string]; z1?: number; trees?: boolean }) => (
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

/** Latar depan dekat kamera: batu kapur, rumpun rumput, bunga. */
const Foreground = ({ local, tone = "green", rocks = true }: { local: number; tone?: "green" | "dark" | "sand"; rocks?: boolean }) => (
  <group>
    {rocks && (
      <>
        <Sph p={[-1.7, 0.25, 8]} s={[0.9, 0.5, 0.7]} c={tone === "dark" ? "#3a2c22" : "#c9bfa8"} map={tone === "dark" ? undefined : limestoneTex()} />
        <Sph p={[-1.0, 0.18, 8.4]} s={[0.55, 0.32, 0.45]} c={tone === "dark" ? "#2c2118" : "#b7ab98"} />
        <Sph p={[1.7, 0.3, 7.8]} s={[1.0, 0.55, 0.7]} c={tone === "dark" ? "#3a2c22" : "#c9bfa8"} map={tone === "dark" ? undefined : limestoneTex()} />
        <Sph p={[1.0, 0.2, 8.4]} s={[0.6, 0.35, 0.5]} c={tone === "dark" ? "#2c2118" : "#b7ab98"} />
        <mesh position={[-1.7, 0.02, 8.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.0, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.14} />
        </mesh>
        <mesh position={[1.7, 0.02, 8.0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.1, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.14} />
        </mesh>
      </>
    )}
    {/* rumpun rumput bergoyang */}
    {[-1.4, 1.3, -0.4].map((x, i) => (
      <group key={i} position={[x, 0, 8.6]} rotation={[0, 0, Math.sin(local * 0.07 + i) * 0.05]}>
        <Cone p={[0, 0.35, 0]} s={[0.28, 0.7, 0]} c={tone === "dark" ? "#4a5d3a" : "#3e7d4e"} seg={6} />
        <Cone p={[0.3, 0.3, 0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e9d5e"} seg={6} />
        <Cone p={[-0.3, 0.3, -0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e9d5e"} seg={6} />
      </group>
    ))}
    {/* bunga kecil */}
    {[-1.15, 1.05].map((x, i) => (
      <group key={i} position={[x, 0, 9.0]}>
        <Cyl p={[0, 0.3, 0]} s={[0.05, 0.05, 0.6, 0]} c="#3e7d4e" />
        <Sph p={[0, 0.62, 0]} s={[0.12, 0.12, 0.12]} c={i === 0 ? "#ff8a8a" : "#ffe14d"} />
      </group>
    ))}
  </group>
);

/** Bintang malam: titik-titik terang yang berkelip pelan (S3, S7). */
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

/** Burung: dua garis tipis membentuk V, drift pelan. */
const Bird = ({ x, y, z, local, phase, s = 1 }: { x: number; y: number; z: number; local: number; phase: number; s?: number }) => (
  <group position={[x + drift(local, 1.2, 0.02, phase), y, z]} scale={[s, s, s]}>
    <B p={[-0.28, 0, 0]} s={[0.55, 0.07, 0.07]} c="#3d5a80" r={[0, 0, 0.5]} />
    <B p={[0.28, 0, 0]} s={[0.55, 0.07, 0.07]} c="#3d5a80" r={[0, 0, -0.5]} />
  </group>
);

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* Prop Peshtigo — semua dari kode (box/cone/cylinder/sphere + tekstur */
/* canvas prosedural kayu/serbuk/serpihan). TIDAK ADA prop GLB Kenney  */
/* (folder public/bridge/ tidak ada). Objek kunci dari figure anatomy  */
/* Tahap 2 (anatomy/fig1-town.html 52 bagian, fig2-firestorm.html 42,  */
/* fig3-river.html 43, PROPS.md): rumah kayu, gereja, menara air,     */
/* tumpukan kayu gelondong, serbuk gergaji, jalan serpihan kayu, api   */
/* kecil, kolom api, corong tornado api, asap, bara, atap terbang,     */
/* pohon pinus white pine 5 tier (hairline-pine.html), sungai + riak,  */
/* perahu, puing hanyut, rumah hangus + cerobong sisa. Gerakan         */
/* mengikuti mekanisme aslinya: pinus sway lalu tumbang, atap          */
/* terangkat angin lalu jatuh, bara naik ikut angin, pusaran api       */
/* berputar makin cepat, puing hanyut ikut arus.                       */
/* ------------------------------------------------------------------ */

/** Rumah kayu logging town: badan papan + atap pelana + cerobong. */
const WoodHouse = ({ x, z, local, w = 3.2, h = 2.6, d = 2.6, wall = "#a8724a", roof = "#6e3b22", lean = 0, burn = 0, s = 1 }: { x: number; z: number; local: number; w?: number; h?: number; d?: number; wall?: string; roof?: string; lean?: number; burn?: number; s?: number }) => {
  const flick = burn > 0 ? 0.5 + 0.5 * Math.sin(local * 0.35 + x) : 0;
  return (
    <group position={[x, 0, z]} rotation={[0, 0, lean]} scale={[s, s, s]}>
      <B p={[0, h / 2, 0]} s={[w, h, d]} c={burn > 0 ? "#3a2418" : wall} map={burn > 0 ? undefined : woodTex()} />
      {/* atap pelana: dua bidang miring */}
      <B p={[-w * 0.22, h + 0.35, 0]} s={[w * 0.62, 0.18, d + 0.3]} c={roof} r={[0, 0, 0.5]} />
      <B p={[w * 0.22, h + 0.35, 0]} s={[w * 0.62, 0.18, d + 0.3]} c={roof} r={[0, 0, -0.5]} />
      {/* pintu + jendela hangat */}
      <B p={[0, 0.7, d / 2 + 0.02]} s={[0.7, 1.4, 0.06]} c="#4a2c18" />
      <B p={[-w * 0.28, 1.5, d / 2 + 0.02]} s={[0.6, 0.6, 0.06]} c={burn > 0 ? "#ff7a2a" : "#ffd97a"} />
      <B p={[w * 0.28, 1.5, d / 2 + 0.02]} s={[0.6, 0.6, 0.06]} c={burn > 0 ? "#ff7a2a" : "#ffd97a"} />
      {/* cerobong + asap tipis */}
      <B p={[w * 0.3, h + 0.9, 0]} s={[0.4, 1.0, 0.4]} c="#7a4a3a" />
      {burn === 0 && (
        <Sph p={[w * 0.3 + drift(local, 0.2, 0.06, x), h + 1.8 + ((local * 0.03 + x) % 1.2), 0]} s={[0.3, 0.3, 0.3]} c="#b8b0a8" op={0.5} />
      )}
      {/* api menjilat dari jendela saat terbakar */}
      {burn > 0 && (
        <Cone p={[0, h + 0.6, 0]} s={[1.1 + flick * 0.4, 2.2 + flick * 0.8, 0]} c="#ff6a1a" seg={8} />
      )}
    </group>
  );
};

/** Gereja kayu + menara + salib (Fig 1: church-wall/tower/roof/cross). */
const Church = ({ x, z, local, lean = 0, burn = 0 }: { x: number; z: number; local: number; lean?: number; burn?: number }) => {
  const flick = burn > 0 ? 0.5 + 0.5 * Math.sin(local * 0.4) : 0;
  return (
    <group position={[x, 0, z]} rotation={[0, 0, lean]}>
      <B p={[0, 1.5, 0]} s={[3.6, 3.0, 3.0]} c={burn > 0 ? "#3a2418" : "#e8dcc0"} map={burn > 0 ? undefined : woodTex()} />
      <B p={[-0.8, 3.35, 0]} s={[2.2, 0.18, 3.3]} c="#5d3a22" r={[0, 0, 0.5]} />
      <B p={[0.8, 3.35, 0]} s={[2.2, 0.18, 3.3]} c="#5d3a22" r={[0, 0, -0.5]} />
      {/* menara + salib */}
      <B p={[0, 4.6, 0]} s={[1.2, 2.4, 1.2]} c={burn > 0 ? "#3a2418" : "#e8dcc0"} />
      <Cone p={[0, 6.4, 0]} s={[1.0, 1.2, 0]} c="#5d3a22" seg={4} />
      <B p={[0, 7.5, 0]} s={[0.12, 0.7, 0.12]} c="#3a2c22" />
      <B p={[0, 7.4, 0]} s={[0.45, 0.12, 0.12]} c="#3a2c22" />
      {/* jendela lancip hangat */}
      <B p={[0, 1.6, 1.52]} s={[0.6, 1.2, 0.06]} c={burn > 0 ? "#ff7a2a" : "#ffd97a"} />
      {burn > 0 && <Cone p={[0, 4.2, 0]} s={[1.4 + flick * 0.4, 2.6 + flick, 0]} c="#ff6a1a" seg={8} />}
    </group>
  );
};

/** Menara air kayu (Fig 1: wt-leg1/2, wt-tank, wt-roof). */
/** Tumpukan kayu gelondong (Fig 1: logs-1/2/3) — silinder rebah. */
const LogPile = ({ x, z, n = 5, s = 1 }: { x: number; z: number; n?: number; s?: number }) => {
  const rows: { y: number; off: number }[] = [];
  let left = n;
  let row = 0;
  while (left > 0) {
    const count = Math.min(left, 3 - Math.min(row, 2));
    for (let i = 0; i < count; i++) rows.push({ y: 0.3 + row * 0.55, off: (i - (count - 1) / 2) * 0.62 });
    left -= count;
    row++;
  }
  return (
    <group position={[x, 0, z]} scale={[s, s, s]}>
      {rows.map((r, i) => (
        <Cyl key={i} p={[r.off, r.y, 0]} s={[0.28, 0.28, 2.2, 0]} c={i % 2 === 0 ? "#8a6a42" : "#7a5a34"} map={woodTex()} r={[Math.PI / 2, 0, 0]} seg={10} />
      ))}
      {/* ujung gelondong: lingkaran terang */}
      {rows.slice(0, 3).map((r, i) => (
        <Disc key={i} p={[r.off, r.y, 1.12]} s={0.26} c="#d8b088" />
      ))}
    </group>
  );
};

/** Tumpukan serbuk gergaji (Fig 1: sawdust) — kerucut tumpul cokelat muda. */
const SawdustPile = ({ x, z, s = 1 }: { x: number; z: number; s?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    <Cone p={[0, 0.35, 0]} s={[1.1, 0.7, 0]} c="#d8b088" seg={12} />
    <Sph p={[0, 0.12, 0]} s={[1.15, 0.22, 0.9]} c="#c9a06a" />
  </group>
);

/** Pohon pinus white pine 5 tier (hairline-pine.html): batang + 5 lapis
 *  cabang kerucut, sway pelan; `fall` 0 = tegak, 1 = tumbang penuh. */
const Pine = ({ x, z, local, s = 1, phase = 0, fall = 0, burnt = false }: { x: number; z: number; local: number; s?: number; phase?: number; fall?: number; burnt?: boolean }) => {
  const sway = Math.sin(local * 0.06 + phase) * 0.04 * (1 - fall);
  const lean = fall * 1.35; // tumbang: rebah ~77 derajat
  const green = burnt ? "#2a1c12" : "#2e5d3a";
  const green2 = burnt ? "#3a281a" : "#3f7a4a";
  return (
    <group position={[x, 0, z]} rotation={[0, 0, sway + lean]} scale={[s, s, s]}>
      <mesh position={[0.3, 0.03, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} />
      </mesh>
      <Cyl p={[0, 1.0, 0]} s={[0.18, 0.28, 2.0, 0]} c="#5d4023" map={woodTex()} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Cone key={i} p={[0, 1.9 + i * 0.62, 0]} s={[1.55 - i * 0.24, 1.25, 0]} c={i % 2 === 0 ? green : green2} seg={10} />
      ))}
      <Cone p={[0, 4.6, 0]} s={[0.5, 0.9, 0]} c={green} seg={10} />
    </group>
  );
};

/** Api kecil pemicu (Fig 1: small-fire) — lidah api flicker + asap. */
const SmallFire = ({ x, z, local, grow = 0 }: { x: number; z: number; local: number; grow?: number }) => {
  const f = 0.5 + 0.5 * Math.sin(local * 0.5 + x * 2);
  const h = 0.9 + grow * 2.2 + f * 0.25;
  return (
    <group position={[x, 0, z]}>
      <Cone p={[0, h / 2, 0]} s={[0.7 + grow * 0.9, h, 0]} c="#ff6a1a" seg={8} />
      <Cone p={[0, h * 0.35, 0]} s={[0.4 + grow * 0.5, h * 0.6, 0]} c="#ffd23a" seg={8} />
      {/* bara di pangkal */}
      <Sph p={[0, 0.12, 0]} s={[0.5, 0.2, 0.4]} c="#c23a12" />
      {/* asap naik, melebar */}
      {[0, 1, 2].map((i) => (
        <Sph key={i} p={[drift(local, 0.25, 0.08, i + x), 1.2 + i * 0.9 + ((local * 0.02 + i * 0.33) % 0.9), 0]} s={[0.3 + i * 0.14, 0.3 + i * 0.14, 0.3 + i * 0.14]} c="#9a938c" op={0.5 - i * 0.1} />
      ))}
    </group>
  );
};

/** Lidah api besar (Fig 2: flame-1..6) — kerucut api flicker cepat. */
const FlameTongue = ({ x, z, local, s = 1, phase = 0 }: { x: number; z: number; local: number; s?: number; phase?: number }) => {
  const f = 0.5 + 0.5 * Math.sin(local * 0.45 + phase);
  const lean = Math.sin(local * 0.2 + phase) * 0.12;
  return (
    <group position={[x, 0, z]} rotation={[0, 0, lean]} scale={[s * (0.9 + f * 0.2), s * (0.9 + f * 0.35), s]}>
      <Cone p={[0, 1.6, 0]} s={[1.3, 3.2, 0]} c="#ff5a1a" seg={8} />
      <Cone p={[0, 1.1, 0]} s={[0.8, 2.2, 0]} c="#ff9d2a" seg={8} />
      <Cone p={[0, 0.7, 0]} s={[0.45, 1.4, 0]} c="#ffd23a" seg={8} />
    </group>
  );
};

/** Kolom asap besar (Fig 2: smoke-1/2/3 + smoke-cloud) — naik + membesar. */
const SmokeColumn = ({ x, z, local, s = 1, phase = 0, dark = false }: { x: number; z: number; local: number; s?: number; phase?: number; dark?: boolean }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const rise = (local * 0.02 + phase + i * 0.16) % 1;
      return (
        <Sph key={i} p={[drift(local, 0.5 + i * 0.2, 0.05, phase + i), 1.2 + rise * 6.5, -i * 0.3]} s={[0.7 + rise * 1.0, 0.7 + rise * 1.0, 0.7 + rise * 1.0]} c={dark ? "#4a3a32" : "#8a8078"} op={0.5 - rise * 0.3} />
      );
    })}
  </group>
);

/** Corong tornado api (Fig 2: fire-whirl) — KOLOM MERUNCING HALUS yang
 *  langsung terbaca sebagai tornado: lebar di atas (r 2,5), sempit di
 *  bawah (r 0,6), tinggi 0-11. Corong lama gagal di still karena 4
 *  kerucut simetris-putar: putaran Y tidak terlihat di gambar diam dan
 *  yang tampak hanya segitiga merah datar. Di sini putaran DIBEKUKAN
 *  jadi bentuk: (1) badan 3 segmen silinder meruncing bersambung
 *  (radius kontinu 0,6 -> 1,2 -> 1,9 -> 2,5) dengan warna makin terang
 *  ke atas (merah -> oranye -> kuning-oranye); (2) HELIKS BARA: 16
 *  titik terang melilit badan 1,75 putaran dari bawah ke atas — di
 *  still pun langsung terbaca sebagai putaran; (3) 3 CINCIN api di
 *  sekeliling badan; (4) 4 lidah api mencuat miring dari badan;
 *  (5) tutup kerucut kuning di puncak. Badan + cincin STATIS (simetris,
 *  putarannya memang tak terlihat); yang berputar hanya sub-grup heliks
 *  / lidah / bara pangkal, jadi putaran tetap hidup di video. */
const FireVortex = ({ x, z, local }: { x: number; z: number; local: number }) => {
  const spin = local * 0.22; // makin cepat seiring adegan (local naik)
  const wobble = Math.sin(local * 0.08) * 0.05;
  // Radius badan corong pada ketinggian y (0-9,5): lurus 0,6 -> 2,5.
  const funnelR = (y: number) => 0.6 + (2.5 - 0.6) * Math.min(Math.max(y / 9.5, 0), 1);
  // Heliks bara: 16 titik, 1,75 putaran, y 0,9-8,9, di permukaan badan +0,18.
  const helix = Array.from({ length: 16 }).map((_, i) => {
    const t = i / 15;
    const y = 0.9 + t * 8.0;
    const r = funnelR(y) + 0.18;
    const a = t * Math.PI * 3.5;
    return { y, px: Math.cos(a) * r, pz: Math.sin(a) * r, c: i % 2 === 0 ? "#ffd23a" : "#ff9d2a" };
  });
  return (
    <group position={[x, 0, z]} rotation={[0, 0, wobble]}>
      {/* badan corong: 3 segmen meruncing bersambung, warna makin terang */}
      <Cyl p={[0, 1.5, 0]} s={[1.2, 0.6, 3.0, 0]} c="#ff5a1a" seg={16} />
      <Cyl p={[0, 4.75, 0]} s={[1.9, 1.2, 3.5, 0]} c="#ff7a2a" seg={16} />
      <Cyl p={[0, 8.0, 0]} s={[2.5, 1.9, 3.0, 0]} c="#ff9d2a" seg={16} />
      {/* tutup puncak: kerucut kuning, bukan potongan datar */}
      <Cone p={[0, 10.3, 0]} s={[2.5, 1.6, 0]} c="#ffd23a" seg={16} />
      {/* cincin api di sekeliling badan (di sambungan segmen + tengah atas) */}
      <Cyl p={[0, 3.0, 0]} s={[1.32, 1.32, 0.4, 0]} c="#ffd23a" seg={16} />
      <Cyl p={[0, 6.5, 0]} s={[2.02, 2.02, 0.4, 0]} c="#ffd23a" seg={16} />
      <Cyl p={[0, 8.0, 0]} s={[2.32, 2.32, 0.4, 0]} c="#ff6a1a" seg={16} />
      {/* sub-grup berputar: heliks bara + lidah api + bara pangkal */}
      <group rotation={[0, spin, 0]}>
        {helix.map((h, i) => (
          <Sph key={i} p={[h.px, h.y, h.pz]} s={[0.3, 0.3, 0.3]} c={h.c} />
        ))}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + 0.6;
          const y = 2.2 + i * 1.6;
          const r = funnelR(y) + 0.1;
          return (
            <Cone key={i} p={[Math.cos(a) * r, y, Math.sin(a) * r]} s={[0.55, 2.0, 0]} c={i % 2 === 0 ? "#ffd23a" : "#ff6a1a"} seg={7} r={[0, 0, 0.55]} />
          );
        })}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <Sph key={i} p={[Math.cos(a) * 1.3, 0.5 + (i % 2) * 0.4, Math.sin(a) * 1.3]} s={[0.24, 0.24, 0.24]} c="#ffd23a" />
          );
        })}
      </group>
    </group>
  );
};

/** Bara + percikan naik ikut angin (Fig 2: ember-1..6). */
const Embers = ({ local, n = 10, area = 8, phase = 0 }: { local: number; n?: number; area?: number; phase?: number }) => (
  <group>
    {Array.from({ length: n }).map((_, i) => {
      const rise = (local * 0.03 + i * 0.13 + phase) % 1;
      const x = Math.sin(i * 12.9898) * area - area / 2 + rise * 3; // hanyut ikut angin ke kanan
      const z = -2 - ((i * 7.233) % 10);
      return (
        <mesh key={i} position={[x, 0.5 + rise * 9, z]} material={basic(i % 3 === 0 ? "#ffd23a" : "#ff6a1a", 0.9 - rise * 0.5)}>
          <sphereGeometry args={[0.09 + (i % 3) * 0.04, 8, 6]} />
        </mesh>
      );
    })}
  </group>
);

/** Atap/dinding terbang berputar (Fig 2: roof-1/2, wall-1/2). */
const FlyingRoof = ({ local, x0, z, phase = 0 }: { local: number; x0: number; z: number; phase?: number }) => {
  const t = Math.min(local / 90, 1); // terangkat selama ~3 detik pertama
  const easeOut = 1 - Math.pow(1 - t, 3);
  const y = 1 + easeOut * 7;
  const x = x0 + easeOut * 6;
  const spin = local * 0.12 + phase;
  return (
    <group position={[x, y, z]} rotation={[spin * 0.4, spin, spin * 0.25]}>
      <B p={[0, 0, 0]} s={[2.4, 0.22, 1.8]} c="#6e3b22" />
      <B p={[0, -0.2, 0]} s={[2.0, 0.18, 1.4]} c="#c23a12" />
    </group>
  );
};

/** Aliran angin kencang (Fig 2: wind-1/2/3 inflow) — garis putih cepat. */
const WindStreaks = ({ local, n = 8 }: { local: number; n?: number }) => (
  <group>
    {Array.from({ length: n }).map((_, i) => {
      const y = 1 + (i % 5) * 1.6;
      const z = -1 - (i % 4) * 2.5;
      const x = -9 + ((local * 0.55 + i * 2.7) % 18);
      return (
        <B key={i} p={[x, y, z]} s={[1.6 + (i % 3) * 0.5, 0.07, 0.07]} c="#ffffff" op={0.35 + (i % 3) * 0.12} r={[0, 0, -0.08]} />
      );
    })}
  </group>
);

/** Serpihan kayu beterbangan saat angin 100 mph (Fig 1: street-1/2/3). */
const FlyingChips = ({ local, n = 12 }: { local: number; n?: number }) => (
  <group>
    {Array.from({ length: n }).map((_, i) => {
      const x = -8 + ((local * 0.4 + i * 1.9) % 16);
      const y = 0.4 + ((i * 37) % 10) / 10 + Math.sin(local * 0.3 + i) * 0.4;
      const z = -1 - (i % 5) * 1.8;
      return (
        <B key={i} p={[x, y, z]} s={[0.3, 0.05, 0.12]} c={i % 2 === 0 ? "#d8b088" : "#b98a5a"} r={[0, (i * 0.7 + local * 0.05) % 3, 0.4]} />
      );
    })}
  </group>
);

/** Sungai Peshtigo (Fig 3: river, ripple-1..4, current) — bidang air biru
 *  gelap + riak bergerak + tebing di kedua sisi. */
const River = ({ local }: { local: number }) => (
  <group>
    {/* air: bidang biru gelap memanjang ke horizon */}
    <mesh position={[0, 0.35, -6]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#2e5d7a")}>
      <planeGeometry args={[26, 26]} />
    </mesh>
    {/* riak: garis terang bergerak ikut arus ke kanan */}
    {[0, 1, 2, 3, 4].map((i) => {
      const x = -7 + ((local * 0.12 + i * 2.4) % 14);
      return (
        <mesh key={i} position={[x, 0.42, -2 - i * 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 0.1]} />
          <meshBasicMaterial color="#9fd4e8" transparent opacity={0.5 - i * 0.06} />
        </mesh>
      );
    })}
    {/* tebing kiri-kanan + batu */}
    <B p={[-8.5, 0.5, -4]} s={[3, 1.0, 20]} c="#5d4a34" map={sandTex()} />
    <B p={[8.5, 0.5, -4]} s={[3, 1.0, 20]} c="#5d4a34" map={sandTex()} />
    <Sph p={[-7.2, 0.6, -1]} s={[0.7, 0.4, 0.6]} c="#7a6a52" />
    <Sph p={[7.2, 0.55, -3]} s={[0.6, 0.35, 0.5]} c="#7a6a52" />
    {/* api di tepi sungai (bankfire) + cahaya oranye di air */}
    <FlameTongue x={-6.5} z={-8} local={local} s={0.9} phase={1} />
    <FlameTongue x={6.8} z={-10} local={local} s={1.1} phase={3} />
    <mesh position={[0, 0.4, -6]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 0.5]} />
      <meshBasicMaterial color="#ff7a2a" transparent opacity={pulse(local, 0.2, 0.25, 0.5)} />
    </mesh>
  </group>
);

/** Perahu kayu di sungai (Fig 3: boat1/2) — bob pelan, dayung mendayung. */
const Boat = ({ x, z, local, phase = 0 }: { x: number; z: number; local: number; phase?: number }) => {
  const bob = Math.sin(local * 0.09 + phase) * 0.08;
  const row = Math.sin(local * 0.16 + phase) * 0.5;
  return (
    <group position={[x, 0.35 + bob, z]} rotation={[0, 0.06, Math.sin(local * 0.07 + phase) * 0.03]}>
      <B p={[0, 0.15, 0]} s={[2.2, 0.3, 0.9]} c="#7a5a34" map={woodTex()} />
      <B p={[-0.9, 0.35, 0]} s={[0.5, 0.4, 0.9]} c="#8a6a42" r={[0, 0, 0.35]} />
      <B p={[0.9, 0.35, 0]} s={[0.5, 0.4, 0.9]} c="#8a6a42" r={[0, 0, -0.35]} />
      <B p={[0, 0.35, 0]} s={[0.12, 0.1, 0.8]} c="#5d4023" />
      {/* dayung mendayung pelan */}
      <Cyl p={[0.4, 0.5, 0.7]} s={[0.05, 0.05, 1.6, 0]} c="#8a6a42" r={[row, 0, 0.6]} />
    </group>
  );
};

/** Puing + kayu hanyut (Fig 3: debris-1/2, drift-log) — hanyut ke kanan. */
const DriftDebris = ({ local }: { local: number }) => (
  <group>
    {[0, 1, 2].map((i) => {
      const x = -8 + ((local * 0.09 + i * 5.3) % 16);
      return (
        <group key={i} position={[x, 0.45, -3 - i * 2.2]} rotation={[0, i * 0.8, Math.sin(local * 0.1 + i) * 0.1]}>
          <Cyl p={[0, 0, 0]} s={[0.18, 0.18, 1.6, 0]} c="#4a2c18" r={[0, 0, Math.PI / 2]} seg={8} />
          <B p={[0.3, 0.08, 0.3]} s={[0.5, 0.08, 0.4]} c="#3a2418" r={[0, 0.4, 0]} />
        </group>
      );
    })}
  </group>
);

/** Rumah hangus (Fig 2/3): kerangka hitam + cerobong bata sisa. */
const BurntHouse = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    {/* tiang-tiang hangus */}
    {[-1.2, -0.4, 0.4, 1.2].map((px, i) => (
      <Cyl key={i} p={[px, 0.8, 0]} s={[0.09, 0.11, 1.6 + (i % 2) * 0.4, 0]} c="#1e1410" r={[0, 0, (i % 2 === 0 ? 0.06 : -0.08)]} />
    ))}
    {/* balok jatuh miring */}
    <B p={[0, 0.5, 0]} s={[3.0, 0.16, 0.3]} c="#241811" r={[0, 0, -0.18]} />
    <B p={[0.4, 0.25, 0.4]} s={[2.2, 0.14, 0.25]} c="#1e1410" r={[0, 0.5, 0.1]} />
    {/* cerobong bata sisa (satu-satunya yang tegak) */}
    <B p={[1.4, 0.9, -0.5]} s={[0.55, 1.8, 0.55]} c="#7a4a3a" map={limestoneTex()} />
    {/* asap tipis sisa */}
    <Sph p={[1.4 + drift(local, 0.2, 0.05, 0), 2.4 + ((local * 0.02) % 1.0), -0.5]} s={[0.35, 0.35, 0.35]} c="#8a8078" op={0.4} />
  </group>
);

/** Tunggul hangus (Fig 2: fallen tree) — batang hitam rebah. */
const CharredStump = ({ x, z, r = 0 }: { x: number; z: number; r?: number }) => (
  <group position={[x, 0, z]} rotation={[0, r, 0]}>
    <Cyl p={[0, 0.5, 0]} s={[0.22, 0.3, 1.0, 0]} c="#1e1410" />
    <Cyl p={[0.5, 0.25, 0.3]} s={[0.12, 0.14, 1.4, 0]} c="#241811" r={[0, 0, Math.PI / 2 - 0.2]} />
  </group>
);

/** Jembatan kayu (Fig 1/3: bridge-deck/rail/pile) — papan + tiang. */
const Bridge = ({ x, z, burn = 0, local }: { x: number; z: number; burn?: number; local: number }) => (
  <group position={[x, 0, z]}>
    <B p={[0, 0.9, 0]} s={[7.5, 0.25, 1.6]} c={burn > 0 ? "#3a2418" : "#8a6a42"} map={burn > 0 ? undefined : woodTex()} />
    <B p={[0, 1.5, 0.75]} s={[7.5, 0.12, 0.12]} c={burn > 0 ? "#241811" : "#7a5a34"} />
    <B p={[0, 1.5, -0.75]} s={[7.5, 0.12, 0.12]} c={burn > 0 ? "#241811" : "#7a5a34"} />
    {[-3, -1, 1, 3].map((px, i) => (
      <Cyl key={i} p={[px, 0.4, 0]} s={[0.14, 0.18, 0.9, 0]} c="#5d4023" />
    ))}
    {burn > 0 && <FlameTongue x={-2.5} z={0} local={local} s={0.6} phase={2} />}
  </group>
);

/* ------------------------------------------------------------------ */
/* Adegan 3D — satu fungsi per baris VO (10 adegan, hard cut).           */
/* Kamera: FOV vertikal 46 + aspek 9:16 = setengah lebar horizontal     */
/* hanya 0,239 x jarak kamera (cam z=16): di z=-2 lebarnya ~4,1 unit,  */
/* di z=-6 ~5,3 unit. Prop kunci duduk di |x| < 4,5, z -12..0.          */
/* ------------------------------------------------------------------ */

const Scene1World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.2} local={local} phase={0} />
    <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Hills local={local} colors={["#4a2c3a", "#3a2230", "#2c1a26"]} />
    <Ground cfg={cfg} />
    {/* kota di kejauhan, siluet gelap + cahaya api di baliknya */}
    <WoodHouse x={-3.5} z={-16} local={local} w={2.6} h={2.0} s={1} burn={1} />
    <WoodHouse x={0} z={-18} local={local} w={3.0} h={2.4} burn={1} />
    <WoodHouse x={3.5} z={-16} local={local} w={2.6} h={2.0} burn={1} />
    <Church x={-1.5} z={-20} local={local} burn={1} />
    {/* kolom asap menjulang + bara beterbangan */}
    <SmokeColumn x={-2} z={-14} local={local} s={1.2} dark />
    <SmokeColumn x={2.5} z={-16} local={local} s={1.0} phase={2} dark />
    <Embers local={local} n={14} area={10} />
    <Bird x={-3} y={10} z={-20} local={local} phase={0} />
    <Bird x={3} y={12} z={-22} local={local} phase={2} />
    <Foreground local={local} />
  </group>
);

const Scene2World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-9} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={6} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Hills local={local} colors={["#8a7a52", "#6a5a3e", "#5a4a32"]} />
    <Ground cfg={cfg} />
    {/* jalan serpihan kayu membujur ke kota */}
    <mesh position={[0, 0.06, -2]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#c9a06a", sandTex())}>
      <planeGeometry args={[3.6, 30]} />
    </mesh>
    {/* deret rumah kayu + gereja (menara air DIHAPUS 27 Nov 13:34 WIB:
        kota penebang kayu 1.700 jiwa 1871 tidak terverifikasi punya menara
        air; diganti satu rumah kayu lagi, sesuai riset: kota dibangun
        dari kayu) */}
    <WoodHouse x={-3.6} z={-6} local={local} wall="#a8724a" roof="#6e3b22" />
    <WoodHouse x={3.6} z={-7} local={local} wall="#b57e52" roof="#5d3a22" />
    <WoodHouse x={-3.8} z={-11} local={local} wall="#96643e" roof="#6e3b22" w={2.8} h={2.2} />
    <Church x={2.8} z={-13} local={local} />
    <WoodHouse x={-5.2} z={-9} local={local} wall="#96643e" roof="#5d3a22" w={2.8} h={2.2} />
    {/* tumpukan kayu + serbuk gergaji di tepi jalan */}
    <LogPile x={-2.2} z={-2.5} n={6} />
    <LogPile x={3.4} z={-3.5} n={5} />
    <SawdustPile x={-1.6} z={-5} />
    <SawdustPile x={2.6} z={-1.5} s={0.8} />
    {/* pinus kering di tepi kota */}
    <Pine x={-5.5} z={-12} local={local} s={1.2} phase={0} />
    <Pine x={5.6} z={-13} local={local} s={1.0} phase={1.5} />
    <Pine x={4.8} z={-4} local={local} s={0.85} phase={2.5} />
    {/* asap api kecil di kejauhan */}
    <SmokeColumn x={0} z={-18} local={local} s={0.7} phase={1} />
    <Bird x={-2} y={11} z={-20} local={local} phase={1} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene3World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1} local={local} phase={1} />
    <Hills local={local} colors={["#8a7a52", "#6a5a3e", "#5a4a32"]} />
    <Ground cfg={cfg} />
    <mesh position={[0, 0.06, -2]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#c9a06a", sandTex())}>
      <planeGeometry args={[3.6, 30]} />
    </mesh>
    {/* tumpukan kayu besar di depan + serbuk gergaji */}
    <LogPile x={-2.6} z={-3} n={8} s={1.15} />
    <LogPile x={2.8} z={-4.5} n={6} />
    <SawdustPile x={-0.6} z={-1.5} s={1.2} />
    <SawdustPile x={2.2} z={-1} s={0.9} />
    <SawdustPile x={-3.4} z={-6} s={1.0} />
    {/* api kecil sudah menyala berhari-hari: flicker di sela kayu */}
    <SmallFire x={-1.8} z={-5.5} local={local} />
    <SmallFire x={2.4} z={-7} local={local} />
    <SmallFire x={0.5} z={-10} local={local} />
    {/* rumah + pinus kering di belakang */}
    <WoodHouse x={-3.8} z={-10} local={local} wall="#a8724a" />
    <WoodHouse x={3.9} z={-11} local={local} wall="#b57e52" />
    <Pine x={-5.4} z={-8} local={local} s={1.1} phase={0.5} />
    <Pine x={5.5} z={-9} local={local} s={1.2} phase={2} />
    <Embers local={local} n={6} area={6} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene4World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // Angin datang: pohon makin miring, api kecil membesar, serpihan beterbangan.
  const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
  const windT = easeInOutSine(Math.min(Math.max(local / 120, 0), 1));
  const lean = windT * 0.22;
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      <Cloud x={-8 + windT * 4} y={11} z={-34} s={1.2} local={local} phase={0} />
      <Cloud x={6 + windT * 4} y={13} z={-38} s={1} local={local} phase={2} />
      <Hills local={local} colors={["#5a3a3a", "#4a2c2c", "#3a2222"]} />
      <Ground cfg={cfg} />
      <mesh position={[0, 0.06, -2]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#c9a06a", sandTex())}>
        <planeGeometry args={[3.6, 30]} />
      </mesh>
      {/* pinus membungkuk ikut angin */}
      <Pine x={-5.4} z={-8} local={local} s={1.1} phase={0.5} fall={windT * 0.35} />
      <Pine x={5.5} z={-9} local={local} s={1.2} phase={2} fall={windT * 0.3} />
      {/* rumah miring + atap terangkat */}
      <WoodHouse x={-3.8} z={-10} local={local} wall="#a8724a" lean={lean * 0.3} />
      <WoodHouse x={3.9} z={-11} local={local} wall="#b57e52" lean={-lean * 0.25} />
      <Church x={2.8} z={-14} local={local} lean={-lean * 0.4} />
      {/* api kecil membesar jadi lidah api */}
      <SmallFire x={-1.8} z={-5.5} local={local} grow={windT} />
      <SmallFire x={2.4} z={-7} local={local} grow={windT} />
      <FlameTongue x={0.5} z={-10} local={local} s={0.6 + windT * 0.8} phase={1} />
      {/* kolom asap naik cepat + angin + serpihan */}
      <SmokeColumn x={-1} z={-12} local={local} s={0.9 + windT * 0.5} dark />
      <SmokeColumn x={3} z={-14} local={local} s={0.8} phase={2} dark />
      <WindStreaks local={local} n={10} />
      <FlyingChips local={local} n={14} />
      <Embers local={local} n={12} area={8} />
      <Foreground local={local} />
    </group>
  );
};

const Scene5World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // Firestorm: corong tornado api di tengah, kota terbakar, atap beterbangan.
  const shake = Math.sin(local * 1.7) * 0.06 * Math.min(local / 30, 1);
  return (
    <group position={[shake, 0, 0]}>
      <Sky cfg={cfg} local={local} />
      <Stars local={local} />
      <Hills local={local} colors={["#2c1410", "#241010", "#1c0c08"]} />
      <Ground cfg={cfg} />
      {/* tornado api raksasa di tengah kota (z=-6,5: lebih dekat ke kamera
          supaya dominan; pangkal sempit jatuh di celah antara dua warga,
          puncak lebar menjulang di atas kepala mereka) */}
      <FireVortex x={0} z={-6.5} local={local} />
      {/* lidah api di mana-mana */}
      <FlameTongue x={-3.5} z={-4} local={local} s={0.8} phase={0} />
      <FlameTongue x={3.8} z={-5} local={local} s={0.7} phase={2} />
      <FlameTongue x={-2.5} z={-10} local={local} s={0.9} phase={4} />
      <FlameTongue x={3.2} z={-11} local={local} s={0.8} phase={1} />
      {/* rumah terbakar + gereja terbakar */}
      <WoodHouse x={-3.9} z={-9} local={local} burn={1} />
      <WoodHouse x={4.0} z={-10} local={local} burn={1} />
      <Church x={-1.8} z={-14} local={local} burn={1} />
      {/* pinus tumbang terbakar */}
      <Pine x={-5.2} z={-7} local={local} s={1.0} fall={0.8} burnt />
      <Pine x={5.4} z={-8} local={local} s={1.1} fall={0.65} burnt />
      {/* atap + dinding beterbangan berputar */}
      <FlyingRoof local={local} x0={-2} z={-5} phase={0} />
      <FlyingRoof local={local} x0={2.5} z={-8} phase={2} />
      {/* kolom asap hitam + bara padat */}
      <SmokeColumn x={-2.5} z={-12} local={local} s={1.3} dark />
      <SmokeColumn x={2.5} z={-13} local={local} s={1.2} phase={3} dark />
      <Embers local={local} n={18} area={10} />
      <Foreground local={local} />
    </group>
  );
};

const Scene6World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Stars local={local} />
    <Hills local={local} colors={["#2c1a20", "#241420", "#1c1018"]} />
    {/* sungai di depan, kota terbakar di seberang */}
    <River local={local} />
    {/* jembatan terbakar di seberang sungai */}
    <Bridge x={0} z={-13} burn={1} local={local} />
    {/* kota terbakar di tepi jauh */}
    <WoodHouse x={-3.5} z={-17} local={local} burn={1} w={2.6} h={2.0} />
    <WoodHouse x={3.5} z={-18} local={local} burn={1} w={2.6} h={2.0} />
    <Church x={0} z={-20} local={local} burn={1} />
    {/* pinus tepi sungai sway */}
    <Pine x={-6.8} z={-6} local={local} s={1.0} phase={0} />
    <Pine x={6.9} z={-7} local={local} s={1.1} phase={2} />
    {/* perahu + puing hanyut */}
    <Boat x={-2.5} z={-4} local={local} phase={0} />
    <Boat x={2.8} z={-6} local={local} phase={2} />
    <DriftDebris local={local} />
    {/* asap + bara dari kota */}
    <SmokeColumn x={-2} z={-15} local={local} s={1.1} dark />
    <SmokeColumn x={2.5} z={-16} local={local} s={1.0} phase={2} dark />
    <Embers local={local} n={10} area={8} />
  </group>
);

const Scene7World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.1} local={local} phase={0} />
    <Hills local={local} colors={["#5a4a42", "#4a3a34", "#3a2c28"]} trees={false} />
    <Ground cfg={cfg} />
    {/* kota rata: kerangka hangus + cerobong sisa */}
    <BurntHouse x={-2.8} z={-6} local={local} />
    <BurntHouse x={2.6} z={-8} local={local} s={0.9} />
    <BurntHouse x={0} z={-12} local={local} s={1.1} />
    {/* tunggul hangus + pinus hangus */}
    <CharredStump x={-4.5} z={-4} r={0.4} />
    <CharredStump x={4.4} z={-5} r={1.2} />
    <CharredStump x={-1.5} z={-10} r={2.0} />
    <Pine x={-5.2} z={-11} local={local} s={1.0} fall={0.9} burnt />
    <Pine x={5.4} z={-12} local={local} s={1.1} fall={0.7} burnt />
    {/* asap tipis sisa di mana-mana */}
    <SmokeColumn x={-2} z={-10} local={local} s={0.6} phase={1} />
    <SmokeColumn x={2.5} z={-12} local={local} s={0.5} phase={3} />
    <Embers local={local} n={4} area={6} />
    <Foreground local={local} />
  </group>
);

const Scene8World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-7} y={11} z={-34} s={1} local={local} phase={2} />
    <Hills local={local} colors={["#5a4a42", "#4a3a34", "#3a2c28"]} trees={false} />
    <Ground cfg={cfg} />
    {/* satu cerobong sisa tegak di tengah kehancuran */}
    <BurntHouse x={0} z={-8} local={local} s={1.2} />
    <CharredStump x={-3.5} z={-4} r={0.8} />
    <CharredStump x={3.8} z={-5} r={1.8} />
    <Pine x={-5.0} z={-10} local={local} s={1.0} fall={0.85} burnt />
    <SmokeColumn x={0} z={-10} local={local} s={0.7} phase={0} />
    <Embers local={local} n={3} area={5} />
    <Foreground local={local} />
  </group>
);

/* S9/S10: latar 3D redup di balik overlay DOM 2D (peta / koran) di Video14.
 * Dunia tetap hidup: langit senja + bukit + bara jauh, supaya tidak blank. */
const Scene9World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1} local={local} phase={0} />
    <Hills local={local} colors={["#3a4a5a", "#2c3850", "#24304a"]} />
    <Ground cfg={cfg} />
    <Embers local={local} n={6} area={8} />
    <Foreground local={local} />
  </group>
);

const Scene10World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Stars local={local} />
    <Hills local={local} colors={["#2c2226", "#241c20", "#1c1618"]} />
    <Ground cfg={cfg} />
    <SmokeColumn x={-2} z={-14} local={local} s={0.8} dark />
    <Embers local={local} n={8} area={8} />
    <Foreground local={local} />
  </group>
);

const WORLDS: React.FC<{ local: number; cfg: Cfg }>[] = [
  Scene1World, Scene2World, Scene3World, Scene4World, Scene5World,
  Scene6World, Scene7World, Scene8World, Scene9World, Scene10World,
];


/* Inner: kamera + cahaya per adegan, glide pelan.                     */
/* Warmup delayRender ala v01 supaya still tidak blank.                */
/* ------------------------------------------------------------------ */

const Inner: React.FC<{ scene: number; local: number }> = ({ scene, local }) => {
  const { camera, advance } = useThree();
  const cfg = CFGS[scene];
  const World = WORLDS[scene];
  const [warmHandle] = useState(() => delayRender("peshtigo3d warmup"));
  useEffect(() => {
    const id = setTimeout(() => {
      advance(performance.now());
      continueRender(warmHandle);
    }, 0);
    return () => clearTimeout(id);
  }, [advance, warmHandle]);

  const cam = camera as THREE.PerspectiveCamera;
  // Glide pelan: dolly-in + geser halus selama adegan (bukan diam total).
  // Di-ease (bukan linear): ease-in-out sine untuk dolly.
  const easeInOutSine = (v: number) => -(Math.cos(Math.PI * v) - 1) / 2;
  const t = easeInOutSine(Math.min(local / 200, 1));
  // Drift lateral DIHAPUS (gx = 0): Math.sin(local * 0.01) * 0.12 membuat
  // kamera 3D bergeser kiri-kanan, sehingga latar bergeser melawan
  // karakter 2D yang diam — terbaca goyang kiri-kanan di detik 5-10
  // (diukur di final v2: salib gereja geser ~9px kanan sementara badan
  // karakter geser ~5px kiri, total relatif ~14px selama S2). Dolly-in
  // (gy/gz) dipertahankan.
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

/** Dunia 3D untuk satu adegan. Dipakai Video13 di bawah overlay karakter. */
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
