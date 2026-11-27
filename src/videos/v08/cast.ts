// Our cast as lit flat sprites in the 3D world — VIDEO08 (Annie Edson Taylor).
// Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas per distinct
// drawing, so characters in step share canvases.
// Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones on land get a soft multiply contact blob.
// Effects are unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never
// outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, SKINS, townsfolk,
  fxShadow, fxContact, fxPuff, fxSplash,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS, BARREL_BANK, PUMP_POS, POOL_EDGE, STALL_POS, BANK_Y, StoryState,
  clamp01, premium, pumpPose,
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

export type Stage = { places: Place[]; fx: FxPlace[] };

/** the ginger tabby cat, sitting, drawn on a 300 x 300 canvas; feet at y ~270.
 *  tail: tail-wag angle in radians (motion-tabel.md C); headDx: head-turn shift in px. */
const drawCat = (p: Pen, tail = 0, headDx = 0) => {
  const ginger = "#c07840", dark = "#8a4a28", cream = "#f2e2c8";
  // tail curling up on the right, rotated about its base (205, 260) by the wag angle
  const rot = (x: number, y: number): [number, number] => {
    const c = Math.cos(tail), s = Math.sin(tail), dx = x - 205, dy = y - 260;
    return [205 + dx * c - dy * s, 260 + dx * s + dy * c];
  };
  p.line([rot(205, 260), rot(245, 230), rot(250, 185), rot(235, 155)], ginger, 16);
  // body
  p.ell(150, 215, 58, 62, ginger, 10);
  // cream chest
  p.ell(150, 235, 34, 34, cream, 8);
  // head (shifted by headDx when the cat turns to look at Annie)
  p.ell(150 + headDx, 122, 44, 40, ginger, 10);
  // ears
  p.poly([[118 + headDx, 92], [128 + headDx, 58], [148 + headDx, 86]], ginger, 8);
  p.poly([[152 + headDx, 86], [172 + headDx, 58], [182 + headDx, 92]], ginger, 8);
  // stripes on the head and back
  p.stroke([[135 + headDx, 84], [135 + headDx, 100]], 5, dark);
  p.stroke([[150 + headDx, 82], [150 + headDx, 98]], 5, dark);
  p.stroke([[165 + headDx, 84], [165 + headDx, 100]], 5, dark);
  p.stroke([[120, 180], [120, 205]], 5, dark);
  p.stroke([[180, 180], [180, 205]], 5, dark);
  // face: eyes, nose, mouth, whiskers
  p.dot(134 + headDx, 118, 5); p.dot(166 + headDx, 118, 5);
  p.poly([[146 + headDx, 134], [154 + headDx, 134], [150 + headDx, 141]], "#c05a6a", 4);
  p.stroke([[150 + headDx, 141], [150 + headDx, 148]], 3);
  p.stroke([[110 + headDx, 128], [132 + headDx, 134]], 3);
  p.stroke([[110 + headDx, 140], [132 + headDx, 138]], 3);
  p.stroke([[190 + headDx, 128], [168 + headDx, 134]], 3);
  p.stroke([[190 + headDx, 140], [168 + headDx, 138]], 3);
  // paws
  p.ell(128, 272, 16, 9, ginger, 6);
  p.ell(172, 272, 16, 9, ginger, 6);
};

/** a newspaper waved in the air (shot 9), drawn on a 300 x 300 canvas */
const drawPaper = (p: Pen) => {
  p.poly([[30, 20], [270, 20], [270, 280], [30, 280]], "#f7f3ea", 8);
  p.stroke([[50, 60], [250, 60]], 8, "#1f2a44");
  p.stroke([[50, 90], [250, 90]], 5, "#8a8f96");
  p.stroke([[50, 115], [250, 115]], 5, "#8a8f96");
  p.stroke([[50, 140], [250, 140]], 5, "#8a8f96");
  p.stroke([[50, 165], [150, 165]], 5, "#8a8f96");
  p.stroke([[50, 190], [150, 190]], 5, "#8a8f96");
  p.dot(205, 180, 22, "#c0353a");
};

