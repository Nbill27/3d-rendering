// Timeline VIDEO04: shot timed to the voice words, camera grammar from the
// cartoon_3d_short skill: continuous slow push-ins; symmetric ease-in-out glides ~23 f;
// big reframes are cuts; every hold creeps (no static hold >= 4 f).
// True story: the 1932 Emu War, Campion district, Western Australia.
// One question: "How did an army with machine guns lose a war to birds?"
// Chain: emus wreck the harvest, so the farmers call the army. The army comes,
// but the birds are too fast and too scattered, so the guns are useless.
// Useless guns, so the army loses. Emotion: funny and absurd.
// Every fact below is source-verified (see projects/emu-war/SCRIPT.md);
// no invented scene, dialogue or quote.
export const FPS = 30;
export const TOTAL = 1800;
export const D0 = 0;
export type V3 = [number, number, number];

// ---- key places (ground y=0; north = -z) ----
export const FARM_POS: V3 = [24, 0, -18]; // settler farmhouse (faces west toward the road)
export const HOLE_POS: V3 = [-16, 0, 20]; // watering hole (west of the road, south end)
export const ROAD_X = 0; // dirt road running south through the wheat fields
export const FENCE_POS: V3 = [0, 0, -10]; // the smashed boundary fence

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
// ---------------- story motion (t = story time in seconds) ----------------
/** shot 1 (0-5 s): the emu flock marches south into the wheat, z -34 -> -12.
 *  Motion Tahap 5: smooth() (smootherstep ease-in-out) — same endpoints and
 *  timing as the old linear clamp01, only the curve: slow start/stop, no
 *  robotic constant speed. Playful long-travel analogue (no overshoot here:
 *  a 22 m overshoot would break the endpoint and the camera focus). */
export const flockZ = (t: number) => -34 + 22 * smooth(t / 5);
/** shot 6 (27-33 s): the flock front runs south, z -14 -> +8 */
export const scatterZ = (t: number) => -14 + 22 * smooth((t - 27) / 6);
/** shot 8 (39-42 s): the truck chases south down the road, z 0 -> +14 */
export const truckZ = (t: number) => 0 + 14 * smooth((t - 39) / 3);
/** shot 9 (42-51 s): the soldiers walk north away from the field, z +12 -> -2 */
export const retreatZ = (t: number) => 12 - 14 * smooth((t - 42) / 9);

