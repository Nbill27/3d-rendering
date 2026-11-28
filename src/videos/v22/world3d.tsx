// world3d.tsx — DUNIA 3D Battle of Myeongnyang (Video22, History Rush #13).
// Pola dari v20/world3d.tsx: ThreeCanvas Remotion + three.js,
// kamera LOCKED-OFF per adegan (aturan kamera bill 28 Nov — tidak ada
// drift kamera 3D sama sekali; satu-satunya gerakan kamera adalah
// 2 push-in di wrapper 2D Video22.tsx).
// Semua prop dibangun dari kode (box/cone/cylinder/sphere + tekstur
// canvas prosedural). TIDAK ADA prop GLB Kenney (folder public/bridge/
// tidak ada). Karakter 2D bean-head tetap overlay DOM di depan
// canvas ini (lihat Video22.tsx); titik pijakan karakter ada di z = 0.
// Lokasi: laut di depan Selat Myeongnyang (S1), Chilcheollyang terbakar
// (S2), darat/pantai Korea (S3), Selat Myeongnyang (S4, S5), laut pagi
// 26 Oktober (S6, S7), pantai tenang (S8, S9).
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
  canvasTex("sand22", 256, 256, (g) => {
    g.fillStyle = "#e8d5a0";
    g.fillRect(0, 0, 256, 256);
    const r = rng(55);
    for (let i = 0; i < 1100; i++) {
      const v = 200 + Math.floor(r() * 55);
      g.fillStyle = `rgb(${v},${v - 25},${v - 90})`;
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
  });

const woodTex = () =>
  canvasTex("wood22", 256, 256, (g) => {
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

const skyTex = (top: string, hor: string) =>
  canvasTex(`sky22-${top}-${hor}`, 16, 256, (g) => {
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
const Disc = ({ p, s, c, op, r }: { p: [number, number, number]; s: number; c: string; op?: number; r?: [number, number, number] }) => (
  <mesh position={p} rotation={r ?? [0, 0, 0]} material={basic(c, op ?? 1)}>
    <circleGeometry args={[s, 32]} />
  </mesh>
);
/** Cincin datar (torus diputar rata) untuk pusaran. */
const Ring = ({ p, r, tube, c, op }: { p: [number, number, number]; r: number; tube: number; c: string; op?: number }) => (
  <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} material={lam(c, null, op !== undefined ? { transparent: true, opacity: op } : undefined)}>
    <torusGeometry args={[r, tube, 8, 40]} />
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
  let m = lamCache.get("cloud22");
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.45 });
    lamCache.set("cloud22", m);
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

const Foreground = ({ local, tone = "green" }: { local: number; tone?: "sand" | "green" | "dark" | "rock" }) => (
  <group>
    <Sph p={[-1.7, 0.18, 8.6]} s={[0.6, 0.32, 0.45]} c={tone === "dark" ? "#3a2c22" : tone === "sand" ? "#c9bfa8" : tone === "rock" ? "#5a5a60" : "#7a8a6a"} />
    <Sph p={[1.7, 0.2, 8.4]} s={[0.65, 0.35, 0.45]} c={tone === "dark" ? "#3a2c22" : tone === "sand" ? "#c9bfa8" : tone === "rock" ? "#5a5a60" : "#7a8a6a"} />
    {tone === "rock" ? (
      <>
        {/* karang gelap di tepi frame (selat Myeongnyang) */}
        <Sph p={[-1.4, 0.3, 8.6]} s={[0.45, 0.5, 0.35]} c="#4a4a50" />
        <Sph p={[1.3, 0.35, 8.5]} s={[0.5, 0.55, 0.38]} c="#3f3f46" />
        <Sph p={[-0.4, 0.15, 8.7]} s={[0.28, 0.3, 0.24]} c="#5a5a60" />
        <Sph p={[0.4, 0.12, 8.8]} s={[0.22, 0.25, 0.2]} c="#4a4a50" />
      </>
    ) : tone === "sand" ? (
      <>
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

const Bird = ({ x, y, z, local, phase, s = 0.55 }: { x: number; y: number; z: number; local: number; phase: number; s?: number }) => (
  <group position={[x + drift(local, 1.2, 0.02, phase), y, z]} scale={[s, s, s]}>
    <B p={[-0.28, 0, 0]} s={[0.55, 0.07, 0.07]} c="#6a8ab0" r={[0, 0, 0.5]} />
    <B p={[0.28, 0, 0]} s={[0.55, 0.07, 0.07]} c="#6a8ab0" r={[0, 0, -0.5]} />
  </group>
);

/** Laut: bidang biru lebar + kilau ombak pelan (6 garis tersebar supaya
 *  laut bawah frame tidak kosong). */
const Sea = ({ local, color = "#4a86b8", z = -12, depth = 70 }: { local: number; color?: string; z?: number; depth?: number }) => (
  <group>
    <mesh position={[0, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]} material={lam(color)}>
      <planeGeometry args={[160, depth]} />
    </mesh>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <mesh key={i} position={[-10 + (i % 3) * 10 + drift(local, 0.4, 0.05, i), 0.08, -8 - i * 5]} rotation={[-Math.PI / 2, 0, 0]} material={basic("#cfe3f2", 0.5)}>
        <planeGeometry args={[6, 0.35]} />
      </mesh>
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Prop — semua dibangun dari kode (box/cone/cylinder/sphere).         */
/* ------------------------------------------------------------------ */

/** Kapal formasi sederhana (6 mesh) untuk armada: lambung + tiang +
 *  layar + bendera. Dipakai berulang untuk 13 kapal Korea dan armada
 *  Jepang. Warna: Korea lambung kayu cokelat + layar putih + bendera
 *  navy; Jepang lambung gelap + layar krem + panji merah. */
const FleetShip = ({ x, z, local, s = 1, side = "korea" }: { x: number; z: number; local: number; s?: number; side?: "korea" | "japan" }) => {
  const bob = Math.sin(local * 0.06 + x) * 0.04;
  const hull = side === "korea" ? "#6a4a2e" : "#3a2a26";
  const sail = side === "korea" ? "#f5f2ea" : "#e8dcc0";
  const flag = side === "korea" ? "#1b3a5c" : "#a02a22";
  return (
    <group position={[x, 0.05 + bob, z]} scale={[s, s, s]}>
      <B p={[0, 0.5, 0]} s={[3.2, 0.8, 1.1]} c={hull} map={woodTex()} />
      <Sph p={[1.6, 0.5, 0]} s={[0.55, 0.4, 0.55]} c={hull} />
      <Sph p={[-1.6, 0.5, 0]} s={[0.55, 0.4, 0.55]} c={hull} />
      <B p={[0, 0.95, 0]} s={[2.8, 0.14, 0.95]} c="#8a6a42" />
      <Cyl p={[0, 1.9, 0]} s={[0.06, 0.08, 1.9, 0]} c="#4a3220" seg={8} />
      {/* layar lebih kecil dari lambung + jahitan (dulu 1.3x1.3 polos,
          di still terbaca dinding krem, bukan kapal) */}
      <B p={[0, 2.05, 0]} s={[0.95, 1.0, 0.04]} c={sail} />
      <B p={[0, 2.05, 0]} s={[0.95, 0.07, 0.05]} c={side === "korea" ? "#c9b896" : "#c9a06a"} />
      <B p={[0, 2.05, 0]} s={[0.07, 1.0, 0.05]} c={side === "korea" ? "#c9b896" : "#c9a06a"} />
      <B p={[0.35, 2.7, 0]} s={[0.06, 0.4, 0.02]} c={flag} />
      <B p={[0.55, 2.65, 0]} s={[0.4, 0.28, 0.02]} c={flag} />
    </group>
  );
};

/** Panokseon pahlawan (S4, S6, S7): lambung kayu + haluan kepala naga +
 *  kabina + tiang + layar persegi + dayung + kemudi + 2 meriam dek.
 *  Acuan anatomy fig1 (55 bagian) dan figur Hairline panokseon.js:
 *  dayung mendayung serentak, layar mengembang, kemudi berayun. */
const Panokseon = ({ x, z, local, s = 1, row = true }: { x: number; z: number; local: number; s?: number; row?: boolean }) => {
  const bob = Math.sin(local * 0.06) * 0.05;
  const rowA = row ? Math.sin(local * 0.12) * 0.35 : 0;
  return (
    <group position={[x, 0.08 + bob, z]} scale={[s, s, s]}>
      {/* lambung kayu + haluan/buritan membulat */}
      <B p={[0, 0.55, 0]} s={[6.0, 1.0, 1.9]} c="#6a4a2e" map={woodTex()} />
      <Sph p={[3.0, 0.55, 0]} s={[0.95, 0.5, 0.95]} c="#6a4a2e" />
      <Sph p={[-3.0, 0.55, 0]} s={[0.95, 0.5, 0.95]} c="#6a4a2e" />
      <B p={[0, 0.72, 0.96]} s={[5.6, 0.2, 0.04]} c="#f5f2ea" />
      {/* haluan kepala naga: kerucut + tanduk kecil */}
      <Cone p={[3.9, 0.6, 0]} s={[0.5, 1.4, 0]} c="#a02a22" r={[0, 0, -Math.PI / 2]} seg={8} />
      <Cone p={[3.6, 1.15, 0]} s={[0.16, 0.5, 0]} c="#ffd84a" r={[0, 0, -0.5]} seg={6} />
      <Sph p={[3.55, 0.85, 0.4]} s={[0.09, 0.09, 0.05]} c="#1f1f24" />
      <Sph p={[3.55, 0.85, -0.4]} s={[0.09, 0.09, 0.05]} c="#1f1f24" />
      {/* dek + kabina */}
      <B p={[0, 1.1, 0]} s={[5.2, 0.18, 1.7]} c="#8a6a42" />
      <B p={[-1.2, 1.6, 0]} s={[1.8, 0.9, 1.3]} c="#7a5a34" map={woodTex()} />
      <B p={[-1.2, 2.1, 0]} s={[2.0, 0.16, 1.5]} c="#5a3a22" />
      {/* tiang + pekarangan + layar persegi */}
      <Cyl p={[1.2, 2.6, 0]} s={[0.08, 0.1, 2.8, 0]} c="#4a3220" seg={8} />
      <B p={[1.2, 3.4, 0]} s={[2.6, 0.1, 0.06]} c="#4a3220" />
      <B p={[1.2, 2.55, 0]} s={[2.3, 1.6, 0.04]} c="#f5f2ea" />
      <B p={[1.2, 2.55, 0]} s={[0.08, 1.6, 0.05]} c="#c9b896" />
      {/* dayung: 3 di sisi dekat, berputar di dudukannya (mendayung) */}
      {[-1.6, 0, 1.6].map((dx, i) => (
        <group key={i} position={[dx, 0.7, 0.95]} rotation={[rowA, 0, 0]}>
          <B p={[0, 0, 0.7]} s={[0.1, 0.1, 1.5]} c="#8a6a42" />
          <B p={[0, 0, 1.5]} s={[0.22, 0.06, 0.5]} c="#8a6a42" />
        </group>
      ))}
      {/* kemudi di buritan + tangkai */}
      <B p={[-3.5, 0.4, 0]} s={[0.12, 1.0, 0.5]} c="#5a3a22" />
      <B p={[-3.2, 1.1, 0]} s={[0.8, 0.1, 0.12]} c="#5a3a22" />
      {/* 2 meriam dek (chongtong kecil) */}
      {[-0.4, 0.4].map((dz) => (
        <Cyl key={dz} p={[2.2, 1.4, dz]} s={[0.14, 0.18, 1.1, 0]} c="#2a2a2e" r={[0, 0, Math.PI / 2 - 0.12]} seg={10} />
      ))}
      {/* bendera navy di tiang belakang */}
      <B p={[-2.6, 3.6, 0]} s={[0.06, 0.5, 0.02]} c="#1b3a5c" />
      <B p={[-2.4, 3.55, 0]} s={[0.4, 0.3, 0.02]} c="#1b3a5c" />
      {/* gelombang di haluan */}
      <Sph p={[4.2, 0.08, 0]} s={[1.0, 0.12, 0.7]} c="#cfe3f2" op={0.55} />
    </group>
  );
};

/** Kapal Korea terbakar (S2, Chilcheollyang): miring, tenggelam pelan,
 *  api + asap. Hormat: tanpa ledakan besar, tanpa awak digambar. */
const BurningShip = ({ x, z, local, s = 1, phase = 0 }: { x: number; z: number; local: number; s?: number; phase?: number }) => {
  const list = Math.min(local / 170, 1) * 0.25;
  const sink = Math.min(local / 170, 1) * 0.5;
  const bob = Math.sin(local * 0.07 + phase) * 0.04;
  const flick = 0.85 + Math.sin(local * 0.5 + phase * 3) * 0.15;
  return (
    <group position={[x, 0.05 + bob - sink, z]} scale={[s, s, s]} rotation={[0, 0, list]}>
      <B p={[0, 0.5, 0]} s={[3.4, 0.9, 1.2]} c="#4a3220" map={woodTex()} />
      <Sph p={[1.7, 0.5, 0]} s={[0.6, 0.45, 0.6]} c="#4a3220" />
      <Sph p={[-1.7, 0.5, 0]} s={[0.6, 0.45, 0.6]} c="#4a3220" />
      {/* tiang patah miring */}
      <Cyl p={[-0.4, 1.6, 0]} s={[0.07, 0.09, 1.6, 0]} c="#3a2412" r={[0, 0, 0.5]} seg={8} />
      {/* api di dek: kerucut (lidah api, bukan bola) + asap kecil naik */}
      <Cone p={[0.4, 1.5, 0]} s={[0.5 * flick, 1.1 * flick, 0]} c="#ff9d45" seg={8} />
      <Cone p={[0.15, 1.35, 0]} s={[0.3 * flick, 0.75 * flick, 0]} c="#ffd84a" seg={8} />
      <Cone p={[-0.3, 1.3, 0.2]} s={[0.28, 0.7, 0]} c="#e86a2a" seg={8} />
      <Sph p={[0.3, 2.6 + Math.sin(local * 0.05 + phase) * 0.15, 0]} s={[0.5, 0.4, 0.5]} c="#3a3a3a" op={0.5} />
      <Sph p={[0.6, 3.3 + Math.sin(local * 0.05 + phase + 1) * 0.15, 0]} s={[0.65, 0.5, 0.65]} c="#4a4a4a" op={0.35} />
    </group>
  );
};

/** Pusaran besar (motif yang diulang): 3 cincin berputar + corong
 *  gelap di tengah + buih putih. Putaran linear (spinner) — satu-satunya
 *  gerakan linear yang diizinkan (MOTION.md). */
const Whirlpool = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const spin = local * 0.03;
  return (
    <group position={[x, 0.1, z]} scale={[s, s, s]}>
      {/* corong gelap DATAR di permukaan air (dulu Disc vertikal: di
          still terbaca kubah gelap raksasa di tengah frame) */}
      <Disc p={[0, 0.02, 0]} s={3.2} c="#0e2a44" op={0.9} r={[-Math.PI / 2, 0, 0]} />
      <group rotation={[0, spin, 0]}>
        <Ring p={[0, 0.06, 0]} r={2.6} tube={0.2} c="#cfe3f2" op={0.85} />
        <Ring p={[0, 0.08, 0]} r={1.7} tube={0.18} c="#ffffff" op={0.9} />
      </group>
      <group rotation={[0, -spin * 1.4, 0]}>
        <Ring p={[0, 0.1, 0]} r={0.9} tube={0.15} c="#cfe3f2" op={0.9} />
      </group>
      <Cone p={[0, -0.4, 0]} s={[0.8, 1.2, 0]} c="#0a1e30" r={[Math.PI, 0, 0]} seg={16} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + spin;
        return <Sph key={i} p={[Math.cos(a) * 3.0, 0.12, Math.sin(a) * 3.0]} s={[0.22, 0.1, 0.22]} c="#ffffff" op={0.7} />;
      })}
    </group>
  );
};

/** Meriam kapal Joseon, chongtong (S7): laras + 2 roda berjari-jari +
 *  rangka kayu + sekrup elevasi. Menembak sekali: laras naik di poros,
 *  mundur LURUS lalu kembali + kilat moncong. Acuan anatomy fig3
 *  (53 bagian). */
const Chongtong = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const fire = local >= 60 && local <= 80 ? Math.sin(((local - 60) / 20) * Math.PI) : 0;
  const recoil = fire * 0.4;
  const flash = local >= 60 && local <= 68 ? 1 - Math.abs(local - 64) / 4 : 0;
  const elevate = Math.min(local / 60, 1) * 0.18;
  return (
    <group position={[x, 0, z]} scale={[s, s, s]} rotation={[0, -0.3, 0]}>
      {/* 2 roda berjari-jari */}
      {[-0.6, 0.6].map((dz) => (
        <group key={dz} position={[0, 0.7, dz]}>
          <Cyl p={[0, 0, 0]} s={[0.7, 0.7, 0.12, 0]} c="#4a3220" r={[Math.PI / 2, 0, 0]} seg={12} />
          <Cyl p={[0, 0, 0]} s={[0.16, 0.16, 0.16, 0]} c="#2a2a2e" r={[Math.PI / 2, 0, 0]} seg={8} />
          {[0, 1, 2, 3].map((i) => (
            <B key={i} p={[0, 0, 0]} s={[1.25, 0.08, 0.14]} c="#6a4a2e" r={[0, 0, (i * Math.PI) / 4]} />
          ))}
        </group>
      ))}
      {/* laras naik di poros + mundur lurus saat menembak */}
      <group position={[-recoil, 0, 0]} rotation={[0, 0, elevate]}>
        <Cyl p={[0.5, 0.95, 0]} s={[0.18, 0.24, 2.2, 0]} c="#2a2a2e" r={[0, 0, Math.PI / 2 - 0.15]} seg={12} />
        <Cyl p={[1.55, 1.2, 0]} s={[0.26, 0.26, 0.22, 0]} c="#3a3a3a" r={[0, 0, Math.PI / 2 - 0.15]} seg={12} />
        <Sph p={[-0.45, 0.72, 0]} s={[0.24, 0.24, 0.24]} c="#2a2a2e" />
      </group>
      {flash > 0 && (
        <Sph p={[1.85, 1.28, 0]} s={[0.45 * flash, 0.45 * flash, 0.45 * flash]} c="#ffd84a" op={0.9} />
      )}
      {/* rangka kayu + ekor + sekrup elevasi + penyodok */}
      <B p={[-0.8, 0.55, 0]} s={[1.6, 0.24, 0.44]} c="#5a3a22" r={[0, 0, -0.1]} />
      <B p={[-1.6, 0.3, 0]} s={[0.8, 0.14, 0.26]} c="#4a3220" r={[0, 0, -0.22]} />
      <Cyl p={[0.1, 0.42, 0]} s={[0.08, 0.08, 0.6, 0]} c="#3a3a3a" seg={8} />
      <Cyl p={[0.9, 1.05, 0.5]} s={[0.04, 0.04, 1.2, 0]} c="#6a4a2e" r={[Math.PI / 2 - 0.15, 0, 0]} seg={8} />
      {/* 3 peluru batu + tong mesiu */}
      {[-0.3, 0, 0.3].map((dx) => (
        <Sph key={dx} p={[1.0 + dx, 0.14, 0.9]} s={[0.13, 0.13, 0.13]} c="#5a5a60" />
      ))}
      <Cyl p={[1.6, 0.25, 0.9]} s={[0.24, 0.24, 0.5, 0]} c="#5a3a22" seg={10} />
    </group>
  );
};

/** Tebing selat (S4, S5): dua massa batu mengapit saluran sempit,
 *  pinus di puncaknya. Jindo di kiri (x negatif), Haenam di kanan.
 *  Posisi DIUKUR dari frame: kamera S4/S5 melihat setengah lebar
 *  ~5 unit di z tebing, jadi pusat tebing di x = ±6,5 (tepi frame)
 *  dengan tepi dalam di ±2,5 — saluran terbaca sempit di tengah.
 *  (Dulu x = ±13: tebing SELALU di luar frame, selat tidak terbaca.) */
const StraitCliffs = ({ local }: { local: number }) => (
  <group>
    {/* tebing kiri (Jindo) */}
    <Sph p={[-6.5, 1.5, -14]} s={[4, 4.5, 4]} c="#4a4a50" />
    <Sph p={[-5.5, 3.5, -11]} s={[3, 3.5, 3]} c="#5a5a60" />
    <Sph p={[-7, 0.5, -9]} s={[3.5, 3, 3.5]} c="#3f3f46" />
    <Cone p={[-6.5, 6.0, -13]} s={[0.9, 2.2, 0]} c="#2e5a34" seg={6} />
    <Cone p={[-5.5, 5.5, -10]} s={[0.7, 1.8, 0]} c="#3e7d4e" seg={6} />
    <Cone p={[-7.5, 5.7, -10]} s={[0.7, 1.8, 0]} c="#2e5a34" seg={6} />
    {/* tebing kanan (Haenam) */}
    <Sph p={[6.5, 1.5, -14]} s={[4, 4.5, 4]} c="#4a4a50" />
    <Sph p={[5.5, 3.5, -11]} s={[3, 3.5, 3]} c="#5a5a60" />
    <Sph p={[7, 0.5, -9]} s={[3.5, 3, 3.5]} c="#3f3f46" />
    <Cone p={[6.5, 6.0, -13]} s={[0.9, 2.2, 0]} c="#2e5a34" seg={6} />
    <Cone p={[5.5, 5.5, -10]} s={[0.7, 1.8, 0]} c="#3e7d4e" seg={6} />
    <Cone p={[7.5, 5.7, -10]} s={[0.7, 1.8, 0]} c="#2e5a34" seg={6} />
  </group>
);

/** Panah arus di atas air (S5, S7): panah pipih amber yang berbalik
 *  180 derajat saat pasang berbalik. `turn` 0..1 = seberapa jauh balik. */
const CurrentArrow = ({ x, z, turn, local, s = 1 }: { x: number; z: number; turn: number; local: number; s?: number }) => {
  const rotY = turn * Math.PI;
  const bob = Math.sin(local * 0.08 + x) * 0.05;
  return (
    <group position={[x, 0.15 + bob, z]} rotation={[0, rotY, 0]} scale={[s, s, s]}>
      <B p={[0, 0, -0.9]} s={[0.35, 0.06, 1.8]} c="#f2a93b" />
      <Cone p={[0, 0, -2.1]} s={[0.45, 1.0, 0]} c="#f2a93b" r={[Math.PI / 2, 0, 0]} seg={4} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Konfigurasi per adegan — navy laut dalam #1B3A5C vs amber #F2A93B   */
/* (palet komplementer konsisten, aturan @tauugaksih). S6-S7           */
/* (pertempuran) lebih gelap dan dingin; S9 kembali hangat amber.      */
/* ------------------------------------------------------------------ */

const CFGS: Cfg[] = [
  // S1 laut hook — siang terang, laut navy lawan matahari amber
  { skyTop: "#2a5a8a", skyHor: "#f2c078", fog: "#7a9ab8", groundTex: sandTex, groundColor: "#c9a06a", sunPos: [8, 12, -55], sunR: 3.2, sunColor: "#f2a93b", camPos: [0, 3.4, 15], camLook: [0, 1.0, -6], fov: 46, dirColor: "#ffe0b0", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.6, fogNear: 28, fogFar: 95 },
  // S2 Chilcheollyang terbakar — langit asap gelap, laut suram
  { skyTop: "#3a2a22", skyHor: "#c96a3a", fog: "#6a4a3a", groundTex: sandTex, groundColor: "#8a7a5a", sunPos: [8, 10, -55], sunR: 2.4, sunColor: "#e86a2a", camPos: [0, 3.2, 14], camLook: [0, 1.0, -6], fov: 46, dirColor: "#ffb36b", dirPos: [8, 12, 6], dirInt: 1.2, amb: 0.5, fogNear: 26, fogFar: 90 },
  // S3 darat/pantai Korea — siang terang, pantai pasir + laut di belakang
  { skyTop: "#3a6a9a", skyHor: "#e8c078", fog: "#9ab8cc", groundTex: sandTex, groundColor: "#e8d5a0", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2a93b", camPos: [0, 3.2, 15], camLook: [0, 1.4, -3], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.4, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S4 selat sempit — kamera lebih tinggi supaya saluran terbaca
  { skyTop: "#2a5a8a", skyHor: "#cfe3f2", fog: "#7a9ab8", groundTex: sandTex, groundColor: "#c9a06a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2ead0", camPos: [0, 6.5, 12], camLook: [0, 0, -6], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.4, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S5 pusaran — biru-hijau dalam, kamera LEBIH TINGGI supaya cincin
  // pusaran terbaca sebagai elips (dulu kamera y=4: cincin jadi garis
  // datar tipis)
  { skyTop: "#1a3a5a", skyHor: "#4a7a9a", fog: "#3a5a7a", groundTex: sandTex, groundColor: "#8a7a5a", sunPos: [8, 10, -55], sunR: 2.6, sunColor: "#cfe3f2", camPos: [0, 6.5, 10], camLook: [0, 0, -5], fov: 46, dirColor: "#cfe3f2", dirPos: [8, 12, 6], dirInt: 1.2, amb: 0.55, fogNear: 26, fogFar: 90 },
  // S6 pagi 26 Oktober — abu-abu biru dingin, armada Jepang masuk
  { skyTop: "#4a6a8a", skyHor: "#c9d6e8", fog: "#6a8aa8", groundTex: sandTex, groundColor: "#8a7a5a", sunPos: [8, 11, -55], sunR: 2.8, sunColor: "#f2ead0", camPos: [0, 3.2, 14], camLook: [0, 1.0, -6], fov: 46, dirColor: "#cfe3f2", dirPos: [8, 12, 6], dirInt: 1.2, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S7 pasang berbalik — GELAP DINGIN (pertempuran, penanda emosi)
  { skyTop: "#16233d", skyHor: "#4a6a8a", fog: "#2a3a4a", groundTex: sandTex, groundColor: "#6a6a7a", sunPos: [-8, 5, -55], sunR: 2.2, sunColor: "#cfe3f2", camPos: [0, 3.2, 14], camLook: [0, 1.0, -6], fov: 46, dirColor: "#cfe3f2", dirPos: [-8, 10, 6], dirInt: 0.9, amb: 0.45, fogNear: 26, fogFar: 90 },
  // S8 pantai tenang (di balik peta) — siang lembut
  { skyTop: "#3a6a9a", skyHor: "#e8c078", fog: "#9ab8cc", groundTex: sandTex, groundColor: "#e8d5a0", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2a93b", camPos: [0, 3.2, 14], camLook: [0, 1.4, -3], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.4, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S9 matahari terbenam amber — hangat kembali (twist)
  { skyTop: "#7a3a1a", skyHor: "#f2a93b", fog: "#c98a5a", groundTex: sandTex, groundColor: "#c9a06a", sunPos: [6, 3, -55], sunR: 4.0, sunColor: "#f2a93b", camPos: [0, 3.2, 14], camLook: [0, 1.0, -6], fov: 46, dirColor: "#ffcf9e", dirPos: [6, 8, 6], dirInt: 1.3, amb: 0.55, fogNear: 28, fogFar: 95 },
];

/* ------------------------------------------------------------------ */
/* Dunia per adegan. Foreground framing (aturan @tauugaksih): karang   */
/* di tepi frame S1/S6/S7, tebing selat S4/S5. Motif yang diulang:     */
/* pusaran (S5 besar, S7 di titik pasang berbalik, S9 kecil di laut    */
/* matahari terbenam).                                                 */
/* ------------------------------------------------------------------ */

const Scene1World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
    <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Sea local={local} color="#2a6a9a" z={-12} depth={70} />
    {/* 13 kapal Korea di utara (jauh), berbaris 2 lapis */}
    {[-6, -4, -2, 0, 2, 4, 6].map((x, i) => (
      <FleetShip key={`k1-${i}`} x={x} z={-12} local={local} s={0.55} side="korea" />
    ))}
    {[-5, -3, -1, 1, 3, 5].map((x, i) => (
      <FleetShip key={`k2-${i}`} x={x} z={-15} local={local} s={0.5} side="korea" />
    ))}
    {/* armada Jepang di selatan (dekat kamera), berbaris 3 lapis —
        dijauhkan dari kamera (dulu z=2/5/8: layar terdekat menutup
        frame jadi dinding krem) */}
    {[-7, -5, -3, -1, 1, 3, 5, 7].map((x, i) => (
      <FleetShip key={`j1-${i}`} x={x} z={-1} local={local} s={0.6} side="japan" />
    ))}
    {[-6, -4, -2, 0, 2, 4, 6].map((x, i) => (
      <FleetShip key={`j2-${i}`} x={x} z={2} local={local} s={0.65} side="japan" />
    ))}
    {[-5, -3, -1, 1, 3, 5].map((x, i) => (
      <FleetShip key={`j3-${i}`} x={x} z={5} local={local} s={0.7} side="japan" />
    ))}
    <Bird x={-2} y={13} z={-20} local={local} phase={0} />
    <Bird x={3} y={14} z={-22} local={local} phase={2} />
    <Foreground local={local} tone="rock" />
  </group>
);

const Scene2World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={1} />
    <Sea local={local} color="#2a3a4a" z={-12} depth={70} />
    {/* 4 kapal Korea terbakar dan tenggelam pelan */}
    <BurningShip x={-5} z={-8} local={local} s={0.9} phase={0} />
    <BurningShip x={-1} z={-6} local={local} s={1.0} phase={1} />
    <BurningShip x={3} z={-9} local={local} s={0.85} phase={2} />
    <BurningShip x={6} z={-5} local={local} s={0.8} phase={0.5} />
    {/* asap menutupi langit — dikecilkan (dulu elips raksasa menutup
        label tanggal dan langit) */}
    <Sph p={[-4, 10, -14]} s={[2.0, 0.9, 1.5]} c="#5a5a5a" op={0.45} />
    <Sph p={[2, 11, -16]} s={[2.4, 1.0, 1.5]} c="#5a5a5a" op={0.4} />
    <Foreground local={local} tone="rock" />
  </group>
);

const Scene3World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={0} />
    <Hills colors={["#5a7a4a", "#4a6a3e", "#3a5a34"]} z1={-34} trees />
    <Ground cfg={cfg} />
    <Sea local={local} color="#2a6a9a" z={-30} depth={40} />
    {/* 12 kapal kecil di laut belakang (sisa armada yang diberikan ke Yi) */}
    {[-6, -4, -2, 0, 2, 4, 6].map((x, i) => (
      <FleetShip key={`s3-${i}`} x={x} z={-12} local={local} s={0.5} side="korea" />
    ))}
    {[-5, -3, -1, 1, 3, 5].map((x, i) => (
      <FleetShip key={`s3b-${i}`} x={x} z={-15} local={local} s={0.45} side="korea" />
    ))}
    <Bird x={0} y={13} z={-20} local={local} phase={0} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene4World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // Kapal ke-13 meluncur masuk dari kiri bergabung dengan 12 kapal.
  const joinX = -8 + Math.min(local / 140, 1) * 5.5;
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      <Cloud x={-8} y={12} z={-34} s={0.9} local={local} phase={1} />
      <Sea local={local} color="#2a6a9a" z={-12} depth={60} />
      <StraitCliffs local={local} />
      {/* 12 kapal di saluran sempit + kapal ke-13 yang bergabung */}
      {[-5, -3, -1, 1, 3, 5].map((x, i) => (
        <FleetShip key={`s4-${i}`} x={x} z={-8} local={local} s={0.5} side="korea" />
      ))}
      {[-4, -2, 0, 2, 4].map((x, i) => (
        <FleetShip key={`s4b-${i}`} x={x} z={-11} local={local} s={0.45} side="korea" />
      ))}
      <FleetShip x={joinX} z={-5} local={local} s={0.55} side="korea" />
      {/* kapal bendera Yi (panokseon pahlawan) di depan saluran */}
      <Panokseon x={0} z={-3} local={local} s={0.6} row={false} />
      {/* panah arus di tengah saluran (dulu di tepi frame: terbaca
          baji kuning acak) */}
      <CurrentArrow x={-2} z={-7} turn={0} local={local} s={0.7} />
      <CurrentArrow x={2} z={-10} turn={0} local={local} s={0.7} />
      <Foreground local={local} tone="rock" />
    </group>
  );
};

const Scene5World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={0.9} local={local} phase={0} />
    <Sea local={local} color="#1e4a6a" z={-12} depth={60} />
    <StraitCliffs local={local} />
    {/* pusaran besar di tengah selat (motif utama) */}
    <Whirlpool x={0} z={-5} local={local} s={1.2} />
    <Whirlpool x={-5} z={-10} local={local} s={0.5} />
    <Whirlpool x={5} z={-9} local={local} s={0.45} />
    {/* panah arus: satu arah, lalu berbalik di akhir adegan — dipendekkan
        supaya tidak keluar frame (dulu batang oranye terpotong tepi) */}
    <CurrentArrow x={-3.5} z={-3} turn={Math.min(local / 150, 1)} local={local} s={0.8} />
    <CurrentArrow x={3.5} z={-4} turn={Math.min(local / 150, 1)} local={local} s={0.8} />
    <Bird x={0} y={13} z={-20} local={local} phase={1} />
    <Foreground local={local} tone="rock" />
  </group>
);

const Scene6World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // Armada Jepang masuk dari selatan (z naik = mendekat) selama adegan.
  const advance = Math.min(local / 180, 1) * 3;
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={0} />
      <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
      <Sea local={local} color="#2a5a7a" z={-12} depth={70} />
      {/* kapal bendera Yi sendirian di utara memblokir jalan */}
      <Panokseon x={0} z={-8} local={local} s={0.85} />
      {/* 12 kapal Korea lain jauh di belakang kapal bendera */}
      {[-6, -4, -2, 2, 4, 6].map((x, i) => (
        <FleetShip key={`s6k-${i}`} x={x} z={-13} local={local} s={0.5} side="korea" />
      ))}
      {[-5, -3, -1, 1, 3, 5].map((x, i) => (
        <FleetShip key={`s6k2-${i}`} x={x} z={-16} local={local} s={0.45} side="korea" />
      ))}
      {/* armada Jepang masuk dari selatan — dijauhkan (dulu z=4/7:
          layar terdekat menutup frame) */}
      {[-7, -5, -3, -1, 1, 3, 5, 7].map((x, i) => (
        <FleetShip key={`s6j-${i}`} x={x} z={1 - advance} local={local} s={0.6} side="japan" />
      ))}
      {[-6, -4, -2, 0, 2, 4, 6].map((x, i) => (
        <FleetShip key={`s6j2-${i}`} x={x} z={4 - advance} local={local} s={0.65} side="japan" />
      ))}
      <Bird x={2} y={13} z={-20} local={local} phase={0} />
      <Foreground local={local} tone="rock" />
    </group>
  );
};

const Scene7World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // Pasang berbalik di local 40-100: panah arus membalik, kapal Jepang
  // terdorong mundur (z naik = menjauh ke selatan), Yi menyerang maju.
  const turn = Math.min(Math.max((local - 40) / 60, 0), 1);
  const pushBack = turn * 3.5;
  const yiAdvance = turn * 1.5;
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={1} />
      <Sea local={local} color="#1e3a5a" z={-12} depth={70} />
      {/* kapal bendera Yi maju menyerang; meriam menembak di local 60-80 */}
      <Panokseon x={0} z={-8 + yiAdvance} local={local} s={0.85} />
      <Chongtong x={-1.5} z={-4} local={local} s={1.1} />
      {/* kapal Korea lain ikut maju */}
      {[-5, -3, 3, 5].map((x, i) => (
        <FleetShip key={`s7k-${i}`} x={x} z={-12 + yiAdvance} local={local} s={0.55} side="korea" />
      ))}
      {/* kapal Jepang terdorong mundur + miring — dijauhkan dari kamera */}
      {[-6, -4, -2, 0, 2, 4, 6].map((x, i) => (
        <FleetShip key={`s7j-${i}`} x={x} z={-2 + pushBack} local={local} s={0.6} side="japan" />
      ))}
      {[-5, -3, -1, 1, 3, 5].map((x, i) => (
        <FleetShip key={`s7j2-${i}`} x={x} z={1 + pushBack} local={local} s={0.65} side="japan" />
      ))}
      {/* pusaran kecil di titik pasang berbalik (motif berulang) */}
      <Whirlpool x={-4} z={-6} local={local} s={0.6} />
      <CurrentArrow x={-3} z={-3} turn={turn} local={local} s={1.0} />
      <CurrentArrow x={3} z={-4} turn={turn} local={local} s={1.0} />
      <Foreground local={local} tone="rock" />
    </group>
  );
};

