// world3d.tsx — DUNIA 3D Ghost Army (Video23, History Rush #14).
// Pola dari v22/world3d.tsx: ThreeCanvas Remotion + three.js,
// kamera LOCKED-OFF per adegan (aturan kamera bill 28 Nov — tidak ada
// drift kamera 3D sama sekali; satu-satunya gerakan kamera adalah
// 2 push-in di wrapper 2D Video23.tsx).
// Semua prop dibangun dari kode (box/cone/cylinder/sphere + tekstur
// canvas prosedural). TIDAK ADA prop GLB Kenney (folder public/bridge/
// tidak ada). Karakter 2D bean-head tetap overlay DOM di depan
// canvas ini (lihat Video23.tsx); titik pijakan karakter ada di z = 0.
// Lokasi: Camp Forrest, Tennessee (S1-S4), Eropa malam (S5), peta
// operasi Eropa (S6), Sungai Rhine (S7-S9).
// Palet komplementer KONSISTEN: olive drab #4B5320 lawan amber/oranye
// #F2A93B. Motif yang diulang: tank Sherman tiup (S1 hook mengembang,
// S3, S4 hero, S8 berbaris, S9 penutup di tepi Rhine).
// Kepribadian gerak PLAYFUL: ease-out-back saat mengembang, overshoot
// 10-20% (material karet).
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

const grassTex = (base: string, speck: string) =>
  canvasTex(`grass23-${base}-${speck}`, 256, 256, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    const r = rng(23);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = speck;
      g.globalAlpha = 0.25 + r() * 0.5;
      g.fillRect(r() * 256, r() * 256, 3, 2);
    }
    g.globalAlpha = 1;
  });

