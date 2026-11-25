// NEGARA SISTEM BOBROK: the whole place as one three.js scene — a town square, the government
// building with a stage, the unfinished project, the office with its queue, the leaking budget
// pipe, and the leaky-bucket park — posed every frame from the story timeline (story.ts).
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
// Light rig / sky / fog / clouds follow the bridge template.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, boxGeo, V, lam, house, prop, Kit, kitClone } from "./build";
import { ctex, beam, stoneHD, grassHD, cloudHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, townState, PROJECT_POS, OFFICE_POS, BUCKET_POS, FOREGROUND, ShotDef } from "./story";

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
/** red stage banner: cream field, red bands, dark border */
const bannerTex = () => ctex("stageBanner", 512, 256, (g) => {
  g.fillStyle = "#f2e6c8"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#b03a2e";
  for (const y of [20, 110, 200]) g.fillRect(0, y, 512, 18);
  g.strokeStyle = "#7a2c1e"; g.lineWidth = 10; g.strokeRect(5, 5, 502, 246);
  g.fillStyle = "#b03a2e"; g.beginPath(); g.arc(256, 128, 42, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#f2e6c8"; g.beginPath(); g.arc(256, 128, 24, 0, Math.PI * 2); g.fill();
});
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 11: { az: -70, el: 8 }, 12: { az: -30, el: 18 } };

type Mats = Record<string, THREE.Material>;

