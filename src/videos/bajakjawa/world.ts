// BAJAK JAWA: the whole place as one three.js scene — open sea, the lanong war prahu with three banks of
// oars, the VOC merchant ship, the coastal town on the land strip, the analogy pond and the fort — posed every
// frame from the story physics (story.ts). update(id, f, camera) poses everything for shot `id` at frame f
// (pure function of id + f). Light rig / sky / fog / clouds / water shader follow the bridge template.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, boxGeo, V, lam, house, prop, Kit, kitClone } from "./build";
import { ctex, beam, planksHD, beamHD, stoneHD, grassHD, waterNear, waterFar, cloudHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage, splashFx } from "./cast";
import { FPS, SHOTS, SNAP, camAt, lanongZ, rowPhase, surge, slack, mastFall, seaState, LANONG_DECK, VOC_DECK, VOC_POS, POND, clamp01, FOREGROUND, ShotDef } from "./story";

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
/** lanong sail: cream canvas, red bands, dark border */
const sailTex = () => ctex("lanongSail", 512, 384, (g) => {
  g.fillStyle = "#f2e6c8"; g.fillRect(0, 0, 512, 384);
  g.fillStyle = "#b03a2e";
  for (const y of [52, 168, 284]) g.fillRect(0, y, 512, 26);
  g.strokeStyle = "#7a2c1e"; g.lineWidth = 10; g.strokeRect(5, 5, 502, 374);
  g.fillStyle = "#b03a2e"; g.beginPath(); g.arc(256, 192, 52, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#f2e6c8"; g.beginPath(); g.arc(256, 192, 30, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(90,40,20,0.35)"; g.lineWidth = 3;
  for (let x = 32; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 384); g.stroke(); }
});
/** VOC square sail: plain off-white canvas with seams */
const vocSailTex = () => ctex("vocSail", 512, 384, (g) => {
  g.fillStyle = "#efe8d2"; g.fillRect(0, 0, 512, 384);
  g.strokeStyle = "rgba(90,70,50,0.4)"; g.lineWidth = 3;
  for (let x = 32; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 384); g.stroke(); }
  for (let y = 48; y < 384; y += 96) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.strokeStyle = "#6e5a40"; g.lineWidth = 8; g.strokeRect(4, 4, 504, 376);
});
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
/** pond water: bright blue with painted ripple rings and speckles (the flat #2f8fb0 disc read as a
 *  dark green field under the golden grade) */
const pondTex = () => ctex("pondTex", 512, 512, (g) => {
  g.fillStyle = "#3d9fc4"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 5;
  for (const [x, y, r] of [[130, 150, 46], [340, 110, 60], [300, 330, 70], [120, 360, 38], [420, 300, 44]] as const) {
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(x, y, r * 0.6, 0, Math.PI * 2); g.stroke();
  }
  g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const x = (i * 137) % 512, y = (i * 211) % 512;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y + 3); g.stroke();
  }
  g.strokeStyle = "rgba(20,90,120,0.4)"; g.lineWidth = 4;
  for (let i = 0; i < 24; i++) {
    const x = (i * 173 + 60) % 512, y = (i * 97 + 30) % 512;
    g.beginPath(); g.arc(x, y, 9, 0.3, 2.4); g.stroke();
  }
});
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 2: { az: 120 }, 11: { az: -70, el: 8 }, 12: { az: -30, el: 18 } };

type Mats = Record<string, THREE.Material>;

/** stage() result, mirrored structurally so this file does not depend on cast.ts's exact Stage type
 *  (the runtime shape is the same Stage cast.ts exports). */
type StageLike = {
  places: { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number] }[];
  fx: { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean }[];
};
const stageFn = stage as unknown as (id: number, t: number, b: unknown, cam: { pos: THREE.Vector3; right: THREE.Vector3 }) => StageLike;
const splashFn = splashFx as unknown as (tau: number, out: StageLike) => void;

