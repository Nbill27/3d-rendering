// Timeline ANDHIKA ITERA: shot timed to the voice words, camera grammar from the
// cartoon_3d_short skill: continuous slow push-ins; symmetric ease-in-out glides ~23 f;
// big reframes are cuts; every hold creeps (no static hold >= 4 f).
// True viral story: Andhika Rahman Setiawan Fajri, Itera Chemical Engineering 2019,
// who went to college by red bicycle and walked home from graduation in his toga.
export const FPS = 30;
export const TOTAL = 1800;
export const D0 = 0;
export type V3 = [number, number, number];

// ---- key places (ground y=0; north = -z) ----
export const CAMPUS_POS: V3 = [0, 0, -28]; // Itera campus hall (front face z=-22)
export const KOS_POS: V3 = [34, 0, 8]; // Andhika's boarding house (east, faces west)
export const WARUNG_POS: V3 = [8, 0, 44]; // vegetable stall at the south end of the road
export const SCHOOL_POS: V3 = [-32, 0, 34]; // school where Andhika now teaches (south-west, faces east)
export const HOME_POS: V3 = [-58, 0, -58]; // parents' house in the hills (north-west)
export const ROAD_X = 0; // the stone road south from the campus plaza

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
// ---------------- story motion on the road (t = story time in seconds) ----------------
/** shot 1 (0-5 s): Andhika in his toga walks south pushing the red bike, z -8 -> +2 */
export const walkZ = (t: number) => -8 + 10 * clamp01(t / 5);
/** shots 3-4 (10-21 s): Andhika rides south, z -14 -> +26 */
export const rideZ = (t: number) => -14 + 40 * clamp01((t - 10) / 11);
/** shot 7 (33-39 s): the viral walk, slow and tired, z +10 -> +22 */
export const viralZ = (t: number) => 10 + 12 * clamp01((t - 33) / 6);
/** shot 10 (51-60 s): sunset ride toward the horizon, z +30 -> +52 */
export const sunsetZ = (t: number) => 30 + 22 * clamp01((t - 51) / 9);

