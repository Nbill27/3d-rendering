// Our cast as lit flat sprites in the 3D world — VIDEO04 (Emu War).
// Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas per distinct
// drawing, so emus in step share canvases.
// Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones on land get a soft multiply contact blob.
// Effects are unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never
// outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, MEREDITH, SOLDIER, FARMER, SKINS,
  fxShadow, fxContact, fxEmu, fxLewis, fxTruck, fxPuff, fxBurst,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS, HOLE_POS, ROAD_X,
  flockZ, scatterZ, truckZ, retreatZ, StoryState,
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

// ---------------- emus, guns, truck (effect cards) ----------------
/** one emu as an unlit card. Feet sit on the ground: the 600x400 drawing has its feet at canvas y 390,
 *  so the card centre sits 0.475 * h above the ground. Phase is quantized to 8 steps so running emus
 *  in step share canvases. flip = the bird faces screen-left (southbound from the east-side cameras).
 *  pose follows the anatomy figure (emu.html Fig 1): "run" (neck up, 3-segment legs cycling),
 *  "peck" (neck down to the wheat, S3), "drink" (neck down to the water, S7), "stand" (S2/S10). */
type EmuPose = "run" | "peck" | "drink" | "stand";
const emu = (out: Stage, x: number, z: number, phase: number, flip: boolean, scale = 1, pose: EmuPose = "run") => {
  const qp = Math.round((((phase % 1) + 1) % 1) * 8) / 8;
  const h = 1.9 * scale, w = 2.85 * scale;
  out.fx.push({ key: `emu|${flip ? "L" : "R"}|${qp}|${pose}`, cw: 600, ch: 400, draw: (p) => fxEmu(p, qp, flip, pose),
    x, y: 0.475 * h, z, w, h });
  blob(out, x, 0, z, scale, 0.9);
};
/** a loose flock of n emus around (cx, cz); rate = leg cycles per second, flip = facing screen-left */
const flock = (out: Stage, t: number, cx: number, cz: number, n: number, spread: number, rate: number, flip: boolean, sc = 1, seed = 0, pose: EmuPose = "run") => {
  for (let i = 0; i < n; i++) {
    const ox = (hh(i + seed, 11) - 0.5) * spread, oz = (hh(i + seed, 23) - 0.5) * spread * 0.7;
    const ph = (t * rate + i * 0.13 + seed * 0.31) % 1;
    emu(out, cx + ox, cz + oz, ph, flip, sc * (0.85 + 0.3 * hh(i + seed, 37)), pose);
  }
};
/** a Lewis gun on its tripod, unlit card, ~1.6 m wide (sc scales it up for readability).
 *  jammed = the S7 jam: bolt locked, brass case stuck in the ejection port, drum tilted (lewis.html Fig 2).
 *  fire = shot-cycle phase 0..1 while firing (S7 f1000-1079), -1 = not firing; quantized to 8 steps
 *  in the key so firing guns share canvases like emus in step. */
const lewis = (out: Stage, x: number, z: number, flip = false, sc = 1, jammed = false, fire = -1) => {
  const qf = fire < 0 ? -1 : Math.round((((fire % 1) + 1) % 1) * 8) / 8;
  const h = 1.07 * sc, w = 1.6 * sc;
  out.fx.push({ key: `lewis|${flip ? "L" : "R"}|${sc}|${jammed ? "jam" : "ok"}|${qf}`, cw: 600, ch: 400, draw: (p) => fxLewis(p, jammed, qf),
    x, y: 0.47 * h, z, w, h });
  blob(out, x, 0, z, 0.9 * sc, 0.9);
};
/** the flatbed truck with its mounted gun, moving south; flip = facing screen-left.
 *  Suspension bounce from the anatomy figure (truck.html Fig 3): the body
 *  rides ±5 cm on the leaf springs at ~1.5 Hz on rough ground, so the gun
 *  in the bed shakes with it. */
const truck = (out: Stage, t: number, z: number, flip = true) => {
  const qp = Math.round((((t * 0.9) % 1) + 1) % 1 * 8) / 8;
  out.fx.push({ key: `truck|${flip ? "L" : "R"}|${qp}`, cw: 600, ch: 400, draw: (p) => fxTruck(p, qp, flip),
    x: ROAD_X, y: 1.1 + 0.05 * Math.sin(t * 9), z, w: 3.6, h: 2.4 });
  blob(out, ROAD_X, 0, z, 1.6, 0.9);
};