/** drifting mist at the falls base: a slow soft puff card.
 *  Sine loop (no jump at the wrap, motion-tabel.md E11) and a slow horizontal drift,
 *  frozen while the barrel falls (t 33.8-35.6) so the focus stays on it (motion G).
 *  Cards are wide and flat so the mist reads as mist, not white eggs (stage01). */
const mist = (out: Stage, x: number, y: number, z: number, w: number, h: number, t: number, seed = 0) => {
  const ph = t * 0.06 + seed * 0.37;
  const pt = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
  const frozen = t >= 33.8 && t <= 35.6;
  const dx = frozen ? 0 : 0.5 * Math.sin((t / 240) * Math.PI * 2 + seed * 1.7);
  out.fx.push({ key: `mist|${Math.round(pt * 8) / 8}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, pt),
    x: x + dx, y, z, w, h, soft: true });
};

// ---------------- who ----------------
const ANNIE: Outfit = { jacket: "#5a4a5a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#8a4a7a", hair: "#9a9a9a", skin: SKINS[0] };
const ANNIE_OLD: Outfit = { ...ANNIE, dress: "#6a4a5a", hair: "#b0b0b0", build: "stout" };
const FRIEND_A: Outfit = { jacket: "#3f4a5a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#2a201a", belt: "#3a2e3f", buttons: "#d9dde0" };
const GRAHAM: Outfit = { jacket: "#4a3a2a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#5a3b2a", belt: "#3a2e3f", buttons: "#d9dde0", moustache: "#4a3426" };
const FRIEND_B: Outfit = { jacket: "#5a6a4a", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#3a3f52", hair: "#2a201a", belt: "#3a2e3f", buttons: "#d9dde0" };
const annie = (old = false): Who => old
  ? { i: 700, o: { ...ANNIE_OLD, skin: SKINS[0] }, okey: "anno" }
  : { i: 700, o: { ...ANNIE, skin: SKINS[0] }, okey: "ann" };
const friend = (i: number): Who => ({ i: i + 710, o: { ...[FRIEND_A, GRAHAM, FRIEND_B][i % 3], skin: SKINS[(i + 1) % 4] }, okey: `fr${i % 3}` });
const crowd = (i: number): Who => ({ i: i + 730, o: { ...townsfolk(i), skin: SKINS[(i + 2) % 4] }, okey: `cr${i % 6}` });

const front = { side: false, mirror: false } as const;

/** the hook (shot 1): Annie beside the barrel on the riverbank, the falls looming
 *  behind her, the cat at her feet, friends and townsfolk behind her. */
const bankCrowd = (t: number, cam: CamInfo, out: Stage) => {
  // Annie west of the barrel, on the bank (BANK_Y); the barrel stands at her right.
  out.places.push(person(cam, annie(), BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3, front,
    { mode: "stand", expr: "smile", blink: lidAt(t, 700), look: 0 }, {}));
  blob(out, BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3);
  // friends spread apart: v1 put one directly behind Annie, so only his head showed (stage01)
  for (const [i, x, z] of [[0, 5.0, -20.0], [1, 4.0, -19.0]] as const) {
    out.places.push(person(cam, friend(i), x, BANK_Y, z, front,
      { mode: "stand", expr: "neutral", blink: lidAt(t, i + 710), look: 0 }, {}));
    blob(out, x, BANK_Y, z);
  }
  for (const [i, x, z] of [[0, -1.5, -22.5], [1, 2.5, -24.5], [2, 5.5, -23], [3, 6.5, -23.5]] as const) {
    out.places.push(person(cam, crowd(i), x, BANK_Y, z, front,
      { mode: "stand", expr: "neutral", blink: lidAt(t, i + 730), look: 0 }, {}));
    blob(out, x, BANK_Y, z);
  }
  // the cat at her feet, between Annie and the barrel on open sand: v1 put it at
  // (0.5, -17.2), which projects off the left frame edge from this camera
  out.fx.push({ key: "cat|sit", cw: 300, ch: 300, draw: drawCat, x: 1.8, y: BANK_Y + 0.24, z: -17.0, w: 0.6, h: 0.6 });
  mist(out, 0, 2, -60, 10, 3.5, t, 0);
};

/** the idea (shot 2): Annie gestures at the barrel, her wild plan; two friends listen. */
const ideaCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, annie(), BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3, front,
    // bigger gesture: v1 raised her arm only a little and the "wild idea" did not read
    { mode: "stand", expr: "smile", blink: lidAt(t, 700), wave: 0.7 + 0.3 * Math.sin(t * 2.4) ** 3, look: 0 }, {}));
  blob(out, BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3);
  out.places.push(person(cam, friend(1), 4.2, BANK_Y, -19.5, front,
    { mode: "stand", expr: "neutral", blink: lidAt(t, 711), look: 0 }, {}));
  blob(out, 4.2, BANK_Y, -19.5);
  out.places.push(person(cam, friend(2), 0.2, BANK_Y, -20, front,
    { mode: "stand", expr: "neutral", blink: lidAt(t, 712), look: 0 }, {}));
  blob(out, 0.2, BANK_Y, -20);
  out.fx.push({ key: "cat|sit", cw: 300, ch: 300, draw: drawCat, x: 1.8, y: BANK_Y + 0.24, z: -17.0, w: 0.6, h: 0.6 });
};

/** the stakes (shot 3): the falls tower over the bank; Annie and her friends look up at them. */
const stakesCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, annie(), BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3, front,
    { mode: "stand", expr: "nervous", blink: lidAt(t, 700), headTilt: -0.15, look: 0 }, {}));
  blob(out, BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3);
  for (const [i, x, z] of [[0, 0.0, -19.5], [1, 4.0, -20.5]] as const) {
    out.places.push(person(cam, friend(i), x, BANK_Y, z, front,
      { mode: "stand", expr: "shock", blink: lidAt(t, i + 710), headTilt: -0.15, look: 0 }, {}));
    blob(out, x, BANK_Y, z);
  }
  mist(out, 0, 2, -60, 9, 3.5, t, 1);
  mist(out, -8, 2.5, -58, 7, 3, t, 2);
  mist(out, 8, 2.5, -58, 7, 3, t, 3);
};

/** the cat test (shot 4): the cat sits on the barrel, Annie leans over it, friends watch. */
const catCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, annie(), BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3, front,
    // lean further over the cat: v1 tilted only 0.15 and the inspection did not read
    { mode: "stand", expr: "smile", blink: lidAt(t, 700), tilt: 0.25, look: 0 }, {}));
  blob(out, BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3);
  out.places.push(person(cam, friend(1), 4.3, BANK_Y, -19.5, front,
    { mode: "stand", expr: "smile", blink: lidAt(t, 711), look: 0 }, {}));
  blob(out, 4.3, BANK_Y, -19.5);
  out.places.push(person(cam, friend(2), 0.2, BANK_Y, -19.8, front,
    { mode: "stand", expr: "grin", blink: lidAt(t, 712), look: 0 }, {}));
  blob(out, 0.2, BANK_Y, -19.8);
  // the cat sits on the barrel top (barrel top y BANK_Y + 1.5; card feet land on it).
  // Tail wags in 48-frame cycles and the head turns to Annie f540-558 (motion-tabel.md C).
  const f = t * FPS;
  const tail = f >= 480 && f < 660 ? 0.35 * Math.sin(((f - 480) / 48) * Math.PI * 2) : 0;
  const headDx = f >= 540 && f < 558 ? 6 * premium((f - 540) / 18)
    : f >= 558 && f < 600 ? 6
    : f >= 600 && f < 618 ? 6 * (1 - premium((f - 600) / 18)) : 0;
  out.fx.push({ key: `cat|sit|${Math.round(tail * 8) / 8}|${Math.round(headDx)}`, cw: 300, ch: 300,
    draw: (p) => drawCat(p, tail, headDx), x: BARREL_BANK[0], y: BANK_Y + 1.78, z: BARREL_BANK[2], w: 0.7, h: 0.7 });
};

/** the birthday (shot 5): Annie climbs into the barrel, friends hold the lid above her,
 *  the crowd watches. The lid itself is a world group (storyState.lidHeld). */
const birthdayCrowd = (t: number, cam: CamInfo, out: Stage) => {
  // Annie climbs into the barrel f690-738 (motion-tabel.md A): walk to the barrel,
  // rise, then hide inside it. V1 left her standing beside it the whole shot.
  const f = t * FPS;
  const ax = f < 690 ? BARREL_BANK[0] - 1.4
    : f < 714 ? 1.1 + 0.8 * premium((f - 690) / 24)
    : 1.9 + 0.6 * premium((f - 714) / 24);
  const ay = f < 714 ? BANK_Y : BANK_Y + 0.45 * premium((f - 714) / 24);
  if (f < 738) {
    out.places.push(person(cam, annie(), ax, ay, BARREL_BANK[2] + 0.3, front,
      { mode: "stand", expr: "nervous", blink: lidAt(t, 700), tilt: 0.1, look: 0 }, {}));
    blob(out, ax, BANK_Y, BARREL_BANK[2] + 0.3);
  }
  // Graham reaches up toward the held lid: he stands at (2.9, -19.0), just behind
  // the barrel's right side, so his head and raised arm show above it. V2 put him
  // at (3.9, -19.2), off the right frame edge, and the lid had no visible holder.
  out.places.push(person(cam, friend(1), 2.9, BANK_Y, -19.0, front,
    { mode: "stand", expr: "neutral", blink: lidAt(t, 711), wave: 0.8, look: 0 }, {}));
  blob(out, 2.9, BANK_Y, -19.0);
  out.places.push(person(cam, friend(2), 0.6, BANK_Y, -19.2, front,
    { mode: "stand", expr: "neutral", blink: lidAt(t, 712), look: 0 }, {}));
  blob(out, 0.6, BANK_Y, -19.2);
  // the second onlooker sits fully off-frame west: v2 put him at (-1.5, -20.5),
  // half-cut at the left edge (still_0720)
  for (const [i, x, z] of [[0, 0, -22], [2, -3.0, -22]] as const) {
    out.places.push(person(cam, crowd(i + 2), x, BANK_Y, z, front,
      { mode: "stand", expr: "neutral", blink: lidAt(t, i + 740), look: 0 }, {}));
    blob(out, x, BANK_Y, z);
  }
};

/** the pump and the drift (shot 6): a friend works the bicycle pump at the bank
 *  (Annie is already sealed inside the barrel, in the boat); once the boat drifts
 *  north (t >= 30) nobody is in frame — the camera follows the boat alone. */
const pumpCrowd = (t: number, cam: CamInfo, out: Stage, b: StoryState) => {
  if (t >= 30 || b.annieIn) return;
  const px = PUMP_POS[0] + 0.7, pz = PUMP_POS[2] + 0.2; // the friend stands east of the pump, facing it
  const view = viewOf(cam, px, pz, -1, 0);
  const pose = pumpPose(t * FPS); // 36-frame stroke, synced with the pump handle in world.ts
  out.places.push(person(cam, friend(0), px, D0, pz, view,
    { mode: "stand", expr: "neutral", blink: lidAt(t, 710), look: 0 },
    { mode: "push", pose, hand: [430, 690], expr: "neutral", blink: lidAt(t, 710) }));
  blob(out, px, D0, pz);
  out.places.push(person(cam, friend(1), 2.7, BANK_Y, -19.5, front,
    { mode: "stand", expr: "neutral", blink: lidAt(t, 711), look: 0 }, {}));
  blob(out, 2.7, BANK_Y, -19.5);
};

/** the drop (shot 7): no watchers in frame — the falls camera looks north-west and
 *  the beach is off-axis right; the barrel falls (world group) and the splash erupts
 *  at the base. Mist kept small and tight to the cliff so it reads as mist, not eggs. */
const dropCrowd = (t: number, cam: CamInfo, out: Stage, b: StoryState) => {
  mist(out, 0, 0.7, -62, 4.5, 1.8, t, 0);
  mist(out, -8, 1.0, -60, 4.5, 1.8, t, 4);
  if (b.splash > 0) {
    out.fx.push({ key: `splash|${Math.round(b.splash * 8) / 8}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, b.splash),
      x: 0, y: 2.2, z: -63, w: 4, h: 4 });
  }
};