export type StoryState = { flock: number; truck: number; retreat: number };
export const storyState = (id: number, t: number): StoryState => {
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  // Motion Tahap 5: smooth() instead of linear clamp01 — same 0..1 endpoints
  // and timing, only the curve. (stage() currently ignores this state, but the
  // values now match the eased flockZ/truckZ/retreatZ above.)
  return { flock: smooth(tau / 5), truck: smooth((tau - 39) / 3), retreat: smooth((tau - 42) / 9) };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "field" | "farm" | "raid" | "call" | "arrive" | "scatter" | "waterhole" | "truck" | "retreat" | "sunset" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 150, light: "day", crowd: "field", tau: (t) => t },
  { id: 2, a: 150, b: 300, light: "day", crowd: "farm", tau: (t) => t },
  { id: 3, a: 300, b: 450, light: "day", crowd: "raid", tau: (t) => t },
  { id: 4, a: 450, b: 660, light: "day", crowd: "call", tau: (t) => t },
  { id: 5, a: 660, b: 810, light: "day", crowd: "arrive", tau: (t) => t },
  { id: 6, a: 810, b: 990, light: "day", crowd: "scatter", tau: (t) => t },
  { id: 7, a: 990, b: 1170, light: "day", crowd: "waterhole", tau: (t) => t },
  { id: 8, a: 1170, b: 1260, light: "day", crowd: "truck", tau: (t) => t },
  { id: 9, a: 1260, b: 1530, light: "day", crowd: "retreat", tau: (t) => t },
  { id: 10, a: 1530, b: TOTAL, light: "golden", crowd: "sunset", tau: (t) => t },
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 8, 5: 8, 7: 8, 9: 8, 10: 8 };
export const FLASH_AT = 130;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: smooth((f - (s.a - x / 2) + 1) / (x + 1)) }];
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
// S1 hook: wide wheat field, the emu flock marching south into it; farmers watch from the farmhouse edge.
// Camera pitched down steeply so the sky band shrinks and the field fills the frame.
const S1a = (f: number) => dolly([16, 9, 8], [0, 0.6, -22], pushK(f, 0, 0.002), { fov: 44 });
const S1b = (f: number) => dolly([12, 6, 2], [0, 0.6, -20], pushK(f, 72, 0.0025), { fov: 40 });
// S2 setting: the settler farmhouse, farmers with wheat sheaves in front.
const S2a = (f: number) => dolly([36, 5, -4], [24, 1.5, -18], pushK(f, 150, 0.002), { fov: 42 });
const S2b = (f: number) => dolly([32, 3.5, -8], [24, 1.4, -18], pushK(f, 220, 0.0025), { fov: 38 });
// S3 raid: emus eating and trampling the wheat at the smashed fence. Wide enough to fit the whole flock;
// the low angle keeps the birds looming.
const S3a = (f: number) => dolly([18, 7, 14], [0, 1.0, -12], pushK(f, 300, 0.002), { fov: 40 });
const S3b = (f: number) => dolly([17, 6.5, 12], [0, 1.0, -12], pushK(f, 380, 0.0025), { fov: 38 });
// S4 call: farmers at the farmhouse, one pointing down the road, worried.
const S4a = (f: number) => dolly([32, 3.5, -6], [24, 1.3, -17], pushK(f, 450, 0.002), { fov: 40 });
const S4b = (f: number) => dolly([29, 2.8, -10], [24, 1.2, -17], pushK(f, 540, 0.0025), { fov: 36 });
// S5 arrive: Meredith and two soldiers with the two Lewis guns; the flock in the distance.
const S5a = (f: number) => dolly([13, 5, 24], [0, 0.8, 6], pushK(f, 660, 0.002), { fov: 44 });
const S5b = (f: number) => dolly([12, 5, 22], [0, 0.8, 6], pushK(f, 720, 0.0025), { fov: 42 });
// S6 scatter: emus running in all directions, soldiers firing. Camera far south on the road axis so the
// whole group (soldiers, guns, scattering flock) fits the narrow portrait frame.
const S6a = (f: number) => dolly([4, 6, 34], [0, 1, -4], pushK(f, 810, 0.0018), { fov: 42 });
const S6b = (f: number) => dolly([3, 4, 30], [0, 1, -2], pushK(f, 900, 0.002), { fov: 38 });
// S7 waterhole: the ambush — a dense flock drinking, the gun jams, emus flee.
// Pulled far back south so the whole ambush (water, ring, gun, both men) fits the narrow portrait frame.
const S7a = (f: number) => dolly([2, 10, 46], [-11, 0.8, 21.5], pushK(f, 990, 0.002), { fov: 44 });
const S7b = (f: number) => dolly([0, 9, 44], [-11, 0.8, 21.5], pushK(f, 1080, 0.0025), { fov: 40 });
// S8 truck: the gun mounted on the truck, chasing the emus south down the road. Camera NORTH
// of the truck looking south down the road: the truck is in the foreground, the emus ahead of
// it beyond. (Both earlier framings failed: the road-axis camera put a flock emu right in
// front of the lens, and the east-side camera hid the truck behind the flock.)
const S8a = (f: number) => { const z = truckZ(f / FPS); return dolly([1.5, 3.2, z - 13], [0, 1.2, z + 3], pushK(f, 1170, 0.002), { fov: 40 }); };
const S8b = (f: number) => { const z = truckZ(f / FPS); return dolly([1, 2.8, z - 11], [0, 1.1, z + 4], pushK(f, 1210, 0.0025), { fov: 38 }); };
// S9 retreat: the soldiers walk north away from the field, carrying the gun. Low angle, they walk tall.
const S9a = (f: number) => { const z = retreatZ(f / FPS); return dolly([9, 2.8, z + 9], [0, 1.2, z], pushK(f, 1260, 0.0018), { fov: 42 }); };
const S9b = (f: number) => { const z = retreatZ(f / FPS); return dolly([7, 2.4, z + 6], [0, 1.1, z], pushK(f, 1380, 0.002), { fov: 38 }); };
// S10 sunset: emus standing in the golden field at sunset, victorious; wide pull-back.
const S10a = (f: number) => dolly([14, 6, 12], [0, 1.5, -16], pushK(f, 1530, 0.0015), { fov: 42 });
const S10b = (f: number) => dolly([18, 9, 16], [0, 1.5, -18], pushK(f, 1680, 0.0015), { fov: 44 });

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
    { f: 1080, dur: 24, s: S7b },
  ],
  8: [
    { f: 1170, s: S8a },
    { f: 1210, dur: 20, s: S8b },
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

// impact moments: the gun jam at the waterhole (t 36 s) and the truck lurch (t 40 s)
const KICKS: [number, number][] = [[36, 0.5], [40, 0.4]];
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
  { f: 72, dur: 32, cInf: 10, focus: (f) => [0, 1.4, flockZ(f / FPS)] },
  { f: 150, cInf: 0 },
  { f: 220, dur: 20, cInf: 12, focus: () => [24, 1.5, -18] },
  { f: 300, cInf: 0 },
  { f: 380, dur: 24, cInf: 10, focus: () => [0, 1.1, -10] },
  { f: 450, cInf: 0 },
  { f: 540, dur: 24, cInf: 10, focus: () => [24, 1.4, -17] },
  { f: 660, cInf: 12, focus: () => [0, 1.2, 6] },
  { f: 810, cInf: 0 },
  { f: 900, dur: 24, cInf: 10, focus: (f) => [0, 1.1, scatterZ(f / FPS)] },
  { f: 990, cInf: 12, focus: () => [-11, 1.1, 21.5] },
  { f: 1170, cInf: 12, focus: (f) => [0, 1.2, truckZ(f / FPS)] },
  { f: 1260, cInf: 0 },
  { f: 1380, dur: 24, cInf: 10, focus: (f) => [0, 1.3, retreatZ(f / FPS)] },
  { f: 1530, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  // Motion Tahap 5: smooth() instead of the linear ramp — same cInf endpoints
  // and transition duration, only the curve (gentle focus pull, no linear grind).
  const k = d.dur ? smooth((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing objects: visible while a <= f < b; kit = a GLB name accepted by build.ts prop() */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
