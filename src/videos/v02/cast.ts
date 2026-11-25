// Our cast as lit flat sprites in the 3D world — VIDEO01. Each frame every character asks for a drawing
// (a key + a draw call); the pool keeps one canvas per distinct drawing, so rowers in step share canvases.
// Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones on land get a soft multiply contact blob.
// Effects are unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never
// outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, VILLAGER_JAVA, KID, PARENT, OFFICIAL, CLERK, WORKER, SKINS, fxRing,
  fxShadow, fxContact,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS, SNAP, STAGE_POS, OFFICE_POS, BUCKET_POS, TownState,
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

const OFFICIALS = [0, 1, 2, 3].map((v) => ({ ...OFFICIAL, skin: SKINS[v % 4] }));
const CLERKS = [0, 1, 2, 3].map((v) => ({ ...CLERK, skin: SKINS[v % 4] }));
const WORKERS = [0, 1, 2, 3].map((v) => ({ ...WORKER, skin: SKINS[v % 4] }));

/** villagers strolling across the plaza (shots 1-2): walking along +x, phase staggered */
const townCrowd = (t: number, cam: CamInfo, out: Stage) => {
  for (let i = 0; i < 8; i++) {
    const z = -4 + (i % 4) * 4 + (hh(i, 3) - 0.5) * 1.5;
    const x = -16 + (((t * 1.1 + i * 4.7) % 32) + 32) % 32;
    const who: Who = { i: i + 200, o: VILLAGERS[vOf(i)], okey: `j${vOf(i)}` };
    const view = viewOf(cam, x, z, 1, 0);
    const so: SideOpts = { mode: "march", phase: (t * 0.9 + i * 0.13) % 1, expr: i % 3 ? "neutral" : "smile", blink: lidAt(t, i + 200) };
    const fo: FrontOpts = { mode: "stroll", phase: (t * 0.9 + i * 0.13) % 1, expr: i % 3 ? "neutral" : "smile", blink: lidAt(t, i + 200) };
    out.places.push(person(cam, who, x, D0, z, view, fo, so));
    blob(out, x, D0, z, 1, 0.9);
  }
  // two villagers standing by the hall steps, chatting
  for (let i = 0; i < 2; i++) {
    const x = -4 + i * 8;
    const who: Who = { i: i + 220, o: VILLAGERS[vOf(i + 2)], okey: `j${vOf(i + 2)}` };
    out.places.push(person(cam, who, x, D0, -20, { side: false, mirror: false }, { mode: "stand", expr: "neutral", blink: lidAt(t, i + 220) }, {}));
    blob(out, x, D0, -20);
  }
};

/** the stage (crowd "stage" / "final", shots 3 and 12): the speaker speaks, the crowd cheers */
const stageCrowd = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const who: Who = { i: 300, o: OFFICIALS[0], okey: "o0" };
  const fo: FrontOpts = { mode: "stand", expr: id === 12 ? "laugh" : "grin", blink: lidAt(t, 300), wave: 0.7 + 0.3 * Math.sin(t * 2.4), look: 0 };
  out.places.push(person(cam, who, STAGE_POS[0], 0.8, STAGE_POS[2], { side: false, mirror: false }, fo, {}));
  blob(out, STAGE_POS[0], 0.8, STAGE_POS[2]);
  const XS = [-6, -4, -2, 0, 2, 4, 6, -7.5];
  XS.forEach((x, i) => {
    const z = -13.5 + (i % 2) * 2;
    const w2: Who = { i: i + 310, o: VILLAGERS[vOf(i)], okey: `j${vOf(i)}` };
    const expr: Expr = i % 3 === 0 ? "grin" : "smile";
    const f2: FrontOpts = { mode: "stand", expr, blink: lidAt(t, i + 310), wave: i % 2 ? 0.5 + 0.4 * Math.sin(t * 2 + i) : undefined, look: 0 };
    out.places.push(person(cam, w2, x, D0, z, { side: false, mirror: false }, f2, {}));
    blob(out, x, D0, z);
  });
};