/** the rescue (shot 8): the barrel lies on its side at the pool edge (world group);
 *  Annie climbs out, dazed; the rescuers reach to help her. */
const rescueCrowd = (t: number, cam: CamInfo, out: Stage) => {
  // Annie rises out of the barrel f1110-1140 (motion-tabel.md E): v1 left her
  // standing upright the whole time, so "climbed out alive" never read
  const f = t * FPS, u = clamp01((f - 1110) / 30);
  const ry = BANK_Y - 0.15 + 0.15 * premium(u), rtilt = 0.25 * (1 - premium(u));
  out.places.push(person(cam, annie(), POOL_EDGE[0] - 0.9, ry, POOL_EDGE[2] + 0.2, front,
    { mode: "stroll", phase: 0.2, expr: "dazed", blink: lidAt(t, 700), tilt: rtilt, look: 0 }, {}));
  blob(out, POOL_EDGE[0] - 0.9, BANK_Y, POOL_EDGE[2] + 0.2, 0.6);
  out.places.push(person(cam, friend(1), POOL_EDGE[0] + 1.3, BANK_Y, POOL_EDGE[2] + 1, front,
    { mode: "stand", expr: "relief", blink: lidAt(t, 711), wave: 0.3 * premium(clamp01((f - 1110) / 18)), look: 0 }, {}));
  blob(out, POOL_EDGE[0] + 1.3, BANK_Y, POOL_EDGE[2] + 1, 0.6);
  // second rescuer moved clear of the barrel: v1 hid him behind it (stage01)
  out.places.push(person(cam, friend(2), POOL_EDGE[0] - 2.3, BANK_Y, POOL_EDGE[2] + 1.0, front,
    { mode: "stand", expr: "relief", blink: lidAt(t, 712), look: 0 }, {}));
  blob(out, POOL_EDGE[0] - 2.3, BANK_Y, POOL_EDGE[2] + 1.0, 0.6);
  mist(out, 0, 1.5, -60, 9, 3.5, t, 0);
};

