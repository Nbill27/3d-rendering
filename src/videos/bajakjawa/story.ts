// Timeline BAJAK JAWA: shot timed to the voice words, story physics (rowing phase, hull surge,
// the ram, the falling mast) and the camera grammar from the skill: continuous slow push-ins;
// symmetric ease-in-out glides ~23 f; big reframes are cuts; impacts are 7-frame kicks that flip
// sign every frame; no hand-held float. Every hold creeps (no static hold >= 4 f).
export const FPS = 30;
export const TOTAL = 1800;
export const D0 = 0; // town ground height: the coastal town sits on the land strip at y=0 (the bridge
// template's low rise does not exist here — the cast stands on y=0, not on D0=6)
export const SEA_Y = 0; // water surface
export const LANONG_DECK = 2.2; // lanong deck height above the water
export const VOC_DECK = 3.2; // VOC merchant ship deck height
export const VOC_POS: V3 = [0, VOC_DECK, 18]; // VOC ship centre (deck), facing -z
export const POND: V3 = [55, 0, -75]; // analogy pond (toy boats) on land (land is z < -60, ground y=0)
export const TOWN_Z = -45; // coastal town starts here (land, z < TOWN_Z)
export type V3 = [number, number, number];

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
export const ROW_PERIOD = 1.2; // one full rowing stroke per 1.2 s
export const rowPhase = (tau: number) => ((tau / ROW_PERIOD) % 1 + 1) % 1;
export const SNAP = 34.6, RAM0 = 34.6, RAM1 = 35.3; // the ram, in story seconds
/** lanong z position: rows from the horizon (z=-60) to the VOC ship (z=+10) */
export const lanongZ = (tau: number) => -60 + lin([[0, 0], [10, 18], [20, 34], [30, 52], [SNAP, 66], [40, 70]], tau);
/** hull surge: grows as the rowing intensifies, dies after the ram */
export const surge = (tau: number) =>
  lin([[0, 0], [10, 0.08], [20, 0.16], [27, 0.28], [SNAP, 0.42], [SNAP + 0.4, 0.0]], tau);
/** mast fall 0..1 after the ram */
export const mastFall = (tau: number) => (tau < RAM0 ? 0 : Math.min(1, ((tau - RAM0) / (RAM1 - RAM0)) ** 2));
/** VOC sails go slack when the wind dies (story seconds 21.4 -> 27.4) */
export const slack = (tau: number) => smooth((tau - 21.4) / 6);

