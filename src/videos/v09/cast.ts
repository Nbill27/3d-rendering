// Our cast as lit flat sprites in the 3D world — VIDEO09 (The London Beer Flood).
// Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas per distinct
// drawing, so characters in step share canvases.
// Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones on land get a soft multiply contact blob.
// Effects are unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never
// outlines their quads.
// RESPECT: the 8 victims were all women and children. The wake (shot 6) is shown only as distant
// silhouettes with candles, never close-ups of bodies. The humour comes from the absurdity of the
// event, never from the victims.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, CLERK, OFFICIAL, WORKER, PARENT, KID, townsfolk, dealer,
  fxShadow, fxContact, fxLetter, fxCup, fxBurst, fxPuff,
  Outfit, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS,
  workerX, workerZ, fleeX, fleeZ, strollZ, StoryState,
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
let LNAME: "day" | "golden" | "warm" = "day";
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
const CONTACT: Record<"day" | "golden" | "warm", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], warm: [0.2, 0.21, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME !== "golden") {
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

// ---------------- props (effect cards) ----------------
/** Crick's note to fix the ring later, lying flat on the platform deck */
const letter = (out: Stage, x: number, z: number, rot = 0) => {
  out.fx.push({ key: "letter", cw: 600, ch: 400, draw: (p) => fxLetter(p), x, y: 4.06, z, w: 0.7, h: 0.47, flat: true, rot });
};
/** a tea cup on the cottage table */
const cup = (out: Stage, x: number, z: number) => {
  out.fx.push({ key: "cup", cw: 300, ch: 300, draw: (p) => fxCup(p), x, y: 0.82, z, w: 0.3, h: 0.3 });
};
/** impact star at the burst (600 x 600 drawing, centred) */
const burst = (out: Stage, x: number, y: number, z: number, t: number, w: number) => {
  out.fx.push({ key: `burst|${Math.round(t * 24)}`, cw: 600, ch: 600, draw: (p) => fxBurst(p, clamp01(t), "#ffd84a", 12, 50, 280), x, y, z, w, h: w });
};
/** dust puff at the burst (300 x 300 drawing, centred) */
const puff = (out: Stage, x: number, y: number, z: number, t: number, w: number) => {
  out.fx.push({ key: `puff|${Math.round(t * 24)}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, clamp01(t)), x, y, z, w, h: w });
};
/** beer spray: amber droplets + cream foam on a 600 x 600 canvas (fxSplash is blue water —
 *  porter is dark amber, so the spray is drawn here instead) */
const beerSpray = (out: Stage, x: number, y: number, z: number, t: number, w: number) => {
  out.fx.push({
    key: `beerSpray|${Math.round(t * 24)}`, cw: 600, ch: 600, x, y, z, w, h: w,
    draw: (p) => {
      const c = 300, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
      if (rise > 0.02) {
        for (let i = 0; i < 9; i++) {
          const h = (120 + 90 * Math.sin(i * 1.7 + 0.6)) * rise;
          p.ell(c - 240 + (480 * i) / 8, 600 - 110 - h * 0.55, 78, 58 + h * 0.45, "#e8d9a8", 9);
        }
        p.ell(c, 600 - 80, 290, 40, "#5a2e0e", 10);
      }
      for (let i = 0; i < 8; i++) {
        const a = ((200 + i * 18) * Math.PI) / 180, d = 100 + 320 * t, y = 600 - 140 + d * Math.sin(a) + 420 * t * t, r = 22 * (1 - t) + 5;
        if (t > 0.08 && y < 600 - 30) p.ell(c + d * Math.cos(a), y, r, r * 1.25, "#8a5a28", 7);
      }
    },
  });
};

// ---------------- crowd by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

/** George Crick: the storehouse clerk who spotted the slipping ring (grey clerk's coat) */
const crick = (): Who => ({ i: 900, o: CLERK, okey: "crick" });
/** the brewery boss: stout, top hat, red sash — dismisses the ring, then stands before the judge */
const boss = (): Who => ({ i: 910, o: OFFICIAL, okey: "boss" });
/** a brewery worker (v picks the cap + jacket shade) */
const worker = (v: number): Who => ({ i: 920 + v, o: WORKER, okey: `w${v}` });
/** the St Giles mother: purple dress, hair tied back, holding her 4-year-old at tea */
const mother = (): Who => ({ i: 940, o: { ...PARENT, dress: "#7b5ac9" }, okey: "mother" });
/** her 4-year-old child, at the tea table beside her — the VO says "four-year-old girl", so
 *  she wears hair, not the KID's red cap (a dress would not render: toon.ts hides it in "sit") */
const child = (): Who => ({ i: 950, o: { ...KID, hat: "hair", hair: "#6b4a2a", cap: undefined }, okey: "child" });
/** a mourner at the cellar wake: dark clothes, head bowed — a distant silhouette only */
const mourner = (v: number): Who => ({ i: 960 + v, o: { ...townsfolk(v), jacket: "#2e2430", pants: "#2b2f3a", hat: "hair", hair: "#2a201a" }, okey: `m${v}` });
/** the judge: black robe, white wig, stern — seated at the bench */
const judge = (): Who => ({ i: 980, o: { ...OFFICIAL, jacket: "#1c1c26", pants: "#1c1c26", hat: "hair", hair: "#e8e6da", sash: undefined, moustache: undefined }, okey: "judge" });
/** a St Giles passer-by / rescuer in a workman's jacket */
const passer = (v: number): Who => ({ i: 990 + v, o: dealer(v + 2), okey: `p${v}` });

/** the hook (crowd "brewery", shot 1): Crick at the foot of the giant vat, pointing up at it;
 *  a worker hauls a barrel diagonally across the hall floor in front of the vat, another
 *  stands at the vat's far side. Crick stands east of the vat (clear of it, near the sightline)
 *  so he reads ~14% of frame height with his feet just above the subtitle band */
const breweryCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, crick(), -27, D0, 1.5, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 900), wave: 0.6 + 0.2 * Math.sin(t * 2.2), look: 0 }, {}));
  blob(out, -27, D0, 1.5);
  const v1 = viewOf(cam, workerX(t), workerZ(t), -1, -0.8);
  out.places.push(person(cam, worker(0), workerX(t), D0, workerZ(t), v1,
    { mode: "stroll", phase: (t * 0.9) % 1, expr: "neutral", blink: lidAt(t, 920) },
    { mode: "march", phase: (t * 0.9) % 1, expr: "neutral", blink: lidAt(t, 920) }));
  blob(out, workerX(t), D0, workerZ(t));
  out.places.push(person(cam, worker(1), -34, D0, -5, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 921), look: 0 }, {}));
  blob(out, -34, D0, -5);
};

/** the vat (crowd "vat", shot 2): Crick at the vat's foot on the hall floor, small against
 *  the staves and iron hoops; one worker stands by the second vat in the background */
const vatCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, crick(), -27, D0, 1.5, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 900), wave: 0.4 + 0.15 * Math.sin(t * 2), look: 0 }, {}));
  blob(out, -27, D0, 1.5);
  out.places.push(person(cam, worker(0), -33, D0, -4, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 920), look: 0 }, {}));
  blob(out, -33, D0, -4);
};

/** the ring (crowd "ring", shot 3): Crick and the boss stand at the platform's north edge,
 *  leaning over the railing toward the vat, watching the 700 lb ring slip down it.
 *  Crick's note lies on the deck at his feet. */
const ringCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, crick(), -30, 4, 3.4, { side: false, mirror: false },
    { mode: "stand", expr: "nervous", blink: lidAt(t, 900, [11]), tilt: 8, look: 0 }, {}));
  blob(out, -30, 4, 3.4);
  letter(out, -29, 4.2, 0.3);
  out.places.push(person(cam, boss(), -28, 4, 3.6, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 910), wave: 0.7 + 0.15 * Math.sin(t * 2.4), look: 0 }, {}));
  blob(out, -28, 4, 3.6);
  out.places.push(person(cam, worker(1), -34, D0, -5, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 921), look: 0 }, {}));
  blob(out, -34, D0, -5);
};

/** the burst (crowd "burst", shot 4): the vat explodes — Crick recoils on the platform,
 *  workers flee toward the east door, staves and spray fill the hall */
const burstCrowd = (t: number, cam: CamInfo, out: Stage, b: StoryState) => {
  out.places.push(person(cam, crick(), -30, 4, 4.8, { side: false, mirror: false },
    { mode: "stand", expr: "shock", blink: lidAt(t, 900, [17]), tilt: -10, look: 0 }, {}));
  blob(out, -30, 4, 4.8);
  const v1 = viewOf(cam, fleeX(t), 6.5, 1, 0);
  out.places.push(person(cam, worker(0), fleeX(t), D0, 6.5, v1,
    { mode: "stroll", phase: (t * 1.2) % 1, expr: "shock", blink: lidAt(t, 920) },
    { mode: "march", phase: (t * 1.2) % 1, expr: "shock", blink: lidAt(t, 920) }));
  blob(out, fleeX(t), D0, 6.5);
  const w2x = -33 + 3 * clamp01((t - 17) / 3), w2z = 2; // ends at (-30, 2), 10.6 m from the S4b
  // lens: the old endpoint (-28, 5) was 7 m away, so his head sat at the caption band
  const v2 = viewOf(cam, w2x, w2z, 1, 0.4);
  out.places.push(person(cam, worker(1), w2x, D0, w2z, v2,
    { mode: "stroll", phase: (t * 1.2 + 0.4) % 1, expr: "shock", blink: lidAt(t, 921) },
    { mode: "march", phase: (t * 1.2 + 0.4) % 1, expr: "shock", blink: lidAt(t, 921) }));
  blob(out, w2x, D0, w2z);
  const k = b.debris; // 0 at the burst, 1 fully flung out
  burst(out, -30, 3.5, -1, Math.min(1, k * 1.4), 6);
  puff(out, -33, 1.2, 1, clamp01(k), 3.5);
  puff(out, -27, 1.2, -3, clamp01(k * 0.9), 3);
  beerSpray(out, -30, 3.5, 2.5, clamp01(k), 2.5); // smaller + higher: the old 4.5 m cards sat
  // with their foam at floor level and read as a flat foam carpet, not spray in the air
  beerSpray(out, -34, 4.0, -2, clamp01(k * 0.8), 2.0);
};

/** the wave (crowd "wave", shot 5): townsfolk flee south down the street ahead of the wave;
 *  the 3D wave itself is posed in world.ts, with beer spray at its crest */
const waveCrowd = (t: number, cam: CamInfo, out: Stage, b: StoryState) => {
  for (let i = 0; i < 2; i++) {
    const x = i ? -6 : -5, z = fleeZ(t, i * 1.5); // both on the S5 sightline (x -5..-6 at z 10-14):
    // the old x -3/+3 put one townsfolk 46 deg off-axis, out of frame
    const v = viewOf(cam, x, z, 0, 1);
    out.places.push(person(cam, passer(i), x, D0, z, v,
      { mode: "stroll", phase: (t * 1.3 + i * 0.4) % 1, expr: "shock", blink: lidAt(t, 990 + i) },
      { mode: "march", phase: (t * 1.3 + i * 0.4) % 1, expr: "shock", blink: lidAt(t, 990 + i) }));
    blob(out, x, D0, z);
  }
  // spray at the wave crest: the front advances from the door (-12, 3.5) to (-8, 10) as b.wave goes 0 -> 1
  const wx = -12 + 4 * b.wave, wz = 3.5 + 6.5 * b.wave;
  beerSpray(out, wx, 3.2, wz, clamp01(b.wave * 1.2), 5);
  beerSpray(out, wx - 2, 2.6, wz + 2, clamp01(b.wave), 4);
};

/** the wake (crowd "wake", shot 6): five mourners around the coffin in the cellar below street
 *  level — distant silhouettes only, seen through the open doorway, candles glowing.
 *  No faces, no close-ups, no bodies: the coffin is a closed 3D box in world.ts. */
const wakeCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const spots: [number, number, number][] = [[-16.5, 15, 0], [-14.5, 15, 1], [-16.5, 17, 2], [-14.5, 17, 3], [-15.5, 16.8, 4]]; // the fifth
  // stood at (-15.5, 14.2), then (-15.5, 17.8): both put him in the pit wall's shadow from the
  // S6 crane, so only a sliver showed; he now stands in the open floor south of the coffin
  for (const [x, z, v] of spots) {
    out.places.push(person(cam, mourner(v), x, -2.2, z, { side: false, mirror: false },
      { mode: "stand", expr: "neutral", blink: lidAt(t, 960 + v), look: 0 }, {}, 0.9));
    blob(out, x, -2.2, z, 0.9);
  }
};

/** at tea (crowd "tea", shot 7): the mother sits at the cottage table holding her 4-year-old;
 *  two cups on the table, beer swirling in around their feet (the 3D flood plane) */
/** the tea (crowd "tea", shot 7): mother and child sit on OPPOSITE sides of the tea table
 *  (mother north, child south) so the west camera separates them in the frame — seated side
 *  by side along the sightline, the taller mother hid the child completely behind her */
const teaCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, mother(), 15.8, D0, 27.3, { side: false, mirror: false },
    { mode: "sit", expr: "neutral", blink: lidAt(t, 940), look: 0 }, {}));
  blob(out, 15.8, D0, 27.3);
  out.places.push(person(cam, child(), 16.2, D0, 28.7, { side: false, mirror: false },
    { mode: "sit", expr: "neutral", blink: lidAt(t, 950), look: 0 }, {}));
  blob(out, 16.2, D0, 28.7);
  cup(out, 15.6, 27.6);
  cup(out, 16.4, 28.4);
};

/** aftermath (crowd "aftermath", shot 8): two rescuers and two townsfolk wade through the
 *  flooded street (the flood plane at y 0.25 hides their shins, which reads as wading).
 *  The doorstep watchers were dropped: the sidewalks sit 24 deg off the down-street sightline,
 *  outside the narrow horizontal cone, so nobody standing there is ever in frame. */
const aftermathCrowd = (t: number, cam: CamInfo, out: Stage) => {
  // the four waders stand in a tight cluster (5 m wide) at the street's centre: spread over
  // 12 m they could never all fit the narrow 9:16 cone from any camera close enough to
  // make them read, so the wide shots showed one tiny wader and the close shots none
  const spots: [number, number, number, boolean][] = [[-2, 14, 0, false], [1, 16, 1, false], [-3, 18, 0, true], [2, 20, 1, true]];
  for (const [x, z, i, isPasser] of spots) {
    const v = viewOf(cam, x, z, 0, -1);
    const who = isPasser ? passer(i) : worker(i);
    out.places.push(person(cam, who, x, D0, z, v,
      { mode: "stroll", phase: (t * 0.5 + i * 0.3 + (isPasser ? 0.5 : 0)) % 1, expr: isPasser ? "shock" : "neutral", blink: lidAt(t, (isPasser ? 990 : 920) + i) },
      { mode: "march", phase: (t * 0.5 + i * 0.3 + (isPasser ? 0.5 : 0)) % 1, expr: isPasser ? "shock" : "neutral", blink: lidAt(t, (isPasser ? 990 : 920) + i) }));
    blob(out, x, D0, z);
  }
};

/** the court (crowd "court", shot 9): the judge at the bench, the brewery boss standing
 *  before him. Two-shot only — anyone between this camera and the bench is 3-5 m from the
 *  lens and fills the frame, so Crick is not in this shot. */
const courtCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, judge(), 45.5, 1.4, -1, { side: false, mirror: false },
    { mode: "sit", expr: "stern", blink: lidAt(t, 980), look: 0 }, {})); // seated on a tall
  // chair behind the bench: at dais level (y 0.6) he was invisible, at y 1.15 only his eyes
  // cleared the bench rail (2.0); at 1.4 his full face shows above it. Lower body and blob
  // stay hidden behind the bench
  blob(out, 45.5, 1.4, -1);
  out.places.push(person(cam, boss(), 41, D0, -1, { side: false, mirror: false },
    { mode: "stand", expr: "nervous", blink: lidAt(t, 910), look: 0 }, {}));
  blob(out, 41, D0, -1);
};

/** the theatre (crowd "theatre", shot 10, golden): strollers walk north up the street toward
 *  the Dominion facade; one passer-by stands looking up at it */
const theatreCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const walkers: [number, number, number][] = [[-3, 0, 0], [0, 2, 1], [3, 4, 2]]; // x kept close
  // together: at 16 m the narrow cone only spans ~9 m, so a 10 m spread pushed the outer
  // walkers out of frame
  walkers.forEach(([x, phase, v]) => {
    const z = strollZ(t, phase);
    const vw = viewOf(cam, x, z, 0, -1);
    out.places.push(person(cam, passer(v), x, D0, z, vw,
      { mode: "stroll", phase: (t * 0.7 + v * 0.3) % 1, expr: "neutral", blink: lidAt(t, 990 + v) },
      { mode: "march", phase: (t * 0.7 + v * 0.3) % 1, expr: "neutral", blink: lidAt(t, 990 + v) }));
    blob(out, x, D0, z);
  });
  out.places.push(person(cam, passer(3), 4, D0, -38, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 993), look: 0 }, {}));
  blob(out, 4, D0, -38);
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, b: StoryState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "brewery": breweryCrowd(t, cam, out); break;
    case "vat": vatCrowd(t, cam, out); break;
    case "ring": ringCrowd(t, cam, out); break;
    case "burst": burstCrowd(t, cam, out, b); break;
    case "wave": waveCrowd(t, cam, out, b); break;
    case "wake": wakeCrowd(t, cam, out); break;
    case "tea": teaCrowd(t, cam, out); break;
    case "aftermath": aftermathCrowd(t, cam, out); break;
    case "court": courtCrowd(t, cam, out); break;
    case "theatre": theatreCrowd(t, cam, out); break;
    default: break;
  }
  return out;
};
