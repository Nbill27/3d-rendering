// Cast — BLOCKY-RONALDO. Blocky 3D characters (blocky.ts), posed per frame from story.ts.
// Locked profiles from projects/ronaldo/CAST.md. Narrator is off-screen; mouths stay shut.
import * as THREE from "three";
import { makeBlocky, makeBall, makeTrophy, setShirtPrint, walkPose, idlePose, kickPose, siuPose, liePose, sitPose, JERSEY, type BlockyRig, type Jersey } from "./blocky";
import { SCENES, sceneAt, clamp01, type Zone } from "./story";

export type CastMember = {
  id: string; rig: BlockyRig; jersey: Jersey; height: number;
  kitName?: string; kitNumber?: string;
};

/** One locked character per id; reuse the same rig across scenes (continuity). */
export function buildCast(): Record<string, CastMember> {
  const mk = (id: string, height: number, jersey: Jersey, name?: string, number?: string): CastMember => ({
    id, rig: makeBlocky({ height, jersey, name, number }), jersey, height, kitName: name, kitNumber: number,
  });
  return {
    "ronaldo-child": mk("ronaldo-child", 1.25, "plain"),
    "ronaldo-young": mk("ronaldo-young", 1.75, "sporting"),
    "ronaldo-adult": mk("ronaldo-adult", 1.87, "madrid"),
    "jose-aveiro": mk("jose-aveiro", 1.78, "work"),
    "ibu-ronaldo": mk("ibu-ronaldo", 1.65, "apron"),
    "sibling-1": mk("sibling-1", 1.45, "plain"),
    "sibling-2": mk("sibling-2", 1.4, "plain"),
    "sibling-3": mk("sibling-3", 1.35, "plain"),
    messi: mk("messi", 1.7, "messi", "MESSI", "10"),
    eder: mk("eder", 1.85, "portugal", "ÉDER", "9"),
  };
}

/** Change a character's kit for a new era — same rig, new shirt print (pattern +
 *  back name/number), new shorts/arm colours. No-op when the kit is already the
 *  requested one: update() runs every frame, and redrawing the canvases there
 *  would waste a texture upload per frame. Replaces the old setJersey, which only
 *  swapped flat colours and left the old white-square "number" on the chest. */