/** the fame (shot 9): the crowd cheers around Annie at the bank; one waves a newspaper. */
const fameCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const f = t * FPS;
  // staggered cheering (motion-tabel.md D1): v1 waved Annie + 3 crowd members at once (50%)
  const annieWave = f >= 1260 && f < 1380 ? 0.6 + 0.3 * Math.sin(t * 3) ** 3 : undefined;
  out.places.push(person(cam, annie(), BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3, front,
    { mode: "stand", expr: "grin", blink: lidAt(t, 700), wave: annieWave, look: 0 }, {}));
  blob(out, BARREL_BANK[0] - 1.4, BANK_Y, BARREL_BANK[2] + 0.3);
  // crowd kept near the camera axis (x 0..3.8): the 9:16 frame is narrow, x 4.5+ falls off-frame.
  // The two at the left edge moved in: v1 cut them off at x -0.5 (stage01, still_1400).
  for (const [i, x, z, e] of [
    [0, 0.5, -19.5, "grin"], [1, 3.2, -19.8, "laugh"], [2, 0.3, -21, "grin"],
    [3, 3.8, -20.5, "laugh"], [4, 0.3, -14.5, "grin"], [5, 3.5, -15, "laugh"],
  ] as const) {
    const waving = i % 2 === 0 ? undefined
      : i === 5 ? (f >= 1440 && f < 1530 ? 0.6 + 0.3 * Math.sin(t * 3) ** 3 : undefined)
      : (f >= 1380 && f < 1500 ? 0.6 + 0.3 * Math.sin(t * 3) ** 3 : undefined);
    out.places.push(person(cam, crowd(i), x, BANK_Y, z, front,
      { mode: "stand", expr: e as Expr, blink: lidAt(t, i + 730), wave: waving, look: 0 }, {}));
    blob(out, x, BANK_Y, z);
  }
  // the newspaper waved by the man at (3.2, -19.8), above his head, inside the frame.
  // It flutters in 24-frame cycles now (motion-tabel.md D); v1 left it hanging in the air.
  const flutter = 0.1 + 0.25 * Math.sin((f / 24) * Math.PI * 2);
  out.fx.push({ key: `paper|${Math.round(flutter * 8) / 8}`, cw: 300, ch: 300, draw: drawPaper,
    x: 3.1, y: 1.95 + 0.05 * Math.sin((f / 24) * Math.PI * 2), z: -19.5, w: 0.5, h: 0.55, rot: flutter });
};

