// Timeline VIDEO09: shot timed to the voice words, camera grammar from the
// cartoon_3d_short skill: continuous slow push-ins; symmetric ease-in-out glides ~23 f;
// big reframes are cuts; every hold creeps (no static hold >= 4 f).
// True story: the London Beer Flood, 17 October 1814 — a 22 ft vat of porter bursts at
// Meux's Horse Shoe Brewery, a 15 ft wave floods St Giles, eight people drown, and the
// court calls it an Act of God. One question: "How did London drown in beer?"
export const FPS = 30;
export const TOTAL = 1800;
export const D0 = 0;
export type V3 = [number, number, number];

// ---- key places (ground y=0; north = -z) ----
export const VAT_POS: V3 = [-30, 0, -1]; // the giant 22 ft vat, brewery hall centre
export const PLATFORM_POS: V3 = [-30, 4, 4.5]; // Crick's platform deck, south side of the vat
export const DOOR_POS: V3 = [-12, 0, 3.5]; // brewery hall east door, where the wave breaks out
export const CELLAR_POS: V3 = [-15, -2.2, 16]; // the wake cellar, west side of the street, floor y -2.2
export const COTTAGE_POS: V3 = [16, 0, 28]; // mother + child at tea, east side room
export const COURT_POS: V3 = [39, 0, -1]; // the courtroom, east (judge bench at x 45)
export const THEATRE_POS: V3 = [0, 0, -44]; // the Dominion Theatre facade, north end of the street
export const STREET_X = 0; // the cobbled St Giles street, north-south

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- story motion ----------------
/** the 700 lb iron ring around the main vat: in place (y 5.5) until t=11, slips down to
 *  y 1.2 across shot 3 (11-16 s), then lies on the floor (y 0.35) after the burst (t>=17) */
export const ringY = (t: number) => t < 11 ? 5.5 : t < 16 ? 5.5 - 4.3 * smooth((t - 11) / 5) : t < 17 ? 1.2 : 0.35;
/** the wave's advance in shot 5 (22-28 s): 0 at the brewery door, 1 surging down the street */
export const waveK = (t: number) => smooth((t - 22) / 6);
/** flood coverage of the street (and the cottage floor): 0 before the burst, 1 from shot 5 on */
export const floodK = (t: number) => smooth((t - 22) / 6);
/** the second vat's tilt after the burst (shot 4, 17-18.5 s): 0 upright, 1 knocked over */
export const tiltK = (t: number) => smooth((t - 17) / 1.5);
/** flying staves in shot 4: 0 at the burst, 1 fully flung out (17-18.5 s), then they drop */
export const debrisK = (t: number) => smooth((t - 17) / 1.5);
export const debrisFall = (t: number) => smooth((t - 18.5) / 1.5);
/** shot 1 (0-5 s): a brewery worker hauls a barrel diagonally across the hall floor,
 *  from (-24, 5) to (-34, -3) — the diagonal keeps him inside the narrow horizontal
 *  sight cone (the camera looks southwest; due-west is 40 deg off-axis, out of frame) */
export const workerX = (t: number) => -24 - 10 * clamp01(t / 5);
export const workerZ = (t: number) => 5 - 8 * clamp01(t / 5);
/** shot 4 (17-21 s): the same worker flees the burst toward the east door, x -36 -> -28 (he
 *  stops 8 m short of the camera: the old run carried him to x -22, right into the lens, so
 *  by t=20 he was 3.7 m away and mostly below the frame with his face behind the caption) */
export const fleeX = (t: number) => -36 + 8 * clamp01((t - 17) / 4);
/** shot 5 (22-28 s): townsfolk flee south down the street ahead of the wave, z 4 -> 16 (they stop
 *  well short of the camera: the old range ran them to z 30, past the S5 camera, so by t=26 one was
 *  at the lens and the other 46 deg off-axis, and neither was in frame) */