// ---------------- crowd by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

const FARMERS = [0, 1, 2].map((v) => ({ ...FARMER, skin: SKINS[v % 4] }));
const farmer = (i: number): Who => ({ i: i + 400, o: FARMERS[i % 3], okey: `f${i % 3}` });

/** the hook (crowd "field", shot 1): the emu flock marches south into the wheat;
 *  two farmers watch from the farmhouse edge */
const fieldCrowd = (t: number, cam: CamInfo, out: Stage) => {
  flock(out, t, 0, flockZ(t), 20, 18, 0.5, true, 1, 1, "run");
  // three emus already through the fence, heads down in the wheat
  emu(out, -3, -11.5, (t * 0.2 + 0.1) % 1, true, 1.05, "peck");
  emu(out, 1, -12, (t * 0.2 + 0.5) % 1, false, 1, "peck");
  emu(out, 4.5, -11, (t * 0.2 + 0.8) % 1, true, 0.95, "peck");
  for (let i = 0; i < 3; i++) {
    const x = i === 2 ? 4.8 : 6.5 + i * 2, z = i === 2 ? -12 : -13 - i * 1.5;
    out.places.push(person(cam, farmer(i), x, D0, z, { side: false, mirror: false },
      { mode: "stand", expr: i === 2 ? "nervous" : i ? "shock" : "neutral", blink: lidAt(t, i + 400), look: 0 }, {}));
    blob(out, x, D0, z);
  }
};

/** the settlers (crowd "farm", shot 2): farmers with the harvest in front of the farmhouse.
 *  Tahap 6: the old row (x 19.5-30.5, z -15.5) was invisible — the two middle farmers
 *  stood INSIDE the house footprint (x 19.4-28.6, z -22.1..-13.9) and the outer two
 *  fell outside the narrow S2b/S4b portrait frustums. The farmers now stand in a
 *  tight 2x2 cluster against the south wall (z -13.2..-13.6, 0.3-0.7 m clear of it),
 *  the only ground the S2b/S4b cameras see: verified on-axis in S2a/S2b/S4a/S4b.
 *  Tahap 6 (revisi): 2x2 ternyata menumpuk — baris belakang (0,4 m lebih dalam,
 *  geser x cuma 0,3 m) tersembunyi di balik baris depan dan hanya topinya yang
 *  mengintip, jadi terbaca seperti petani bertopi ganda. Sekarang 3 petani: dua
 *  di depan, satu di tengah-belakang (0,5 m lebih dalam, 0,4 m di antara keduanya)
 *  sehingga kepalanya muncul di antara dan di atas kepala baris depan. */
const farmCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const SPOTS: [number, number][] = [[26.5, -13.2], [27.3, -13.2], [26.9, -13.7]];
  SPOTS.forEach(([x, z], i) => {
    const expr: Expr = i === 1 ? "grin" : i === 2 ? "neutral" : "smile";
    out.places.push(person(cam, farmer(i), x, D0, z, { side: false, mirror: false },
      { mode: "stand", expr, blink: lidAt(t, i + 410), wave: i === 1 ? 0.5 + 0.3 * Math.sin(t * 2.2) : undefined, look: 0 }, {}));
    blob(out, x, D0, z);
  });
  // the first emus already at the far edge of the field
  flock(out, t, -6, -26, 6, 8, 0.3, true, 0.9, 7, "stand");
};

/** the raid (crowd "raid", shot 3): emus eating and trampling the wheat at the smashed fence */
const raidCrowd = (t: number, cam: CamInfo, out: Stage) => {
  flock(out, t, 0, -12, 14, 9, 0.4, true, 1, 3, "peck");
  // emus right at the broken fence, heads down in the wheat
  emu(out, -2.5, -10.5, (t * 0.4 + 0.2) % 1, true, 1.05, "peck");
  emu(out, 3, -12.5, (t * 0.4 + 0.6) % 1, false, 1, "peck");
  emu(out, 0, -10.5, (t * 0.4 + 0.9) % 1, true, 1, "peck");
  emu(out, -5, -11, (t * 0.4 + 0.4) % 1, false, 0.95, "peck");
};

