// Timeline VIDEO07: shot timed to the voice words, camera grammar from the
// cartoon_3d_short skill: continuous slow push-ins; symmetric ease-in-out glides ~23 f;
// big reframes are cuts; every hold creeps (no static hold >= 4 f).
// True story: Victor Lustig sells the Eiffel Tower for scrap in Paris, May 1925 — twice.
// One question: "How did a con man sell the Eiffel Tower?"
export const FPS = 30;
export const TOTAL = 1800;
export const D0 = 0;
export type V3 = [number, number, number];

// ---- key places (ground y=0; north = -z) ----
export const TOWER_POS: V3 = [0, 0, -60]; // Eiffel Tower, north end of the plaza
export const PLAZA_Z = -34; // Lustig's hook spot, on the plaza under the tower
export const HOTEL_POS: V3 = [-46, 0, 2]; // Hotel de Crillon salon, table centre (west, interior room)
export const TABLE_POS: V3 = [-46, 0, 2]; // the salon's long table
export const CAFE_POS: V3 = [40, 0, 26]; // Vienna cafe terrace (east), Lustig's table
export const STREET_X = 0; // the cobbled street south from the plaza

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- story motion ----------------
/** shot 9 (46-52 s): the two policemen walk in through the salon's east door, x -37 -> -42 */
export const policeX = (t: number) => -37 - 5 * clamp01((t - 46) / 4);
/** shot 9 (46-52 s): Lustig slips out the west door with his suitcase, x -52 -> -55.5 */
export const exitX = (t: number) => -52 - 3.5 * clamp01((t - 47) / 3);
/** shot 1 (0-5 s): Lustig strolls a step toward the camera on the street, z 8 -> 11 */
export const hookZ = (t: number) => 8 + 3 * clamp01(t / 5);

export type StoryState = { police: number; exit: number };
export const storyState = (id: number, t: number): StoryState => ({
  police: id === 9 ? clamp01((t - 46) / 4) : 0,
  exit: id === 9 ? clamp01((t - 47) / 3) : 0,
});

