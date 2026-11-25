// Our cast as lit flat sprites in the 3D world — BAJAK JAWA. Each frame every character asks for a drawing
// (a key + a draw call); the pool keeps one canvas per distinct drawing, so rowers in step share canvases.
// Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones on land get a soft multiply contact blob.
// Effects are unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never
// outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, PIRATE, SAILOR, VILLAGER_JAVA, KID, SKINS, fxBurst, fxSplash, fxCreak, fxRing,
  fxShadow, fxContact, fxPlank, fxDrum,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS, SNAP, V3, LANONG_DECK, VOC_DECK, VOC_POS, POND, rowPhase, lanongZ, slack, SeaState,
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
const PIRATES = [0, 1, 2, 3].map((v) => ({ ...PIRATE, skin: SKINS[v % 4] }));
const SAILORS = [0, 1, 2, 3].map((v) => ({ ...SAILOR, skin: SKINS[v % 4] }));
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
const SWAPS: Record<number, number[]> = { 8: [SNAP] };
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

/** rowers on the lanong deck (crowd "row", shots 1, 3, 4, 7): 3 files x 8 rows, seated, leaning into the
 *  stroke in sync with rowPhase(tau); the hull rides the surge. Shot 4 adds the drummer at the bow. */
const rowers = (id: number, t: number, tau: number, b: SeaState, cam: CamInfo, out: Stage) => {
  const Z = lanongZ(tau), ph = rowPhase(tau), stroke = Math.sin(2 * Math.PI * ph);
  const amp = id === 7 ? 14 : 10; // shot 7: rowing faster and harder as the lanong closes
  for (let r = 0; r < 8; r++) for (let f = 0; f < 3; f++) {
    const i = r * 3 + f, x = (f - 1) * 1.7 + (hh(i) - 0.5) * 0.15, z = Z - 6 + r * 1.7;
    const y = LANONG_DECK + 0.12 * b.surge * Math.sin(2 * Math.PI * ph + r * 0.4);
    const who: Who = { i, o: PIRATES[vOf(i)], okey: `p${vOf(i)}` };
    const expr: Expr = id === 4 ? (i % 3 === 0 ? "grin" : "stern") : i % 3 === 0 ? "grin" : "stern";
    const fo: FrontOpts = { mode: "sit", expr, blink: lidAt(t, i, SWAPS[id]), tilt: q(amp * stroke, 30), look: 0 };
    out.places.push(person(cam, who, x, y, z, { side: false, mirror: false }, fo, {}));
  }
  if (id === 4) {
    // the drummer stands at the bow, beating on the rowing phase; the drum is an unlit Fx card (fxDrum)
    const dz = Z + 6.5, beat = Math.max(0, Math.sin(2 * Math.PI * ph)), k = 1 + 0.14 * beat;
    const who: Who = { i: 40, o: PIRATES[1], okey: "p1" };
    const fo: FrontOpts = { mode: "stand", expr: "grin", blink: lidAt(t, 40), tilt: q(6 * beat, 30) };
    out.places.push(person(cam, who, 0, LANONG_DECK, dz, { side: false, mirror: false }, fo, {}));
    out.fx.push({ key: `drum${q(k, 30)}`, cw: 260, ch: 240, draw: (p) => fxDrum(p), x: 0, y: LANONG_DECK + 0.95, z: dz + 0.9, w: 0.85 * k, h: 0.78 * k });
  }
};

/** VOC sailors on the VOC deck (crowd "voc", shots 2, 5, 6). Shot 5: the captain laughs. Shot 6: the
 *  sails go slack and the sailors look up, nervous. */
const vocSailors = (id: number, t: number, tau: number, cam: CamInfo, out: Stage) => {
  const XS = [-2.2, -1.3, -0.4, 0.5, 1.4, 2.3];
  const sl = slack(tau);
  XS.forEach((x, i) => {
    const captain = i === 0;
    const who: Who = { i: i + 60, o: SAILORS[vOf(i)], okey: `v${vOf(i)}` };
    let expr: Expr = "neutral", headTilt = 0;
    if (id === 5) expr = captain ? "laugh" : i % 2 ? "grin" : "smile";
    else if (id === 6) { expr = sl > 0.3 ? "nervous" : "neutral"; headTilt = sl > 0.3 ? -7 : 0; }
    else expr = i % 2 ? "neutral" : "stern";
    const z = VOC_POS[2] + (captain ? -0.8 : (i % 2 ? 0.8 : -0.8));
    const view = viewOf(cam, x, z, 0, -1);
    const fo: FrontOpts = { mode: "stand", expr, blink: lidAt(t, i + 60, SWAPS[id]), look: 0, headTilt };
    const so: SideOpts = { mode: "stand", expr, blink: lidAt(t, i + 60, SWAPS[id]) };
    out.places.push(person(cam, who, captain ? 0 : x, VOC_DECK, z, view, fo, so));
  });
};

