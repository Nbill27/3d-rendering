// VIDEO04: the whole place as one three.js scene — one wheat-field location in the Campion district:
// a dirt road running south through golden wheat, a settler farmhouse in the east, a smashed boundary
// fence across the field, a watering hole in the south-west, a windmill, and gum trees.
// Posed every frame from the story timeline (story.ts).
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
// Light rig / sky / fog / clouds follow the bridge template.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house, prop, Kit, kitClone } from "./build";
import { ctex, beam, stoneHD, wheatHD, dirtHD, cloudHD, grainHD, grainDarkHD, strawHD, rippleHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, storyState, FARM_POS, HOLE_POS, FOREGROUND, ShotDef } from "./story";

// ---------------- assets ----------------
// Tahap 6: folder public/bridge/kenney/ TIDAK ADA, jadi loader GLB lama hanya
// menembak 26 request 404 di tiap render (dan sempat membuat still f550/f735
// gagal timeout di puppeteer-evaluate). Semua prop kit memang sudah null dan
// dilewati prop()/kitClone() di build.ts; vegetasi digambar dari kode (VEG),
// jadi kit kosong memberi hasil visual yang persis sama tanpa badai 404.
export const loadKit = (): Promise<Kit> => Promise.resolve({} as Kit);

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
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 420 + (i % 3) * 50;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 120 + (i % 4) * 25;
      m.position.set(Math.cos(a) * d, 28 + (i % 4) * 6, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- static land: wheat everywhere, a dirt road south, mud at the watering hole ----
    const b = new Batch();
    M.wheat = lam("wheatHD", () => ({ map: wheatHD() }));
    M.dirt = lam("dirtRoad", () => ({ map: dirtHD() }));
    M.mud = lam("mud", () => ({ map: dirtHD(), color: "#9a7a52" }));
    M.cream = lam("farmCream", () => ({ map: stoneHD("farmCream", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
    M.wood = lam("wood", () => ({ map: beam() }));
    M.dark = lam("darkWood", () => ({ map: grainDarkHD() }));
    M.fence = lam("fenceWood", () => ({ color: "#8a6a44" }));
    // Hairline Tahap 4: grain along the fence RAILS only (posts stay flat — a horizontal
    // grain on a vertical post would read the wrong way); crates share the dark grain.
    M.fenceRail = lam("fenceRail", () => ({ map: grainHD() }));
    M.waterBlue = new THREE.MeshBasicMaterial({ map: rippleHD(), transparent: true, opacity: 0.85 });
    M.sand = lam("sandbag", () => ({ color: "#9a8a5e" }));
    M.reed = lam("reed", () => ({ color: "#6a7a3a" }));
    M.rock = lam("rock", () => ({ color: "#8a8578" }));
    M.hay = lam("hay", () => ({ map: strawHD() }));
    M.rut = lam("rut", () => ({ color: "#7a5c3a" }));
    // wheat everywhere, dirt road down the middle, a dirt yard in front of the farmhouse
    b.add(quadAt(-900, 900, -900, 900, 0, 225, 225), M.wheat);
    b.add(quadAt(-2.5, 2.5, -45, 60, 0.012, 1.2, 10), M.dirt); // fewer repeats: reads as dirt, not paving
    b.add(quadAt(18, 32, -24, -12, 0.012, 3.5, 3), M.dirt); // farmhouse yard
    // trampled wheat where the emus smashed through: bare mud patches by the fence gap and at the waterhole approach
    b.add(quadAt(-8, 2, -14, -8, 0.008, 2, 1.5), M.mud);
    b.add(quadAt(2, 8, -13, -9, 0.008, 1.5, 1), M.mud);
    b.add(quadAt(-20, -12, 14, 18, 0.008, 2, 1), M.mud);
    // ---- farmhouse at FARM_POS (24,0,-18): house facing west toward the road + a small shed ----
    house(b, FARM_POS[0], FARM_POS[2], -Math.PI / 2, 7, 8, 7, 1);
    house(b, FARM_POS[0] + 5, FARM_POS[2] - 7, Math.PI, 5, 5, 5, 3);
    // ---- the smashed boundary fence across the field at z = -10: posts every 2 m, rails between them,
    //  a gap where the emus broke through (x -2..2), two leaning posts, one sagging rail ----
    const FZ = -10;
    const lean: Record<number, number> = { "-8": -0.25, "6": 0.2, "12": -0.15 };
    for (let x = -14; x <= 14; x += 2) {
      if (x >= -2 && x <= 2) continue; // the gap the emus smashed through
      const a = lean[x] ?? 0;
      const m = new THREE.Matrix4().makeRotationZ(a).setPosition(x, 0, FZ);
      b.add(boxGeo(V(0, 0, 0), V(0.18, 1.2, 0.18), 0), M.fence, m);
    }
    for (let x = -14; x < 14; x += 2) {
      if (x >= -2 && x < 2) continue; // no rails across the gap
      if (x === 8) { // the sagging rail: one end dropped
        const m = new THREE.Matrix4().makeRotationZ(-0.18).setPosition(x, 0.62, FZ);
        b.add(boxGeo(V(0, 0, -0.05), V(2, 0.12, 0.05), 0), M.fenceRail, m);
        continue;
      }
      b.add(boxGeo(V(x, 0.95, FZ - 0.05), V(x + 2, 1.07, FZ + 0.05), 0), M.fenceRail);
      b.add(boxGeo(V(x, 0.55, FZ - 0.05), V(x + 2, 0.67, FZ + 0.05), 0), M.fenceRail);
    }
    // fallen pieces by the gap: a rail knocked flat and a post lying on the ground
    b.add(boxGeo(V(-2.5, 0.05, -9.3), V(-0.5, 0.2, -9.1), 0), M.fenceRail);
    b.add(boxGeo(V(1.4, 0.05, -9.8), V(1.6, 0.18, -8.2), 0), M.fence);
    // ammo crates by the gun positions (shots 5-7): two on the road verge, one by the waterhole
    b.add(boxGeo(V(5.1, 0, 9.6), V(5.65, 0.55, 10.15), 0), M.dark);
    b.add(boxGeo(V(5.15, 0.55, 9.7), V(5.6, 1.0, 10.1), 0), M.dark);
    b.add(boxGeo(V(-5.65, 0, 9.6), V(-5.1, 0.55, 10.15), 0), M.dark);
    b.add(boxGeo(V(-9.5, 0, 24.5), V(-8.95, 0.5, 25.05), 0), M.dark);
    // ---- anatomy upgrade (Tahap 2): sandbag parapets at the gun positions (S5/S6 road guns
    //  and the S7 waterhole gun), reeds + rocks around the watering hole, hay bales and wheat
    //  sheaves in the field, wheel ruts along the road (the S8 truck chase). All boxGeo, no GLB. ----
    const sandbag = (x: number, z: number, yaw: number) => {
      const m = new THREE.Matrix4().makeRotationY(yaw);
      const put = (dx: number, dy: number, dz: number, w: number, h: number, d: number) => {
        const mm = new THREE.Matrix4().makeTranslation(x + dx, dy, z + dz).multiply(m);
        b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2), 0), M.sand, mm);
      };
      put(-0.3, 0, 0, 0.6, 0.22, 0.34); put(0.3, 0, 0, 0.6, 0.22, 0.34);
      put(0, 0.22, 0, 0.6, 0.22, 0.34);
    };
    // low sandbag stacks flanking the road at the two road guns (S5/S6): kept clear of the
    // road centre (|x| < 2) so the S8 truck chase never drives through them, and clear of
    // the guns themselves so the Lewis tripods stay visible from the S5/S6 cameras
    for (const [x, z] of [[-5.2, 9.0], [-4.6, 10.1], [4.6, 10.1], [5.2, 9.0]] as const) sandbag(x, z, 0.4);
    // crescent around the waterhole gun (west + north only: the east stays clear for the ambush party)
    for (const [x, z, y] of [[-12.6, 22.6, 0.5], [-12.9, 23.9, -0.4], [-11.6, 21.7, 0.9], [-9.2, 21.9, -0.7]] as const) sandbag(x, z, y);
    // reeds around the waterhole (same east-sector gap as the emu ring) + rocks at the water's edge
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      if (a < 0.96) continue;
      const r = 4.7 + (i % 3) * 0.4, x = HOLE_POS[0] + r * Math.cos(a), z = HOLE_POS[2] + r * Math.sin(a) * 0.8;
      const m = new THREE.Matrix4().makeRotationZ((i % 2 ? -1 : 1) * 0.12).setPosition(x, 0.6, z);
      b.add(boxGeo(V(-0.035, -0.6, -0.035), V(0.035, 0.6, 0.035), 0), M.reed, m);
    }
    for (const [x, z, s] of [[-11.8, 17.2, 0.6], [-19.5, 23.5, 0.45], [-13.5, 24.6, 0.5], [-18.8, 16.8, 0.4], [-12.2, 15.9, 0.55]] as const)
      b.add(boxGeo(V(x - s / 2, 0, z - s / 2), V(x + s / 2, s * 0.6, z + s / 2), 0), M.rock);
    // hay bales in the field, clear of the road, fence line, farmhouse, waterhole and camera corridors
    for (const [x, z] of [[-24, -20], [26, -28], [-30, 10], [30, 36], [-20, 44]] as const) {
      b.add(boxGeo(V(x - 0.75, 0, z - 0.45), V(x + 0.75, 0.9, z + 0.45), 0), M.hay);
      b.add(boxGeo(V(x - 0.45, 0.9, z - 0.75), V(x + 0.45, 1.35, z + 0.75), 0), M.hay);
    }
    // wheat sheaves by the farmhouse yard (S2/S4)
    for (const [x, z, tilt] of [[18.5, -12.5, 0.1], [31.5, -12, -0.12], [22, -20.5, 0.08]] as const) {
      const m = new THREE.Matrix4().makeRotationZ(tilt).setPosition(x, 0.6, z);
      b.add(boxGeo(V(-0.2, -0.6, -0.2), V(0.2, 0.6, 0.2), 0), M.hay, m);
      const m2 = new THREE.Matrix4().makeRotationZ(tilt).setPosition(x, 0.75, z);
      b.add(boxGeo(V(-0.22, -0.06, -0.22), V(0.22, 0.06, 0.22), 0), M.dark, m2);
    }
    // wheel ruts along the dirt road (the S8 truck chase)
    b.add(quadAt(-1.6, -1.0, -45, 60, 0.014, 1, 10), M.rut);
    b.add(quadAt(1.0, 1.6, -45, 60, 0.014, 1, 10), M.rut);
    // ---- watering hole at HOLE_POS (-16,0,20): mud ring + blue water disc ----
    const mud = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.06, 24), M.mud);
    mud.position.set(HOLE_POS[0], 0.03, HOLE_POS[2]); mud.receiveShadow = true; R.add(mud);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.08, 24), M.waterBlue);
    water.position.set(HOLE_POS[0], 0.05, HOLE_POS[2]); R.add(water);
    // ---- windmill east of the road, and distant farmhouses ----
    prop(b, kit, "windmill", 34, 0, 26, 12, 0);
    house(b, -42, -40, 0, 7, 8, 7, 2);
    house(b, 44, -38, 0, 7, 8, 7, 4);
    house(b, -44, 38, Math.PI / 2, 7, 8, 7, 5);
    house(b, 40, 44, Math.PI, 7, 8, 7, 0);
    // trees on the wheat, clear of the sites and the camera corridors
    const hr = (() => { let s = 11; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    const clearOf = (x: number, z: number) =>
      Math.hypot(x - FARM_POS[0], z - FARM_POS[2]) > 12 &&
      Math.hypot(x - HOLE_POS[0], z - HOLE_POS[2]) > 10 &&
      Math.hypot(x - 34, z - 26) > 8 && // the windmill
      !(Math.abs(x) < 8 && z > -45 && z < 62) && // the road corridor
      !(Math.abs(z + 10) < 3 && Math.abs(x) < 18) && // the fence line
      !(x > 2 && x < 20 && z > -4 && z < 20) && // shots 5-6 camera corridor (east of the road)
      !(x > -12 && x < 2 && z > 22 && z < 34) && // shot 7 camera corridor (waterhole)
      !(x > 16 && x < 38 && z > -26 && z < -8); // shots 2-4 camera corridor (farmhouse)
    const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
    for (let i = 0; i < 46; i++) {
      const x = -60 + hr() * 120, z = -50 + hr() * 105;
      if (!clearOf(x, z)) continue;
      prop(b, kit, trees[Math.floor(hr() * trees.length)], x, 0, z, 7 + hr() * 4, hr() * 6);
    }
    for (const [x, z] of [[-28, 32], [28, 34], [-34, -30], [36, 28], [-36, 30]] as const)
      prop(b, kit, "tree_oak", x, 0, z, 8, x);
    // bushes and hedges to pack the field: hand-placed clear of the road, the fence line,
    // the farmhouse, the waterhole and the camera corridors
    for (const [x, z] of [[-14, -28], [-20, -18], [14, -30], [-24, 8], [20, 30], [-30, -6], [30, -32], [-12, 44], [16, 44],
      [-36, 12], [36, 6], [-18, -40], [22, -42], [-28, 48], [28, 50], [12, -38], [-38, -22], [38, 40], [24, -32], [30, 14]] as const)
      prop(b, kit, "plant_bush", x, 0, z, 1.6 + hr() * 0.8, hr() * 6);
    for (const [x, z] of [[16, -24], [32, -13]] as const)
      prop(b, kit, "hedge", x, 0, z, 1.2, 0);
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