const dirtTex = () =>
  canvasTex("dirt23", 256, 256, (g) => {
    g.fillStyle = "#a8906a";
    g.fillRect(0, 0, 256, 256);
    const r = rng(44);
    for (let i = 0; i < 1100; i++) {
      const v = 130 + Math.floor(r() * 70);
      g.fillStyle = `rgb(${v},${v - 20},${v - 70})`;
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
  });

const skyTex = (top: string, hor: string) =>
  canvasTex(`sky23-${top}-${hor}`, 16, 256, (g) => {
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

/** ease-out-back (kepribadian PLAYFUL): overshoot karet saat mengembang. */
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const u = Math.min(Math.max(t, 0), 1) - 1;
  return 1 + c3 * u * u * u + c1 * u * u;
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
  let m = lamCache.get("cloud23");
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.45 });
    lamCache.set("cloud23", m);
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
        <Sph p={[-8, 0.9, z1 + 1]} s={[1.1, 1.1, 1.1]} c="#2e5a34" />
        <Sph p={[-4, 1.2, z1]} s={[0.9, 0.9, 0.9]} c="#2e5a34" />
        <Sph p={[7, 1.0, z1 - 1]} s={[1.2, 1.2, 1.2]} c="#2e5a34" />
        <Sph p={[9.5, 0.8, z1 + 1]} s={[0.9, 0.9, 0.9]} c="#3e7d4e" />
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
    <Sph p={[-1.7, 0.18, 8.6]} s={[0.6, 0.32, 0.45]} c={tone === "dark" ? "#3a2c22" : tone === "sand" ? "#c9bfa8" : tone === "rock" ? "#5a5a60" : "#5a6a35"} />
    <Sph p={[1.7, 0.2, 8.4]} s={[0.65, 0.35, 0.45]} c={tone === "dark" ? "#3a2c22" : tone === "sand" ? "#c9bfa8" : tone === "rock" ? "#5a5a60" : "#5a6a35"} />
    {tone === "rock" ? (
      <>
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
      </>
    ) : (
      <>
        {[-1.4, 1.3, -0.4].map((x, i) => (
          <group key={i} position={[x, 0, 8.6]} rotation={[0, 0, Math.sin(local * 0.07 + i) * 0.05]}>
            <Cone p={[0, 0.35, 0]} s={[0.28, 0.7, 0]} c={tone === "dark" ? "#4a5d3a" : "#3e5a2e"} seg={6} />
            <Cone p={[0.3, 0.3, 0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e7a3a"} seg={6} />
            <Cone p={[-0.3, 0.3, -0.1]} s={[0.22, 0.55, 0]} c={tone === "dark" ? "#4a5d3a" : "#4e7a3a"} seg={6} />
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

/** Sungai Rhine: bidang air biru + kilau + tepian jauh (far bank). */
const River = ({ local, color = "#2a6a9a", z = -18, depth = 26 }: { local: number; color?: string; z?: number; depth?: number }) => (
  <group>
    <mesh position={[0, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]} material={lam(color)}>
      <planeGeometry args={[160, depth]} />
    </mesh>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <mesh key={i} position={[-10 + (i % 3) * 10 + drift(local, 0.4, 0.05, i), 0.08, z - 6 - (i % 3) * 4]} rotation={[-Math.PI / 2, 0, 0]} material={basic("#cfe3f2", 0.5)}>
        <planeGeometry args={[6, 0.35]} />
      </mesh>
    ))}
    {/* tepian jauh (far bank): garis hijau gelap di seberang sungai */}
    <B p={[0, 0.4, z - depth / 2 - 2]} s={[160, 0.8, 4]} c="#3a4a2a" />
  </group>
);

/* ------------------------------------------------------------------ */
/* Prop — semua dibangun dari kode (box/cone/cylinder/sphere).         */
/* Motif: tank Sherman tiup.                                           */
/* ------------------------------------------------------------------ */

const OLIVE = "#4b5320";
const OLIVE_DARK = "#3a4218";
const OLIVE_LIGHT = "#5a6234";
const TRACK_DARK = "#2a2a22";
const AMBER = "#f2a93b";

/** Tank Sherman tiup (motif yang diulang): lambung karet + turet +
 *  laras + rantai + roda + katup + selang. `inflate` 0..1: 0 = karet
 *  datar di tanah, 1 = Sherman penuh. Mengembang dengan ease-out-back
 *  (overshoot karet 10-20%, kepribadian PLAYFUL). Acuan anatomy fig1
 *  (47 bagian) dan figur Hairline dummy-tank. */
const DummyTank = ({ x, z, local, s = 1, inflate = 1 }: { x: number; z: number; local: number; s?: number; inflate?: number }) => {
  const t = easeOutBack(inflate);
  const squashY = 0.18 + 0.82 * Math.min(Math.max(t, 0), 1.18);
  const wobble = inflate > 0 && inflate < 1 ? Math.sin(local * 0.35) * 0.02 : 0;
  return (
    <group position={[x, 0.05, z]} scale={[s * (1 + wobble), s * squashY, s]}>
      {/* rantai + roda (sisi dekat dan jauh) */}
      <B p={[0, 0.35, 0.95]} s={[4.4, 0.7, 0.35]} c={TRACK_DARK} />
      <B p={[0, 0.35, -0.95]} s={[4.4, 0.7, 0.35]} c={TRACK_DARK} />
      {[-1.8, -0.9, 0, 0.9, 1.8].map((dx) => (
        <Cyl key={dx} p={[dx, 0.35, 1.14]} s={[0.3, 0.3, 0.08, 0]} c="#4a4a42" r={[Math.PI / 2, 0, 0]} seg={10} />
      ))}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((dx) => (
        <Cyl key={`b-${dx}`} p={[dx, 0.35, -1.14]} s={[0.3, 0.3, 0.08, 0]} c="#4a4a42" r={[Math.PI / 2, 0, 0]} seg={10} />
      ))}
      {/* lambung karet olive + ujung membulat */}
      <B p={[0, 0.85, 0]} s={[4.0, 0.9, 1.7]} c={OLIVE} />
      <Sph p={[2.0, 0.85, 0]} s={[0.6, 0.45, 0.85]} c={OLIVE} />
      <Sph p={[-2.0, 0.85, 0]} s={[0.6, 0.45, 0.85]} c={OLIVE} />
      {/* garis las + bintang putih US Army di lambung */}
      <B p={[0, 0.85, 0.88]} s={[3.6, 0.08, 0.02]} c={OLIVE_DARK} />
      <Sph p={[-0.6, 0.9, 0.88]} s={[0.28, 0.28, 0.05]} c="#f5f2ea" />
      {/* turet + kubah + antena */}
      <B p={[-0.3, 1.65, 0]} s={[1.9, 0.8, 1.3]} c={OLIVE_LIGHT} />
      <Sph p={[-0.3, 2.05, 0]} s={[0.7, 0.3, 0.6]} c={OLIVE_LIGHT} />
      <Cyl p={[0.9, 2.3, -0.4]} s={[0.03, 0.04, 1.0, 0]} c="#2a2a22" seg={6} />
      <Sph p={[0.9, 2.82, -0.4]} s={[0.06, 0.06, 0.06]} c={AMBER} />
      {/* laras + moncong */}
      <Cyl p={[2.6, 1.7, 0]} s={[0.14, 0.18, 2.4, 0]} c={OLIVE_DARK} r={[0, 0, Math.PI / 2 - 0.06]} seg={10} />
      <Cyl p={[3.75, 1.77, 0]} s={[0.22, 0.22, 0.3, 0]} c="#2a2a22" r={[0, 0, Math.PI / 2 - 0.06]} seg={10} />
      {/* katup + selang kompresor di buritan */}
      <Cyl p={[-2.3, 1.1, 0.5]} s={[0.12, 0.12, 0.3, 0]} c="#c9a06a" r={[Math.PI / 2, 0, 0]} seg={8} />
      <Cyl p={[-2.3, 1.1, 0.9]} s={[0.05, 0.05, 0.7, 0]} c="#3a3a3a" r={[Math.PI / 2, 0, 0]} seg={6} />
      {/* lipatan karet saat belum penuh: garis lipat di lambung */}
      {inflate < 0.9 && <B p={[0.8, 0.6, 0]} s={[1.2, 0.1, 1.75]} c={OLIVE_DARK} op={0.6} />}
    </group>
  );
};

/** Kompresor udara (S4): kotak mesin + roda + pengukur + selang ke tank. */
const Compressor = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const shake = Math.sin(local * 0.6) * 0.015;
  return (
    <group position={[x, 0.05 + shake, z]} scale={[s, s, s]}>
      <B p={[0, 0.55, 0]} s={[1.6, 1.0, 1.0]} c="#6a5a2a" />
      <B p={[0, 1.1, 0]} s={[1.4, 0.2, 0.9]} c={OLIVE_DARK} />
      <Cyl p={[0.5, 0.7, 0.52]} s={[0.22, 0.22, 0.08, 0]} c="#f5f2ea" r={[Math.PI / 2, 0, 0]} seg={12} />
      <B p={[0.5, 0.7, 0.56]} s={[0.04, 0.3, 0.02]} c="#c23a12" r={[0, 0, 0.5]} />
      <Cyl p={[-0.6, 0.25, 0.52]} s={[0.22, 0.22, 0.1, 0]} c="#2a2a22" r={[Math.PI / 2, 0, 0]} seg={10} />
      <Cyl p={[0.6, 0.25, 0.52]} s={[0.22, 0.22, 0.1, 0]} c="#2a2a22" r={[Math.PI / 2, 0, 0]} seg={10} />
      {/* selang melengkung ke arah tank (kanan) */}
      <Cyl p={[1.4, 0.35, 0.3]} s={[0.06, 0.06, 1.4, 0]} c="#3a3a3a" r={[0, 0, Math.PI / 2 - 0.35]} seg={6} />
      <Cyl p={[2.2, 0.75, 0.3]} s={[0.06, 0.06, 1.0, 0]} c="#3a3a3a" r={[0, 0, 0.5]} seg={6} />
    </group>
  );
};

/** Stasiun radio palsu (S3): meja + pesawat radio + dial + antena +
 *  gelombang radio (cincin vertikal yang mengembang). Acuan anatomy
 *  fig3 (47 bagian). */
const RadioStation = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => (
  <group position={[x, 0.05, z]} scale={[s, s, s]}>
    {/* meja */}
    <B p={[0, 0.9, 0]} s={[2.6, 0.12, 1.2]} c="#6a4a2e" />
    {[-1.1, 1.1].map((dx) => (
      <B key={dx} p={[dx, 0.45, 0.45]} s={[0.12, 0.9, 0.12]} c="#4a3220" />
    ))}
    {[-1.1, 1.1].map((dx) => (
      <B key={`b-${dx}`} p={[dx, 0.45, -0.45]} s={[0.12, 0.9, 0.12]} c="#4a3220" />
    ))}
    {/* pesawat radio olive + dial + kunci morse */}
    <B p={[0, 1.35, 0]} s={[1.9, 0.8, 0.9]} c={OLIVE} />
    <Cyl p={[-0.5, 1.4, 0.47]} s={[0.2, 0.2, 0.06, 0]} c="#f5f2ea" r={[Math.PI / 2, 0, 0]} seg={12} />
    <Cyl p={[0.1, 1.4, 0.47]} s={[0.14, 0.14, 0.06, 0]} c={AMBER} r={[Math.PI / 2, 0, 0]} seg={10} />
    <Cyl p={[0.55, 1.4, 0.47]} s={[0.14, 0.14, 0.06, 0]} c="#2a2a22" r={[Math.PI / 2, 0, 0]} seg={10} />
    <B p={[0.7, 1.85, 0]} s={[0.5, 0.1, 0.3]} c="#c9a06a" />
    {/* antena tinggi + ujung amber */}
    <Cyl p={[-0.8, 2.8, -0.3]} s={[0.03, 0.04, 2.0, 0]} c="#2a2a22" seg={6} />
    <Sph p={[-0.8, 3.82, -0.3]} s={[0.07, 0.07, 0.07]} c={AMBER} />
    {/* gelombang radio: 3 cincin TIPIS menghadap kamera. Dulu cakram
        penuh (radius sampai 2.3) — di still jadi gelembung amber
        raksasa di belakang antena; sekarang annulus, radius maks 1.4. */}
    {[0, 1, 2].map((i) => {
      const ph = ((local + i * 20) % 60) / 60;
      const r = 0.4 + ph * 1.0;
      return (
        <mesh key={i} position={[-0.8, 2.6, -0.3]} material={basic(AMBER, 0.6 * (1 - ph))}>
          <ringGeometry args={[r - 0.09, r, 32]} />
        </mesh>
      );
    })}
  </group>
);

/** Gelombang suara dari speaker: cincin TIPIS yang mengembang dan
 *  memudar, menghadap kamera. Dulu cakram penuh (radius sampai 3.0,
 *  opacity 0.6) — di still terbaca sebagai dua matahari bergaris
 *  raksasa, bukan gelombang suara. Sekarang annulus tipis, radius
 *  maks 1.6, jadi terbaca sebagai riak yang menjalar. */
const SoundRings = ({ x, y, z, local }: { x: number; y: number; z: number; local: number }) => (
  <group>
    {[0, 1, 2].map((i) => {
      const ph = ((local + i * 18) % 54) / 54;
      const r = 0.5 + ph * 1.1;
      return (
        <mesh key={i} position={[x, y, z]} material={basic("#f2a93b", 0.7 * (1 - ph))}>
          <ringGeometry args={[r - 0.1, r, 32]} />
        </mesh>
      );
    })}
  </group>
);

/** Truk suara half-track (S3, S5): kabin + bak + corong speaker besar
 *  (500 pon) menghadap ke arah pos pendengar Jerman. Acuan anatomy
 *  fig2 (50 bagian). */
const SonicTruck = ({ x, z, local, s = 1, night = false }: { x: number; z: number; local: number; s?: number; night?: boolean }) => (
  <group position={[x, 0.05, z]} scale={[s, s, s]}>
    {/* bak + kabin olive */}
    <B p={[0, 0.9, 0]} s={[4.2, 1.0, 1.6]} c={OLIVE} />
    <B p={[1.5, 1.75, 0]} s={[1.4, 1.0, 1.5]} c={OLIVE_LIGHT} />
    <B p={[1.5, 1.75, 0.78]} s={[1.0, 0.6, 0.04]} c={night ? "#2a3a4a" : "#7a9ab8"} />
    {/* corong speaker besar di atas bak, menghadap kanan (+x) */}
    <Cyl p={[-0.9, 2.0, 0]} s={[0.9, 0.35, 0.7, 0]} c="#3a3a34" r={[0, 0, Math.PI / 2]} seg={16} />
    <Cyl p={[-0.45, 2.0, 0]} s={[0.35, 0.35, 0.5, 0]} c="#6a6a62" r={[0, 0, Math.PI / 2]} seg={12} />
    <Disc p={[-1.28, 2.0, 0]} s={0.88} c="#1a1a18" r={[0, Math.PI / 2, 0]} />
    {/* roda depan + rantai half-track */}
    <Cyl p={[1.9, 0.35, 0.85]} s={[0.35, 0.35, 0.12, 0]} c="#2a2a22" r={[Math.PI / 2, 0, 0]} seg={10} />
    <Cyl p={[1.9, 0.35, -0.85]} s={[0.35, 0.35, 0.12, 0]} c="#2a2a22" r={[Math.PI / 2, 0, 0]} seg={10} />
    <B p={[-0.9, 0.35, 0.85]} s={[2.6, 0.7, 0.3]} c={TRACK_DARK} />
    <B p={[-0.9, 0.35, -0.85]} s={[2.6, 0.7, 0.3]} c={TRACK_DARK} />
    {/* gelombang suara keluar dari corong */}
    <SoundRings x={-2.2} y={2.0} z={0.2} local={local} />
  </group>
);

/** Pin penanda operasi (S6): kerucut amber + bendera kecil. 22 pin =
 *  22 operasi di Eropa. */
const OperationPin = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => {
  const pop = local < 20 ? 0.6 + local * 0.02 : 1;
  return (
    <group position={[x, 0, z]} scale={[s * pop, s * pop, s * pop]}>
      <Cone p={[0, 0.35, 0]} s={[0.22, 0.7, 0]} c={AMBER} seg={8} />
      <Cyl p={[0, 0.9, 0]} s={[0.03, 0.03, 0.5, 0]} c="#2a2a22" seg={6} />
      <B p={[0.2, 1.05, 0]} s={[0.4, 0.24, 0.02]} c={OLIVE} />
    </group>
  );
};

/** Barak Camp Forrest (S2): bangunan kayu + atap + tiang bendera. */
const Barracks = ({ x, z, local, s = 1 }: { x: number; z: number; local: number; s?: number }) => (
  <group position={[x, 0, z]} scale={[s, s, s]}>
    <B p={[0, 1.2, 0]} s={[7.0, 2.4, 3.0]} c="#8a6a42" />
    <B p={[0, 2.6, 0]} s={[7.4, 0.3, 3.4]} c={OLIVE_DARK} />
    <B p={[0, 3.0, 0]} s={[6.4, 0.5, 2.8]} c="#5a3a22" />
    {[-2.4, -0.8, 0.8, 2.4].map((dx) => (
      <B key={dx} p={[dx, 1.2, 1.52]} s={[0.9, 1.2, 0.06]} c="#3a2a1a" />
    ))}
    <B p={[0, 1.0, 1.52]} s={[1.2, 2.0, 0.08]} c="#2a2018" />
    <Cyl p={[3.2, 3.6, 0]} s={[0.25, 0.25, 1.0, 0]} c="#6a4a3a" seg={8} />
    {/* tiang bendera + bendera amber */}
    <Cyl p={[5.2, 2.5, 1.2]} s={[0.05, 0.06, 5.0, 0]} c="#c9c9c9" seg={6} />
    <B p={[5.55, 4.6, 1.2]} s={[0.7, 0.45, 0.02]} c={AMBER} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Konfigurasi per adegan — olive drab #4B5320 vs amber/oranye #F2A93B */
/* (palet komplementer konsisten, aturan @tauugaksih). S5 malam       */
/* (truk suara); S8 (Jerman tertipu) lebih dingin biru-abu; S9        */
/* kembali hangat amber (payoff).                                     */
/* ------------------------------------------------------------------ */

const CFGS: Cfg[] = [
  // S1 lapangan Camp Forrest hook — siang terang, rumput olive lawan matahari amber
  { skyTop: "#2a5a8a", skyHor: "#f2c078", fog: "#7a9ab8", groundTex: () => grassTex("#6a7a3a", "#4a5a2a"), groundColor: "#6a7a3a", sunPos: [8, 12, -55], sunR: 3.2, sunColor: "#f2a93b", camPos: [0, 3.4, 15], camLook: [0, 1.0, -6], fov: 46, dirColor: "#ffe0b0", dirPos: [8, 14, 6], dirInt: 1.5, amb: 0.6, fogNear: 28, fogFar: 95 },
  // S2 halaman barak — siang, tanah camp
  { skyTop: "#3a6a9a", skyHor: "#e8c078", fog: "#9ab8cc", groundTex: dirtTex, groundColor: "#a8906a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2a93b", camPos: [0, 3.2, 15], camLook: [0, 1.4, -3], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.4, amb: 0.55, fogNear: 28, fogFar: 95 },
  // S3 tiga trik berjajar — siang terang, rumput olive
  { skyTop: "#2a5a8a", skyHor: "#f2c078", fog: "#7a9ab8", groundTex: () => grassTex("#6a7a3a", "#4a5a2a"), groundColor: "#6a7a3a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2a93b", camPos: [0, 3.4, 16], camLook: [0, 1.0, -6], fov: 46, dirColor: "#ffe0b0", dirPos: [8, 14, 6], dirInt: 1.6, amb: 0.7, fogNear: 28, fogFar: 95 },
  // S4 tank mengembang hero — kamera lebih dekat ke tank
  { skyTop: "#2a5a8a", skyHor: "#f2c078", fog: "#7a9ab8", groundTex: () => grassTex("#6a7a3a", "#4a5a2a"), groundColor: "#6a7a3a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2a93b", camPos: [0, 2.8, 13.5], camLook: [0, 1.1, -4], fov: 46, dirColor: "#ffe0b0", dirPos: [8, 14, 6], dirInt: 1.4, amb: 0.55, fogNear: 26, fogFar: 90 },
  // S5 malam, truk suara — langit gelap, bulan pucat, gelombang amber
  { skyTop: "#0e1a2e", skyHor: "#2a3a5a", fog: "#1a2a44", groundTex: () => grassTex("#4a5a38", "#333f22"), groundColor: "#4a5a38", sunPos: [-8, 16, -55], sunR: 2.4, sunColor: "#e8e8d0", camPos: [0, 3.2, 14], camLook: [0, 1.2, -5], fov: 46, dirColor: "#8aa0c0", dirPos: [-8, 12, 6], dirInt: 1.0, amb: 0.55, fogNear: 24, fogFar: 85 },
  // S6 peta operasi Eropa — siang, lapangan + 22 pin
  { skyTop: "#3a6a9a", skyHor: "#e8c078", fog: "#9ab8cc", groundTex: () => grassTex("#7a7a4a", "#5a5a32"), groundColor: "#7a7a4a", sunPos: [8, 12, -55], sunR: 3.0, sunColor: "#f2a93b", camPos: [0, 5.5, 13], camLook: [0, 0, -6], fov: 46, dirColor: "#e8f0f8", dirPos: [8, 14, 6], dirInt: 1.6, amb: 0.7, fogNear: 28, fogFar: 95 },
  // S7 Rhine di balik peta — senja di sungai
  { skyTop: "#4a5a7a", skyHor: "#e8a878", fog: "#8a9ab0", groundTex: () => grassTex("#5a6a3a", "#3a4a2a"), groundColor: "#5a6a3a", sunPos: [7, 6, -55], sunR: 3.0, sunColor: "#f2a93b", camPos: [0, 3.2, 14], camLook: [0, 1.0, -6], fov: 46, dirColor: "#ffcf9e", dirPos: [7, 10, 6], dirInt: 1.2, amb: 0.5, fogNear: 28, fogFar: 95 },
  // S8 tepi Rhine — DINGIN biru-abu (Jerman tertipu, penanda emosi)
  { skyTop: "#3a4a5a", skyHor: "#8a9ab0", fog: "#5a6a7a", groundTex: () => grassTex("#6a7a6a", "#4a5a50"), groundColor: "#6a7a6a", sunPos: [-8, 8, -55], sunR: 2.4, sunColor: "#cfe3f2", camPos: [0, 3.2, 14], camLook: [0, 1.0, -6], fov: 46, dirColor: "#cfe3f2", dirPos: [-8, 10, 6], dirInt: 1.15, amb: 0.6, fogNear: 26, fogFar: 90 },
  // S9 matahari terbit hangat amber — penyeberangan asli (payoff)
  { skyTop: "#7a3a1a", skyHor: "#f2a93b", fog: "#c98a5a", groundTex: () => grassTex("#7a6a3a", "#5a4a2a"), groundColor: "#7a6a3a", sunPos: [6, 3, -55], sunR: 4.0, sunColor: "#f2a93b", camPos: [0, 3.2, 14], camLook: [0, 1.0, -6], fov: 46, dirColor: "#ffcf9e", dirPos: [6, 8, 6], dirInt: 1.5, amb: 0.65, fogNear: 28, fogFar: 95 },
];

/* ------------------------------------------------------------------ */
/* Dunia per adegan. Foreground framing (aturan @tauugaksih): semak   */
/* dan pohon di tepi frame. Motif yang diulang: tank Sherman tiup     */
/* (S1 hook, S3, S4 hero, S8 berbaris, S9 penutup).                   */
/* ------------------------------------------------------------------ */

const Scene1World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // Tank hero mengembang di local 20-140 (ease-out-back, overshoot karet).
  const inflate = Math.min(Math.max((local - 20) / 120, 0), 1);
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      <Cloud x={-8} y={12} z={-34} s={1.1} local={local} phase={0} />
      <Cloud x={7} y={13} z={-38} s={0.9} local={local} phase={2} />
      <Hills colors={["#5a7a4a", "#4a6a3e", "#3a5a34"]} z1={-34} trees />
      <Ground cfg={cfg} />
      {/* deretan tank tiup: hero mengembang di depan, dua setengah penuh di belakang */}
      <DummyTank x={0} z={-3} local={local} s={1.15} inflate={inflate} />
      <DummyTank x={-5.5} z={-8} local={local} s={0.8} inflate={0.55} />
      <DummyTank x={5.5} z={-9} local={local} s={0.75} inflate={0.35} />
      <DummyTank x={-3} z={-12} local={local} s={0.6} inflate={0.2} />
      <DummyTank x={3.5} z={-13} local={local} s={0.6} inflate={0.7} />
      <Compressor x={-4.5} z={-1} local={local} s={0.8} />
      <Bird x={-2} y={9.5} z={-20} local={local} phase={0} />
      <Bird x={3} y={10} z={-22} local={local} phase={2} />
      <Foreground local={local} tone="green" />
    </group>
  );
};

const Scene2World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={0} />
    <Hills colors={["#5a7a4a", "#4a6a3e", "#3a5a34"]} z1={-34} trees />
    <Ground cfg={cfg} />
    <Barracks x={-1} z={-12} local={local} s={1.0} />
    {/* peti peralatan + tank tiup datar di halaman barak */}
    <B p={[-6.5, 0.4, -4]} s={[1.2, 0.8, 1.0]} c="#6a4a2e" />
    <B p={[-6.5, 1.1, -4]} s={[1.0, 0.6, 0.9]} c="#8a6a42" />
    <B p={[6.5, 0.35, -5]} s={[1.4, 0.7, 1.0]} c="#6a4a2e" />
    <DummyTank x={5.5} z={-8} local={local} s={0.7} inflate={0.15} />
    <Bird x={0} y={9.5} z={-20} local={local} phase={0} />
    <Foreground local={local} tone="sand" />
  </group>
);

const Scene3World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={1} />
    <Hills colors={["#5a7a4a", "#4a6a3e", "#3a5a34"]} z1={-34} trees />
    <Ground cfg={cfg} />
    {/* TIGA TRIK berjajar: tank karet (kiri), radio palsu (tengah),
        truk suara (kanan). Dulu x -5 / +5.5 — tank dan truk terpotong
        tepi frame; sekarang -3.2 / +3.2 supaya ketiganya utuh. */}
    <DummyTank x={-3.2} z={-5} local={local} s={0.85} inflate={1} />
    <RadioStation x={0} z={-6} local={local} s={1.0} />
    <SonicTruck x={3.2} z={-5} local={local} s={0.8} />
    <Bird x={2} y={9.5} z={-20} local={local} phase={1} />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene4World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // Tank hero mengembang penuh selama adegan (kompresor menyala).
  const inflate = Math.min(Math.max(local / 140, 0), 1);
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      <Cloud x={-8} y={12} z={-34} s={0.9} local={local} phase={0} />
      <Hills colors={["#5a7a4a", "#4a6a3e", "#3a5a34"]} z1={-34} trees />
      <Ground cfg={cfg} />
      <DummyTank x={-0.8} z={-4} local={local} s={1.05} inflate={inflate} />
      {/* Kompresor di depan-kiri tank (x -3, z -1.5): kotak utuh di
          dalam frame, selang terbaca nyambung ke tank. Dulu x -5/-4 —
          kotak keluar tepi kiri, selang jadi dua batang hitam aneh. */}
      <Compressor x={-3} z={-1.5} local={local} s={1.0} />
      {/* tank kedua masih datar di belakang, menunggu giliran.
          Dulu x 5.5 — terpotong tepi kanan; sekarang 3.8. */}
      <DummyTank x={3.8} z={-9} local={local} s={0.7} inflate={0.1} />
      {/* peti + karung pasir di foreground supaya paruh bawah frame
          tidak kosong (bug #7: f700 lama, tanah gelap tanpa isi).
          Dulu peti x -2.2 terpotong kiri, karung terlalu besar dan
          terbaca batu raksasa; sekarang lebih kecil dan ke dalam. */}
      <B p={[-1.6, 0.35, 3.5]} s={[1.2, 0.7, 1.0]} c="#6a5a2a" />
      <B p={[-1.5, 0.95, 3.5]} s={[0.9, 0.5, 0.8]} c="#7a6a3a" />
      <B p={[1.6, 0.3, 4]} s={[1.4, 0.6, 1.0]} c="#6a5a2a" />
      <Sph p={[0.7, 0.2, 4.6]} s={[0.45, 0.25, 0.35]} c="#8a7a52" />
      <Sph p={[1.5, 0.2, 4.8]} s={[0.4, 0.22, 0.32]} c="#7a6a42" />
      <Sph p={[2.2, 0.2, 4.6]} s={[0.42, 0.24, 0.33]} c="#8a7a52" />
      <Foreground local={local} tone="green" />
    </group>
  );
};