/** the unfinished structure (crowd "project", shot 4): workers idle by the concrete skeleton */
const projectCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const spots: [number, number][] = [[-28, -6], [-26, -13], [-35, -14]];
  spots.forEach(([x, z], i) => {
    const who: Who = { i: i + 330, o: WORKERS[vOf(i)], okey: `w${vOf(i)}` };
    const expr: Expr = i === 0 ? "nervous" : "neutral";
    out.places.push(person(cam, who, x, D0, z, { side: false, mirror: false },
      { mode: "stand", expr, blink: lidAt(t, i + 330), headTilt: -8, look: 0 }, {}));
    blob(out, x, D0, z);
  });
  // two villagers watching from the fence, one shaking his head
  for (let i = 0; i < 2; i++) {
    const x = -24 + i * 3, z = -2;
    const who: Who = { i: i + 340, o: VILLAGERS[vOf(i + 1)], okey: `j${vOf(i + 1)}` };
    out.places.push(person(cam, who, x, D0, z, { side: false, mirror: false },
      { mode: "stand", expr: i ? "dazed" : "neutral", blink: lidAt(t, i + 340), headTilt: i ? 6 : 0 }, {}));
    blob(out, x, D0, z);
  }
};

/** the leaking (crowd "leak", shot 5): clerks and villagers under the pipe, looking up */
const leakCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const spots: [number, number, number][] = [[-18, -20, 0], [-15, -19.5, 1], [-12, -21, 0]];
  spots.forEach(([x, z, c], i) => {
    const who: Who = { i: i + 350, o: c ? CLERKS[vOf(i)] : VILLAGERS[vOf(i)], okey: c ? `c${vOf(i)}` : `j${vOf(i)}` };
    out.places.push(person(cam, who, x, D0, z, { side: false, mirror: false },
      { mode: "stand", expr: "nervous", blink: lidAt(t, i + 350), headTilt: -10, look: 0 }, {}));
    blob(out, x, D0, z);
  });
  // one villager holds a small bucket under a drip, hopeful
  const who: Who = { i: 360, o: VILLAGERS[2], okey: "j2" };
  out.places.push(person(cam, who, -20, D0, -20, { side: false, mirror: false },
    { mode: "stand", expr: "smile", blink: lidAt(t, 360), headTilt: -6 }, {}));
  blob(out, -20, D0, -20);
  // falling gold coins: bright discs as fx cards under the pipe
  for (let i = 0; i < 5; i++) {
    const u = ((t * 0.7 + i * 0.2) % 1);
    const y = 5.5 - u * 5.2;
    out.fx.push({ key: `coin${i}`, cw: 120, ch: 120, draw: (p) => { p.ell(60, 60, 44, 44, "#e8c45a", 6); p.ell(60, 60, 26, 26, "#f7dc8a", 3); },
      x: -18 + (i - 2) * 1.1, y, z: -24, w: 0.34, h: 0.34 });
  }
};

/** the office queue (crowd "queue", shot 6): a clerk at the window, a snaking line of villagers */
const queueCrowd = (t: number, b: TownState, cam: CamInfo, out: Stage) => {
  const who: Who = { i: 370, o: CLERKS[0], okey: "c0" };
  out.places.push(person(cam, who, OFFICE_POS[0], D0, -1.0, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 370), look: 0 }, {}));
  blob(out, OFFICE_POS[0], D0, -1.0);
  const n = Math.max(3, Math.round(3 + 9 * b.queue));
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 4), col = i % 4;
    const x = OFFICE_POS[0] + (row % 2 ? -col * 1.6 : col * 1.6) + (row % 2 ? 1.2 : -1.2);
    const z = 0.5 + row * 2.2;
    const w2: Who = { i: i + 380, o: VILLAGERS[vOf(i)], okey: `j${vOf(i)}` };
    const expr: Expr = i > n - 3 ? "nervous" : i % 3 === 0 ? "neutral" : "dazed";
    out.places.push(person(cam, w2, x, D0, z, { side: false, mirror: false },
      { mode: "stand", expr, blink: lidAt(t, i + 380), look: 0 }, {}));
    blob(out, x, D0, z);
  }
};

