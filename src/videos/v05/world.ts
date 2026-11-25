// VIDEO05: the whole place as one three.js scene — Commercial Street, North End, Boston:
// the giant molasses tank in the north, a cobbled street running south, the Boston Elevated
// Railway on the west side, brick row houses on both sides.
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
// Light rig / sky / fog / clouds follow the bridge template.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, boxGeo, V, lam, house, prop, Kit, kitClone } from "./build";
import { ctex, beam, stoneHD, cobbleHD, molassesHD, tankHD, cloudHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, storyState, TANK_POS, TANK_FACE_Z, EL_X, FOREGROUND, ShotDef } from "./story";

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
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 9: { az: -70, el: 8 }, 10: { az: -30, el: 18 } };

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
  private train!: THREE.Group;
  private molassesPool!: THREE.Mesh;
  private burstSplash!: THREE.Mesh;
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

    // ---- static land: cobbled street, stone sidewalks, brick row houses (one merged batch) ----
    const b = new Batch();
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.stone = lam("plazaStone", () => ({ map: stoneHD("plazaStone", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") }));
    M.brick = lam("brickWall", () => ({ map: stoneHD("brickWall", ["#b8643f", "#a85438", "#c06a44", "#9c4e33"], "#7e4630") }));
    M.steel = lam("steel", () => ({ color: "#5a6068" }));
    M.steelDark = lam("steelDark", () => ({ color: "#3a3f46" }));
    M.tankSteel = lam("tankSteel", () => ({ map: tankHD() }));
    M.rust = lam("rust", () => ({ color: "#7d5234" }));
    M.molasses = lam("molassesMat", () => ({ map: molassesHD() }));
    M.molassesDark = lam("molassesDark", () => ({ color: "#4a2410" }));
    M.splash = lam("splashMat", () => ({ color: "#7a4416" }));
    M.trainGreen = lam("trainGreen", () => ({ color: "#2f4d3a" }));
    M.trainWin = lam("trainWin", () => ({ color: "#cfe3f2" }));
    M.wood = lam("wood", () => ({ map: beam() }));
    M.dark = lam("darkWood", () => ({ color: "#5a3b2a" }));
    // cobbles everywhere under the town, stone sidewalks along the street
    b.add(quadAt(-900, 900, -900, 900, 0, 225, 225), M.cobble);
    b.add(quadAt(-10.5, -7, -26, 62, 0.012, 1, 22), M.stone); // west sidewalk
    b.add(quadAt(7, 10.5, -26, 62, 0.012, 1, 22), M.stone); // east sidewalk
    // ---- the giant molasses tank at TANK_POS (0,0,-40): 15 m tall, 27 m across, riveted steel ----
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 13.5, 15, 28), M.tankSteel);
    tank.position.set(TANK_POS[0], 7.5, TANK_POS[2]); tank.castShadow = true; tank.receiveShadow = true; R.add(tank);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(13.8, 3, 28), M.steelDark);
    roof.position.set(TANK_POS[0], 16.5, TANK_POS[2]); roof.castShadow = true; R.add(roof);
    for (const y of [3, 6, 9, 12]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(13.55, 0.22, 8, 40), M.rust);
      band.rotation.x = Math.PI / 2; band.position.set(TANK_POS[0], y, TANK_POS[2]); R.add(band);
    }
    // ladder + pipes on the south face, drip streaks down the seams (the tank leaked for years)
    b.add(boxGeo(V(-0.4, 0, TANK_FACE_Z - 0.3), V(0.4, 14, TANK_FACE_Z - 0.1), 0), M.steelDark);
    for (const [dx, dy] of [[-2.5, 1.5], [2.5, 1.5]] as const) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 13, 8), M.steel);
      pipe.position.set(TANK_POS[0] + dx, 6.5, TANK_FACE_Z - 0.2); R.add(pipe);
      void dy;
    }
    for (const [x, y0, y1] of [[-5, 2, 9], [1.5, 3, 11], [6.5, 1.5, 7]] as const) {
      b.add(boxGeo(V(x - 0.15, y0, TANK_FACE_Z - 0.05), V(x + 0.15, y1, TANK_FACE_Z + 0.05), 0), M.molassesDark);
    }
    // ---- Boston Elevated Railway along the west side (x = EL_X): columns, girders, cross beams ----
    for (let z = -20; z <= 52; z += 8) {
      b.add(boxGeo(V(EL_X - 0.3, 0, z - 0.3), V(EL_X + 0.3, 6, z + 0.3), 0), M.steelDark);
    }
    b.add(boxGeo(V(EL_X - 1.3, 6, -22), V(EL_X - 0.9, 6.8, 54), 0), M.steel);
    b.add(boxGeo(V(EL_X + 0.9, 6, -22), V(EL_X + 1.3, 6.8, 54), 0), M.steel);
    for (let z = -20; z <= 52; z += 8) b.add(boxGeo(V(EL_X - 1.3, 6.4, z - 0.25), V(EL_X + 1.3, 6.8, z + 0.25), 0), M.steelDark);
    // ---- the elevated train car (animated: lifted + tilted off the tracks after the wave) ----
    this.train = new THREE.Group();
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 12), M.trainGreen);
    car.position.set(0, 1.3, 0); car.castShadow = true; this.train.add(car);
    const carRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 12.2), M.steelDark);
    carRoof.position.set(0, 2.75, 0); this.train.add(carRoof);
    for (let dz = -4.5; dz <= 4.5; dz += 2.25) {
      for (const sx of [-1.32, 1.32]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 1.1), M.trainWin);
        win.position.set(sx, 1.7, dz); this.train.add(win);
      }
    }
    this.train.position.set(EL_X, 6.9, 18);
    R.add(this.train);
    // ---- molasses pool on the street (grows south from the tank after the burst) ----
    const poolGeo = new THREE.PlaneGeometry(14, 76);
    poolGeo.rotateX(-Math.PI / 2);
    this.molassesPool = new THREE.Mesh(poolGeo, M.molasses);
    this.molassesPool.position.set(0, 0.15, 12);
    this.molassesPool.receiveShadow = true; this.molassesPool.visible = false;
    R.add(this.molassesPool);
    // ---- burst splash at the tank face (grows with the rupture; tucked half inside the tank so it never pokes through the wave card) ----
    this.burstSplash = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), M.splash);
    this.burstSplash.scale.set(2, 0.8, 0.8);
    this.burstSplash.position.set(0, 1.8, TANK_FACE_Z - 0.5);
    this.burstSplash.visible = false;
    R.add(this.burstSplash);
    // ---- brick row houses, east side facing west, west side facing east ----
    const hr = (() => { let s = 11; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    for (const [xf, z0, z1, yaw] of [[16, -8, 52, -Math.PI / 2], [-20, -8, 52, Math.PI / 2]] as const) {
      let z = z0;
      while (z < z1) {
        const w = [7, 9][Math.floor(hr() * 2)], h = [7, 8.4, 9.8][Math.floor(hr() * 3)];
        house(b, xf, z + w / 2, yaw, w, 8, h, Math.floor(hr() * 8), 0);
        z += w + (hr() < 0.25 ? 2.5 : 0.3);
      }
    }
    // ---- distant taller skyline at the south end + a church steeple ----
    for (const [x, z] of [[-24, 68], [-8, 70], [10, 68], [26, 70]] as const) house(b, x, z, 0, 9, 8, 12, Math.floor(hr() * 8), 0);
    const steeple = new THREE.Mesh(new THREE.ConeGeometry(2.2, 7, 4), M.steelDark);
    steeple.position.set(-8, 12 + 3.5, 70); steeple.rotation.y = Math.PI / 4; R.add(steeple);
    // trees behind the houses, clear of the street / el / camera corridors
    const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
    for (let i = 0; i < 30; i++) {
      const x = -60 + hr() * 120, z = -50 + hr() * 110;
      if (Math.abs(x) < 13 && z > -30 && z < 62) continue; // street + sidewalks
      if (Math.abs(x + 11.5) < 4 && z > -24 && z < 56) continue; // the el
      if (Math.abs(x - 16) < 8 && z > -12 && z < 56) continue; // east houses
      if (Math.abs(x + 20) < 8 && z > -12 && z < 56) continue; // west houses
      if (Math.hypot(x, z + 40) < 18) continue; // the tank
      prop(b, kit, trees[Math.floor(hr() * trees.length)], x, 0, z, 7 + hr() * 4, hr() * 6);
    }
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
    // ---- animated props: the elevated train lifts off its tracks, the molasses pool grows, the burst splash swells ----
    const st = storyState(id, t);
    this.train.rotation.z = st.train * 0.22;
    this.train.position.y = 6.9 + st.train * 1.2;
    this.train.position.x = EL_X + st.train * 0.9;
    this.molassesPool.visible = st.pool > 0.01;
    this.molassesPool.scale.y = Math.max(0.001, st.pool);
    this.molassesPool.position.z = -26 + 38 * st.pool;
    // the burst mound only matters during the burst itself; once the wave has moved on, the pool carries the scene
    this.burstSplash.visible = st.burst > 0.02 && t < 30;
    this.burstSplash.scale.set(2 + 1.5 * st.burst, 0.8 + 0.8 * st.burst, 0.8 + 0.8 * st.burst);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const stg = stageFn(id, t, st, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of stg.places) {
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
    for (const p of stg.fx) {
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
