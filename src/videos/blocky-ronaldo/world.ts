// World — BLOCKY-RONALDO. One three.js scene, 12 zones in story order (WORLD.md):
// night stadium, Atlantic/Madeira map, Funchal, Lisbon/Sporting, Manchester, Madrid,
// Turin, world map Manchester->Riyadh, Riyadh/desert, Euro/World Cup stadiums,
// Madeira airport flashback 2017, Madeira sunset epilogue.
// 1u = 1m. Props built from code (boxGeo) — NO Kenney GLB, it always 404s on render.
// update(id, f, camera) poses everything for scene `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { buildCast, stageFor, applyPose, makeBall, makeTrophy, setKit, type CastMember } from "./cast";
import { FPS, camAt, sceneAt, type Zone } from "./story";

const box = (w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  m.receiveShadow = true; // round 6 polish: the pitch and stands must catch the players' shadows
  return m;
};

/** A blocky house with a tin roof (Funchal workers' village). Gable roof: two slanted
 *  panels meeting at a ridge — round 1 had a single floating slab (stills 2026-11-27). */
function tinHouse(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(3, 2, 2.5, "#f4e6c4", 0, 1, 0)); // walls
  const roofL = box(1.9, 0.12, 2.9, "#8a8f96", -0.8, 2.35, 0);
  roofL.rotation.z = 0.45;
  const roofR = box(1.9, 0.12, 2.9, "#7a7f86", 0.8, 2.35, 0);
  roofR.rotation.z = -0.45;
  g.add(roofL, roofR);
  g.add(box(0.7, 1.2, 0.05, "#5a3b2a", 0, 0.6, 1.26)); // door
  g.add(box(0.6, 0.6, 0.05, "#a8d0ea", -0.9, 1.3, 1.26)); // window
  g.add(box(0.6, 0.6, 0.05, "#a8d0ea", 0.9, 1.3, 1.26));
  return g;
}

/** A blocky stadium stand: 5 stepped tiers with dense small crowd blocks, a roof band,
 *  and floodlight panels aimed at the pitch.
 *  Round 5 had 4 tiers of 0.7 m cubes spaced 2 m apart in six equal colours — it read
 *  as random confetti, and the floodlights were lone white cubes floating in the sky
 *  (stills 2026-11-27, bill: "kok jelek bgtt sih visualnya"). */
function stadiumStand(color: string): THREE.Group {
  const g = new THREE.Group();
  // Crowd palette: mostly the stand colour + neutrals, a few away colours.
  const crowdCols = [color, color, color, "#ffffff", "#e8e6da", "#3a3f46", "#f5c518"];
  for (let i = 0; i < 5; i++) {
    const z = -22 - i * 1.6;
    const y = 0.5 + i;
    g.add(box(30, 1, 1.6, i % 2 ? color : "#e8e6da", 0, y, z));
    // Two rows of small, dense crowd blocks per tier — size and height jittered per
    // cube (deterministic hash), so the crowd reads as people, not a grid (round 6b).
    for (let x = -14; x <= 14; x += 1) {
      const h1 = Math.abs(Math.sin(x * 12.9898 + i * 78.233)) % 1;
      const h2 = Math.abs(Math.sin(x * 39.346 + i * 11.135)) % 1;
      const s = 0.35 + 0.15 * h1;
      const c = crowdCols[Math.abs(Math.round(x * 13 + i * 7)) % crowdCols.length];
      g.add(box(s, s, s, c, x, y + 0.5 + s / 2 + 0.08 * (h2 - 0.5), z + 0.3));
      const h3 = Math.abs(Math.sin(x * 26.651 + i * 19.19)) % 1;
      const s2 = 0.35 + 0.15 * h3;
      const c2 = crowdCols[Math.abs(Math.round(x * 5 + i * 11)) % crowdCols.length];
      g.add(box(s2, s2, s2, c2, x + 0.5, y + 0.5 + s2 / 2 + 0.08 * (h1 - 0.5), z - 0.45));
    }
  }
  // Roof band above the top tier so the stand ends instead of sky right above the crowd.
  g.add(box(30, 0.6, 4, "#2a2f36", 0, 6.2, -27));
  // Floodlights: thicker poles + a tilted panel aimed at the pitch.
  for (const x of [-14, 14]) {
    g.add(box(0.4, 11, 0.4, "#3a3f46", x, 5.5, -20));
    const panel = box(2.6, 1.2, 0.3, "#fff8d0", x, 11.2, -20);
    panel.rotation.x = 0.5;
    g.add(panel);
  }
  return g;
}

/** A blocky goal: two white posts + crossbar, at the far end of the pitch (z=-21).
 *  Round 3 had it at z=-20 with a 2.4 m crossbar, where it filled the top of the
 *  frame like a floating border (stills 2026-11-27). Round 6: thinner posts and a
 *  2.1 m crossbar, so the frame reads as a goal, not a border. */
function goal(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.12, 2.1, 0.12, "#ffffff", -1.8, 1.05, -21));
  g.add(box(0.12, 2.1, 0.12, "#ffffff", 1.8, 1.05, -21));
  g.add(box(3.72, 0.12, 0.12, "#ffffff", 0, 2.1, -21));
  return g;
}

