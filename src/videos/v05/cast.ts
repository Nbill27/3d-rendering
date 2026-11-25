// Our cast as lit flat sprites in the 3D world — VIDEO05 (Great Molasses Flood, Boston 1919).
// Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas
// per distinct drawing, so people in step share canvases.
// Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones on land get a soft multiply contact blob.
// Effects are unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never
// outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, KID, PARENT, SKINS, FIREMAN, TANKWORKER, WORKER, townsfolk,
  fxShadow, fxContact, fxHorseCart, fxWave, fxMolassesDrip, fxMolassesSplash, fxPlank, fxSplash,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS, TANK_FACE_Z,
  cartZ, StoryState,
  clamp01,
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
/** head-shape seed: 7 shapes, so people in step still share canvases */
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

// ---------------- crowd by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

const WORKERS = [0, 1, 2, 3].map((v) => ({ ...TANKWORKER, skin: SKINS[v % 4] }));
const FIREMEN = [0, 1, 2].map((v) => ({ ...FIREMAN, skin: SKINS[v % 4] }));
const ORANGE_WORKER = { ...WORKER, skin: SKINS[1] };
const KIDS = [0, 1].map((v) => ({ ...KID, skin: SKINS[v % 4] }));

/** a 1919 Boston resident (top hat or bonnet, period dress) standing or strolling */
const resident = (t: number, cam: CamInfo, out: Stage, i: number, x: number, z: number, expr: Expr, stroll = false) => {
  const o = townsfolk(i);
  const who: Who = { i: i + 500, o, okey: `r${i % 4}` };
  const view = stroll ? viewOf(cam, x, z, 0, 1) : { side: false, mirror: false };
  const ph = (t * 0.9 + i * 0.17) % 1;
  const so: SideOpts = { mode: "march", phase: ph, expr, blink: lidAt(t, i + 500) };
  const fo: FrontOpts = { mode: stroll ? "stroll" : "stand", phase: ph, expr, blink: lidAt(t, i + 500), look: 0 };
  out.places.push(person(cam, who, x, D0, z, view, fo, so));
  blob(out, x, D0, z, 1, 0.9);
};

/** horse-drawn cart on the street, travelling south (+z); phase drives the walk + wheels */
const horseCart = (t: number, cam: CamInfo, out: Stage, x: number, z: number, phase: number) => {
  const view = viewOf(cam, x, z, 0, 1);
  const flip = view.mirror;
  out.fx.push({ key: `horseCart|${flip ? "L" : "R"}|${q(phase, 20)}`, cw: 1000, ch: 440, draw: (p) => fxHorseCart(p, phase, flip),
    x, y: 0.88, z, w: 4.4, h: 1.94 });
};

/** the giant molasses wave as a camera-facing card at the wave front */
const waveCard = (t: number, cam: CamInfo, out: Stage, z: number, w: number, h: number, grow: number) => {
  void cam;
  out.fx.push({ key: `wave|${q(z, 1)}|${q(grow, 10)}`, cw: 1400, ch: 700, draw: (p) => fxWave(p, grow),
    x: 0, y: h / 2, z, w, h });
};

/** brown drip streaks on the tank face (the leaking seams) */
const dripCard = (out: Stage, x: number, y: number, z: number, w = 1.1, h = 1.7) => {
  out.fx.push({ key: `drip|${x}`, cw: 200, ch: 300, draw: (p) => fxMolassesDrip(p), x, y, z, w, h });
};

/** the hook (crowd "tank", shot 1): the giant tank towers over the street; workers, residents, a horse cart below */
const tankCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const w1: Who = { i: 600, o: WORKERS[0], okey: "w0" };
  out.places.push(person(cam, w1, -3, D0, -20, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 600), wave: 0.5 + 0.3 * Math.sin(t * 2.2), look: 0 }, {}));
  blob(out, -3, D0, -20);
  const w2: Who = { i: 601, o: ORANGE_WORKER, okey: "wo" };
  out.places.push(person(cam, w2, 3.5, D0, -18, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 601), look: 0 }, {}));
  blob(out, 3.5, D0, -18);
  resident(t, cam, out, 0, -5.5, -8, "smile", true);
  resident(t, cam, out, 1, 5.5, -4, "smile", true);
  resident(t, cam, out, 2, 6, 6, "neutral", true);
  horseCart(t, cam, out, 4.5, 3, (t * 0.5) % 1);
};

