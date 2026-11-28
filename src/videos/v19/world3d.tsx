// world3d.tsx — DUNIA 3D Operation Mincemeat (Video19, History Rush #11).
// Pola dari v18/world3d.tsx: ThreeCanvas Remotion + three.js,
// kamera LOCKED-OFF per adegan (aturan kamera bill 28 Nov — tidak ada
// drift kamera 3D sama sekali; satu-satunya gerakan kamera adalah
// 2 push-in di wrapper 2D Video19.tsx).
// Semua prop dibangun dari kode (box/cone/cylinder/sphere + tekstur
// canvas prosedural). TIDAK ADA prop GLB Kenney (folder public/bridge/
// tidak ada). Karakter 2D bean-head tetap overlay DOM di depan
// canvas ini (lihat Video19.tsx); titik pijakan karakter ada di z = 0.
// Lokasi: kantor gelap London (S1, S3, S4, S5), kantor London pagi
// (S2), laut fajar lepas pantai Spanyol + HMS Seraph (S6), markas
// Jerman + peta Mediterania (S7), pantai pendaratan Sisilia (S8),
// senja Huelva + pemakaman (S9).
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
  canvasTex("sand19", 256, 256, (g) => {
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
  canvasTex("grass19", 256, 256, (g) => {
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
  canvasTex("wood19", 256, 256, (g) => {
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

const woodDarkTex = () =>
  canvasTex("wooddark19", 256, 256, (g) => {
    g.fillStyle = "#5a3a22";
    g.fillRect(0, 0, 256, 256);
    const r = rng(11);
    for (let y = 0; y < 256; y += 42) {
      g.fillStyle = y % 84 === 0 ? "#4a2c18" : "#6a4630";
      g.fillRect(0, y, 256, 40);
      g.fillStyle = "rgba(20,10,5,0.6)";
      g.fillRect(0, y + 40, 256, 3);
    }
    g.strokeStyle = "rgba(30,15,5,0.4)";
    g.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const y = r() * 256;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(80, y + r() * 6 - 3, 170, y + r() * 6 - 3, 256, y);
      g.stroke();
    }
  });

const skyTex = (top: string, hor: string) =>
  canvasTex(`sky19-${top}-${hor}`, 16, 256, (g) => {
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
/* Potongan bersama: langit, awan, bukit, tanah, latar depan, burung.  */
/* ------------------------------------------------------------------ */

const drift = (local: number, amp: number, speed: number, phase = 0) => Math.sin(local * speed + phase) * amp;

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
  let m = lamCache.get("cloud19");
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.45 });
    lamCache.set("cloud19", m);
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

/** Laut: bidang biru lebar + kilau ombak pelan. */
const Sea = ({ local, color = "#4a86b8", z = -12, depth = 70 }: { local: number; color?: string; z?: number; depth?: number }) => (
  <group>
    <mesh position={[0, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]} material={lam(color)}>
      <planeGeometry args={[160, depth]} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[-8 + i * 8 + drift(local, 0.4, 0.05, i), 0.08, -20 - i * 6]} rotation={[-Math.PI / 2, 0, 0]} material={basic("#cfe3f2", 0.5)}>
        <planeGeometry args={[6, 0.35]} />
      </mesh>
    ))}
  </group>
);

/** Pohon palem: batang melengkung + 5 pelepah. */
const Palm = ({ x, z, local, s = 1, phase = 0 }: { x: number; z: number; local: number; s?: number; phase?: number }) => {
  const sway = Math.sin(local * 0.05 + phase) * 0.03;
  return (
    <group position={[x, 0, z]} scale={[s, s, s]} rotation={[0, 0, sway]}>
      <Cyl p={[0.3, 1.8, 0]} s={[0.14, 0.22, 3.6, 0]} c="#6a4a2e" r={[0, 0, -0.12]} />
      {[-0.9, -0.45, 0, 0.45, 0.9].map((a, i) => (
        <B key={i} p={[0.6 + Math.sin(a) * 1.1, 3.6 + Math.cos(a) * 0.35, 0]} s={[1.6, 0.12, 0.3]} c={i % 2 ? "#3f8a52" : "#2e7a44"} r={[0, 0, -a * 0.7]} />
      ))}
      <Sph p={[0.55, 3.4, 0]} s={[0.22, 0.18, 0.22]} c="#6a4a2e" />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Prop — semua dibangun dari kode (box/cone/cylinder/sphere).         */
/* ------------------------------------------------------------------ */

/** Ruangan kantor: lantai kayu gelap + dinding belakang + jendela
 *  malam + rak buku. Dinding di z=-6, lantai y=0. Jendela dan rak di
 *  x=±4.2 supaya masuk frustum (kamera fov 46, setengah lebar tampak
 *  di z=-6 hanya ~5.3 unit). */
const Room = ({ wallColor = "#4a3826", floorTex = woodDarkTex }: { wallColor?: string; floorTex?: () => THREE.Texture }) => {
  const tex = useMemo(() => {
    const t = floorTex();
    t.repeat.set(6, 6);
    return t;
  }, [floorTex]);
  return (
    <group>
      {/* lantai (tekstur tampil penuh: warna putih supaya tidak
          dikalikan gelap oleh material) */}
      <mesh position={[0, 0, -2]} rotation={[-Math.PI / 2, 0, 0]} material={lam("#ffffff", tex)}>
        <planeGeometry args={[60, 30]} />
      </mesh>
      {/* dinding belakang */}
      <mesh position={[0, 4, -6]} material={lam(wallColor)}>
        <planeGeometry args={[60, 12]} />
      </mesh>
      {/* jendela malam di dinding (kiri) + bulan */}
      <B p={[-3.0, 3.2, -5.9]} s={[2.6, 3.4, 0.1]} c="#0e1a2e" />
      <B p={[-3.0, 3.2, -5.85]} s={[0.12, 3.4, 0.06]} c="#6a4a2e" />
      <B p={[-3.0, 3.2, -5.85]} s={[2.6, 0.12, 0.06]} c="#6a4a2e" />
      <Disc p={[-3.5, 3.8, -5.8]} s={0.35} c="#f2ead0" />
      {/* rak buku di dinding (kanan) */}
      <B p={[3.0, 1.5, -5.7]} s={[2.4, 3.0, 0.3]} c="#6a4a2e" map={woodDarkTex()} />
      {[-0.8, -0.4, 0, 0.4, 0.8].map((dx, i) => (
        <B key={i} p={[3.0 + dx, 2.2, -5.5]} s={[0.3, 1.0, 0.1]} c={i % 2 ? "#8a2a22" : "#2e4a8a"} />
      ))}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((dx, i) => (
        <B key={i + 5} p={[3.0 + dx, 1.0, -5.5]} s={[0.3, 1.0, 0.1]} c={i % 2 ? "#2e5a34" : "#c9a83a"} />
      ))}
      {/* peta kecil di dinding (tengah) */}
      <B p={[0, 3.6, -5.85]} s={[3.2, 2.0, 0.08]} c="#f2e8d0" />
      <B p={[-0.6, 3.6, -5.78]} s={[1.0, 1.4, 0.04]} c="#7ab8d9" />
      <B p={[0.7, 3.6, -5.78]} s={[1.2, 1.0, 0.04]} c="#c9d6a0" />
    </group>
  );
};

/** Meja kerja besar: permukaan kayu + 4 kaki. Meja dekat (z=+2) supaya
 *  permukaannya mengisi setengah bawah frame — prop 2D duduk di atasnya. */
const Desk = ({ x = 0, z = 2, w = 10, d = 3.4 }: { x?: number; z?: number; w?: number; d?: number }) => (
  <group position={[x, 0, z]}>
    {/* permukaan: warna solid sedang (tekstur gelap x warna gelap = hitam) */}
    <B p={[0, 0.95, 0]} s={[w, 0.18, d]} c="#8a6a42" />
    <B p={[-w / 2 + 0.3, 0.45, -d / 2 + 0.3]} s={[0.25, 0.9, 0.25]} c="#3a2412" />
    <B p={[w / 2 - 0.3, 0.45, -d / 2 + 0.3]} s={[0.25, 0.9, 0.25]} c="#3a2412" />
    <B p={[-w / 2 + 0.3, 0.45, d / 2 - 0.3]} s={[0.25, 0.9, 0.25]} c="#3a2412" />
    <B p={[w / 2 - 0.3, 0.45, d / 2 - 0.3]} s={[0.25, 0.9, 0.25]} c="#3a2412" />
    {/* laci + gagang */}
    <B p={[0, 0.6, d / 2 - 0.05]} s={[w - 1.5, 0.5, 0.1]} c="#6a4a2e" />
    <Sph p={[-2, 0.6, d / 2 + 0.02]} s={[0.08, 0.08, 0.05]} c="#c9a83a" />
    <Sph p={[2, 0.6, d / 2 + 0.02]} s={[0.08, 0.08, 0.05]} c="#c9a83a" />
  </group>
);

/** Lampu meja: alas + tiang + tudung + cahaya hangat (bola basic). */
const Lamp = ({ x, z, warm = true }: { x: number; z: number; warm?: boolean }) => (
  <group position={[x, 1.04, z]}>
    <Cyl p={[0, 0.06, 0]} s={[0.22, 0.28, 0.1, 0]} c="#2a2a2e" />
    <Cyl p={[0, 0.35, 0]} s={[0.04, 0.04, 0.6, 0]} c="#2a2a2e" />
    <Cone p={[0, 0.75, 0]} s={[0.45, 0.5, 0]} c={warm ? "#e8b84a" : "#c9d6e8"} seg={12} />
    <Sph p={[0, 0.55, 0]} s={[0.28, 0.28, 0.28]} c={warm ? "#ffd84a" : "#e8f0f8"} op={0.35} />
  </group>
);

/** Tumpukan kertas + surat di atas meja. */
const Papers = ({ x, z, n = 3 }: { x: number; z: number; n?: number }) => (
  <group position={[x, 1.06, z]}>
    {Array.from({ length: n }).map((_, i) => (
      <B key={i} p={[(i % 2) * 0.3 - 0.15, 0.02 + i * 0.03, (i % 2) * 0.2]} s={[0.9, 0.04, 1.2]} c="#f5f2ea" r={[0, (i % 2 ? 0.15 : -0.1), 0]} />
    ))}
    <B p={[0, 0.12, 0]} s={[0.7, 0.02, 0.06]} c="#a02a22" r={[0, 0.1, 0]} />
  </group>
);

/** Kapal selam HMS Seraph (S-class): lambung silinder + menara +
 *  2 periskop + meriam dek + baling-baling. Acuan anatomy fig1
 *  (48 bagian): lambung, menara, periskop, propeller, nomor P219. */
const Submarine = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const bob = Math.sin(local * 0.06) * 0.06;
  const fwd = Math.min(local * 0.006, 0.8);
  return (
    <group position={[x + fwd, 0.15 + bob, z]} scale={[s, s, s]} rotation={[0, Math.PI / 2, 0]}>
      {/* lambung: silinder horizontal + ujung bulat (diputar: tampak samping) */}
      <Cyl p={[0, 0.5, 0]} s={[0.85, 0.85, 7.0, 0]} c="#4a4a52" r={[Math.PI / 2, 0, 0]} seg={16} />
      <Sph p={[0, 0.5, 3.5]} s={[0.85, 0.85, 1.0]} c="#4a4a52" />
      <Sph p={[0, 0.5, -3.5]} s={[0.85, 0.85, 1.0]} c="#4a4a52" />
      {/* garis air + nomor lambung (pelat putih, sisi kamera) */}
      <B p={[-0.2, 0.85, 1.5]} s={[0.02, 0.25, 0.9]} c="#f5f2ea" />
      <B p={[-0.2, 0.85, -1.0]} s={[0.02, 0.25, 0.9]} c="#f5f2ea" />
      {/* menara (conning tower) */}
      <B p={[0, 1.45, 0.3]} s={[1.4, 1.1, 2.0]} c="#3e3e46" />
      <B p={[0, 2.05, 0.3]} s={[1.0, 0.15, 1.6]} c="#3e3e46" />
      {/* 2 periskop */}
      <Cyl p={[-0.3, 2.6, 0.5]} s={[0.07, 0.07, 0.9, 0]} c="#36363c" />
      <Cyl p={[0.3, 2.45, 0.1]} s={[0.07, 0.07, 0.7, 0]} c="#36363c" />
      {/* meriam dek */}
      <Cyl p={[0, 1.1, 2.2]} s={[0.12, 0.16, 1.1, 0]} c="#36363c" r={[Math.PI / 2 - 0.2, 0, 0]} />
      {/* baling-baling kembar (berputar pelan) */}
      {[-0.4, 0.4].map((dx, i) => (
        <group key={i} position={[dx, 0.5, -3.7]} rotation={[0, 0, local * 0.15 + i]}>
          <B p={[0, 0.3, 0]} s={[0.08, 0.6, 0.05]} c="#8a8a8a" />
          <B p={[0.3, 0, 0]} s={[0.6, 0.08, 0.05]} c="#8a8a8a" />
        </group>
      ))}
      {/* gelombang di haluan */}
      <Sph p={[0, 0.12, 4.2]} s={[1.2, 0.18, 0.6]} c="#cfe3f2" op={0.6} />
    </group>
  );
};

/** Sosok kecil mengapung di laut (hormat: sosok gelap tanpa wajah,
 *  telentang di air, seragam Royal Marines). */
const FloatingFigure = ({ x, z, local }: { x: number; z: number; local: number }) => {
  const driftX = Math.min(local * 0.01, 1.2);
  const bob = Math.sin(local * 0.08) * 0.04;
  return (
    <group position={[x + driftX, 0.12 + bob, z]} scale={[1.6, 1.6, 1.6]}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <Cyl p={[0, 0, 0]} s={[0.28, 0.28, 1.4, 0]} c="#2e3a5a" r={[Math.PI / 2, 0, 0]} seg={10} />
        <Sph p={[0, 0.05, 0.85]} s={[0.3, 0.24, 0.3]} c="#ffe2c2" />
        <Sph p={[0, 0.02, -0.9]} s={[0.2, 0.14, 0.3]} c="#2a2a2e" />
      </group>
      <Sph p={[0, 0.05, 0]} s={[1.0, 0.1, 0.7]} c="#cfe3f2" op={0.35} />
    </group>
  );
};

/** Perahu nelayan + nelayan 3D (duduk, mendayung). Dayung bergerak
 *  kanan lalu kiri bergantian; nelayan tidak bergoyang. */
const RowBoat = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const row = Math.sin(local * 0.12);
  const bob = Math.sin(local * 0.07) * 0.05;
  return (
    <group position={[x, 0.1 + bob, z]} scale={[s, s, s]} rotation={[0, 0.4, 0]}>
      {/* lambung perahu kayu */}
      <B p={[0, 0.25, 0]} s={[1.1, 0.5, 3.2]} c="#6a4a2e" map={woodTex()} />
      <B p={[0, 0.55, 0]} s={[0.9, 0.1, 3.0]} c="#8a6a42" />
      <Sph p={[0, 0.3, 1.6]} s={[0.55, 0.25, 0.3]} c="#6a4a2e" />
      <Sph p={[0, 0.3, -1.6]} s={[0.55, 0.25, 0.3]} c="#6a4a2e" />
      {/* nelayan duduk: badan + kepala + topi datar */}
      <Cyl p={[0, 0.95, -0.3]} s={[0.32, 0.38, 0.8, 0]} c="#6a4a2e" seg={10} />
      <Sph p={[0, 1.5, -0.3]} s={[0.26, 0.26, 0.26]} c="#ffe2c2" />
      <Cyl p={[0, 1.68, -0.3]} s={[0.3, 0.3, 0.08, 0]} c="#4a3220" seg={12} />
      {/* 2 dayung, kanan lalu kiri */}
      <group rotation={[0, 0, row * 0.25]}>
        <Cyl p={[0.7, 0.8, 0.4]} s={[0.05, 0.05, 1.8, 0]} c="#7a5a34" r={[0, 0, 0.9]} />
        <B p={[1.3, 0.35, 0.4]} s={[0.4, 0.08, 0.25]} c="#7a5a34" />
      </group>
      <group rotation={[0, 0, -row * 0.25]}>
        <Cyl p={[-0.7, 0.8, 0.4]} s={[0.05, 0.05, 1.8, 0]} c="#7a5a34" r={[0, 0, -0.9]} />
        <B p={[-1.3, 0.35, 0.4]} s={[0.4, 0.08, 0.25]} c="#7a5a34" />
      </group>
      {/* jaring + keranjang ikan */}
      <Sph p={[0, 0.7, 1.0]} s={[0.3, 0.2, 0.3]} c="#8a7a5a" />
    </group>
  );
};

