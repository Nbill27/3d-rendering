// Timeline VIDEO08: shot timed to the voice words, camera grammar from the
// cartoon_3d_short skill: continuous slow push-ins; symmetric ease-in-out glides ~23 f;
// big reframes are cuts; every hold creeps (no static hold >= 4 f).
// True story: Annie Edson Taylor, the first person to survive going over Niagara Falls
// in a barrel (24 Oct 1901, her 63rd birthday, Horseshoe Falls, 167 ft drop).
// One question: "How did a broke 63-year-old survive going over Niagara Falls in a barrel,
// and what did it cost her?"
// Chain: she was broke and needed money, so she designed a barrel and tested it with her cat.
// She climbed in and dropped 167 ft, so she survived and became famous.
// But the fame never became money, so she died poor.
// Emotion: awe at an underdog, with a bittersweet ending. Tone: warm and admiring, never funny.
// Every fact below is source-verified (see projects/annie-taylor/SCRIPT.md);
// no invented scene, dialogue or quote.
export const FPS = 30;
export const TOTAL = 1800;
export const D0 = 0;
export type V3 = [number, number, number];

// ---- key places (ground y=0; north = -z) ----
// The river above the falls runs north (z decreasing) to the Horseshoe Falls cliff at z=-68.
// The east bank (x +2..+8, z -24..-8) is where Annie, the barrel, the boat and the crowd are.
// The town street runs south (z +8..+65) with the photo stall at z=32.
export const BARREL_BANK: V3 = [2.5, 0, -18]; // the barrel's home spot on the east bank
export const BOAT_MOOR: V3 = [0.5, 0, -21]; // the rowboat, moored at the bank
export const PUMP_POS: V3 = [3.4, 0, -17]; // the bicycle pump beside the barrel (moved west from 4.2: at 4.2 the pumping friend fell off the right frame edge in shot 6a)
export const FALLS_LIP: V3 = [0, 19.5, -65.5]; // top of the falls, where the barrel goes over
export const POOL_EDGE: V3 = [3.5, 0, -58]; // where rescuers open the barrel at the base
export const STALL_POS: V3 = [4.5, 0, 32]; // Annie's photo stall on the town street
export const STREET_X = 0; // main street running south through the town
export const BANK_Y = 0.3; // the east bank and the pool beach sit 0.3 m above the water

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** Premium signature easing: cubic-bezier(0.4, 0, 0.2, 1) (motion-tabel.md E1).
 *  Solved by bisection on the bezier x(t); endpoints identical to the old smootherstep. */
const bezX = (t: number) => 3 * 0.4 * t * (1 - t) * (1 - t) + 3 * 0.2 * t * t * (1 - t) + t * t * t;
const bezY = (t: number) => 3 * t * t * (1 - t) + t * t * t;
export const premium = (u: number) => {
  const x = clamp01(u);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (bezX(mid) < x) lo = mid; else hi = mid; }
  return bezY((lo + hi) / 2);
};
/** one pump stroke, 36 frames starting f810 (motion-tabel.md E10):
 *  down 12 f ease-in quad (pose 1 -> 0.1), up 24 f Premium (pose 0.1 -> 1).
 *  Shared by the pump handle in world.ts and the friend's arm in cast.ts. */
export const pumpPose = (f: number) => {
  const cyc = ((((f - 810) % 36) + 36) % 36) / 36;
  if (cyc < 1 / 3) { const u = cyc * 3; return 1 - 0.9 * u * u; }
  return 0.1 + 0.9 * premium((cyc - 1 / 3) / (2 / 3));
};

// ---------------- story motion (t = story time in seconds) ----------------
/** shot 6 (27-33 s): the boat drifts north on the current, z -21 -> -44, during t 30-33 s.
 *  Ease-in cubic (motion-tabel.md E7): the current grabs the boat, so it accelerates. */
const driftU = (t: number) => { const u = clamp01((t - 30) / 3); return u * u * u; };
export const boatZ = (t: number) => -21 - 23 * driftU(t);
export const boatX = (t: number) => 0.5 - 1.5 * driftU(t);
/** shot 7 (33-37 s): the barrel at the lip, then the 167 ft drop. It goes over at t 33.8 s
 *  and hits the pool at t 35.6 s, tumbling as it falls.
 *  Tumble only 0.6 rad, ease-in quadratic (motion-tabel.md E3): v1 tumbled 1.2 rad and
 *  read as a flat coin from the front in still_1105 (stage01). */