const Scene8World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={0} />
    <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
    <Sea local={local} color="#2a6a9a" z={-12} depth={60} />
    <Ground cfg={cfg} />
    {/* pantai tenang; 13 kapal Korea berlayar utuh */}
    {[-6, -4, -2, 0, 2, 4, 6].map((x, i) => (
      <FleetShip key={`s8-${i}`} x={x} z={-10} local={local} s={0.55} side="korea" />
    ))}
    {[-5, -3, -1, 1, 3, 5].map((x, i) => (
      <FleetShip key={`s8b-${i}`} x={x} z={-13} local={local} s={0.5} side="korea" />
    ))}
    <Bird x={-2} y={13} z={-20} local={local} phase={0} />
    <Bird x={3} y={14} z={-22} local={local} phase={2} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene9World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1} local={local} phase={1} />
    <Sea local={local} color="#1b3a5c" z={-12} depth={70} />
    {/* 13 kapal Korea berlayar menjauh di matahari terbenam amber */}
    {[-6, -4, -2, 0, 2, 4, 6].map((x, i) => (
      <FleetShip key={`s9-${i}`} x={x} z={-10} local={local} s={0.55} side="korea" />
    ))}
    {[-5, -3, -1, 1, 3, 5].map((x, i) => (
      <FleetShip key={`s9b-${i}`} x={x} z={-13} local={local} s={0.5} side="korea" />
    ))}
    {/* pusaran kecil di laut matahari terbenam (motif berulang, penutup)
        — digeser ke tengah supaya tidak terpotong tepi frame */}
    <Whirlpool x={3.5} z={-6} local={local} s={0.45} />
    <Bird x={1} y={13} z={-20} local={local} phase={0} />
    <Foreground local={local} tone="rock" />
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
  const [warmHandle] = useState(() => delayRender("myeongnyang3d warmup"));
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

/** Dunia 3D untuk satu adegan. Dipakai Video22 di bawah overlay karakter. */
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
