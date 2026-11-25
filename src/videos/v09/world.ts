// VIDEO09: the whole place as one three.js scene — London, 17 October 1814:
// (1) the Horse Shoe Brewery interior (west): the giant 22 ft vat, iron rings, platform,
//     barrels, and the east door the wave smashes through;
// (2) the St Giles street (north-south): slum houses, the cellar wake below street level,
//     the cottage room where the mother holds her child at tea, the flooded lane;
// (3) the courtroom (east, one shot); (4) the Dominion Theatre facade (north end, golden hour).
// Posed every frame from the story timeline (story.ts).
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
// Light rig / sky / fog / clouds follow the bridge template.
// NOTE: no kit GLB props exist (the bridge/kenney folder is missing), so every prop here is
// built from code: boxGeo geometry, cylinders, and VEG cartoon plants. kitClone returns null
// for all GLB names and the FOREGROUND loop in world.ts is a no-op (FOREGROUND is empty).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, boxGeo, V, lam, house, prop, Kit, kitClone } from "./build";
import { ctex, cobbleHD, stoneHD, planksHD, cloudHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, storyState, VAT_POS, CELLAR_POS, COTTAGE_POS, FOREGROUND, ShotDef } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "lily_large", "lantern", "cart", "stall-red",
  "stall-green", "stall-bench", "banner-red", "banner-green", "windmill", "canoe"];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

// ---------------- painted canvas textures ----------------
/** sun disc (solid, soft rim) and the flat golden halo */
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** "MEUX & CO" painted sign on the brewery hall's north wall: cream letters on dark brown */
const meuxTex = () => ctex("meuxSign", 512, 128, (g) => {
  g.fillStyle = "#3a2418"; g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#c9a24a"; g.fillRect(24, 100, 464, 4);
  g.fillStyle = "#f1e6c8"; g.font = "bold 62px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("MEUX & CO", 256, 58);
});
/** "DOMINION" theatre sign: gold letters on dark red (the board is 14 m x 1.5 m, texture 4:1) */
const dominionTex = () => ctex("dominionSign", 1024, 256, (g) => {
  g.fillStyle = "#7a1e22"; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = "#c9a24a"; g.lineWidth = 10; g.strokeRect(14, 14, 996, 228);
  g.fillStyle = "#e8c45a"; g.font = "bold 150px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("DOMINION", 512, 128);
});
/** red-and-cream striped marquee cloth */
const marqueeTex = () => ctex("marquee", 512, 256, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f1ece0" : "#c0353a"; g.fillRect(i * 64, 0, 64, 256); }
  g.fillStyle = "rgba(0,0,0,0.08)"; for (let x = 0; x < 512; x += 8) g.fillRect(x, 0, 2, 256);
});
/** the Royal coat of arms, simplified, for the courtroom's north wall: gold frame, red shield, crown */
const armsTex = () => ctex("arms", 256, 320, (g) => {
  g.fillStyle = "#e9ddc2"; g.fillRect(0, 0, 256, 320);
  g.strokeStyle = "#c9a24a"; g.lineWidth = 10; g.strokeRect(8, 8, 240, 304);
  g.fillStyle = "#c0353a";
  g.beginPath(); g.moveTo(48, 70); g.lineTo(208, 70); g.lineTo(208, 180); g.quadraticCurveTo(208, 250, 128, 280); g.quadraticCurveTo(48, 250, 48, 180); g.closePath(); g.fill();
  g.fillStyle = "#e8c45a";
  g.beginPath(); g.moveTo(88, 60); g.lineTo(88, 30); g.lineTo(108, 48); g.lineTo(128, 22); g.lineTo(148, 48); g.lineTo(168, 30); g.lineTo(168, 60); g.closePath(); g.fill();
  g.fillRect(88, 60, 80, 10);
  g.fillStyle = "#f1e6c8"; g.font = "bold 44px Arial, sans-serif"; g.textAlign = "center";
  g.fillText("G R", 128, 150);
});
/** warm plaster for the courtroom walls: cream panels with a dado line */
const plasterTex = () => ctex("plaster", 512, 512, (g) => {
  g.fillStyle = "#e9ddc2"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(120,90,40,0.05)";
  for (let i = 0; i < 400; i++) g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  g.strokeStyle = "rgba(120,90,40,0.28)"; g.lineWidth = 3;
  for (let x = 64; x < 512; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  g.strokeStyle = "rgba(120,90,40,0.4)"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(0, 384); g.lineTo(512, 384); g.stroke(); // dado line (texture v maps to wall height)
});
/** the wave face gradient (v05 fxWave palette): lit top, dark base, with a glossy rim,
 *  broad sheen bands and thin flow streaks painted in. Canvas top (y=0) is v=1, the crest. */
const waveFaceTex = () => ctex("waveFace", 256, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#8a4a1c"); gr.addColorStop(0.18, "#6e3a15"); gr.addColorStop(0.55, "#4a2408"); gr.addColorStop(1, "#2e1503");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "rgba(224,170,99,0.55)"; g.fillRect(0, 0, 256, 10); // glossy rim just under the crest
  g.fillStyle = "rgba(242,194,126,0.4)"; g.fillRect(0, 10, 256, 6);
  g.globalAlpha = 0.22; g.fillStyle = "#c99a5a"; // broad sheen bands running down from the crest
  for (const [x, w, lean] of [[40, 26, -14], [110, 20, 10], [180, 28, -8], [225, 18, 12]] as const) {
    g.beginPath(); g.moveTo(x - w / 2, 16); g.lineTo(x + w / 2, 16);
    g.lineTo(x + w / 2 + lean, 300); g.lineTo(x - w / 2 + lean, 300); g.closePath(); g.fill();
  }
  g.globalAlpha = 0.3; g.strokeStyle = "#2e1503"; g.lineWidth = 5; // thin dark flow streaks
  for (const [x, len] of [[70, 200], [140, 260], [205, 180]] as const) {
    g.beginPath(); g.moveTo(x, 20); g.quadraticCurveTo(x + 10, 20 + len / 2, x - 4, 20 + len); g.stroke();
  }
  g.globalAlpha = 1;
});
const SUN_SHOT: Record<number, { az?: number; el?: number }> = {};