/** the call for help (crowd "call", shot 4): farmers at the farmhouse, one waving down the road, worried.
 *  Tahap 6: same fix as farmCrowd — the old row (x 20-30.5, z -15.5) put two farmers
 *  inside the house and the other two outside the S4b frustum, so f550 showed a bare
 *  wall with no farmers at all. Same 2x2 cluster against the south wall.
 *  Tahap 6 (revisi): sama seperti farmCrowd — 2x2 menumpuk jadi topi ganda,
 *  jadi 3 petani (dua depan, satu tengah-belakang). */
const callCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const SPOTS: [number, number][] = [[26.5, -13.2], [27.3, -13.2], [26.9, -13.7]];
  SPOTS.forEach(([x, z], i) => {
    const expr: Expr = i === 1 ? "shock" : "nervous";
    out.places.push(person(cam, farmer(i + 10), x, D0, z, { side: false, mirror: false },
      { mode: "stand", expr, blink: lidAt(t, i + 420), wave: i === 1 ? 0.6 + 0.2 * Math.sin(t * 3) : undefined, look: 0 }, {}));
    blob(out, x, D0, z);
  });
  // the emus keep coming in the far field behind them
  flock(out, t, -8, -28, 5, 8, 0.3, true, 0.9, 13, "stand");
};

/** the army arrives (crowd "arrive", shot 5): Meredith with two soldiers and the two Lewis guns;
 *  the flock waits in the distance */
const arriveCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const mer: Who = { i: 440, o: MEREDITH, okey: "mer" };
  out.places.push(person(cam, mer, 0, D0, 7.5, { side: false, mirror: false },
    { mode: "stand", expr: "stern", blink: lidAt(t, 440), look: 0 }, {}));
  blob(out, 0, D0, 7.5);
  for (const [i, x] of [[0, -3.2], [1, 3.2]] as const) {
    const w2: Who = { i: i + 450, o: { ...SOLDIER, skin: SKINS[(i + 1) % 4] }, okey: "sol" };
    out.places.push(person(cam, w2, x, D0, 7.5, { side: false, mirror: false },
      { mode: "stand", expr: "neutral", blink: lidAt(t, i + 450), look: 0 }, {}));
    blob(out, x, D0, 7.5);
    // the guns stand in front of the soldiers, flanking Meredith, so they read as machine guns
    lewis(out, x * 0.6, 9.5, i === 0, 1.25);
  }
  flock(out, t, 0, -16, 10, 12, 0.3, true, 0.95, 9, "stand");
};

/** the scatter (crowd "scatter", shot 6): emus running in all directions, soldiers firing */
const scatterCrowd = (t: number, cam: CamInfo, out: Stage) => {
  flock(out, t, 0, scatterZ(t), 20, 18, 1.4, true, 1, 5, "run");
  // a few emus break the other way, toward the camera
  flock(out, t, -6, scatterZ(t) + 6, 5, 5, 1.4, false, 0.95, 21, "run");
  // dust kicked up by the running flock
  for (let k = 0; k < 3; k++) {
    const pt = (t * 1.2 + k * 0.33) % 1;
    const px = [-4, 3, 7][k], pz = scatterZ(t) + [2, -3, 4][k];
    out.fx.push({ key: `puff|${Math.round(pt * 8) / 8}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, pt),
      x: px, y: 0.5, z: pz, w: 1.4, h: 1.4, soft: true });
  }
  for (const [i, x] of [[0, -3.2], [1, 3.2]] as const) {
    const w2: Who = { i: i + 460, o: { ...SOLDIER, skin: SKINS[(i + 2) % 4] }, okey: "sol" };
    out.places.push(person(cam, w2, x, D0, 9, { side: false, mirror: false },
      { mode: "stand", expr: "stern", blink: lidAt(t, i + 460), look: 0 }, {}));
    blob(out, x, D0, 9);
    lewis(out, x * 0.6, 10.5, i === 0, 1.25);
  }
  // muzzle flash on the left gun, cycling twice a second
  const bt = (t * 2) % 1;
  out.fx.push({ key: `burst|${Math.round(bt * 8) / 8}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, bt),
    x: -1.9, y: 1.1, z: 10.3, w: 1.1, h: 1.1 });
  const mer: Who = { i: 470, o: MEREDITH, okey: "mer" };
  out.places.push(person(cam, mer, 0, D0, 11, { side: false, mirror: false },
    { mode: "stand", expr: "shock", blink: lidAt(t, 470), look: 0 }, {}));
  blob(out, 0, D0, 11);
};