const Scene5World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={0.9} local={local} phase={1} />
    <Hills colors={["#2a3a2a", "#22301e", "#1a2a1e"]} z1={-34} trees={false} />
    <Ground cfg={cfg} />
    {/* MALAM: truk suara di tengah, gelombang amber keluar dari corong;
        pos pendengar Jerman = bunker kecil jauh di kanan */}
    <SonicTruck x={-1} z={-5} local={local} s={1.1} night />
    <B p={[6.5, 0.8, -10]} s={[2.2, 1.6, 1.6]} c="#3a3a34" />
    <B p={[6.5, 1.0, -9.1]} s={[0.8, 0.5, 0.1]} c="#1a1a18" />
    <SoundRings x={4} y={2.2} z={-6} local={local} />
    {/* bunker kedua di kiri jauh supaya malam tidak kosong di satu sisi */}
    <B p={[-6.5, 0.7, -11]} s={[1.8, 1.4, 1.4]} c="#2a2a26" />
    <Foreground local={local} tone="dark" />
  </group>
);

const Scene6World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => {
  // 22 pin operasi muncul berurutan (satu pin tiap 5 frame, supaya di
  // tengah adegan sudah belasan pin kelihatan, bukan 5 kerucut kecil).
  // Pin dibesarkan s 1.5 dan baris dijauhkan supaya terbaca dari kamera
  // tinggi; tank penjaga ditarik ke dalam (x +-3.2) supaya tidak
  // terpotong tepi frame.
  const shown = Math.min(Math.floor(local / 5) + 1, 22);
  const pins: [number, number][] = [];
  for (let i = 0; i < 22; i++) {
    const row = Math.floor(i / 11);
    const col = i % 11;
    pins.push([-6.75 + col * 1.35, -6 - row * 4]);
  }
  return (
    <group>
      <Sky cfg={cfg} local={local} />
      <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={0} />
      <Hills colors={["#5a7a4a", "#4a6a3e", "#3a5a34"]} z1={-34} trees />
      <Ground cfg={cfg} />
      {pins.slice(0, shown).map(([x, z], i) => (
        <OperationPin key={i} x={x} z={z} local={local - i * 5} s={1.5} />
      ))}
      {/* dua tank tiup penjaga di depan barisan pin */}
      <DummyTank x={-3.2} z={-2} local={local} s={0.7} inflate={1} />
      <DummyTank x={3.2} z={-2} local={local} s={0.7} inflate={1} />
      <Foreground local={local} tone="green" />
    </group>
  );
};