// oar layout: 3 tiers x 2 sides x 9 oars along the hull
const OAR_TIERS = [1.5, 1.95, 2.4];
const OAR_Z = [-10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10];
const OAR_COUNT = OAR_TIERS.length * 2 * OAR_Z.length;

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private lanong = new THREE.Group();
  private oars!: THREE.InstancedMesh;
  private lanongSail!: THREE.Mesh;
  private voc = new THREE.Group();
  private vocMainMast = new THREE.Group();
  private vocSails: { m: THREE.Mesh; baseY: number }[] = [];
  private pondSail = new THREE.Group();
  private pondRow = new THREE.Group();
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
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- static land: grass, sand beach, fort, town, trees (one merged batch) ----
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.sand = lam("sand", () => ({ color: "#e2c992" }));
    M.stone = lam("fortStone", () => ({ map: stoneHD("fortStone", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") }));
    M.cope = lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
    M.wood = lam("wood", () => ({ map: beam() }));
    // land: the coastal strip z -900..-60 at y=0; sand beach z -70..-60
    b.add(quadAt(-900, 900, -900, -60, 0, 225, 210), M.grass);
    b.add(quadAt(-900, 900, -70, -60, 0.012, 225, 2.5), M.sand);
    // ---- fort at (28,0,-55): front wall with a gate gap, flanking towers, side + back walls (round 5: moved +28x off the lanong's lane — at x=0 it filled shot 1, the lanong sails past it 5 units away) ----
    b.add(boxGeo(V(13, 0, -56), V(26, 4.2, -54), 2), M.stone);
    b.add(boxGeo(V(30, 0, -56), V(43, 4.2, -54), 2), M.stone);
    b.add(boxGeo(V(13, 0, -64), V(43, 3.5, -62), 2), M.stone);
    b.add(boxGeo(V(13, 0, -62), V(14.5, 3.5, -54), 2), M.stone);
    b.add(boxGeo(V(41.5, 0, -62), V(43, 3.5, -54), 2), M.stone);
    for (const xc of [23.5, 32.5]) {
      b.add(boxGeo(V(xc - 1.6, 0, -57.5), V(xc + 1.6, 9, -52.5), 2), M.stone);
      b.add(boxGeo(V(xc - 1.9, 9, -57.8), V(xc + 1.9, 9.6, -52.2), 2), M.cope);
      const cap = new THREE.ConeGeometry(2.4, 2.2, 4); cap.rotateY(Math.PI / 4);
      b.add(cap, M.stone, new THREE.Matrix4().makeTranslation(xc, 9.6 + 1.1, -55));
    }
    // ---- coastal town, houses at y=0 on the land strip, fronts facing the sea (+z) ----
    // (buildTown is the bridge-valley layout around a river, so houses are placed manually with house();
    // the pond at (55,-75) and the fort at (28,-55) are kept clear)
    const hr = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    for (const [zf, x0, x1] of [[-85, -110, 20], [-100, -100, 30], [-88, 75, 120], [-115, -90, 10]] as const) {
      let x = x0;
      while (x < x1) {
        const w = [7, 9][Math.floor(hr() * 2)], h = [7, 8.4, 9.8][Math.floor(hr() * 3)];
        house(b, x + w / 2, zf, 0, w, 8, h, Math.floor(hr() * 8), 0);
        x += w + (hr() < 0.25 ? 2.5 : 0.3);
      }
    }
    // trees on the land strip, clear of the pond and the fort sightline
    const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
    for (let i = 0; i < 46; i++) {
      const x = -130 + hr() * 260, z = -72 - hr() * 55;
      if (Math.hypot(x - POND[0], z - POND[2]) < 12) continue;
      prop(b, kit, trees[Math.floor(hr() * trees.length)], x, 0, z, 7 + hr() * 4, hr() * 6);
    }
    for (const [x, z] of [[-20, -70], [22, -72], [-38, -68], [40, -70], [-8, -68]] as const)
      prop(b, kit, "tree_oak", x, 0, z, 8, x);
    b.build(R);

    // ---- water: wide sea plane x -900..900, z -60..900 at y=0 ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "sea1";
    const wm = new THREE.Mesh(quadAt(-900, 900, -60, 900, 0, 1, 1), waterM);
    wm.receiveShadow = true;
    R.add(wm);

    // ---- pond: circular water disc + sand rim at POND ----
    const pondM = lam("pondWater", () => ({ map: pondTex() }));
    const pond = new THREE.Mesh(new THREE.CircleGeometry(6, 40).rotateX(-Math.PI / 2), pondM);
    pond.position.set(POND[0], 0.03, POND[2]); pond.receiveShadow = true; R.add(pond);
    const rim = new THREE.Mesh(new THREE.RingGeometry(6, 6.9, 40).rotateX(-Math.PI / 2), M.sand);
    rim.position.set(POND[0], 0.025, POND[2]); rim.receiveShadow = true; R.add(rim);

    // ---- ships ----
    this.buildLanong(M);
    this.buildVoc(M);
    R.add(this.lanong, this.voc);
    this.buildPondBoats(M);
    R.add(this.pondSail, this.pondRow);

    // ---- fort flag (red pennant on the east tower) ----
    // plain Lambert: the two-tone shade turns the small red flag purple on its shaded side
    const flagM = new THREE.MeshLambertMaterial({ color: "#b03a2e", side: THREE.DoubleSide });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 8), M.wood);
    pole.position.set(32.5, 12.5, -55); pole.castShadow = true; R.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9, 8, 1), flagM);
    flag.position.set(33.3, 13.6, -55); flag.castShadow = true; R.add(flag);

    // the CAM agent's near framing objects: built once, toggled per frame (kitClone may return null — skip those)
    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
  }

  /** lanong: long narrow hull along z (bow +z), tall mast + big rectangular sail, carved prow,
   *  three banks (tiers) of oars on both sides (instanced, posed per frame in poseShips). */
  private buildLanong(M: Mats) {
    const g = this.lanong;
    const hullM = lam("hullWood", () => ({ map: beamHD() }));
    const deckM = lam("planksHD", () => ({ map: planksHD() }));
    const redM = new THREE.MeshLambertMaterial({ color: "#8c3b2e" }); // plain Lambert: the two-tone shade turns the small prow post purple on its shaded sides (it read as a floating purple box from the aerial)
    const darkM = lam("hullDark", () => ({ color: "#5a3b2a" }));
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz);
      mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh;
    };
    // hull: main box, deck, bow taper + carved prow, raised stern castle, gunwale rails
    add(boxGeo(V(-2.2, 0.2, -12), V(2.2, LANONG_DECK, 12), 2), hullM);
    add(boxGeo(V(-2.2, LANONG_DECK, -12), V(2.2, LANONG_DECK + 0.15, 12), 2), deckM);
    add(boxGeo(V(-1.6, 0.6, 10.5), V(1.6, LANONG_DECK, 13.2), 2), hullM, 0, 0, 0, 0.28, 0, 0);
    add(boxGeo(V(-0.35, -1.2, -0.35), V(0.35, 1.2, 0.35), 0), redM, 0, 3.4, 12.75, -0.35, 0, 0); // prow post, leaning forward — rotated about its own centre (the old version rotated the box about the ship origin, which lifted it 4 units above the deck so it read as a floating dark box)
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 8), redM);
    tip.position.set(0, 5.0, 13.15); tip.rotation.x = -0.35; tip.castShadow = true; g.add(tip); // carved prow spike (round 5: narrower cone — the 0.36 one read as a little roof/house on the bow)
    // (the carved prow ball + beak were removed: from deck-level cameras they read as a red
    // balloon floating in the sky, detached from the post)
    add(boxGeo(V(-2.0, LANONG_DECK, -12.8), V(2.0, 4.0, -10.5), 2), hullM); // stern castle
    add(boxGeo(V(-2.3, LANONG_DECK + 0.15, -12), V(-2.05, LANONG_DECK + 0.5, 12), 0), darkM);
    add(boxGeo(V(2.05, LANONG_DECK + 0.15, -12), V(2.3, LANONG_DECK + 0.5, 12), 0), darkM);
    // mast + yard + big rectangular sail (plane, painted canvas)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 11, 10), darkM);
    mast.position.set(0, LANONG_DECK + 5.5, 0); mast.castShadow = true; g.add(mast);
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 9.6, 8).rotateZ(Math.PI / 2), darkM);
    yard.position.set(0, LANONG_DECK + 10.6, 0); yard.castShadow = true; g.add(yard);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 9.2, 8).rotateZ(Math.PI / 2), darkM);
    boom.position.set(0, LANONG_DECK + 3.6, 0); boom.castShadow = true; g.add(boom);
    // plain Lambert (not the two-tone lam()): the two-tone shader leaves a sail's back face in the
    // flat purple shade colour, so the VOC sails read as floating purple slabs from the lanong side.
    // Plain Lambert flips the normal for DoubleSide faces, so the canvas reads from both sides.
    // (Round 3: plain Lambert still left the sails dark grey-brown and the mast's shadow on the sail
    // read as a floating purple box — sails are painted canvas, so they are unlit Basic now.)
    const sailM = new THREE.MeshBasicMaterial({ map: sailTex(), side: THREE.DoubleSide });
    this.lanongSail = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.8), sailM);
    this.lanongSail.position.set(0, LANONG_DECK + 7.1, -0.15); this.lanongSail.castShadow = true; g.add(this.lanongSail);
    // oars: instanced cylinders, pivot at the top end (hull side), posed per frame
    const oarGeo = new THREE.CylinderGeometry(0.06, 0.09, 4.2, 6).translate(0, -2.1, 0);
    const oarM = lam("oarWood", () => ({ color: "#8a6a44" }));
    this.oars = new THREE.InstancedMesh(oarGeo, oarM, OAR_COUNT);
    this.oars.castShadow = true; this.oars.frustumCulled = false; g.add(this.oars);
  }

  /** VOC merchant ship: bigger hull at VOC_POS facing -z, two masts with square sails.
   *  Sails go slack with slack(tau); the main mast falls with mastFall(tau). */
  private buildVoc(M: Mats) {
    const g = this.voc;
    g.position.set(VOC_POS[0], 0, VOC_POS[2]);
    const hullM = lam("vocHull", () => ({ map: beamHD() }));
    const deckM = lam("planksHD", () => ({ map: planksHD() }));
    const darkM = lam("hullDark", () => ({ color: "#5a3b2a" }));
    const goldM = lam("vocGold", () => ({ color: "#c9a24e" }));
    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    // hull: main box, deck, bow taper toward -z, stern castle toward +z, rails, gold trim
    add(g, boxGeo(V(-3.5, 0.3, -15), V(3.5, VOC_DECK, 15), 2), hullM);
    add(g, boxGeo(V(-3.5, VOC_DECK, -15), V(3.5, VOC_DECK + 0.15, 15), 2), deckM);
    add(g, boxGeo(V(-2.6, 0.8, -16.5), V(2.6, VOC_DECK, -13.5), 2), hullM, 0, 0, 0, -0.25, 0, 0);
    add(g, boxGeo(V(-3.2, VOC_DECK, 11), V(3.2, 6.2, 14.5), 2), hullM); // stern castle
    add(g, boxGeo(V(-3.6, VOC_DECK + 0.15, -15), V(-3.35, VOC_DECK + 0.55, 15), 0), darkM);
    add(g, boxGeo(V(3.35, VOC_DECK + 0.15, -15), V(3.6, VOC_DECK + 0.55, 15), 0), darkM);
    add(g, boxGeo(V(-3.55, 2.9, -15), V(3.55, 3.05, 15), 0), goldM);
    const sailM = new THREE.MeshBasicMaterial({ map: vocSailTex(), side: THREE.DoubleSide }); // unlit canvas: see the lanong sail note
    const mast = (parent: THREE.Object3D, z: number, h: number) => {
      const grp = new THREE.Group();
      grp.position.set(0, VOC_DECK, z);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, h, 10), darkM);
      m.position.y = h / 2; m.castShadow = true; grp.add(m);
      const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8.6, 8).rotateZ(Math.PI / 2), darkM);
      yard.position.y = h - 0.8; yard.castShadow = true; grp.add(yard);
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(8, 5.6), sailM);
      sail.position.y = h - 3.8; sail.castShadow = true; grp.add(sail);
      this.vocSails.push({ m: sail, baseY: h - 3.8 });
      parent.add(grp);
      return grp;
    };
    mast(g, -8, 13); // fore mast (fixed)
    this.vocMainMast = mast(g, 5, 15); // main mast (falls after the ram)
  }

  /** analogy pond toy boats: sailboat (stays still) + rowboat (crosses the pond in shots 10-11).
   *  Hulls are tapered (bow + stern wedges) with a painted wood texture — the first version's plain
   *  boxes read as bricks. The rowboat gets two oars dipping into the water. */
  private buildPondBoats(M: Mats) {
    const woodM = new THREE.MeshLambertMaterial({ map: beamHD() }); // plain Lambert: the two-tone shade turns small boxes purple on their shaded sides
    const redM = new THREE.MeshLambertMaterial({ color: "#8c3b2e" }); // plain Lambert: same reason (the prow post read as a purple box from the aerial)
    const sailM = new THREE.MeshBasicMaterial({ map: sailTex(), side: THREE.DoubleSide }); // unlit canvas: see the lanong sail note
    const mk = (parent: THREE.Group, hull: THREE.Material, sail: boolean) => {
      const h = new THREE.Mesh(boxGeo(V(-0.55, 0, -0.3), V(0.55, 0.28, 0.3), 0), hull);
      h.castShadow = false; parent.add(h); // hulls do not cast: under the low golden sun their shadows are huge blue blobs on the pond
      const bow = new THREE.Mesh(boxGeo(V(-0.28, 0, -0.22), V(0.28, 0.24, 0.22), 0), hull); // bow wedge
      bow.position.set(0.68, 0.02, 0); bow.rotation.y = 0.6; bow.castShadow = false; parent.add(bow);
      const stern = new THREE.Mesh(boxGeo(V(-0.24, 0, -0.2), V(0.24, 0.22, 0.2), 0), hull); // stern wedge
      stern.position.set(-0.62, 0.02, 0); stern.rotation.y = -0.5; stern.castShadow = false; parent.add(stern);
      if (sail) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6), woodM);
        m.position.y = 0.9; m.castShadow = false; parent.add(m); // no shadows on the pond: under the low golden sun the mast/sail/oar shadows are long blue streaks across the water
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.9), sailM);
        s.position.set(0, 0.95, -0.05); s.castShadow = false; parent.add(s);
      } else {
        for (const side of [-1, 1]) { // one oar each side, tip in the water
          const o = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6).rotateX(side * 1.0), woodM);
          o.position.set(0.1, 0.22, side * 0.55); o.castShadow = false; parent.add(o);
        }
      }
    };
    mk(this.pondSail, redM, true);
    mk(this.pondRow, woodM, false);
    this.pondSail.position.set(POND[0] + 2.5, 0.05, POND[2] - 1.5);
    this.pondRow.position.set(POND[0] - 3, 0.05, POND[2] + 1);
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
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], tau = s.tau(t), L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK); // sky, clouds and sun sprites live on the no-ink layer but are still rendered
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
    this.fill.intensity = 0; // not used by the two-tone shading
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
    // ---- sea colours (on-screen targets, tone-map-inverted) ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    // ---- foreground framing objects: inside their frames AND their own shot (so a crossfade layer never shows them) ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- ships + pond boats ----
    this.poseShips(tau, t, id, f);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stageFn(id, t, seaState(id, t), { pos: cam.position, right });
    if (id === 8) splashFn(tau, st); // the ram: mast falls, big splash at the impact
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
      if (a.mat.emissiveMap) a.mat.emissive.set(tint); // legacy emissive card until the CHAR agent's cardShade lands
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

  private poseShips(tau: number, t: number, id: number, f: number) {
    // ---- lanong: rows from the horizon to the VOC ship, hull surging with the stroke ----
    const Z = lanongZ(tau);
    const ph = tau < SNAP ? rowPhase(tau) : rowPhase(SNAP); // oars freeze once the ram lands
    const sw = 2 * Math.PI * ph, sg = surge(tau);
    this.lanong.position.set(0, sg * 0.35 * Math.sin(sw), Z);
    this.lanong.rotation.set(0.015 * sg * Math.sin(sw + 1.2), 0, 0.02 * Math.sin(t * 0.5));
    this.lanongSail.rotation.y = 0.04 * Math.sin(t * 0.8);
    // three banks of oars dipping in sync
    const q = new THREE.Quaternion(), eu = new THREE.Euler(), one = V(1, 1, 1), pos = V(0, 0, 0);
    let oi = 0;
    for (let tier = 0; tier < OAR_TIERS.length; tier++) {
      for (const side of [-1, 1]) {
        for (const z of OAR_Z) {
          const dip = 1.13 + 0.28 * Math.sin(sw + tier * 0.15); // tip kisses the water at the bottom of the stroke
          eu.set(0.22 * Math.cos(sw), 0, side * dip);
          q.setFromEuler(eu);
          this.oars.setMatrixAt(oi++, this.m4.compose(pos.set(side * 2.25, OAR_TIERS[tier], z), q, one));
        }
      }
    }
    this.oars.instanceMatrix.needsUpdate = true;
    // ---- VOC ship: gentle bob; sails slack when the wind dies; main mast falls after the ram ----
    const sl = slack(tau), mf = mastFall(tau);
    this.voc.position.y = 0.08 * Math.sin(t * 0.9) - 0.15 * mf;
    this.voc.rotation.set(0.01 * Math.sin(t * 0.7), 0, 0.012 * Math.sin(t * 0.6) + 0.05 * mf);
    for (const s of this.vocSails) {
      s.m.scale.set(1 - 0.12 * sl, 1 - 0.5 * sl, 1);
      s.m.position.y = s.baseY - 1.2 * sl;
    }
    this.vocMainMast.rotation.x = -1.25 * mf; // top falls toward the lanong (-z)
    // ---- pond toy boats: sailboat still, rowboat crossing the pond in shots 10-11 ----
    const u = id === 11 ? clamp01((f - 1411) / 210) : 0;
    this.pondRow.position.set(POND[0] - 3 + 6 * u, 0.05 + 0.02 * Math.sin(t * 2.2), POND[2] + 1 + 0.8 * Math.sin(u * Math.PI));
    this.pondSail.position.y = 0.05 + 0.02 * Math.sin(t * 2.2 + 1.5);
    this.pondSail.rotation.y = 0.1 * Math.sin(t * 0.9);
  }
}

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);           // slow drift along +x
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

/** horizontal quad facing up at height y covering x0..x1, z0..z1 (z0 < z1) */
function quadAt(x0: number, x1: number, z0: number, z1: number, y: number, u: number, v: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