/** A marked pitch: mowing stripes + halfway line.
 *  Round 5 had a bare green slab — half the frame was empty grass (stills 2026-11-27,
 *  bill: "kok jelek bgtt sih visualnya"). Round 6 first tried 6 m stripes in two
 *  close greens — invisible, and the centre circle sat at z=-10, behind the camera.
 *  Now: 3 m stripes with a strong contrast, so a stripe boundary shows in the narrow
 *  visible slice (z -21..-17) behind the actor; the circle is dropped. */
function pitch(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(24, 0.1, 36, "#3f7a33", 0, 0.05, -10)); // base, darker green
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) continue;
    g.add(box(24, 0.02, 3, "#63a854", 0, 0.11, -26.5 + i * 3)); // light mowing stripe
  }
  g.add(box(24, 0.02, 0.3, "#ffffff", 0, 0.13, -10)); // halfway line, above the stripes
  return g;
}

/** A blocky plane (Madeira -> Lisbon, and the airport flashback). */
function plane(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(4, 0.6, 0.8, "#ffffff", 0, 1, 0)); // fuselage
  g.add(box(1, 0.5, 3.5, "#1d4fa1", 0, 1, 0)); // wings
  g.add(box(0.8, 0.8, 0.5, "#d00027", -1.8, 1.2, 0)); // tail
  return g;
}

const ZONE_SKY: Record<Zone, string> = {
  "stadium-night": "#0a1230", "madeira-map": "#2a7ab8", funchal: "#a8d0ea",
  lisbon: "#a8d0ea", manchester: "#9ab8d0", madrid: "#a8d0ea", turin: "#a8d0ea",
  "world-map": "#2a7ab8", riyadh: "#e8c98a", euro: "#a8d0ea", airport: "#a8d0ea", sunset: "#e88a4a",
};

export class World {
  root = new THREE.Group();
  private cast: Record<string, CastMember>;
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh;
  private ground: THREE.Mesh;
  private zoneGroup = new THREE.Group();
  private dynGroup = new THREE.Group();

  constructor() {
    this.cast = buildCast();
    this.hemi = new THREE.HemisphereLight("#ffffff", "#3a5a3a", 1.1);
    this.sun = new THREE.DirectionalLight("#ffffff", 1.6);
    this.sun.position.set(10, 18, 8);
    // Round 6 polish: real shadows — the light was casting shadows, but nothing
    // cast or received them, so the players floated on flat light. Shadow camera
    // sized to the pitch (x -16..16, z -26..6 around the target at the pitch centre).
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -16;
    this.sun.shadow.camera.right = 16;
    this.sun.shadow.camera.top = 16;
    this.sun.shadow.camera.bottom = -16;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 60;
    this.sun.target.position.set(0, 0, -10);
    this.root.add(this.sun.target);
    // Fill from the camera side: round 1 left the white Madrid jersey reading grey
    // because the camera-facing faces were away from the sun (stills 2026-11-27).
    this.fill = new THREE.DirectionalLight("#ffffff", 0.7);
    this.fill.position.set(-8, 10, 14);
    this.root.add(this.hemi, this.sun, this.fill);
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(200, 16, 12),
      new THREE.MeshBasicMaterial({ color: "#a8d0ea", side: THREE.BackSide }),
    );
    this.root.add(this.sky);
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshLambertMaterial({ color: "#5a8a4a" }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.root.add(this.ground, this.zoneGroup, this.dynGroup);
    for (const m of Object.values(this.cast)) this.root.add(m.rig.root);
  }

  private buildZone(zone: Zone) {
    this.zoneGroup.clear();
    const g = this.zoneGroup;
    switch (zone) {
      case "funchal":
      case "sunset": {
        // One house centred behind the family (0,0,-3) so it reads in the narrow frame;
        // round 3 had the houses at x=±4.5, out of the ±12 deg horizontal FOV (stills 2026-11-27).
        const house = tinHouse(); house.position.set(0, 0, -3); g.add(house);
        const house2 = tinHouse(); house2.position.set(-6, 0, -5); house2.scale.setScalar(0.9); g.add(house2);
        g.add(box(8, 0.1, 3, "#c9a86a", 0, 0.05, 12)); // dirt street
        g.add(box(30, 0.1, 8, "#2a7ab8", -18, 0.02, 0)); // sea to the west
        break;
      }
      case "airport": {
        g.add(box(20, 0.1, 4, "#3a3f46", 0, 0.05, -28)); // runway
        const p = plane(); p.position.set(0, 0, -28); g.add(p);
        break;
      }
      case "riyadh": {
        g.add(box(60, 0.1, 60, "#e8c98a", 0, 0.02, 0)); // desert sand around the ground
        g.add(pitch()); // a footballer plays on grass, not sand (round 5 fix kept)
        g.add(stadiumStand("#f5c518"));
        g.add(goal()); // far end of the pitch, behind the actor.
        break;
      }
      case "madeira-map":
      case "world-map": break; // map is an SVG overlay in map.tsx, not 3D
      default: {
        g.add(pitch());
        g.add(stadiumStand("#d00027"));
        g.add(goal()); // far end of the pitch, behind the actor.
      }
    }
  }