/** the snap (crowd "snap", shot 7): the clerk is shocked, the queue breaks up and walks away */
const snapCrowd = (t: number, b: TownState, cam: CamInfo, out: Stage) => {
  const hit = b.snapped;
  const who: Who = { i: 370, o: CLERKS[0], okey: "c0" };
  out.places.push(person(cam, who, OFFICE_POS[0], D0, -1.0, { side: false, mirror: false },
    { mode: "stand", expr: hit ? "shock" : "nervous", blink: lidAt(t, 370, [SNAP]), look: 0 }, {}));
  blob(out, OFFICE_POS[0], D0, -1.0);
  for (let i = 0; i < 6; i++) {
    const u = hit ? Math.min(1, (t - SNAP) / 2) : 0;
    const x = OFFICE_POS[0] + (i % 2 ? 1 : -1) * (1.5 + u * (4 + i));
    const z = 0.5 + Math.floor(i / 2) * 2.2 + u * 6;
    const w2: Who = { i: i + 400, o: VILLAGERS[vOf(i)], okey: `j${vOf(i)}` };
    const view = viewOf(cam, x, z, x > OFFICE_POS[0] ? 1 : -1, 1);
    const so: SideOpts = { mode: "march", phase: (t * 0.9 + i * 0.13) % 1, expr: hit ? "shock" : "neutral", blink: lidAt(t, i + 400, [SNAP]) };
    const fo: FrontOpts = { mode: "stroll", phase: (t * 0.9 + i * 0.13) % 1, expr: hit ? "shock" : "neutral", blink: lidAt(t, i + 400, [SNAP]) };
    out.places.push(person(cam, w2, x, D0, z, view, fo, so));
    blob(out, x, D0, z);
  }
  if (hit) {
    // a dropped form flutters: a small white card fx
    const u = Math.min(1, (t - SNAP) / 1.2);
    out.fx.push({ key: `form${Math.round(u * 20)}`, cw: 200, ch: 260, draw: (p) => { p.poly([[30, 20], [170, 20], [170, 240], [30, 240]], "#f4f1ea", 6); p.stroke([[55, 70], [145, 70]], 5); p.stroke([[55, 110], [145, 110]], 5); p.stroke([[55, 150], [120, 150]], 5); },
      x: OFFICE_POS[0] - 1, y: 1.6 - u * 1.2, z: -1, w: 0.5, h: 0.65, rot: u * 1.2 });
  }
};

/** seated villagers, front view (deadpan, shot 8) — on the pavement, no water */
const sitters = (cam: CamInfo, t: number, out: Stage, spots: [number, number, number][], exprs: (i: number) => Expr) => {
  spots.forEach(([x, y, z], i) => {
    const v = vOf(i + 3);
    const who: Who = { i: i + 420, o: VILLAGERS[v], okey: `j${v}` };
    out.places.push(person(cam, who, x, y, z, { side: false, mirror: false }, { mode: "sit", expr: exprs(i), blink: lidAt(t, i + 420), look: 0 }, {}));
    blob(out, x, y, z, 1.05, 0.8);
  });
};
const deadpanCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const spots: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) spots.push([27 + (i % 3) * 2.2, D0, -1 + Math.floor(i / 3) * 2.4]);
  const ex: Expr[] = ["dazed", "relief", "smile", "relief_open"];
  sitters(cam, t, out, spots, (i) => ex[i % 4]);
  // one villager still standing in the empty queue spot, shrugging
  const who: Who = { i: 430, o: VILLAGERS[1], okey: "j1" };
  out.places.push(person(cam, who, OFFICE_POS[0], D0, 0.5, { side: false, mirror: false },
    { mode: "stand", expr: "dazed", blink: lidAt(t, 430), headTilt: 6 }, {}));
  blob(out, OFFICE_POS[0], D0, 0.5);
};

