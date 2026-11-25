// Our cast as lit flat sprites in the 3D world — BAJAK JAWA. Each frame every character asks for a drawing
// (a key + a draw call); the pool keeps one canvas per distinct drawing, so rowers in step share canvases.
// Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones on land get a soft multiply contact blob.
// Effects are unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never
// outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, VILLAGER_JAVA, KID, PARENT, STUDENT, GRADUATE, LECTURER, TEACHER, SKINS,
  fxShadow, fxContact, fxBike,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS, CAMPUS_POS, WARUNG_POS, SCHOOL_POS, HOME_POS, ROAD_X,
  walkZ, rideZ, viralZ, sunsetZ, StoryState,
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
const VILLAGERS = [0, 1, 2, 3].map((v) => ({ ...VILLAGER_JAVA, skin: SKINS[v % 4] }));
const vOf = (i: number) => (i * 7 + (i >> 2)) % 4;
/** head-shape seed: 7 shapes, so rowers in step still share canvases */
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

const GRADUATES = [0, 1, 2, 3].map((v) => ({ ...GRADUATE, skin: SKINS[v % 4] }));
const STUDENTS = [0, 1, 2, 3].map((v) => ({ ...STUDENT, skin: SKINS[v % 4] }));
const KIDS = [0, 1, 2, 3].map((v) => ({ ...KID, skin: SKINS[v % 4] }));

/** Andhika on the road with his red bike: side view walking/riding south (+z), the bike card
 *  beside him with its wheels turning. flip follows the character's screen direction.
 *  ride = true seats him on the saddle (mode "ride") with the bike card aligned under his hip. */
const andhikaRoad = (t: number, cam: CamInfo, out: Stage, outfit: Outfit, okey: string, z: number, phase: number, expr: Expr, i = 100, ride = false) => {
  const view = viewOf(cam, ROAD_X, z, 0, 1);
  const so: SideOpts = ride ? { mode: "ride", phase: phase % 1, expr, blink: lidAt(t, i) } : { mode: "march", phase: phase % 1, expr, blink: lidAt(t, i) };
  const fo: FrontOpts = { mode: "stroll", phase: phase % 1, expr, blink: lidAt(t, i) };
  out.places.push(person(cam, { i, o: outfit, okey }, ROAD_X, D0, z, view, fo, so));
  blob(out, ROAD_X, D0, z, 1, 0.9);
  const flip = view.mirror;
  const bp = ((z * 0.47) % 1 + 1) % 1;
  let bx: number, bz: number;
  if (ride) {
    // saddle sits 0.15 m behind the bike centre along the direction of travel; put the bike
    // centre that far ahead of Andhika, 0.12 m to the far side of the road so it stays visible
    const sgn = flip ? -1 : 1;
    bx = ROAD_X + sgn * cam.right.x * 0.15 - 0.12;
    bz = z + sgn * cam.right.z * 0.15;
  } else {
    // walking: the bike leads him slightly, offset toward the direction of travel
    bx = ROAD_X + (flip ? -0.2 : 0.2);
    bz = z + (flip ? 0.25 : -0.25);
  }
  out.fx.push({ key: `bike|${flip ? "L" : "R"}|${q(bp, 20)}`, cw: 600, ch: 400, draw: (p) => fxBike(p, bp, flip),
    x: bx, y: 0.63, z: bz, w: 1.9, h: 1.27 });
};

/** the hook (crowd "road", shot 1): Andhika in his toga walks south pushing the red bike */
const roadCrowd = (t: number, cam: CamInfo, out: Stage) => {
  andhikaRoad(t, cam, out, GRADUATES[0], "g0", walkZ(t), (t * 0.9) % 1, "smile");
};

/** the campus (crowd "campus", shot 2): Andhika in his toga on the steps with fellow graduates */
const campusCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const who: Who = { i: 300, o: GRADUATES[0], okey: "g0" };
  out.places.push(person(cam, who, CAMPUS_POS[0], 1.0, -20.5, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 300), wave: 0.5 + 0.3 * Math.sin(t * 2.4), look: 0 }, {}));
  blob(out, CAMPUS_POS[0], 1.0, -20.5);
  const XS = [-6, -3.5, 3.5, 6];
  XS.forEach((x, i) => {
    const w2: Who = { i: i + 310, o: GRADUATES[vOf(i + 1)], okey: `g${vOf(i + 1)}` };
    const f2: FrontOpts = { mode: "stand", expr: i % 2 ? "grin" : "smile", blink: lidAt(t, i + 310), wave: i % 2 ? 0.4 + 0.3 * Math.sin(t * 2 + i) : undefined, look: 0 };
    out.places.push(person(cam, w2, x, 1.0, -20.5 + (i % 2) * 1.5, { side: false, mirror: false }, f2, {}));
    blob(out, x, 1.0, -20.5 + (i % 2) * 1.5);
  });
};