export const fleeZ = (t: number, phase: number) => 4 + 12 * clamp01((t - 22 - phase) / 5);
/** shot 10 (52-60 s): strollers walk north up the street toward the theatre, z -30 -> -40 (they
 *  walk the last stretch to the steps, in front of the S10 camera: starting them at z 20 put
 *  them behind the camera, and starting at z 0 still left them south of it at t=53) */
export const strollZ = (t: number, phase: number) => -30 - 10 * clamp01((t - 52 - phase) / 7);

export type StoryState = { ring: number; wave: number; flood: number; tilt: number; debris: number; debrisFall: number };
export const storyState = (id: number, t: number): StoryState => ({
  ring: ringY(t),
  wave: id >= 5 && id <= 8 ? waveK(t) : 0,
  flood: id >= 5 && id <= 8 ? floodK(t) : 0,
  tilt: id === 4 ? tiltK(t) : 0,
  debris: id === 4 ? debrisK(t) : 0,
  debrisFall: id === 4 ? debrisFall(t) : 0,
});

// ---------------- shots ----------------
export type Light = "day" | "golden" | "warm";
export type Crowd = "brewery" | "vat" | "ring" | "burst" | "wave" | "wake" | "tea" | "aftermath" | "court" | "theatre";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 150, light: "warm", crowd: "brewery", tau: (t) => t },
  { id: 2, a: 150, b: 330, light: "warm", crowd: "vat", tau: (t) => t },
  { id: 3, a: 330, b: 510, light: "warm", crowd: "ring", tau: (t) => t },
  { id: 4, a: 510, b: 660, light: "warm", crowd: "burst", tau: (t) => t },
  { id: 5, a: 660, b: 840, light: "day", crowd: "wave", tau: (t) => t, towns: true },
  { id: 6, a: 840, b: 1020, light: "day", crowd: "wake", tau: (t) => t },
  { id: 7, a: 1020, b: 1200, light: "day", crowd: "tea", tau: (t) => t },
  { id: 8, a: 1200, b: 1380, light: "day", crowd: "aftermath", tau: (t) => t, towns: true },
  { id: 9, a: 1380, b: 1560, light: "warm", crowd: "court", tau: (t) => t },
  { id: 10, a: 1560, b: TOTAL, light: "golden", crowd: "theatre", tau: (t) => t, towns: true },
];
/** crossfades (frames) at place changes only: hall -> street (5), street -> courtroom (9), courtroom -> theatre (10) */
export const XFADE: Record<number, number> = { 5: 8, 9: 8, 10: 8 };
export const FLASH_AT = 99999; // no white flash in this story; the burst at 17 s gets a camera kick instead

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
// S1 hook: Crick at the foot of the giant vat, pointing up at it; a worker hauls a barrel
// diagonally across the hall floor in front of the vat, another stands at the vat's far side.
// Camera pulled back to the hall's southeast corner and wide (fov 58) so the whole 22 ft vat
// fits with Crick ~14% of frame height, his feet just above the subtitle band.
const S1a = (f: number) => dolly([-16, 3.2, 9], [-30, 3.2, -1], pushK(f, 0, 0.002), { fov: 58 });
const S1b = (f: number) => dolly([-17, 3.0, 8.5], [-30, 3.2, -1], pushK(f, 72, 0.0025), { fov: 56 });
// S2 the vat: LOW-ANGLE close-up from the hall floor — Crick at the vat's foot, small against
// the staves, the vat filling the frame vertically (the shot that sells the 22-foot height).
// Two platform framings failed first: a low camera below the deck put the deck's underside
// across Crick's head, and a deck-level camera pushed him half out of the narrow cone.
const S2a = (f: number) => dolly([-22, 1.5, 7.5], [-29, 4.5, -1], pushK(f, 150, 0.002), { fov: 54 });
const S2b = (f: number) => dolly([-22.8, 1.4, 7.0], [-29, 4.4, -1], pushK(f, 240, 0.0025), { fov: 52 });
// S3 the ring: platform level — Crick and the boss stand at the platform's NORTH edge, leaning
// over the railing toward the vat, watching the 700 lb ring slip down it. The camera looks
// northwest from the hall's southeast corner so the vat AND the men share the frame:
// the previous southeast camera showed the men against the west wall with the vat out of frame.
const S3a = (f: number) => dolly([-22, 4.8, 9.5], [-30, 3.5, 1], pushK(f, 330, 0.002), { fov: 50 });
const S3b = (f: number) => dolly([-22.8, 4.7, 9.0], [-30, 3.4, 1], pushK(f, 420, 0.0025), { fov: 48 });
// S4 the burst: wide inside the hall — the vat explodes, staves fly, spray everywhere,
// the second vat topples, workers flee toward the east door. Look target pulled toward
// Crick on the platform so he stays inside the narrow horizontal cone.
const S4a = (f: number) => dolly([-22, 3.2, 9.5], [-30, 3.0, 2.5], pushK(f, 510, 0.002), { fov: 56 });
// S4b pans west as the second vat topples: the old look kept it 20 degrees off-axis, out of
// frame, so the "knocking open a second vat" beat was invisible.
const S4b = (f: number) => dolly([-23, 4.5, 10], [-34, 2.0, 2], pushK(f, 580, 0.0025), { fov: 56 }); // crane
// up as it pans west: at the old height the fleeing workers' heads sat at the caption band
// S5 the wave: in the street looking north at the brewery door — the 15 ft wall of dark
// porter smashes out of the doorway and surges down the lane toward the camera. The wave
// stops mid-street (its advance was shortened: the old path ran it straight into the camera,
// where it filled the whole frame as a brown wall by t=26); the camera sits a little farther
// south so the wave, the fleeing townsfolk, and the flooded street all share the frame.
const S5a = (f: number) => dolly([-1, 3.5, 26], [-8, 2.5, 2], pushK(f, 660, 0.002), { fov: 54 });
const S5b = (f: number) => dolly([-1.5, 3.3, 25], [-8, 2.8, 3], pushK(f, 750, 0.0025), { fov: 52 });
// S6 the wake: craned up over the street, looking down into the open cellar pit — distant
// silhouettes of mourners around a coffin, candles glowing in the dark room below street
// level. The old street-level camera could not see over the parapet or the flood plane, and
// the ceiling slab hid the pit entirely.
const S6a = (f: number) => dolly([-8, 6.5, 20], [-15, -1.5, 16], pushK(f, 840, 0.002), { fov: 52 });
const S6b = (f: number) => dolly([-7, 6.3, 19.5], [-15, -1.6, 16], pushK(f, 930, 0.0025), { fov: 50 });
// S7 at tea: the cottage room, open front to the street — the mother holds her 4-year-old
// at the tea table while beer swirls in around their feet. Camera close and a little lower
// than before, so less of the blank ceiling fills the top of the frame.
const S7a = (f: number) => dolly([9, 1.7, 28], [16, 1.2, 28], pushK(f, 1020, 0.002), { fov: 50 });
const S7b = (f: number) => dolly([9.5, 1.6, 28], [16, 1.1, 28], pushK(f, 1110, 0.0025), { fov: 48 });
// S8 aftermath: high wide down the flooded street — barrels floating, people on doorsteps
// and at upper windows, the brewery door hanging off its hinges.
// S8 the aftermath: the camera stands NORTH of the waders and looks SOUTH down the flooded
// street — the modern Dominion Theatre (which stands at the north end) used to fill the
// background of this 1814 shot, and only one of the four waders was in frame. Looking south
// puts the theatre behind the lens and all four waders + the floating barrels in front of it.
const S8a = (f: number) => dolly([0, 3.0, 4], [0, 0.8, 16], pushK(f, 1200, 0.002), { fov: 56 });
const S8b = (f: number) => dolly([1, 3.2, 6], [0, 0.5, 17], pushK(f, 1290, 0.0025), { fov: 54 }); // low and
// close on the clustered waders: the old high wide left 45% empty sky over 45% empty flood,
// and the low close-up put the 12 m-spread waders outside the narrow cone entirely
// S9 the court: inside the courtroom — the judge at the bench, the brewery boss standing
// before him. A two-shot only: anyone standing between this camera and the bench is 3-5 m
// from the lens and fills the frame, so Crick stays out of this shot (he is in the gallery
// benches as set dressing only).
const S9a = (f: number) => dolly([33, 2.8, 4.5], [43, 2.2, -1], pushK(f, 1380, 0.002), { fov: 50 });
const S9b = (f: number) => dolly([33.8, 2.6, 4.0], [43, 2.1, -1], pushK(f, 1470, 0.0025), { fov: 48 });
// S10 the theatre: golden hour — the Dominion Theatre facade where the brewery stood,
// strollers walking up the street toward it, sun low behind the facade. Camera pulled back
// a little so the DOMINION sign fits inside the pediment triangle instead of being cropped.
const S10a = (f: number) => dolly([0, 3.2, -14], [0, 5.0, -44], pushK(f, 1560, 0), { fov: 52 });
const S10b = (f: number) => dolly([1.5, 3.4, -12], [0, 5.0, -44], pushK(f, 1680, 0), { fov: 50 });

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
    { f: 580, dur: 24, s: S4b },
  ],
  5: [
    { f: 660, s: S5a },
    { f: 750, dur: 24, s: S5b },
  ],
  6: [
    { f: 840, s: S6a },
    { f: 930, dur: 24, s: S6b },
  ],
  7: [
    { f: 1020, s: S7a },
    { f: 1110, dur: 24, s: S7b },
  ],
  8: [
    { f: 1200, s: S8a },
    { f: 1290, dur: 24, s: S8b },
  ],
  9: [
    { f: 1380, s: S9a },
    { f: 1470, dur: 24, s: S9b },
  ],
  10: [
    { f: 1560, s: S10a },
    { f: 1680, dur: 30, s: S10b },
  ],
};

