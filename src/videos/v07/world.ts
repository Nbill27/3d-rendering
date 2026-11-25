// VIDEO07: the whole place as one three.js scene — two locations in 1925:
// PARIS: a cobbled street south from the Champ de Mars plaza, Haussmann buildings on both sides,
// the Eiffel Tower looming over the north end, and the Hotel de Crillon salon (interior room, west).
// VIENNA: a cafe terrace with round tables, chairs and a striped awning (east).
// Posed every frame from the story timeline (story.ts).
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
// Light rig / sky / fog / clouds follow the bridge template.
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
import { FPS, SHOTS, camAt, storyState, TOWER_POS, TABLE_POS, FOREGROUND, ShotDef } from "./story";

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
/** a framed landscape painting for the salon's north wall: golden sky, sun, green hills,
 *  a river, and a tiny tower silhouette on the horizon */
const paintingTex = () => ctex("painting", 512, 300, (g) => {
  const sky = g.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, "#f6dca8"); sky.addColorStop(0.6, "#eec27e"); sky.addColorStop(1, "#d9a05e");
  g.fillStyle = sky; g.fillRect(0, 0, 512, 300);
  g.fillStyle = "#fff3c9"; g.beginPath(); g.arc(400, 70, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#7a9a4a"; g.beginPath(); g.arc(140, 320, 180, Math.PI, 0); g.fill();
  g.fillStyle = "#6d8f42"; g.beginPath(); g.arc(420, 330, 200, Math.PI, 0); g.fill();
  g.fillStyle = "#7fb2d9"; g.fillRect(0, 240, 512, 60);
  g.fillStyle = "#5a4a3a";
  g.beginPath(); g.moveTo(250, 240); g.lineTo(268, 150); g.lineTo(286, 240); g.closePath(); g.fill();
  g.fillRect(266, 118, 4, 34);
});
/** red-and-cream striped cafe awning */
const awningTex = () => ctex("awning", 512, 256, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f1ece0" : "#c0353a"; g.fillRect(i * 64, 0, 64, 256); }
  g.fillStyle = "rgba(0,0,0,0.08)"; for (let x = 0; x < 512; x += 8) g.fillRect(x, 0, 2, 256);
});
/** warm plaster for the hotel salon walls: cream panels with a dado line, no stone blocks —
 *  a luxury hotel interior must not read as a warehouse */
const plasterTex = () => ctex("plaster", 512, 512, (g) => {
  g.fillStyle = "#e9ddc2"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(120,90,40,0.05)";
  for (let i = 0; i < 400; i++) g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  g.strokeStyle = "rgba(120,90,40,0.28)"; g.lineWidth = 3;
  for (let x = 64; x < 512; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  g.strokeStyle = "rgba(120,90,40,0.4)"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(0, 384); g.lineTo(512, 384); g.stroke(); // dado line (texture v maps to wall height)
});
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 10: { az: -30, el: 18 } };

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

/** the Eiffel Tower as a lattice of iron beams: four legs that curve inward in three tiers,
 *  X-braces on every face, two observation decks, a spire.
 *  (cx, cz) = tower centre, s = scale (1 = the real 70 m tower, 0.014 = the 1 m miniature on the
 *  salon table), y0 = base height. The silhouette — wide arched base, two decks, spire — is what
 *  makes it read as the Eiffel Tower at a glance. */