/** the waterhole ambush (crowd "waterhole", shot 7): a dense flock at the water; the gun jams at t = 36 s
 *  and the emus flee */
const waterholeCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const jammed = t >= 36;
  const cx = HOLE_POS[0], cz = HOLE_POS[2];
  // the flock at the water, drinking and milling: a ring around the water's edge, never in the water itself;
  // the east sector stays clear for the gun and the two men, so no bird stands on top of them
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + 0.3;
    if (a < 0.96) continue; // east sector: the ambush party's ground
    const r = 5.5 + hh(i, 41) * 4;
    const x = cx + r * Math.cos(a), z = cz + r * Math.sin(a) * 0.8;
    emu(out, x, z, (t * (jammed ? 1.4 : 0.25) + i * 0.13) % 1, i % 3 !== 0, 0.85 + 0.3 * hh(i, 43), jammed ? "run" : "drink");
  }
  // after the jam the near emus break away south, away from the gun
  if (jammed) flock(out, t, cx + 4, cz + 8, 6, 5, 1.4, true, 1, 31);
  const sol: Who = { i: 480, o: { ...SOLDIER, skin: SKINS[1] }, okey: "sol" };
  out.places.push(person(cam, sol, -8, D0, 22.5, { side: false, mirror: false },
    { mode: "stand", expr: jammed ? "shock" : "stern", blink: lidAt(t, 480, [36]), look: 0 }, {}));
  blob(out, -8, D0, 22.5);
  // firing f1000-1079 (t 33.33-36): 2 flashes/s, then the jam locks at t = 36 (koreografi-s7.md)
  const firing = t >= 1000 / 30 && t < 36;
  lewis(out, -10.5, 23.5, false, 1.25, jammed, firing ? ((t - 1000 / 30) * 2) % 1 : -1);
  if (t >= 36 && t < 36.5) {
    // the jam impact: a yellow burst at the ejection port for 15 frames, with the camera kick (story.ts)
    const bt = (t - 36) / 0.5;
    out.fx.push({ key: `burst|${Math.round(bt * 8) / 8}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, bt),
      x: -10.9, y: 0.7, z: 23.3, w: 0.7, h: 0.7 });
  }
  if (jammed) {
    // smoke from the jammed gun, looping for the WHOLE jam (Tahap 2 had one puff that died after 1.5 s):
    // three small puffs staggered by 0.5 s on a 1.5 s loop, hugging the gun so they read as
    // smoke from the receiver, not clouds over the water
    for (let k = 0; k < 3; k++) {
      const pt = (((t - 36) + k * 0.5) % 1.5) / 1.5;
      out.fx.push({ key: `puff|${Math.round(pt * 8) / 8}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, pt),
        x: -10.5, y: 1.35 + k * 0.4, z: 23.3, w: 0.9 + k * 0.2, h: 0.9 + k * 0.2, soft: true });
    }
  }
  const mer: Who = { i: 481, o: MEREDITH, okey: "mer" };
  out.places.push(person(cam, mer, -5, D0, 24.5, { side: false, mirror: false },
    { mode: "stand", expr: jammed ? "dazed" : "neutral", blink: lidAt(t, 481, [36]), look: 0 }, {}));
  blob(out, -5, D0, 24.5);
};

