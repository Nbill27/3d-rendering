// Timeline VIDEO05: shot timed to the voice words, camera grammar from the
// cartoon_3d_short skill: continuous slow push-ins; symmetric ease-in-out glides ~23 f;
// big reframes are cuts; every hold creeps (no static hold >= 4 f).
// True story: the Great Molasses Flood, Boston, 15 January 1919 — a badly built
// 2.3-million-gallon tank burst and a 25-foot wave of syrup swept Commercial Street.
// One location: Commercial Street, North End, Boston. Three beats, one question:
// "How did a wave of syrup kill 21 people?"
export const FPS = 30;
export const TOTAL = 1800;
export const D0 = 0;
export type V3 = [number, number, number];

// ---- key places (ground y=0; north = -z; the street runs south from the tank) ----
export const TANK_POS: V3 = [0, 0, -40]; // giant molasses tank (centre; radius 13.5, height 15)
export const TANK_FACE_Z = -26.5; // south face of the tank, where the street starts
export const EL_X = -11.5; // Boston Elevated Railway, west side of the street
export const STREET_X = 0; // Commercial Street centre
export const HOUSES_E_X = 16; // brick row houses, east side (face west)
export const HOUSES_W_X = -20; // brick row houses, west side (face east, behind the el)

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- story motion (t = story time in seconds) ----------------
/** the rupture: 0 before 22 s, 1 by 22.8 s (the tank bursts at half past twelve) */
export const burstK = (t: number) => clamp01((t - 22) / 0.8);
/** the wave front: starts at the tank face at 22 s, reaches the far end of the street by ~36 s */
export const waveZ = (t: number) => TANK_FACE_Z + 76 * clamp01((t - 22) / 14);
/** molasses street coverage: 0 before the burst, full street by ~40 s */
export const poolK = (t: number) => clamp01((t - 22) / 18);
/** the elevated train, lifted off its tracks: 0 before 35 s, fully tilted by 40 s */
export const trainTilt = (t: number) => clamp01((t - 35) / 5);
/** horse cart fleeing south down the street during the wave (shots 6-7) */
export const cartZ = (t: number) => -8 + 44 * clamp01((t - 27) / 9);