/** the ram (crowd "ram", shot 8): rowers brace for impact, then are thrown back; sailors go shocked.
 *  The burst + splash themselves are snapFx/splashFx, called by world.ts — stage only places characters. */
const ramCrowd = (id: number, t: number, tau: number, b: SeaState, cam: CamInfo, out: Stage) => {
  const Z = lanongZ(tau), hit = tau >= SNAP - LEAD;
  for (let r = 0; r < 4; r++) for (let f = 0; f < 3; f++) {
    const i = r * 3 + f, x = (f - 1) * 1.7, z = Z - 1 + r * 1.7;
    const who: Who = { i, o: PIRATES[vOf(i)], okey: `p${vOf(i)}` };
    const expr: Expr = hit ? "shock" : "stern";
    const fo: FrontOpts = { mode: "sit", expr, blink: lidAt(t, i, SWAPS[id]), tilt: hit ? 12 : -8, look: 0 };
    out.places.push(person(cam, who, x, LANONG_DECK, z, { side: false, mirror: false }, fo, {}));
  }
  const XS = [-2.2, -0.4, 1.4, 2.3];
  XS.forEach((x, i) => {
    const who: Who = { i: i + 60, o: SAILORS[vOf(i)], okey: `v${vOf(i)}` };
    const expr: Expr = b.rammed || hit ? "shock" : "nervous";
    const fo: FrontOpts = { mode: "stand", expr, blink: lidAt(t, i + 60, SWAPS[id]), look: -1, tilt: hit ? 8 : 0 };
    out.places.push(person(cam, who, x, VOC_DECK, VOC_POS[2] + (i % 2 ? 0.8 : -0.8), { side: false, mirror: false }, fo, {}));
  });
};