export type SeaState = { surge: number; snap: number; mast: number; rammed: boolean };
export const seaState = (id: number, t: number): SeaState => {
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  if (id === 9) return { surge: 0, snap: 1, mast: 1, rammed: true };
  if (id >= 10) return { surge: 0, snap: 0, mast: 0, rammed: false };
  return { surge: surge(tau), snap: clamp01((tau - SNAP) / 0.7), mast: mastFall(tau), rammed: tau >= RAM1 };
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "row" | "voc" | "ram" | "water" | "pond" | "fort" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 130, light: "day", crowd: "row", tau: (t) => t },
  { id: 2, a: 130, b: 283, light: "day", crowd: "voc", tau: (t) => t, towns: true },
  { id: 3, a: 283, b: 444, light: "day", crowd: "row", tau: (t) => t },
  { id: 4, a: 444, b: 534, light: "day", crowd: "row", tau: (t) => t },
  { id: 5, a: 534, b: 643, light: "day", crowd: "voc", tau: (t) => t },
  { id: 6, a: 643, b: 823, light: "day", crowd: "voc", tau: (t) => t },
  { id: 7, a: 823, b: 987, light: "day", crowd: "row", tau: (t) => t },
  { id: 8, a: 987, b: 1134, light: "day", crowd: "ram", tau: (t) => t },
  { id: 9, a: 1134, b: 1303, light: "day", crowd: "water", tau: (t) => t },
  { id: 10, a: 1303, b: 1411, light: "golden", crowd: "pond", tau: (t) => t },
  { id: 11, a: 1411, b: 1620, light: "golden", crowd: "pond", tau: (t) => t },
  { id: 12, a: 1620, b: TOTAL, light: "golden", crowd: "fort", tau: (t) => t, towns: true },
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 8, 6: 8, 10: 8, 12: 8 };
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
const T = (f: number) => f / FPS;
const Lz = (id: number, f: number) => lanongZ(SHOTS[id - 1].tau(T(f)));
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
// shot 1 (hook): wide sea, lanong on the horizon -> closer on the oars. The camera stays on the
// SEA side of the lanong (z > lanong z), looking back at the coast — the first version put the
// camera on land behind the fort, so the fort filled the frame. Round 3: much further back — the
// ship is 24 long and 13 tall, so a 24-unit camera still fills the frame and the fort looms.
// Round 4: 3/4 FRONT-side (the square sail faces +/-z, so a pure side view shows it edge-on):
// the camera sits 10 units ahead of the bow, so the ship occludes the fort behind it.
const S1a = (f: number) => { const Z = Lz(1, f); return dolly([16, 7, Z + 22], [0, 4, Z - 2], pushK(f, 0, 0.0025), { fov: 44 }); };
const S1b = (f: number) => { const Z = Lz(1, f); return dolly([12, 6, Z + 18], [0, 3.5, Z - 2], pushK(f, 72, 0.002), { fov: 40 }); };
// shot 2: VOC ship wide with the coastal town behind it (camera out at sea, looking at the coast).
// Round 4: closer AND lower — the old high camera looked down at the sea, so the bottom half of
// the frame was empty water; a near-level view puts the ship + town + sky in the frame instead.
const S2a = (f: number) => zoom([16, 8, 40], [0, 6, 8], 44, pushK(f, 126, 0.002));
const S2b = (f: number) => zoom([12, 7, 34], [0, 6, 4], 42, pushK(f, 200, 0.002));
// shot 3: low side view of the lanong, oars dipping in sync — pulled back and raised so the deck,
// rowers, oars and sea all read (the first version sat at deck height and the hull filled the frame)
const S3a = (f: number) => { const Z = Lz(3, f); return dolly([15, 5, Z + 7], [0, 2, Z + 3], pushK(f, 283, 0.0025)); };
const S3b = (f: number) => { const Z = Lz(3, f); return dolly([11, 3.4, Z + 5], [0, 1.8, Z + 2], pushK(f, 360, 0.002), { fov: 36 }); };
// shot 4: rowers' faces + drum, closer on the drum beat — camera offset to +x so the mast sits
// left of centre instead of blocking the middle of the frame. Round 4: further out (+x) so the
// nearest rower is not cropped at the frame edge and the mast/sail edge clears the right side.
const S4a = (f: number) => { const Z = Lz(4, f); return dolly([5.2, 4.2, Z - 7], [0.2, 2.8, Z + 1], pushK(f, 444, 0.0025), { fov: 38 }); };
const S4b = (f: number) => { const Z = Lz(4, f); return dolly([4.5, 3.8, Z - 5], [0.2, 2.8, Z], pushK(f, 490, 0.002), { fov: 34 }); };
// shot 5: VOC captain laughing on deck — tighter and lower so the sailors fill the frame (the
// first version left half the frame as empty sky). Round 3: pulled back a little — at 4.5 units
// the faces were cropped at the frame edges. Round 4: look shifted -x so the leftmost sailor
// is fully in frame.
const S5a = (f: number) => dolly([3.8, 4.4, 10], [-0.5, 3.9, 18], pushK(f, 534, 0.0025), { fov: 38 });
const S5b = (f: number) => dolly([2.8, 4.0, 12.5], [-0.5, 3.8, 18], pushK(f, 590, 0.002), { fov: 36, roll: 0.04 });
// shot 6: sails go slack — wide on the VOC ship, then the slack sail CU (the first CU looked at
// y=8 while the sails hang at y≈9.5-15, so the sail was out of frame). Round 3: the wide pulled
// back so the fore mast is not a giant bar at the frame edge. Round 4: the CU was 8 units from
// the sail, so the flat canvas filled the frame and the slack never read — pull back to ~23 units
// and shoot 3/4, so the drooped sail, its yard and the mast all read against the sky.
const S6a = (f: number) => dolly([12, 8, 0], [0, 6, 18], pushK(f, 643, 0.002), { fov: 42 });
const S6b = (f: number) => dolly([12, 11, -8], [0, 11, 12], pushK(f, 730, 0.0025), { fov: 40 });
// shot 7: lanong closing fast, low 3/4 front. Round 4: raised — from deck height the near rail
// hid the bow, so the prow post read as a floating dark box in the sky; from higher up the bow
// is visible below the post.
const S7a = (f: number) => { const Z = Lz(7, f); return dolly([7, 5, Z - 10], [0, 2.4, Z + 5], pushK(f, 823, 0.002), { fov: 44 }); };
const S7b = (f: number) => { const Z = Lz(7, f); return dolly([3, 4.2, Z - 6], [0, 2.4, Z + 3], pushK(f, 900, 0.0025, 0.006, 30), { fov: 38 }); };
// shot 8: the ram — the lanong closing on the VOC from the side (the first "mast insert" looked
// straight at the VOC mast with the lanong behind the camera, so the closing ship never
// appeared), then a true aerial of the impact with BOTH ships and the impact point in frame,
// then a high aerial of the aftermath with the fallen mast on the VOC deck.
// (The first aerial sat inside the lanong's sail, so the impact never read.)
const S8a = (f: number) => dolly([34, 12, -16], [0, 4, 10], pushK(f, 987, 0.0025, 0.006, 35), { fov: 40 }); // round 6: wide side shot — the two ships are 16 units apart on the z axis and the 9:16 frame only covers ~10 units at close range, so a close side view can never show both; from 44 units the overlapping bow/stern section + both sails fit
const S8b = (f: number) => dolly([14, 20, -6], [0, 1.5, 13], pushK(f, 1039, 0.0025), { fov: 42 });
const S8c = (f: number) => dolly([16, 16, 0], [0, 1, 12], pushK(f, 1090, 0.002), { fov: 42 });
// shots 9: sailors sitting in the water, closer on "Sayangnya" — pulled back so the nearest
// sailor is not a giant out-of-focus blob in front of the lens. Round 3: moved to OPEN WATER
// east of the VOC (x 4.2-9) — the first positions sat under the lanong's hull, which blocked them.
// Round 4: pulled back a little more — the nearest sitter was cropped at the frame edge.
const S9a = (f: number) => dolly([9.5, 1.9, 8.5], [6, 0.6, 17], pushK(f, 1128, 0.0018), { fov: 40, roll: -0.03 });
const S9b = (f: number) => dolly([8, 1.6, 10.5], [6, 0.6, 17.5], pushK(f, 1215, 0.0018), { fov: 37, roll: 0.04 });
// shot 10: golden pond wide, toy boats — higher and further back so the kids at the near rim,
// both boats and the whole pond read (the first version cropped the pusher out of frame).
// Round 3: due SOUTH of the pond — the 9:16 frame is only ~13° half-wide, so a side camera puts
// the rim kids 40°+ off-axis and out of frame. Round 4: centred on the KIDS (x≈54.2, between
// the pusher at 52.5 and the watcher at 56) — the old target x=55 put the pusher at the right
// edge; note screen-right is -x when looking +z, so the pusher reads on the right.
const S10a = (f: number) => zoom([54.2, 6, -95], [54.2, 0.3, -75.5], 44, pushK(f, 1295, 0.0016));
// shot 11: the kid pushes the rowboat — from due south, kid at the near edge, boat crossing.
// Round 4: centred on the PUSHER (52.5) + the crossing boat — the old target x=54.5 put the
// pusher at the left edge and the watcher out of frame right.
const S11a = (f: number) => dolly([53.5, 4.5, -92], [53.5, 0.5, -77.5], pushK(f, 1405, 0.0015), { fov: 40 });
const S11b = (f: number) => dolly([55, 3, -60], [55, 0.4, -75], pushK(f, 1520, 0.0015), { fov: 42 }); // round 7: from the beach (north), looking south at the pond — the fort (x=28, z=-55) sits behind this camera, so it can never enter the frame; the sails face the camera and both boats fit. (The round-6 south camera [55,3,-104] was inside a tree canopy: solid purple blur.)
// shot 12: fort on the coast, lanong sailing into the sunset, crane out — shot from the SEA side
// looking back at the coast, so the lanong, the fort, the town and the sunset are all in frame
// (the first version hugged the fort tower and the lanong never appeared). Round 4: the look
// target is AT the lanong — it parks at z=+10 after the ram (lanongZ caps at 70), so the old
// target z=-12 put the lanong 12 units left of the view centre, out of frame.
const S12a = (f: number) => dolly([30, 11, 48], [0, 4, 8], pushK(f, 1614, 0.002), { fov: 44 });
const S12b = (f: number) => dolly([-26, 16, 52], [0, 3, 8], pushK(f, 1700, 0.0015), { fov: 44 });

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },
    { f: 72, dur: 32, s: S1b },
  ],
  2: [
    { f: 126, s: S2a },
    { f: 200, dur: 18, s: S2b },
  ],
  3: [
    { f: 283, s: S3a },
    { f: 360, dur: 40, s: S3b },
  ],
  4: [
    { f: 444, s: S4a },
    { f: 490, dur: 20, s: S4b },
  ],
  5: [
    { f: 534, s: S5a },
    { f: 590, dur: 18, s: S5b },
  ],
  6: [
    { f: 643, s: S6a },
    { f: 730, dur: 20, s: S6b },
  ],
  7: [
    { f: 823, s: S7a },
    { f: 900, dur: 29, s: S7b },
  ],
  8: [
    { f: 987, s: S8a },
    { f: 1039, cut: true, s: S8b },
    { f: 1090, cut: true, s: S8c },
  ],
  9: [
    { f: 1128, s: S9a },
    { f: 1215, dur: 18, s: S9b },
  ],
  10: [{ f: 1295, s: S10a }],
  11: [
    { f: 1405, s: S11a },
    { f: 1520, dur: 28, s: S11b },
  ],
  12: [
    { f: 1614, s: S12a },
    { f: 1700, dur: 30, s: S12b },
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
  const c = run(CAMS[id], f), a = kickAt(T(f));
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
const rowEyes = (id: number) => (f: number): V3 => [0, LANONG_DECK + 1.6, Lz(id, f)];
const vocEyes = (): V3 => [0, VOC_DECK + 1.6, 18];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, // wide sea establishing
  { f: 72, dur: 32, cInf: 12, focus: rowEyes(1) },
  { f: 130, cInf: 0 }, // VOC + town aerial
  { f: 283, cInf: 10, focus: rowEyes(3) }, // lanong side, oars
  { f: 444, cInf: 14, focus: rowEyes(4) }, // rowers' faces CU
  { f: 534, cInf: 12, focus: vocEyes }, // captain MS
  { f: 643, cInf: 0 }, // slack sails wide
  { f: 730, dur: 20, cInf: 12 }, // slack sail CU, focus = look
  { f: 823, cInf: 0 }, // lanong closing
  { f: 987, cInf: 14 }, // mast insert
  { f: 1039, cInf: 0 }, // aerial impact
  { f: 1134, cInf: 6, focus: () => [6, 0.6, 17] }, // sailors in the water — was 16: the nearest sailor blurred into a blob
  { f: 1303, cInf: 7 }, // pond golden, focus = look
  { f: 1620, cInf: 0 }, // fort + sunset wide
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
  // pond shots: a bush in the bottom-right corner below the toy boats
  { a: 1411, b: 1620, kit: "plant_bushDetailed", pos: [POND[0] + 4.5, 0, POND[2] - 4.5], s: 1.0, yaw: 0.4 },
];
