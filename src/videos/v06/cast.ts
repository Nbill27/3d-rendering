// Our cast as lit flat sprites in the 3D world — VIDEO06 (Tsutomu Yamaguchi).
// Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas per distinct
// drawing, so characters in step share canvases.
// Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones on land get a soft multiply contact blob.
// Effects are unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never
// outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, YAMAGUCHI, YAMAGUCHI_BANDAGED, COLLEAGUE, LECTURER, YAMAGUCHI_OLD, OFFICIAL_JP, SKINS,
  fxShadow, fxContact, fxBurst, fxPuff, fxTrain, fxMushroom, fxSmoke,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS, STREET_X, TRACK_X, DITCH_POS,
  walkZ, diveAt, trainZ, stumbleZ, dazedZ, StoryState,
  clamp01, easeOutCubic,
} from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** head-shape seed: 7 shapes, so characters in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- train, blast, smoke (effect cards) ----------------
/** the 1940s passenger train carriage, moving south on the tracks; flip = facing screen-left.
 *  Tahap 6: kartu 12 x 6 m -> 6,5 x 3,25 m. Kartu lama lebih lebar dari frame pada jarak kamera
 *  17 m (lebar frame ~7,3 m), jadi lokomotif + cerobong terpotong di tepi kiri dan gerbong di
 *  kanan, uapnya melayang lepas; kereta 6 m pun terlalu tinggi dibanding karakter 2,16 m.
 *  Kartu baru muat penuh (88% lebar frame), tinggi 3,25 m proporsional dengan karakter, dan
 *  roda bawahnya (kanvas y 348/400) menyentuh rel (y 0,14). */
const train = (out: Stage, t: number, z: number, flip = true) => {
  const qp = Math.round((((t * 0.9) % 1) + 1) % 1 * 8) / 8;
  out.fx.push({ key: `train|${flip ? "L" : "R"}|${qp}`, cw: 800, ch: 400, draw: (p) => fxTrain(p, qp, flip),
    x: TRACK_X, y: 1.625, z, w: 6.5, h: 3.25 });
};
/** the atomic blast: a white-hot star burst in the sky, growing over ~1.2 s from the flash frame.
 *  Tahap 3 (anatomy_reveal): this sits HIGH in the sky on purpose — the reveal
 *  (projects/yamaguchi/anatomy/reveal-little-boy.html, koreografi-s3.md) shows Little Boy
 *  detonating at 580 m, an airburst, never a ground impact. Do not lower this to the ground. */
