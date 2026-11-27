// Our cast as lit flat sprites in the 3D world — VIDEO07 (Victor Lustig).
// Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas per distinct
// drawing, so characters in step share canvases.
// Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones on land get a soft multiply contact blob.
// Effects are unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never
// outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, LUSTIG, POISSON, WAITER, POLICEMAN, dealer,
  fxShadow, fxContact, fxNewspaper, fxLetter, fxMoney, fxMoneyFlat, fxPigeon, fxCase, fxCup,
  Outfit, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS,
  hookZ, policeX, exitX, StoryState,
  clamp01, easeOutBack,
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
/** a newspaper lying flat on a table (600 x 400 drawing, feet at canvas bottom) */
const newspaper = (out: Stage, x: number, z: number, rot = 0) => {
  out.fx.push({ key: "paper", cw: 600, ch: 400, draw: (p) => fxNewspaper(p), x, y: 0.82, z, w: 0.85, h: 0.57, flat: true, rot });
};
/** a forged letter lying flat on a table — Tahap 6: y 0.885, just above the salon table top (0.85)
 *  and runner (0.87); at the old y 0.82 the card sat INSIDE the table box and never showed. */
const letter = (out: Stage, x: number, z: number, rot = 0) => {
  out.fx.push({ key: "letter", cw: 600, ch: 400, draw: (p) => fxLetter(p), x, y: 0.885, z, w: 0.7, h: 0.47, flat: true, rot });
};
/** a forged letter held up for the dealers to see: a camera-facing card at chest height
    (a flat letter is nearly edge-on from the salon cameras), sized to stay below the
    holder's chin so his face stays visible — the anatomy figure's easel, in the video.
    Tahap 5: u = progres angkatan (0 = masih di meja y 0.85, 1 = terangkat y 1.2, nilai akhir
    SAMA seperti sebelumnya); easeOutBack memberi sentakan ringan khas Playful di akhir. */
const letterUp = (out: Stage, x: number, z: number, u = 1) => {
  out.fx.push({ key: "letterUp", cw: 600, ch: 400, draw: (p) => fxLetter(p), x, y: 0.85 + 0.35 * easeOutBack(u), z, w: 0.62, h: 0.42 });
};
/** Tahap 5 — progres angkatan surat (0..1 mentah, kurva diterapkan di letterUp):
 *  naik 18 frame (0,6 dtk, standar Playful video) tepat saat VO menyebut suratnya. */
const raiseU = (t: number, a: number) => clamp01((t - a) / 0.6);
/** Tahap 5 — progres serah terima uang shot 5 (0..1 mentah, kurva diterapkan di money()):
 *  f774-819 (25,8-27,3 dtk, 45 frame): menahan di tangan Poisson selama "He picked one,
 *  Andre Poisson", bergerak saat "and took his money", mendarat sebelum L5 berakhir 28,43 dtk. */
const handOverU = (t: number) => clamp01((t - 25.8) / 1.5);
/** a pigeon pecking on the ground (small camera-facing card at ankle height) */
const pigeon = (out: Stage, x: number, z: number, rot = 0) => {
  out.fx.push({ key: "pigeon", cw: 300, ch: 200, draw: (p) => fxPigeon(p), x, y: 0.14, z, w: 0.42, h: 0.28, rot });
};

/** the bribe money, held up between two men: a camera-facing card at hand height, centred
 *  between Lustig and Poisson so it reads as an envelope passing between two hands —
 *  kept small (1.0 m) so it never covers either man's body.
 *  Tahap 5: u = progres serah terima (0 = di tangan Poisson `from`, 1 = di titik tengah
 *  sekarang, nilai akhir SAMA); easeOutBack mendorong uang 10% melewati titik tengah
 *  ke arah Lustig lalu mengendap kembali (uang "diserahkan"), plus busur naik 0,12 m
 *  di tengah lintasan (jalur melengkung, bukan garis lurus). y = tinggi serah terima
 *  (default 1.15 m, tangan orang berdiri; 1.0 m kalau yang menyerahkan sedang duduk). */
const money = (out: Stage, x: number, z: number, from: [number, number] = [x, z], u = 1, y = 1.15) => {
  const e = easeOutBack(u);
  const px = from[0] + (x - from[0]) * e, pz = from[1] + (z - from[1]) * e;
  const py = y + 0.12 * Math.sin(Math.PI * clamp01(u));
  out.fx.push({ key: "money", cw: 600, ch: 400, draw: (p) => fxMoney(p), x: px, y: py, z: pz, w: 1.0, h: 0.67 });
};
/** a stack of bills lying flat on the table, seen from above, with coins beside it
 *  (Tahap 6: y 0.89, just above the table runner at 0.87 — the old 0.87 z-fought with it). */