/** the ride (crowd "ride", shots 3-4): Andhika as a student rides the red bike south;
 *  fellow students walk on the sidewalk */
const rideCrowd = (t: number, cam: CamInfo, out: Stage) => {
  andhikaRoad(t, cam, out, STUDENTS[0], "s0", rideZ(t), ((rideZ(t) * 0.47) % 1 + 1) % 1, "grin", 100, true);
  for (let i = 0; i < 3; i++) {
    const z = rideZ(t) + 4 + i * 5;
    const who: Who = { i: i + 320, o: STUDENTS[vOf(i + 1)], okey: `s${vOf(i + 1)}` };
    const view = viewOf(cam, 5.5, z, 0, -1);
    const so: SideOpts = { mode: "march", phase: (t * 0.9 + i * 0.17) % 1, expr: "smile", blink: lidAt(t, i + 320) };
    const fo: FrontOpts = { mode: "stroll", phase: (t * 0.9 + i * 0.17) % 1, expr: "smile", blink: lidAt(t, i + 320) };
    out.places.push(person(cam, who, 5.5, D0, z, view, fo, so));
    blob(out, 5.5, D0, z, 1, 0.9);
  }
};

/** the low point (crowd "kos", shot 5): Andhika sits on the kos steps, head down; the lecturer
 *  talks to him and his expression lifts from dazed to relief around t = 24 s */
const kosCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const lifted = t >= 24;
  const who: Who = { i: 330, o: STUDENTS[0], okey: "s0" };
  out.places.push(person(cam, who, 29, D0, 8, { side: false, mirror: false },
    { mode: "sit", expr: lifted ? "relief" : "dazed", blink: lidAt(t, 330, [24]), headTilt: lifted ? 0 : 10, look: 0 }, {}));
  blob(out, 29, D0, 8, 1.05, 0.8);
  const lec: Who = { i: 331, o: LECTURER, okey: "lec" };
  out.places.push(person(cam, lec, 28, D0, 10, { side: false, mirror: false },
    { mode: "stand", expr: "smile", blink: lidAt(t, 331), headTilt: -4, look: 0 }, {}));
  blob(out, 28, D0, 10);
};

/** the parents (crowd "home", shot 6, golden): mother and father at the door of the hill house, waving */
const homeCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const dad: Who = { i: 340, o: PARENT, okey: "par" };
  out.places.push(person(cam, dad, HOME_POS[0] - 1.2, D0, -53.5, { side: false, mirror: false },
    { mode: "stand", expr: "smile", blink: lidAt(t, 340), wave: 0.5 + 0.3 * Math.sin(t * 2.2), look: 0 }, {}));
  blob(out, HOME_POS[0] - 1.2, D0, -53.5);
  const mum: Who = { i: 341, o: { jacket: "#c25a7a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#d9a441", skin: SKINS[1] }, okey: "mum" };
  out.places.push(person(cam, mum, HOME_POS[0] + 1.2, D0, -53.5, { side: false, mirror: false },
    { mode: "stand", expr: "smile", blink: lidAt(t, 341), wave: 0.5 + 0.3 * Math.sin(t * 2.2 + 1), look: 0 }, {}));
  blob(out, HOME_POS[0] + 1.2, D0, -53.5);
};

/** the viral moment (crowd "viral", shot 7): Andhika in his toga pushes the bike slowly;
 *  villagers watch from the sidewalk */