/** seated figures, front view (sailors sitting in the water, shot 9) */
const sitters = (cam: CamInfo, t: number, out: Stage, spots: [number, number, number][], exprs: (i: number) => Expr, stars: (i: number) => boolean, water: boolean) => {
  spots.forEach(([x, y, z], i) => {
    const bare = i % 3 === 1;
    const v = vOf(i + 3);
    const o: Outfit = bare ? { ...SAILORS[v], jacket: "#c99067", hat: null, buttons: "#c99067" } : SAILORS[v];
    const who: Who = { i, o, okey: `${bare ? "b" : "v"}${v}` };
    const expr = exprs(i), bob = water ? 0.03 * Math.sin(t * 2.2 + i) : 0;
    out.places.push(person(cam, who, x, y + bob, z, { side: false, mirror: false }, { mode: "sit", expr, blink: lidAt(t, i), look: 0 }, {}));
    if (stars(i)) {
      const u = (t * 0.9 + hh(i)) % 1;
      out.fx.push({ key: `stars${q(u, 30)}`, cw: 420, ch: 210, draw: (p) => fxStars(p, q(u, 30)), x, y: y + bob + 1.3, z, w: 0.75, h: 0.375 });
    }
    if (water) {
      const u = ((t + hh(i, 7) * 2) % 2.2) / 2.2;
      out.fx.push({ key: `ring${q(u, 30)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, q(u, 30)), x, y: 0.03, z, w: 2.0, h: 2.0, flat: true });
      // darker water right where the body meets the surface (only the front arc shows below the card)
      out.fx.push({ key: `blob|contact|${WATERLINE}`, cw: 128, ch: 128, draw: (p) => fxContact(p, WATERLINE), x, y: 0.034 + bob * 0.3, z, w: 0.7, h: 0.5, flat: true });
      if (bare) out.fx.push({ key: "tricorn", cw: 200, ch: 200, draw: tricornAlone, x: x + 0.55 + 0.3 * hh(i, 8), y: 0.12 + 0.03 * Math.sin(t * 2 + i), z: z - 0.3, w: 0.42, h: 0.42, rot: -0.5 + hh(i, 6) });
    } else {
      blob(out, x, y, z, 1.05, 0.8);
    }
  });
};
const WATERLINE = hexOf([0.3, 0.36, 0.52], 1);
/** a lone tricorn hat floating on the water, on a 200 x 200 canvas */
const tricornAlone = (p: Pen) => {
  p.poly([[40, 130], [52, 70], [148, 70], [160, 130]], "#232838", 8);
  p.ell(100, 130, 66, 14, "#232838", 7, 0, 180);
  p.arc(100, 130, 66, 14, 200, 340, 3, "#e8c45a");
  p.dot(100, 96, 5, "#e8c45a");
};
/** circling stars on a 420 x 210 canvas (kept for sitters' star bursts) */
const fxStars = (p: Pen, t: number) => {
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + (i * Math.PI) / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts: [number, number][] = [];
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 14 : 34, b = (k * 36 - 90) * Math.PI / 180; pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]); }
    p.poly(pts, "#ffd84a", 6);
  }
};
/** flotsam in the water after the ram (shot 9): a plank and a floating tricorn, bobbing with rings.
 *  In open water east of the VOC, with the sitters — the first positions sat under the lanong's hull. */
const FLOAT: { kind: "plank" | "tricorn"; x: number; z: number; s: number; r: number }[] = [
  { kind: "plank", x: 5.5, z: 16, s: 1.1, r: 0.3 },
  { kind: "tricorn", x: 7.5, z: 20, s: 0.46, r: -0.5 },
];
const flotsam = (t: number, out: Stage) =>
  FLOAT.forEach((f, i) => {
    const bob = 0.03 * Math.sin(t * 1.9 + i * 1.7), r = f.r + 0.08 * Math.sin(t * 1.3 + i);
    const [cw, ch, draw, ar] = f.kind === "plank" ? [320, 110, fxPlank, 110 / 320] as const : [200, 200, tricornAlone, 1] as const;
    const w = f.s, h = f.s * ar;
    out.fx.push({ key: f.kind, cw, ch, draw, x: f.x, y: 0.28 * h + bob, z: f.z, w, h, rot: r });
    out.fx.push({ key: `ring${q(((t * 0.45 + i * 0.3) % 1), 30)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, q(((t * 0.45 + i * 0.3) % 1), 30)), x: f.x, y: 0.03, z: f.z, w: 1.1 * f.s + 0.5, h: 1.1 * f.s + 0.5, flat: true });
  });

/** the pond analogy (crowd "pond", shots 10-11): one kid kneels at the pond edge pushing the toy
 *  rowboat, a second kid watches. The toy boats themselves are world.ts geometry.
 *  Both kids stand OUTSIDE the pond disc (radius 6 + rim) — the first version put them at
 *  radius ~3-5, so they stood in the water. */
const pondKids = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const push = id === 11 ? q(0.5 + 0.5 * Math.sin(2 * Math.PI * ((t - 47.1) / 1.6)), 40) : 0.35;
  const view = viewOf(cam, POND[0] - 2.5, POND[2] - 7.6, 0, 1);
  const so: SideOpts = { mode: "push", pose: push, expr: id === 11 ? "grin" : "smile", blink: lidAt(t, 80) };
  out.places.push({ ...person(cam, { i: 80, o: KID, okey: "kid" }, POND[0] - 2.5, 0, POND[2] - 7.6, view, {}, so), mirror: false, yaw: Math.PI });
  blob(out, POND[0] - 2.5, 0, POND[2] - 7.6, 0.72);
  const fo: FrontOpts = { mode: "stand", expr: "smile", blink: lidAt(t, 81), look: -1 };
  out.places.push(person(cam, { i: 81, o: KID, okey: "kid" }, POND[0] + 1, 0, POND[2] - 7, { side: false, mirror: false }, fo, {}, 0.72));
  blob(out, POND[0] + 1, 0, POND[2] - 7, 0.72);
};

/** the fort (crowd "fort", shot 12): villagers on the coast watching the lanong sail into the
 *  sunset, plus two rowers still visible on the distant lanong. The villagers stand on the sand
 *  (z=-63, beach strip z -70..-60) FLANKING the fort (x ±18-22) — the first version put them at
 *  z=-46.5 (out at sea), then at x ±1-3 behind the fort's front wall, which hides them from the sea. */
const fortCrowd = (id: number, t: number, tau: number, cam: CamInfo, out: Stage) => {
  // round 5: the fort moved to x=28 (spanning 13..43), so the crowd flanks it outside its
  // footprint — the old XS [±18,±22] would stand inside the fort's courtyard, hidden by its front wall
  const XS = [-8, 8, 48, 52];
  XS.forEach((x, i) => {
    const who: Who = { i: i + 120, o: VILLAGERS[vOf(i)], okey: `j${vOf(i)}` };
    const expr: Expr = i % 2 ? "smile" : "neutral";
    const fo: FrontOpts = { mode: "stand", expr, blink: lidAt(t, i + 120), look: 0 };
    out.places.push(person(cam, who, x, D0, -63, { side: false, mirror: false }, fo, {}));
    blob(out, x, D0, -63);
  });
  const Z = lanongZ(tau);
  for (const [i, x] of [[0, -0.8], [1, 0.8]] as const) {
    const who: Who = { i: i + 140, o: PIRATES[vOf(i)], okey: `p${vOf(i)}` };
    const fo: FrontOpts = { mode: "sit", expr: "grin", blink: lidAt(t, i + 140), tilt: q(8 * Math.sin(2 * Math.PI * rowPhase(tau)), 30) };
    out.places.push(person(cam, who, x, LANONG_DECK, Z, { side: false, mirror: false }, fo, {}));
  }
};

/** distant coastal town figures (shot 2, towns flag): a few villagers on the sand in front of
 *  the houses — the first version put them at z=-48, standing on the sea. */
const distantTown = (t: number, cam: CamInfo, out: Stage) => {
  for (let i = 0; i < 6; i++) {
    const x = -12 + i * 4.8 + (hh(i, 5) - 0.5) * 1.5, z = -66 - (hh(i, 6) - 0.5) * 3;
    const who: Who = { i: i + 120, o: VILLAGERS[vOf(i)], okey: `j${vOf(i)}` };
    const fo: FrontOpts = { mode: "stand", expr: "neutral", blink: lidAt(t, i + 120) };
    out.places.push(person(cam, who, x, D0, z, { side: false, mirror: false }, fo, {}));
  }
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, b: SeaState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "row": rowers(id, t, tau, b, cam, out); break;
    case "voc": vocSailors(id, t, tau, cam, out); break;
    case "ram": ramCrowd(id, t, tau, b, cam, out); break;
    case "water": {
      const spots: [number, number, number][] = [];
      // open water east of the VOC (x 4.2-9), clear of both hulls — the first spots sat under the lanong
      for (let i = 0; i < 8; i++) spots.push([4.2 + (i % 4) * 1.6 + (hh(i, 11) - 0.5) * 0.5, -0.6, 14.5 + (i >> 2) * 3.4 + (hh(i, 12) - 0.5) * 0.8]);
      const ex: Expr[] = ["dazed", "relief", "smile", "relief_open"];
      sitters(cam, t, out, spots, (i) => ex[i % 4], () => false, true);
      flotsam(t, out);
      break;
    }
    case "pond": pondKids(id, t, cam, out); break;
    case "fort": fortCrowd(id, t, tau, cam, out); break;
    default: break;
  }
  if (s.towns && id === 2) distantTown(t, cam, out);
  return out;
};