const moneyFlat = (out: Stage, x: number, z: number, rot = 0) => {
  out.fx.push({ key: "moneyFlat", cw: 600, ch: 400, draw: (p) => fxMoneyFlat(p), x, y: 0.89, z, w: 0.85, h: 0.57, flat: true, rot });
};
/** a suitcase standing by a fleeing man */
const suitcase = (out: Stage, x: number, z: number) => {
  out.fx.push({ key: "case", cw: 600, ch: 400, draw: (p) => fxCase(p), x, y: 0.42, z, w: 0.85, h: 0.57 });
  blob(out, x, 0, z, 0.8, 0.9);
};
/** a coffee cup on a table */
const cup = (out: Stage, x: number, z: number) => {
  out.fx.push({ key: "cup", cw: 300, ch: 300, draw: (p) => fxCup(p), x, y: 0.92, z, w: 0.3, h: 0.3 });
};

// ---------------- crowd by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

/** Lustig: small neat man in a dark suit, scar on the left cheek (scale 0.92) */
const lustig = (): Who => ({ i: 700, o: LUSTIG, okey: "lustig" });
/** Andre Poisson: stout, nervous, eager to rise in business circles */
const poisson = (): Who => ({ i: 710, o: POISSON, okey: "poisson" });
/** one of the five scrap dealers (v picks the suit + hat) */
const dealerWho = (v: number): Who => ({ i: 720 + v, o: dealer(v), okey: `d${v}` });
const waiter = (): Who => ({ i: 740, o: WAITER, okey: "waiter" });
const police = (i: number): Who => ({ i: 750 + i, o: POLICEMAN, okey: "pol" });
/** a Paris passer-by in a business suit */
const passer = (v: number): Who => ({ i: 760 + v, o: dealer(v + 2), okey: `p${v}` });

/** the hook (crowd "hook", shot 1): Lustig on the street south of the plaza with the tower
 *  behind him, gesturing at it like a salesman; passers-by stroll on the plaza behind him,
 *  pigeons peck on the cobbles near his feet */
const hookCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const z = hookZ(t);
  out.places.push(person(cam, lustig(), 0, D0, z, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 700), wave: 0.6 + 0.2 * Math.sin(t * 2.2), look: 0 }, {}, 0.92));
  blob(out, 0, D0, z, 0.92);
  const v1 = viewOf(cam, -5, -12, 0, 1);
  out.places.push(person(cam, passer(0), -5, D0, -12, v1,
    { mode: "stroll", phase: (t * 0.9) % 1, expr: "neutral", blink: lidAt(t, 760) },
    { mode: "march", phase: (t * 0.9) % 1, expr: "neutral", blink: lidAt(t, 760) }));
  blob(out, -5, D0, -12);
  const v2 = viewOf(cam, 6, -22, 0, -1);
  out.places.push(person(cam, passer(1), 6, D0, -22, v2,
    { mode: "stroll", phase: (t * 0.9 + 0.4) % 1, expr: "neutral", blink: lidAt(t, 761) },
    { mode: "march", phase: (t * 0.9 + 0.4) % 1, expr: "neutral", blink: lidAt(t, 761) }));
  blob(out, 6, D0, -22);
  const v3 = viewOf(cam, -8, -32, 0, 1);
  out.places.push(person(cam, passer(2), -8, D0, -32, v3,
    { mode: "stroll", phase: (t * 0.9 + 0.7) % 1, expr: "smile", blink: lidAt(t, 762) },
    { mode: "march", phase: (t * 0.9 + 0.7) % 1, expr: "smile", blink: lidAt(t, 762) }));
  blob(out, -8, D0, -32);
  pigeon(out, 2, 7, 0.4); pigeon(out, -2.5, 9, -0.8); pigeon(out, 3, 11, 2.2);
};

/** the cafe (crowd "cafe", shot 2): Lustig seated at the Vienna cafe table, newspaper in front of
 *  him, coffee cup, waiter standing by; one patron at the next table.
 *  Tahap 6: Lustig sits on the NORTH side of his table (z 25.2, facing south toward the camera and
 *  the table) — his chair back is behind him now, so his torso reads instead of hiding behind it.
 *  The newspaper lies FLAT on the table in front of him (a held-up card would cover his seated
 *  face: only 0.35 m of him is above the 0.75 m table, the card is 0.48 m tall). The patron moved
 *  to the north side of his table too, and 0.4 m east, so he is fully in frame. */
const cafeCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, lustig(), 38.5, D0, 25.2, { side: false, mirror: false },
    { mode: "sit", expr: "neutral", blink: lidAt(t, 700), look: 0 }, {}, 0.92));
  blob(out, 38.5, D0, 25.2, 0.92);
  newspaper(out, 38.5, 25.8, 0.2);
  newspaper(out, 38.6, 26.1, -0.15);
  cup(out, 38.9, 26.3);
  out.places.push(person(cam, waiter(), 36.2, D0, 24.5, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 740), look: 0 }, {}));
  blob(out, 36.2, D0, 24.5);
  out.places.push(person(cam, passer(2), 37.8, D0, 27.4, { side: false, mirror: false },
    { mode: "sit", expr: "smile", blink: lidAt(t, 762), look: 0 }, {}));
  blob(out, 37.8, D0, 27.4);
  cup(out, 37.6, 28.0);
};

/** the hotel meeting (crowd "hotel", shot 3): Lustig at the head of the salon table with the five
 *  dealers seated around it, forged letters spread on the table, waiter at the side.
 *  Tahap 6: Lustig moved north (z 2 -> 1.2) so the near-side dealer is no longer exactly on the
 *  sightline from the S3 camera to him (in still_360/still2_420 only his head showed above that
 *  dealer's top hat); the raised letter moved with him; the far-left dealer moved 0.5 m east so
 *  he is not cut by the frame edge; the waiter moved to the west door (his old spot was behind
 *  the S3 camera, so he never appeared). */
const hotelCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, lustig(), -49.5, D0, 1.2, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 700), wave: 0.5 + 0.2 * Math.sin(t * 2), look: 0 }, {}, 0.92));
  blob(out, -49.5, D0, 1.2, 0.92);
  // three dealers on the far side of the table, two on the near side (Poisson nearest the camera)
  // Tahap 6 (layout C, verified by projecting every head onto the S3a frame): the 9:16 frame only
  // spans table x -49..-46 at the far side, and the 1 m miniature at TABLE_POS x -46 throws a
  // ~170 px shadow across the middle — so only TWO dealers fit on the far side (v0 west of the
  // tower, v1 just east of it), and the third sits on the NEAR side between the other two
  // (v2 at x -46.0, clear of the tower, the letters and the caption). The earlier layout put v1
  // behind the tower lattice and v2 off the right edge entirely (still2_420).
  // Putaran 3 (27 Nov, referensi duduk bill): dudukan + bantal di world.ts kini
  // di tinggi pinggul sitter (bantal atas 0,43 m = hipY) dan tepi depannya 0,06-0,08 m
  // DI BELAKANG bidang kartu — tidak ada lagi yang menutupi paha. Paha di toon.ts kini
  // segmen tebal horizontal sampai lutut di 62u (di luar siluet torso), betis vertikal.
  // Hanya sitter sisi DEKAT yang duduk di kursi ini; sisi jauh (z 0,9) tersembunyi
  // di balik meja.
  const seats: [number, number, number][] = [[-48.0, 0.9, 0], [-46.4, 0.9, 1], [-47.5, 3.1, 3], [-45.7, 3.1, 2], [-44.5, 3.1, 4]];
  seats.forEach(([x, z, v]) => {
    const who = v === 4 ? poisson() : dealerWho(v);
    out.places.push(person(cam, who, x, D0, z, { side: false, mirror: false },
      { mode: "sit", expr: v === 4 ? "grin" : v === 1 ? "neutral" : "smile", blink: lidAt(t, 720 + v), look: 0 }, {}));
    blob(out, x, D0, z);
  });
  letterUp(out, -48.8, 1.4, raiseU(t, 12.2)); // Tahap 5: terangkat f366-384, saat L3 "forged government letters"
  letter(out, -46.5, 1.6, 0.1);
  letter(out, -45.2, 2.3, -0.4);
  out.places.push(person(cam, waiter(), -50, D0, -2.5, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 740), look: 0 }, {}));
  blob(out, -50, D0, -2.5);
};

/** the pitch (crowd "pitch", shot 4): Lustig pointing at the miniature tower on the table,
 *  Poisson leaning in eagerly, two dealers watching from behind.
 *  Tahap 6: the raised letter moved west of Lustig (it used to cover his chin/mouth in still2_555);
 *  Poisson moved to the near-side chair (z 3.5, a full metre south of the table edge) so the table
 *  no longer slices his face in half; both background dealers moved inward so they fit the 9:16
 *  frame (they were outside the left/right edges in still2_585). */
const pitchCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, lustig(), -46.8, D0, 1, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 700), wave: 0.7 + 0.15 * Math.sin(t * 2.4), look: 0 }, {}, 0.92));
  blob(out, -46.8, D0, 1, 0.92);
  // Perbaikan 27 Nov: all three sitters sit ON the salon chairs now (Poisson on the
  // (-44.5, 3.1) chair, dealerWho(0) on the (-45.8, 0.9) chair, dealerWho(2) on the
  // (-45.7, 3.1) chair) — before, they sat 0.3-0.7 m off the chairs and read as standing.
  // Putaran 2b: kursi di-yaw menghadap kamera dan kartu kembali ke tengah kursi (lihat
  // hotelCrowd); offset tepi-depan putaran 2a dicabut.
  out.places.push(person(cam, poisson(), -44.5, D0, 3.1, { side: false, mirror: false },
    { mode: "sit", expr: "grin", blink: lidAt(t, 710), look: 0 }, {}));
  blob(out, -44.5, D0, 3.1);
  out.places.push(person(cam, dealerWho(0), -45.8, D0, 0.9, { side: false, mirror: false },
    { mode: "sit", expr: "neutral", blink: lidAt(t, 720), look: 0 }, {}));
  blob(out, -45.8, D0, 0.9);
  out.places.push(person(cam, dealerWho(2), -45.7, D0, 3.1, { side: false, mirror: false },
    { mode: "sit", expr: "smile", blink: lidAt(t, 722), look: 0 }, {}));
  blob(out, -45.7, D0, 3.1);
  letterUp(out, -47.8, 0.9, raiseU(t, 18.2)); // Tahap 5: terangkat f546-564, saat L4 "He told them..."
  letter(out, -46.2, 1.9, 0.3);
};

/** the payoff (crowd "payoff", shot 5): Poisson hands over the envelope; Lustig pockets the
 *  money with a sly smile; two dealers watch from the back of the room.
 *  Tahap 6: dealerWho(3) stands at x -45.3 (projected: at -46.8 he was off the left edge,
 *  at -45.5 only just inside — -45.3 keeps his whole face in frame through the S5 glide). */
const payoffCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, lustig(), -46.2, D0, 1.2, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 700), look: 0 }, {}, 0.92));
  blob(out, -46.2, D0, 1.2, 0.92);
  // Perbaikan 27 Nov: the three dealers SIT at the table now (they stood next to empty
  // chairs before, which read as "should be sitting but isn't"). Poisson on the
  // (-44.5, 3.1) chair, dealerWho(1) on the (-45.2, 0.9) chair, dealerWho(3) on the
  // (-45.7, 3.1) chair. The handover money drops to y 1.0 — seated hand height.
  // Putaran 2b: kartu kembali ke tengah kursi (lihat hotelCrowd); uang kembali ke koordinat
  // semula (tangan Poisson -> titik tengah).
  out.places.push(person(cam, poisson(), -44.5, D0, 3.1, { side: false, mirror: false },
    { mode: "sit", expr: "smile", blink: lidAt(t, 710), look: 0 }, {}));
  blob(out, -44.5, D0, 3.1);
  money(out, -45.25, 2.1, [-44.5, 2.8], handOverU(t), 1.0); // Tahap 5: tangan Poisson -> titik tengah, f774-819
  moneyFlat(out, -44.6, 2.4, 0.3); // one small stack on Poisson's side; the second stack that covered Lustig is gone
  out.places.push(person(cam, dealerWho(1), -45.2, D0, 0.9, { side: false, mirror: false },
    { mode: "sit", expr: "neutral", blink: lidAt(t, 721), look: 0 }, {}));
  blob(out, -45.2, D0, 0.9);
  out.places.push(person(cam, dealerWho(3), -45.7, D0, 3.1, { side: false, mirror: false },
    { mode: "sit", expr: "neutral", blink: lidAt(t, 723), look: 0 }, {}));
  blob(out, -45.7, D0, 3.1);
};

/** the wait (crowd "wait", shot 6): Vienna cafe again — Lustig with a stack of French newspapers,
 *  checking for news that never comes; the waiter hovers, one patron reads nearby.
 *  Tahap 6: same north-side seating as shot 2 (Lustig at z 25.2, chair back behind him); the papers
 *  moved to the table's north half in front of him and tightened so none spills past the table edge
 *  (in still_960 one sheet stuck out like a paper plane); the patron moved to his table's north side. */
const waitCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, lustig(), 38.5, D0, 25.2, { side: false, mirror: false },
    { mode: "sit", expr: "nervous", blink: lidAt(t, 700), look: 0 }, {}, 0.92));
  blob(out, 38.5, D0, 25.2, 0.92);
  newspaper(out, 38.3, 25.7, 0.1);
  newspaper(out, 38.7, 25.8, -0.2);
  newspaper(out, 38.5, 26.0, 0.3);
  cup(out, 39.0, 26.2);
  out.places.push(person(cam, waiter(), 36.2, D0, 24.5, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 740), look: 0 }, {}));
  blob(out, 36.2, D0, 24.5);
  out.places.push(person(cam, passer(2), 37.8, D0, 27.4, { side: false, mirror: false },
    { mode: "sit", expr: "neutral", blink: lidAt(t, 762), look: 0 }, {}));
  blob(out, 37.8, D0, 27.4);
  cup(out, 37.6, 28.0);
};

/** Poisson alone (crowd "poisson", shot 7): the street under the tower, Poisson head down,
 *  too embarrassed to call the police; two passers-by far behind him, pigeons on the cobbles.
 *  Tahap 6: Poisson moved 4 m closer to the camera (z -15 -> -11) — at 15 m he was ~10% of the
 *  frame and his dazed face was unreadable (still_1050/still2_1110). */
const poissonCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, poisson(), 0, D0, -11, { side: false, mirror: false },
    { mode: "stand", expr: "dazed", blink: lidAt(t, 710), look: 0 }, {}));
  blob(out, 0, D0, -11);
  const v1 = viewOf(cam, -5, -28, 0, 1);
  out.places.push(person(cam, passer(0), -5, D0, -28, v1,
    { mode: "stroll", phase: (t * 0.9 + 0.2) % 1, expr: "neutral", blink: lidAt(t, 760) },
    { mode: "march", phase: (t * 0.9 + 0.2) % 1, expr: "neutral", blink: lidAt(t, 760) }));
  blob(out, -5, D0, -28);
  const v2 = viewOf(cam, 7, -26, 0, -1);
  out.places.push(person(cam, passer(1), 7, D0, -26, v2,
    { mode: "stroll", phase: (t * 0.9 + 0.6) % 1, expr: "smile", blink: lidAt(t, 761) },
    { mode: "march", phase: (t * 0.9 + 0.6) % 1, expr: "smile", blink: lidAt(t, 761) }));
  blob(out, 7, D0, -26);
  const v3 = viewOf(cam, -4, -20, 0, 1);
  out.places.push(person(cam, passer(2), -4, D0, -20, v3,
    { mode: "stroll", phase: (t * 0.9 + 0.3) % 1, expr: "neutral", blink: lidAt(t, 762) },
    { mode: "march", phase: (t * 0.9 + 0.3) % 1, expr: "neutral", blink: lidAt(t, 762) }));
  blob(out, -4, D0, -20);
  pigeon(out, 2, -10, 0.9); pigeon(out, -3, -18, -1.4); pigeon(out, 4, -20, 2.6);
};

/** the return (crowd "return", shot 8): the salon again — Lustig with fresh
 *  letters and FIVE NEW dealers around the table. Same fixes as shot 3 (tahap 6): Lustig north
 *  so he is not hidden behind the near-side dealer, raised letter with him, far-left dealer
 *  0.5 m east, waiter by the west door. */
const returnCrowd = (t: number, cam: CamInfo, out: Stage) => {
  out.places.push(person(cam, lustig(), -49.5, D0, 1.2, { side: false, mirror: false },
    { mode: "stand", expr: "grin", blink: lidAt(t, 700), wave: 0.5 + 0.2 * Math.sin(t * 2), look: 0 }, {}, 0.92));
  blob(out, -49.5, D0, 1.2, 0.92);
  // Tahap 6: same layout C as shot 3 (see hotelCrowd) — two dealers on the far side, three on
  // the near side, all five heads inside the frame and clear of the miniature tower.
  // Putaran 2b: kartu kembali ke tengah kursi (lihat hotelCrowd).
  const seats: [number, number, number][] = [[-48.0, 0.9, 5], [-46.4, 0.9, 6], [-47.5, 3.1, 8], [-45.7, 3.1, 7], [-44.5, 3.1, 9]];
  seats.forEach(([x, z, v]) => {
    out.places.push(person(cam, dealerWho(v), x, D0, z, { side: false, mirror: false },
      { mode: "sit", expr: v === 7 ? "grin" : v === 5 ? "neutral" : "smile", blink: lidAt(t, 720 + v), look: 0 }, {}));
    blob(out, x, D0, z);
  });
  letterUp(out, -48.8, 1.4, raiseU(t, 41.2)); // Tahap 5: terangkat f1236-1254, saat L8 "exact same trick"
  letter(out, -46.5, 1.6, -0.2);
  letter(out, -45.2, 2.3, 0.4);
  out.places.push(person(cam, waiter(), -50, D0, -2.5, { side: false, mirror: false },
    { mode: "stand", expr: "neutral", blink: lidAt(t, 740), look: 0 }, {}));
  blob(out, -50, D0, -2.5);
};

