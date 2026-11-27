// Clay character builder — bill chose Clay (soft, round, matte) 2026-11-27, replacing
// the blocky Roblox/Minecraft look ("gaya ini kurang bagus kalo di muse"). Round heads,
// capsule torso and limbs, matte materials, no outlines. Characters are REAL 3D
// (sphere/capsule geometry), not flat sprites like v08's toon.ts. 1u = 1m.
// 12 segments, 7 pivots (neck, shoulders, elbows, wrists, hips, knees, ankles).
// The round-7 rig (elbow + knee joints, torso/head articulation) is reused unchanged.
// Narrator is off-screen: character mouths stay shut during narration.
import * as THREE from "three";

export const INK = "#1a1a1a";
export const SKIN = "#e8b98a";
export const HAIR = "#2a201a";

export type Jersey =
  | "sporting" | "united" | "madrid" | "juventus" | "alnassr" | "portugal"
  | "plain" | "work" | "apron" | "messi";
/** Jersey colours, locked per era (SCRIPT.md). Never mix eras in one scene.
 *  `stripes` is the real shirt pattern: Sporting 2002/03 is green/white horizontal
 *  hoops, Juventus is black/white vertical stripes — verified 2026-11-27.
 *  `numberInk` is the colour of the name + number printed on the back. */
export const JERSEY: Record<Jersey, { shirt: string; shorts: string; socks: string; stripes?: "hoops" | "vertical"; numberInk: string }> = {
  sporting: { shirt: "#1d7a3a", shorts: "#ffffff", socks: "#1d7a3a", stripes: "hoops", numberInk: "#ffffff" },
  united: { shirt: "#d00027", shorts: "#ffffff", socks: "#1a1a1a", numberInk: "#ffffff" },
  madrid: { shirt: "#ffffff", shorts: "#ffffff", socks: "#ffffff", numberInk: "#1a1a1a" },
  juventus: { shirt: "#1a1a1a", shorts: "#ffffff", socks: "#1a1a1a", stripes: "vertical", numberInk: "#ffffff" },
  alnassr: { shirt: "#f5c518", shorts: "#1d4fa1", socks: "#f5c518", numberInk: "#1d2f6e" },
  portugal: { shirt: "#d00027", shorts: "#1d7a3a", socks: "#d00027", numberInk: "#ffffff" },
  plain: { shirt: "#e8e0d0", shorts: "#5a6a8a", socks: "#ffffff", numberInk: "#1a1a1a" },
  work: { shirt: "#6a7a5a", shorts: "#3a3f52", socks: "#4a3426", numberInk: "#ffffff" },
  apron: { shirt: "#f4f1ea", shorts: "#5a4a6a", socks: "#ffffff", numberInk: "#1a1a1a" },
  messi: { shirt: "#a50044", shorts: "#1d4fa1", socks: "#a50044", numberInk: "#f5c518" },
};

export type BlockyOpts = {
  height: number; // metres, ~1.2 child, ~1.75 young, ~1.87 adult
  jersey: Jersey;
  skin?: string; hair?: string;
  name?: string; // name printed above the number on the back (RONALDO / MESSI / ÉDER)
  number?: string; // shirt number for this era (28 / 7 / 9 / 10), undefined = no print
};

/** Matte clay material — soft, no gloss, no outline. Clay has no ink lines. */
const clayMat = (color: string) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });

/** A clay ball (head, nose, hand, foot): a sphere that casts a shadow. */
const clayBall = (r: number, color: string) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), clayMat(color));
  m.castShadow = true;
  return m;
};

/** A clay limb segment: a capsule (a cylinder with round ends) that casts a shadow. */
const clayCapsule = (r: number, len: number, color: string) => {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 16), clayMat(color));
  m.castShadow = true;
  return m;
};

/** A clay limb segment sharing a material (the shins share one socksMat). */
const clayCapsuleMat = (r: number, len: number, mat: THREE.Material) => {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 16), mat);
  m.castShadow = true;
  return m;
};

export type BlockyRig = {
  root: THREE.Group;
  head: THREE.Group; torso: THREE.Group;
  armL: THREE.Group; armR: THREE.Group;
  legL: THREE.Group; legR: THREE.Group;
  /** Elbow and knee pivots (round 7 — bill: "kenapaa kaku bgt sihh"): the old limbs
   *  were single rigid slabs, so every pose was a straight stick. */
  elbowL: THREE.Group; elbowR: THREE.Group;
  kneeL: THREE.Group; kneeR: THREE.Group;
  height: number;
  shirtMat: THREE.MeshStandardMaterial; // the torso capsule's plain shirt colour
  shortsMat: THREE.MeshStandardMaterial;
  socksMat: THREE.MeshStandardMaterial; // shared by both shins, recolored by setKit
  /** Shirt print canvases: pattern (bands only — wraps the torso cylinder) + back
   *  (name + number only — on a curved segment over the pattern). */
  patternCtx: CanvasRenderingContext2D;
  backCtx: CanvasRenderingContext2D;
  patternTex: THREE.CanvasTexture;
  backTex: THREE.CanvasTexture;
};