const blast = (out: Stage, x: number, y: number, z: number, t: number, t0: number) => {
  const bt = clamp01((t - t0) / 1.2);
  if (bt <= 0) return;
  // Tahap 5: kartu membesar ease-out cubic (cepat mekar, lambat mengendap, tanpa overshoot) —
  // momen berat, bukan main-main. Gambar di dalamnya (fxBurst) sudah ease-out sendiri.
  const be = easeOutCubic(bt);
  out.fx.push({ key: `blast|${Math.round(bt * 8) / 8}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, bt),
    x, y, z, w: 14 + 10 * be, h: 14 + 10 * be });
};
/** the distant mushroom cloud after a blast, rising over ~3 s.
 *  Tahap 3: rises from a HIGH point in the sky (airburst at 580 m, reveal beat 6),
 *  never from the ground — there is no crater in S4, only ruins and smoke columns. */
const mushroom = (out: Stage, x: number, y: number, z: number, t: number, t0: number) => {
  const mt = clamp01((t - (t0 + 0.6)) / 3);
  if (mt <= 0) return;
  out.fx.push({ key: `mushroom|${Math.round(mt * 8) / 8}`, cw: 600, ch: 600, draw: (p) => fxMushroom(p, mt),
    x, y, z, w: 26, h: 26 });
};
/** a dark smoke column rising from the ruins; phase drifts slowly so columns never freeze */
const smoke = (out: Stage, x: number, z: number, t: number, seed = 0) => {
  const pt = ((t * 0.08 + seed * 0.31) % 1);
  out.fx.push({ key: `smoke|${Math.round(pt * 8) / 8}`, cw: 300, ch: 600, draw: (p) => fxSmoke(p, pt),
    x, y: 7, z, w: 3.2, h: 14, soft: true });
};

// ---------------- crowd by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

const yamaguchi = (bandaged: boolean): Who => bandaged
  ? { i: 600, o: { ...YAMAGUCHI_BANDAGED, skin: SKINS[1] }, okey: "yamb" }
  : { i: 600, o: { ...YAMAGUCHI, skin: SKINS[1] }, okey: "yam" };
const colleague = (i: number): Who => ({ i: i + 610, o: { ...COLLEAGUE, skin: SKINS[(i + 2) % 4] }, okey: `col${i % 2}` });
const supervisor: Who = { i: 630, o: { ...LECTURER, skin: SKINS[0] }, okey: "sup" };
const oldYamaguchi: Who = { i: 640, o: { ...YAMAGUCHI_OLD, skin: SKINS[1] }, okey: "yamo" };
const official: Who = { i: 650, o: { ...OFFICIAL_JP, skin: SKINS[0] }, okey: "off" };

/** Tahap 5 (motion_design): standing characters breathe — a slow ±0.7° torso sway
 *  (secondary layer) so no standing shot is a frozen pose. Heavy moments (flash,
 *  dive) deliberately have NO sway: the blast beats stay weighty and held. */
const breathe = (t: number, i: number) => 0.7 * Math.sin(t * 1.4 + i * 1.7);

/** the hook (crowd "street", shot 1): Yamaguchi walks south down the Hiroshima street toward
 *  the station, two colleagues behind him, townsfolk on the pavement, morning light */
const streetCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const z = walkZ(t);
  const view = viewOf(cam, STREET_X, z, 0, 1);
  const so: SideOpts = { mode: "march", phase: (t * 0.9) % 1, expr: "alert", blink: lidAt(t, 600) };
  const fo: FrontOpts = { mode: "stroll", phase: (t * 0.9) % 1, expr: "alert", blink: lidAt(t, 600) };
  out.places.push(person(cam, yamaguchi(false), STREET_X, D0, z, view, fo, so));
  blob(out, STREET_X, D0, z);
  for (const [i, dz] of [[0, -4], [1, -7]] as const) {
    const v2 = viewOf(cam, STREET_X + (i ? 1.2 : -1.2), z + dz, 0, 1);
    const so2: SideOpts = { mode: "march", phase: (t * 0.9 + i * 0.3) % 1, expr: "alert", blink: lidAt(t, i + 610) };
    const fo2: FrontOpts = { mode: "stroll", phase: (t * 0.9 + i * 0.3) % 1, expr: "alert", blink: lidAt(t, i + 610) };
    out.places.push(person(cam, colleague(i), STREET_X + (i ? 1.2 : -1.2), D0, z + dz, v2, fo2, so2));
    blob(out, STREET_X + (i ? 1.2 : -1.2), D0, z + dz);
  }
  // townsfolk on the pavement, watching the morning street
  // Perbaikan 3 (still3_90): townsfolk barat -5,5 -> -4,2 — di still2_90 dan still3_90
  // dia (dan pejalan kaki -5,6) terpotong setengah di tepi kiri meski kamera S1 sudah
  // dimundurkan + look digeser ke barat; mereka digeser ke timur supaya masuk frame utuh.
  for (const [i, x, zz] of [[0, 5.5, -18], [1, -4.2, -23.5]] as const) {
    out.places.push(person(cam, colleague(i + 10), x, D0, zz, { side: false, mirror: false },
      { mode: "stand", expr: "alert", blink: lidAt(t, i + 620), look: 0, tilt: breathe(t, i + 620) }, {}));
    blob(out, x, D0, zz);
  }
  // distant pedestrians by the market stall, deep in the background left (kept clear of the
  // stall's footprint so no counter clips through them); one stands in the left mid-ground
  for (const [i, x, zz] of [[0, -2.6, -25], [1, -2.0, -23], [2, -4.2, -25.8]] as const) {
    out.places.push(person(cam, colleague(i + 20), x, D0, zz, { side: false, mirror: false },
      { mode: "stand", expr: "alert", blink: lidAt(t, i + 660), look: 0, tilt: breathe(t, i + 660) }, {}));
    blob(out, x, D0, zz);
  }
};

/** the office (crowd "office", shot 2): Yamaguchi and two colleagues in front of the Mitsubishi
 *  office, papers in hand, the last calm morning. They stand WEST of the office front (x=9.5),
 *  in the yard facing the street — never inside the building. */
const officeCrowd = (t: number, cam: CamInfo, out: Stage) => {
  // Tahap 6: grup dirapatkan (3,5/6/7,5 -> 4/5,5/7, juru tulis 2,5 -> 3) karena di
  // still2_225 kamera yang didekatkan memotong rekan ketiga di tepi kanan dan juru tulis
  // hilang; lebar grup 4 m kini muat dalam frame ~5,2 m pada jarak kamera baru.
  const XS = [4, 5.5, 7];
  XS.forEach((x, i) => {
    const who = i === 1 ? yamaguchi(false) : colleague(i);
    out.places.push(person(cam, who, x, D0, -27, { side: false, mirror: false },
      { mode: "stand", expr: i === 1 ? "smile" : "alert", blink: lidAt(t, i + 630), look: 0, tilt: breathe(t, i + 630) }, {}));
    blob(out, x, D0, -27);
  });
  // a clerk carries a stack of papers toward the office door
  out.places.push(person(cam, colleague(5), 3, D0, -27.5, { side: false, mirror: false },
    { mode: "stroll", phase: (t * 0.5) % 1, expr: "alert", blink: lidAt(t, 635), look: 0 }, {}));
  blob(out, 3, D0, -27.5);
};

/** the first blast (crowd "flash1", shot 3): Yamaguchi walks on the street; at 12.5 s the sky
 *  erupts white and he dives for the ditch. The two colleagues dive behind him. */
const flash1Crowd = (t: number, cam: CamInfo, out: Stage) => {
  const flashed = t >= 12.5, d = diveAt(t);
  const z = flashed ? -12 : walkZ(t);
  if (!flashed) {
    const view = viewOf(cam, STREET_X, z, 0, 1);
    const so: SideOpts = { mode: "march", phase: (t * 0.9) % 1, expr: "alert", blink: lidAt(t, 600) };
    const fo: FrontOpts = { mode: "stroll", phase: (t * 0.9) % 1, expr: "alert", blink: lidAt(t, 600) };
    out.places.push(person(cam, yamaguchi(false), STREET_X, D0, z, view, fo, so));
    blob(out, STREET_X, D0, z);
  } else {
    // Yamaguchi flat in the ditch, face down, shielding his head (front view, "fall" pose)
    const so: SideOpts = { mode: "march", phase: 0, expr: "shock", blink: lidAt(t, 600, [12.5]) };
    const fo: FrontOpts = { mode: "fall", expr: "shock", blink: lidAt(t, 600, [12.5]) };
    out.places.push(person(cam, yamaguchi(false), DITCH_POS[0], D0, DITCH_POS[2], { side: false, mirror: false }, fo, so));
    blob(out, DITCH_POS[0], D0, DITCH_POS[2]);
    // a colleague dives beside him
    out.places.push(person(cam, colleague(0), DITCH_POS[0] + 2.5, D0, DITCH_POS[2] + 1, { side: false, mirror: false },
      { mode: "fall", expr: "shock", blink: lidAt(t, 610, [12.5]) }, {}));
    blob(out, DITCH_POS[0] + 2.5, D0, DITCH_POS[2] + 1);
  }
  // the blast itself: white-hot burst in the northern sky, then the mushroom cloud
  blast(out, -6, 26, -70, t, 12.3);
  mushroom(out, -18, 22, -85, t, 12.5);
  // dust kicked up by the dive
  if (flashed && d < 1) {
    const pt = clamp01((t - 12.5) / 1.5);
    out.fx.push({ key: `puff|${Math.round(pt * 8) / 8}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, pt),
      x: DITCH_POS[0], y: 0.5, z: DITCH_POS[2], w: 1.6, h: 1.6, soft: true });
  }
};