/** the leak (crowd "leak", shot 2): workers at the tank base point up at the dripping seams */
const leakCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const w1: Who = { i: 610, o: WORKERS[1], okey: "w1" };
  out.places.push(person(cam, w1, -2, D0, -22, { side: false, mirror: false },
    { mode: "stand", expr: "shock", blink: lidAt(t, 610), wave: 0.5 + 0.3 * Math.sin(t * 2.4), look: 0 }, {}));
  blob(out, -2, D0, -22);
  const w2: Who = { i: 611, o: WORKERS[2], okey: "w2" };
  out.places.push(person(cam, w2, 2.5, D0, -21, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 611), headTilt: 8, look: 0 }, {}));
  blob(out, 2.5, D0, -21);
  resident(t, cam, out, 3, -5, -14, "shock");
  dripCard(out, -4, 3.2, TANK_FACE_Z + 0.4);
  dripCard(out, 5, 2.6, TANK_FACE_Z + 0.4);
};

/** the plates (crowd "plates", shot 3): low angle up the riveted wall; a worker shakes his head at the thin steel */
const platesCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const w1: Who = { i: 620, o: WORKERS[3], okey: "w3" };
  out.places.push(person(cam, w1, -2.5, D0, -19, { side: false, mirror: false },
    { mode: "stand", expr: "stern", blink: lidAt(t, 620), headTilt: 6, look: 0 }, {}));
  blob(out, -2.5, D0, -19);
  const w2: Who = { i: 621, o: ORANGE_WORKER, okey: "wo" };
  out.places.push(person(cam, w2, 2.5, D0, -18, { side: false, mirror: false },
    { mode: "stand", expr: "dazed", blink: lidAt(t, 621), look: 0 }, {}));
  blob(out, 2.5, D0, -18);
  dripCard(out, -6, 4.5, TANK_FACE_Z + 0.4);
  dripCard(out, 1, 5.5, TANK_FACE_Z + 0.4);
  dripCard(out, 7, 3.8, TANK_FACE_Z + 0.4);
};

/** street life (crowd "street", shot 4): horse cart, strolling residents, a kid with his mother */
const streetCrowd = (t: number, cam: CamInfo, out: Stage) => {
  horseCart(t, cam, out, -2, -4 + t * 0.8, (t * 0.6) % 1);
  resident(t, cam, out, 0, 5.5, -2, "smile", true);
  resident(t, cam, out, 1, -5.5, 6, "smile", true);
  resident(t, cam, out, 2, 5.5, 12, "neutral", true);
  const mum: Who = { i: 630, o: PARENT, okey: "par" };
  out.places.push(person(cam, mum, -5.5, D0, 16, { side: false, mirror: false },
    { mode: "stand", expr: "smile", blink: lidAt(t, 630), look: 0 }, {}));
  blob(out, -5.5, D0, 16);
  const kid: Who = { i: 631, o: KIDS[0], okey: "k0" };
  out.places.push(person(cam, kid, -4, D0, 16.5, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 631), look: 0 }, {}, 0.72));
  blob(out, -4, D0, 16.5, 0.72);
};