/** Paint the shirt pattern onto a canvas: green/white hoops (Sporting) or black/white
 *  vertical stripes (Juventus). The canvas is TRANSPARENT except for the bands — it
 *  wraps a cylinder around the capsule torso, and the shirt colour shows through
 *  between the bands. 16 bands around the full circumference, so ~4 light bands read
 *  from the front. */
function drawShirtPattern(g: CanvasRenderingContext2D, w: number, h: number, jersey: Jersey) {
  const j = JERSEY[jersey];
  g.clearRect(0, 0, w, h);
  if (j.stripes === "hoops") {
    g.fillStyle = "#ffffff";
    const band = h / 16;
    for (let i = 1; i < 16; i += 2) g.fillRect(0, i * band, w, band);
  } else if (j.stripes === "vertical") {
    g.fillStyle = "#ffffff";
    const band = w / 16;
    for (let i = 1; i < 16; i += 2) g.fillRect(i * band, 0, band, h);
  }
}

/** Paint the shirt back: name above a big number (the "nomor punggung"). The canvas
 *  is transparent — it sits on a curved segment over the pattern cylinder, so the
 *  name and number print over the shirt's own stripes, like a real shirt.
 *  A dark stroke under the ink keeps the number readable on striped shirts. */
function drawShirtBack(g: CanvasRenderingContext2D, w: number, h: number, jersey: Jersey, name?: string, number?: string) {
  const j = JERSEY[jersey];
  g.clearRect(0, 0, w, h);
  if (!number) return;
  const ink = j.numberInk;
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (name) {
    g.font = `bold ${Math.round(w * 0.13)}px Arial, sans-serif`;
    g.lineWidth = Math.max(2, w * 0.02);
    g.strokeStyle = "#1a1a1a";
    g.strokeText(name, w / 2, h * 0.16);
    g.fillStyle = ink;
    g.fillText(name, w / 2, h * 0.16);
  }
  const size = Math.round(w * (number.length > 1 ? 0.62 : 0.85));
  g.font = `bold ${size}px Arial, sans-serif`;
  g.lineWidth = Math.max(3, w * 0.03);
  g.strokeStyle = "#1a1a1a";
  g.strokeText(number, w / 2, h * 0.58);
  g.fillStyle = ink;
  g.fillText(number, w / 2, h * 0.58);
}

/** Repaint a rig's shirt print (pattern + back name/number) for a new era.
 *  Called by setKit in cast.ts; the canvases are reused, never rebuilt. */
export function setShirtPrint(rig: BlockyRig, jersey: Jersey, name?: string, number?: string) {
  drawShirtPattern(rig.patternCtx, 256, 256, jersey);
  rig.patternTex.needsUpdate = true;
  drawShirtBack(rig.backCtx, 168, 256, jersey, name, number);
  rig.backTex.needsUpdate = true;
}

/** Build one clay character. Proportions: head 1/6 of height (a ball), torso 2/6,
 *  legs 2.5/6, arms at the sides. All parts are spheres and capsules; no GLB,
 *  no imported model, no outlines. */