export const barrelFall = (t: number): { y: number; z: number; rotX: number } => {
  if (t < 33.8) return { y: 19.5 + 0.08 * Math.sin(t * 3), z: -65.5, rotX: 0 };
  const u = clamp01((t - 33.8) / 1.8);
  // tumble only 0.6 rad: end-on the barrel reads as a flat disc, side-on it reads as a barrel
  return { y: 19.5 - 18.9 * (u * u), z: -65.5 + 2 * u, rotX: 0.6 * u * u };
};
/** shot 7: the splash at the base of the falls after the barrel hits the water (t 35.4 s).
 *  Rise ease-out cubic over 30 f, hold 6 f at the peak, then decay (motion-tabel.md E6). */
export const splashAt = (t: number) => {
  const u = t - 35.4;
  if (u < 0) return 0;
  if (u < 1) return 1 - (1 - u) ** 3;
  if (u < 1.2) return 1;
  return Math.max(0.35, 1 - (u - 1.2) * 0.5);
};
/** shot 6: the boat bobs gently on the river. FROZEN (motion-tabel.md D2+D4):
 *  the boat must not bob while moored (S6a) or drifting (S6b); the drift is its one motion. */
export const bobAt = (_t: number) => 0;

export type BarrelPose = { x: number; y: number; z: number; rotX: number; rotZ: number; yaw: number; closed: boolean; mattress: boolean };
export type StoryState = {
  barrel: BarrelPose;
  boat: { x: number; y: number; z: number; yaw: number; visible: boolean };
  lidHeld: boolean; // friends hold the lid above the barrel (shot 5)
  lidGround: boolean; // the lid lies on the ground beside the barrel (shot 8)
  pump: boolean; // the bicycle pump stands beside the barrel
  annieIn: boolean; // Annie is inside the barrel: hide her card (shot 6b, 7)
  splash: number; // 0..1 splash at the falls base (shot 7)
};
export const storyState = (id: number, t: number): StoryState => {
  const bf = barrelFall(t);
  const inBoat = id === 6 && t >= 30;
  const barrel: BarrelPose =
    id <= 4 ? { x: BARREL_BANK[0], y: BANK_Y + 0.78, z: BARREL_BANK[2], rotX: 0, rotZ: 0, yaw: -0.45, closed: false, mattress: true }
    : id === 5 ? { x: BARREL_BANK[0], y: BANK_Y + 0.78, z: BARREL_BANK[2], rotX: 0, rotZ: 0, yaw: -0.45, closed: false, mattress: true }
    : id === 6 ? (inBoat
      ? { x: boatX(t), y: 0.95 + bobAt(t), z: boatZ(t), rotX: 0, rotZ: 0, yaw: -0.2, closed: true, mattress: false }
      : { x: BOAT_MOOR[0], y: 0.95 + bobAt(t), z: BOAT_MOOR[2], rotX: 0, rotZ: 0, yaw: -0.2, closed: true, mattress: false })
    : id === 7 ? { x: 0, y: bf.y, z: bf.z, rotX: bf.rotX, rotZ: 0, yaw: 0, closed: true, mattress: false }
    : id === 8 ? { x: POOL_EDGE[0], y: BANK_Y + 0.45, z: POOL_EDGE[2], rotX: 0, rotZ: 1.45, yaw: 0.5, closed: false, mattress: true }
    : id === 9 ? { x: BARREL_BANK[0], y: BANK_Y + 0.78, z: BARREL_BANK[2], rotX: 0, rotZ: 0, yaw: -0.45, closed: true, mattress: false }
    : { x: 3.8, y: 0.78, z: 33.5, rotX: 0, rotZ: 0, yaw: -0.45, closed: true, mattress: false };
  return {
    barrel,
    boat: id <= 6
      ? { x: boatX(t), y: 0.05 + bobAt(t), z: boatZ(t), yaw: 0.1 - 0.3 * clamp01((t - 30) / 3), visible: true }
      : { x: BOAT_MOOR[0], y: 0.05, z: BOAT_MOOR[2], yaw: 0.1, visible: false },
    lidHeld: id === 5,
    lidGround: id === 8,
    pump: id <= 5 || (id === 6 && t < 30),
    annieIn: (id === 6 && t >= 30) || id === 7,
    splash: id === 7 ? splashAt(t) : 0,
  };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "bank" | "idea" | "stakes" | "cat" | "birthday" | "pump" | "drop" | "rescue" | "fame" | "stall" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 150, light: "day", crowd: "bank", tau: (t) => t },
  { id: 2, a: 150, b: 300, light: "day", crowd: "idea", tau: (t) => t },
  { id: 3, a: 300, b: 450, light: "day", crowd: "stakes", tau: (t) => t },
  { id: 4, a: 450, b: 660, light: "day", crowd: "cat", tau: (t) => t },
  { id: 5, a: 660, b: 810, light: "day", crowd: "birthday", tau: (t) => t },
  { id: 6, a: 810, b: 990, light: "day", crowd: "pump", tau: (t) => t },
  { id: 7, a: 990, b: 1110, light: "day", crowd: "drop", tau: (t) => t },
  { id: 8, a: 1110, b: 1260, light: "day", crowd: "rescue", tau: (t) => t },
  { id: 9, a: 1260, b: 1530, light: "day", crowd: "fame", tau: (t) => t },
  { id: 10, a: 1530, b: TOTAL, light: "golden", crowd: "stall", tau: (t) => t },
];
/** crossfades (frames) at place changes: shot 7 reframes hard onto the falls face,
 *  shot 10 moves to the town street (golden). */