type Mats = Record<string, THREE.Material>;

/** stage() result, mirrored structurally so this file does not depend on cast.ts's exact Stage type */
type StageLike = {
  places: { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number] }[];
  fx: { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean }[];
};
const stageFn = stage as unknown as (id: number, t: number, b: unknown, cam: { pos: THREE.Vector3; right: THREE.Vector3 }) => StageLike;

/** a box beam from point a to point b, thickness th (metres), added to the batch.
 *  The unit-height box (y 0..1) is stretched along the a->b direction. */
const beamBetween = (b: Batch, mat: THREE.Material, ax: number, ay: number, az: number, bx: number, by: number, bz: number, th: number) => {
  const dir = new THREE.Vector3(bx - ax, by - ay, bz - az), len = dir.length();
  if (len < 0.01) return;
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const m = new THREE.Matrix4().compose(new THREE.Vector3(ax, ay, az), quat, new THREE.Vector3(1, len, 1));
  b.add(boxGeo(V(-th / 2, 0, -th / 2), V(th / 2, 1, th / 2), 0), mat, m);
};

/** a wooden vat into a batch: tapered cylinder (rBottom -> rTop over height h) + iron hoops.
 *  (cx, cz) = centre, y0 = base height. Hoops sit at the given heights (fractions of h). */