/** the burst (crowd "burst", shot 5): the tank ruptures, molasses explodes out; people recoil in shock */
const burstCrowd = (t: number, cam: CamInfo, out: Stage, b: StoryState) => {
  const g = b.burst;
  if (g > 0.02) {
    waveCard(t, cam, out, TANK_FACE_Z + 2 * g, 8 + 18 * g, 2 + 6 * g, g);
    out.fx.push({ key: `splash|${q(g, 10)}`, cw: 800, ch: 400, draw: (p) => fxMolassesSplash(p, g),
      x: 0, y: 0.6, z: TANK_FACE_Z + 3 * g, w: 10 + 12 * g, h: 1.2 });
  }
  const w1: Who = { i: 640, o: WORKERS[0], okey: "w0" };
  out.places.push(person(cam, w1, -4, D0, -14, { side: false, mirror: false },
    { mode: "stand", expr: "shock", blink: lidAt(t, 640, [22]), look: 0 }, {}));
  blob(out, -4, D0, -14);
  const w2: Who = { i: 641, o: ORANGE_WORKER, okey: "wo" };
  out.places.push(person(cam, w2, 4, D0, -12, { side: false, mirror: false },
    { mode: "stand", expr: "shock", blink: lidAt(t, 641, [22]), look: 0 }, {}));
  blob(out, 4, D0, -12);
  resident(t, cam, out, 3, -6, -6, "shock");
  resident(t, cam, out, 1, 6, -4, "shock");
};

/** the wave (crowd "wave", shot 6): the giant wave front sweeps down the street; people run, the cart flees */
const waveCrowd = (t: number, cam: CamInfo, out: Stage, b: StoryState) => {
  const wz = b.wave;
  waveCard(t, cam, out, wz, 26, 8, 1);
  out.fx.push({ key: `splash|wave|${q(wz, 1)}`, cw: 800, ch: 400, draw: (p) => fxMolassesSplash(p, 1),
    x: 0, y: 0.6, z: wz + 1.5, w: 16, h: 1.2 });
  horseCart(t, cam, out, 2, cartZ(t), (t * 2) % 1);
  for (let i = 0; i < 3; i++) {
    const z = wz + 7 + i * 3.5;
    const who: Who = { i: i + 650, o: townsfolk(i + 1), okey: `r${(i + 1) % 4}` };
    const view = viewOf(cam, i % 2 ? 4.5 : -4.5, z, 0, 1);
    const so: SideOpts = { mode: "march", phase: (t * 2.2 + i * 0.2) % 1, expr: "shock", blink: lidAt(t, i + 650) };
    const fo: FrontOpts = { mode: "stroll", phase: (t * 2.2 + i * 0.2) % 1, expr: "shock", blink: lidAt(t, i + 650) };
    out.places.push(person(cam, who, i % 2 ? 4.5 : -4.5, D0, z, view, fo, so));
    blob(out, i % 2 ? 4.5 : -4.5, D0, z, 1, 0.9);
  }
};

/** the smash (crowd "smash", shot 7): the wave has passed; the train hangs off the tracks, people wade in molasses */
const smashCrowd = (t: number, cam: CamInfo, out: Stage) => {
  // the wave front is still sweeping past at z=10, low enough that the train and houses show above it
  waveCard(t, cam, out, 10, 20, 5.5, 1);
  for (let i = 0; i < 3; i++) {
    const x = -4 + i * 4, z = 8 + i * 4;
    const who: Who = { i: i + 660, o: townsfolk(i + 2), okey: `r${(i + 2) % 4}` };
    out.places.push(person(cam, who, x, D0, z, { side: false, mirror: false },
      { mode: "stand", expr: i === 0 ? "shock" : "dazed", blink: lidAt(t, i + 660), headTilt: i === 1 ? 8 : 0, look: 0 }, {}));
    blob(out, x, D0, z);
  }
  // the horse cart, stuck at the side of the street
  horseCart(t, cam, out, 5, 26, 0);
  // floating debris planks
  out.fx.push({ key: "plank|1", cw: 320, ch: 110, draw: (p) => fxPlank(p),
    x: -3, y: 0.25, z: 14, w: 1.6, h: 0.55, flat: true, rot: 0.4 });
  out.fx.push({ key: "plank|2", cw: 320, ch: 110, draw: (p) => fxPlank(p),
    x: 4, y: 0.25, z: 20, w: 1.6, h: 0.55, flat: true, rot: -0.7 });
};