export const XFADE: Record<number, number> = { 7: 8, 10: 8 };

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
/** camera glides use the Premium signature easing (motion-tabel.md E1) */
export const glide = (u: number) => premium(u);
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
// S1 hook: Annie beside the barrel on the riverbank, the falls looming behind her,
// the cat at her feet, the crowd behind. Camera low and close from the south-east,
// so she is big in the frame (hook) and the bank props fill the frame.
const S1a = (f: number) => dolly([5, 2.8, -12], [1.8, 1.6, -18.5], pushK(f, 0, 0.002), { fov: 42 });
const S1b = (f: number) => dolly([4.5, 2.6, -13.5], [2, 1.6, -18.5], pushK(f, 72, 0.0025), { fov: 40 });
// S2 idea: Annie and the barrel close, she gestures at her wild idea. The boat behind her.
const S2a = (f: number) => dolly([5.5, 2.4, -11], [1.8, 1.2, -18.5], pushK(f, 150, 0.002), { fov: 42 });
const S2b = (f: number) => dolly([5, 2.2, -12.5], [1.8, 1.1, -18.5], pushK(f, 220, 0.0025), { fov: 40 });
// S3 stakes: the wide shot — the Horseshoe Falls towering over the riverbank, Annie small
// below it, looking up. The falls fill the top of the frame.
// Fix (round 5): the look target is shifted east (x 0 -> 2.0) and fov widened (44 -> 48):
// the 9:16 frame is only ~13 deg wide, and with the camera on the x=0 axis the barrel
// (x 2.5) and the friend behind it (x 3.5) were clipped at the right edge at frame 360.
// S3b's look is also shifted east (x -0.5 -> 1.0) so the blend does not swing back west.
const S3a = (f: number) => dolly([0, 3.0, 0], [2.0, 4.0, -60], pushK(f, 300, 0.0015), { fov: 48 });
const S3b = (f: number) => dolly([2.5, 2.8, -4], [1.0, 4.5, -62], pushK(f, 380, 0.0018), { fov: 44 });
// S4 cat: the cat test — the cat sits on the barrel, Annie leans over it, friends watch.
const S4a = (f: number) => dolly([5.5, 2.0, -11], [1.8, 1.0, -18], pushK(f, 450, 0.002), { fov: 40 });
const S4b = (f: number) => dolly([4.5, 1.8, -13], [1.8, 1.0, -18], pushK(f, 540, 0.0025), { fov: 38 });
// S5 birthday: Annie climbs into the barrel, friends hold the lid above her, crowd around.
const S5a = (f: number) => dolly([5.5, 2.4, -10.5], [2.2, 1.1, -18], pushK(f, 660, 0.002), { fov: 42 });
const S5b = (f: number) => dolly([4.5, 2.0, -13], [2.5, 1.0, -18], pushK(f, 720, 0.0025), { fov: 38 });
// S6 pump + drift: a friend works the bicycle pump at the bank; then CUT to the boat
// drifting north on the current toward the falls, the barrel riding in it.
const S6a = (f: number) => dolly([6.5, 2.2, -10.5], [3.0, 0.9, -17.8], pushK(f, 810, 0.002), { fov: 42 });
const S6b = (f: number) => { const bz = boatZ(f / FPS); return dolly([0.5, 3.0, bz - 8], [0.5, 1.0, bz], pushK(f, 900, 0.0018), { fov: 42 }); };
// S7 drop: wide on the falls face — the barrel goes over the lip and smashes into the pool.
const S7a = (f: number) => dolly([-4, 5, -42], [0, 10, -64], pushK(f, 990, 0.0015), { fov: 44 });
// from the moment the barrel goes over (f1014) the camera tracks it down: the look stays
// 2.5 m above the falling barrel, so the barrel never leaves the frame. V1 kept looking
// at the lip until f1068 and lost the barrel completely at f1070-1080 (stage01).
const S7b = (f: number) => { const bf = barrelFall(f / FPS); return dolly([-2, 5, -52], [0, Math.max(2, bf.y + 2.5), -63.5], pushK(f, 1014, 0.0018), { fov: 42 }); };
// S8 rescue: rescuers open the barrel on its side at the pool edge; Annie climbs out alive.
const S8a = (f: number) => dolly([7, 2.2, -50], [3.5, 1.0, -58], pushK(f, 1110, 0.002), { fov: 40 });
const S8b = (f: number) => dolly([6, 2.0, -52], [3.5, 1.0, -58], pushK(f, 1180, 0.0025), { fov: 38 });
// S9 fame: the crowd cheers around Annie at the bank, a newspaper waved, the barrel beside her.
const S9a = (f: number) => dolly([1.5, 2.8, -9], [1.8, 1.3, -18], pushK(f, 1260, 0.002), { fov: 44 });
const S9b = (f: number) => dolly([2, 2.6, -10.5], [1.8, 1.3, -18], pushK(f, 1380, 0.0025), { fov: 42 });
// S10 stall: golden sunset — older Annie at her photo stall on the town street,
// the barrel on display beside her, a customer looking at the photos.
// Framing tightened (fov 38, camera further west): v1 let the house at (11, 36)
// fill 60% of the frame and drown the stall (stage01, still_1590).
const S10a = (f: number) => dolly([-2.5, 2.4, 22], [4.5, 1.2, 32], pushK(f, 1530, 0.0015), { fov: 38 });
const S10b = (f: number) => dolly([0.5, 2.8, 25], [4.5, 1.2, 32], pushK(f, 1680, 0.0015), { fov: 38 });

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
    { f: 900, cut: true, s: S6b },
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