export function makeBlocky(o: BlockyOpts): BlockyRig {
  const h = o.height;
  const headS = h / 6;
  const root = new THREE.Group();
  const j = JERSEY[o.jersey];
  const skin = o.skin ?? SKIN;

  const head = new THREE.Group();
  head.position.y = h - headS / 2;
  const r = headS / 2;
  head.add(clayBall(r, skin));
  // hair: a molded clay cap on top + a fringe bump at the front. The cap ends at
  // the forehead (thetaLength 1.06) — the first version ran to 1.9 rad, past the
  // equator, and buried the eyes under the hair (prolog still 2026-11-27).
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.02, 24, 16, 0, Math.PI * 2, 0, 1.06),
    clayMat(o.hair ?? HAIR),
  );
  hairCap.castShadow = true;
  head.add(hairCap);
  const fringe = clayBall(r * 0.42, o.hair ?? HAIR);
  fringe.scale.set(1.15, 0.5, 0.7);
  fringe.position.set(0, r * 0.49, r * 0.7);
  head.add(fringe);
  // face (mouth stays shut — narration): dot eyes, brows, a round nose, a thin smile.
  const eyeL = clayBall(r * 0.11, INK); eyeL.position.set(-r * 0.36, r * 0.06, r * 0.88);
  const eyeR = clayBall(r * 0.11, INK); eyeR.position.set(r * 0.36, r * 0.06, r * 0.88);
  head.add(eyeL, eyeR);
  const browGeo = new THREE.CapsuleGeometry(r * 0.035, r * 0.2, 4, 8);
  const browMat = clayMat(INK);
  const browL = new THREE.Mesh(browGeo, browMat);
  browL.rotation.z = Math.PI / 2;
  browL.position.set(-r * 0.36, r * 0.32, r * 0.86);
  browL.castShadow = true;
  const browR = new THREE.Mesh(browGeo, browMat);
  browR.rotation.z = Math.PI / 2;
  browR.position.set(r * 0.36, r * 0.32, r * 0.86);
  browR.castShadow = true;
  head.add(browL, browR);
  const nose = clayBall(r * 0.12, skin); nose.position.set(0, -r * 0.1, r * 0.9);
  head.add(nose);
  // smile: the lower half of a thin torus (a U shape), sitting just proud of the face.
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(r * 0.17, r * 0.03, 8, 24, Math.PI),
    clayMat(INK),
  );
  mouth.position.set(0, -r * 0.28, r * 0.94);
  mouth.rotation.z = Math.PI; // arc 0..π is the upper half — rotate so it opens upward
  mouth.castShadow = true;
  head.add(mouth);
  // ears: small clay bumps on the sides.
  const earL = clayBall(r * 0.1, skin); earL.position.set(-r * 0.98, 0, 0);
  const earR = clayBall(r * 0.1, skin); earR.position.set(r * 0.98, 0, 0);
  head.add(earL, earR);
  root.add(head);

  const torso = new THREE.Group();
  torso.position.y = h - headS - (h * 2) / 12;
  // Clay torso: a capsule in the shirt colour. The shirt pattern wraps around it as
  // an open cylinder (transparent except for the bands), and the name + number sit
  // on a curved segment over the back — the print lies over the stripes, like a
  // real shirt. (The old box had the pattern baked into its six faces.)
  const torsoR = h * 0.085;
  const torsoLen = h * 0.16;
  const patternCv = document.createElement("canvas");
  patternCv.width = patternCv.height = 256;
  const patternCtx = patternCv.getContext("2d")!;
  const patternTex = new THREE.CanvasTexture(patternCv);
  patternTex.colorSpace = THREE.SRGBColorSpace;
  patternTex.anisotropy = 8;
  const backCv = document.createElement("canvas");
  backCv.width = 168; backCv.height = 256;
  const backCtx = backCv.getContext("2d")!;
  const backTex = new THREE.CanvasTexture(backCv);
  backTex.colorSpace = THREE.SRGBColorSpace;
  backTex.anisotropy = 8;
  const shirtMat = clayMat(j.shirt);
  const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(torsoR, torsoLen, 8, 24), shirtMat);
  torsoMesh.castShadow = true;
  torso.add(torsoMesh);
  const patternMat = new THREE.MeshStandardMaterial({ map: patternTex, transparent: true, roughness: 0.9, metalness: 0 });
  const patternMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(torsoR + 0.004, torsoR + 0.004, torsoLen, 32, 1, true),
    patternMat,
  );
  patternMesh.castShadow = true;
  torso.add(patternMesh);
  // Back segment: theta = π is -z (the back); the segment is centred on it.
  const backMat = new THREE.MeshStandardMaterial({ map: backTex, transparent: true, roughness: 0.9, metalness: 0 });
  const backMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(torsoR + 0.008, torsoR + 0.008, h * 0.24, 24, 1, true, Math.PI - 0.95, 1.9),
    backMat,
  );
  backMesh.castShadow = true;
  torso.add(backMesh);
  root.add(torso);

  const armR0 = h * 0.026, legR0 = h * 0.038;
  const shoulderY = h - headS - h * 0.03;
  // Arms in two segments — upper arm + forearm on an elbow pivot (round 7, bill:
  // "kenapaa kaku bgt sihh"). Clay capsules now, same pivots: setKit recolors
  // children[0] (upper arm) and the elbow group's first child (forearm).
  const mkArm = (x: number) => {
    const g = new THREE.Group();
    g.position.set(x, shoulderY, 0);
    const shirt = clayMat(j.shirt);
    const upper = clayCapsuleMat(armR0, h * 0.09, shirt);
    upper.position.y = -h * 0.07;
    // Shoulder ball, riding on the upper arm so setKit's children[0] recolor still
    // covers it: it bridges the gap between the torso dome and the arm — without it
    // the arm hangs beside the body with a visible space (bill 2026-11-27). The
    // torso narrows toward the shoulders (capsule dome), so the straight arm's
    // inner edge clears the torso surface by ~0.01h at shoulder height.
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(armR0 * 1.23, 24, 16), shirt);
    shoulder.castShadow = true;
    shoulder.position.y = h * 0.07; // the shoulder pivot, top of the upper capsule
    upper.add(shoulder);
    g.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -h * 0.14;
    const fore = clayCapsule(armR0 * 0.92, h * 0.09, j.shirt);
    fore.position.y = -h * 0.07;
    elbow.add(fore);
    const hand = clayBall(armR0 * 1.25, skin);
    hand.position.y = -h * 0.14 - h * 0.015;
    elbow.add(hand);
    g.add(elbow);
    return { arm: g, elbow };
  };
  const aL = mkArm(-h * 0.095);
  const aR = mkArm(h * 0.095);
  const armL = aL.arm; const armR = aR.arm;
  const elbowL = aL.elbow; const elbowR = aR.elbow;
  const hipY = h - headS - (h * 2) / 6 - h * 0.02;
  // Legs: thigh (shorts) + shin (socks) on a knee pivot (rounds 6+7). Clay capsules;
  // the shin shares one socksMat so setKit recolors both legs at once; the thigh
  // keeps its own material (children[0]) so setKit's shorts update still targets it.
  const socksMat = new THREE.MeshStandardMaterial({ color: j.socks, roughness: 0.9, metalness: 0 });
  const mkLeg = (x: number) => {
    const g = new THREE.Group();
    g.position.set(x, hipY, 0);
    // Thigh capsule lengthened (0.14h -> 0.19h) and raised (-0.11h -> -0.085h) so
    // its top overlaps the torso bottom by ~0.026h — same hip gap bill flagged at
    // the shoulder (2026-11-27): the torso capsule ends 0.022h below the hip pivot
    // while the old thigh top sat 0.002h below it, a ~0.024h gap. The bottom stays
    // at -0.218h so it still touches the knee pivot; do NOT just raise the old
    // capsule (that would open a gap at the knee instead).
    const thigh = clayCapsule(legR0, h * 0.19, j.shorts);
    thigh.position.y = -h * 0.085;
    g.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -h * 0.22;
    const shin = clayCapsuleMat(legR0 * 0.92, h * 0.11, socksMat);
    shin.position.y = -h * 0.09;
    knee.add(shin);
    const foot = clayBall(legR0 * 0.85, INK);
    foot.scale.set(1.0, 0.5, 1.7);
    foot.position.set(0, -h * 0.18 - h * 0.015, legR0 * 0.5);
    knee.add(foot);
    g.add(knee);
    return { leg: g, knee };
  };
  const lL = mkLeg(-h * 0.06);
  const lR = mkLeg(h * 0.06);
  const legL = lL.leg; const legR = lR.leg;
  const kneeL = lL.knee; const kneeR = lR.knee;
  root.add(armL, armR, legL, legR);
  const shortsMat = ((legL.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial);
  const rig: BlockyRig = { root, head, torso, armL, armR, legL, legR, elbowL, elbowR, kneeL, kneeR, height: h, shirtMat, shortsMat, socksMat, patternCtx, backCtx, patternTex, backTex };
  setShirtPrint(rig, o.jersey, o.name, o.number);
  return rig;
}