/** the police (crowd "police", shot 9): two policemen walk in through the east door, dealers
 *  react in shock, Lustig slips out the west door with his suitcase */
const policeCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const px = policeX(t);
  for (let i = 0; i < 2; i++) {
    const x = px + i * 0.6, z = 5 + i * 1.4;
    const v = viewOf(cam, x, z, -1, 0);
    out.places.push(person(cam, police(i), x, D0, z, v,
      { mode: "stroll", phase: (t * 0.9 + i * 0.3) % 1, expr: "stern", blink: lidAt(t, 750 + i) },
      { mode: "march", phase: (t * 0.9 + i * 0.3) % 1, expr: "stern", blink: lidAt(t, 750 + i) }));
    blob(out, x, D0, z);
  }
  const ex = exitX(t);
  const vl = viewOf(cam, ex, -2, -1, 0);
  out.places.push(person(cam, lustig(), ex, D0, -2, vl,
    { mode: "stroll", phase: (t * 1.1) % 1, expr: "nervous", blink: lidAt(t, 700) },
    { mode: "march", phase: (t * 1.1) % 1, expr: "nervous", blink: lidAt(t, 700) }, 0.92));
  blob(out, ex, D0, -2, 0.92);
  suitcase(out, ex + 0.9, -1.2);
  // three dealers at the table, frozen in shock
  // Tahap 6: the third dealer (i=2) stands at the table's EAST end, facing the police walking in —
  // he is the shocked witness in the new S9a frame (his old seat was behind the S9a camera).
  // The other two dealers stay at their seats; they are outside the S9a frame, which is fine.
  for (const [i, x, z] of [[0, -47.5, 0.9], [1, -45.5, 0.9], [2, -42.2, 2.2]] as const) {
    out.places.push(person(cam, dealerWho(i + 5), x, D0, z, { side: false, mirror: false },
      { mode: "stand", expr: "shock", blink: lidAt(t, 725 + i, [46]), look: 0 }, {}));
    blob(out, x, D0, z);
  }
};

/** the sunset (crowd "sunset", shot 10, golden): the tower standing majestic over the plaza,
 *  a few distant pedestrians for scale — Lustig is gone */
const sunsetCrowd = (t: number, cam: CamInfo, out: Stage) => {
  const walkers: [number, number, number, number][] = [[-10, -20, 0, 1], [6, -25, 1, -1], [-4, -42, 2, 1], [12, -34, 3, -1]];
  walkers.forEach(([x, z, v, dz]) => {
    const vw = viewOf(cam, x, z, 0, dz);
    out.places.push(person(cam, passer(v), x, D0, z, vw,
      { mode: "stroll", phase: (t * 0.7 + v * 0.3) % 1, expr: "neutral", blink: lidAt(t, 760 + v) },
      { mode: "march", phase: (t * 0.7 + v * 0.3) % 1, expr: "neutral", blink: lidAt(t, 760 + v) }));
    blob(out, x, D0, z);
  });
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, b: StoryState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.crowd) {
    case "hook": hookCrowd(t, cam, out); break;
    case "cafe": cafeCrowd(t, cam, out); break;
    case "hotel": hotelCrowd(t, cam, out); break;
    case "pitch": pitchCrowd(t, cam, out); break;
    case "payoff": payoffCrowd(t, cam, out); break;
    case "wait": waitCrowd(t, cam, out); break;
    case "poisson": poissonCrowd(t, cam, out); break;
    case "return": returnCrowd(t, cam, out); break;
    case "police": policeCrowd(t, cam, out); break;
    case "sunset": sunsetCrowd(t, cam, out); break;
    default: break;
  }
  return out;
};

export { FPS };