const towerAt = (b: Batch, mat: THREE.Material, cx: number, cz: number, s: number, y0: number) => {
  // leg corner half-widths at each tier boundary (heights in tower metres, scaled)
  const H = [0, 16, 34, 50], W = [8, 5.5, 3, 0.8];
  const corner = (i: number, sx: number, sz: number): [number, number, number] =>
    [cx + sx * W[i] * s, y0 + H[i] * s, cz + sz * W[i] * s];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    for (let i = 0; i < 3; i++) {
      const [ax, ay, az] = corner(i, sx, sz), [bx, by, bz] = corner(i + 1, sx, sz);
      beamBetween(b, mat, ax, ay, az, bx, by, bz, (1.15 - i * 0.22) * s);
    }
  }
  // X-braces + horizontal struts on each face, per tier
  for (let i = 0; i < 3; i++) {
    const yA = y0 + H[i] * s, yB = y0 + H[i + 1] * s;
    const faces: [[number, number], [number, number]][] = [
      [[-W[i], -W[i]], [W[i], -W[i]]], [[W[i], -W[i]], [W[i], W[i]]],
      [[W[i], W[i]], [-W[i], W[i]]], [[-W[i], W[i]], [-W[i], -W[i]]],
    ];
    for (const [[x1, z1], [x2, z2]] of faces) {
      // strut along the top of the tier
      const wB = W[i + 1];
      const tx1 = cx + (x1 < 0 ? -wB : wB) * s, tz1 = cz + (z1 < 0 ? -wB : wB) * s;
      const tx2 = cx + (x2 < 0 ? -wB : wB) * s, tz2 = cz + (z2 < 0 ? -wB : wB) * s;
      beamBetween(b, mat, tx1, yB, tz1, tx2, yB, tz2, 0.5 * s);
      // X-brace diagonals across the face
      const bx1 = cx + x1 * s, bz1 = cz + z1 * s, bx2 = cx + x2 * s, bz2 = cz + z2 * s;
      beamBetween(b, mat, bx1, yA, bz1, tx2, yB, tz2, 0.45 * s);
      beamBetween(b, mat, bx2, yA, bz2, tx1, yB, tz1, 0.45 * s);
    }
  }
  // observation decks with railings
  for (const [hy, hw] of [[16, 6.4], [34, 3.9]] as const) {
    const y = y0 + hy * s, w = hw * s;
    b.add(boxGeo(V(cx - w, y, cz - w), V(cx + w, y + 0.8 * s, cz + w), 0), mat);
    const r = 0.18 * s, rh = 1.1 * s;
    for (const [x1, z1, x2, z2] of [[-w, -w, w, -w], [w, -w, w, w], [w, w, -w, w], [-w, w, -w, -w]] as const)
      beamBetween(b, mat, cx + x1, y + 0.8 * s + rh, cz + z1, cx + x2, y + 0.8 * s + rh, cz + z2, r);
    for (const [px, pz] of [[-w, -w], [w, -w], [w, w], [-w, w], [0, -w], [0, w], [-w, 0], [w, 0]] as const)
      beamBetween(b, mat, cx + px, y + 0.8 * s, cz + pz, cx + px, y + 0.8 * s + rh, cz + pz, r);
  }
  // spire: converging cone + antenna ball
  beamBetween(b, mat, cx, y0 + 50 * s, cz, cx, y0 + 68 * s, cz, 0.9 * s);
  b.add(new THREE.SphereGeometry(0.9 * s, 12, 8), mat, new THREE.Matrix4().makeTranslation(cx, y0 + 69 * s, cz));
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

    // ---- static land: cobbled plaza + street, sidewalks, lawn strips ----
    const b = new Batch();
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.sidewalk = lam("sidewalk", () => ({ map: stoneHD("sidewalk", ["#d9cfc0", "#cfc4b2", "#e0d6c6", "#c8bdaa"], "#a89a86") }));
    M.lawn = lam("lawn", () => ({ map: stoneHD("lawn", ["#7a9a4a", "#6d8f42", "#84a854", "#75984a"], "#5a7a3a") }));
    M.cream = lam("parisCream", () => ({ map: stoneHD("parisCream", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
    M.woodDark = lam("woodDark", () => ({ color: "#5a3b2a" }));
    M.wood = lam("wood", () => ({ color: "#8a6a44" }));
    M.red = lam("carpetRed", () => ({ color: "#8a2a2e" }));
    M.brass = lam("brass", () => ({ color: "#c9a24a" }));
    M.towerIron = lam("towerIron", () => ({ color: "#8a6a48" }));
    M.white = lam("porcelain", () => ({ color: "#f1ece0" }));
    M.awning = lam("awning", () => ({ map: awningTex() }));
    // plaza (tower end) and street, sidewalks on both sides, lawn strips by the plaza
    b.add(quadAt(-32, 32, -56, -18, 0, 16, 10), M.cobble);
    b.add(quadAt(-5, 5, -18, 48, 0.012, 2.5, 16), M.cobble);
    b.add(quadAt(-12, -5, -18, 48, 0.02, 2, 16), M.sidewalk);
    b.add(quadAt(5, 12, -18, 48, 0.02, 2, 16), M.sidewalk);
    b.add(quadAt(-32, -14, -56, -40, 0.015, 4, 4), M.lawn);
    b.add(quadAt(14, 32, -56, -40, 0.015, 4, 4), M.lawn);
    b.add(quadAt(12, 56, 10, 44, 0.015, 11, 8), M.sidewalk); // cafe terrace floor (east)

    // ---- the Eiffel Tower (real scale, 70 m) over the north end of the plaza ----
    towerAt(b, M.towerIron, TOWER_POS[0], TOWER_POS[2], 1, 0);

    // ---- Haussmann buildings lining the street (facades face the street) ----
    // east side, facing west (-x): yaw -PI/2 makes the front (+z local) face -x... house() front is local +z,
    // so yaw = -PI/2 turns +z to -x. West side faces east: yaw = +PI/2.
    house(b, 18, -6, -Math.PI / 2, 12, 10, 13, 0);
    house(b, 18, 10, -Math.PI / 2, 12, 10, 14, 6);
    house(b, 18, 26, -Math.PI / 2, 12, 10, 13, 2);
    house(b, 18, 40, -Math.PI / 2, 12, 10, 15, 7);
    house(b, -18, -6, Math.PI / 2, 12, 10, 14, 6);
    house(b, -18, 10, Math.PI / 2, 12, 10, 13, 0);
    house(b, -18, 26, Math.PI / 2, 12, 10, 14, 2);
    house(b, -18, 40, Math.PI / 2, 12, 10, 13, 7);
    // two more framing the plaza's south corners (fronts face the plaza, +z)
    house(b, 24, -30, 0, 12, 10, 13, 0);
    house(b, -24, -30, 0, 12, 10, 13, 6);

    // ---- street lamps along the street and the plaza ----
    for (const [x, z] of [[-6.5, -12], [6.5, -2], [-6.5, 8], [6.5, 18], [-6.5, 28], [6.5, 38], [-14, -46], [14, -46]] as const)
      prop(b, kit, "lantern", x, 0, z, 3.2, 0);

    // ---- trees on the plaza edges and the lawn strips, clear of the tower, the street and the cameras ----
    const hr = (() => { let s = 23; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    const clearOf = (x: number, z: number) =>
      Math.hypot(x - TOWER_POS[0], z - TOWER_POS[2]) > 14 &&
      !(Math.abs(x) < 8 && z > -56 && z < 50) && // the street + plaza centre (camera corridors)
      !(x > 22 && z > 6 && z < 42) && // the cafe terrace + its northern approach (a tree there overhangs the terrace)
      !(x < -34 && z > -8 && z < 12) && // the salon (interior, west)
      !(x > 8 && x < 26 && z > 22 && z < 48); // the sunset cameras' ground (east, south end)
    const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
    for (let i = 0; i < 34; i++) {
      const x = -46 + hr() * 92, z = -52 + hr() * 96;
      if (!clearOf(x, z)) continue;
      prop(b, kit, trees[Math.floor(hr() * trees.length)], x, 0, z, 7 + hr() * 4, hr() * 6);
    }
    for (const [x, z] of [[-26, -46], [26, -46], [-20, 44], [20, 46]] as const)
      prop(b, kit, "tree_oak", x, 0, z, 8, x);
    for (const [x, z] of [[-14, -48], [14, -48], [-28, -20], [28, -20], [-16, 34], [16, 34]] as const)
      prop(b, kit, "plant_bush", x, 0, z, 1.6 + hr() * 0.8, hr() * 6);
    // park benches flanking the street on the plaza (they frame the hook + Poisson shots)
    bench(b, M.wood, M.red, -9.5, -14, 0); bench(b, M.wood, M.red, 9.5, -14, 0);
    bench(b, M.wood, M.red, -12, -30, 0); bench(b, M.wood, M.red, 12, -30, 0);
    prop(b, kit, "cart", 17, 0, -26, 1.5, -Math.PI / 2); // market cart on the plaza's east side
    b.build(R);

    // ---- the Hotel de Crillon salon (interior room, west): floor, walls with two door gaps,
    //  long table, chairs, red carpet, chandelier, miniature tower on the table ----
    const sb = new Batch();
    const S = { floor: lam("salonFloor", () => ({ map: planksHD() })), wall: lam("salonPlaster", () => ({ map: plasterTex() })), table: M.woodDark, chair: M.wood, carpet: M.red, brass: M.brass, white: M.white,
      painting: lam("painting", () => ({ map: paintingTex() })), corridor: lam("corridor", () => ({ color: "#d99a4a" })), corridorGlass: lam("corridorGlass", () => ({ color: "#f2c078" })) };
    const RX0 = -55, RX1 = -37, RZ0 = -5, RZ1 = 9, RH = 5.2; // room bounds
    // floor + carpet
    sb.add(quadAt(RX0, RX1, RZ0, RZ1, 0.03, 9, 7), S.floor);
    sb.add(quadAt(-50, -42, -1, 5, 0.05, 4, 3), S.carpet);
    // walls (0.3 thick, 5.2 high); east wall has a door gap at z 4..6.5 (police enter), west wall a gap at z -3.5..-1 (Lustig slips out)
    sb.add(boxGeo(V(RX0, 0, -1), V(RX0 + 0.3, RH, RZ1), 0), S.wall); // west wall, south of the door
    sb.add(boxGeo(V(RX0, 0, RZ0), V(RX0 + 0.3, RH, -3.5), 0), S.wall); // west wall, north of the door
    sb.add(boxGeo(V(RX0, 3.2, -3.5), V(RX0 + 0.3, RH, -1), 0), S.wall); // lintel over the west door
    sb.add(boxGeo(V(RX1 - 0.3, 0, RZ0), V(RX1, RH, 4), 0), S.wall); // east wall, north of the door
    sb.add(boxGeo(V(RX1 - 0.3, 0, 6.5), V(RX1, RH, RZ1), 0), S.wall); // east wall, south of the door
    sb.add(boxGeo(V(RX1 - 0.3, 3.2, 4), V(RX1, RH, 6.5), 0), S.wall); // lintel over the east door
    sb.add(boxGeo(V(RX0, 0, RZ0), V(RX1, RH, RZ0 + 0.3), 0), S.wall); // north wall
    sb.add(boxGeo(V(RX0, 0, RZ1 - 0.3), V(RX1, RH, RZ1), 0), S.wall); // south wall
    sb.add(boxGeo(V(RX0, 5.2, RZ0), V(RX1, 5.35, RZ1), 0, true), S.wall); // ceiling slab (boxGeo has no bottom face unless asked)
    // dark-wood wainscot along the doorless walls (north + south), 0.95 m high
    sb.add(boxGeo(V(RX0 + 0.3, 0, RZ0 + 0.3), V(RX1 - 0.3, 0.95, RZ0 + 0.42), 0), S.table);
    sb.add(boxGeo(V(RX0 + 0.3, 0, RZ1 - 0.42), V(RX1 - 0.3, 0.95, RZ1 - 0.3), 0), S.table);
    // long table (top at y 0.8) + legs + chairs (legs, slatted backs, cushions — a chair
    // must read as a chair, not an empty rectangular frame)
    sb.add(boxGeo(V(-49, 0.75, 1.2), V(-43, 0.85, 2.8), 0), S.table);
    for (const [lx, lz] of [[-48.6, 1.4], [-48.6, 2.6], [-43.4, 1.4], [-43.4, 2.6]] as const)
      sb.add(boxGeo(V(lx - 0.08, 0, lz - 0.08), V(lx + 0.08, 0.75, lz + 0.08), 0), S.table);
    for (const [cx, cz, yaw] of [[-48.5, 0.55, 0], [-46.5, 0.55, 0], [-44.5, 0.55, 0], [-47.5, 3.45, Math.PI], [-44.5, 3.45, Math.PI], [-49.8, 2, Math.PI / 2]] as const) {
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(cx, 0, cz);
      for (const [lx, lz] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]] as const)
        sb.add(boxGeo(V(lx - 0.04, 0, lz - 0.04), V(lx + 0.04, 0.42, lz + 0.04), 0), S.chair, m); // legs
      sb.add(boxGeo(V(-0.3, 0.4, -0.3), V(0.3, 0.48, 0.3), 0), S.chair, m); // seat
      sb.add(boxGeo(V(-0.27, 0.48, -0.27), V(0.27, 0.54, 0.27), 0), S.carpet, m); // cushion
      sb.add(boxGeo(V(-0.3, 0.54, -0.3), V(-0.22, 1.08, -0.22), 0), S.chair, m); // back posts
      sb.add(boxGeo(V(0.22, 0.54, -0.3), V(0.3, 1.08, -0.22), 0), S.chair, m);
      sb.add(boxGeo(V(-0.3, 0.98, -0.3), V(0.3, 1.08, -0.22), 0), S.chair, m); // top rail
      sb.add(boxGeo(V(-0.1, 0.54, -0.3), V(-0.04, 0.98, -0.22), 0), S.chair, m); // slats
      sb.add(boxGeo(V(0.04, 0.54, -0.3), V(0.1, 0.98, -0.22), 0), S.chair, m);
    }
    // framed landscape painting on the north wall above the wainscot (fills the big empty wall).
    // It sits on the wall's west end (x -54..-51): that is the stretch the salon camera actually sees.
    sb.add(boxGeo(V(-54, 1.6, -4.68), V(-51, 3.6, -4.6), 0), S.painting);
    sb.add(boxGeo(V(-54.1, 1.52, -4.7), V(-50.9, 1.6, -4.58), 0), S.brass);
    sb.add(boxGeo(V(-54.1, 3.6, -4.7), V(-50.9, 3.68, -4.58), 0), S.brass);
    sb.add(boxGeo(V(-54.1, 1.52, -4.7), V(-54, 3.68, -4.58), 0), S.brass);
    sb.add(boxGeo(V(-51, 1.52, -4.7), V(-50.9, 3.68, -4.58), 0), S.brass);
    // west door (Lustig slips out here): warm corridor glow behind the opening, wood architrave,
    // both leaves swung flat against the interior wall — an open doorway, not a flat blue box
    sb.add(boxGeo(V(-56.4, -1, -5.5), V(-56.3, 3.4, 0.5), 0), S.corridor);
    sb.add(boxGeo(V(-54.72, 0, -3.62), V(-54.58, 3.3, -3.5), 0), S.table);
    sb.add(boxGeo(V(-54.72, 0, -1), V(-54.58, 3.3, -0.88), 0), S.table);
    sb.add(boxGeo(V(-54.72, 3.2, -3.62), V(-54.58, 3.34, -0.88), 0), S.table);
    sb.add(boxGeo(V(-54.68, 0, -4.72), V(-54.6, 3.1, -3.62), 0), S.table); // north leaf, open flat
    sb.add(boxGeo(V(-54.66, 0.6, -4.5), V(-54.62, 2.6, -3.85), 0), S.corridorGlass); // its warm glass panes
    sb.add(boxGeo(V(-54.68, 0, -0.88), V(-54.6, 3.1, 0.2), 0), S.table); // south leaf, open flat
    sb.add(boxGeo(V(-54.66, 0.6, -0.65), V(-54.62, 2.6, -0.05), 0), S.corridorGlass);
    // east door (police walk in here): same dressing, mirrored
    sb.add(boxGeo(V(-35.6, -1, 3.5), V(-35.5, 3.4, 7.8), 0), S.corridor);
    sb.add(boxGeo(V(-37.42, 0, 3.88), V(-37.28, 3.3, 4), 0), S.table);
    sb.add(boxGeo(V(-37.42, 0, 6.5), V(-37.28, 3.3, 6.62), 0), S.table);
    sb.add(boxGeo(V(-37.42, 3.2, 3.88), V(-37.28, 3.34, 6.62), 0), S.table);
    sb.add(boxGeo(V(-37.4, 0, 2.78), V(-37.32, 3.1, 3.88), 0), S.table); // south leaf, open flat
    sb.add(boxGeo(V(-37.38, 0.6, 3.0), V(-37.34, 2.6, 3.65), 0), S.corridorGlass);
    sb.add(boxGeo(V(-37.4, 0, 6.62), V(-37.32, 3.1, 7.72), 0), S.table); // north leaf, open flat
    sb.add(boxGeo(V(-37.38, 0.6, 6.85), V(-37.34, 2.6, 7.5), 0), S.corridorGlass);
    // chandelier: brass ring + candles above the table
    const chY = 4.1;
    sb.add(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 20).translate(0, 0, 0), S.brass,
      new THREE.Matrix4().makeTranslation(-46, chY, 2));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      sb.add(boxGeo(V(-0.05, 0, -0.05), V(0.05, 0.5, 0.05), 0), S.white,
        new THREE.Matrix4().makeTranslation(-46 + Math.cos(a) * 0.7, chY + 0.05, 2 + Math.sin(a) * 0.7));
    }
    sb.add(boxGeo(V(-46.03, chY, 1.97), V(-45.97, 5.2, 2.03), 0), S.brass); // chain to the ceiling
    // the miniature Eiffel Tower on the table (the pitch prop): 1 m tall, base at the table top
    towerAt(sb, M.towerIron, TABLE_POS[0], TABLE_POS[2], 0.014, 0.85);
    sb.build(R);

    // ---- the Vienna cafe terrace (east): round tables, chairs, striped awning, potted plants ----
    const cb = new Batch();
    const C = { table: M.white, chair: M.wood, awning: M.awning, brass: M.brass };
    const cafeTable = (x: number, z: number) => {
      cb.add(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 20).translate(0, 0, 0), C.table,
        new THREE.Matrix4().makeTranslation(x, 0.75, z));
      cb.add(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 10).translate(0, 0, 0), C.brass,
        new THREE.Matrix4().makeTranslation(x, 0.38, z));
      cb.add(new THREE.CylinderGeometry(0.3, 0.35, 0.05, 16).translate(0, 0, 0), C.brass,
        new THREE.Matrix4().makeTranslation(x, 0.03, z));
    };
    const cafeChair = (x: number, z: number, yaw: number) => {
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
      for (const [lx, lz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]] as const)
        cb.add(boxGeo(V(lx - 0.035, 0, lz - 0.035), V(lx + 0.035, 0.4, lz + 0.035), 0), C.chair, m); // legs
      cb.add(boxGeo(V(-0.28, 0.38, -0.28), V(0.28, 0.46, 0.28), 0), C.chair, m); // seat
      cb.add(boxGeo(V(-0.25, 0.46, -0.25), V(0.25, 0.51, 0.25), 0), C.table, m); // white cushion
      cb.add(boxGeo(V(-0.28, 0.51, -0.28), V(-0.2, 1.0, -0.2), 0), C.chair, m); // back posts
      cb.add(boxGeo(V(0.2, 0.51, -0.28), V(0.28, 1.0, -0.2), 0), C.chair, m);
      cb.add(boxGeo(V(-0.28, 0.9, -0.28), V(0.28, 1.0, -0.2), 0), C.chair, m); // top rail
      cb.add(boxGeo(V(-0.09, 0.51, -0.28), V(-0.03, 0.9, -0.2), 0), C.chair, m); // slats
      cb.add(boxGeo(V(0.03, 0.51, -0.28), V(0.09, 0.9, -0.2), 0), C.chair, m);
    };
    cafeTable(38.5, 26); cafeTable(38.0, 27.8); cafeTable(43, 23);
    cafeChair(38.5, 27.6, 0); cafeChair(38.0, 28.6, Math.PI); cafeChair(43, 24.6, Math.PI);
    // striped awning over the terrace, tilted so its striped underside faces the low cafe camera
    // (rotation.x positive: the south edge by the camera is low, the north edge high), raised so
    // it reads as a canopy overhead without covering the people at the tables; posts cut to the
    // tilted edge heights at their z
    const awn = new THREE.Matrix4().makeRotationX(0.35).setPosition(39, 3.8, 26.5);
    cb.add(boxGeo(V(-4.5, 0, -2.5), V(4.5, 0.06, 2.5), 0), C.awning, awn);
    cb.add(boxGeo(V(35 - 0.06, 0, 24.5 - 0.06), V(35 + 0.06, 4.5, 24.5 + 0.06), 0), C.brass);
    cb.add(boxGeo(V(43 - 0.06, 0, 28.5 - 0.06), V(43 + 0.06, 3.1, 28.5 + 0.06), 0), C.brass);
    cb.build(R);
    // potted plants around the terrace (kept clear of the waiter at 36.2, 24.5)
    const pb = new Batch();
    for (const [x, z] of [[33.5, 22.5], [43.5, 29], [33, 28], [44, 21.5]] as const)
      prop(pb, kit, "plant_bush", x, 0, z, 1.1, x);
    pb.build(R);

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

