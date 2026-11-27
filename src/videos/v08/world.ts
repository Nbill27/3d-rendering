// VIDEO08: the whole place as one three.js scene — Niagara Falls, 1901.
// The river above the falls runs north (z decreasing) to the Horseshoe Falls cliff at z=-68;
// the east bank (x +2..+8) is where Annie, the barrel, the boat and the crowd are;
// the town street runs south (z +8..+65) with Annie's photo stall at z=32.
// The barrel, the boat, the pump and the two lids are dynamic groups posed every frame
// from the story timeline (story.ts); the falls are a curved stone cliff with white
// water curtains and a plunge pool at the base.
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
// Light rig / sky / fog / clouds follow the bridge template.
// NOTE: no Kenney GLB props are used anywhere here — the kit does not exist under public/;
// every prop is built from boxes / code (barrel, boat, pump, stall) or cartoon vegetation.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house, prop } from "./build";
import { ctex, beam, stoneHD, grassHD, cobbleHD, dirtHD, cloudHD, water } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, storyState, PUMP_POS, STALL_POS, BANK_Y, ShotDef, clamp01, pumpPose } from "./story";

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
/** the falls curtain: white water streaking down a pale blue face, foam at the bottom */
const fallsTex = () => ctex("fallsCurtain", 256, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#a8d0ea"); gr.addColorStop(0.55, "#8fc4e8"); gr.addColorStop(0.85, "#d8ecfa"); gr.addColorStop(1, "#ffffff");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 46; i++) {
    const x = r() * 256, w = 2 + r() * 7, y0 = r() * 120, len = 200 + r() * 300;
    g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.45})`;
    g.fillRect(x, y0, w, len);
  }
  for (let i = 0; i < 26; i++) {
    const x = r() * 256, y = 430 + r() * 70;
    g.fillStyle = `rgba(255,255,255,${0.5 + r() * 0.5})`;
    g.beginPath(); g.ellipse(x, y, 8 + r() * 18, 5 + r() * 9, 0, 0, Math.PI * 2); g.fill();
  }
});
/** the barrel's oak staves with the painted lettering "Heroine of Niagara Falls",
 *  drawn twice (u 0.25 and u 0.75) on the UPPER course, clear of the belly hoop,
 *  so it reads from the bank cameras and from the stall. Two copies, not four:
 *  four copies put a cut-off copy at the silhouette edge in every still (stage01). */
const barrelTex = () => ctex("barrelSide", 512, 256, (g) => {
  g.fillStyle = "#a8763e"; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 32) {
    g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(x, 0, 2, 256);
    g.fillStyle = "rgba(255,255,255,0.06)"; g.fillRect(x + 3, 0, 14, 256);
  }
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, 0, 512, 10); g.fillRect(0, 246, 512, 10);
});
/** the barrel's inscription on its own curved label (see below): it used to be baked
 *  into barrelTex as two repeated copies, and whichever copy faced the camera was
 *  always cut at the silhouette edge (stage01, 8 stills). One curved label,
 *  centred on the bank-side face, reads whole from every bank-side angle and
 *  simply turns away from the far side. */
const letterTex = () => ctex("barrelLabel", 256, 128, (g) => {
  g.clearRect(0, 0, 256, 128);
  g.fillStyle = "#2a4a7a";
  g.font = "bold 26px Arial, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("HEROINE OF", 128, 42);
  g.fillText("NIAGARA FALLS", 128, 88);
});
/** a tiny "photograph" for the stall's photo cards: sky, falls, barrel, ground.
 *  V1 used a flat blue-grey box, which read as an empty window (stage01, still_1590). */
const photoTex = () => ctex("photoPrint", 128, 160, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 160);
  gr.addColorStop(0, "#a8d0ea"); gr.addColorStop(0.6, "#d8ecfa"); gr.addColorStop(1, "#8a7a5a");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 160);
  g.fillStyle = "#f4fbff"; g.fillRect(44, 30, 40, 70); // the falls curtain
  g.fillStyle = "#7a5230"; g.fillRect(52, 108, 24, 30); // the barrel
  g.fillStyle = "#3a3f46"; g.fillRect(50, 114, 28, 4); g.fillRect(50, 128, 28, 4); // its hoops
  g.fillStyle = "#6a8a4a"; g.fillRect(0, 140, 128, 20); // ground
});
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 10: { az: 165, el: 22 } };

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
  private clouds: THREE.Mesh[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  private riverTex: THREE.Texture;
  private fallsTex: THREE.Texture;
  private barrel = new THREE.Group();
  private barrelLid: THREE.Mesh; private barrelLidTop: THREE.Group; private barrelContents: THREE.Group;
  private boat = new THREE.Group();
  private pump = new THREE.Group();
  private pumpHandle: THREE.Group; private pumpNeedle: THREE.Mesh;
  private rapids: THREE.Mesh[] = []; private foamPulse: THREE.Mesh[] = [];
  private lidHeld = new THREE.Group();
  private lidGround = new THREE.Group();

  constructor() {
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

    // ---- shared ground: grass everywhere, dirt bank, river, pool, cobbled street south ----
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
    M.dirt = lam("dirtYard", () => ({ map: dirtHD() }));
    M.stone = lam("stoneHD", () => ({ map: stoneHD() }));
    M.wood = lam("wood", () => ({ map: beam() }));
    M.dark = lam("darkWood", () => ({ color: "#5a3b2a" }));
    M.hill = lam("hillGrass", () => ({ map: grassHD(), color: "#7ab35a" }));
    M.foam = new THREE.MeshBasicMaterial({ color: "#ffffff" }); // foam stays white: the Lambert version rendered beige under the two-tone light and read as sandbars in the pool (v2 still_1070/1090)
    this.riverTex = water();
    this.riverTex.wrapS = this.riverTex.wrapT = THREE.RepeatWrapping;
    M.river = lam("riverWater", () => ({ map: this.riverTex }));
    M.pool = lam("poolWater", () => ({ map: water(), color: "#8fc4e0" }));
    b.add(quadAt(-900, 900, -900, 900, 0, 225, 225), M.grass);
    b.add(quadAt(-30, 1, -52, 8, 0.12, 8, 6), M.river); // the river above the falls (channel)
    b.add(quadAt(-18, 1, -66, -52, 0.12, 4, 3), M.pool); // the plunge pool at the falls base
    b.add(quadAt(1, 30, -28, -6, 0.3, 4, 4), M.dirt); // the east bank: Annie's ground (bluff)
    b.add(quadAt(1, 10, -62, -52, 0.3, 2, 2), M.dirt); // the pool beach: rescue ground (bluff)
    b.add(quadAt(-3, 3, 8, 65, 0.012, 1.2, 24), M.cobble); // the town street
    b.add(quadAt(3, 12, 12, 20, 0.012, 2, 2), M.dirt); // stall yard
    b.add(quadAt(2, 8, 28, 36, 0.02, 2, 2), M.dirt); // worn dirt under the photo stall
    b.add(quadAt(-12, -3, 24, 32, 0.012, 2, 2), M.dirt); // house yard west
    // hills far north (behind the falls) and far south (low, so the golden sunset shows in shot 10)
    for (const [x, z, sx, sy, sz] of [[0, 102, 70, 7, 24], [-48, 96, 55, 8, 20], [48, 96, 50, 6, 18],
      [0, -110, 80, 14, 22], [-55, -100, 55, 16, 20], [55, -100, 50, 12, 18]] as const) {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), M.hill);
      hill.position.set(x, -2, z); hill.scale.set(sx, sy, sz); hill.receiveShadow = true;
      R.add(hill);
    }
    b.build(R);

    // ---- the Horseshoe Falls: a curved stone cliff (5 arc segments) with a white
    // water curtain on each face and foam at the base. The arc opens south: the centre
    // is the deepest (north-most) point, the wings curl toward the viewer. ----
    const falls = new Batch();
    this.fallsTex = fallsTex();
    this.fallsTex.wrapS = this.fallsTex.wrapT = THREE.RepeatWrapping;
    const curtainMat = lam("fallsCurtain", () => ({ map: this.fallsTex, side: THREE.DoubleSide }));
    const streakMat = lam("fallsStreak", () => ({ color: "#ffffff", transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
    const lipMat = lam("fallsLip", () => ({ color: "#eef8ff" }));
    const cliffStoneTop = lam("cliffStoneTop", () => ({ map: stoneHD(), color: "#9a8a76" })); // dry rock at the top
    const cliffStoneMid = lam("cliffStoneMid", () => ({ map: stoneHD(), color: "#8a7a68" }));
    const cliffStoneBot = lam("cliffStoneBot", () => ({ map: stoneHD(), color: "#5f5142" })); // wet rock at the base
    for (const cx of [-13, -6.5, 0, 6.5, 13] as const) {
      const cz = -68 + (Math.abs(cx) / 16) ** 2 * 6; // arc: centre deepest
      const yaw = Math.atan((12 * cx) / 256); // tangent of the arc
      const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(cx, 0, cz);
      // cliff face: three stacked stone boxes so the face reads as rock, not one flat slab;
      // one colour per layer (dry top, wet dark base) so the layers read (anatomy)
      falls.add(boxGeo(V(-3.9, 0, -1.3), V(3.9, 7, 1.3), 0), cliffStoneBot, m);
      falls.add(boxGeo(V(-3.7, 7, -1.1), V(3.7, 13.5, 1.1), 0), cliffStoneMid, m);
      falls.add(boxGeo(V(-3.5, 13.5, -0.9), V(3.5, 20, 0.9), 0), cliffStoneTop, m);
      // water curtain on the south face, from the lip down to the pool; widened to 7.9
      // so the dark stone behind no longer shows as hard black seams between segments
      const cm = new THREE.Matrix4().makeRotationY(yaw).setPosition(cx, 0, cz + 1.5);
      falls.add(quad(V(-3.95, 0.4, 0), V(3.95, 0.4, 0), V(3.95, 19.6, 0), V(-3.95, 19.6, 0)), curtainMat, cm);
      // thin white streaks 0.15 in front of the curtain so the water reads as falling,
      // not as flat glass panels (stage01)
      for (const sx of [-2.2, 0.3, 2.4]) {
        const sw = 0.5 + hr() * 0.4;
        const sm = new THREE.Matrix4().makeRotationY(yaw).setPosition(cx, 0, cz + 1.65);
        falls.add(quad(V(sx - sw / 2, 0.4, 0), V(sx + sw / 2, 0.4, 0), V(sx + sw / 2, 19.6, 0), V(sx - sw / 2, 19.6, 0)), streakMat, sm);
      }
      // the lip: white water going over the top edge
      falls.add(boxGeo(V(-3.6, 19.6, -0.4), V(3.6, 20.1, 1.6), 0), lipMat, m);
    }
    // foam patches on the pool where the curtains land
    for (const [x, z, w, d] of [[-10, -64.5, 3, 1.5], [0, -65, 3.5, 2], [10, -64.5, 3, 1.5], [-4, -62, 2.5, 1.5], [5, -61.5, 2.5, 1.5]] as const) {
      falls.add(boxGeo(V(x - w / 2, 0.12, z - d / 2), V(x + w / 2, 0.22, z + d / 2), 0), M.foam,
        new THREE.Matrix4().makeRotationY(hr() * 0.6 - 0.3).setPosition(x, 0, z));
    }
    // boulders at the cliff base and along the west bank
    const rubble = (x: number, z: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const w = 0.6 + hr() * 1.2, h = 0.4 + hr() * 0.8, d = 0.6 + hr() * 1;
        const ox = (hr() - 0.5) * 4, oz = (hr() - 0.5) * 3;
        const g = boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2), 0);
        const mm = new THREE.Matrix4().makeRotationY(hr() * 6).multiply(new THREE.Matrix4().makeRotationZ((hr() - 0.5) * 0.4)).setPosition(x + ox, 0, z + oz);
        falls.add(g, hr() < 0.6 ? M.stone : M.dark, mm);
      }
    };
    rubble(-8, -60, 6); rubble(8, -60, 6); rubble(-14, -46, 5); rubble(12, -48, 4); rubble(-6, -54, 4);
    falls.build(R);

    // rapids streaks on the river just above the falls + two pulsing foam patches
    // at the pool edge (motion-tabel.md F): the river in v1 read as a flat blue canal.
    // The foam is unlit white: a Lambert foam rendered beige under the two-tone
    // light and read as sandbars in the pool (v2 still_1070/1090).
    const foamMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    for (const [fx, fz] of [[-13, -63], [13, -63]] as const) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 1.5), foamMat);
      m.position.set(fx, 0.17, fz); m.layers.set(NOINK);
      this.foamPulse.push(m); R.add(m);
    }
    const rapidMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 });
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.6), rapidMat);
      m.rotation.x = -Math.PI / 2; m.layers.set(NOINK);
      this.rapids.push(m); R.add(m);
    }

    // ---- Goat Island trees (west bank) + bank and town trees and bushes ----
    // VEG names are built in code (addVeg); the empty kit is never touched for them.
    // Tall trees (radius 0.2*h) and small bushes (s=1.2) only: a 2 m bush near the lens
    // is 3.2 m wide, and round trees are 0.39*h — both filled the frame in earlier videos.
    const veg = new Batch();
    const EMPTY_KIT = {};
    for (const [x, z, h] of [[-14, -30, 9], [-18, -36, 10], [-12, -24, 8], [-20, -28, 7], [-16, -42, 9], [12, -26, 9], [14, -12, 8], [-8, -10, 8], [-8, 14, 8], [10, 20, 7], [-8, 40, 9], [10, 48, 8], [-14, 58, 9], [14, 60, 8], [8.5, 26, 8]] as const)
      prop(veg, EMPTY_KIT, "tree_default", x, 0, z, h, hr() * 6);
    for (const [x, z] of [[-4, -22], [7, -24], [-5, -14], [8, -8], [-6, 18], [7, 44], [-5, 46], [20, -14], [19, -24]] as const)
      prop(veg, EMPTY_KIT, "plant_bush", x, 0, z, 1.2, hr() * 6);
    veg.build(R);

    // ---- the town: wooden houses along the street, photo stall at (4.5, 32) ----
    const town = new Batch();
    house(town, 9, 16, -Math.PI / 2, 7, 6, 4.5, 3);
    house(town, -9, 20, Math.PI / 2, 6, 6, 4, 4);
    house(town, 11, 36, -Math.PI / 2, 6, 6, 4, 5);
    house(town, -9, 36, Math.PI / 2, 7, 6, 4.5, 3);
    house(town, 9, 44, -Math.PI / 2, 6, 6, 4, 0);
    house(town, -9, 52, Math.PI / 2, 6, 6, 4, 4);
    house(town, 12, -4, -Math.PI / 2, 6, 6, 4, 1); // a house by the river's south end
    house(town, -12, -2, Math.PI / 2, 6, 6, 4, 6);
    town.build(R);
    this.buildStall(R);

    // ---- the barrel (dynamic): oak body with the painted lettering, THREE iron hoops,
    // a wooden lid with fittings (shown when closed) and its contents (shown when open):
    // a 3-layer mattress, the red heart pillow, and the anvil ballast. Anatomy + hairline. ----
    const oak = lam("barrelOak", () => ({ map: barrelTex() }));
    const iron = lam("ironHoop", () => ({ color: "#3a3f46" }));
    const lidMat = lam("barrelLid", () => ({ color: "#8a6a42" }));
    const mattMat = lam("mattress", () => ({ color: "#e8dcc0" }));
    const mattMat2 = lam("mattress2", () => ({ color: "#ded2b0" }));
    const corkMat = lam("cork", () => ({ color: "#d8c8a0" }));
    const brassMat = lam("brass", () => ({ color: "#b08a3a" }));
    const heartMat = lam("heartPillow", () => ({ color: "#c0353a" }));
    const anvilMat = lam("anvil", () => ({ color: "#2a2d33" }));
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.42, 1.5, 24), oak);
    body.castShadow = true; body.receiveShadow = true;
    this.barrel.add(body);
    // the inscription on a curved label hugging the barrel: a 1.4 rad segment
    // centred on theta 0.35 (the bank-side cameras sit at theta 0.2-0.5), radius
    // 0.46 (the body is 0.44-0.45 there), y 0.13-0.53, between the belly hoop
    // and the top hoop so no hoop crosses the text
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.46, 0.4, 24, 1, true, -0.35, 1.4),
      lam("barrelLabel", () => ({ map: letterTex(), transparent: true })),
    );
    label.position.y = 0.33;
    this.barrel.add(label);
    for (const hy of [-0.55, 0, 0.55]) {
      const hoop = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.12, 24), iron);
      hoop.position.y = hy; hoop.castShadow = true;
      this.barrel.add(hoop);
      // two rivet bolts on the belly hoop, facing the bank cameras
      if (hy === 0) for (const ba of [-0.5, 0.5]) {
        const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), iron);
        bolt.position.set(0.47 * Math.sin(ba), 0, 0.47 * Math.cos(ba));
        this.barrel.add(bolt);
      }
    }
    this.barrelLid = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 24), lidMat);
    this.barrelLid.position.y = 0.78; this.barrelLid.castShadow = true;
    this.barrel.add(this.barrelLid);
    // lid fittings ride with the lid: knob, 4 screws, the cork and the brass air valve
    // (the cork plugs the air hole after pumping, per SCRIPT.md)
    this.barrelLidTop = new THREE.Group();
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.09, 12), lidMat);
    knob.position.y = 0.86; knob.castShadow = true;
    this.barrelLidTop.add(knob);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 8), iron);
      screw.position.set(0.34 * Math.cos(a), 0.815, 0.34 * Math.sin(a));
      this.barrelLidTop.add(screw);
    }
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), corkMat);
    cork.position.set(0.22, 0.835, 0.1);
    this.barrelLidTop.add(cork);
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 10), brassMat);
    valve.position.set(-0.2, 0.84, -0.12);
    this.barrelLidTop.add(valve);
    this.barrel.add(this.barrelLidTop);
    // contents, visible only while the barrel is open: 3 mattress layers, the red
    // heart pillow on top, and the 5-part anvil ballast at the bottom
    this.barrelContents = new THREE.Group();
    for (const [my, mm] of [[0.6, mattMat], [0.66, mattMat2], [0.72, mattMat]] as const) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.055, 24), mm);
      disc.position.y = my;
      this.barrelContents.add(disc);
    }
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.09);
    heartShape.bezierCurveTo(-0.11, -0.02, -0.09, 0.07, 0, 0.03);
    heartShape.bezierCurveTo(0.09, 0.07, 0.11, -0.02, 0, -0.09);
    const pillow = new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape, { depth: 0.05, bevelEnabled: false }), heartMat);
    pillow.rotation.x = -Math.PI / 2; pillow.position.set(0, 0.78, 0.05); pillow.castShadow = true;
    this.barrelContents.add(pillow);
    const anvilBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, rz = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), anvilMat);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      m.rotation.z = rz; m.castShadow = true;
      this.barrelContents.add(m);
    };
    anvilBox(-0.15, 0.05, -0.09, 0.15, 0.13, 0.09); // base
    anvilBox(-0.06, 0.13, -0.06, 0.06, 0.25, 0.06); // waist
    anvilBox(-0.17, 0.25, -0.08, 0.17, 0.39, 0.08); // body
    anvilBox(0.14, 0.32, -0.06, 0.3, 0.4, 0.06, -0.3); // horn
    anvilBox(-0.28, 0.3, -0.07, -0.18, 0.4, 0.07); // heel
    this.barrel.add(this.barrelContents);
    this.barrel.traverse((o) => { if (o instanceof THREE.Mesh) o.layers.set(NOINK); });
    R.add(this.barrel);

    // ---- the rowboat (dynamic): plank hull, two benches, two oars ----
    const boatWood = lam("boatWood", () => ({ color: "#8a6a42" }));
    const boatDark = lam("boatDark", () => ({ color: "#5a3b2a" }));
    const addBox = (g: THREE.Group, mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, ry = 0, rx = 0, rz = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; m.layers.set(NOINK);
      g.add(m);
    };
    addBox(this.boat, boatDark, -0.55, 0, -1.35, 0.55, 0.12, 1.35); // hull floor
    addBox(this.boat, boatWood, -0.58, 0.1, -1.35, -0.5, 0.6, 1.35, 0, 0, 0.12); // port side
    addBox(this.boat, boatWood, 0.5, 0.1, -1.35, 0.58, 0.6, 1.35, 0, 0, -0.12); // starboard side
    addBox(this.boat, boatWood, -0.55, 0.1, -1.35, 0.55, 0.6, -1.27, 0, 0.35, 0); // bow
    addBox(this.boat, boatWood, -0.55, 0.1, 1.27, 0.55, 0.6, 1.35, 0, -0.35, 0); // stern
    addBox(this.boat, boatWood, -0.5, 0.42, -0.65, 0.5, 0.48, -0.35); // bench 1
    addBox(this.boat, boatWood, -0.5, 0.42, 0.35, 0.5, 0.48, 0.65); // bench 2
    addBox(this.boat, boatWood, -0.62, 0.58, -1.35, -0.5, 0.64, 1.35); // port gunwale
    addBox(this.boat, boatWood, 0.5, 0.58, -1.35, 0.62, 0.64, 1.35); // starboard gunwale
    addBox(this.boat, boatDark, -0.62, 0.64, -0.2, 0.62, 0.68, -0.14); // oar 1 on the gunwales
    addBox(this.boat, boatDark, -0.62, 0.64, 0.6, 0.62, 0.68, 0.66); // oar 2
    R.add(this.boat);

    // ---- the bicycle pump (dynamic visibility): steel tube, moving T-handle + piston rod,
    // pressure gauge, and a 3-segment hose toward the barrel. Anatomy + motion-tabel E10. ----
    const pumpSteel = lam("pumpSteel", () => ({ color: "#6a6f7a" }));
    const pumpBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.2), pumpSteel);
    pumpBase.position.y = 0.02; pumpBase.castShadow = true; pumpBase.layers.set(NOINK);
    this.pump.add(pumpBase);
    for (const px of [-0.12, 0.12]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.07), pumpSteel);
      pad.position.set(px, 0.015, 0.13); pad.castShadow = true; pad.layers.set(NOINK);
      this.pump.add(pad);
    }
    const pumpTube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 12), pumpSteel);
    pumpTube.position.y = 0.3; pumpTube.castShadow = true; pumpTube.layers.set(NOINK);
    this.pump.add(pumpTube);
    for (const cy of [0.08, 0.52]) {
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 12), pumpSteel);
      collar.position.y = cy; collar.castShadow = true; collar.layers.set(NOINK);
      this.pump.add(collar);
    }
    // the moving handle group: T-bar + grips + piston rod sliding into the tube.
    // Its y is driven every frame in update() by pumpPose() (36-frame stroke).
    this.pumpHandle = new THREE.Group();
    const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.04), boatDark);
    handleBar.castShadow = true; handleBar.layers.set(NOINK);
    this.pumpHandle.add(handleBar);
    for (const gx of [-0.15, 0.15]) {
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.05), boatDark);
      grip.position.set(gx, 0, 0); grip.castShadow = true; grip.layers.set(NOINK);
      this.pumpHandle.add(grip);
    }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 10), pumpSteel);
    rod.position.y = -0.15; rod.layers.set(NOINK);
    this.pumpHandle.add(rod);
    this.pumpHandle.position.y = 0.6;
    this.pump.add(this.pumpHandle);
    // pressure gauge on the tube front (+z, toward the bank cameras): white face + red needle
    const gaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16),
      new THREE.MeshBasicMaterial({ color: "#f7f3ea" }));
    gaugeFace.rotation.x = Math.PI / 2; gaugeFace.position.set(0, 0.35, 0.06); gaugeFace.layers.set(NOINK);
    this.pump.add(gaugeFace);
    const needleGeo = new THREE.BoxGeometry(0.012, 0.07, 0.006);
    needleGeo.translate(0, 0.035, 0); // pivot at the base, so rotation.z swings the tip
    this.pumpNeedle = new THREE.Mesh(needleGeo, new THREE.MeshBasicMaterial({ color: "#c0353a" }));
    this.pumpNeedle.position.set(0, 0.35, 0.075); this.pumpNeedle.rotation.z = -2; this.pumpNeedle.layers.set(NOINK);
    this.pump.add(this.pumpNeedle);
    // hose in 3 segments following the ground toward the barrel, with brass clamps
    // at the joints and a nozzle at the end (v1 had one flat box that read as a loose board)
    const hoseSeg = (x0: number, z0: number, x1: number, z1: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, len), boatDark);
      seg.position.set((x0 + x1) / 2, 0.03, (z0 + z1) / 2);
      seg.rotation.y = Math.atan2(x1 - x0, z1 - z0);
      seg.layers.set(NOINK);
      this.pump.add(seg);
    };
    hoseSeg(0, 0.05, -0.5, -0.25);
    hoseSeg(-0.5, -0.25, -1.0, -0.65);
    hoseSeg(-1.0, -0.65, -1.5, -1.05);
    for (const [jx, jz, jr] of [[-0.5, -0.25, 0.46], [-1.0, -0.65, 0.46]] as const) {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.03), brassMat);
      clamp.position.set(jx, 0.03, jz); clamp.rotation.y = jr; clamp.layers.set(NOINK);
      this.pump.add(clamp);
    }
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.1, 10), brassMat);
    nozzle.position.set(-1.5, 0.07, -1.05); nozzle.layers.set(NOINK);
    this.pump.add(nozzle);
    this.pump.position.set(PUMP_POS[0], BANK_Y, PUMP_POS[2]);
    R.add(this.pump);

    // ---- the held lid (shot 5) and the grounded lid (shot 8): plain wooden discs ----
    // thick disc + small knob so it reads as a lid, not a hovering saucer
    const mkLid = () => {
      const g = new THREE.Group();
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.1, 24), lidMat);
      d.castShadow = true; d.layers.set(NOINK);
      g.add(d);
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.09, 12), lidMat);
      knob.position.y = 0.09; knob.castShadow = true; knob.layers.set(NOINK);
      g.add(knob);
      return g;
    };
    this.lidHeld = mkLid();
    // held up high by Graham's raised hand, visible above the barrel's right side;
    // v2 put it at (3.5, 1.9, -18.9), off the right frame edge, so the lid was
    // never seen until it sank into the barrel
    this.lidHeld.position.set(3.1, BANK_Y + 2.05, -18.6);
    this.lidHeld.rotation.set(0.2, 0, 0.3);
    R.add(this.lidHeld);
    this.lidGround = mkLid();
    // west of the barrel on the beach, clear of it so it shows in the rescue frame;
    // v1 put it at (2.0, -57), where it read as a cut-off yellow disc at the frame edge
    this.lidGround.position.set(2.6, BANK_Y + 0.05, -56.8);
    this.lidGround.rotation.set(0, 0.4, 0.12);
    R.add(this.lidGround);
  }

  /** Annie's photo stall on the town street: table, tilted photo board with four
   *  white photo cards, two crates. Built as its own group (not a Batch) so the
   *  board and cards share one tilt. */
  private buildStall(R: THREE.Group) {
    const g = new THREE.Group();
    const wood = lam("stallWood", () => ({ color: "#9a7a4a" }));
    const dark = lam("stallDark", () => ({ color: "#5a3b2a" }));
    const white = new THREE.MeshBasicMaterial({ color: "#f7f3ea" }); // paper: unlit, stays white in golden light
    const add = (mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; m.layers.set(NOINK);
      g.add(m);
    };
    // table
    add(wood, -0.9, 0.8, -0.5, 0.9, 0.88, 0.5);
    for (const [dx, dz] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]] as const)
      add(dark, dx - 0.05, 0, dz - 0.05, dx + 0.05, 0.8, dz + 0.05);
    // photo board, leaning back (top away from the south camera), facing the street
    add(wood, -0.8, 0.9, -0.28, 0.8, 2.0, -0.22, -0.35);
    // four white photo cards on the board's NORTH face (toward the camera at z 23);
    // the board tilts rx -0.35 so its top leans toward the camera: the face's z is
    // -0.41 at y 1.75 and -0.23 at y 1.25 (0.02 in front of the face in each row)
    // each card carries a tiny "photo print" on its camera-facing side
    // (0.017 further out, 0.012 thick, so no coplanar faces) so the cards read as
    // photographs instead of blank paper
    const photo = new THREE.MeshBasicMaterial({ map: photoTex() });
    for (const [cx, cy, cz] of [[-0.25, 1.75, -0.41], [0.25, 1.75, -0.41], [-0.25, 1.25, -0.23], [0.25, 1.25, -0.23]] as const) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.02), white);
      m.position.set(cx, cy, cz); m.rotation.x = -0.35; m.castShadow = true; m.layers.set(NOINK);
      g.add(m);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.36, 0.012), photo);
      p.position.set(cx, cy, cz - 0.017); p.rotation.x = -0.35; p.layers.set(NOINK);
      g.add(p);
    }
    // crates beside the table
    add(wood, 1.2, 0, -0.3, 1.7, 0.5, 0.3);
    add(wood, 1.25, 0.5, -0.25, 1.65, 0.85, 0.25);
    add(dark, -1.7, 0, 0.1, -1.2, 0.45, 0.6);
    g.position.set(STALL_POS[0], 0, STALL_POS[2]);
    R.add(g);
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
    // ---- dynamic props from the story timeline ----
    const st = storyState(id, t);
    this.barrel.position.set(st.barrel.x, st.barrel.y, st.barrel.z);
    this.barrel.rotation.set(st.barrel.rotX, st.barrel.yaw, st.barrel.rotZ);
    this.barrelLid.visible = st.barrel.closed;
    this.barrelLidTop.visible = st.barrel.closed;
    this.barrelContents.visible = st.barrel.mattress;
    this.boat.visible = st.boat.visible;
    this.boat.position.set(st.boat.x, st.boat.y, st.boat.z);
    this.boat.rotation.y = st.boat.yaw;
    this.pump.visible = st.pump;
    if (st.pump && id === 6 && t < 30) {
      const pose = pumpPose(f); // 36-frame stroke, synced with the friend's arm in cast.ts
      this.pumpHandle.position.y = 0.35 + 0.25 * pose;
      this.pumpNeedle.rotation.z = -2 + 2.4 * pose;
    } else {
      this.pumpHandle.position.y = 0.6;
      this.pumpNeedle.rotation.z = -2;
    }
    this.lidHeld.visible = st.lidHeld;
    if (id === 5) {
      // the lid lowers onto the rim f780-810 (motion-tabel.md B): from Graham's
      // raised hand (2.35) down to the rim (BANK_Y + 1.56 = 1.86), ease-in quad,
      // ending flat on the rim. V2 ended at BANK_Y + 0.83, 0.7 m below the rim,
      // so the lid sank inside the barrel and vanished mid-animation.
      const u = clamp01((t - 26) / 1), e = u * u;
      this.lidHeld.position.set(3.1 - 0.6 * e, BANK_Y + 2.05 - 0.49 * e, -18.6 + 0.6 * e);
      this.lidHeld.rotation.set(0.2 * (1 - e), 0, 0.3 * (1 - e));
    }
    this.lidGround.visible = st.lidGround;
    // the river flows north: scroll its texture with story time (deterministic per frame),
    // with a small sine modulation so it does not read as a conveyor belt (motion E12)
    this.riverTex.offset.y = -t * 0.012 + 0.002 * Math.sin(t * 1.1);
    this.fallsTex.offset.y = -t * 0.05; // the curtain water flows down
    // rapids streaks drift north on the river above the falls, wrapping every 8 m
    for (let i = 0; i < this.rapids.length; i++)
      this.rapids[i].position.set(-8 + i * 4, 0.14, -44 - ((t * 2 + i * 2.7) % 8));
    // foam breathes at the pool during the drift and the drop (motion-tabel.md F)
    const pulse = id >= 6 && id <= 8 ? 1 + 0.08 * Math.sin(((f - 900) / 48) * Math.PI * 2) : 1;
    for (const m of this.foamPulse) m.scale.set(pulse, 1, pulse);
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
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st2 = stageFn(id, t, storyState(id, t), { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st2.places) {
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
    for (const p of st2.fx) {
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

/** vertical quad in local space: (x0,y0,0) (x1,y0,0) (x1,y1,0) (x0,y1,0), facing +z */
function quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
  return g;
}