export type StoryState = { burst: number; wave: number; pool: number; train: number };
export const storyState = (id: number, t: number): StoryState => {
  void id;
  return { burst: burstK(t), wave: waveZ(t), pool: poolK(t), train: trainTilt(t) };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "tank" | "leak" | "plates" | "street" | "burst" | "wave" | "smash" | "aftermath" | "cleanup" | "sunset" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 150, light: "day", crowd: "tank", tau: (t) => t, towns: true },
  { id: 2, a: 150, b: 330, light: "day", crowd: "leak", tau: (t) => t },
  { id: 3, a: 330, b: 510, light: "day", crowd: "plates", tau: (t) => t },
  { id: 4, a: 510, b: 660, light: "day", crowd: "street", tau: (t) => t, towns: true },
  { id: 5, a: 660, b: 840, light: "day", crowd: "burst", tau: (t) => t },
  { id: 6, a: 840, b: 1050, light: "day", crowd: "wave", tau: (t) => t },
  { id: 7, a: 1050, b: 1260, light: "day", crowd: "smash", tau: (t) => t },
  { id: 8, a: 1260, b: 1440, light: "day", crowd: "aftermath", tau: (t) => t },
  { id: 9, a: 1440, b: 1620, light: "golden", crowd: "cleanup", tau: (t) => t },
  { id: 10, a: 1620, b: TOTAL, light: "golden", crowd: "sunset", tau: (t) => t, towns: true },
];
/** crossfades (frames) at place/time changes; the burst is a hard cut with a white flash + camera kick */
export const XFADE: Record<number, number> = { 2: 8, 4: 8, 8: 8, 9: 8 };
export const FLASH_AT = 660;

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
// ---- framings (f -> camera); each pushes in from the frame its key starts ----
// S1 hook: the giant tank towers over Commercial Street; workers, residents and a horse cart below.
// Camera pulled back so the whole tank, roof, street, houses and el all read in one frame.
const S1a = (f: number) => dolly([9, 5, 26], [0, 6, -32], pushK(f, 0, 0.0025), { fov: 46 });
const S1b = (f: number) => dolly([8, 4.2, 20], [0, 6, -32], pushK(f, 72, 0.002), { fov: 42 });
// S2 the leak: tank base, brown drip streaks, a worker pointing up at the leak.
const S2a = (f: number) => dolly([7, 2.4, -12], [0, 3, -26], pushK(f, 150, 0.002), { fov: 40 });
const S2b = (f: number) => dolly([5, 2.0, -16], [0, 2.5, -26.5], pushK(f, 240, 0.0025), { fov: 36 });
// S3 the plates: low angle up the riveted tank wall, drips glistening; a worker shakes his head.
const S3a = (f: number) => dolly([8, 2.5, -6], [0, 3.5, -27], pushK(f, 330, 0.0015), { fov: 40 });
const S3b = (f: number) => dolly([7, 2, -10], [-2, 4, -27], pushK(f, 420, 0.0015), { fov: 38 });
// S4 street life: horse cart, strolling residents, the elevated train passing; bright midday sun.
const S4a = (f: number) => dolly([9, 3.2, 22], [0, 1.5, -4], pushK(f, 510, 0.0018), { fov: 44 });
const S4b = (f: number) => dolly([7, 2.6, 14], [-2, 1.4, -10], pushK(f, 580, 0.002), { fov: 40 });
// S5 the burst: the tank ruptures, brown molasses explodes out toward the camera.
const S5a = (f: number) => dolly([7, 3.2, -6], [0, 2.5, -26], pushK(f, 660, 0.0015), { fov: 42 });
const S5b = (f: number) => dolly([8, 4, -2], [-2, 2.5, -26], pushK(f, 740, 0.0015), { fov: 44 });
// S6 the wave: the giant brown wave front sweeps down the street; camera tracks just ahead of it.
const S6a = (f: number) => { const z = waveZ(f / FPS); return dolly([8, 3.2, z + 12], [0, 3, z], pushK(f, 840, 0.0018), { fov: 42 }); };
const S6b = (f: number) => { const z = waveZ(f / FPS); return dolly([6.5, 2.6, z + 9], [0, 2.8, z], pushK(f, 940, 0.002), { fov: 38 }); };
// S7 the smash: the wave hits the houses and lifts the elevated train off its tracks.
const S7a = (f: number) => dolly([6, 4, 50], [-3, 3, 14], pushK(f, 1050, 0.0018), { fov: 55 });
const S7b = (f: number) => dolly([7, 4.5, 54], [-4, 3.5, 16], pushK(f, 1150, 0.002), { fov: 55 });
// S8 aftermath: the street covered in brown molasses; firemen and residents wade through it.
const S8a = (f: number) => dolly([8, 3.2, 20], [0, 1, 2], pushK(f, 1260, 0.002), { fov: 42 });
const S8b = (f: number) => dolly([6, 2.6, 14], [0, 1, 0], pushK(f, 1350, 0.0025), { fov: 38 });
// S9 cleanup at golden hour: firemen hosing, residents scrubbing, warm low sun.
const S9a = (f: number) => dolly([4, 3.5, 22], [0, 1.2, 2], pushK(f, 1440, 0.0018), { fov: 48 });
const S9b = (f: number) => dolly([2, 3, 18], [0, 1, 2], pushK(f, 1530, 0.002), { fov: 48 });
// S10 closing: wide pull-back of the street at sunset, molasses sheen, the tank in the distance.
const S10a = (f: number) => dolly([6, 6, 48], [0, 3, -24], pushK(f, 1620, 0.0015), { fov: 50 });
const S10b = (f: number) => dolly([8, 8, 54], [0, 3, -26], pushK(f, 1710, 0.0015), { fov: 52 });

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 72, dur: 32, s: S1b },
  ],
  2: [
    { f: 150, s: S2a },
    { f: 240, dur: 24, s: S2b },
  ],
  3: [
    { f: 330, s: S3a },
    { f: 420, dur: 24, s: S3b },
  ],
  4: [
    { f: 510, s: S4a },
    { f: 580, dur: 20, s: S4b },
  ],
  5: [
    { f: 660, s: S5a },
    { f: 740, dur: 24, s: S5b },
  ],
  6: [
    { f: 840, s: S6a },
    { f: 940, dur: 24, s: S6b },
  ],
  7: [
    { f: 1050, s: S7a },
    { f: 1150, dur: 24, s: S7b },
  ],
  8: [
    { f: 1260, s: S8a },
    { f: 1350, dur: 24, s: S8b },
  ],
  9: [
    { f: 1440, s: S9a },
    { f: 1530, dur: 24, s: S9b },
  ],
  10: [
    { f: 1620, s: S10a },
    { f: 1710, dur: 30, s: S10b },
  ],
};

// impact moment: the tank bursts at t = 22 s — one camera kick, decaying over 7 frames
const KICKS: [number, number][] = [[22.0, 1.4]];
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
  { f: 72, dur: 32, cInf: 10, focus: () => [0, 6.5, -30] },
  { f: 150, cInf: 0 },
  { f: 240, dur: 24, cInf: 12, focus: () => [0, 2.5, -26] },
  { f: 330, cInf: 0 },
  { f: 420, dur: 24, cInf: 10, focus: () => [0, 9, -32] },
  { f: 510, cInf: 0 },
  { f: 660, cInf: 0 },
  { f: 740, dur: 24, cInf: 12, focus: (f) => [0, 4, waveZ(f / FPS)] },
  { f: 840, cInf: 0 },
  { f: 940, dur: 24, cInf: 10, focus: (f) => [0, 2.8, waveZ(f / FPS)] },
  { f: 1050, cInf: 0 },
  { f: 1150, dur: 24, cInf: 12, focus: () => [-11.5, 6, 20] },
  { f: 1260, cInf: 0 },
  { f: 1350, dur: 24, cInf: 10, focus: () => [0, 1, 0] },
  { f: 1440, cInf: 0 },
  { f: 1530, dur: 24, cInf: 10, focus: () => [0, 1, -2] },
  { f: 1620, cInf: 0 },
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
  { a: 0, b: 150, kit: "cart", pos: [5.5, 0, 14], s: 2.2, yaw: 0.4 },
  { a: 510, b: 660, kit: "cart", pos: [-5, 0, 8], s: 2.2, yaw: -0.3 },
  { a: 1440, b: 1620, kit: "cart", pos: [5, 0, 6], s: 2.2, yaw: 0.5 },
];