/** the leaky bucket analogy (crowd "bucket", shots 9-10, golden): a parent pours, a kid points at the holes */
const bucketCrowd = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const push = id === 10 ? q(0.5 + 0.5 * Math.sin(2 * Math.PI * ((t - 47.1) / 1.6)), 40) : 0.35;
  const view = viewOf(cam, BUCKET_POS[0] - 2.5, BUCKET_POS[2] - 2, 0, 1);
  const so: SideOpts = { mode: "push", pose: push, expr: id === 10 ? "grin" : "smile", blink: lidAt(t, 440) };
  out.places.push({ ...person(cam, { i: 440, o: PARENT, okey: "par" }, BUCKET_POS[0] - 2.5, 0, BUCKET_POS[2] - 2, view, {}, so), mirror: false, yaw: Math.PI });
  blob(out, BUCKET_POS[0] - 2.5, 0, BUCKET_POS[2] - 2, 0.9);
  const fo: FrontOpts = { mode: "stand", expr: "grin", blink: lidAt(t, 441), look: -1, headTilt: 8 };
  out.places.push(person(cam, { i: 441, o: KID, okey: "kid" }, BUCKET_POS[0] + 2, 0, BUCKET_POS[2] - 1.5, { side: false, mirror: false }, fo, {}, 0.72));
  blob(out, BUCKET_POS[0] + 2, 0, BUCKET_POS[2] - 1.5, 0.72);
  // drips falling out of the bucket holes: small blue rings spreading on the ground
  for (let i = 0; i < 3; i++) {
    const u = ((t * 0.8 + i * 0.33) % 1);
    out.fx.push({ key: `drip${i}${q(u, 20)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, q(u, 20)), x: BUCKET_POS[0] + (i - 1) * 0.9, y: 0.03, z: BUCKET_POS[2] + 1.2, w: 1.4, h: 1.4, flat: true });
  }
};

/** self-reliance (crowd "self", shot 11, golden): villagers walking home, fixing things themselves */
const selfCrowd = (t: number, cam: CamInfo, out: Stage) => {
  for (let i = 0; i < 6; i++) {
    const z = 4 + (i % 3) * 5;
    const x = -12 + (((t * 1.0 + i * 5.3) % 24) + 24) % 24;
    const who: Who = { i: i + 450, o: VILLAGERS[vOf(i)], okey: `j${vOf(i)}` };
    const view = viewOf(cam, x, z, 1, 0);
    const so: SideOpts = { mode: "march", phase: (t * 0.9 + i * 0.13) % 1, expr: "smile", blink: lidAt(t, i + 450) };
    const fo: FrontOpts = { mode: "stroll", phase: (t * 0.9 + i * 0.13) % 1, expr: "smile", blink: lidAt(t, i + 450) };
    out.places.push(person(cam, who, x, D0, z, view, fo, so));
    blob(out, x, D0, z, 1, 0.9);
  }
  // one worker hammering a fence post (standing, looking down at his work)
  const who: Who = { i: 460, o: WORKERS[1], okey: "w1" };
  out.places.push(person(cam, who, -6, D0, 10, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 460), headTilt: 12 }, {}));
  blob(out, -6, D0, 10);
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
export const stage = (id: number, t: number, b: TownState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "town": townCrowd(t, cam, out); break;
    case "stage": stageCrowd(id, t, cam, out); break;
    case "project": projectCrowd(t, cam, out); break;
    case "leak": leakCrowd(t, cam, out); break;
    case "queue": queueCrowd(t, b, cam, out); break;
    case "snap": snapCrowd(t, b, cam, out); break;
    case "deadpan": deadpanCrowd(t, cam, out); break;
    case "bucket": bucketCrowd(id, t, cam, out); break;
    case "self": selfCrowd(t, cam, out); break;
    case "final": stageCrowd(id, t, cam, out); break;
    default: break;
  }
  if (s.towns) distantTown(t, cam, out);
  return out;
};

export { FPS };