/** the first aftermath (crowd "ruin1", shot 4): smoke columns, rubble. Yamaguchi, bandaged,
 *  stumbles south through the wreckage with two colleagues. */
const ruin1Crowd = (t: number, cam: CamInfo, out: Stage) => {
  const z = stumbleZ(t);
  smoke(out, -6, -22, t, 0);
  smoke(out, 8, -30, t, 1);
  smoke(out, -12, -8, t, 2);
  const view = viewOf(cam, STREET_X, z, 0, 1);
  const so: SideOpts = { mode: "march", phase: (t * 0.45) % 1, expr: "pained", blink: lidAt(t, 600) };
  const fo: FrontOpts = { mode: "stroll", phase: (t * 0.45) % 1, expr: "pained", blink: lidAt(t, 600) };
  out.places.push(person(cam, yamaguchi(true), STREET_X, D0, z, view, fo, so));
  blob(out, STREET_X, D0, z);
  for (const [i, dz] of [[0, -3], [1, -6]] as const) {
    const v2 = viewOf(cam, STREET_X + (i ? 1.5 : -1.5), z + dz, 0, 1);
    const so2: SideOpts = { mode: "march", phase: (t * 0.45 + i * 0.3) % 1, expr: "dazed", blink: lidAt(t, i + 640) };
    const fo2: FrontOpts = { mode: "stroll", phase: (t * 0.45 + i * 0.3) % 1, expr: "dazed", blink: lidAt(t, i + 640) };
    out.places.push(person(cam, colleague(i), STREET_X + (i ? 1.5 : -1.5), D0, z + dz, v2, fo2, so2));
    blob(out, STREET_X + (i ? 1.5 : -1.5), D0, z + dz);
  }
};