// one impact moment: the vat bursts at 17 s (frame 510) — a 7-frame camera kick
const KICKS: [number, number][] = [[17.0, 1.5]];
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
  { f: 72, dur: 32, cInf: 10, focus: () => [-27, 1.2, 1.5] },
  { f: 150, cInf: 0 },
  { f: 240, dur: 24, cInf: 10, focus: () => [-28.5, 3, 0] },
  { f: 330, cInf: 0 },
  { f: 420, dur: 24, cInf: 12, focus: () => [-29.5, 4, 2] },
  { f: 510, cInf: 0 },
  { f: 580, dur: 24, cInf: 8, focus: () => [-30, 3, 0] },
  { f: 660, cInf: 0 },
  { f: 750, dur: 24, cInf: 8, focus: () => [-9, 2.5, 8] },
  { f: 840, cInf: 0 },
  { f: 930, dur: 24, cInf: 10, focus: () => [-14.5, -1, 16] },
  { f: 1020, cInf: 0 },
  { f: 1110, dur: 24, cInf: 10, focus: () => [15.5, 1.2, 28] },
  { f: 1200, cInf: 0 },
  { f: 1290, dur: 24, cInf: 12, focus: () => [0, 1, 10] },
  { f: 1380, cInf: 0 },
  { f: 1470, dur: 24, cInf: 10, focus: () => [41, 1.2, -1] },
  { f: 1560, cInf: 0 },
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

/** near framing objects: visible while a <= f < b; kit = a GLB name accepted by build.ts prop().
 *  Empty: no kit GLB props exist (the folder is missing), so foreground interest is built
 *  from code in world.ts instead. */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
