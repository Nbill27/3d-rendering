// Timeline NEGARA SISTEM BOBROK: shot timed to the voice words, camera grammar from the
// cartoon_3d_short skill: continuous slow push-ins; symmetric ease-in-out glides ~23 f;
// big reframes are cuts; impacts are 7-frame kicks that flip sign every frame; no hand-held float.
// Every hold creeps (no static hold >= 4 f).
export const FPS = 30;
export const TOTAL = 1800;
export const D0 = 0;
export type V3 = [number, number, number];

// ---- key places (ground y=0; north = -z) ----
export const GOV: V3 = [0, 0, -28]; // government building centre (front face z=-22)
export const STAGE_POS: V3 = [0, 0, -18]; // stage in front of the government building
export const PROJECT_POS: V3 = [-32, 0, -10]; // unfinished project (west)
export const OFFICE_POS: V3 = [32, 0, -6]; // office with the queue (east)
export const BUCKET_POS: V3 = [18, 0, 22]; // leaky-bucket analogy in the south park (golden)
export const PLAZA: V3 = [0, 0, 0];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- story physics (tau = story time in seconds) ----------------
export const SNAP = 34.6; // the stamp runs out of ink, in story seconds (f 1038, inside shot 7)
/** budget leak 0..1: the pipe starts dripping with line 5 and keeps leaking */
export const leak = (tau: number) => smooth((tau - 21.2) / 3);
/** queue length 0..1: grows through shot 6, collapses at the SNAP */
export const queueLen = (tau: number) => (tau < SNAP ? lin([[26.7, 0.3], [32.8, 1]], tau) : Math.max(0, 1 - (tau - SNAP) / 2.5));

export type TownState = { leak: number; snap: number; queue: number; snapped: boolean };
export const townState = (id: number, t: number): TownState => {
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  return { leak: leak(tau), snap: clamp01((tau - SNAP) / 0.7), queue: queueLen(tau), snapped: tau >= SNAP };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "town" | "stage" | "project" | "leak" | "queue" | "snap" | "deadpan" | "bucket" | "self" | "final" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 161, light: "day", crowd: "town", tau: (t) => t, towns: true },
  { id: 2, a: 161, b: 289, light: "day", crowd: "town", tau: (t) => t, towns: true },
  { id: 3, a: 289, b: 442, light: "day", crowd: "stage", tau: (t) => t },
  { id: 4, a: 442, b: 636, light: "day", crowd: "project", tau: (t) => t },
  { id: 5, a: 636, b: 802, light: "day", crowd: "leak", tau: (t) => t },
  { id: 6, a: 802, b: 984, light: "day", crowd: "queue", tau: (t) => t },
  { id: 7, a: 984, b: 1171, light: "day", crowd: "snap", tau: (t) => t },
  { id: 8, a: 1171, b: 1311, light: "day", crowd: "deadpan", tau: (t) => t },
  { id: 9, a: 1311, b: 1411, light: "golden", crowd: "bucket", tau: (t) => t },
  { id: 10, a: 1411, b: 1529, light: "golden", crowd: "bucket", tau: (t) => t },
  { id: 11, a: 1529, b: 1700, light: "golden", crowd: "self", tau: (t) => t, towns: true },
  { id: 12, a: 1700, b: TOTAL, light: "golden", crowd: "final", tau: (t) => t, towns: true },
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 8, 6: 8, 9: 8, 12: 8 };
export const FLASH_AT = 130;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });

