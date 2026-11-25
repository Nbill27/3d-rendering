// Timeline VIDEO06: shot timed to the voice words, camera grammar from the
// cartoon_3d_short skill: continuous slow push-ins; symmetric ease-in-out glides ~23 f;
// big reframes are cuts; every hold creeps (no static hold >= 4 f).
// True story: Tsutomu Yamaguchi, the only person officially recognized as surviving
// both atomic bombings, Hiroshima 6 Aug 1945 and Nagasaki 9 Aug 1945.
// One question: "How did one man survive TWO atomic bombs?"
// Chain: he was in Hiroshima on business, so he caught the first bomb.
// He went home to Nagasaki because it was home, so he caught the second.
// He survived both, so he is the only person officially recognized for both.
// Emotion: awe and disbelief. Tone: respectful and serious, never funny.
// Every fact below is source-verified (see projects/yamaguchi/SCRIPT.md);
// no invented scene, dialogue or quote.
export const FPS = 30;
export const TOTAL = 1800;
export const D0 = 0;
export type V3 = [number, number, number];

// ---- key places (ground y=0; north = -z) ----
export const HIRO_OFFICE_POS: V3 = [14, 0, -30]; // Mitsubishi office, Hiroshima (east side, north end)
export const STATION_POS: V3 = [-14, 0, -32]; // Hiroshima railway station (west side, north end)
export const NAGA_OFFICE_POS: V3 = [14, 0, 30]; // Mitsubishi office, Nagasaki (east side, south end)
export const HALL_POS: V3 = [-14, 0, 32]; // civic hall, Nagasaki (west side, south end)
export const STREET_X = 0; // main street running south through both cities
export const TRACK_X = -8; // railway tracks, west of the street
export const DITCH_POS: V3 = [-2.5, 0, -12]; // the roadside ditch Yamaguchi dives into

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
// ---------------- story motion (t = story time in seconds) ----------------
/** shot 1 (0-5 s): Yamaguchi walks south down the Hiroshima street toward the station, z -28 -> -16 */
export const walkZ = (t: number) => -28 + 12 * clamp01(t / 5);
/** shot 3 (10-15 s): after the flash at 12.5 s he dives into the ditch; the dive runs 12.5-13.5 s */
export const diveAt = (t: number) => clamp01((t - 12.5) / 1);
/** shot 5 (22-27 s): the train runs south on the tracks, z -40 -> +12 */
export const trainZ = (t: number) => -40 + 52 * clamp01((t - 22) / 5);
/** shot 4 (15-22 s): Yamaguchi stumbles south through the rubble, z -10 -> -2 */
export const stumbleZ = (t: number) => -10 + 8 * clamp01((t - 15) / 7);
/** shot 8 (37-42 s): Yamaguchi stumbles away from the Nagasaki office, z 26 -> 20 */
export const dazedZ = (t: number) => 26 - 6 * clamp01((t - 37) / 5);