// ---------------- shots ----------------
export type Light = "day" | "golden" | "warm";
export type Crowd = "hook" | "cafe" | "hotel" | "pitch" | "payoff" | "wait" | "poisson" | "return" | "police" | "sunset";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 150, light: "day", crowd: "hook", tau: (t) => t, towns: true },
  { id: 2, a: 150, b: 330, light: "day", crowd: "cafe", tau: (t) => t },
  { id: 3, a: 330, b: 510, light: "warm", crowd: "hotel", tau: (t) => t },
  { id: 4, a: 510, b: 660, light: "warm", crowd: "pitch", tau: (t) => t },
  { id: 5, a: 660, b: 840, light: "warm", crowd: "payoff", tau: (t) => t },
  { id: 6, a: 840, b: 1020, light: "day", crowd: "wait", tau: (t) => t },
  { id: 7, a: 1020, b: 1200, light: "day", crowd: "poisson", tau: (t) => t, towns: true },
  { id: 8, a: 1200, b: 1380, light: "warm", crowd: "return", tau: (t) => t },
  { id: 9, a: 1380, b: 1560, light: "warm", crowd: "police", tau: (t) => t },
  { id: 10, a: 1560, b: TOTAL, light: "golden", crowd: "sunset", tau: (t) => t, towns: true },
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 6: 8, 7: 8, 8: 8, 10: 8 };
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
// S1 hook: Lustig on the STREET south of the plaza, the whole tower behind him —
// camera pulled far back down the street (z +20) and wide (fov 55) so the full tower
// silhouette (arched base, two decks, spire) fits, with Lustig ~20% of frame height
// standing in front of the tower's arch, his head just below the subtitle band.
// The camera retreats as he advances (the (z - 8) term) so the push-in never swallows him.
// NOTE: these framings use pushK rate 0 (no dolly interpolation) on purpose: dolly()
// pulls the camera toward the far look target, and over an 85 m look distance even a 6%
// pull moves the camera 5 m up/forward and pushes Lustig out of the frame. Motion comes
// from the camera retreating as Lustig walks, plus the S1a->S1b glide at f=72.
const S1a = (f: number) => { const z = hookZ(f / FPS); return dolly([0, 1.2, 18.5 + (z - 8)], [0, 32, -60], pushK(f, 0, 0), { fov: 55 }); };
const S1b = (f: number) => { const z = hookZ(f / FPS); return dolly([0, 1.2, 17.5 + (z - 8)], [0, 30, -60], pushK(f, 72, 0), { fov: 52 }); };
// S2 cafe: Lustig seated at the Vienna cafe table, newspaper held up in front of him, waiter nearby.
// Camera high (y ~4) so the sightline clears the 1 m chair backs and the seated men's torsos
// read instead of hiding behind them; centred on Lustig's table; the patrons' table was moved
// close to his so the whole terrace fits.
const S2a = (f: number) => dolly([45, 4.2, 35], [38.5, 1.2, 26.8], pushK(f, 150, 0.002), { fov: 48 });
const S2b = (f: number) => dolly([44.5, 4.1, 34.5], [38.5, 1.0, 26.8], pushK(f, 240, 0.0025), { fov: 46 });
// S3 hotel: the salon, Lustig at the head of the table with the five dealers around it, forged letters on the table.
// Camera lowered and swung west so Lustig (head of the table) is fully in frame and the
// ceiling / empty upper wall drop out of the shot.
const S3a = (f: number) => dolly([-39.5, 2.7, 8], [-47.5, 1.5, 1.5], pushK(f, 330, 0.002), { fov: 42 });
const S3b = (f: number) => dolly([-40.5, 2.4, 7], [-47, 1.6, 1.5], pushK(f, 420, 0.0025), { fov: 38 });
// S4 pitch: closer — Lustig pointing at the miniature tower on the table, Poisson leaning in eagerly.
const S4a = (f: number) => dolly([-40, 2.2, 6.5], [-46, 1.2, 1.5], pushK(f, 510, 0.002), { fov: 38 });
const S4b = (f: number) => dolly([-41, 2, 5.5], [-46, 1.1, 1.5], pushK(f, 580, 0.0025), { fov: 36 });
// S5 payoff: Poisson hands over the envelope; Lustig pockets the money, sly smile.
const S5a = (f: number) => dolly([-40, 2.4, 5.5], [-45.8, 1.2, 1.7], pushK(f, 660, 0.002), { fov: 38 });
const S5b = (f: number) => dolly([-41, 2.2, 4.5], [-45.8, 1.1, 1.7], pushK(f, 750, 0.0025), { fov: 36 });
// S6 wait: Vienna cafe again, Lustig with a stack of French newspapers, checking for news that never comes.
// Camera reframe (4th pass): moved to the SOUTHEAST, low-medium height (y ~3), looking northwest at
// the table, fov 52-54. Why: Lustig faces north, and the flat papers (y 0.82) sit on the table's north
// side, HIGHER than his seated chin (~0.76 m) — so every camera from the north puts the sightline to
// his chin THROUGH the paper stack (passes 1-2 hid his mouth, and the high pass went empty;
// the close north pass was dropped before rendering — it would have cleared the face but lost
// the awning, and this southeast angle was proven by still_240 to give both).
// From the southeast he sits on the NEAR side of the table, the papers lie BEHIND him, and his whole
// face reads clear above them; the striped awning's underside fills the top of frame, exactly as in
// the approved S2 cafe still (still_240). Varied from S2 by being lower, closer and wider (S2 was
// y 4.2 / fov 48 from further out).
const S6a = (f: number) => dolly([43.5, 3.4, 32.5], [38.5, 1.0, 26.8], pushK(f, 840, 0.002), { fov: 54 });
const S6b = (f: number) => dolly([42.5, 3.1, 31.5], [38.5, 0.95, 26.8], pushK(f, 930, 0.0025), { fov: 52 });
// S7 Poisson alone: the street under the tower, Poisson head down, embarrassed, tower looming behind him.
// Camera pulled far back down the street and wide (fov 55-58) so the FULL tower (base, both
// decks, spire tip) fits behind him, with Poisson small in the lower frame, clear of the subtitle.
// Same dolly note as S1: pushK rate 0, the slow 2 m drift over each key keeps the shot
// creeping instead of a static hold.
const S7a = (f: number) => dolly([0, 2, 5 - 2 * clamp01((f - 1020) / 90)], [0, 27, -60], pushK(f, 1020, 0), { fov: 55 });
const S7b = (f: number) => dolly([0, 1.9, 0 - 2 * clamp01((f - 1110) / 90)], [0, 25, -60], pushK(f, 1110, 0), { fov: 58 });
// S8 return: the salon again from the west side — Lustig with fresh letters, five NEW dealers.
const S8a = (f: number) => dolly([-53, 2.6, 8], [-46, 1.4, 1], pushK(f, 1200, 0.002), { fov: 42 });
const S8b = (f: number) => dolly([-51, 2.2, 6], [-46, 1.3, 1.5], pushK(f, 1290, 0.0025), { fov: 38 });
// S9 police: wide view of the salon — policemen walk in through the east door, dealers react, Lustig slips out west.
const S9a = (f: number) => dolly([-40, 2.8, -3], [-46, 1.4, 2], pushK(f, 1380, 0.002), { fov: 44 });
const S9b = (f: number) => dolly([-42, 2.4, -2], [-47, 1.3, 1.5], pushK(f, 1470, 0.002), { fov: 40 });
// S10 sunset: the tower standing majestic at golden hour, plaza below, Lustig gone.
// Look target raised so the spire tip (which was cropped at the top edge) fits inside the frame.
// Same dolly note as S1: pushK rate 0, the slow lateral drift keeps the shot creeping.
const S10a = (f: number) => dolly([12 + 2 * clamp01((f - 1560) / 120), 3, 30 + 3 * clamp01((f - 1560) / 120)], [0, 30, -60], pushK(f, 1560, 0), { fov: 44 });
const S10b = (f: number) => dolly([16 + 2 * clamp01((f - 1680) / 120), 6, 42 + 3 * clamp01((f - 1680) / 120)], [0, 27, -60], pushK(f, 1680, 0), { fov: 46 });

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
  { f: 72, dur: 32, cInf: 10, focus: (f) => [0, 1.6, hookZ(f / FPS)] },
  { f: 150, cInf: 0 },
  { f: 240, dur: 24, cInf: 10, focus: () => [38.5, 1.2, 26] },
  { f: 330, cInf: 0 },
  { f: 420, dur: 24, cInf: 12, focus: () => [-46, 1.4, 1] },
  { f: 510, cInf: 0 },
  { f: 580, dur: 24, cInf: 8, focus: () => [-46.5, 1.2, 1] },
  { f: 660, cInf: 0 },
  { f: 750, dur: 24, cInf: 8, focus: () => [-45.8, 1.2, 1.2] },
  { f: 840, cInf: 0 },
  { f: 930, dur: 24, cInf: 10, focus: () => [39, 1.2, 26] },
  { f: 1020, cInf: 0 },
  { f: 1110, dur: 24, cInf: 10, focus: (f) => [0, 1.6, -15] },
  { f: 1200, cInf: 0 },
  { f: 1290, dur: 24, cInf: 12, focus: () => [-46, 1.4, 1] },
  { f: 1380, cInf: 0 },
  { f: 1470, dur: 24, cInf: 10, focus: () => [-46, 1.4, 1.5] },
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

/** near framing objects: visible while a <= f < b; kit = a GLB name accepted by build.ts prop() */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