/** the truck chase (crowd "truck", shot 8): the gun mounted on the truck, chasing the emus south */
const truckCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const z = truckZ(t);
  truck(out, t, z);
  // the emus ahead of the truck, outrunning it
  flock(out, t, 0, z + 8, 10, 10, 1.6, true, 1, 17, "run");
  // dust behind the truck
  for (let k = 0; k < 2; k++) {
    const pt = (t * 1.5 + k * 0.5) % 1;
    out.fx.push({ key: `puff|${Math.round(pt * 8) / 8}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, pt),
      x: k ? -1.5 : 0.5, y: 0.4, z: z - 2 - k * 1.5, w: 1.6, h: 1.6, soft: true });
  }
};

/** the retreat (crowd "retreat", shot 9): the soldiers walk north away from the field,
 *  while the emus stand in the field watching them go.
 *  Tahap 6: the old flanks (±1.8 m, both 1.5 m north) stacked exactly behind Meredith
 *  from the S9 road-axis cameras — one soldier projected ~0 m off-axis (two heads on
 *  one body at f1400) and the other ~2.3 m off-axis (out of the narrow portrait frame).
 *  The new offsets put both soldiers ~±1.45 m off-axis in S9a and S9b (verified
 *  numerically), so all three walkers read separately. The watching flock moved from
 *  (-2,-14) — ~37° off-axis, never in frame — to the west field (-19,-16), ~6° off-axis. */
const retreatCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const z = retreatZ(t);
  // the emus stay, watching from the field and the fence
  flock(out, t, -19, -16, 6, 10, 0.15, true, 1, 27, "stand");
  emu(out, -16, -15.5, 0.2, true, 1, "stand");
  emu(out, -22, -17.5, 0.6, false, 1, "stand");
  const mer: Who = { i: 500, o: MEREDITH, okey: "mer" };
  const view = viewOf(cam, ROAD_X, z, 0, -1);
  const so: SideOpts = { mode: "march", phase: (t * 0.9) % 1, expr: "neutral", blink: lidAt(t, 500) };
  const fo: FrontOpts = { mode: "stroll", phase: (t * 0.9) % 1, expr: "neutral", blink: lidAt(t, 500) };
  out.places.push(person(cam, mer, ROAD_X, D0, z, view, fo, so));
  blob(out, ROAD_X, D0, z);
  for (const [i, dx, dz] of [[0, -1.6, 0.5], [1, 0.4, -1.6]] as const) {
    const w2: Who = { i: i + 510, o: { ...SOLDIER, skin: SKINS[(i + 3) % 4] }, okey: "sol" };
    const v2 = viewOf(cam, ROAD_X + dx, z + dz, 0, -1);
    const so2: SideOpts = { mode: "march", phase: (t * 0.9 + i * 0.3) % 1, expr: "neutral", blink: lidAt(t, i + 510) };
    const fo2: FrontOpts = { mode: "stroll", phase: (t * 0.9 + i * 0.3) % 1, expr: "neutral", blink: lidAt(t, i + 510) };
    out.places.push(person(cam, w2, ROAD_X + dx, D0, z + dz, v2, fo2, so2));
    blob(out, ROAD_X + dx, D0, z + dz);
  }
};

/** the sunset (crowd "sunset", shot 10, golden): emus standing in the golden field, victorious.
 *  The flock stays north of the smashed fence so no rail cuts through a bird. */
const sunsetCrowd = (t: number, cam: CamInfo, out: Stage) => {
  flock(out, t, 0, -18, 18, 10, 0.15, true, 1.05, 25, "stand");
  emu(out, 6, -16, 0.3, true, 1.1, "stand");
  emu(out, -6, -17, 0.7, false, 1.05, "stand");
  emu(out, -10, -19, 0.5, true, 1, "stand");
  emu(out, 10, -20, 0.9, false, 1.05, "stand");
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, b: StoryState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "field": fieldCrowd(t, cam, out); break;
    case "farm": farmCrowd(t, cam, out); break;
    case "raid": raidCrowd(t, cam, out); break;
    case "call": callCrowd(t, cam, out); break;
    case "arrive": arriveCrowd(t, cam, out); break;
    case "scatter": scatterCrowd(t, cam, out); break;
    case "waterhole": waterholeCrowd(t, cam, out); break;
    case "truck": truckCrowd(t, cam, out); break;
    case "retreat": retreatCrowd(t, cam, out); break;
    case "sunset": sunsetCrowd(t, cam, out); break;
    default: break;
  }
  return out;
};

export { FPS };
