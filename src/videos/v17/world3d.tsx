// world3d.tsx — DUNIA 3D Pig War (Video17, History Rush #9).
// Pola dari v16/world3d.tsx: ThreeCanvas Remotion + three.js,
// kamera LOCKED-OFF per adegan (aturan kamera bill 28 Nov — tidak ada
// drift kamera 3D sama sekali; satu-satunya gerakan kamera adalah
// 2 push-in di wrapper 2D Video17.tsx).
// Semua prop dibangun dari kode (box/cone/cylinder/sphere + tekstur
// canvas prosedural). TIDAK ADA prop GLB Kenney (folder public/bridge/
// tidak ada). Karakter 2D bean-head + babi tetap overlay DOM di depan
// canvas ini (lihat Video17.tsx); titik pijakan karakter ada di z = 0.
// Lokasi: kebun kentang + farm San Juan Island (S1-4), pantai (S5),
// benteng + laut (S6), geladak kapal (S7), kamp bersama (S8),
// pengibaran bendera (S9).
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
  canvasTex("sand17", 256, 256, (g) => {
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
  canvasTex("grass17", 256, 256, (g) => {
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
  canvasTex("wood17", 256, 256, (g) => {
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
  canvasTex("stone17", 256, 256, (g) => {
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
  canvasTex(`sky17-${top}-${hor}`, 16, 256, (g) => {
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
/* Konfigurasi per adegan — Pacific Northwest, musim panas 1859.       */
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
  // S1 kebun kentang, pagi cerah (hook)
  { skyTop: "#4a86cf", skyHor: "#cfe3f2", fog: "#b8c8d8", groundTex: grassTex, groundColor: "#5a9a58", sunPos: [8, 13, -55], sunR: 3.0, sunColor: "#ffcf6e", camPos: [0, 3.4, 16], camLook: [0, 1.5, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S2 kebun, kamera lebih dekat
  { skyTop: "#4a86cf", skyHor: "#cfe3f2", fog: "#b8c8d8", groundTex: grassTex, groundColor: "#5a9a58", sunPos: [8, 13, -55], sunR: 3.0, sunColor: "#ffcf6e", camPos: [0, 3.0, 13], camLook: [0, 1.3, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S3 farm, siang hangat
  { skyTop: "#4a86cf", skyHor: "#e8d5a0", fog: "#c8bc98", groundTex: grassTex, groundColor: "#5a9a58", sunPos: [8, 13, -55], sunR: 3.2, sunColor: "#ffcf6e", camPos: [0, 3.4, 15], camLook: [0, 1.6, -3], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S4 kebun, sore keemasan (penembakan)
  { skyTop: "#5a7ab0", skyHor: "#ffb36b", fog: "#d8a878", groundTex: grassTex, groundColor: "#5a8a4a", sunPos: [-8, 7, -55], sunR: 3.4, sunColor: "#ff9d45", camPos: [0, 3.2, 14], camLook: [0, 1.4, -2], fov: 46, dirColor: "#ffcf9e", dirPos: [-8, 10, 6], dirInt: 1.4, amb: 0.55, fogNear: 26, fogFar: 90 },
  // S5 pantai pendaratan, pagi biru laut
  { skyTop: "#3a6a9a", skyHor: "#cfe3f2", fog: "#9ab8cc", groundTex: sandTex, groundColor: "#c9a06a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2ead0", camPos: [0, 3.4, 16], camLook: [0, 1.6, -3], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.3, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S6 standoff benteng + laut, siang tegang
  { skyTop: "#4a6a8a", skyHor: "#d8d8c8", fog: "#a8b0a8", groundTex: grassTex, groundColor: "#5a8a4a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2ead0", camPos: [0, 3.6, 15], camLook: [0, 2.0, -4], fov: 46, dirColor: "#e8e6da", dirPos: [8, 14, 6], dirInt: 1.3, amb: 0.55, fogNear: 26, fogFar: 90 },
  // S7 geladak kapal, kelabu laut
  { skyTop: "#5a6a72", skyHor: "#b8c8d0", fog: "#8a98a0", groundTex: sandTex, groundColor: "#8a7a5a", sunPos: [8, 10, -55], sunR: 2.6, sunColor: "#e8e8e0", camPos: [0, 3.4, 14], camLook: [0, 1.6, -3], fov: 46, dirColor: "#d8d8d0", dirPos: [8, 12, 6], dirInt: 1.0, amb: 0.6, fogNear: 26, fogFar: 90 },
  // S8 kamp bersama, siang lembut
  { skyTop: "#5a7ab0", skyHor: "#d8d8c8", fog: "#a8b0a8", groundTex: grassTex, groundColor: "#5a9a58", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2ead0", camPos: [0, 3.2, 15], camLook: [0, 1.4, -3], fov: 46, dirColor: "#e8e6da", dirPos: [8, 14, 6], dirInt: 1.2, amb: 0.55, fogNear: 26, fogFar: 90 },
  // S9 pengibaran bendera, senja keemasan penutup
  { skyTop: "#4a3a5a", skyHor: "#ffb36b", fog: "#a87858", groundTex: grassTex, groundColor: "#5a8a4a", sunPos: [-8, 6, -55], sunR: 3.6, sunColor: "#ff9d45", camPos: [0, 3.4, 15], camLook: [0, 1.8, -3], fov: 46, dirColor: "#ffcf9e", dirPos: [-8, 10, 6], dirInt: 1.3, amb: 0.5, fogNear: 26, fogFar: 90 },
];

/* ------------------------------------------------------------------ */
/* Potongan bersama: langit, awan, bukit, tanah, latar depan, burung.  */
/* ------------------------------------------------------------------ */

const drift = (local: number, amp: number, speed: number, phase = 0) => Math.sin(local * speed + phase) * amp;

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
  let m = lamCache.get("cloud17");
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.45 });
    lamCache.set("cloud17", m);
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

const Foreground = ({ local, tone = "green" }: { local: number; tone?: "sand" | "green" | "dark" }) => (
  <group>
    <Sph p={[-1.7, 0.18, 8.6]} s={[0.6, 0.32, 0.45]} c={tone === "dark" ? "#3a2c22" : tone === "sand" ? "#c9bfa8" : "#7a8a6a"} />
    <Sph p={[1.7, 0.2, 8.4]} s={[0.65, 0.35, 0.45]} c={tone === "dark" ? "#3a2c22" : tone === "sand" ? "#c9bfa8" : "#7a8a6a"} />
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

/** Laut: bidang biru di belakang garis pantai (z < -10), di atas tanah. */
const Sea = ({ local }: { local: number }) => (
  <group>
    <mesh position={[0, 0.08, -30]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#4a86b8")}>
      <planeGeometry args={[140, 40]} />
    </mesh>
    {/* garis buih di tepi pantai */}
    <mesh position={[0, 0.1, -10.5]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#e8f0f8")}>
      <planeGeometry args={[140, 0.7]} />
    </mesh>
    {/* kilau ombak pelan */}
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[-8 + i * 8 + drift(local, 0.4, 0.05, i), 0.1, -20 - i * 6]} rotation={[-Math.PI / 2, 0, 0]} material={basic("#cfe3f2", 0.5)}>
        <planeGeometry args={[6, 0.35]} />
      </mesh>
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Prop — semua dibangun dari kode (box/cone/cylinder/sphere).         */
/* ------------------------------------------------------------------ */

/** Barisan kentang: bedengan tanah cokelat + daun hijau berderet. */
const PotatoPatch = ({ x, z, w = 6, rows = 3 }: { x: number; z: number; w?: number; rows?: number }) => (
  <group position={[x, 0, z]}>
    {Array.from({ length: rows }).map((_, r) => (
      <group key={r} position={[0, 0, -r * 1.4]}>
        <B p={[0, 0.12, 0]} s={[w, 0.24, 1.0]} c="#6a4a2e" map={stoneTex()} />
        {Array.from({ length: Math.floor(w / 0.9) }).map((_, i) => (
          <group key={i} position={[-w / 2 + 0.5 + i * 0.9, 0.3, 0]}>
            <Cone p={[0, 0.25, 0]} s={[0.22, 0.55, 0]} c="#3f8a52" seg={6} />
            <Sph p={[0, 0.45, 0]} s={[0.16, 0.12, 0.16]} c="#4e9d5e" />
          </group>
        ))}
      </group>
    ))}
  </group>
);

/** Rumah farm putih + lumbung merah (Belle Vue Sheep Farm). */
const Farmhouse = ({ x, z, s = 1 }: { x: number; z: number; s?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    {/* rumah utama */}
    <B p={[0, 1.0, 0]} s={[4.2, 2.0, 3.2]} c="#f5f2ea" map={stoneTex()} />
    <Cone p={[0, 2.9, 0]} s={[3.4, 1.8, 0]} c="#8a4a3a" seg={4} r={[0, Math.PI / 4, 0]} />
    <B p={[1.2, 3.2, 0.5]} s={[0.5, 1.2, 0.5]} c="#7a6a5a" />
    <B p={[-0.8, 0.9, 1.62]} s={[0.9, 1.4, 0.1]} c="#5d4023" />
    <B p={[1.0, 1.1, 1.62]} s={[0.7, 0.7, 0.1]} c="#ffd23a" />
    <B p={[-1.6, 1.1, 1.62]} s={[0.7, 0.7, 0.1]} c="#ffd23a" />
    {/* lumbung merah di samping */}
    <B p={[3.8, 0.9, -0.6]} s={[2.6, 1.8, 2.4]} c="#a83a2e" map={woodTex()} />
    <Cone p={[3.8, 2.5, -0.6]} s={[2.2, 1.4, 0]} c="#5d4023" seg={4} r={[0, Math.PI / 4, 0]} />
    <B p={[3.8, 0.8, 0.62]} s={[1.0, 1.2, 0.1]} c="#5d4023" />
  </group>
);

/** Pagar kayu: tiang + 2 rel, sepanjang x. */
const Fence = ({ x, z, len = 10, rotY = 0 }: { x: number; z: number; len?: number; rotY?: number }) => (
  <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
    {Array.from({ length: Math.floor(len / 1.2) + 1 }).map((_, i) => (
      <B key={i} p={[-len / 2 + i * 1.2, 0.55, 0]} s={[0.12, 1.1, 0.12]} c="#7a5a34" map={woodTex()} />
    ))}
    <B p={[0, 0.85, 0]} s={[len, 0.1, 0.08]} c="#8a6a42" map={woodTex()} />
    <B p={[0, 0.4, 0]} s={[len, 0.1, 0.08]} c="#8a6a42" map={woodTex()} />
  </group>
);

/** Pohon cemara Pacific Northwest: 3 kerucut hijau + batang. */
const Fir = ({ x, z, local, s = 1, phase = 0 }: { x: number; z: number; local: number; s?: number; phase?: number }) => {
  const sway = Math.sin(local * 0.05 + phase) * 0.02;
  return (
    <group position={[x, 0, z]} scale={[s, s, s]} rotation={[0, 0, sway]}>
      <Cyl p={[0, 0.5, 0]} s={[0.14, 0.2, 1.0, 0]} c="#5d4023" />
      <Cone p={[0, 1.4, 0]} s={[1.1, 1.6, 0]} c="#2e6a3a" seg={8} />
      <Cone p={[0, 2.3, 0]} s={[0.85, 1.4, 0]} c="#3a7a44" seg={8} />
      <Cone p={[0, 3.1, 0]} s={[0.6, 1.2, 0]} c="#4a8a52" seg={8} />
    </group>
  );
};

/** Meriam lapangan 1859: laras + 2 roda besar + ekor. */
const Cannon = ({ x, z, s = 1, rotY = 0 }: { x: number; z: number; s?: number; rotY?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]} rotation={[0, rotY, 0]}>
    <Cyl p={[0, 0.7, 0.3]} s={[0.16, 0.2, 1.6, 0]} c="#2a2a2e" r={[Math.PI / 2 - 0.15, 0, 0]} />
    <Sph p={[0, 0.78, 1.05]} s={[0.2, 0.2, 0.2]} c="#2a2a2e" />
    <Cyl p={[-0.45, 0.45, 0]} s={[0.42, 0.42, 0.12, 0]} c="#5d4023" r={[0, 0, Math.PI / 2]} seg={12} />
    <Cyl p={[0.45, 0.45, 0]} s={[0.42, 0.42, 0.12, 0]} c="#5d4023" r={[0, 0, Math.PI / 2]} seg={12} />
    <B p={[0, 0.35, -0.5]} s={[0.3, 0.3, 1.0]} c="#6a4a2e" />
  </group>
);

/** Benteng tanah Amerika (redoubt): gundukan + meriam berderet. */
const Redoubt = ({ x, z, n = 3, s = 1 }: { x: number; z: number; n?: number; s?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    <Sph p={[0, -0.6, 0]} s={[5.5, 1.6, 2.6]} c="#7a6248" />
    <Sph p={[-3.4, -0.6, 0.4]} s={[2.6, 1.1, 1.8]} c="#6a5238" />
    <Sph p={[3.4, -0.6, 0.4]} s={[2.6, 1.1, 1.8]} c="#6a5238" />
    {Array.from({ length: n }).map((_, i) => (
      <Cannon key={i} x={-2.4 + i * 2.4} z={0.9} s={0.9} />
    ))}
  </group>
);

/** Kapal perang uap Inggris (fregat, a la HMS Tribune, 31 meriam):
 *  lambung hitam + lubang meriam + 2 tiang layar + cerobong uap. */
const Warship = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const bobY = Math.sin(local * 0.08) * 0.06;
  return (
    <group position={[x, bobY, z]} scale={[s, s, s]}>
      {/* lambung hitam + garis merah */}
      <B p={[0, 1.0, 0]} s={[10, 2.0, 2.6]} c="#1e1e22" />
      <B p={[0, 0.3, 0]} s={[10.1, 0.5, 2.7]} c="#8a2a22" />
      <B p={[0, 2.2, 0]} s={[9.2, 0.5, 2.2]} c="#f5f2ea" />
      {/* lubang meriam */}
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((dx, i) => (
        <B key={i} p={[dx, 1.2, 1.32]} s={[0.35, 0.35, 0.04]} c="#0a0a0a" />
      ))}
      {/* tiang + layar persegi */}
      <Cyl p={[-3, 4.0, 0]} s={[0.06, 0.08, 4.4, 0]} c="#5d4023" />
      <B p={[-3, 4.6, 0]} s={[2.6, 1.6, 0.06]} c="#f5f2ea" />
      <Cyl p={[3, 4.0, 0]} s={[0.06, 0.08, 4.4, 0]} c="#5d4023" />
      <B p={[3, 4.6, 0]} s={[2.6, 1.6, 0.06]} c="#f5f2ea" />
      {/* cerobong uap + asap */}
      <Cyl p={[0, 3.6, 0]} s={[0.35, 0.45, 1.8, 0]} c="#c23a12" />
      <Sph p={[0, 4.8 + ((local * 0.02) % 1) * 1.0, 0]} s={[0.35 + ((local * 0.02) % 1) * 0.3, 0.35, 0.35]} c="#c9c9c9" op={0.4} />
      {/* bendera buritan */}
      <B p={[5.4, 2.6, 0]} s={[0.9, 0.55, 0.04]} c="#c23a12" />
    </group>
  );
};

/** Perahu pendaratan kecil di pantai. */
const Boat = ({ x, z, s = 1, rotY = 0 }: { x: number; z: number; s?: number; rotY?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]} rotation={[0, rotY, 0]}>
    <B p={[0, 0.35, 0]} s={[3.2, 0.7, 1.2]} c="#6a4a2e" map={woodTex()} />
    <B p={[0, 0.75, 0]} s={[2.6, 0.25, 1.0]} c="#8a6a42" />
    <Cyl p={[0, 1.6, 0]} s={[0.05, 0.06, 2.2, 0]} c="#5d4023" />
    <B p={[0.7, 1.9, 0]} s={[1.3, 0.9, 0.04]} c="#f5f2ea" />
  </group>
);

/** Tiang bendera + bendera berkibar: "us" (garis + kanton biru) atau
 *  "uk" (Union Jack sederhana: biru + salib putih/merah). */
const FlagPole = ({ x, z, local, phase = 0, flag = "us", h = 4.4 }: { x: number; z: number; local: number; phase?: number; flag?: "us" | "uk"; h?: number }) => {
  const wave = Math.sin(local * 0.12 + phase) * 0.12;
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, h / 2, 0]} s={[0.06, 0.08, h, 0]} c="#5d4023" />
      <Sph p={[0, h + 0.05, 0]} s={[0.1, 0.1, 0.1]} c="#c9a83a" />
      <group position={[0.7, h - 0.5, 0]} rotation={[0, 0, wave * 0.4]}>
        {flag === "us" ? (
          <group>
            <B p={[0, 0.32, 0]} s={[1.3, 0.2, 0.04]} c="#c23a12" />
            <B p={[0, 0.12, 0]} s={[1.3, 0.2, 0.04]} c="#f5f2ea" />
            <B p={[0, -0.08, 0]} s={[1.3, 0.2, 0.04]} c="#c23a12" />
            <B p={[0, -0.28, 0]} s={[1.3, 0.2, 0.04]} c="#f5f2ea" />
            <B p={[-0.32, 0.22, 0.01]} s={[0.65, 0.4, 0.04]} c="#2e3a5a" />
          </group>
        ) : (
          <group>
            <B p={[0, 0, 0]} s={[1.3, 0.8, 0.04]} c="#2e3a5a" />
            <B p={[0, 0, 0.01]} s={[1.3, 0.16, 0.04]} c="#f5f2ea" />
            <B p={[0, 0, 0.01]} s={[0.16, 0.8, 0.04]} c="#f5f2ea" />
            <B p={[0, 0, 0.02]} s={[1.3, 0.09, 0.04]} c="#c23a12" />
            <B p={[0, 0, 0.02]} s={[0.09, 0.8, 0.04]} c="#c23a12" />
          </group>
        )}
      </group>
    </group>
  );
};

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

/** Tumpukan peti kayu. */
const CrateStack3D = ({ x, z, n = 3, s = 1 }: { x: number; z: number; n?: number; s?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    {Array.from({ length: n }).map((_, i) => (
      <B key={i} p={[(i % 2) * 0.9 - 0.45, 0.35 + Math.floor(i / 2) * 0.72, (i % 2) * 0.2]} s={[0.85, 0.7, 0.85]} c={i % 2 ? "#8a6a42" : "#a8875f"} map={woodTex()} />
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Dunia per adegan.                                                   */
/* ------------------------------------------------------------------ */

const Scene1World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.2} local={local} phase={0} />
    <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Hills colors={["#5a7a52", "#4a6a44", "#3a5a38"]} />
    <Ground cfg={cfg} />
    {/* kebun kentang di tengah + farm di belakang */}
    <PotatoPatch x={0} z={-3} w={7} rows={3} />
    <Farmhouse x={-4.5} z={-12} s={0.9} />
    <Fence x={-5.5} z={-6} len={6} />
    <Fence x={5.5} z={-6} len={6} />
    <Fir x={-6.2} z={-8} local={local} s={1.2} phase={0} />
    <Fir x={6.4} z={-10} local={local} s={1.0} phase={2} />
    <Fir x={-6.8} z={-3} local={local} s={0.9} phase={1} />
    <Bird x={-3} y={11} z={-20} local={local} phase={0} />
    <Bird x={3} y={12} z={-22} local={local} phase={2} />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene2World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Hills colors={["#5a7a52", "#4a6a44", "#3a5a38"]} />
    <Ground cfg={cfg} />
    {/* kebun dekat: bedengan besar + pagar + farm */}
    <PotatoPatch x={0} z={-2} w={8} rows={4} />
    <Fence x={0} z={-7} len={12} />
    <Farmhouse x={4.8} z={-11} s={0.85} />
    <Fir x={-6.0} z={-9} local={local} s={1.1} phase={1} />
    <Fir x={6.6} z={-8} local={local} s={0.95} phase={2} />
    <Bird x={-2} y={11} z={-20} local={local} phase={1} />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene3World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1} local={local} phase={1} />
    <Hills colors={["#5a7a52", "#4a6a44", "#3a5a38"]} />
    <Ground cfg={cfg} />
    {/* halaman farm: rumah + lumbung besar, pagar, kebun kecil */}
    <Farmhouse x={0} z={-9} s={1.15} />
    <Fence x={-5.0} z={-4} len={7} />
    <Fence x={5.0} z={-4} len={7} />
    <PotatoPatch x={-2.5} z={-2} w={4} rows={2} />
    <Fir x={-6.4} z={-10} local={local} s={1.1} phase={0} />
    <Fir x={6.6} z={-11} local={local} s={1.0} phase={2} />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene4World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={6} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Hills colors={["#6a5a44", "#5a4a3a", "#4a3a30"]} />
    <Ground cfg={cfg} />
    {/* kebun sore: bedengan + pagar + farm jauh */}
    <PotatoPatch x={0} z={-3} w={7} rows={3} />
    <Farmhouse x={-4.5} z={-12} s={0.9} />
    <Fence x={-5.5} z={-6} len={6} />
    <Fence x={5.5} z={-6} len={6} />
    <Fir x={-6.2} z={-8} local={local} s={1.2} phase={0} />
    <Fir x={6.4} z={-10} local={local} s={1.0} phase={2} />
    <Bird x={-3} y={11} z={-20} local={local} phase={0} />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene5World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={6} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Ground cfg={cfg} />
    {/* pantai pendaratan: laut + perahu + peti di darat */}
    <Sea local={local} />
    <Boat x={-3.2} z={-6} s={1.1} rotY={0.4} />
    <Boat x={3.4} z={-8} s={0.9} rotY={-0.3} />
    <CrateStack3D x={-2.8} z={-2} n={3} />
    <CrateStack3D x={3.0} z={-2.5} n={2} s={0.9} />
    <FlagPole x={-4.2} z={-3} local={local} phase={0} flag="us" />
    <Fir x={-6.0} z={-4} local={local} s={1.0} phase={1} />
    <Fir x={6.2} z={-5} local={local} s={0.9} phase={2} />
    <Bird x={-3} y={11} z={-20} local={local} phase={0} />
    <Bird x={3} y={12} z={-22} local={local} phase={2} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene6World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.2} local={local} phase={0} />
    <Hills colors={["#5a6a52", "#4a5a44", "#3a4a38"]} />
    <Ground cfg={cfg} />
    {/* standoff: benteng AS di depan, laut + 3 kapal perang di belakang */}
    <Sea local={local} />
    <Warship x={-4.5} z={-22} local={local} s={0.85} />
    <Warship x={0.5} z={-26} local={local} s={0.9} />
    <Warship x={5.5} z={-22} local={local} s={0.8} />
    <Redoubt x={0} z={-4} n={3} s={1.0} />
    <FlagPole x={-3.8} z={-4} local={local} phase={0} flag="us" />
    <FlagPole x={4.0} z={-5} local={local} phase={2} flag="uk" />
    <CrateStack3D x={-3.0} z={-2} n={2} />
    <CrateStack3D x={3.2} z={-2.5} n={2} s={0.9} />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene7World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.2} local={local} phase={0} />
    <Cloud x={7} y={12} z={-38} s={1} local={local} phase={2} />
    <Ground cfg={cfg} />
    {/* geladak kapal perang: laut luas + kapal besar di belakang */}
    <Sea local={local} />
    <Warship x={0} z={-18} local={local} s={1.1} />
    <Warship x={-7} z={-28} local={local} s={0.8} />
    <Bird x={-3} y={11} z={-20} local={local} phase={0} />
    <Bird x={4} y={12} z={-22} local={local} phase={2} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene8World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1} local={local} phase={1} />
    <Hills colors={["#5a7a52", "#4a6a44", "#3a5a38"]} />
    <Ground cfg={cfg} />
    {/* kamp bersama: tenda AS + tenda Inggris, dua bendera, api unggun */}
    <Tent x={-3.8} z={-6} s={1.15} color="#d8cba8" />
    <Tent x={3.9} z={-7} s={1.0} color="#c9bfa8" />
    <Campfire x={0} z={-3} local={local} s={1.0} />
    <FlagPole x={-4.4} z={-4} local={local} phase={0} flag="us" />
    <FlagPole x={3.8} z={-4} local={local} phase={2} flag="uk" />
    <CrateStack3D x={-2.6} z={-2} n={2} />
    <CrateStack3D x={2.8} z={-2.5} n={2} s={0.9} />
    <Fir x={-6.2} z={-9} local={local} s={1.1} phase={0} />
    <Fir x={6.4} z={-10} local={local} s={1.0} phase={2} />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene9World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1} local={local} phase={1} />
    <Hills colors={["#5a4a3a", "#4a3a30", "#3a2c26"]} />
    <Ground cfg={cfg} />
    {/* senja penutup: tiang bendera AS besar + benteng + api unggun */}
    <FlagPole x={0} z={-7} local={local} phase={0} flag="us" h={6.5} />
    <Redoubt x={-3.5} z={-3} n={2} s={0.9} />
    <Campfire x={3.4} z={-2.5} local={local} s={0.9} />
    <Tent x={-4.6} z={-8} s={0.9} color="#d8cba8" />
    <Fir x={6.4} z={-9} local={local} s={1.0} phase={2} />
    <Foreground local={local} tone="green" />
  </group>
);

const WORLDS: React.FC<{ local: number; cfg: Cfg }>[] = [
  Scene1World, Scene2World, Scene3World, Scene4World, Scene5World,
  Scene6World, Scene7World, Scene8World, Scene9World,
];

/* Inner: kamera + cahaya per adegan. KAMERA LOCKED-OFF (aturan kamera
 * bill 28 Nov): posisi kamera TETAP cfg.camPos, tidak ada drift,
 * tidak ada dolly. Warmup delayRender ala v14 supaya still tidak blank. */
/* ------------------------------------------------------------------ */

const Inner: React.FC<{ scene: number; local: number }> = ({ scene, local }) => {
  const { camera, advance } = useThree();
  const cfg = CFGS[scene];
  const World = WORLDS[scene];
  const [warmHandle] = useState(() => delayRender("pigwar3d warmup"));
  useEffect(() => {
    const id = setTimeout(() => {
      advance(performance.now());
      continueRender(warmHandle);
    }, 0);
    return () => clearTimeout(id);
  }, [advance, warmHandle]);

  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(cfg.camPos[0], cfg.camPos[1], cfg.camPos[2]);
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

/** Dunia 3D untuk satu adegan. Dipakai Video17 di bawah overlay karakter. */
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