// ---------------- blocky locomotion (blocky-toy Stage 9, shared controller) ----------------
// Alternating legs, blocky knee bends, lifted shoe soles, opposite arm swing,
// stable torso, stride-locked contact — no foot sliding, no treadmill walks.
export function walkPose(rig: BlockyRig, phase: number, speed = 1) {
  const s = Math.sin(phase * speed);
  rig.legL.rotation.x = 0.5 * s;
  rig.legR.rotation.x = -0.5 * s;
  // Knees: the trailing leg bends as it lifts off, then straightens to plant.
  rig.kneeL.rotation.x = -0.7 * Math.max(0, -s);
  rig.kneeR.rotation.x = -0.7 * Math.max(0, s);
  rig.armL.rotation.x = -0.4 * s;
  rig.armR.rotation.x = 0.4 * s;
  // Elbows rest slightly bent, swinging with the arms.
  rig.elbowL.rotation.x = 0.3 + 0.15 * s;
  rig.elbowR.rotation.x = 0.3 - 0.15 * s;
  // Torso leans into the walk and sways side to side — the old walk kept it bolt upright.
  rig.torso.rotation.x = 0.06;
  rig.torso.rotation.z = 0.03 * s;
  rig.root.position.y = Math.abs(Math.cos(phase * speed)) * 0.03;
}
export function idlePose(rig: BlockyRig, t: number) {
  rig.legL.rotation.x = 0; rig.legR.rotation.x = 0;
  rig.kneeL.rotation.x = 0.06; rig.kneeR.rotation.x = 0.06; // knees never lock dead straight
  // Breathing + weight shift + a slow look around — the old idle only twitched the arms.
  rig.torso.rotation.x = 0.02 * Math.sin(t * 1.2);
  rig.torso.rotation.z = 0.03 * Math.sin(t * 0.5);
  rig.head.rotation.y = 0.25 * Math.sin(t * 0.3);
  rig.armL.rotation.x = Math.sin(t * 1.2) * 0.05;
  rig.armR.rotation.x = -Math.sin(t * 1.2) * 0.05;
  rig.elbowL.rotation.x = 0.25; rig.elbowR.rotation.x = 0.25;
  rig.root.position.y = Math.sin(t * 1.2) * 0.01;
}
export function kickPose(rig: BlockyRig, u: number) {
  // u 0..1: wind up, strike, follow through.
  rig.legR.rotation.x = -1.1 * Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5);
  // Knee: bent in the wind-up, straight at the strike.
  rig.kneeR.rotation.x = -1.0 * Math.sin(Math.PI * Math.min(1, u * 1.2));
  rig.kneeL.rotation.x = -0.15 * u; // plant leg softens
  // Torso twists into the kick and leans with it; arms counter-balance, elbows bent.
  rig.torso.rotation.y = 0.25 * Math.sin(u * Math.PI);
  rig.torso.rotation.x = 0.12 * Math.sin(u * Math.PI);
  rig.armL.rotation.x = -0.6 * u;
  rig.armR.rotation.x = 0.6 * u;
  rig.elbowL.rotation.x = 0.4 * u;
  rig.elbowR.rotation.x = 0.4 * u;
}
export function siuPose(rig: BlockyRig, u: number) {
  // Siu jump: arms out then down, legs tucked, turn handled by root yaw in story.ts.
  // Reset the arm swing: the previous scene's kick leaves rotation.x set, and siuPose
  // only drives rotation.z — without this the arms stay swung forward.
  rig.armL.rotation.x = 0; rig.armR.rotation.x = 0;
  const arms = u < 0.5 ? u * 2 : 2 - u * 2;
  rig.armL.rotation.z = 1.2 * arms;
  rig.armR.rotation.z = -1.2 * arms;
  rig.legL.rotation.x = -0.4 * arms;
  rig.legR.rotation.x = -0.4 * arms;
  // Knees tuck through the jump: bent at take-off, tucked mid-air, bent on landing.
  rig.kneeL.rotation.x = -0.5 - 0.4 * Math.sin(u * Math.PI);
  rig.kneeR.rotation.x = -0.5 - 0.4 * Math.sin(u * Math.PI);
  rig.elbowL.rotation.x = 0.2 * arms;
  rig.elbowR.rotation.x = 0.2 * arms;
  rig.torso.rotation.x = -0.08 * arms; // chest out mid-jump
}
export function liePose(rig: BlockyRig) {
  // Euro 2016 final: Ronaldo injured, lying on the pitch, stretchered off at minute 25.
  rig.root.rotation.x = -Math.PI / 2;
  rig.root.position.y = 0.15;
}
export function sitPose(rig: BlockyRig) {
  // Watching from the sideline after minute 25 — does NOT play again in that final.
  rig.legL.rotation.x = -1.4; rig.legR.rotation.x = -1.4;
  rig.root.position.y = 0.45;
}

/** A clay ball: a smooth white sphere. Round 5 had a white icosahedron with a
 *  black wireframe overlay — it read as a grey rock, not a ball (stills 2026-11-27).
 *  Clay made it a clean sphere; the flat shading went with the blocky style. */
export function makeBall(r = 0.11): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 24, 16),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, metalness: 0 }),
  );
  m.castShadow = true;
  g.add(m);
  return g;
}

/** A blocky trophy: gold cup from boxes + cylinder, no GLB. */
export function makeTrophy(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const gold = new THREE.MeshLambertMaterial({ color: "#e8c45a" });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 0.1 * scale, 0.3 * scale), gold);
  base.position.y = 0.05 * scale;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.07 * scale, 0.25 * scale, 8), gold);
  stem.position.y = 0.22 * scale;
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.1 * scale, 0.25 * scale, 8), gold);
  cup.position.y = 0.47 * scale;
  g.add(base, stem, cup);
  return g;
}