export type StoryState = { walk: number; dive: number; train: number; stumble: number; dazed: number };
export const storyState = (id: number, t: number): StoryState => {
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  return {
    walk: clamp01(tau / 5), dive: diveAt(tau), train: clamp01((tau - 22) / 5),
    stumble: clamp01((tau - 15) / 7), dazed: clamp01((tau - 37) / 5),
  };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "street" | "office" | "flash1" | "ruin1" | "train" | "office2" | "flash2" | "ruin2" | "honor" | "hills" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 150, light: "day", crowd: "street", tau: (t) => t },
  { id: 2, a: 150, b: 300, light: "day", crowd: "office", tau: (t) => t },
  { id: 3, a: 300, b: 450, light: "day", crowd: "flash1", tau: (t) => t },
  { id: 4, a: 450, b: 660, light: "day", crowd: "ruin1", tau: (t) => t },
  { id: 5, a: 660, b: 810, light: "day", crowd: "train", tau: (t) => t },
  { id: 6, a: 810, b: 990, light: "day", crowd: "office2", tau: (t) => t },
  { id: 7, a: 990, b: 1110, light: "day", crowd: "flash2", tau: (t) => t },
  { id: 8, a: 1110, b: 1260, light: "day", crowd: "ruin2", tau: (t) => t },
  { id: 9, a: 1260, b: 1530, light: "day", crowd: "honor", tau: (t) => t },
  { id: 10, a: 1530, b: TOTAL, light: "golden", crowd: "hills", tau: (t) => t },
];
/** crossfades (frames) at place/time changes; a white 4-frame flash at each bomb blast */
export const XFADE: Record<number, number> = { 2: 8, 5: 8, 6: 8, 9: 8, 10: 8 };
export const FLASH_AT = 375; // 12.5 s: the first bomb, Hiroshima
export const FLASH2_AT = 1050; // 35.0 s: the second bomb, Nagasaki

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
// S1 hook: Yamaguchi walks south down the Hiroshima street toward the station, morning light,
// wooden houses on both sides, the office behind him. Camera tracks him from the south-east,
// close and low, so he is big in the frame (hook) and the street props fill the cobble.
const S1a = (f: number) => { const z = walkZ(f / FPS); return dolly([2.5, 2.4, z + 9], [-0.5, 1.2, z], pushK(f, 0, 0.002), { fov: 42 }); };
const S1b = (f: number) => { const z = walkZ(f / FPS); return dolly([2.2, 2.0, z + 7.5], [-0.5, 1.2, z], pushK(f, 72, 0.0025), { fov: 40 }); };
// S2 office: Yamaguchi and two colleagues in front of the Mitsubishi office, papers in hand,
// the last morning before the bomb. Camera on the street, looking east at the office entrance.
const S2a = (f: number) => dolly([0, 4, -12], [5, 1.6, -27], pushK(f, 150, 0.002), { fov: 42 });
const S2b = (f: number) => dolly([2, 3.2, -16], [5, 1.5, -27], pushK(f, 220, 0.0025), { fov: 38 });
// S3 flash: Yamaguchi walking on the street; at 12.5 s the sky erupts white and he dives for the ditch.
// Camera low and close on the road axis, looking north up the street so the flash fills the sky behind him.
const S3a = (f: number) => dolly([1.8, 1.9, -7], [0, 1.1, -16], pushK(f, 300, 0.002), { fov: 44 });
const S3b = (f: number) => dolly([1.4, 1.7, -8], [0, 1.0, -14], pushK(f, 380, 0.0025), { fov: 42 });
// S4 ruin: the aftermath — smoke columns, rubble, tilted houses. Yamaguchi, bandaged, stumbles south
// through the wreckage with two colleagues. Low angle, the ruined street looming.
const S4a = (f: number) => dolly([4, 3.2, 6], [0, 1.2, -8], pushK(f, 450, 0.0018), { fov: 42 });
const S4b = (f: number) => dolly([3, 2.6, 2], [0, 1.2, -6], pushK(f, 540, 0.002), { fov: 40 });
// S5 train: the train runs south on the tracks; Yamaguchi, bandaged, rides at the carriage door.
// Camera east of the tracks, tracking south with the train.
const S5a = (f: number) => { const z = trainZ(f / FPS); return dolly([4, 4, z - 10], [-8, 1.8, z + 2], pushK(f, 660, 0.0018), { fov: 42 }); };
const S5b = (f: number) => { const z = trainZ(f / FPS); return dolly([3, 3.5, z - 8], [-8, 1.6, z + 3], pushK(f, 720, 0.002), { fov: 40 }); };
// S6 office2: Nagasaki — Yamaguchi, bandaged, telling his supervisor about Hiroshima in front of
// the office, colleagues listening. Camera on the street, looking east at the office entrance.
const S6a = (f: number) => dolly([0, 4, 14], [5, 1.6, 29.5], pushK(f, 810, 0.002), { fov: 42 });
const S6b = (f: number) => dolly([2, 3.2, 18], [5, 1.5, 29.5], pushK(f, 900, 0.0025), { fov: 38 });
// S7 flash2: the same office front; at 35 s the sky erupts again and the building shakes.
// Camera pulled back south so the whole office front and the sky above it fit the frame.
const S7a = (f: number) => dolly([-6, 5, 50], [5, 3, 30], pushK(f, 990, 0.002), { fov: 44 });
const S7b = (f: number) => dolly([-4, 4.5, 46], [5, 2.8, 30], pushK(f, 1050, 0.0025), { fov: 42 });
// S8 ruin2: the second aftermath — the Nagasaki office damaged, smoke, Yamaguchi's bandages blown
// off, everyone dazed. Low angle, Yamaguchi stumbling away from the office.
const S8a = (f: number) => dolly([0, 4, 6], [7, 1.5, 24], pushK(f, 1110, 0.0018), { fov: 42 });
const S8b = (f: number) => dolly([0, 3.5, 10], [7, 1.5, 22], pushK(f, 1180, 0.002), { fov: 40 });
// S9 honor: 2009 — older Yamaguchi receives the official recognition certificate from an official
// in front of the civic hall, a small crowd watching. Dignified medium shot.
const S9a = (f: number) => dolly([-2, 4, 14], [-5, 1.6, 31], pushK(f, 1260, 0.002), { fov: 40 });
const S9b = (f: number) => dolly([0, 3.5, 18], [-5, 1.5, 31], pushK(f, 1380, 0.0025), { fov: 38 });
// S10 hills: golden sunset — older Yamaguchi on a hill above Nagasaki, looking out over the rebuilt
// city. Wide pull-back.
const S10a = (f: number) => dolly([0, 5, 44], [0, 3, 66], pushK(f, 1530, 0.0015), { fov: 42 });
const S10b = (f: number) => dolly([4, 8, 40], [0, 3, 68], pushK(f, 1680, 0.0015), { fov: 44 });

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 72, dur: 32, s: S1b },
  ],
  2: [
    { f: 150, s: S2a },
    { f: 220, dur: 20, s: S2b },
  ],
  3: [
    { f: 300, s: S3a },
    { f: 380, dur: 24, s: S3b },
  ],
  4: [
    { f: 450, s: S4a },
    { f: 540, dur: 24, s: S4b },
  ],
  5: [
    { f: 660, s: S5a },
    { f: 720, dur: 24, s: S5b },
  ],
  6: [
    { f: 810, s: S6a },
    { f: 900, dur: 24, s: S6b },
  ],
  7: [
    { f: 990, s: S7a },
    { f: 1050, dur: 20, s: S7b },
  ],
  8: [
    { f: 1110, s: S8a },
    { f: 1180, dur: 24, s: S8b },
  ],
  9: [
    { f: 1260, s: S9a },
    { f: 1380, dur: 24, s: S9b },
  ],
  10: [
    { f: 1530, s: S10a },
    { f: 1680, dur: 30, s: S10b },
  ],
};