const Scene7World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={12} z={-34} s={1.0} local={local} phase={1} />
    <Ground cfg={cfg} />
    <River local={local} color="#2a5a8a" z={-18} depth={26} />
    {/* tank tiup di tepian DEKAT (z -2..-4): sungai mulai z -5, jadi tank
        harus menapak di darat, BUKAN di atas air (bug Beer Flood #6). */}
    <DummyTank x={-5} z={-3} local={local} s={0.7} inflate={1} />
    <DummyTank x={0} z={-2} local={local} s={0.7} inflate={1} />
    <DummyTank x={5} z={-3.5} local={local} s={0.7} inflate={1} />
    <Foreground local={local} tone="green" />
  </group>
);

const Scene8World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1.0} local={local} phase={0} />
    <Ground cfg={cfg} />
    <River local={local} color="#3a5a7a" z={-18} depth={26} />
    {/* ENAM RATUS tank tiup (diwakili barisan 12 tank) di tepi Rhine.
        Tepian dekat: sungai mulai z -5, jadi barisan di z -2..-4.5
        menapak di darat, BUKAN mengambang di atas air (bug Beer Flood #6). */}
    {[-7.5, -6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6, 7.5, -9].map((x, i) => (
      <DummyTank key={i} x={x} z={-2 - (i % 3) * 1.2} local={local} s={0.65} inflate={1} />
    ))}
    <Foreground local={local} tone="dark" />
  </group>
);