// ---------------- one-off effects ----------------
/** ram burst at the VOC mast (world.ts calls this from shot 8) */
export const snapFx = (tau: number, at: V3, out: Stage) => {
  if (tau >= SNAP && tau < SNAP + 0.45) {
    const u = (tau - SNAP) / 0.45;
    out.fx.push({ key: `bigburst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x: at[0], y: at[1] + 0.12, z: at[2] - 0.15, w: 1.5, h: 1.5 });
  }
};
/** big splash at the ram point, between the lanong bow and the VOC hull */
export const splashFx = (tau: number, out: Stage) => {
  const u = (tau - SNAP) / 1.1;
  if (u < 0 || u >= 1) return;
  for (const [x, z, s] of [[0, 12, 1.3], [-2.2, 14, 0.9], [2.2, 10.5, 0.85]] as const)
    out.fx.push({ key: `splash${q(u, 30)}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, q(u, 30)), x, y: 2.6 * s, z, w: 7 * s, h: 7 * s }); // base of the drawing on the water line
};
/** wood creaks on the lanong (world.ts calls this before the ram) */
export const creakFx = (t: number, pts: V3[], out: Stage, size = 0.8) =>
  pts.forEach(([x, y, z], i) => {
    const u = q((t * 1.3 + i * 0.37) % 1, 30);
    out.fx.push({ key: `creak${u}`, cw: 300, ch: 300, draw: (p) => fxCreak(p, u), x, y, z, w: size, h: size, rot: i * 0.6 - 0.6 });
  });
export { FPS };