/** aftermath (crowd "aftermath", shot 8): the street covered in molasses; firemen and residents wade through it */
const aftermathCrowd = (t: number, cam: CamInfo, out: Stage) => {
  for (let i = 0; i < 3; i++) {
    const x = -4 + i * 4, z = -2 + i * 3;
    const who: Who = { i: i + 670, o: FIREMEN[i], okey: `f${i}` };
    const view = viewOf(cam, x, z, 0, -1);
    const so: SideOpts = { mode: "march", phase: (t * 0.5 + i * 0.2) % 1, expr: "stern", blink: lidAt(t, i + 670) };
    const fo: FrontOpts = { mode: "stroll", phase: (t * 0.5 + i * 0.2) % 1, expr: "stern", blink: lidAt(t, i + 670) };
    out.places.push(person(cam, who, x, D0, z, view, fo, so));
    blob(out, x, D0, z, 1, 0.9);
  }
  resident(t, cam, out, 0, 5.5, 8, "dazed");
  resident(t, cam, out, 2, -5.5, 12, "dazed");
  horseCart(t, cam, out, 5, 24, 0);
};

/** cleanup at golden hour (crowd "cleanup", shot 9): firemen hosing, residents scrubbing */
const cleanupCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const f1: Who = { i: 680, o: FIREMEN[0], okey: "f0" };
  out.places.push(person(cam, f1, -3, D0, 2, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 680), wave: 0.5 + 0.3 * Math.sin(t * 2), look: 0 }, {}));
  blob(out, -3, D0, 2);
  // hose water spray in front of the fireman
  out.fx.push({ key: `hose|${q(t, 4)}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, (t % 1)), x: -1.5, y: 0.9, z: 4, w: 3.2, h: 3.2, soft: true });
  const f2: Who = { i: 681, o: FIREMEN[1], okey: "f1" };
  out.places.push(person(cam, f2, 3, D0, 0, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 681), headTilt: 10, look: 0 }, {}));
  blob(out, 3, D0, 0);
  resident(t, cam, out, 1, 5.5, 6, "neutral");
  const mum: Who = { i: 682, o: PARENT, okey: "par" };
  out.places.push(person(cam, mum, -5.5, D0, 8, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 682), headTilt: 12, look: 0 }, {}));
  blob(out, -5.5, D0, 8);
};

/** the sunset (crowd "sunset", shot 10, golden): quiet street, a fireman and residents look down the street */
const sunsetCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const f1: Who = { i: 690, o: FIREMEN[2], okey: "f2" };
  out.places.push(person(cam, f1, -3, D0, 6, { side: false, mirror: false },
    { mode: "stand", expr: "relief", blink: lidAt(t, 690), look: 0 }, {}));
  blob(out, -3, D0, 6);
  resident(t, cam, out, 0, 3, 8, "relief");
  resident(t, cam, out, 2, 5.5, 12, "neutral");
};

/** distant town figures (shots with towns flag): residents along the sidewalks */
const distantTown = (t: number, cam: CamInfo, out: Stage) => {
  for (let i = 0; i < 6; i++) {
    const x = i % 2 ? 12 : -12, z = -8 + i * 4 + (hh(i, 5) - 0.5) * 2;
    const who: Who = { i: i + 700, o: townsfolk(i), okey: `r${i % 4}` };
    const fo: FrontOpts = { mode: "stand", expr: "neutral", blink: lidAt(t, i + 700) };
    out.places.push(person(cam, who, x, D0, z, { side: false, mirror: false }, fo, {}));
  }
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, b: StoryState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "tank": tankCrowd(t, cam, out); break;
    case "leak": leakCrowd(t, cam, out); break;
    case "plates": platesCrowd(t, cam, out); break;
    case "street": streetCrowd(t, cam, out); break;
    case "burst": burstCrowd(t, cam, out, b); break;
    case "wave": waveCrowd(t, cam, out, b); break;
    case "smash": smashCrowd(t, cam, out); break;
    case "aftermath": aftermathCrowd(t, cam, out); break;
    case "cleanup": cleanupCrowd(t, cam, out); break;
    case "sunset": sunsetCrowd(t, cam, out); break;
    default: break;
  }
  if (s.towns) distantTown(t, cam, out);
  return out;
};

export { FPS };