export function setKit(m: CastMember, jersey: Jersey, name?: string, number?: string) {
  if (m.jersey === jersey && m.kitName === name && m.kitNumber === number) return;
  setShirtPrint(m.rig, jersey, name, number);
  const j = JERSEY[jersey];
  m.rig.shirtMat.color.set(j.shirt); // clay: the torso capsule is plain shirt colour
  m.rig.shortsMat.color.set(j.shorts);
  m.rig.socksMat.color.set(j.socks); // round 6: shins are socks-coloured, not shorts
  ((m.rig.legR.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(j.shorts);
  // Arms share the shirt colour: their capsule material is the first child mesh's material.
  // Round 7: the forearm (the elbow group's first child) shares it too.
  for (const arm of [m.rig.armL, m.rig.armR]) {
    ((arm.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(j.shirt);
    const fore = (arm.children[1] as THREE.Group | undefined)?.children[0] as THREE.Mesh | undefined;
    if (fore) (fore.material as THREE.MeshStandardMaterial).color.set(j.shirt);
  }
  m.jersey = jersey;
  m.kitName = name;
  m.kitNumber = number;
}

export type Stage = {
  actors: { m: CastMember; x: number; y: number; z: number; yaw?: number; pose: string; phase?: number }[];
  ball?: { x: number; y: number; z: number };
  trophies?: number; // count of trophies in a row
  balls?: number; // count of World Cup balls in a row (scene 23: six)
};

/** Placements per scene id. Every actor here is named in SCRIPT.md for that scene.
 *  Scenes 3 and 21 have no 3D actors — the map is an SVG overlay (map.tsx). */
export function stageFor(sceneId: number, t: number, cast: Record<string, CastMember>): Stage {
  const A = (id: string, x: number, y: number, z: number, pose: string, phase = t, yaw?: number) => ({ m: cast[id], x, y, z, pose, phase, yaw });
  switch (sceneId) {
    case 1: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "idle")] };
    case 2: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "idle")] };
    case 3: return { actors: [] };
    case 4: return { actors: [A("ronaldo-child", 1, 0, 0, "idle")] };
    case 5: return { actors: [
      // Two rows, tight (x -1..1.5): the 9:16 frame's horizontal FOV is only ~±12 deg,
      // so the round-3 single row (x -1.5..4) lost both ends off-frame (stills 2026-11-27).
      A("sibling-1", -1, 0, 2.5, "idle"),
      A("ronaldo-child", 0, 0, 2.5, "idle"),
      A("sibling-2", 1, 0, 2.5, "idle"),
      A("sibling-3", -0.3, 0, 1, "idle"),
      A("jose-aveiro", 0.5, 0, 1, "idle"),
      A("ibu-ronaldo", 1.2, 0, 1, "idle"),
    ] };
    case 6: return { actors: [A("ronaldo-child", 0, 0, 12, "walk", t * 4)], ball: { x: 0.6, y: 0.11, z: 12.5 } };
    case 7: return { actors: [A("ronaldo-child", 0, 0, -24, "idle")] };
    case 8: return { actors: [A("ronaldo-child", 0, 0, 0, "walk", t * 2)] };
    case 9: return { actors: [
      // Back to the camera: the Sporting debut is the shirt-reveal moment for the
      // one number of his career that is not 7 or 9 — RONALDO 28, green/white hoops.
      // x=1.8, on the camera axis like every other stadium scene (round 5: x=0 was
      // out of the narrow frame, and the Lisbon camera looked at z=0, not z=-18).
      A("ronaldo-young", 1.8, 0, -18, "kick", t, Math.PI),
    ] };
    case 10: return { actors: [
      // Back to the camera: the 2003 United debut is the shirt-reveal moment, and
      // the back is the only place the number lives (RONALDO 7).
      A("ronaldo-young", 1.8, 0, -18.5, "idle", t, Math.PI),
    ] };
    case 11: return { actors: [A("ronaldo-young", 1.8, 0, -18.5, "kick")], trophies: 3 };
    case 12: return { actors: [A("ronaldo-young", 1.8, 0, -18.5, "idle")], trophies: 2 };
    case 13: return { actors: [
      // Back to the camera: the 2009 Madrid unveiling is the shirt-reveal moment —
      // and this is the one season he wore 9, not 7 (Raúl still had 7).
      A("ronaldo-adult", 1.8, 0, -18.5, "idle", t, Math.PI),
    ] };
    case 14: return { actors: [
      // Both on the camera axis (round 5: Ronaldo at x=-1 was out of the narrow
      // frame — the Madrid camera looks at x=1.8 — so the rivalry scene showed
      // only Messi). Clay re-check 2026-11-27: Ronaldo at x=0.8 sat on the left
      // frame edge, half cut — moved both right so both fit, ball between them.
      A("ronaldo-adult", 1.15, 0, -18, "kick"),
      A("messi", 2.45, 0, -18, "kick"),
    ], ball: { x: 1.8, y: 0.11, z: -17.5 } };
    case 15: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "kick")] };
    case 16: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "idle")], trophies: 5 };
    case 17: return { actors: [
      // Both actors near the camera axis (x 0.3..1.6): round 3 had Eder at x=2, which
      // put his right side out of the narrow frame (stills 2026-11-27).
      A("ronaldo-adult", 0.3, 0, -18, "lie"),
      // Eder turned 0.5 rad so the kick swings across the frame instead of straight at
      // the camera (foreshortened, invisible against the green pitch — stills 2026-11-27).
      // Ball in the kick's path, in front of his foot (round 6b: it was at x=2.1, out
      // of the narrow frame with the closer euro camera, so the winning goal had no ball).
      A("eder", 1.6, 0, -17.5, "kick", t, 0.5),
    ], ball: { x: 1.95, y: 0.11, z: -17 } };
    case 18: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "idle")] };
    case 19: return { actors: [
      // Back to the camera: the Juventus arrival is a shirt-reveal moment too —
      // black/white stripes, RONALDO 7.
      A("ronaldo-adult", 1.8, 0, -18.5, "idle", t, Math.PI),
    ] };
    case 20: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "idle")] };
    case 21: return { actors: [] };
    case 22: return { actors: [
      // Back to the camera: the Al Nassr arrival is a shirt-reveal moment too —
      // yellow/blue, RONALDO 7. x=1.8, on the camera axis (round 5: x=0 was out of
      // the narrow frame — only a sliver of his arm showed). The ball sits directly
      // in front of him: facing away, the kick swings toward -z.
      A("ronaldo-adult", 1.8, 0, -18, "kick", t, Math.PI),
    ], ball: { x: 1.8, y: 0.11, z: -19 } };
    case 23: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "idle")], trophies: 2, balls: 6 };
    case 24: return { actors: [A("ronaldo-adult", 3, 0, -25, "idle")] };
    case 25: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "idle")] };
    case 26: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "idle")] };
    case 27: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "kick")] };
    case 28: return { actors: [
      // x=1.8, on the camera axis (round 5: x=0 was out of the narrow frame — the
      // Siu stills showed only a sliver of his arm at the left edge).
      A("ronaldo-adult", 1.8, 0, -18, "siu"),
    ] };
    case 29: return { actors: [A("ronaldo-child", 1, 0, 0, "idle")], ball: { x: 1.6, y: 0.11, z: 0.5 } };
    default: return { actors: [A("ronaldo-adult", 1.8, 0, -18.5, "idle")] };
  }
}

