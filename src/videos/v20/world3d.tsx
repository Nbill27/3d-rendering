// world3d.tsx — DUNIA 3D War of the Pacific (Video20, History Rush #12).
// Pola dari v18/world3d.tsx: ThreeCanvas Remotion + three.js,
// kamera LOCKED-OFF per adegan (aturan kamera bill 28 Nov — tidak ada
// drift kamera 3D sama sekali; satu-satunya gerakan kamera adalah
// 2 push-in di wrapper 2D Video20.tsx).
// Semua prop dibangun dari kode (box/cone/cylinder/sphere + tekstur
// canvas prosedural). TIDAK ADA prop GLB Kenney (folder public/bridge/
// tidak ada). Karakter 2D bean-head tetap overlay DOM di depan
// canvas ini (lihat Video20.tsx); titik pijakan karakter ada di z = 0.
// Lokasi: gurun Atacama (S1, S2, S3), kantor perusahaan Antofagasta
// (S4), pelabuhan Antofagasta (S5), ruangan perjanjian rahasia (S6),
// laut Iquique + Angamos, Huascar vs Esmeralda (S7), darat Tacna-Arica
// (S8), pantai Pasifik tenang (S9, di balik peta + foto).
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
  canvasTex("sand20", 256, 256, (g) => {
    g.fillStyle = "#e8d5a0";
    g.fillRect(0, 0, 256, 256);
    const r = rng(55);
    for (let i = 0; i < 1100; i++) {
      const v = 200 + Math.floor(r() * 55);
      g.fillStyle = `rgb(${v},${v - 25},${v - 90})`;
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
  });

/** Gurun Atacama: pasir pucat kering + batu-batu kecil gelap. */
const desertTex = () =>
  canvasTex("desert20", 256, 256, (g) => {
    g.fillStyle = "#dcc49a";
    g.fillRect(0, 0, 256, 256);
    const r = rng(91);
    for (let i = 0; i < 900; i++) {
      const v = 190 + Math.floor(r() * 55);
      g.fillStyle = `rgb(${v},${v - 30},${v - 95})`;
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = r() > 0.5 ? "#8a7a5a" : "#6a5a44";
      g.beginPath();
      g.arc(r() * 256, r() * 256, 2 + r() * 4, 0, Math.PI * 2);
      g.fill();
    }
  });

/** Garam/nitrat putih: dasar hampir putih + kristal berkilau. */
const saltTex = () =>
  canvasTex("salt20", 256, 256, (g) => {
    g.fillStyle = "#f2efe6";
    g.fillRect(0, 0, 256, 256);
    const r = rng(17);
    for (let i = 0; i < 700; i++) {
      const v = 225 + Math.floor(r() * 30);
      g.fillStyle = `rgb(${v},${v},${v - 8})`;
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = "rgba(255,255,255,0.9)";
      g.beginPath();
      g.arc(r() * 256, r() * 256, 1.5 + r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });


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

const woodTex = () =>
  canvasTex("wood20", 256, 256, (g) => {
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
  canvasTex("wooddark20", 256, 256, (g) => {
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
  canvasTex(`sky20-${top}-${hor}`, 16, 256, (g) => {
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
  let m = lamCache.get("cloud20");
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.45 });
    lamCache.set("cloud20", m);
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
    {tone === "sand" ? (
      <>
        {/* gurun Atacama: batu-batu kering cokelat, BUKAN semak hijau */}
        <Sph p={[-1.4, 0.15, 8.6]} s={[0.35, 0.22, 0.3]} c="#8a6a4a" />
        <Sph p={[1.3, 0.18, 8.5]} s={[0.42, 0.25, 0.32]} c="#7a5a3a" />
        <Sph p={[-0.4, 0.12, 8.7]} s={[0.28, 0.16, 0.24]} c="#9a7a52" />
        <Sph p={[0.4, 0.1, 8.8]} s={[0.22, 0.14, 0.2]} c="#6a4a2e" />
        <Sph p={[-0.9, 0.08, 8.9]} s={[0.18, 0.1, 0.16]} c="#a8875e" />
        <Sph p={[0.9, 0.09, 8.9]} s={[0.16, 0.1, 0.14]} c="#8a6a4a" />
      </>
    ) : (
      <>
        {[-1.4, 1.3, -0.4].map((x, i) => (
          <group key={i} position={[x, 0, 8.6]} rotation={[0, 0, Math.sin(local * 0.07 + i) * 0.05]}>
            <Cone p={[0, 0.35, 0]} s={[0.28, 0.7, 0]} c={tone === "dark" ? "#4a5d3a" : "#3e7d4e"} seg={6} />
            <Cone p={[0.3, 0.3, 0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e9d5e"} seg={6} />
            <Cone p={[-0.3, 0.3, -0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e9d5e"} seg={6} />
          </group>
        ))}
      </>
    )}
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

/** Tumpukan guano putih + sekop bersandar. Motif yang diulang: muncul
 *  di S1 (hook), S2 (oficina), S3 (di timbangan, 2D) dan S9 (pantai
 *  tenang, balasan visual untuk twist). Bentuknya SENGAJA tidak beraturan:
 *  gumpalan-gumpalan tumpang tindih dengan bintik cokelat, seperti
 *  gundukan kotoran burung asli — BUKAN kerucut rapi (pernah terbaca
 *  seperti piramida/tenda di still S1). */
const GuanoPile = ({ x, z, s = 1, local = 0 }: { x: number; z: number; s?: number; local?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    {/* gundukan utama: gumpalan tumpang tindih, tepi kasar */}
    <Sph p={[0, 0.45, 0]} s={[1.5, 0.85, 1.2]} c="#f2efe6" />
    <Sph p={[0.9, 0.35, 0.35]} s={[1.0, 0.6, 0.9]} c="#e8e4d8" />
    <Sph p={[-0.95, 0.3, 0.4]} s={[0.85, 0.55, 0.8]} c="#f5f2ea" />
    <Sph p={[0.2, 0.85, -0.2]} s={[0.8, 0.5, 0.7]} c="#efe9da" />
    <Sph p={[-0.4, 0.7, 0.5]} s={[0.6, 0.4, 0.55]} c="#f2efe6" />
    <Sph p={[0.75, 0.7, -0.35]} s={[0.5, 0.32, 0.45]} c="#e8e4d8" />
    {/* bintik cokelat = kotoran kering di permukaan gundukan */}
    <Sph p={[0.5, 0.78, 0.75]} s={[0.18, 0.08, 0.15]} c="#c9a86a" />
    <Sph p={[-0.5, 0.72, 0.85]} s={[0.15, 0.07, 0.12]} c="#b08d5a" />
    <Sph p={[0.1, 1.12, 0.15]} s={[0.14, 0.06, 0.12]} c="#c9a86a" />
    <Sph p={[1.15, 0.55, 0.7]} s={[0.12, 0.06, 0.1]} c="#b08d5a" />
    <Sph p={[-1.1, 0.5, 0.75]} s={[0.13, 0.06, 0.11]} c="#c9a86a" />
    {/* sekop bersandar di tumpukan */}
    <Cyl p={[1.6, 0.9, 0.6]} s={[0.05, 0.05, 1.8, 0]} c="#7a5a34" r={[0, 0, 0.5]} />
    <B p={[1.95, 0.15, 0.6]} s={[0.35, 0.5, 0.06]} c="#8a8a8a" r={[0, 0, 0.5]} />
    {/* gumpalan guano putih di tanah */}
    <Sph p={[-0.6, 0.08, 1.0]} s={[0.3, 0.12, 0.25]} c="#f2efe6" />
    <Sph p={[0.8, 0.08, 1.1]} s={[0.25, 0.1, 0.2]} c="#f2efe6" />
    <Sph p={[0.1, 0.08, -1.0]} s={[0.28, 0.1, 0.22]} c="#e8e4d8" />
  </group>
);

/** Burung laut bertengger (S1 hook): badan kecil putih, sayap gelap,
 *  kepala + paruh kuning, kaki tipis. Bertengger di atas tumpukan guano
 *  supaya tumpukan itu langsung kebaca "kotoran burung". */
const PerchedBird = ({ x, y, z, s = 1, rotY = 0 }: { x: number; y: number; z: number; s?: number; rotY?: number }) => (
  <group position={[x, y, z]} rotation={[0, rotY, 0]} scale={[s, s, s]}>
    {/* kaki tipis */}
    <Cyl p={[-0.06, 0.08, 0]} s={[0.02, 0.02, 0.16, 0]} c="#3a3a3a" />
    <Cyl p={[0.06, 0.08, 0]} s={[0.02, 0.02, 0.16, 0]} c="#3a3a3a" />
    {/* badan putih + sayap gelap di sisi */}
    <Sph p={[0, 0.3, 0]} s={[0.22, 0.18, 0.3]} c="#f5f2ea" />
    <B p={[-0.2, 0.3, 0]} s={[0.04, 0.16, 0.34]} c="#5a6a7a" r={[0, 0, 0.15]} />
    <B p={[0.2, 0.3, 0]} s={[0.04, 0.16, 0.34]} c="#5a6a7a" r={[0, 0, -0.15]} />
    {/* kepala + paruh kuning */}
    <Sph p={[0, 0.5, 0.14]} s={[0.12, 0.12, 0.12]} c="#f5f2ea" />
    <Cone p={[0, 0.48, 0.34]} s={[0.05, 0.2, 0]} c="#e8a33d" r={[Math.PI / 2, 0, 0]} seg={6} />
  </group>
);

/** Oficina salitrera (S2): tumpukan caliche, rel + kereta bijih yang
 *  meluncur lurus, mesin penghancur + roda giling berputar, 3 bak rebus
 *  beruap, cerobong, gubuk kantor. Acuan anatomy fig2 (53 bagian):
 *  kereta meluncur di rel, roda giling berputar, uap bak rebus. */
const Oficina = ({ x, z, local }: { x: number; z: number; local: number }) => {
  const cartX = -3.2 + Math.min(local * 0.03, 5.6);
  const wheelSpin = local * 0.12;
  const steam = (phase: number) => {
    const t = (local * 0.02 + phase) % 1;
    return { y: 2.2 + t * 1.6, o: 0.55 * (1 - t), s: 0.3 + t * 0.5 };
  };
  const st1 = steam(0), st2 = steam(0.33), st3 = steam(0.66);
  return (
    <group position={[x, 0, z]}>
      {/* tumpukan caliche (bijih) */}
      <Cone p={[-4.5, 0.8, -2]} s={[1.6, 1.6, 0]} c="#c9b896" seg={10} />
      <Cone p={[-3.2, 0.6, -1]} s={[1.1, 1.2, 0]} c="#d8c8a4" seg={10} />
      <Cone p={[4.6, 0.7, -2]} s={[1.3, 1.4, 0]} c="#c9b896" seg={10} />
      {/* rel kereta: 2 rel + bantalan */}
      <B p={[0, 0.06, 1.5]} s={[9.0, 0.08, 0.14]} c="#4a4a4a" />
      <B p={[0, 0.06, 2.3]} s={[9.0, 0.08, 0.14]} c="#4a4a4a" />
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((dx) => (
        <B key={dx} p={[dx, 0.04, 1.9]} s={[0.18, 0.06, 1.1]} c="#6a4a2e" />
      ))}
      {/* kereta bijih meluncur lurus di rel */}
      <group position={[cartX, 0, 1.9]}>
        <B p={[0, 0.45, 0]} s={[1.4, 0.5, 0.9]} c="#5a3a22" />
        <B p={[0, 0.75, 0]} s={[1.2, 0.25, 0.7]} c="#c9b896" />
        {[-0.45, 0.45].map((dx) => (
          <group key={dx} position={[dx, 0.22, 0.48]} rotation={[0, 0, wheelSpin]}>
            <Cyl p={[0, 0, 0]} s={[0.2, 0.2, 0.08, 0]} c="#2a2a2e" r={[Math.PI / 2, 0, 0]} seg={10} />
          </group>
        ))}
        {[-0.45, 0.45].map((dx) => (
          <group key={`b${dx}`} position={[dx, 0.22, -0.48]} rotation={[0, 0, wheelSpin]}>
            <Cyl p={[0, 0, 0]} s={[0.2, 0.2, 0.08, 0]} c="#2a2a2e" r={[Math.PI / 2, 0, 0]} seg={10} />
          </group>
        ))}
      </group>
      {/* mesin penghancur + roda giling berputar */}
      <B p={[1.8, 0.7, -1.5]} s={[1.6, 1.4, 1.2]} c="#6a4a3a" />
      <B p={[1.8, 1.5, -1.5]} s={[1.0, 0.3, 0.8]} c="#4a3226" />
      <group position={[1.8, 0.9, -0.8]} rotation={[0, 0, wheelSpin]}>
        <Cyl p={[0, 0, 0]} s={[0.55, 0.55, 0.18, 0]} c="#3a3a3a" r={[Math.PI / 2, 0, 0]} seg={12} />
        <B p={[0, 0.4, 0]} s={[0.1, 0.8, 0.2]} c="#8a8a8a" />
        <B p={[0.4, 0, 0]} s={[0.8, 0.1, 0.2]} c="#8a8a8a" />
      </group>
      {/* 3 bak rebus (cachucho) + uap naik */}
      {[-2.2, -0.9, 0.4].map((dx, i) => (
        <group key={i} position={[dx, 0, -3.2]}>
          <Cyl p={[0, 0.5, 0]} s={[0.55, 0.55, 1.0, 0]} c="#7a7a72" seg={12} />
          <Cyl p={[0, 1.02, 0]} s={[0.5, 0.5, 0.08, 0]} c="#4a4a42" seg={12} />
        </group>
      ))}
      <Sph p={[-2.2, st1.y, -3.2]} s={[st1.s, st1.s, st1.s]} c="#ffffff" op={st1.o} />
      <Sph p={[-0.9, st2.y, -3.2]} s={[st2.s, st2.s, st2.s]} c="#ffffff" op={st2.o} />
      <Sph p={[0.4, st3.y, -3.2]} s={[st3.s, st3.s, st3.s]} c="#ffffff" op={st3.o} />
      {/* cerobong tungku + asap */}
      <Cyl p={[3.6, 1.8, -3.0]} s={[0.35, 0.5, 3.6, 0]} c="#5a3a2a" seg={12} />
      <Sph p={[3.6, 3.9 + Math.sin(local * 0.05) * 0.15, -3.0]} s={[0.5, 0.4, 0.5]} c="#d8d8d8" op={0.5} />
      {/* gubuk kantor perusahaan */}
      <B p={[-5.8, 0.9, -3.5]} s={[2.2, 1.8, 1.6]} c="#8a6a42" map={woodTex()} />
      <Cone p={[-5.8, 2.2, -3.5]} s={[1.7, 0.9, 0]} c="#a03a22" seg={4} r={[0, Math.PI / 4, 0]} />
      <B p={[-5.8, 0.7, -2.68]} s={[0.6, 1.2, 0.08]} c="#3a2412" />
    </group>
  );
};

/** Dermaga kayu pelabuhan Antofagasta (S5): papan dermaga menjorok ke
 *  laut + tiang-tiang di tepi frame (foreground framing) + peti + tong. */
const Dock = ({ x, z, local }: { x: number; z: number; local: number }) => (
  <group position={[x, 0, z]}>
    {/* papan dermaga */}
    <B p={[0, 0.35, 0]} s={[10, 0.18, 3.0]} c="#8a6a42" map={woodTex()} />
    {/* tiang dermaga di tepi frame (foreground) */}
    <Cyl p={[-4.6, 0.9, 1.2]} s={[0.16, 0.2, 1.8, 0]} c="#5a3a22" seg={10} />
    <Cyl p={[4.6, 0.9, 1.2]} s={[0.16, 0.2, 1.8, 0]} c="#5a3a22" seg={10} />
    <Cyl p={[-4.6, 0.9, -1.2]} s={[0.16, 0.2, 1.8, 0]} c="#5a3a22" seg={10} />
    <Cyl p={[4.6, 0.9, -1.2]} s={[0.16, 0.2, 1.8, 0]} c="#5a3a22" seg={10} />
    {/* peti + tong di dermaga */}
    <B p={[-3.2, 0.75, -0.6]} s={[0.9, 0.9, 0.9]} c="#a8724a" map={woodTex()} />
    <B p={[-3.2, 1.6, -0.6]} s={[0.7, 0.7, 0.7]} c="#8a6a42" map={woodTex()} />
    <Cyl p={[3.4, 0.75, -0.5]} s={[0.4, 0.4, 1.0, 0]} c="#6a4a2e" seg={12} />
    <Cyl p={[3.4, 0.75, 0.5]} s={[0.4, 0.4, 1.0, 0]} c="#7a5a34" seg={12} />
    {/* tali melingkar */}
    <Cyl p={[1.8, 0.5, 0.8]} s={[0.45, 0.45, 0.18, 0]} c="#c9b896" seg={12} />
    <Cyl p={[1.8, 0.56, 0.8]} s={[0.32, 0.32, 0.2, 0]} c="#a89878" seg={12} />
  </group>
);

/** Monitor Huascar (S7): lambung besi + haluan pendobrak + menara Coles
 *  yang berputar (2 meriam 10 inci) + cerobong + 2 tiang + bendera Peru.
 *  Acuan anatomy fig1 (52 bagian) dan figur Hairline huascar.js:
 *  menara berputar, baling-baling berputar, haluan pendobrak di depan.
 *  Kapal bergerak maju ke arah Esmeralda; menara membidik selama adegan. */
const Huascar = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const fwd = Math.min(local * 0.012, 1.6);
  const bob = Math.sin(local * 0.06) * 0.05;
  const turretYaw = -0.45 + Math.min(local / 140, 1) * 0.9;
  const flash = local >= 55 && local <= 68 ? 1 - Math.abs(local - 61.5) / 6.5 : 0;
  const recoil = local >= 55 && local <= 75 ? Math.sin(((local - 55) / 20) * Math.PI) * 0.35 : 0;
  return (
    <group position={[x + fwd, 0.1 + bob, z]} scale={[s, s, s]}>
      {/* lambung besi gelap + garis air */}
      <B p={[0, 0.55, 0]} s={[6.4, 1.0, 1.9]} c="#3a3a42" />
      <Sph p={[3.2, 0.55, 0]} s={[0.95, 0.5, 0.95]} c="#3a3a42" />
      <Sph p={[-3.2, 0.55, 0]} s={[0.95, 0.5, 0.95]} c="#3a3a42" />
      <B p={[0, 0.72, 0.96]} s={[6.0, 0.22, 0.04]} c="#c23a12" />
      {/* haluan pendobrak: kerucut ke depan */}
      <Cone p={[4.1, 0.45, 0]} s={[0.55, 1.6, 0]} c="#2a2a30" r={[0, 0, -Math.PI / 2]} seg={10} />
      {/* dek */}
      <B p={[0, 1.1, 0]} s={[5.6, 0.18, 1.7]} c="#4a4a46" />
      {/* menara Coles berputar + 2 meriam 10 inci */}
      <group position={[0.4, 1.2, 0]} rotation={[0, turretYaw, 0]}>
        <group position={[-recoil, 0, 0]}>
          <Cyl p={[0, 0.45, 0]} s={[1.05, 1.05, 0.9, 0]} c="#2e2e34" seg={16} />
          <Cyl p={[0, 0.95, 0]} s={[0.95, 0.95, 0.12, 0]} c="#3e3e46" seg={16} />
          <Cyl p={[1.3, 0.75, -0.35]} s={[0.16, 0.2, 2.0, 0]} c="#2a2a2e" r={[0, 0, Math.PI / 2 - 0.08]} seg={10} />
          <Cyl p={[1.3, 0.75, 0.35]} s={[0.16, 0.2, 2.0, 0]} c="#2a2a2e" r={[0, 0, Math.PI / 2 - 0.08]} seg={10} />
        </group>
      </group>
      {/* kilat moncong saat menembak */}
      {flash > 0 && (
        <group position={[2.9, 1.95, 0]}>
          <Sph p={[0, 0, 0]} s={[0.55 * flash, 0.55 * flash, 0.55 * flash]} c="#ffd84a" op={0.9} />
          <Sph p={[0.3, 0, 0]} s={[0.35 * flash, 0.35 * flash, 0.35 * flash]} c="#ff9d45" op={0.8} />
        </group>
      )}
      {/* cerobong + asap */}
      <Cyl p={[-1.6, 1.9, 0]} s={[0.35, 0.45, 1.5, 0]} c="#1f1f24" seg={12} />
      <Cyl p={[-1.6, 2.7, 0]} s={[0.42, 0.42, 0.18, 0]} c="#3a3a3a" seg={12} />
      <Sph p={[-1.9, 3.1 + Math.sin(local * 0.05) * 0.12, 0]} s={[0.4, 0.32, 0.4]} c="#d8d8d8" op={0.45} />
      {/* 2 tiang + layar kecil */}
      <Cyl p={[-2.6, 2.2, 0]} s={[0.07, 0.09, 2.2, 0]} c="#4a3220" seg={8} />
      <Cyl p={[2.2, 2.0, 0]} s={[0.07, 0.09, 1.8, 0]} c="#4a3220" seg={8} />
      <B p={[2.2, 2.6, 0]} s={[0.9, 0.08, 0.05]} c="#4a3220" />
      {/* bendera Peru (merah-putih-merah vertikal) di tiang belakang */}
      <Cyl p={[-2.6, 3.5, 0]} s={[0.04, 0.04, 0.9, 0]} c="#4a3220" seg={8} />
      <B p={[-2.35, 3.75, 0]} s={[0.12, 0.5, 0.02]} c="#c23a12" />
      <B p={[-2.23, 3.75, 0]} s={[0.12, 0.5, 0.02]} c="#f5f2ea" />
      <B p={[-2.11, 3.75, 0]} s={[0.12, 0.5, 0.02]} c="#c23a12" />
      {/* baling-baling + gelombang di haluan */}
      <group position={[-3.6, 0.3, 0]} rotation={[0, 0, local * 0.2]}>
        <B p={[0, 0.3, 0]} s={[0.08, 0.6, 0.05]} c="#8a8a8a" />
        <B p={[0.3, 0, 0]} s={[0.6, 0.08, 0.05]} c="#8a8a8a" />
      </group>
      <Sph p={[4.4, 0.08, 0]} s={[1.0, 0.12, 0.7]} c="#cfe3f2" op={0.55} />
    </group>
  );
};

/** Korvet Esmeralda (S7): lambung kayu + 3 tiang + layar + bendera
 *  Chile. Kapal miring dan tenggelam pelan selama adegan (hormat: tanpa
 *  ledakan; hanya miring lalu merunduk ke air). */
const Esmeralda = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const list = Math.max(0, (local - 60) / 170) * 0.22;
  const sink = Math.max(0, (local - 60) / 170) * 0.55;
  const bob = Math.sin(local * 0.07 + 1) * 0.05;
  return (
    <group position={[x, 0.1 + bob - sink, z]} scale={[s, s, s]} rotation={[0, 0, list]}>
      {/* lambung kayu + garis air */}
      <B p={[0, 0.6, 0]} s={[5.6, 1.1, 1.8]} c="#6a4a2e" map={woodTex()} />
      <Sph p={[2.8, 0.6, 0]} s={[0.9, 0.55, 0.9]} c="#6a4a2e" />
      <Sph p={[-2.8, 0.6, 0]} s={[0.9, 0.55, 0.9]} c="#6a4a2e" />
      <B p={[0, 0.8, 0.92]} s={[5.2, 0.2, 0.04]} c="#f5f2ea" />
      {/* dek + pagar */}
      <B p={[0, 1.2, 0]} s={[5.0, 0.14, 1.6]} c="#8a6a42" />
      <B p={[0, 1.4, 0.8]} s={[5.0, 0.3, 0.06]} c="#5a3a22" />
      {/* 3 tiang + layar putih */}
      {[-1.8, 0, 1.8].map((dx, i) => (
        <group key={i} position={[dx, 0, 0]}>
          <Cyl p={[0, 2.6, 0]} s={[0.08, 0.1, 2.8, 0]} c="#4a3220" seg={8} />
          <B p={[0, 3.2, 0]} s={[1.5, 0.08, 0.05]} c="#4a3220" />
          <B p={[0, 2.4, 0]} s={[1.4, 1.5, 0.04]} c="#f5f2ea" />
        </group>
      ))}
      {/* bendera Chile di tiang belakang */}
      <B p={[-1.55, 4.2, 0]} s={[0.1, 0.5, 0.02]} c="#f5f2ea" />
      <B p={[-1.43, 4.2, 0]} s={[0.1, 0.5, 0.02]} c="#c23a12" />
      <Sph p={[-1.7, 4.35, 0]} s={[0.09, 0.09, 0.05]} c="#2a4a8a" />
      {/* gelombang di haluan + asap dari lambung yang terbakar */}
      <Sph p={[-3.0, 0.1, 0]} s={[0.9, 0.12, 0.6]} c="#cfe3f2" op={0.5} />
      <Sph p={[0.5, 2.0 + Math.sin(local * 0.05 + 2) * 0.1, 0]} s={[0.45, 0.35, 0.45]} c="#8a8a8a" op={0.4} />
    </group>
  );
};

/** Meriam lapangan Krupp (S8): laras + 2 roda besar berjari-jari + ekor
 *  meriam + sekrup elevasi. Menembak sekali: laras mundur lurus lalu
 *  kembali + kilat moncong. Acuan anatomy fig3 (51 bagian). */
const KruppCannon = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const fire = local >= 40 && local <= 60 ? Math.sin(((local - 40) / 20) * Math.PI) : 0;
  const recoil = fire * 0.5;
  const flash = local >= 40 && local <= 48 ? 1 - Math.abs(local - 44) / 4 : 0;
  return (
    <group position={[x, 0, z]} scale={[s, s, s]} rotation={[0, -0.35, 0]}>
      {/* 2 roda besar berjari-jari */}
      {[-0.7, 0.7].map((dz) => (
        <group key={dz} position={[0, 0.85, dz]}>
          <Cyl p={[0, 0, 0]} s={[0.85, 0.85, 0.14, 0]} c="#4a3220" r={[Math.PI / 2, 0, 0]} seg={14} />
          <Cyl p={[0, 0, 0]} s={[0.2, 0.2, 0.2, 0]} c="#2a2a2e" r={[Math.PI / 2, 0, 0]} seg={10} />
          {[0, 1, 2, 3].map((i) => (
            <B key={i} p={[0, 0, 0]} s={[1.5, 0.09, 0.16]} c="#6a4a2e" r={[0, 0, (i * Math.PI) / 4]} />
          ))}
        </group>
      ))}
      {/* laras (mundur lurus saat menembak) + moncong + pangkal */}
      <group position={[-recoil, 0, 0]}>
        <Cyl p={[0.6, 1.15, 0]} s={[0.22, 0.3, 2.6, 0]} c="#2a2a2e" r={[0, 0, Math.PI / 2 - 0.18]} seg={12} />
        <Cyl p={[1.85, 1.4, 0]} s={[0.3, 0.3, 0.25, 0]} c="#3a3a3a" r={[0, 0, Math.PI / 2 - 0.18]} seg={12} />
        <Sph p={[-0.55, 0.92, 0]} s={[0.28, 0.28, 0.28]} c="#2a2a2e" />
      </group>
      {/* kilat moncong */}
      {flash > 0 && (
        <Sph p={[2.1, 1.48, 0]} s={[0.5 * flash, 0.5 * flash, 0.5 * flash]} c="#ffd84a" op={0.9} />
      )}
      {/* rangka + ekor meriam + sekrup elevasi + alat bidik */}
      <B p={[-0.9, 0.7, 0]} s={[1.8, 0.28, 0.5]} c="#5a3a22" r={[0, 0, -0.12]} />
      <B p={[-1.8, 0.35, 0]} s={[0.9, 0.16, 0.3]} c="#4a3220" r={[0, 0, -0.25]} />
      <Cyl p={[0.1, 0.55, 0]} s={[0.1, 0.1, 0.7, 0]} c="#3a3a3a" seg={8} />
      <Cyl p={[0.1, 0.95, 0]} s={[0.28, 0.28, 0.08, 0]} c="#3a3a3a" r={[Math.PI / 2, 0, 0]} seg={10} />
      {/* 3 peluru + tong mesiu di samping */}
      {[-0.4, 0, 0.4].map((dx) => (
        <Sph key={dx} p={[1.2 + dx, 0.18, 1.1]} s={[0.16, 0.16, 0.16]} c="#2a2a2e" />
      ))}
      <Cyl p={[1.8, 0.3, 1.1]} s={[0.28, 0.28, 0.6, 0]} c="#5a3a22" seg={10} />
    </group>
  );
};
/* ------------------------------------------------------------------ */
/* Konfigurasi per adegan — Gurun Atacama jingga/terakota vs laut      */
/* Pasifik biru (palet komplementer konsisten, aturan @tauugaksih).    */
/* S9 (twist) lebih gelap dan dingin: subuh biru gelap sebagai penanda */
/* emosi, seperti video referensi.                                     */
/* ------------------------------------------------------------------ */

const CFGS: Cfg[] = [
  // S1 gurun Atacama hook — siang terik, langit jingga, pasir pucat
  { skyTop: "#c96a3a", skyHor: "#e8a06a", fog: "#d8a878", groundTex: desertTex, groundColor: "#dcc49a", sunPos: [8, 13, -55], sunR: 3.4, sunColor: "#ffd84a", camPos: [0, 3.2, 15], camLook: [0, 1.4, -3], fov: 46, dirColor: "#ffcf9e", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.6, fogNear: 28, fogFar: 95 },
  // S2 oficina salitrera — siang terik yang sama, gurun + garam putih
  { skyTop: "#c96a3a", skyHor: "#e8a06a", fog: "#d8a878", groundTex: saltTex, groundColor: "#dcc49a", sunPos: [8, 13, -55], sunR: 3.4, sunColor: "#ffd84a", camPos: [0, 3.0, 14], camLook: [0, 1.2, -3], fov: 46, dirColor: "#ffcf9e", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.6, fogNear: 28, fogFar: 95 },
  // S3 timbangan close-up — gurun jingga, kamera lebih dekat
  { skyTop: "#c96a3a", skyHor: "#e8a06a", fog: "#d8a878", groundTex: desertTex, groundColor: "#dcc49a", sunPos: [8, 13, -55], sunR: 3.4, sunColor: "#ffd84a", camPos: [0, 3.2, 14], camLook: [0, 1.2, -3], fov: 46, dirColor: "#ffcf9e", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.6, fogNear: 28, fogFar: 95 },
  // S4 kantor perusahaan Antofagasta — dalam ruangan, lampu hangat jingga
  { skyTop: "#3a2a1a", skyHor: "#6a4a34", fog: "#4a3424", groundTex: woodDarkTex, groundColor: "#4a3a26", sunPos: [-8, 6, -55], sunR: 0.1, sunColor: "#3a2a1a", camPos: [0, 3.4, 16], camLook: [0, 1.5, -2], fov: 46, dirColor: "#ffd84a", dirPos: [-4, 6, 4], dirInt: 1.6, amb: 0.65, fogNear: 26, fogFar: 90 },
  // S5 pelabuhan Antofagasta — laut biru lawan pasir jingga
  { skyTop: "#3a6a9a", skyHor: "#e8a06a", fog: "#9ab8cc", groundTex: sandTex, groundColor: "#e8d5a0", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#ffd84a", camPos: [0, 3.2, 15], camLook: [0, 1.4, -4], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.4, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S6 ruangan perjanjian rahasia — gelap hangat, lilin, bayangan
  { skyTop: "#241a12", skyHor: "#4a3424", fog: "#2a2018", groundTex: woodDarkTex, groundColor: "#3a2c20", sunPos: [-8, 6, -55], sunR: 0.1, sunColor: "#241a12", camPos: [0, 3.2, 14], camLook: [0, 1.4, -2], fov: 46, dirColor: "#ffb36b", dirPos: [-4, 6, 4], dirInt: 1.3, amb: 0.5, fogNear: 26, fogFar: 90 },
  // S7 laut Iquique — biru dalam lawan matahari jingga rendah
  { skyTop: "#1a4a7a", skyHor: "#e8a06a", fog: "#6a8aa8", groundTex: sandTex, groundColor: "#c9a06a", sunPos: [8, 4, -55], sunR: 3.2, sunColor: "#ff9d45", camPos: [0, 3.2, 14], camLook: [0, 1.0, -6], fov: 46, dirColor: "#ffcf9e", dirPos: [8, 10, 6], dirInt: 1.3, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S8 darat Tacna-Arica — langit biru, bukit + tanah terakota
  { skyTop: "#3a6a9a", skyHor: "#cfe3f2", fog: "#9ab8cc", groundTex: desertTex, groundColor: "#dcc49a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2ead0", camPos: [0, 3.4, 15], camLook: [0, 1.6, -3], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.4, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S9 pantai Pasifik tenang (twist) — SUBUH BIRU GELAP: lebih gelap dan
  // dingin sebagai penanda emosi (aturan @tauugaksih)
  { skyTop: "#16233d", skyHor: "#4a6a8a", fog: "#2a3a4a", groundTex: sandTex, groundColor: "#8a7a5a", sunPos: [-8, 5, -55], sunR: 2.2, sunColor: "#cfe3f2", camPos: [0, 3.2, 14], camLook: [0, 1.4, -3], fov: 46, dirColor: "#cfe3f2", dirPos: [-8, 10, 6], dirInt: 0.9, amb: 0.45, fogNear: 26, fogFar: 90 },
];

/* ------------------------------------------------------------------ */
/* Dunia per adegan. Foreground framing (aturan @tauugaksih): tumpukan */
/* guano di tepi frame S1, tiang dermaga S5, batu kering S8. Motif      */
/* yang diulang: tumpukan guano (S1, S2, S9) dan kapal Huascar (S7 3D, */
/* S9 foto asli).                                                      */
/* ------------------------------------------------------------------ */

const Scene1World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Hills colors={["#b8763a", "#a06632", "#8a5a2c"]} trees={false} />
    <Ground cfg={cfg} />
    {/* tumpukan guano putih di tengah + foreground framing di tepi */}
    <GuanoPile x={0} z={-6} s={1.3} local={local} />
    <GuanoPile x={-7.2} z={6.5} s={1.1} local={local} />
    <GuanoPile x={7.2} z={6.8} s={1.0} local={local} />
    {/* burung laut bertengger di atas tumpukan tengah — penanda "ini
        kotoran burung"; satu burung terbang lebih dekat supaya kebaca */}
    <PerchedBird x={0.26} y={1.7} z={-6.26} s={1.2} rotY={0.4} />
    <PerchedBird x={1.17} y={1.2} z={-5.55} s={1.1} rotY={-0.5} />
    <PerchedBird x={-1.24} y={1.06} z={-5.48} s={1.1} rotY={0.9} />
    <Bird x={-6} y={9} z={-20} local={local} phase={0} />
    <Bird x={6} y={10} z={-22} local={local} phase={2} />
    <Bird x={-3} y={7} z={-14} local={local} phase={1} s={1.3} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene2World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={1} />
    <Hills colors={["#b8763a", "#a06632", "#8a5a2c"]} z1={-34} trees={false} />
    <Ground cfg={cfg} />
    {/* oficina salitrera di tengah; tumpukan guano foreground di tepi */}
    <Oficina x={0} z={-4} local={local} />
    <GuanoPile x={-7.4} z={6.2} s={1.0} local={local} />
    <GuanoPile x={7.4} z={6.5} s={0.9} local={local} />
    <Bird x={-5} y={10} z={-20} local={local} phase={0} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene3World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-7} y={12} z={-34} s={0.9} local={local} phase={0} />
    <Hills colors={["#b8763a", "#a06632", "#8a5a2c"]} z1={-34} trees={false} />
    <Ground cfg={cfg} />
    {/* timbangan ada di overlay 2D; dunia: gurun + guano di tepi */}
    <GuanoPile x={-6.0} z={-1} s={1.5} local={local} />
    <GuanoPile x={6.0} z={-2} s={1.4} local={local} />
    <Bird x={5} y={10} z={-20} local={local} phase={1} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene4World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <color attach="background" args={["#3a2a1a"]} />
    <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
    <Room wallColor="#6a4a34" />
    <Desk x={0} z={2} />
    <Lamp x={-2.8} z={1.2} warm />
    <Papers x={2.8} z={1.6} n={3} />
  </group>
);

const Scene5World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Sea local={local} color="#2a6a9a" z={-30} depth={60} />
    <Ground cfg={cfg} />
    {/* dermaga kayu menjorok ke laut; tiang di tepi = foreground */}
    <Dock x={0} z={-6} local={local} />
    <Bird x={-6} y={9} z={-20} local={local} phase={0} />
    <Bird x={6} y={10} z={-22} local={local} phase={2} />
  </group>
);

const Scene6World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <color attach="background" args={["#241a12"]} />
    <fog attach="fog" args={[cfg.fog, cfg.fogNear, cfg.fogFar]} />
    <Room wallColor="#3a2c22" />
    <Desk x={0} z={2} />
    <Lamp x={-2.8} z={1.2} warm />
    <Lamp x={2.8} z={1.2} warm />
    <Papers x={0} z={1.6} n={4} />
  </group>
);

const Scene7World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Sea local={local} color="#2a5a8a" z={-12} depth={70} />
    {/* Huascar (depan, lebih dekat kamera) vs Esmeralda (belakang) */}
    <Huascar x={-2.0} z={-6} local={local} s={0.9} />
    <Esmeralda x={4.5} z={-10} local={local} s={0.95} />
    <Bird x={-7} y={9} z={-20} local={local} phase={0} />
    <Bird x={6} y={10} z={-22} local={local} phase={2} />
  </group>
);

const Scene8World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Hills colors={["#a06632", "#8a5a2c", "#6a4423"]} trees={false} />
    <Ground cfg={cfg} />
    {/* meriam Krupp di tengah; semak + batu foreground di tepi */}
    <KruppCannon x={-0.5} z={-10} local={local} s={1.2} />
    <Foreground local={local} tone="sand" />
    <Bird x={-6} y={9} z={-20} local={local} phase={0} />
  </group>
);

const Scene9World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1} local={local} phase={1} />
    <Sea local={local} color="#1e3a5a" z={-30} depth={60} />
    <Ground cfg={cfg} />
    {/* pantai tenang di subuh biru gelap; tumpukan guano di tepi sebagai
        balasan visual motif hook (S1) untuk twist akhir */}
    <GuanoPile x={-5.0} z={1} s={1.2} local={local} />
    <GuanoPile x={5.0} z={1} s={1.2} local={local} />
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
  const [warmHandle] = useState(() => delayRender("warpacific3d warmup"));
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

/** Dunia 3D untuk satu adegan. Dipakai Video20 di bawah overlay karakter. */
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