/** the train home (crowd "train", shot 5): the train runs south; Yamaguchi, bandaged, rides
 *  at the open carriage door, a colleague beside him at the window. */
const trainCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const z = trainZ(t);
  train(out, t, z, true);
  // steam puffs above the locomotive chimney at the FRONT of the train (south, z+2.9):
  // the locomotive leads, so the steam rises ahead of the carriage, not over its middle.
  // Tahap 6: cerobong ikut kartu baru (kanvas x 757 -> z+2,9; puncak y 2,49), jadi uap
  // dipindah dari z+5,5/y 5,5 ke z+2,9/y 2,7 dan dikecilkan supaya menempel di cerobong.
  for (let k = 0; k < 3; k++) {
    const pt = (t * 1.5 + k * 0.33) % 1;
    out.fx.push({ key: `puff|${Math.round(pt * 8) / 8}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, pt),
      x: TRACK_X, y: 2.6 + k * 0.3, z: z + 2.9 - k * 0.7, w: 1.6, h: 1.6, soft: true });
  }
  // the door step Yamaguchi stands on (anatomy: door-step sits on the carriage
  // underframe) — his feet stand on a step, not on air above the wheels.
  // Tahap 6: pintu gerbong pada kartu baru ada di z-0,72 (kanvas x 470-504), jadi anak
  // tangga ikut ke z-0,7, tepat di bawah kaki Yamaguchi.
  out.fx.push({ key: "trainstep", cw: 200, ch: 60, draw: (p) => {
    p.poly([[10, 18], [190, 18], [190, 44], [10, 44]], "#223626", 6);
    p.stroke([[14, 30], [186, 30]], 4, "#5a5f6a");
  }, x: TRACK_X + 0.5, y: 0.85, z: z - 0.7, w: 1.4, h: 0.4 });
  // Yamaguchi at the open door, standing on the carriage floor (y 0.9), no ground blob.
  // Tahap 6: dia digeser ke pintu (z-0,7) supaya benar-benar berdiri di ambang pintu,
  // bukan 1,3 m di selatannya di depan jendela.
  out.places.push(person(cam, yamaguchi(true), TRACK_X + 0.5, 0.9, z - 0.7, { side: false, mirror: false },
    { mode: "stand", expr: "pained", blink: lidAt(t, 600), look: 0 }, {}));
  // a colleague at the carriage door just north of Yamaguchi (screen-right from the camera).
  // He must stay on the NORTH side of the train card's plane: the card faces the camera from the
  // north, so anyone south of its plane (z+2.5) is hidden behind it.
  // Tahap 6: rekan digeser ke z-1,3 supaya tetap di atas anak tangga (tepi utara z-1,4).
  out.places.push(person(cam, colleague(1), TRACK_X + 0.5, 0.9, z - 1.3, { side: false, mirror: false },
    { mode: "stand", expr: "dazed", blink: lidAt(t, 611), look: 0 }, {}));
};

/** back at work (crowd "office2", shot 6): Nagasaki — Yamaguchi, bandaged, telling his supervisor
 *  about Hiroshima in front of the office, colleagues listening. They stand WEST of the office
 *  front (x=10), in the yard facing the street — never inside the building. */
const office2Crowd = (t: number, cam: CamInfo, out: Stage) => {
  // the supervisor listens, arms folded by his stern face
  out.places.push(person(cam, supervisor, 6, D0, 30, { side: false, mirror: false },
    { mode: "stand", expr: "stern", blink: lidAt(t, 630), look: 0, tilt: breathe(t, 630) }, {}));
  blob(out, 6, D0, 30);
  // Yamaguchi tells the story, one hand raised as he describes the blast
  out.places.push(person(cam, yamaguchi(true), 4, D0, 29, { side: false, mirror: false },
    { mode: "stand", expr: "shock", blink: lidAt(t, 600), wave: 0.5 + 0.25 * Math.sin(t * 2.4), look: 0, tilt: breathe(t, 600) }, {}));
  blob(out, 4, D0, 29);
  for (const [i, x] of [[0, 3], [1, 6.5]] as const) {
    out.places.push(person(cam, colleague(i), x, D0, 28.5, { side: false, mirror: false },
      { mode: "stand", expr: i ? "nervous" : "alert", blink: lidAt(t, i + 645), look: 0, tilt: breathe(t, i + 645) }, {}));
    blob(out, x, D0, 28.5);
  }
};

/** the second blast (crowd "flash2", shot 7): the same office front; at 35 s the sky erupts
 *  again, the building shakes, everyone shields their faces. Same positions as shot 6
 *  (west of the office front, never inside). The blast is in the NORTHERN sky, where the
 *  camera (looking north) can see it. */
const flash2Crowd = (t: number, cam: CamInfo, out: Stage) => {
  const flashed = t >= 35;
  const expr: Expr = flashed ? "shock" : "stern";
  out.places.push(person(cam, supervisor, 6, D0, 30, { side: false, mirror: false },
    { mode: "stand", expr, blink: lidAt(t, 630, [35]), look: 0, tilt: flashed ? 0 : breathe(t, 630) }, {}));
  blob(out, 6, D0, 30);
  out.places.push(person(cam, yamaguchi(true), 4, D0, 29, { side: false, mirror: false },
    { mode: "stand", expr: "shock", blink: lidAt(t, 600, [35]), wave: flashed ? undefined : 0.5 + 0.25 * Math.sin(t * 2.4), look: 0, tilt: flashed ? 0 : breathe(t, 600) }, {}));
  blob(out, 4, D0, 29);
  for (const [i, x] of [[0, 3], [1, 6.5]] as const) {
    out.places.push(person(cam, colleague(i), x, D0, 28.5, { side: false, mirror: false },
      { mode: "stand", expr: flashed ? "shock" : i ? "nervous" : "alert", blink: lidAt(t, i + 645, [35]), look: 0, tilt: flashed ? 0 : breathe(t, i + 645) }, {}));
    blob(out, x, D0, 28.5);
  }
  blast(out, -8, 18, 10, t, 34.8);
  mushroom(out, -16, 16, -5, t, 35);
};

/** the second aftermath (crowd "ruin2", shot 8): the Nagasaki office damaged, smoke,
 *  Yamaguchi's bandages blown off, everyone dazed. Yamaguchi stumbles south along the
 *  office front (x=8, west of the front wall at x=10); the others stay west of it too. */
const ruin2Crowd = (t: number, cam: CamInfo, out: Stage) => {
  const z = dazedZ(t);
  smoke(out, 8, 34, t, 3);
  smoke(out, -6, 26, t, 4);
  const view = viewOf(cam, 8, z, 0, -1);
  const so: SideOpts = { mode: "march", phase: (t * 0.4) % 1, expr: "dazed", blink: lidAt(t, 600) };
  const fo: FrontOpts = { mode: "stroll", phase: (t * 0.4) % 1, expr: "dazed", blink: lidAt(t, 600) };
  out.places.push(person(cam, yamaguchi(false), 8, D0, z, view, fo, so));
  blob(out, 8, D0, z);
  out.places.push(person(cam, supervisor, 6, D0, z - 2, { side: false, mirror: false },
    { mode: "stand", expr: "dazed", blink: lidAt(t, 630), look: 0, tilt: breathe(t, 630) }, {}));
  blob(out, 6, D0, z - 2);
  out.places.push(person(cam, colleague(0), 5, D0, z - 1, { side: false, mirror: false },
    { mode: "stroll", phase: (t * 0.4 + 0.3) % 1, expr: "dazed", blink: lidAt(t, 645), look: 0 }, {}));
  blob(out, 5, D0, z - 1);
};

/** the recognition (crowd "honor", shot 9): 2009 — older Yamaguchi receives the official
 *  recognition certificate from an official in front of the civic hall, a small crowd watching.
 *  They stand EAST of the hall front (x=-10), on the street side — never inside the hall. */
const honorCrowd = (t: number, cam: CamInfo, out: Stage) => {
  // the official hands over the certificate: a white paper card with a red seal.
  // Perbaikan 3 (still2_1395): menumpang kartu di torso SAJA TIDAK CUKUP — di
  // still2_1395 kartu tetap melayang karena kedua tangan menggantung di sisi badan,
  // jauh di bawah kartu. Kali ini (a) kedua pria dirapatkan (jarak pusat 1,0 -> 0,7 m:
  // pejabat -5,75 -> -5,9, Yamaguchi tua -6,75 -> -6,6) dan kartu dilebarkan
  // (0,72 -> 0,78 m), dan (b) TANGAN DIGAMBAR DI KARTU ITU SENDIRI: lengan + telapak
  // tangan pejabat (jaket navy #2f3a5c, kulit #ffe2c2) memegang tepi kiri kartu dan
  // lengan + telapak tangan Yamaguchi tua (jaket #5a6a7a, kulit #f5c9a0) memegang
  // tepi kanan kartu, setinggi dada. Lengan keluar melewati tepi kartu ke arah torso
  // masing-masing, jadi tangan, kartu, dan torso bersentuhan di gambar — bukan posisi
  // 3D saja, tapi benar-benar tergambar menyentuh.
  out.places.push(person(cam, official, -5.9, D0, 31, { side: false, mirror: false },
    { mode: "stand", expr: "alert", blink: lidAt(t, 650), look: 0, tilt: breathe(t, 650) }, {}));
  blob(out, -5.9, D0, 31);
  out.places.push(person(cam, oldYamaguchi, -6.6, D0, 31, { side: false, mirror: false },
    { mode: "stand", expr: "relief", blink: lidAt(t, 640), look: 0, tilt: breathe(t, 640) }, {}));
  blob(out, -6.6, D0, 31);
  // the certificate, held between them at chest height — with both men's hands
  // gripping its edges (drawn on the card itself, see note above)
  out.fx.push({ key: "certificate", cw: 300, ch: 400, draw: (p) => {
    // arms reaching in from each side first (behind the card, so the hands overlap it)
    p.poly([[-8, 188], [46, 188], [46, 216], [-8, 216]], "#2f3a5c", 6); // official's navy sleeve, left
    p.poly([[254, 188], [308, 188], [308, 216], [254, 216]], "#5a6a7a", 6); // old Yamaguchi's sleeve, right
    p.poly([[40, 60], [260, 60], [260, 340], [40, 340]], "#f7f3ea", 8);
    p.stroke([[70, 120], [230, 120]], 6, "#8a8f96"); p.stroke([[70, 160], [230, 160]], 6, "#8a8f96");
    p.stroke([[70, 200], [200, 200]], 6, "#8a8f96"); p.stroke([[70, 240], [210, 240]], 6, "#8a8f96");
    p.dot(210, 300, 16, "#c0353a");
    // the official's hand ON the card face, just right of his torso's edge: the card
    // is drawn behind the characters (fx renderOrder 0 < actors 1), so a hand at the
    // card's left EDGE is hidden behind the official's torso — the first attempt at
    // canvas x 90 showed only a 12x20 px sliver (pixel-diff vs the previous still).
    // At canvas x 115 the hand sits fully right of his torso edge (screen x ~723,
    // torso edge ~702) on the paper itself, with a navy sleeve band reaching in from
    // behind his torso — so BOTH men are visibly holding the certificate, not just
    // old Yamaguchi on the right edge.
    p.poly([[48, 194], [115, 194], [115, 212], [48, 212]], "#2f3a5c", 6);
    p.ell(115, 202, 16, 14, "#ffe2c2", 6); p.stroke([[115, 192], [115, 212]], 5, "#241726");
    // hands gripping the card edges, on top of the card: skin circles straddling each
    // edge at chest height, with a thumb line over the paper
    p.ell(40, 202, 17, 15, "#ffe2c2", 6); p.stroke([[40, 192], [40, 212]], 5, "#241726");
    p.ell(260, 202, 17, 15, "#f5c9a0", 6); p.stroke([[260, 192], [260, 212]], 5, "#241726");
  }, x: -6.25, y: 1.12, z: 31, w: 0.78, h: 0.98, rot: -0.08 });
  // the small crowd: two colleagues and a clerk, respectful, watching
  for (const [i, x] of [[0, -2.5], [1, -4]] as const) {
    out.places.push(person(cam, colleague(i + 2), x, D0, i ? 28.5 : 30, { side: false, mirror: false },
      { mode: "stand", expr: "smile", blink: lidAt(t, i + 655), look: 0, tilt: breathe(t, i + 655) }, {}));
    blob(out, x, D0, i ? 28.5 : 30);
  }
};

/** the hills (crowd "hills", shot 10, golden): older Yamaguchi alone on a hill above Nagasaki,
 *  looking out over the rebuilt city at sunset. */
const hillsCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, oldYamaguchi, 0, 0, 66, { side: false, mirror: false },
    { mode: "stand", expr: "relief", blink: lidAt(t, 640), look: 0, tilt: breathe(t, 640) }, {}));
  blob(out, 0, 0, 66);
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, b: StoryState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "street": streetCrowd(t, cam, out); break;
    case "office": officeCrowd(t, cam, out); break;
    case "flash1": flash1Crowd(t, cam, out); break;
    case "ruin1": ruin1Crowd(t, cam, out); break;
    case "train": trainCrowd(t, cam, out); break;
    case "office2": office2Crowd(t, cam, out); break;
    case "flash2": flash2Crowd(t, cam, out); break;
    case "ruin2": ruin2Crowd(t, cam, out); break;
    case "honor": honorCrowd(t, cam, out); break;
    case "hills": hillsCrowd(t, cam, out); break;
    default: break;
  }
  return out;
};

export { FPS };