const viralCrowd = (t: number, cam: CamInfo, out: Stage) => {
  andhikaRoad(t, cam, out, GRADUATES[0], "g0", viralZ(t), (t * 0.6) % 1, "neutral");
  for (let i = 0; i < 3; i++) {
    const z = viralZ(t) + 1 + i * 2.5;
    const who: Who = { i: i + 350, o: VILLAGERS[vOf(i)], okey: `j${vOf(i)}` };
    const expr: Expr = i === 0 ? "shock" : i === 1 ? "grin" : "smile";
    out.places.push(person(cam, who, -4.5, D0, z, { side: false, mirror: false },
      { mode: "stand", expr, blink: lidAt(t, i + 350), wave: i === 1 ? 0.6 : undefined, look: 0 }, {}));
    blob(out, -4.5, D0, z);
  }
};

/** the warung (crowd "warung", shot 8): the stall owner smiles behind her stall; Andhika in his toga arrives */
const warungCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const owner: Who = { i: 360, o: { jacket: "#5d7a3a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#5a8fc2", skin: SKINS[2] }, okey: "own" };
  out.places.push(person(cam, owner, WARUNG_POS[0], D0, WARUNG_POS[2] + 1.5, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 360), wave: 0.4 + 0.3 * Math.sin(t * 2), look: 0 }, {}));
  blob(out, WARUNG_POS[0], D0, WARUNG_POS[2] + 1.5);
  const who: Who = { i: 361, o: GRADUATES[0], okey: "g0" };
  out.places.push(person(cam, who, WARUNG_POS[0] - 1, D0, WARUNG_POS[2] - 2, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 361), look: 0 }, {}));
  blob(out, WARUNG_POS[0] - 1, D0, WARUNG_POS[2] - 2);
};

/** the school (crowd "school", shot 9, golden): Andhika as a teacher with his pupils */
const schoolCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const who: Who = { i: 370, o: TEACHER, okey: "tea" };
  out.places.push(person(cam, who, SCHOOL_POS[0], D0, SCHOOL_POS[2] - 1, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 370), wave: 0.5 + 0.3 * Math.sin(t * 2.4), look: 0 }, {}));
  blob(out, SCHOOL_POS[0], D0, SCHOOL_POS[2] - 1);
  const XS = [-4, -1.5, 1.5, 4];
  XS.forEach((dx, i) => {
    const w2: Who = { i: i + 380, o: KIDS[vOf(i)], okey: `k${vOf(i)}` };
    out.places.push(person(cam, w2, SCHOOL_POS[0] + dx, D0, SCHOOL_POS[2] + 1.5 + (i % 2), { side: false, mirror: false },
      { mode: "stand", expr: i % 2 ? "grin" : "smile", blink: lidAt(t, i + 380), wave: i === 0 ? 0.6 : undefined, look: 0 }, {}, 0.72));
    blob(out, SCHOOL_POS[0] + dx, D0, SCHOOL_POS[2] + 1.5 + (i % 2), 0.72);
  });
};

/** the sunset ride (crowd "sunset", shot 10, golden): Andhika rides south toward the horizon */
const sunsetCrowd = (t: number, cam: CamInfo, out: Stage) => {
  andhikaRoad(t, cam, out, STUDENTS[0], "s0", sunsetZ(t), ((sunsetZ(t) * 0.47) % 1 + 1) % 1, "smile", 100, true);
};

/** distant town figures (shots with towns flag): a few villagers in front of the houses */
const distantTown = (t: number, cam: CamInfo, out: Stage) => {
  for (let i = 0; i < 6; i++) {
    const x = -14 + i * 5 + (hh(i, 5) - 0.5) * 1.5, z = -34 - (hh(i, 6) - 0.5) * 2;
    const who: Who = { i: i + 470, o: VILLAGERS[vOf(i)], okey: `j${vOf(i)}` };
    const fo: FrontOpts = { mode: "stand", expr: "neutral", blink: lidAt(t, i + 470) };
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
    case "road": roadCrowd(t, cam, out); break;
    case "campus": campusCrowd(t, cam, out); break;
    case "ride": rideCrowd(t, cam, out); break;
    case "kos": kosCrowd(t, cam, out); break;
    case "home": homeCrowd(t, cam, out); break;
    case "viral": viralCrowd(t, cam, out); break;
    case "warung": warungCrowd(t, cam, out); break;
    case "school": schoolCrowd(t, cam, out); break;
    case "sunset": sunsetCrowd(t, cam, out); break;
    default: break;
  }
  if (s.towns) distantTown(t, cam, out);
  return out;
};

export { FPS };