/** Apply a pose string to a rig at time t (seconds) / frame f. */
export function applyPose(rig: BlockyRig, pose: string, t: number, f: number) {
  // Poses share one root: a pose that tilts the root (lie) must not leak into the
  // next scene — reset the tilt every frame, then let the pose set it again.
  // (yaw is owned by the stage/camera and is never reset here.)
  rig.root.rotation.x = 0;
  rig.root.rotation.z = 0;
  // Round 7: poses now drive elbows, knees, torso and head — reset them every frame
  // so one scene's bend never leaks into the next (same reason as the root reset).
  // The arm z-rotation is reset too: the Siu drives it, and the next scene's kick
  // only sets rotation.x, so a leftover z would leave the arms stuck out sideways.
  rig.torso.rotation.set(0, 0, 0);
  rig.head.rotation.set(0, 0, 0);
  rig.armL.rotation.z = 0;
  rig.armR.rotation.z = 0;
  rig.elbowL.rotation.set(0, 0, 0);
  rig.elbowR.rotation.set(0, 0, 0);
  rig.kneeL.rotation.set(0, 0, 0);
  rig.kneeR.rotation.set(0, 0, 0);
  switch (pose) {
    case "walk": walkPose(rig, t * 4); break;
    case "kick": kickPose(rig, (t % 2) / 2); break;
    case "siu": {
      // The Siu repeats every 60 f so the jump is actually seen: the old code called
      // siuAt(f, 0), which was already complete by frame 18 — the whole scene stood
      // still with its back to the camera (found 2026-11-27). The turn accumulates
      // across cycles (π, 2π, …) so there is no snap back at the loop point.
      const sc = sceneAt(f);
      const lf = f - sc.a;
      const cyc = Math.floor(lf / 60);
      const u = clamp01((lf % 60) / 18);
      siuPose(rig, u);
      rig.root.position.y = 0.9 * 4 * u * (1 - u);
      rig.root.rotation.y = Math.PI * (cyc + u);
      break;
    }
    case "lie": liePose(rig); break;
    case "sit": sitPose(rig); break;
    default: idlePose(rig, t);
  }
}

export { makeBall, makeTrophy };
export type { Zone };
export { SCENES };