/** Landing craft LCA (Sisilia): lambung + ramp depan yang turun +
 *  tentara kecil di dalam (kotak). Acuan anatomy fig3 (46 bagian):
 *  ramp berengsel, tentara duduk (paha horizontal, lutut 90 derajat). */
const LandingCraft = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const ramp = Math.min(local / 60, 1);
  const bob = Math.sin(local * 0.08) * 0.05;
  return (
    <group position={[x, 0.1 + bob, z]} scale={[s, s, s]}>
      {/* lambung */}
      <B p={[0, 0.6, 0]} s={[3.2, 1.1, 6.0]} c="#5a5a48" />
      <B p={[0, 1.2, -2.2]} s={[2.6, 0.5, 1.4]} c="#4a4a3a" />
      {/* ramp depan turun (rotasi engsel) */}
      <group position={[0, 0.35, 3.0]} rotation={[ramp * 1.1, 0, 0]}>
        <B p={[0, 0.5, 0]} s={[3.0, 0.15, 1.6]} c="#6a6a3a" />
      </group>
      {/* tentara kecil di dalam craft (duduk) */}
      {[-0.9, 0, 0.9].map((dx, i) => (
        <group key={i} position={[dx, 1.15, -0.5 - i * 0.4]}>
          <Sph p={[0, 0.35, 0]} s={[0.22, 0.22, 0.22]} c="#ffe2c2" />
          <Cyl p={[0, 0.5, 0]} s={[0.26, 0.26, 0.08, 0]} c="#5a5a30" seg={10} />
          <B p={[0, 0, 0]} s={[0.45, 0.4, 0.35]} c="#6a6a3a" />
          <B p={[0, -0.2, 0.35]} s={[0.4, 0.15, 0.5]} c="#4a4a26" />
        </group>
      ))}
      {/* gelombang di haluan */}
      <Sph p={[0, 0.1, 3.6]} s={[1.6, 0.15, 0.5]} c="#cfe3f2" op={0.6} />
    </group>
  );
};