/** a simple park bench: two leg frames, a seat slab with a cushion, a slatted back.
 *  The back is on the local -z side, so yaw 0 faces the sitter toward +z. */
const bench = (b: Batch, mat: THREE.Material, cushion: THREE.Material, x: number, z: number, yaw: number) => {
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
  for (const lx of [-0.8, 0.8] as const) {
    b.add(boxGeo(V(lx - 0.05, 0, -0.22), V(lx + 0.05, 0.45, -0.14), 0), mat, m);
    b.add(boxGeo(V(lx - 0.05, 0, 0.14), V(lx + 0.05, 0.45, 0.22), 0), mat, m);
  }
  b.add(boxGeo(V(-0.9, 0.42, -0.25), V(0.9, 0.5, 0.25), 0), mat, m); // seat
  b.add(boxGeo(V(-0.85, 0.5, -0.22), V(0.85, 0.56, 0.22), 0), cushion, m); // cushion
  for (const lx of [-0.85, 0.85] as const)
    b.add(boxGeo(V(lx - 0.05, 0.5, -0.25), V(lx + 0.05, 1.0, -0.17), 0), mat, m); // back posts
  b.add(boxGeo(V(-0.9, 0.82, -0.25), V(0.9, 0.92, -0.17), 0), mat, m); // top slat
  b.add(boxGeo(V(-0.9, 0.6, -0.25), V(0.9, 0.7, -0.17), 0), mat, m); // mid slat
};

/** horizontal quad facing up at height y covering x0..x1, z0..z1 (z0 < z1) */
function quadAt(x0: number, x1: number, z0: number, z1: number, y: number, u: number, v: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