  /** Pose everything for scene `id` at frame f. Returns the camera look target. */
  update(id: number, f: number, cam: THREE.PerspectiveCamera): THREE.Vector3 {
    const t = f / FPS;
    const scene = sceneAt(f);
    const zone = scene.zone;
    (this.sky.material as THREE.MeshBasicMaterial).color.set(ZONE_SKY[zone]);
    this.sun.intensity = zone === "stadium-night" ? 0.4 : 1.6;
    if (this.zoneGroup.children.length === 0 || (this.zoneGroup.userData as { zone?: Zone }).zone !== zone) {
      this.buildZone(zone);
      (this.zoneGroup.userData as { zone?: Zone }).zone = zone;
    }
    // Kit per era, locked per SCENE id (never mixed in one scene) — jersey AND back
    // number, both matched to the real event (bill's correction 2026-11-27):
    // Sporting 2002/03 #28 (his only senior number that is not 7 or 9 — verified
    // via Wikipedia's 2002-03 Sporting squad list); United #7; Madrid 2009 #9
    // (Raúl still had 7) then #7 from 2010; Juventus #7; Al Nassr #7; Portugal #7.
    // The prolog is the framing device, not one event — Portugal #7, his national
    // team identity (the 146 Portugal goals are in the prolog's numbers).
    // Messi (scene 14) is Barça #10, Eder (scene 17) is Portugal #9 — set at build.
    const adult = this.cast["ronaldo-adult"];
    const young = this.cast["ronaldo-young"];
    const KIT: Record<number, { jersey: "sporting" | "united" | "madrid" | "juventus" | "alnassr" | "portugal"; number: string }> = {
      1: { jersey: "portugal", number: "7" },
      2: { jersey: "portugal", number: "7" },
      9: { jersey: "sporting", number: "28" },
      10: { jersey: "united", number: "7" },
      11: { jersey: "united", number: "7" },
      12: { jersey: "united", number: "7" },
      13: { jersey: "madrid", number: "9" },
      14: { jersey: "madrid", number: "7" },
      15: { jersey: "madrid", number: "7" },
      16: { jersey: "madrid", number: "7" },
      17: { jersey: "portugal", number: "7" },
      18: { jersey: "madrid", number: "7" },
      19: { jersey: "juventus", number: "7" },
      20: { jersey: "united", number: "7" },
      22: { jersey: "alnassr", number: "7" },
      23: { jersey: "portugal", number: "7" },
      24: { jersey: "madrid", number: "7" },
      25: { jersey: "portugal", number: "7" },
      26: { jersey: "portugal", number: "7" },
      27: { jersey: "alnassr", number: "7" },
      28: { jersey: "alnassr", number: "7" },
    };
    const kit = KIT[scene.id];
    if (kit) {
      if (scene.id >= 9 && scene.id <= 12) setKit(young, kit.jersey, "RONALDO", kit.number);
      else setKit(adult, kit.jersey, "RONALDO", kit.number);
    }

    const stage = stageFor(id, t, this.cast);
    for (const m of Object.values(this.cast)) m.rig.root.visible = false;
    for (const a of stage.actors) {
      a.m.rig.root.visible = true;
      a.m.rig.root.position.set(a.x, a.y, a.z);
      if (a.yaw !== undefined) a.m.rig.root.rotation.y = a.yaw;
      applyPose(a.m.rig, a.pose, t, f);
    }
    // Ball / trophies for number scenes (anatomy_reveal: trophies assembled part by part).
    // Dynamic props are rebuilt every frame from the same deterministic state, so
    // clear them first — never accumulate meshes across frames.
    for (const child of [...this.dynGroup.children]) this.dynGroup.remove(child);
    if (stage.ball) {
      const b = makeBall(); b.position.set(stage.ball.x, stage.ball.y, stage.ball.z); this.dynGroup.add(b);
    }
    if (stage.trophies) {
      // Row of trophies right behind the actor (z=-19.5, clustered on x=1.8): round 2
      // put them at z=-16, x -4..4, where the narrow horizontal FOV (~±12 deg) and the
      // low camera angle pushed them below/out of the frame (stills 2026-11-27).
      for (let i = 0; i < stage.trophies; i++) {
        const tr = makeTrophy(0.8); tr.position.set(1.8 - (stage.trophies - 1) * 0.5 + i, 0, -19.5); this.dynGroup.add(tr);
      }
    }
    if (stage.balls) {
      // Six World Cup balls in a row behind the actor, same reason as the trophies.
      for (let i = 0; i < stage.balls; i++) {
        const b = makeBall(0.35); b.position.set(1.8 - 2.4 + i * 0.8, 0.35, -19.5); this.dynGroup.add(b);
      }
    }
    const c = camAt(id, f);
    cam.position.set(...c.pos);
    cam.lookAt(...c.look);
    return new THREE.Vector3(...c.look);
  }
}