/** Salib pemakaman putih (Huelva). */
const GraveCross = ({ x, z, s = 1 }: { x: number; z: number; s?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    <B p={[0, 0.5, 0]} s={[0.16, 1.0, 0.16]} c="#f5f2ea" />
    <B p={[0, 0.7, 0]} s={[0.6, 0.16, 0.16]} c="#f5f2ea" />
    <Sph p={[0, 0.08, 0]} s={[0.35, 0.1, 0.3]} c="#8a8a7a" />
  </group>
);

/** Peta dinding Eropa (markas Jerman): papan krem + bentuk daratan
 *  sederhana + pin merah di Yunani. */
const WallMap = ({ x, z, w = 4.4, h = 2.8 }: { x: number; z: number; w?: number; h?: number }) => (
  <group position={[x, 0, z]}>
    <B p={[0, 0, 0]} s={[w, h, 0.08]} c="#f2e8d0" />
    <B p={[-1.1, 0.3, 0.06]} s={[1.4, 1.6, 0.04]} c="#7ab8d9" />
    <B p={[0.6, 0.4, 0.06]} s={[1.8, 1.4, 0.04]} c="#c9d6a0" />
    <B p={[1.2, -0.6, 0.06]} s={[0.9, 0.7, 0.04]} c="#e8a06a" />
    <Sph p={[0.9, 0.3, 0.1]} s={[0.14, 0.14, 0.05]} c="#a02a22" />
    <B p={[0.9, 0.75, 0.08]} s={[0.05, 0.5, 0.02]} c="#a02a22" />
  </group>
);

/* ------------------------------------------------------------------ */
/* Konfigurasi per adegan — London 1943, laut Mediterania, Sisilia.    */
/* ------------------------------------------------------------------ */

const CFGS: Cfg[] = [
  // S1 kantor gelap London (hook) — malam, lampu hangat, suram
  { skyTop: "#1a1426", skyHor: "#3a2a3a", fog: "#241a20", groundTex: woodDarkTex, groundColor: "#3a2a1a", sunPos: [-8, 6, -55], sunR: 0.1, sunColor: "#1a1426", camPos: [0, 3.4, 16], camLook: [0, 1.5, -2], fov: 46, dirColor: "#ffd84a", dirPos: [-4, 6, 4], dirInt: 1.5, amb: 0.65, fogNear: 26, fogFar: 90 },
  // S2 kantor London pagi — cahaya pagi lewat jendela
  { skyTop: "#3a4a6a", skyHor: "#cfe3f2", fog: "#8a94a0", groundTex: woodDarkTex, groundColor: "#4a3a26", sunPos: [8, 12, -55], sunR: 2.0, sunColor: "#ffcf6e", camPos: [0, 3.0, 13], camLook: [0, 1.3, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.2, amb: 0.5, fogNear: 28, fogFar: 95 },
  // S3 kantor London, seragam terhampar — pagi tenang
  { skyTop: "#3a4a6a", skyHor: "#cfe3f2", fog: "#8a94a0", groundTex: woodDarkTex, groundColor: "#4a3a26", sunPos: [8, 12, -55], sunR: 2.0, sunColor: "#ffcf6e", camPos: [0, 3.4, 16], camLook: [0, 1.5, -2], fov: 46, dirColor: "#ffe9bb", dirPos: [8, 14, 6], dirInt: 1.2, amb: 0.5, fogNear: 28, fogFar: 95 },
  // S4 close-up meja pocket litter — lampu hangat, gelap di tepi
  { skyTop: "#1a1426", skyHor: "#3a2a3a", fog: "#241a20", groundTex: woodDarkTex, groundColor: "#3a2a1a", sunPos: [-8, 6, -55], sunR: 0.1, sunColor: "#1a1426", camPos: [0, 3.4, 16], camLook: [0, 1.5, -2], fov: 46, dirColor: "#ffd84a", dirPos: [-4, 6, 4], dirInt: 1.6, amb: 0.7, fogNear: 26, fogFar: 90 },
  // S5 kantor London, briefcase diborgol — lampu hangat terfokus
  { skyTop: "#1a1426", skyHor: "#3a2a3a", fog: "#241a20", groundTex: woodDarkTex, groundColor: "#3a2a1a", sunPos: [-8, 6, -55], sunR: 0.1, sunColor: "#1a1426", camPos: [0, 3.4, 16], camLook: [0, 1.5, -2], fov: 46, dirColor: "#ffd84a", dirPos: [-4, 6, 4], dirInt: 1.6, amb: 0.7, fogNear: 26, fogFar: 90 },
  // S6 laut fajar lepas pantai Spanyol — fajar jingga, kabut tipis
  { skyTop: "#4a6a9a", skyHor: "#ffb36b", fog: "#c8a878", groundTex: sandTex, groundColor: "#c9a06a", sunPos: [8, 4, -55], sunR: 3.2, sunColor: "#ff9d45", camPos: [0, 3.0, 14], camLook: [0, 1.2, -4], fov: 46, dirColor: "#ffcf9e", dirPos: [8, 10, 6], dirInt: 1.2, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S7 markas Jerman — dingin, lampu putih
  { skyTop: "#2a2a30", skyHor: "#4a4a52", fog: "#3a3a40", groundTex: woodDarkTex, groundColor: "#3a322a", sunPos: [-8, 6, -55], sunR: 0.1, sunColor: "#2a2a30", camPos: [0, 3.0, 13], camLook: [0, 1.3, -2], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 12, 6], dirInt: 1.1, amb: 0.5, fogNear: 28, fogFar: 95 },
  // S8 pantai Sisilia — siang cerah, laut biru
  { skyTop: "#3a6a9a", skyHor: "#cfe3f2", fog: "#9ab8cc", groundTex: sandTex, groundColor: "#e8d5a0", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2ead0", camPos: [0, 3.4, 15], camLook: [0, 1.6, -3], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.4, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S9 senja Huelva — jingga dalam, hening
  { skyTop: "#4a3a5a", skyHor: "#ffb36b", fog: "#a87858", groundTex: grassTex, groundColor: "#5a8a4a", sunPos: [-8, 5, -55], sunR: 3.6, sunColor: "#ff9d45", camPos: [0, 3.2, 14], camLook: [0, 1.4, -3], fov: 46, dirColor: "#ffcf9e", dirPos: [-8, 10, 6], dirInt: 1.2, amb: 0.5, fogNear: 26, fogFar: 90 },
];

/* ------------------------------------------------------------------ */
/* Dunia per adegan.                                                   */
/* ------------------------------------------------------------------ */

const Scene1World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <color attach="background" args={["#1a1426"]} />
    <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
    <Room />
    <Desk x={0} z={2} />
    <Lamp x={-2.8} z={1.2} warm />
    <Papers x={2.8} z={1.6} n={3} />
  </group>
);

const Scene2World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <color attach="background" args={["#3a4a6a"]} />
    <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
    <Room wallColor="#3a3026" />
    {/* meja dengan peta Sisilia besar + panah merah */}
    <Desk x={0} z={-4} w={9} d={3.0} />
    <B p={[0, 1.1, -4]} s={[4.4, 0.06, 2.6]} c="#f2e8d0" r={[-0.08, 0, 0]} />
    <B p={[-0.8, 1.16, -4.2]} s={[1.6, 0.04, 1.4]} c="#7ab8d9" r={[-0.08, 0, 0]} />
    <B p={[0.9, 1.16, -3.9]} s={[1.8, 0.04, 1.2]} c="#e8a06a" r={[-0.08, 0, 0]} />
    <B p={[0.2, 1.2, -4]} s={[2.2, 0.05, 0.12]} c="#a02a22" r={[-0.08, 0.5, 0]} />
    <Lamp x={-3.6} z={-3.4} warm />
    <Papers x={3.4} z={-3.6} n={2} />
    <Bird x={-3} y={11} z={-20} local={local} phase={0} />
  </group>
);

const Scene3World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <color attach="background" args={["#3a4a6a"]} />
    <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
    <Room wallColor="#3a3026" />
    <Desk x={0} z={2} />
    <Lamp x={-2.8} z={1.2} warm />
    <Papers x={2.8} z={1.6} n={2} />
    {/* topi dan sabuk di meja (seragam utama ada di overlay 2D) */}
    <Cyl p={[-2.6, 1.15, 2.2]} s={[0.5, 0.5, 0.18, 0]} c="#1f2a44" seg={14} />
    <B p={[2.6, 1.12, 2.0]} s={[1.2, 0.08, 0.3]} c="#141c30" />
  </group>
);