/** the stall (shot 10, golden): older Annie at her photo stall on the town street,
 *  a customer looking at the photos, the barrel on display beside her (world group). */
const stallCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const f = t * FPS;
  // women kept close to the stall centre so the photo cards show in the gap between them
  const ax = STALL_POS[0] + 1.3, az = STALL_POS[2] - 0.7; // older Annie beside her stall
  // slow nod f1600-1624 (motion-tabel.md I): v1 left the 9-second closing shot static
  const nod = f >= 1600 && f < 1624 ? 0.12 * Math.sin(((f - 1600) / 24) * Math.PI) : 0;
  out.places.push(person(cam, annie(true), ax, D0, az, front,
    { mode: "stand", expr: "smile", blink: lidAt(t, 700), headTilt: nod, look: 0 }, {}));
  blob(out, ax, D0, az);
  // the customer stands south-west of the stall, in the street in front of the
  // photo board, looking at the photos. V2 put her east of the stall (6.2, 30.5),
  // which this south-west camera projects to the far left edge, half-cut.
  const cust: Who = { i: 731, o: { ...townsfolk(1), skin: SKINS[3], hat: "cap", cap: "#3a3f52", dress: "#4a6a8a" }, okey: "cust" };
  const point = f >= 1640 && f < 1658 ? 0.5 : undefined;
  out.places.push(person(cam, cust, 2.5, D0, 30.0, front,
    { mode: "stand", expr: "neutral", blink: lidAt(t, 731), wave: point, look: 0 }, {}));
  blob(out, 2.5, D0, 30.0);
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, b: StoryState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "bank": bankCrowd(t, cam, out); break;
    case "idea": ideaCrowd(t, cam, out); break;
    case "stakes": stakesCrowd(t, cam, out); break;
    case "cat": catCrowd(t, cam, out); break;
    case "birthday": birthdayCrowd(t, cam, out); break;
    case "pump": pumpCrowd(t, cam, out, b); break;
    case "drop": dropCrowd(t, cam, out, b); break;
    case "rescue": rescueCrowd(t, cam, out); break;
    case "fame": fameCrowd(t, cam, out); break;
    case "stall": stallCrowd(t, cam, out); break;
    default: break;
  }
  return out;
};
