// VIDEO06: the whole place as one three.js scene — a 1945 Japanese city street running south:
// Hiroshima at the north end (Mitsubishi office east, railway station west, wooden houses,
// telegraph poles) and Nagasaki at the south end (office east, civic hall west, houses, hills).
// The city has two states, toggled per shot: INTACT (shots 1-3, 6-7, 9-10) and RUIN
// (Hiroshima shots 4-5, Nagasaki shot 8) — tilted walls, collapsed roofs, rubble piles.
// Posed every frame from the story timeline (story.ts).
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
// Light rig / sky / fog / clouds follow the bridge template.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, boxGeo, V, lam, house, prop, Kit, kitClone } from "./build";
import { ctex, beam, stoneHD, grassHD, cobbleHD, dirtHD, cloudHD, darkWood, stepStone, awningRib } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, storyState, HIRO_OFFICE_POS, STATION_POS, NAGA_OFFICE_POS, HALL_POS, TRACK_X, DITCH_POS, FOREGROUND, ShotDef } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "lantern", "cart", "stall-red", "stall-green", "stall-bench"];
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
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 10: { az: -30, el: 18 } };

type Mats = Record<string, THREE.Material>;

/** stage() result, mirrored structurally so this file does not depend on cast.ts's exact Stage type */
type StageLike = {
  places: { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number] }[];
  fx: { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean }[];
};
const stageFn = stage as unknown as (id: number, t: number, b: unknown, cam: { pos: THREE.Vector3; right: THREE.Vector3 }) => StageLike;