const Scene4World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <color attach="background" args={["#1a1426"]} />
    <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
    <Room />
    <Desk x={0} z={2} />
    <Lamp x={-2.8} z={1.0} warm />
    <Lamp x={2.8} z={1.0} warm />
  </group>
);

const Scene5World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <color attach="background" args={["#1a1426"]} />
    <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
    <Room />
    <Desk x={0} z={2} />
    <Lamp x={-2.8} z={1.2} warm />
    <Papers x={2.8} z={1.6} n={4} />
  </group>
);

const Scene6World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Sea local={local} color="#5a7a9a" />
    {/* HMS Seraph di laut fajar */}
    <Submarine x={-1.5} z={-9} local={local} s={0.8} />
    {/* sosok kecil mengapung menjauhi kapal */}
    <FloatingFigure x={0.0} z={-5.5} local={local} />
    {/* nelayan di perahu */}
    <RowBoat x={3.2} z={-3.5} local={local} s={1.0} />
    <Bird x={-7} y={7} z={-20} local={local} phase={0} />
    <Bird x={6} y={7.5} z={-22} local={local} phase={2} />
  </group>
);

const Scene7World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <color attach="background" args={["#2a2a30"]} />
    <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
    <Room wallColor="#33302e" />
    {/* peta Eropa di dinding + meja dengan surat-surat */}
    <WallMap x={0} z={-5.8} />
    <Desk x={0} z={-4} w={9} d={3.0} />
    <Papers x={-1.5} z={-4} n={4} />
    <Papers x={2.0} z={-4} n={3} />
    <Lamp x={-3.6} z={-3.4} warm={false} />
  </group>
);