const vatAt = (b: Batch, wood: THREE.Material, iron: THREE.Material, cx: number, cz: number, rBottom: number, rTop: number, h: number, y0: number, hoops: number[]) => {
  const m = new THREE.Matrix4().makeTranslation(cx, y0 + h / 2, cz);
  b.add(new THREE.CylinderGeometry(rTop, rBottom, h, 24), wood, m);
  for (const f of hoops) {
    const y = y0 + f * h, r = rBottom + (rTop - rBottom) * f;
    b.add(new THREE.CylinderGeometry(r + 0.05, r + 0.05, 0.13, 24), iron, new THREE.Matrix4().makeTranslation(cx, y, cz));
  }
};
/** a barrel into a batch: staved cylinder + two iron hoops, standing on the floor at (cx, cz) */
const barrelAt = (b: Batch, wood: THREE.Material, iron: THREE.Material, cx: number, cz: number, r = 0.36, h = 0.9, y0 = 0) => {
  b.add(new THREE.CylinderGeometry(r * 0.88, r * 0.88, h, 14), wood, new THREE.Matrix4().makeTranslation(cx, y0 + h / 2, cz));
  for (const f of [0.18, 0.82]) {
    const y = y0 + f * h;
    b.add(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.06, 14), iron, new THREE.Matrix4().makeTranslation(cx, y, cz));
  }
};
/** a simple wooden chair (legs, seat, cushion, slatted back) into a batch, facing +z locally */
const chairAt = (b: Batch, wood: THREE.Material, cushion: THREE.Material, cx: number, cz: number, yaw: number, y0 = 0) => {
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(cx, y0, cz);
  for (const [lx, lz] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]] as const)
    b.add(boxGeo(V(lx - 0.04, 0, lz - 0.04), V(lx + 0.04, 0.42, lz + 0.04), 0), wood, m); // legs
  b.add(boxGeo(V(-0.3, 0.4, -0.3), V(0.3, 0.48, 0.3), 0), wood, m); // seat
  b.add(boxGeo(V(-0.27, 0.48, -0.27), V(0.27, 0.54, 0.27), 0), cushion, m); // cushion
  b.add(boxGeo(V(-0.3, 0.54, -0.3), V(-0.22, 1.08, -0.22), 0), wood, m); // back posts
  b.add(boxGeo(V(0.22, 0.54, -0.3), V(0.3, 1.08, -0.22), 0), wood, m);
  b.add(boxGeo(V(-0.3, 0.98, -0.3), V(0.3, 1.08, -0.22), 0), wood, m); // top rail
  b.add(boxGeo(V(-0.1, 0.54, -0.3), V(-0.04, 0.98, -0.22), 0), wood, m); // slats
  b.add(boxGeo(V(0.04, 0.54, -0.3), V(0.1, 0.98, -0.22), 0), wood, m);
};
/** a street lamp built from code (no kit GLB): iron post, lamp head, warm glowing core */
const lampAt = (b: Batch, iron: THREE.Material, glow: THREE.Material, x: number, z: number) => {
  b.add(boxGeo(V(x - 0.07, 0, z - 0.07), V(x + 0.07, 3.0, z + 0.07), 0), iron);
  b.add(boxGeo(V(x - 0.22, 3.0, z - 0.22), V(x + 0.22, 3.1, z + 0.22), 0), iron);
  b.add(boxGeo(V(x - 0.16, 3.1, z - 0.16), V(x + 0.16, 3.55, z + 0.16), 0), glow);
  b.add(boxGeo(V(x - 0.24, 3.55, z - 0.24), V(x + 0.24, 3.65, z + 0.24), 0), iron);
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden" | "warm", THREE.Texture[]>;
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  // ---- dynamic props (posed per frame in update()) ----
  private ring: THREE.Mesh;
  private wave: THREE.Group;
  private flood: THREE.Mesh;
  private cottageFlood: THREE.Mesh;
  private foamStreaks: THREE.Mesh[] = [];
  private vat2: THREE.Group;
  private vatTop: THREE.Group;
  private staves: THREE.Mesh[] = [];
  private floatBarrels: THREE.Group[] = [];
  private cellarLight: THREE.PointLight;

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
    // ---- sky + light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)), warm: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.warm.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 420 + (i % 3) * 50;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 120 + (i % 4) * 25;
      m.position.set(Math.cos(a) * d, 28 + (i % 4) * 6, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- shared materials ----
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.sidewalk = lam("sidewalk", () => ({ map: stoneHD("sidewalk", ["#d9cfc0", "#cfc4b2", "#e0d6c6", "#c8bdaa"], "#a89a86") }));
    M.brick = lam("breweryBrick", () => ({ map: stoneHD("breweryBrick", ["#8a4a3a", "#7a4034", "#94544a", "#6e3a30"], "#5a342a") }));
    M.woodDark = lam("woodDark", () => ({ color: "#5a3b2a" }));
    M.wood = lam("wood", () => ({ color: "#8a6a44" }));
    M.vatWood = lam("vatWood", () => ({ map: planksHD() }));
    M.iron = lam("iron", () => ({ color: "#3a3a3a" }));
    M.brass = lam("brass", () => ({ color: "#c9a24a" }));
    M.porter = lam("porter", () => ({ color: "#4a2408" }));
    M.beer = lam("beer", () => ({ color: "#5a2e0e" }));
    M.foam = lam("beerFoam", () => ({ color: "#e8d9a8" }));
    M.white = lam("porcelain", () => ({ color: "#f1ece0" }));
    M.red = lam("carpetRed", () => ({ color: "#8a2a2e" }));
    M.glow = new THREE.MeshBasicMaterial({ color: "#ffdca0" });
    M.windowGlow = new THREE.MeshBasicMaterial({ color: "#ffe9c8" });
    M.meux = lam("meuxSign", () => ({ map: meuxTex() }));
    M.dominion = lam("dominionSign", () => ({ map: dominionTex() }));
    M.marquee = lam("marquee", () => ({ map: marqueeTex() }));
    M.arms = lam("arms", () => ({ map: armsTex() }));
    M.cream = lam("theatreCream", () => ({ map: stoneHD("theatreCream", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));

    // ---- static land: the St Giles street, sidewalks, doorsteps ----
    const b = new Batch();
    // street cobbles (x -12..12, z -45..45) + the brewery door lane
    b.add(quadAt(-12, 12, -45, 45, 0, 8, 30), M.cobble);
    // west sidewalk in two runs (the cellar stairwell, z 13..19, stays open)
    b.add(quadAt(-16, -12, -45, 13, 0.02, 2, 20), M.sidewalk);
    b.add(quadAt(-16, -12, 19, 45, 0.02, 2, 20), M.sidewalk);
    // east sidewalk (runs past the cottage front, z 24..32)
    b.add(quadAt(12, 16, -45, 45, 0.02, 2, 30), M.sidewalk);
    // doorsteps where the aftermath watchers stand (0.4 m raised)
    b.add(boxGeo(V(-14.3, 0, 7.2), V(-12.7, 0.4, 8.8), 0), M.sidewalk);
    b.add(boxGeo(V(12.7, 0, 17.2), V(14.3, 0.4, 18.8), 0), M.sidewalk);

    // ---- slum houses lining the street (gabled, small, varied) ----
    // east side, fronts face west (-x): yaw -PI/2. The cottage (z 24..32) and the
    // courtroom (x 30..48) leave gaps; the theatre stands at the north end.
    house(b, 20, -36, -Math.PI / 2, 8, 10, 6, 2);
    house(b, 20, -24, -Math.PI / 2, 8, 10, 5, 5);
    house(b, 20, -12, -Math.PI / 2, 8, 10, 6, 0);
    house(b, 20, 0, -Math.PI / 2, 8, 10, 5, 7);
    house(b, 20, 12, -Math.PI / 2, 8, 10, 6, 3);
    house(b, 20, 40, -Math.PI / 2, 8, 10, 6, 6);
    // west side, fronts face east (+x): yaw +PI/2. No house over the cellar (z 13..19)
    // or the brewery hall (z -12..10, x -44..-12).
    house(b, -20, -36, Math.PI / 2, 8, 10, 6, 4);
    house(b, -20, -24, Math.PI / 2, 8, 10, 5, 1);
    house(b, -20, 28, Math.PI / 2, 8, 10, 6, 6);
    house(b, -20, 40, Math.PI / 2, 8, 10, 5, 2);

    // ---- street lamps built from code (the kit lantern GLB does not exist) ----
    for (const [x, z] of [[-10.5, -30], [10.5, -10], [-10.5, 10], [10.5, 30]] as const)
      lampAt(b, M.iron, M.glow, x, z);
    // two small bushes by the theatre steps (kept small: bushes blow up near the camera)
    for (const [x, z] of [[-13, -42], [13, -42]] as const)
      prop(b, kit, "plant_bush", x, 0, z, 1.0, x);
    b.build(R);

    // ---- the Horse Shoe Brewery hall (interior room, west): x -44..-12, z -12..10, H 7 ----
    const hb = new Batch();
    const H = { floor: lam("breweryFloor", () => ({ map: planksHD() })), wall: M.brick, beam: M.woodDark, sign: M.meux, vat: M.vatWood, iron: M.iron, wood: M.wood, glow: M.glow };
    const HX0 = -44, HX1 = -12, HZ0 = -12, HZ1 = 10, HH = 7;
    hb.add(quadAt(HX0, HX1, HZ0, HZ1, 0.03, 16, 11), H.floor);
    // walls (0.3 thick); east wall has the door gap at z 2..5 (the wave's exit)
    hb.add(boxGeo(V(HX0, 0, HZ0), V(HX0 + 0.3, HH, HZ1), 0), H.wall); // west wall
    hb.add(boxGeo(V(HX0, 0, HZ0), V(HX1, HH, HZ0 + 0.3), 0), H.wall); // north wall
    hb.add(boxGeo(V(HX0, 0, HZ1 - 0.3), V(HX1, HH, HZ1), 0), H.wall); // south wall
    hb.add(boxGeo(V(HX1 - 0.3, 0, HZ0), V(HX1, HH, 2), 0), H.wall); // east wall, north of the door
    hb.add(boxGeo(V(HX1 - 0.3, 0, 5), V(HX1, HH, HZ1), 0), H.wall); // east wall, south of the door
    hb.add(boxGeo(V(HX1 - 0.3, 4, 2), V(HX1, HH, 5), 0), H.wall); // lintel over the door
    hb.add(boxGeo(V(HX0, HH, HZ0), V(HX1, HH + 0.15, HZ1), 0, true), H.wall); // ceiling slab
    // timber beams across the ceiling (every 4 m)
    for (let z = -10; z <= 8; z += 4) hb.add(boxGeo(V(HX0, 6.4, z - 0.15), V(HX1, 6.7, z + 0.15), 0), H.beam);
    // (no painted MEUX sign: it was tried on the north wall and the west wall, and the vat /
    // platform always cut it to a partial word — a half-visible sign reads as a rendering error)
    // foreground barrels + crate by the vat's east side (fills the bare floor at frame right)
    barrelAt(hb, H.vat, H.iron, -23.5, 4.5); barrelAt(hb, H.vat, H.iron, -22.5, 3.5);
    hb.add(boxGeo(V(-25.0, 0, 5.2), V(-24.0, 1.0, 6.2), 0), H.wood);
    // (no barrel south of the platform: it never showed in S3 and would loom huge in S2's
    // foreground from the west camera)
    // hanging lamps: chain + shade + warm core (two, over the vat and the work floor)
    for (const [lx, lz] of [[-30, 2], [-38, -5]] as const) {
      hb.add(boxGeo(V(lx - 0.03, 5.6, lz - 0.03), V(lx + 0.03, 7, lz + 0.03), 0), H.iron);
      hb.add(boxGeo(V(lx - 0.35, 5.3, lz - 0.35), V(lx + 0.35, 5.6, lz + 0.35), 0), H.beam);
      hb.add(boxGeo(V(lx - 0.14, 5.05, lz - 0.14), V(lx + 0.14, 5.3, lz + 0.14), 0), H.glow);
    }
    // the giant vat: 22 ft (6.7 m) tall, tapered, iron hoops at 15/40/65% height.
    // The top 1.7 m is a separate dynamic mesh (vatTop) so it can fly off in the burst.
    vatAt(hb, H.vat, H.iron, VAT_POS[0], VAT_POS[2], 2.4, 2.28, 5.0, 0, [0.15, 0.4, 0.65]);
    // the second vat (dynamic: it topples in the burst) is built as its own group below;
    // its static shadow-mate is skipped — the group itself stands at (-38, 0, 4).
    // barrel stacks + crates along the walls
    barrelAt(hb, H.vat, H.iron, -38, 6); barrelAt(hb, H.vat, H.iron, -37.2, 6); barrelAt(hb, H.vat, H.iron, -37.6, 6, 0.36, 0.9, 0.9);
    barrelAt(hb, H.vat, H.iron, -40, -6); barrelAt(hb, H.vat, H.iron, -39.2, -6);
    barrelAt(hb, H.vat, H.iron, -20, -8); barrelAt(hb, H.vat, H.iron, -19.2, -8);
    hb.add(boxGeo(V(-42.6, 0, 7.4), V(-41.4, 1.1, 8.6), 0), H.wood); // crates
    hb.add(boxGeo(V(-42.6, 1.1, 7.4), V(-41.6, 2.0, 8.4), 0), H.wood);
    hb.add(boxGeo(V(-20.6, 0, 7.4), V(-19.4, 1.0, 8.6), 0), H.wood);
    hb.add(boxGeo(V(-42.6, 0, -8.6), V(-41.4, 1.0, -7.4), 0), H.wood);
    // workbench along the south wall
    hb.add(boxGeo(V(-26, 0.8, 8.6), V(-22, 0.9, 9.6), 0), H.wood);
    for (const [lx, lz] of [[-25.8, 8.8], [-25.8, 9.4], [-22.2, 8.8], [-22.2, 9.4]] as const)
      hb.add(boxGeo(V(lx - 0.07, 0, lz - 0.07), V(lx + 0.07, 0.8, lz + 0.07), 0), H.beam);
    // Crick's platform deck (y 4.0) on the vat's south side, with railing + stairs.
    // Deck: x -33.5..-26.5, z 3..6.5; posts down to the floor; railing on the north
    // (vat side) and east edges; stairs down at the east end.
    hb.add(boxGeo(V(-33.5, 3.85, 3), V(-26.5, 4.0, 6.5), 0), H.wood);
    // two support posts at the deck's west end only: the east posts stood 5 m from the
    // southeast cameras and read as huge blank pillars splitting the frame (the deck's east
    // end reads as carried by the vat it abuts)
    for (const [px, pz] of [[-33.2, 3.3], [-33.2, 6.2]] as const)
      hb.add(boxGeo(V(px - 0.12, 0, pz - 0.12), V(px + 0.12, 3.85, pz + 0.12), 0), H.beam);
    for (const px of [-33.3, -30, -26.7] as const) { // north railing posts (vat side)
      hb.add(boxGeo(V(px - 0.05, 4.0, 3.0 - 0.05), V(px + 0.05, 5.0, 3.0 + 0.05), 0), H.beam);
    }
    hb.add(boxGeo(V(-33.5, 4.9, 2.95), V(-26.5, 5.0, 3.05), 0), H.beam); // north rail
    // no east railing: from the southeast cameras it cuts diagonally across the men on the deck
    for (let i = 0; i < 5; i++) { // stairs down the WEST end (x -36..-33.5, 5 steps) — the east
      // end is 4-5 m from the southeast cameras, where the stairs blew up into blank boxes
      const x0 = -33.5 - (i + 1) * 0.5, y = 4 - (i + 1) * 0.8;
      hb.add(boxGeo(V(x0, y, 5.0), V(x0 + 0.5, y + 0.8, 6.5), 0), H.wood);
    }
    hb.build(R);

    // ---- the wake cellar (below street level, west side): x -18..-12, z 13..19, floor y -2.2 ----
    // An open stairwell (x -13.5..-12, z 14.5..17.5) leads down from the street; the room's
    // ceiling is the street itself. The wake is seen through the stairwell from the street:
    // a closed coffin on trestles, candles, five mourner silhouettes (cast.ts).
    const cb = new Batch();
    const C = { floor: lam("cellarFloor", () => ({ map: planksHD() })), wall: M.brick, wood: M.woodDark, coffin: lam("coffin", () => ({ color: "#2b1d16" })), candle: M.glow, cloth: M.white };
    const CX0 = -18, CX1 = -12, CZ0 = 13, CZ1 = 19, CF = -2.2;
    cb.add(quadAt(CX0, CX1, CZ0, CZ1, CF, 3, 3), C.floor);
    // walls up to street level (east wall has the stairwell opening at z 14.5..17.5)
    cb.add(boxGeo(V(CX0, CF, CZ0), V(CX0 + 0.3, 0, CZ1), 0), C.wall); // west wall
    cb.add(boxGeo(V(CX0, CF, CZ0), V(CX1, 0, CZ0 + 0.3), 0), C.wall); // north wall
    cb.add(boxGeo(V(CX0, CF, CZ1 - 0.3), V(CX1, 0, CZ1), 0), C.wall); // south wall
    cb.add(boxGeo(V(CX1 - 0.3, CF, CZ0), V(CX1, 0, 14.5), 0), C.wall); // east wall, north of the stairwell
    cb.add(boxGeo(V(CX1 - 0.3, CF, 17.5), V(CX1, 0, CZ1), 0), C.wall); // east wall, south of the stairwell
    // NO ceiling slab over the cellar: the slab covered the whole pit except a 1.5 x 3 m stair
    // hole, so the coffin and mourners (which sit west of the hole) were invisible from every
    // street camera, and the low S6 camera could not clear the parapet or the flood plane
    // anyway. The cellar is an open pit now; the stairs + parapet + sunken floor still read
    // as a cellar, and the wake is visible from above.
    // five steps down the stairwell (x -12 -> -13.5, 0.44 m each)
    for (let i = 0; i < 5; i++) {
      const x0 = -12 - i * 0.3, y = -(i + 1) * 0.44;
      cb.add(boxGeo(V(x0 - 0.3, y, 14.5), V(x0, y + 0.44, 17.5), 0), C.wall);
    }
    // parapet walls flanking the stairwell at street level
    cb.add(boxGeo(V(-13.5, 0, 14.3), V(-12, 1.0, 14.5), 0), C.wall);
    cb.add(boxGeo(V(-13.5, 0, 17.5), V(-12, 1.0, 17.7), 0), C.wall);
    // the coffin on trestles (closed box — never a body) + candles
    cb.add(boxGeo(V(-16.6, -1.9, 15.65), V(-14.4, -1.4, 16.35), 0), C.coffin);
    for (const [tx, tz] of [[-16.4, 15.8], [-16.4, 16.2], [-14.6, 15.8], [-14.6, 16.2]] as const)
      cb.add(boxGeo(V(tx - 0.08, -2.2, tz - 0.08), V(tx + 0.08, -1.9, tz + 0.08), 0), C.wood);
    for (const [cx, cz] of [[-16.5, 15.9], [-14.5, 16.1], [-15.5, 15.7]] as const) {
      cb.add(boxGeo(V(cx - 0.04, -1.4, cz - 0.04), V(cx + 0.04, -1.15, cz + 0.04), 0), C.cloth);
      cb.add(boxGeo(V(cx - 0.03, -1.15, cz - 0.03), V(cx + 0.03, -1.02, cz + 0.03), 0), C.candle);
    }
    // side table with a white cloth and two more candles
    cb.add(boxGeo(V(-17.6, -1.7, 14.0), V(-16.8, -1.62, 14.8), 0), C.wood);
    cb.add(boxGeo(V(-17.6, -2.2, 14.0), V(-16.8, -1.7, 14.8), 0), C.cloth);
    for (const [cx, cz] of [[-17.4, 14.2], [-17.0, 14.6]] as const) {
      cb.add(boxGeo(V(cx - 0.04, -1.62, cz - 0.04), V(cx + 0.04, -1.37, cz + 0.04), 0), C.cloth);
      cb.add(boxGeo(V(cx - 0.03, -1.37, cz - 0.03), V(cx + 0.03, -1.24, cz + 0.03), 0), C.candle);
    }
    cb.build(R);
    // warm candlelight inside the cellar (on only in shot 6)
    this.cellarLight = new THREE.PointLight("#ffb060", 0, 12, 2);
    this.cellarLight.position.set(CELLAR_POS[0], 0.5, CELLAR_POS[2]);
    R.add(this.cellarLight);

    // ---- the cottage room (east side, open front to the street): x 12..20, z 24..32 ----
    // Mother + child sit at the tea table inside; the camera looks in from the street.
    const ob = new Batch();
    const O = { floor: lam("cottageFloor", () => ({ map: planksHD() })), wall: lam("cottageWall", () => ({ map: plasterTex() })), table: M.wood, chair: M.wood, cushion: M.red, dresser: M.woodDark, glow: M.windowGlow };
    const OX0 = 12, OX1 = 20, OZ0 = 24, OZ1 = 32, OH = 3.2;
    ob.add(quadAt(OX0, OX1, OZ0, OZ1, 0.03, 4, 4), O.floor);
    ob.add(boxGeo(V(OX1 - 0.3, 0, OZ0), V(OX1, OH, OZ1), 0), O.wall); // east wall
    ob.add(boxGeo(V(OX0, 0, OZ0), V(OX1, OH, OZ0 + 0.3), 0), O.wall); // north wall
    ob.add(boxGeo(V(OX0, 0, OZ1 - 0.3), V(OX1, OH, OZ1), 0), O.wall); // south wall
    ob.add(boxGeo(V(OX0, OH, OZ0), V(OX1, OH + 0.15, OZ1), 0, true), O.wall); // ceiling slab (west side open)
    // bright window on the east wall (warm daylight behind the family) + a dark wood frame
    // (the bare glow quad read as a blank cream rectangle)
    ob.add(boxGeo(V(OX1 - 0.32, 1.4, 27.2), V(OX1 - 0.28, 2.4, 28.8), 0), O.glow);
    ob.add(boxGeo(V(OX1 - 0.34, 1.4, 27.2), V(OX1 - 0.3, 1.5, 28.8), 0), O.dresser); // frame, bottom
    ob.add(boxGeo(V(OX1 - 0.34, 2.3, 27.2), V(OX1 - 0.3, 2.4, 28.8), 0), O.dresser); // frame, top
    ob.add(boxGeo(V(OX1 - 0.34, 1.4, 27.2), V(OX1 - 0.3, 2.4, 27.3), 0), O.dresser); // frame, north
    ob.add(boxGeo(V(OX1 - 0.34, 1.4, 28.7), V(OX1 - 0.3, 2.4, 28.8), 0), O.dresser); // frame, south
    ob.add(boxGeo(V(OX1 - 0.34, 1.4, 27.95), V(OX1 - 0.3, 2.4, 28.05), 0), O.dresser); // mullion, vertical
    ob.add(boxGeo(V(OX1 - 0.34, 1.85, 27.2), V(OX1 - 0.3, 1.95, 28.8), 0), O.dresser); // mullion, horizontal
    // tea table + two chairs (directly behind the sitters, 0.15 m back, so the chairs read as
    // theirs: the old 0.5 m offset left two empty chairs standing beside the family)
    ob.add(boxGeo(V(15.4, 0.72, 27.6), V(16.6, 0.8, 28.4), 0), O.table);
    for (const [lx, lz] of [[15.5, 27.7], [15.5, 28.3], [16.5, 27.7], [16.5, 28.3]] as const)
      ob.add(boxGeo(V(lx - 0.06, 0, lz - 0.06), V(lx + 0.06, 0.72, lz + 0.06), 0), O.table);
    chairAt(ob, O.chair, O.cushion, 16.1, 27.3, Math.PI); // mother's chair (east of her, behind
    // her from the west camera: a north/south offset reads as a lateral gap and the chair back
    // covered her face)
    chairAt(ob, O.chair, O.cushion, 16.5, 28.7, Math.PI); // child's chair (same)
    // dresser against the east wall + a small rug + a hanging lamp over the table (a cord from
    // the ceiling to a shade + glow core; the room had no light source and the blank ceiling
    // filled the top of the frame). lampAt is a floor lamp, so this one is built by hand.
    ob.add(boxGeo(V(18.8, 0, 25.2), V(19.7, 1.1, 26.4), 0), O.dresser);
    ob.add(boxGeo(V(14.5, 0.05, 29.5), V(17.5, 0.07, 31.0), 0), O.cushion);
    ob.add(boxGeo(V(15.97, 2.5, 27.97), V(16.03, 3.2, 28.03), 0), M.iron); // cord
    ob.add(boxGeo(V(15.7, 2.3, 27.7), V(16.3, 2.5, 28.3), 0), M.iron); // shade
    ob.add(boxGeo(V(15.82, 2.2, 27.82), V(16.18, 2.3, 28.18), 0), O.glow); // glow core
    ob.build(R);

    // ---- the courtroom (east, interior room): x 30..48, z -8..6, H 6 ----
    const kb = new Batch();
    const K = { floor: lam("courtFloor", () => ({ map: planksHD() })), wall: lam("courtPlaster", () => ({ map: plasterTex() })), bench: M.woodDark, wood: M.wood, arms: M.arms, glow: M.windowGlow };
    const KX0 = 30, KX1 = 48, KZ0 = -8, KZ1 = 6, KH = 6;
    kb.add(quadAt(KX0, KX1, KZ0, KZ1, 0.03, 9, 7), K.floor);
    // walls; west wall has the door gap at z 2..4
    kb.add(boxGeo(V(KX0, 0, KZ0), V(KX0 + 0.3, KH, 2), 0), K.wall);
    kb.add(boxGeo(V(KX0, 0, 4), V(KX0 + 0.3, KH, KZ1), 0), K.wall);
    kb.add(boxGeo(V(KX0, 3.2, 2), V(KX0 + 0.3, KH, 4), 0), K.wall); // lintel over the door
    kb.add(boxGeo(V(KX1 - 0.3, 0, KZ0), V(KX1, KH, KZ1), 0), K.wall); // east wall
    kb.add(boxGeo(V(KX0, 0, KZ0), V(KX1, KH, KZ0 + 0.3), 0), K.wall); // north wall
    kb.add(boxGeo(V(KX0, 0, KZ1 - 0.3), V(KX1, KH, KZ1), 0), K.wall); // south wall
    kb.add(boxGeo(V(KX0, KH, KZ0), V(KX1, KH + 0.15, KZ1), 0, true), K.wall); // ceiling slab
    // dark-wood wainscot along the north + south walls (0.95 m high)
    kb.add(boxGeo(V(KX0 + 0.3, 0, KZ0 + 0.3), V(KX1 - 0.3, 0.95, KZ0 + 0.42), 0), K.bench);
    kb.add(boxGeo(V(KX0 + 0.3, 0, KZ1 - 0.42), V(KX1 - 0.3, 0.95, KZ1 - 0.3), 0), K.bench);
    // judge's dais + bench (east end), witness box, gallery benches (south side)
    kb.add(boxGeo(V(43, 0, -3.5), V(48, 0.6, 1.5), 0), K.wood); // dais platform
    kb.add(boxGeo(V(44, 0.6, -3), V(47, 1.9, 1), 0), K.bench); // judge's bench
    kb.add(boxGeo(V(44, 1.9, -3), V(47, 2.0, 1), 0), K.wood); // bench top rail
    kb.add(boxGeo(V(39.5, 0, 2.5), V(41.5, 1.1, 4.5), 0), K.bench); // witness box
    for (const bx of [33, 37] as const) { // gallery benches
      kb.add(boxGeo(V(bx, 0, 4.2), V(bx + 3, 0.45, 5.0), 0), K.wood);
      kb.add(boxGeo(V(bx, 0.45, 4.9), V(bx + 3, 1.1, 5.0), 0), K.wood);
    }
    // framed coat of arms on the north wall + bright window on the south wall
    kb.add(boxGeo(V(38.2, 2.0, -7.68), V(41.8, 4.0, -7.6), 0), K.arms);
    // a second arms panel on the east wall behind the judge: the north-wall one is out of
    // the S9 camera's frame, so the wall behind the judge was blank
    kb.add(boxGeo(V(47.6, 2.5, -3), V(47.7, 4.5, 1), 0), K.arms);
    kb.add(boxGeo(V(35, 3.0, 5.68), V(37, 4.6, 5.72), 0), K.glow);
    kb.build(R);

    // ---- the Dominion Theatre facade (north end of the street, z -45, facing south) ----
    const tb = new Batch();
    const T = { wall: M.cream, column: M.cream, door: M.woodDark, brass: M.brass, marquee: M.marquee, sign: M.dominion, step: M.sidewalk };
    // main facade wall, 28 m wide, 12 m tall
    tb.add(boxGeo(V(-14, 0, -45.3), V(14, 12, -45), 0), T.wall);
    // portico: four columns + entablature + pediment (two sloped slabs meeting at the ridge)
    for (const cx of [-9, -3, 3, 9] as const)
      tb.add(new THREE.CylinderGeometry(0.5, 0.55, 8, 16), T.column, new THREE.Matrix4().makeTranslation(cx, 4, -43.5));
    tb.add(boxGeo(V(-11, 8, -44.2), V(11, 9, -43.2), 0), T.wall); // entablature
    beamBetween(tb, T.wall, -11, 9, -43.7, 0, 11.5, -43.7, 1.2); // pediment, left slope
    beamBetween(tb, T.wall, 0, 11.5, -43.7, 11, 9, -43.7, 1.2); // pediment, right slope
    // entrance: double doors + brass handles + steps
    tb.add(boxGeo(V(-2, 0, -45.05), V(2, 4.5, -44.7), 0), T.door);
    tb.add(boxGeo(V(-0.15, 1.8, -44.68), V(0.15, 2.2, -44.6), 0), T.brass);
    for (let i = 0; i < 3; i++)
      tb.add(boxGeo(V(-4, i * 0.15, -44.5 - i * 0.9), V(4, (i + 1) * 0.15, -43.6 - i * 0.9), 0), T.step);
    // striped marquee over the entrance + the DOMINION sign board above it
    tb.add(boxGeo(V(-8, 4.2, -45), V(8, 4.6, -41), 0), T.marquee);
    tb.add(boxGeo(V(-5, 9.3, -45.2), V(5, 10.3, -44.9), 0), T.sign); // DOMINION sign, 10 m wide:
    // the old 14 m board was cropped by the frame and the pediment beams at this camera distance
    tb.build(R);

    // ---- dynamic props (built once, posed per frame in update()) ----
    // the slipping iron ring around the main vat (torus, hole axis vertical)
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.09, 10, 40), M.iron);
    this.ring.rotation.x = Math.PI / 2;
    R.add(this.ring);
    // the 15 ft wave: one continuous curved face with a gradient + foam crest, NOT flat
    // boxes (the boxes read as cardboard monoliths in still_780). Same footprint as
    // before (~9 m wide, ~5 m tall) and the same group transform, so S5 framing is
    // unchanged. Front face is local +z: it leans forward as it rises and curls over
    // at the top, with a wavy crest line and a slight bow across the width.
    this.wave = new THREE.Group();
    const W = 9.2, NX = 40, NY = 14;
    const crestH = (x: number) => 4.55 + 0.28 * Math.sin(x * 0.85) + 0.18 * Math.sin(x * 2.3 + 1.2);
    const lean = (yn: number) => 1.05 * yn * yn + 0.35 * Math.pow(Math.max(0, (yn - 0.78) / 0.22), 2);
    const bow = (x: number) => 0.3 * Math.cos((x / (W / 2)) * Math.PI / 2);
    {
      const pos: number[] = [], uv: number[] = [], idx: number[] = [];
      for (let i = 0; i <= NX; i++) {
        const x = -W / 2 + (i / NX) * W, ch = crestH(x);
        for (let j = 0; j <= NY; j++) {
          const v = j / NY, y = ch * v;
          pos.push(x, y, bow(x) + lean(v));
          uv.push((x + W / 2) / W, v);
        }
      }
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        const a = i * (NY + 1) + j, b = (i + 1) * (NY + 1) + j;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
      const faceGeo = new THREE.BufferGeometry();
      faceGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      faceGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      faceGeo.setIndex(idx);
      faceGeo.computeVertexNormals();
      const faceMat = new THREE.MeshBasicMaterial({ map: waveFaceTex(), side: THREE.DoubleSide });
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.castShadow = true; face.receiveShadow = true;
      this.wave.add(face);
    }
    // foam crest: overlapping round bumps along the wavy crest line, spilling over the lip
    const foamGeo = new THREE.SphereGeometry(1, 12, 10);
    for (let i = 0; i <= 15; i++) {
      const x = -4.4 + (i / 15) * 8.8;
      const r = 0.34 + 0.16 * Math.abs(Math.sin(x * 1.3 + 0.6));
      const m = new THREE.Mesh(foamGeo, M.foam);
      m.scale.set(r, r * 0.72, r * 0.9);
      m.position.set(x, crestH(x) + 0.02, bow(x) + lean(1) + 0.12);
      m.castShadow = true; m.receiveShadow = true;
      this.wave.add(m);
    }
    // foam drips hanging off the crest, attached to the face (not floating dots)
    for (const [x, len] of [[-3.2, 0.6], [-0.8, 0.45], [1.6, 0.7], [3.6, 0.5]] as const) {
      const d = new THREE.Mesh(foamGeo, M.foam);
      d.scale.set(0.22, len / 2, 0.22);
      d.position.set(x, crestH(x) - len / 2 + 0.1, bow(x) + lean(1) + 0.28);
      d.castShadow = true;
      this.wave.add(d);
    }
    // splash at the base: flattened foam blobs on the flood in front of the wave
    for (const [x, r] of [[-3.4, 0.5], [-1.4, 0.38], [0.6, 0.55], [2.6, 0.42], [4.0, 0.3]] as const) {
      const s = new THREE.Mesh(foamGeo, M.foam);
      s.scale.set(r, r * 0.45, r * 0.8);
      s.position.set(x, 0.16, bow(x) + 1.35);
      s.castShadow = true; s.receiveShadow = true;
      this.wave.add(s);
    }
    R.add(this.wave);
    // the flood: a thin dark box covering the street (scaled + positioned per frame)
    this.flood = new THREE.Mesh(new THREE.BoxGeometry(24, 0.1, 65), M.beer);
    this.flood.receiveShadow = true;
    R.add(this.flood);
    // beer inside the cottage room (shot 7 only)
    this.cottageFlood = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 8), M.beer);
    this.cottageFlood.position.set(COTTAGE_POS[0], 0.12, COTTAGE_POS[2]);
    R.add(this.cottageFlood);
    // foam streaks riding on the flood
    for (const [x, z, len] of [[-4, 6, 5], [3, 14, 6], [-6, 24, 4], [5, 32, 5]] as const) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, len), M.foam);
      s.position.set(x, 0.32, z);
      this.foamStreaks.push(s); R.add(s);
    }
    // the second vat (topples in the burst): built as a group pivoting at its base
    this.vat2 = new THREE.Group();
    const v2cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 5.0, 24), M.vatWood);
    v2cyl.position.y = 2.5; v2cyl.castShadow = true; v2cyl.receiveShadow = true;
    this.vat2.add(v2cyl);
    for (const f of [0.2, 0.55, 0.85]) {
      const r = 1.8 + (1.7 - 1.8) * f;
      const hoop = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.05, r + 0.05, 0.12, 24), M.iron);
      hoop.position.y = f * 5.0;
      this.vat2.add(hoop);
    }
    this.vat2.position.set(-38, 0, 4);
    R.add(this.vat2);
    // the main vat's top section (y 5..6.7): flies off in the burst
    this.vatTop = new THREE.Group();
    const vtCyl = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.28, 1.7, 24), M.vatWood);
    vtCyl.position.y = 0.85; vtCyl.castShadow = true; vtCyl.receiveShadow = true;
    this.vatTop.add(vtCyl);
    const vtHoop = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.13, 24), M.iron);
    vtHoop.position.y = 0.4;
    this.vatTop.add(vtHoop);
    this.vatTop.position.set(VAT_POS[0], 5.0, VAT_POS[2]);
    R.add(this.vatTop);
    // flying staves for the burst (hidden inside the vat until the burst)
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.07), M.vatWood);
      s.castShadow = true;
      this.staves.push(s); R.add(s);
    }
    // barrels floating on the flood
    for (const [x, z] of [[-6, 10], [3, 18], [-2, 26], [6, 6]] as const) {
      const g = new THREE.Group();
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.85, 14), M.vatWood);
      cyl.rotation.z = Math.PI / 2; cyl.castShadow = true;
      g.add(cyl);
      for (const f of [-0.25, 0.25]) {
        const hoop = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 14), M.iron);
        hoop.rotation.z = Math.PI / 2; hoop.position.y = f;
        g.add(hoop);
      }
      g.position.set(x, 0.35, z);
      this.floatBarrels.push(g); R.add(g);
    }

    // the CAM agent's near framing objects: built once, toggled per frame (kitClone may return null — skip those)
    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const ss = s as ShotDef & { sunAz?: number; sunEl?: number };
    const az = THREE.MathUtils.degToRad(ss.sunAz ?? SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(ss.sunEl ?? SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig: camera-relative sun frozen per shot, two-tone uniforms, shadow fit ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc + halo, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- foreground framing objects ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- dynamic props ----
    const b = storyState(id, t);
    // the slipping ring: hugs the vat (radius grows as it slides down the taper),
    // lies flat-ish on the floor after the burst
    this.ring.visible = id <= 4;
    this.ring.position.set(VAT_POS[0], b.ring, VAT_POS[2]);
    const vatR = 2.4 - (b.ring / 6.7) * 0.3;
    this.ring.scale.setScalar((vatR + 0.06) / 2.42);
    this.ring.rotation.set(Math.PI / 2, 0, b.ring <= 0.4 ? 0.15 : 0);
    // the wave: surges out of the brewery door and down the street (shot 5 only)
    this.wave.visible = id === 5;
    if (id === 5) {
      const k = b.wave;
      this.wave.position.set(-12 + 4 * k, 0, 3.5 + 6.5 * k); // stops mid-street (-8, 10): the old
      // endpoint (-4, 16) ran the wave into the S5 camera, where it filled the frame as a wall
      this.wave.rotation.y = THREE.MathUtils.lerp(Math.PI / 2, 0.57, k);
    }
    // the flood: grows south from the brewery door across the street (shots 5-8)
    this.flood.visible = id >= 5 && id <= 8 && b.flood > 0.01;
    if (this.flood.visible) {
      this.flood.scale.set(1, 1, Math.max(0.01, b.flood));
      this.flood.position.set(0, 0.25, -20 + 32.5 * b.flood);
    }
    this.cottageFlood.visible = id === 7;
    for (const s of this.foamStreaks) s.visible = id >= 5 && id <= 8 && b.flood > 0.5;
    // the second vat topples in the burst; the main vat's top section flies off
    this.vat2.rotation.z = -0.5 * b.tilt;
    this.vatTop.position.set(VAT_POS[0] + 3 * b.debris, 5.0 + 2 * b.debris * (1 - 0.6 * b.debrisFall), VAT_POS[2] + 2 * b.debris);
    this.vatTop.rotation.set(0.4 * b.debris, 0, 0.8 * b.debris);
    // flying staves: hidden inside the vat until the burst, then flung out and dropped
    for (let i = 0; i < this.staves.length; i++) {
      const st = this.staves[i], a = (i / 8) * Math.PI * 2 + 0.3;
      st.visible = id === 4 && b.debris > 0.02;
      if (st.visible) {
        const r = 2.0 + 3.8 * b.debris;
        st.position.set(VAT_POS[0] + Math.cos(a) * r, 0.3 + 4 * b.debris * (1 - b.debrisFall), VAT_POS[2] + Math.sin(a) * r);
        st.rotation.set(b.debris * 3 + i, b.debris * 2, b.debris * 4 + b.debrisFall * 2);
      }
    }
    // barrels bobbing on the flood
    for (let i = 0; i < this.floatBarrels.length; i++) {
      const bar = this.floatBarrels[i];
      bar.visible = id >= 5 && id <= 8 && b.flood > 0.5;
      bar.position.y = 0.35 + 0.05 * Math.sin(t * 2 + i * 1.7);
      bar.rotation.z = 0.08 * Math.sin(t * 1.3 + i);
    }
    // candlelight in the cellar (shot 6 only)
    this.cellarLight.intensity = id === 6 ? 5 : 0;
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stageFn(id, t, storyState(id, t), { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}

/** horizontal quad facing up at height y covering x0..x1, z0..z1 (z0 < z1) */
function quadAt(x0: number, x1: number, z0: number, z1: number, y: number, u: number, v: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