/** stage() result, mirrored structurally so this file does not depend on cast.ts's exact Stage type */
type StageLike = {
  places: { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number] }[];
  fx: { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean }[];
};
const stageFn = stage as unknown as (id: number, t: number, b: unknown, cam: { pos: THREE.Vector3; right: THREE.Vector3 }) => StageLike;

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
  private flag!: THREE.Mesh;
  private craneArm!: THREE.Group;
  private cable!: THREE.Mesh;
  private bucketWater!: THREE.Mesh;
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

    // ---- static land: grass, stone plaza, road (one merged batch) ----
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.stone = lam("plazaStone", () => ({ map: stoneHD("plazaStone", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") }));
    M.cream = lam("govCream", () => ({ map: stoneHD("govCream", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
    M.wood = lam("wood", () => ({ map: beam() }));
    M.concrete = lam("concrete", () => ({ map: stoneHD("concrete", ["#b9b3a8", "#a8a29a", "#c2bcb0", "#9d978c"], "#7e7870") }));
    M.dark = lam("darkWood", () => ({ color: "#5a3b2a" }));
    M.red = new THREE.MeshLambertMaterial({ color: "#b03a2e", side: THREE.DoubleSide });
    M.gold = lam("gold", () => ({ color: "#c9a24e" }));
    M.pipe = lam("pipeGrey", () => ({ color: "#7d848c" }));
    M.bucketBlue = lam("bucketBlue", () => ({ color: "#3d7ea6" }));
    M.waterBlue = new THREE.MeshBasicMaterial({ color: "#4aa8d8", transparent: true, opacity: 0.75 });
    // grass everywhere, stone plaza around the centre, a road south
    b.add(quadAt(-900, 900, -900, 900, 0, 225, 225), M.grass);
    b.add(quadAt(-20, 20, -20, 16, 0.012, 10, 9), M.stone);
    b.add(quadAt(-3, 3, 16, 60, 0.012, 1.5, 11), M.stone);
    b.add(quadAt(20, 40, -12, 16, 0.012, 5, 7), M.stone); // pavement under the office + queue
    // ---- government building at GOV (0,0,-28): hall, steps, columns, pyramid roof, flag ----
    b.add(boxGeo(V(-12, 0, -34), V(12, 9, -22), 2), M.cream);
    b.add(boxGeo(V(-13, 9, -35), V(13, 10, -21), 2), M.stone); // roof slab
    b.add(boxGeo(V(-11, 0, -22), V(11, 0.5, -19.5), 2), M.stone); // steps
    b.add(boxGeo(V(-10, 0.5, -22), V(10, 1.0, -20.5), 2), M.stone);
    for (const xc of [-10, -6, -2, 2, 6, 10]) {
      const col = new THREE.CylinderGeometry(0.55, 0.65, 8, 10);
      b.add(col, M.cream, new THREE.Matrix4().makeTranslation(xc, 4, -21.5));
    }
    // pyramid roof (4-sided cone, squashed in z)
    const pyr = new THREE.ConeGeometry(11, 3.5, 4); pyr.rotateY(Math.PI / 4); pyr.scale(1, 1, 0.62);
    b.add(pyr, M.stone, new THREE.Matrix4().makeTranslation(0, 10 + 1.75, -28));
    // dark windows on the front face
    for (const xc of [-8, -4, 0, 4, 8]) b.add(boxGeo(V(xc - 1, 3, -22.1), V(xc + 1, 6, -21.9), 0), M.dark);
    // flag pole + red pennant on the roof
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4, 8), M.dark);
    pole.position.set(0, 15, -28); pole.castShadow = true; R.add(pole);
    this.flag = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.1, 8, 1), M.red);
    this.flag.position.set(1.05, 16.2, -28); this.flag.castShadow = true; R.add(this.flag);
    // ---- stage at STAGE_POS (0,0,-18): platform, backdrop banner, podium ----
    b.add(boxGeo(V(-5, 0, -20.5), V(5, 0.8, -15.5), 2), M.wood);
    const bannerM = new THREE.MeshBasicMaterial({ map: bannerTex(), side: THREE.DoubleSide });
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), bannerM);
    banner.position.set(0, 2.6, -20.2); banner.castShadow = false; R.add(banner);
    for (const xc of [-4.6, 4.6]) {
      const bp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.4, 8), M.dark);
      bp.position.set(xc, 2.2, -20.2); bp.castShadow = true; R.add(bp);
    }
    b.add(boxGeo(V(1.2, 0.8, -18.4), V(1.8, 1.7, -17.9), 2), M.wood); // podium
    // ---- unfinished project at PROJECT_POS (-32,0,-10): concrete skeleton + idle crane ----
    for (const [xc, zc] of [[-38, -14], [-26, -14], [-38, -6], [-26, -6]] as const)
      b.add(boxGeo(V(xc - 0.5, 0, zc - 0.5), V(xc + 0.5, 7, zc + 0.5), 2), M.concrete);
    b.add(boxGeo(V(-38.5, 3.5, -14.5), V(-25.5, 4.0, -5.5), 2), M.concrete); // floor slab 1
    b.add(boxGeo(V(-38.5, 7.0, -14.5), V(-25.5, 7.5, -5.5), 2), M.concrete); // floor slab 2 (roof, no walls)
    // crane: mast + jib (built as a group so the jib can sway almost imperceptibly)
    this.craneArm = new THREE.Group();
    this.craneArm.position.set(-40, 0, -16);
    const mast = new THREE.Mesh(boxGeo(V(-0.5, 0, -0.5), V(0.5, 14, 0.5), 0), M.pipe);
    mast.castShadow = true; this.craneArm.add(mast);
    const jib = new THREE.Mesh(boxGeo(V(-1, 13.2, -0.4), V(11, 13.9, 0.4), 0), M.pipe);
    jib.castShadow = true; this.craneArm.add(jib);
    const cw = new THREE.Mesh(boxGeo(V(-3.2, 12.4, -0.6), V(-1, 13.6, 0.6), 0), M.concrete);
    cw.castShadow = true; this.craneArm.add(cw);
    this.cable = new THREE.Mesh(boxGeo(V(9.7, 8, -0.1), V(10.0, 13.2, 0.1), 0), M.dark);
    this.craneArm.add(this.cable);
    const hook = new THREE.Mesh(boxGeo(V(9.3, 7.4, -0.4), V(10.4, 8.0, 0.4), 0), M.gold);
    hook.castShadow = true; this.craneArm.add(hook);
    R.add(this.craneArm);
    // red ribbon across the project entrance (shot 4, first key)
    for (const xc of [-27, -23]) {
      const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 8), M.dark);
      rp.position.set(xc, 0.8, -4); rp.castShadow = true; R.add(rp);
    }
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.35), M.red);
    ribbon.position.set(-25, 1.35, -4); R.add(ribbon);
    // ---- budget pipe at z=-24, y 5.5, x -20..-10 (west of the government building, clear of
    //  the stage), with 3 small buckets below ----
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 12).rotateZ(Math.PI / 2), M.pipe);
    pipe.position.set(-15, 5.5, -24); pipe.castShadow = true; R.add(pipe);
    for (const xc of [-19.5, -10.5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.5, 8), M.dark);
      post.position.set(xc, 2.75, -24); post.castShadow = true; R.add(post);
    }
    for (const xc of [-18, -16, -14]) {
      const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.9, 14), M.bucketBlue);
      bk.position.set(xc, 0.45, -24); bk.castShadow = true; R.add(bk);
    }
    // ---- office at OFFICE_POS (32,0,-6): block, roof, door + window on the south face ----
    b.add(boxGeo(V(27, 0, -10), V(37, 6, -2), 2), M.cream);
    b.add(boxGeo(V(26.5, 6, -10.5), V(37.5, 6.8, -1.5), 2), M.stone);
    b.add(boxGeo(V(31, 0, -2.1), V(33, 3, -1.9), 0), M.dark); // door
    b.add(boxGeo(V(34.2, 2, -2.1), V(36, 4, -1.9), 0), M.dark); // window
    b.add(boxGeo(V(30.5, 3.4, -2.15), V(33.5, 4.2, -1.85), 0), M.red); // sign board above the door
    // ---- leaky bucket at BUCKET_POS (18,0,22): big bucket, water, puddle, leak streams ----
    const bk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.95, 1.4, 20), M.bucketBlue);
    bk.position.set(BUCKET_POS[0], 0.7, BUCKET_POS[2]); bk.castShadow = true; R.add(bk);
    this.bucketWater = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24).rotateX(-Math.PI / 2), M.waterBlue);
    this.bucketWater.position.set(BUCKET_POS[0], 1.32, BUCKET_POS[2]); R.add(this.bucketWater);
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: "#4aa8d8", transparent: true, opacity: 0.45 }));
    puddle.position.set(BUCKET_POS[0], 0.03, BUCKET_POS[2] + 1.2); R.add(puddle);
    for (const [dx, dz, ry] of [[1.0, 0.3, 0.5], [-0.95, 0.55, -0.6], [0.2, 1.05, 0]] as const) {
      const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 6), M.waterBlue);
      stream.position.set(BUCKET_POS[0] + dx, 0.45, BUCKET_POS[2] + dz);
      stream.rotation.z = ry; stream.rotation.x = 0.4;
      R.add(stream);
    }
    // ---- town houses, clear of the stage / project / office / bucket / plaza ----
    const hr = (() => { let s = 11; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    const clearOf = (x: number, z: number) =>
      Math.hypot(x - PROJECT_POS[0], z - PROJECT_POS[2]) > 14 &&
      Math.hypot(x - OFFICE_POS[0], z - OFFICE_POS[2]) > 12 &&
      Math.hypot(x - BUCKET_POS[0], z - BUCKET_POS[2]) > 10 &&
      !(Math.abs(x) < 16 && z > -40 && z < -14);
    for (const [zf, x0, x1] of [[-42, -46, 46], [-46, -40, 40], [34, -44, 44], [40, -36, 36]] as const) {
      let x = x0;
      while (x < x1) {
        const w = [7, 9][Math.floor(hr() * 2)], h = [7, 8.4, 9.8][Math.floor(hr() * 3)];
        if (clearOf(x + w / 2, zf)) house(b, x + w / 2, zf, 0, w, 8, h, Math.floor(hr() * 8), 0);
        x += w + (hr() < 0.25 ? 2.5 : 0.3);
      }
    }
    for (const [xf, z0, z1] of [[-48, -24, 24], [48, -24, 24]] as const) {
      let z = z0;
      while (z < z1) {
        const w = [7, 9][Math.floor(hr() * 2)], h = [7, 8.4, 9.8][Math.floor(hr() * 3)];
        if (clearOf(xf, z + w / 2)) house(b, xf, z + w / 2, Math.PI / 2, w, 8, h, Math.floor(hr() * 8), 0);
        z += w + (hr() < 0.25 ? 2.5 : 0.3);
      }
    }
    // trees on the grass, clear of the sites and the plaza
    const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
    for (let i = 0; i < 46; i++) {
      const x = -60 + hr() * 120, z = -50 + hr() * 100;
      if (!clearOf(x, z)) continue;
      if (Math.abs(x) < 22 && z > -22 && z < 18) continue;
      if (z > 14 && Math.abs(x) < 26) continue; // south plaza camera corridor
      if (x > 18 && x < 44 && z > -16 && z < 20) continue; // office / queue camera corridor (shots 6-8)
      if (x > -26 && x < -10 && z > -4 && z < 14) continue; // project camera corridor (shot 4)
      prop(b, kit, trees[Math.floor(hr() * trees.length)], x, 0, z, 7 + hr() * 4, hr() * 6);
    }
    for (const [x, z] of [[-28, 32], [28, 34], [-34, -30], [36, 28], [-36, 30]] as const)
      prop(b, kit, "tree_oak", x, 0, z, 8, x);
    b.build(R);

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
    // ---- animated props: flag wave, crane jib almost still, bucket water shimmer ----
    this.flag.rotation.y = 0.25 * Math.sin(t * 1.8);
    this.craneArm.rotation.y = 0.01 * Math.sin(t * 0.3);
    this.cable.rotation.x = 0.02 * Math.sin(t * 0.7);
    this.bucketWater.position.y = 1.32 + 0.015 * Math.sin(t * 2.0);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stageFn(id, t, townState(id, t), { pos: cam.position, right });
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