/** deterministic pseudo-random in [0,1) */
const hr = (() => { let s = 17; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();

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
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private cloudBase: { a: number; d: number; y: number }[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  private hiroIntact = new THREE.Group();
  private hiroRuin = new THREE.Group();
  private nagaIntact = new THREE.Group();
  private nagaRuin = new THREE.Group();

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
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 420 + (i % 3) * 50;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 120 + (i % 4) * 25;
      m.position.set(Math.cos(a) * d, 28 + (i % 4) * 6, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.cloudBase.push({ a, d, y: 28 + (i % 4) * 6 }); // Tahap 5: sudut dasar untuk drift awan
      this.clouds.push(m); R.add(m);
    }

    // ---- shared ground: grass everywhere, cobbled street south, dirt yards, railway bed ----
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.dirt = lam("dirtYard", () => ({ map: dirtHD() }));
    M.mud = lam("mud", () => ({ map: dirtHD(), color: "#6a5138" }));
    M.stone = lam("stoneHD", () => ({ map: stoneHD() }));
    M.wood = lam("wood", () => ({ map: beam() }));
    M.dark = lam("darkWood", () => ({ map: darkWood() })); // Hairline T4: grain, was flat #5a3b2a
    M.step = lam("stepStone", () => ({ map: stepStone() })); // Hairline T4: 2 stone courses sized for a 0.12 m step face
    M.steel = lam("steel", () => ({ color: "#5a5f6a" }));
    M.hill = lam("hillGrass", () => ({ map: grassHD(), color: "#7ab35a" }));
    M.vegG = lam("produceGreen", () => ({ color: "#5aa83c" }));
    M.vegO = lam("produceOrange", () => ({ color: "#e07b2c" }));
    M.vegR = lam("produceRed", () => ({ color: "#c0353a" }));
    M.paper = lam("paperWarm", () => ({ color: "#f7e8c0" }));
    /** code-built paper lantern on a post (the Kenney lantern GLB 404s, so the
     *  prop() calls below never rendered anything): post + warm paper box. */
    const codeLantern = (b: Batch, x: number, z: number) => {
      b.add(boxGeo(V(x - 0.07, 0, z - 0.07), V(x + 0.07, 2.2, z + 0.07), 0), M.dark);
      b.add(boxGeo(V(x - 0.05, 2.2, z - 0.05), V(x + 0.05, 2.32, z + 0.05), 0), M.dark);
      b.add(boxGeo(V(x - 0.18, 1.78, z - 0.18), V(x + 0.18, 2.2, z + 0.18), 0), M.paper);
      b.add(boxGeo(V(x - 0.19, 1.74, z - 0.19), V(x + 0.19, 1.8, z + 0.19), 0), M.vegR);
      b.add(boxGeo(V(x - 0.19, 2.18, z - 0.19), V(x + 0.19, 2.24, z + 0.19), 0), M.vegR);
    };
    /** office front porch (anatomy: office.html): stone step, dark recessed doorway,
     *  dark signboard above it, and a sloped awning on the wall — no posts, so nobody
     *  standing in the yard clips through one. frontX = the office front wall's x. */
    const officePorch = (b: Batch, frontX: number, oz: number) => {
      b.add(boxGeo(V(frontX - 1.5, 0, oz - 0.8), V(frontX, 0.12, oz + 0.8), 0), M.step); // step (Hairline T4: stone courses)
      b.add(boxGeo(V(frontX - 0.06, 0.3, oz - 0.8), V(frontX + 0.05, 2.2, oz + 0.8), 0), M.dark); // doorway recess
      b.add(boxGeo(V(frontX - 0.15, 3.1, oz - 1.2), V(frontX + 0.02, 3.8, oz + 1.2), 0), M.dark); // signboard
      const awn = new THREE.Matrix4().makeRotationZ(-0.2).setPosition(frontX, 2.75, oz);
      b.add(boxGeo(V(-1.5, 0, -1.9), V(0, 0.08, 1.9), 0), lam("awningRibRed", () => ({ map: awningRib("#b4524b") })), awn); // Hairline T4: canvas ribs
    };
    b.add(quadAt(-900, 900, -900, 900, 0, 225, 225), M.grass);
    b.add(quadAt(-3, 3, -60, 62, 0.012, 1.2, 24), M.cobble); // the main street
    b.add(quadAt(3, 20, -36, -24, 0.012, 3, 2), M.dirt); // Hiroshima office yard
    b.add(quadAt(-20, -3, -38, -24, 0.012, 3, 2), M.dirt); // station yard
    b.add(quadAt(3, 20, 24, 36, 0.012, 3, 2), M.dirt); // Nagasaki office yard
    b.add(quadAt(-20, -3, 26, 38, 0.012, 3, 2), M.dirt); // civic hall yard
    // railway bed + two steel rails west of the street
    b.add(quadAt(TRACK_X - 1.6, TRACK_X + 1.6, -48, 48, 0.012, 1, 20), M.dirt);
    b.add(boxGeo(V(TRACK_X - 0.82, 0.02, -48), V(TRACK_X - 0.66, 0.14, 48), 0), M.steel);
    b.add(boxGeo(V(TRACK_X + 0.66, 0.02, -48), V(TRACK_X + 0.82, 0.14, 48), 0), M.steel);
    // station platform (raised stone slab west of the tracks)
    b.add(boxGeo(V(-13.5, 0, -40), V(-10.5, 0.9, -24), 0), M.stone);
    // the roadside ditch Yamaguchi dives into (dark recessed pit + dirt rim)
    b.add(boxGeo(V(DITCH_POS[0] - 1.5, -0.25, DITCH_POS[2] - 0.8), V(DITCH_POS[0] + 1.5, 0.02, DITCH_POS[2] + 0.8), 0), M.mud);
    b.add(boxGeo(V(DITCH_POS[0] - 1.7, 0.02, DITCH_POS[2] - 1), V(DITCH_POS[0] - 1.5, 0.12, DITCH_POS[2] + 1), 0), M.dirt);
    b.add(boxGeo(V(DITCH_POS[0] + 1.5, 0.02, DITCH_POS[2] - 1), V(DITCH_POS[0] + 1.7, 0.12, DITCH_POS[2] + 1), 0), M.dirt);
    // telegraph poles along the east verge of the street. (No poles at z=-28 or z=32: those stood
    // directly in the S2/S6/S7 cameras' line of sight to the office groups and blocked the frame.)
    for (const z of [-40, -4, 8, 44] as const) {
      b.add(boxGeo(V(5.4, 0, z - 0.09), V(5.58, 6, z + 0.09), 0), M.dark);
      b.add(boxGeo(V(4.8, 5.4, z - 0.07), V(6.2, 5.58, z + 0.07), 0), M.dark);
    }
    // hills far north and far south (big low grass domes, sunk into the ground).
    // The southern hills stay LOW (tops ~y 4-6) so the golden sunset sky shows above them in shot 10;
    // tall close hills there filled the whole frame with their shaded north slopes (dark blue).
    for (const [x, z, sx, sy, sz] of [[0, 102, 70, 7, 24], [-48, 96, 55, 8, 20], [48, 96, 50, 6, 18],
      [0, -88, 70, 13, 22], [-45, -82, 55, 15, 20], [45, -82, 50, 10, 18]] as const) {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), M.hill);
      hill.position.set(x, -2, z); hill.scale.set(sx, sy, sz); hill.receiveShadow = true;
      R.add(hill);
    }
    // Tahap 6: trees at the foot of the bare hills (code VEG, so they render — the GLB
    // trees 404). The northern row breaks the flat green hill behind shots 1-4; the
    // southern pair frames the rebuilt-city view in shot 10. Planted on flat ground at
    // the hill foot (z -62 / +74), never on the dome itself (bases would sink).
    for (const [n, x, z, h] of [["tree_oak", -32, -62, 10], ["tree_default", -18, -63, 11], ["tree_fat", -6, -62, 9],
      ["tree-high-round", 8, -63, 11], ["tree_default", 22, -62, 10], ["tree_oak", 34, -63, 9],
      ["tree_default", -16, 74, 9], ["tree_oak", 16, 75, 8]] as const)
      prop(b, kit, n, x, 0, z, h, x);
    b.build(R);

    // ---- Hiroshima intact: Mitsubishi office, station, wooden houses ----
    const hi = new Batch();
    house(hi, HIRO_OFFICE_POS[0], HIRO_OFFICE_POS[2], -Math.PI / 2, 12, 9, 7, 7); // brick office, faces west
    house(hi, HIRO_OFFICE_POS[0] + 8, HIRO_OFFICE_POS[2] + 6, Math.PI, 6, 6, 5, 3); // office annex
    house(hi, STATION_POS[0], STATION_POS[2], Math.PI / 2, 10, 8, 5, 3); // timber station, faces east
    house(hi, 9, -44, -Math.PI / 2, 7, 6, 4.5, 3);
    house(hi, -9, -20, Math.PI / 2, 6, 6, 4, 4);
    house(hi, -9, -4, Math.PI / 2, 7, 6, 4.5, 3);
    house(hi, 9, 8, -Math.PI / 2, 6, 6, 4, 5);
    house(hi, -9, 12, Math.PI / 2, 6, 6, 4, 0);
    // trees and bushes in the Hiroshima end
    const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
    for (let i = 0; i < 22; i++) {
      const x = -55 + hr() * 110, z = -55 + hr() * 55;
      if (Math.abs(x) < 9 && z > -48 && z < 14) continue; // street + tracks corridor
      if (Math.hypot(x - 14, z + 30) < 11 || Math.hypot(x + 14, z + 32) < 11) continue; // office + station
      prop(hi, kit, trees[Math.floor(hr() * trees.length)], x, 0, z, 7 + hr() * 4, hr() * 6);
    }
    for (const [x, z] of [[-6, -36], [7, -40], [-6, 6], [7, -16], [-14, 2], [16, -18]] as const)
      prop(hi, kit, "plant_bush", x, 0, z, 1.6 + hr() * 0.8, hr() * 6);
    prop(hi, kit, "lantern", 11, 0, -25, 1.6, 0);
    prop(hi, kit, "lantern", -11, 0, -27, 1.6, 0);
    // ---- street props on the Hiroshima street (shots 1-3), built from boxes: the Kenney GLBs
    // for cart/stall/lantern do not exist under public/bridge/kenney/ (they 404, so kitClone
    // returns null for them) — these read as a market stall, a hand cart and a crate stack in
    // the flat toon style instead. All clear of Yamaguchi's path (x=0) and of the colleagues.
    // Kept SMALL: at this camera distance a 2 m prop next to the lens fills half the frame.
    const awningRed = lam("awningRibRed", () => ({ map: awningRib("#b4524b") })); // Hairline T4: canvas ribs
    const awningCream = lam("awningRibCream", () => ({ map: awningRib("#e8d9b0") })); // Hairline T4: canvas ribs
    { // market stall at (-4.2, -28): four posts, counter, striped awning, goods crates
      const sx = -4.2, sz = -28;
      for (const [dx, dz] of [[-0.75, -0.5], [0.75, -0.5], [-0.75, 0.5], [0.75, 0.5]] as const)
        hi.add(boxGeo(V(sx + dx - 0.06, 0, sz + dz - 0.06), V(sx + dx + 0.06, 2.3, sz + dz + 0.06), 0), M.dark);
      hi.add(boxGeo(V(sx - 0.8, 0, sz - 0.6), V(sx + 0.8, 0.8, sz + 0.6), 0), M.dark); // counter base
      hi.add(boxGeo(V(sx - 0.8, 0.8, sz - 0.6), V(sx + 0.8, 0.92, sz + 0.6), 0), M.wood); // counter top
      const awn = new THREE.Matrix4().makeRotationX(-0.18).setPosition(sx, 2.3, sz);
      hi.add(boxGeo(V(-0.9, 0, -0.85), V(0, 0.08, 0.85), 0), awningRed, awn);
      hi.add(boxGeo(V(0, 0, -0.85), V(0.9, 0.08, 0.85), 0), awningCream, awn);
      hi.add(boxGeo(V(sx - 0.7, 0.92, sz - 0.3), V(sx - 0.3, 1.2, sz + 0.1), 0), M.wood); // goods crates
      hi.add(boxGeo(V(sx + 0.3, 0.92, sz - 0.1), V(sx + 0.7, 1.15, sz + 0.3), 0), M.wood);
      // produce piled on the crates, so the stall reads as a market stall, not an empty frame
      hi.add(boxGeo(V(sx - 0.65, 1.2, sz - 0.25), V(sx - 0.35, 1.38, sz + 0.05), 0), M.vegG); // greens
      hi.add(boxGeo(V(sx + 0.35, 1.15, sz - 0.05), V(sx + 0.65, 1.32, sz + 0.25), 0), M.vegO); // oranges
      hi.add(boxGeo(V(sx - 0.15, 0.92, sz + 0.2), V(sx + 0.15, 1.1, sz + 0.5), 0), M.vegR); // red goods
      // basket stack beside the stall
      hi.add(boxGeo(V(sx + 1.05, 0, sz + 0.35), V(sx + 1.45, 0.35, sz + 0.75), 0), M.wood);
      hi.add(boxGeo(V(sx + 1.08, 0.35, sz + 0.38), V(sx + 1.42, 0.6, sz + 0.72), 0), M.vegG);
      // paper lantern hanging from the awning front
      hi.add(boxGeo(V(sx - 0.02, 2.0, sz + 0.78), V(sx + 0.02, 2.3, sz + 0.82), 0), M.dark);
      hi.add(boxGeo(V(sx - 0.16, 1.68, sz + 0.7), V(sx + 0.16, 2.0, sz + 0.9), 0), M.paper);
    }
    // office porch (anatomy: office.html) + code-built street lanterns (the GLB
    // lantern prop() calls below 404, so nothing rendered there before)
    officePorch(hi, 9.5, -30);
    codeLantern(hi, 4.8, -20); codeLantern(hi, -4.8, -12); codeLantern(hi, 4.8, 2);
    for (const [x, z] of [[-6, -14], [7, -2]] as const)
      prop(hi, kit, "plant_bush", x, 0, z, 1.6 + hr() * 0.8, hr() * 6);
    // NOTE: a hand cart and a near-camera crate stack were tried here and removed again:
    // at this camera distance both loomed far too large (the cart merged with the stall into
    // one mass, the crates read as a giant monolith in the corner). The stall + pedestrians
    // below carry the street life instead.
    hi.build(this.hiroIntact);
    R.add(this.hiroIntact);

    // ---- Nagasaki intact: office, civic hall, wooden houses ----
    const ni = new Batch();
    house(ni, NAGA_OFFICE_POS[0], NAGA_OFFICE_POS[2], -Math.PI / 2, 10, 8, 6, 3); // timber office, faces west
    house(ni, HALL_POS[0], HALL_POS[2], Math.PI / 2, 11, 8, 7, 0); // cream civic hall, faces east
    house(ni, 9, 44, -Math.PI / 2, 7, 6, 4.5, 3);
    house(ni, 9, 52, -Math.PI / 2, 6, 6, 4, 4);
    house(ni, -9, 44, Math.PI / 2, 6, 6, 4, 5);
    house(ni, -9, 14, Math.PI / 2, 6, 6, 4, 3);
    for (let i = 0; i < 22; i++) {
      const x = -55 + hr() * 110, z = 8 + hr() * 50;
      if (Math.abs(x) < 9 && z > 8 && z < 58) continue; // street + tracks corridor
      if (x > -4 && x < 12 && z > 2 && z < 18) continue; // S8 camera near field (shot 8, looking south from the street)
      if (Math.hypot(x - 14, z - 30) < 11 || Math.hypot(x + 14, z - 32) < 11) continue; // office + hall
      prop(ni, kit, trees[Math.floor(hr() * trees.length)], x, 0, z, 7 + hr() * 4, hr() * 6);
    }
    for (const [x, z] of [[-6, 22], [7, 40], [-6, 48], [9.5, 24.5], [-14, 38], [16, 36]] as const)
      prop(ni, kit, "plant_bush", x, 0, z, 1.6 + hr() * 0.8, hr() * 6);
    prop(ni, kit, "lantern", 11, 0, 33, 1.6, 0);
    prop(ni, kit, "lantern", -11, 0, 29, 1.6, 0);
    // pine trees on the southern hills (shot 10); kept off the centre line (x=0, the character's axis)
    // so no tree looms directly behind older Yamaguchi against the sunset
    for (const [x, z] of [[-18, 66], [12, 68], [-30, 72], [26, 70], [18, 74], [-16, 78]] as const)
      prop(ni, kit, "tree_default", x, 0, z, 8 + hr() * 3, hr() * 6);
    // office porch + street lanterns (Nagasaki end) + extra bushes
    officePorch(ni, 10, 30);
    // Tahap 6: codeLantern(ni, 4.8, 26) DIHAPUS — tiangnya berdiri tepat di antara kamera
    // S6 dan supervisor (6, 30), jadi kotak kertasnya menutupi separuh wajah supervisor
    // di still2_900. Lampion yang tersisa (-4.8, 20) dan (-4.8, 38) tidak menghalangi grup.
    codeLantern(ni, -4.8, 20); codeLantern(ni, -4.8, 38);
    // Tahap 6: the rebuilt city below the hill (shot 10) — a small cluster of houses on
    // the southern slope, facing north toward the hill camera, so the closing shot shows
    // a lived-in town instead of empty colour bands. Kept clear of x=0 (Yamaguchi's axis)
    // and of the S9 cameras' sight lines (50 m south of the hall, out of the S9 frame).
    house(ni, -6, 74, Math.PI, 8, 7, 6, 2);
    house(ni, -1, 78, Math.PI, 9, 7, 7, 4);
    house(ni, 4, 75, Math.PI, 7, 6, 5, 1);
    house(ni, 8, 79, Math.PI, 8, 7, 6, 6);
    for (const [x, z] of [[7, 16], [-6, 56]] as const)
      prop(ni, kit, "plant_bush", x, 0, z, 1.6 + hr() * 0.8, hr() * 6);
    // civic hall (S9): stone step, signboard, and a flagpole with a white flag
    // and red disc, so the hall reads as a Japanese civic building, not a house
    ni.add(boxGeo(V(-11.5, 0, 30.5), V(-10, 0.12, 33.5), 0), M.step); // hall step (Hairline T4: stone courses)
    ni.add(boxGeo(V(-10.15, 3.1, 30.8), V(-9.98, 3.8, 33.2), 0), M.dark);
    ni.add(boxGeo(V(-11.54, 0, 25.96), V(-11.46, 5, 26.04), 0), M.dark); // flagpole
    ni.add(boxGeo(V(-11.46, 4.2, 25.98), V(-10.56, 4.8, 26.02), 0), M.paper); // flag
    ni.add(boxGeo(V(-11.1, 4.35, 25.97), V(-10.85, 4.65, 26.03), 0), M.vegR); // red disc
    ni.build(this.nagaIntact);
    R.add(this.nagaIntact);

    // ---- Hiroshima ruin (shots 4-5): tilted walls, collapsed roofs, rubble piles ----
    const hrB = new Batch();
    const tilt = (w: number, h: number, d: number, x: number, y: number, z: number, rz: number, ry = 0) => {
      const g = boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2), 0);
      const m = new THREE.Matrix4().makeRotationY(ry).multiply(new THREE.Matrix4().makeRotationZ(rz)).setPosition(x, y, z);
      hrB.add(g, M.stone, m);
    };
    const rubble = (x: number, z: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const w = 0.5 + hr() * 1.1, h = 0.3 + hr() * 0.6, d = 0.5 + hr() * 0.9;
        const ox = (hr() - 0.5) * 3.2, oz = (hr() - 0.5) * 3.2;
        const g = boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2), 0);
        const m = new THREE.Matrix4().makeRotationY(hr() * 6).multiply(new THREE.Matrix4().makeRotationZ((hr() - 0.5) * 0.5)).setPosition(x + ox, 0, z + oz);
        hrB.add(g, hr() < 0.5 ? M.stone : M.wood, m);
      }
    };
    tilt(7, 4, 0.35, 14, -0.4, -30, 0.22, -Math.PI / 2); // the office's front wall, leaning
    tilt(6, 3.5, 0.35, 15, -0.5, -24, -0.18, 0); // a side wall, fallen the other way
    tilt(5, 0.3, 4, 12, 2.2, -28, 0.35, -Math.PI / 2); // the office roof, collapsed and slid
    tilt(4, 3, 0.3, -9, -0.3, -20, 0.3, Math.PI / 2); // a house wall, leaning
    tilt(4, 0.25, 3.5, -9, 1.8, -20, -0.3, Math.PI / 2); // its roof, dropped
    rubble(10, -26, 8); rubble(18, -34, 7); rubble(6, -20, 6); rubble(-6, -28, 7); rubble(12, -38, 6); rubble(-2, -14, 5);
    // a fallen telegraph pole across the street
    hrB.add(boxGeo(V(-0.09, 0, -0.09), V(0.09, 6, 0.09), 0), M.dark,
      new THREE.Matrix4().makeRotationX(Math.PI / 2 - 0.08).setPosition(2, 0.3, -14));
    hrB.build(this.hiroRuin);
    R.add(this.hiroRuin);

    // ---- Nagasaki ruin (shot 8): the damaged office, rubble ----
    const nrB = new Batch();
    const tilt2 = (w: number, h: number, d: number, x: number, y: number, z: number, rz: number, ry = 0) => {
      const g = boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2), 0);
      const m = new THREE.Matrix4().makeRotationY(ry).multiply(new THREE.Matrix4().makeRotationZ(rz)).setPosition(x, y, z);
      nrB.add(g, M.stone, m);
    };
    const rubble2 = (x: number, z: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const w = 0.5 + hr() * 1.1, h = 0.3 + hr() * 0.6, d = 0.5 + hr() * 0.9;
        const ox = (hr() - 0.5) * 3.2, oz = (hr() - 0.5) * 3.2;
        const g = boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2), 0);
        const m = new THREE.Matrix4().makeRotationY(hr() * 6).multiply(new THREE.Matrix4().makeRotationZ((hr() - 0.5) * 0.5)).setPosition(x + ox, 0, z + oz);
        nrB.add(g, hr() < 0.5 ? M.stone : M.wood, m);
      }
    };
    tilt2(6, 3.5, 0.35, 14, -0.4, 30, 0.2, -Math.PI / 2); // the office front wall, leaning
    tilt2(4.5, 0.3, 3.5, 13, 2.0, 29, -0.3, -Math.PI / 2); // its roof, dropped
    rubble2(10, 26, 7); rubble2(18, 34, 6); rubble2(8, 24, 6); rubble2(4, 30, 5);
    nrB.build(this.nagaRuin);
    R.add(this.nagaRuin);

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
    // ---- city state: intact before each bomb, ruined after it, rebuilt by 2009 ----
    this.hiroIntact.visible = id <= 3 || id >= 9;
    this.hiroRuin.visible = id === 4 || id === 5;
    this.nagaIntact.visible = id <= 3 || id === 6 || id === 7 || id >= 9;
    this.nagaRuin.visible = id === 8;
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
      // Tahap 5 (motion_design): awan hanyut pelan (lapisan ambient, ~0,1 rad selama 60 dtk)
      // supaya langit tidak pernah jadi backdrop beku; counter-motion terhadap gerak
      // kamera utara/selatan, kecepatannya ~5% dari gerak hero.
      const cb = this.cloudBase[i], ca = cb.a + t * 0.0016;
      m.position.set(Math.cos(ca) * cb.d, cb.y, Math.sin(ca) * cb.d);
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

/** horizontal quad facing up at height y covering x0..x1, z0..z1 (z0 < z1) */
function quadAt(x0: number, x1: number, z0: number, z1: number, y: number, u: number, v: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