// impact moment: the barrel hits the pool (t 35.6 s) and the camera kicks
const KICKS: [number, number][] = [[35.6, 0.35]];
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
  { f: 72, dur: 32, cInf: 10, focus: () => [2.5, 1.3, -18] },
  { f: 150, cInf: 0 },
  { f: 220, dur: 20, cInf: 12, focus: () => [2.5, 1.0, -18] },
  { f: 300, cInf: 0 },
  { f: 380, dur: 24, cInf: 12, focus: () => [0, 10, -64] },
  { f: 450, cInf: 0 },
  { f: 540, dur: 24, cInf: 10, focus: () => [2.5, 1.0, -18] },
  { f: 660, cInf: 0 },
  { f: 720, dur: 24, cInf: 10, focus: () => [2.5, 1.0, -18] },
  { f: 810, cInf: 0 },
  { f: 900, dur: 24, cInf: 12, focus: (f) => [0.5, 1.0, boatZ(f / FPS)] },
  { f: 990, cInf: 12, focus: () => [0, 10, -64] },
  { f: 1110, cInf: 0 },
  { f: 1180, dur: 24, cInf: 10, focus: () => [3.5, 1.0, -58] },
  { f: 1260, cInf: 0 },
  { f: 1380, dur: 24, cInf: 10, focus: () => [1.5, 1.4, -17] },
  { f: 1530, cInf: 0 },
  { f: 1680, dur: 30, cInf: 10, focus: () => [4.5, 1.4, 32] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? premium((f - d.f) / d.dur) : 1; // Premium, not linear (motion-tabel.md E8)
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};