export type StoryState = { ride: number; tired: number };
export const storyState = (id: number, t: number): StoryState => {
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  return { ride: clamp01((tau - 10) / 11), tired: clamp01((tau - 33) / 2) };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "road" | "campus" | "ride" | "kos" | "home" | "viral" | "warung" | "school" | "sunset" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 150, light: "day", crowd: "road", tau: (t) => t, towns: true },
  { id: 2, a: 150, b: 300, light: "day", crowd: "campus", tau: (t) => t },
  { id: 3, a: 300, b: 450, light: "day", crowd: "ride", tau: (t) => t },
  { id: 4, a: 450, b: 630, light: "day", crowd: "ride", tau: (t) => t },
  { id: 5, a: 630, b: 810, light: "day", crowd: "kos", tau: (t) => t },
  { id: 6, a: 810, b: 990, light: "golden", crowd: "home", tau: (t) => t },
  { id: 7, a: 990, b: 1170, light: "day", crowd: "viral", tau: (t) => t },
  { id: 8, a: 1170, b: 1320, light: "day", crowd: "warung", tau: (t) => t },
  { id: 9, a: 1320, b: 1530, light: "golden", crowd: "school", tau: (t) => t },
  { id: 10, a: 1530, b: TOTAL, light: "golden", crowd: "sunset", tau: (t) => t, towns: true },
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 8, 5: 8, 6: 8, 7: 8, 9: 8 };
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
// ---- framings (f -> camera); each pushes in from the frame its key starts ----
// S1 hook: Andhika in his toga walks south pushing the red bike; camera tracks from the east side of the road.
const S1a = (f: number) => { const z = walkZ(f / FPS); return dolly([9, 3, z + 6], [0, 1.6, z], pushK(f, 0, 0.0025), { fov: 40 }); };
const S1b = (f: number) => { const z = walkZ(f / FPS); return dolly([7, 2.6, z + 4], [0, 1.5, z], pushK(f, 72, 0.002), { fov: 36 }); };
// S2 setting: campus steps, Andhika in his toga with fellow graduates.
const S2a = (f: number) => dolly([14, 7, 4], [0, 3, -22], pushK(f, 150, 0.002), { fov: 44 });
const S2b = (f: number) => dolly([8, 4, -6], [0, 2.5, -21], pushK(f, 220, 0.0025), { fov: 38 });
// S3 action 1: Andhika rides the red bike south; camera tracks from the east side.
const S3a = (f: number) => { const z = rideZ(f / FPS); return dolly([8, 2.8, z + 5], [0, 1.4, z], pushK(f, 300, 0.002), { fov: 40 }); };
const S3b = (f: number) => { const z = rideZ(f / FPS); return dolly([6.5, 2.4, z + 4], [0, 1.3, z], pushK(f, 380, 0.0025), { fov: 36 }); };
// S4 action 2: the long ride continues, higher and wider.
const S4a = (f: number) => { const z = rideZ(f / FPS); return dolly([10, 4, z + 8], [0, 1.5, z], pushK(f, 450, 0.0018), { fov: 42 }); };
const S4b = (f: number) => { const z = rideZ(f / FPS); return dolly([7, 3, z + 5], [0, 1.4, z], pushK(f, 540, 0.002), { fov: 38 }); };
// S5 low point: in front of the kos, Andhika sits on the steps, head down; the lecturer talks to him.
const S5a = (f: number) => dolly([19, 3.2, 15], [28.5, 1.4, 9.5], pushK(f, 630, 0.002), { fov: 40 });
const S5b = (f: number) => dolly([22, 2.6, 12], [28.5, 1.2, 9.5], pushK(f, 720, 0.0025), { fov: 36 });
// S6 parents: the house in the hills at golden hour, two parents at the door waving.
const S6a = (f: number) => dolly([-38, 7, -36], [-58, 2, -58], pushK(f, 810, 0.0018), { fov: 44 });
const S6b = (f: number) => dolly([-46, 4, -44], [-58, 1.6, -58], pushK(f, 900, 0.002), { fov: 40 });
// S7 viral moment: Andhika in his toga pushes the bike slowly along the road; villagers watch from the sidewalk.
const S7a = (f: number) => { const z = viralZ(f / FPS); return dolly([8, 2.6, z + 4], [0, 1.5, z], pushK(f, 990, 0.002), { fov: 40 }); };
const S7b = (f: number) => { const z = viralZ(f / FPS); return dolly([6, 2.2, z + 3], [0, 1.4, z], pushK(f, 1080, 0.0025), { fov: 36 }); };
// S8 warung: the vegetable stall, the stall owner smiling, Andhika in his toga arrives.
const S8a = (f: number) => dolly([16, 3.5, 52], [8, 1.5, 44], pushK(f, 1170, 0.002), { fov: 40 });
const S8b = (f: number) => dolly([13, 2.6, 49], [8, 1.4, 44], pushK(f, 1240, 0.0025), { fov: 36 });
// S9 consequence: the school, Andhika as a teacher with kids, golden.
const S9a = (f: number) => dolly([-20, 3.5, 42], [-32, 1.5, 34], pushK(f, 1320, 0.002), { fov: 42 });
const S9b = (f: number) => dolly([-24, 2.8, 40], [-32, 1.3, 34], pushK(f, 1420, 0.002), { fov: 38 });
// S10 closing: sunset road, Andhika rides toward the horizon, then a wide pull-back.
// Cameras stay side-on (tz/tl < 0.57) so the ride pose is used, not the front view.
const S10a = (f: number) => { const z = sunsetZ(f / FPS); return dolly([8, 3.5, z + 5], [0, 1.5, z], pushK(f, 1530, 0.0015), { fov: 42 }); };
const S10b = (f: number) => { const z = sunsetZ(f / FPS); return dolly([10, 7, z + 6], [0, 1.5, z], pushK(f, 1680, 0.0015), { fov: 44 }); };

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
    { f: 540, dur: 40, s: S4b },
  ],
  5: [
    { f: 630, s: S5a },
    { f: 720, dur: 24, s: S5b },
  ],
  6: [
    { f: 810, s: S6a },
    { f: 900, dur: 24, s: S6b },
  ],
  7: [
    { f: 990, s: S7a },
    { f: 1080, dur: 24, s: S7b },
  ],
  8: [
    { f: 1170, s: S8a },
    { f: 1240, dur: 20, s: S8b },
  ],
  9: [
    { f: 1320, s: S9a },
    { f: 1420, dur: 24, s: S9b },
  ],
  10: [
    { f: 1530, s: S10a },
    { f: 1680, dur: 30, s: S10b },
  ],
};

// no impact moments in this story: no camera kicks
const KICKS: [number, number][] = [];
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
  { f: 72, dur: 32, cInf: 10, focus: (f) => [0, 1.6, walkZ(f / FPS)] },
  { f: 150, cInf: 0 },
  { f: 220, dur: 20, cInf: 12, focus: () => [0, 2.5, -21] },
  { f: 300, cInf: 0 },
  { f: 380, dur: 24, cInf: 10, focus: (f) => [0, 1.4, rideZ(f / FPS)] },
  { f: 450, cInf: 0 },
  { f: 630, cInf: 12, focus: () => [29, 1.2, 9] },
  { f: 810, cInf: 0 },
  { f: 900, dur: 24, cInf: 10, focus: () => [-58, 1.6, -58] },
  { f: 990, cInf: 12, focus: (f) => [0, 1.5, viralZ(f / FPS)] },
  { f: 1170, cInf: 12, focus: () => [8, 1.4, 44] },
  { f: 1320, cInf: 0 },
  { f: 1420, dur: 24, cInf: 10, focus: () => [-32, 1.3, 34] },
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
export const FOREGROUND: Fg[] = [];