// ---- framings (f -> camera); each pushes in from the frame its key starts ----
// S1 hook: wide plaza, government building behind the stage, people walking.
const S1a = (f: number) => dolly([16, 8, 26], [0, 4, -14], pushK(f, 0, 0.0025), { fov: 44 });
const S1b = (f: number) => dolly([12, 6, 20], [0, 3.5, -16], pushK(f, 72, 0.002), { fov: 40 });
// S2 setting: aerial over the town, plaza + roofs + streets.
const S2a = (f: number) => dolly([-2, 11, 38], [0, 3, -14], pushK(f, 161, 0.002), { fov: 44 });
const S2b = (f: number) => dolly([-12, 9, 30], [0, 3, -14], pushK(f, 220, 0.002), { fov: 42 });
// S3 stage: official on the stage, crowd in front cheering. Camera south of the stage looking north.
const S3a = (f: number) => dolly([7, 3.5, -4], [0, 2.2, -18], pushK(f, 289, 0.0025), { fov: 40 });
const S3b = (f: number) => dolly([5, 3.2, -3], [0, 2.4, -18], pushK(f, 360, 0.002), { fov: 36, roll: 0.03 });
// S4 project: wide on the unfinished skeleton, then closer on the idle crane + weeds.
const S4a = (f: number) => dolly([-14, 7, 8], [-32, 4, -10], pushK(f, 442, 0.002), { fov: 42 });
const S4b = (f: number) => dolly([-20, 5, 2], [-32, 3, -10], pushK(f, 540, 0.0025), { fov: 38 });
// S5 leak: the big pipe from the government building, coins dripping into small buckets below.
const S5a = (f: number) => dolly([0, 6, -2], [-16, 3, -24], pushK(f, 636, 0.002), { fov: 42 });
const S5b = (f: number) => dolly([-6, 3.5, -10], [-16, 2, -24], pushK(f, 720, 0.0025), { fov: 38 });
// S6 queue: the long queue snaking from the office door, one window open.
const S6a = (f: number) => dolly([24, 7, 16], [32, 2, -4], pushK(f, 802, 0.002), { fov: 44 });
const S6b = (f: number) => dolly([26, 4, 12], [32, 2, -4], pushK(f, 890, 0.002), { fov: 40 });
// S7 snap: the clerk at the window, stamp out of ink; then the queue breaking up.
const S7a = (f: number) => dolly([26, 3, 4], [32, 1.8, -2], pushK(f, 984, 0.0025), { fov: 38 });
const S7b = (f: number) => dolly([28, 6, 16], [32, 1, -2], pushK(f, 1038, 0.002, 0.006, 30), { fov: 42 });
// S8 deadpan: villagers sitting on the pavement, empty queue posts, flat light.
const S8a = (f: number) => dolly([24, 2.5, 10], [32, 0.8, -2], pushK(f, 1171, 0.0018), { fov: 42, roll: -0.03 });
const S8b = (f: number) => dolly([26, 2, 8], [32, 0.8, -2], pushK(f, 1240, 0.0018), { fov: 38, roll: 0.03 });
// S9 golden bucket wide: park, the big leaky bucket, water dripping out.
const S9a = (f: number) => zoom([18, 5, 4], [18, 1, 22], 44, pushK(f, 1311, 0.0016));
// S10 golden bucket close: a villager pours water in the top, drops fall out the holes; a kid points.
const S10a = (f: number) => dolly([10, 4, 8], [18, 1.2, 22], pushK(f, 1411, 0.0015), { fov: 42 });
const S10b = (f: number) => dolly([26, 4, 10], [18, 1.2, 22], pushK(f, 1470, 0.0015), { fov: 40 });
// S11 golden self-reliance: villagers walking home, fixing a fence, carrying their own things.
const S11a = (f: number) => dolly([10, 5, 26], [0, 1.5, 6], pushK(f, 1529, 0.0015), { fov: 42 });
const S11b = (f: number) => dolly([-6, 4, 22], [0, 1.5, 4], pushK(f, 1610, 0.0015), { fov: 40 });
// S12 golden callback: the stage again at sunset, a new promise, crowd cheering, crane out.
const S12a = (f: number) => dolly([16, 8, 10], [0, 3, -18], pushK(f, 1700, 0.002), { fov: 44 });
const S12b = (f: number) => dolly([-14, 12, 16], [0, 3, -16], pushK(f, 1750, 0.0015), { fov: 44 });

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 72, dur: 32, s: S1b },
  ],
  2: [
    { f: 161, s: S2a },
    { f: 220, dur: 18, s: S2b },
  ],
  3: [
    { f: 289, s: S3a },
    { f: 360, dur: 20, s: S3b },
  ],
  4: [
    { f: 442, s: S4a },
    { f: 540, dur: 40, s: S4b },
  ],
  5: [
    { f: 636, s: S5a },
    { f: 720, dur: 20, s: S5b },
  ],
  6: [
    { f: 802, s: S6a },
    { f: 890, dur: 24, s: S6b },
  ],
  7: [
    { f: 984, s: S7a },
    { f: 1038, cut: true, s: S7b },
  ],
  8: [
    { f: 1171, s: S8a },
    { f: 1240, dur: 18, s: S8b },
  ],
  9: [{ f: 1311, s: S9a }],
  10: [
    { f: 1411, s: S10a },
    { f: 1470, dur: 28, s: S10b },
  ],
  11: [
    { f: 1529, s: S11a },
    { f: 1610, dur: 28, s: S11b },
  ],
  12: [
    { f: 1700, s: S12a },
    { f: 1750, dur: 30, s: S12b },
  ],
};

// impact kicks: flip sign every frame, decay to 0 in 7 f, start on the event frame
const KICKS: [number, number][] = [[SNAP, 1], [SNAP + 0.7, 1.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f / FPS);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens: depth of field ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 72, dur: 32, cInf: 10, focus: () => [0, 2.2, -18] },
  { f: 161, cInf: 0 },
  { f: 289, cInf: 12, focus: () => [0, 2.4, -18] },
  { f: 442, cInf: 0 },
  { f: 540, dur: 40, cInf: 10 },
  { f: 636, cInf: 0 },
  { f: 720, dur: 20, cInf: 12 },
  { f: 802, cInf: 0 },
  { f: 890, dur: 24, cInf: 12, focus: () => [32, 1.8, -6] },
  { f: 984, cInf: 12, focus: () => [32, 1.8, -6] },
  { f: 1038, cInf: 0 },
  { f: 1171, cInf: 6, focus: () => [32, 0.8, -2] },
  { f: 1311, cInf: 7 },
  { f: 1411, cInf: 12, focus: () => [18, 1, 22] },
  { f: 1529, cInf: 0 },
  { f: 1700, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing objects: visible while a <= f < b; kit = a GLB name accepted by build.ts prop() */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 1311, b: 1529, kit: "plant_bushDetailed", pos: [BUCKET_POS[0] + 4.5, 0, BUCKET_POS[2] - 4.5], s: 1.0, yaw: 0.4 },
];