// impact moments: the two blasts shake the camera (t 12.5 s and t 35 s)
const KICKS: [number, number][] = [[12.5, 0.6], [35, 0.5]];
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
  { f: 72, dur: 32, cInf: 10, focus: (f) => [0, 1.4, walkZ(f / FPS)] },
  { f: 150, cInf: 0 },
  { f: 220, dur: 20, cInf: 12, focus: () => [5, 1.5, -27] },
  { f: 300, cInf: 0 },
  { f: 380, dur: 24, cInf: 10, focus: () => [0, 1.2, -12] },
  { f: 450, cInf: 0 },
  { f: 540, dur: 24, cInf: 10, focus: (f) => [0, 1.2, stumbleZ(f / FPS)] },
  { f: 660, cInf: 12, focus: (f) => [TRACK_X, 1.6, trainZ(f / FPS)] },
  { f: 810, cInf: 0 },
  { f: 900, dur: 24, cInf: 12, focus: () => [5, 1.5, 29.5] },
  { f: 990, cInf: 12, focus: () => [5, 2.2, 30] },
  { f: 1110, cInf: 0 },
  { f: 1180, dur: 24, cInf: 10, focus: (f) => [8, 1.2, dazedZ(f / FPS)] },
  { f: 1260, cInf: 0 },
  { f: 1380, dur: 24, cInf: 10, focus: () => [-5, 1.5, 31] },
  { f: 1530, cInf: 0 },
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
  // shot 3 only, VEG framing (trees/bushes are built in code and render; the Kenney GLB kits
  // cart/stall/lantern do not exist under public/, so kitClone returns null for them — the
  // stall for shot 1 is built from boxes in world.ts instead). SIZES ARE SMALL ON PURPOSE:
  // vegRad is 0.85*h for a bush and 0.39*h for a round tree, so a 2 m bush is 3.2 m wide and
  // a 4.5 m round tree fills a quarter of the frame — the first attempt did exactly that.
  // The tall tree breaks the empty sky at the right edge and leaves the frame during the
  // dive (S3b); the two small bushes fill the left and right mid-ground without touching him.
  { a: 300, b: 450, kit: "tree", pos: [1.5, 0, -22], s: 5.0, yaw: 0 },
  { a: 300, b: 450, kit: "plant_bush", pos: [-2.5, 0, -21], s: 1.2, yaw: 0 },
  { a: 300, b: 450, kit: "plant_bush", pos: [0.6, 0, -24.5], s: 1.2, yaw: 0 },
];