const Scene9World: React.FC<{ local: number; cfg: Cfg }> = ({ local, cfg }) => (
  <group>
    <Sky cfg={cfg} local={local} />
    <Cloud x={-8} y={11} z={-34} s={1} local={local} phase={1} />
    <Ground cfg={cfg} />
    <River local={local} color="#4a6a8a" z={-18} depth={26} />
    {/* jembatan ponton + truk pasukan asli menyeberang hampir tanpa halangan.
        Jembatan HARUS punya penyangga kelihatan (bug Beer Flood #13):
        ponton barel di bawah dek, bukan papan melayang. */}
    <B p={[0, 0.35, -18]} s={[16, 0.3, 2.2]} c="#5a4a2a" />
    {[-7, -5, -3, -1, 1, 3, 5, 7].map((x, i) => (
      <Cyl key={i} p={[x, -0.2, -18]} s={[0.45, 0.45, 2.0, 0]} c="#3a3a34" r={[Math.PI / 2, 0, 0]} seg={10} />
    ))}
    {/* Truk pasukan asli di atas jembatan: bak + kabin + 4 roda, jadi
        terbaca sebagai truk, bukan balok gelap (still f1520). */}
    {[-5, -2, 1, 4].map((x, i) => (
      <group key={i} position={[x, 0.5, -18]}>
        <B p={[0, 0.6, 0]} s={[1.8, 0.7, 1.4]} c={OLIVE} />
        <B p={[0.65, 1.2, 0]} s={[0.6, 0.6, 1.2]} c={OLIVE_LIGHT} />
        <Cyl p={[-0.6, 0.28, 0.72]} s={[0.28, 0.28, 0.15, 0]} c="#1a1a18" r={[Math.PI / 2, 0, 0]} seg={10} />
        <Cyl p={[0.6, 0.28, 0.72]} s={[0.28, 0.28, 0.15, 0]} c="#1a1a18" r={[Math.PI / 2, 0, 0]} seg={10} />
        <Cyl p={[-0.6, 0.28, -0.72]} s={[0.28, 0.28, 0.15, 0]} c="#1a1a18" r={[Math.PI / 2, 0, 0]} seg={10} />
        <Cyl p={[0.6, 0.28, -0.72]} s={[0.28, 0.28, 0.15, 0]} c="#1a1a18" r={[Math.PI / 2, 0, 0]} seg={10} />
      </group>
    ))}
    {/* motif penutup: satu tank tiup di tepi sungai (z -3, di darat
        sebelum sungai mulai z -5), tugasnya selesai. Dulu x -5.5
        (setengah keluar kiri), lalu x +3.5 (laras keluar kanan) —
        sekarang x +0.5, s 0.7, utuh di dalam frame. */}
    <DummyTank x={0.5} z={-3} local={local} s={0.7} inflate={1} />
    <Bird x={1} y={9.5} z={-20} local={local} phase={0} />
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
  const [warmHandle] = useState(() => delayRender("ghostarmy3d warmup"));
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

/** Dunia 3D untuk satu adegan. Dipakai Video23 di bawah overlay karakter. */
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