const Scene8World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Hills colors={["#6a5a44", "#5a4a3a", "#4a3a30"]} />
    <Ground cfg={cfg} />
    {/* laut di belakang pantai (pasir di depan, pasukan di pasir) */}
    <Sea local={local} color="#4a86b8" z={-30} depth={30} />
    {/* landing craft merapat di garis air, ramp turun */}
    <LandingCraft x={0} z={-16} local={local} s={1.0} />
    <LandingCraft x={-4} z={-20} local={local} s={0.85} />
    <Palm x={-7.4} z={-6} local={local} s={1.1} phase={0} />
    <Palm x={7.6} z={-7} local={local} s={1.0} phase={2} />
    <Bird x={-6} y={9} z={-20} local={local} phase={0} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene9World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1} local={local} phase={1} />
    <Hills colors={["#5a4a3a", "#4a3a30", "#3a2c26"]} trees={false} />
    <Ground cfg={cfg} />
    {/* pemakaman Huelva: salib-salib putih di bukit, laut jauh */}
    <GraveCross x={-3.5} z={-6} s={1.1} />
    <GraveCross x={-1.2} z={-7} s={1.0} />
    <GraveCross x={1.2} z={-6.5} s={1.15} />
    <GraveCross x={3.6} z={-7.5} s={0.95} />
    <GraveCross x={0} z={-9} s={1.0} />
    <Palm x={-6.2} z={-8} local={local} s={1.1} phase={0} />
    <Palm x={6.2} z={-9} local={local} s={1.0} phase={2} />
    <Bird x={-3} y={11} z={-20} local={local} phase={0} />
    <Foreground local={local} tone="dark" />
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
  const [warmHandle] = useState(() => delayRender("mincemeat3d warmup"));
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

/** Dunia 3D untuk satu adegan. Dipakai Video19 di bawah overlay karakter. */
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
