// Stylised two-tone lighting for every world material (lighting.md 9.2, world part): albedo x mix(shadeCol, litCol,
// sunTerm), sunTerm = real shadow-map visibility x a soft N.L terminator. The sun visibility is captured inside three's
// own light loop (LFB), so nothing is computed twice. Character cards (cardShade) live in the CHAR agent's file and
// can import LFB / CHAR from here; world.ts sets every uniform below once per frame from LIGHTS.
import * as THREE from "three";

export const TONE = {
  uLitCol: { value: new THREE.Vector3(1.5, 1.44, 1.32) }, uShadeCol: { value: new THREE.Vector3(0.6, 0.58, 0.86) },
  uShadeLift: { value: new THREE.Vector3() }, uLambert: { value: 0.35 }, uSideK: { value: 0.84 }, uTerm: { value: 0.2 },
  uBounce: { value: new THREE.Vector3() }, // warm bounce on shaded faces turned to the camera (golden only; day = 0)
  uSat: { value: 1 }, // world albedo saturation around its luminance (characters are not twoTone, so unaffected)
};
/** Per-material shade/lift override for the Eiffel Tower's iron (world.ts): the tower's south face
 *  never sees the day sun (az 75), so under the day preset's blue-grey shade [0.3, 0.29, 0.36] +
 *  blue lift [0.05, 0.06, 0.11] it reads grey-lavender no matter how brown the albedo is — the lift
 *  alone (B 0.11 vs G 0.06) beats any albedo, proven by the #9a6830 brightening changing nothing
 *  in still2_075. The tower gets its own shade/lift uniforms, driven per preset by world.ts:
 *  warm brown by day, the preset's own values at golden hour (so the blue-purple sunset
 *  silhouette stays). Values below are the warm preset's shade/lift, proven to read warm brown. */
export const TOWER_TONE = {
  uShadeCol: { value: new THREE.Vector3(0.46, 0.38, 0.28) },
  uShadeLift: { value: new THREE.Vector3(0.1, 0.07, 0.04) },
};
/** character-card uniforms (lighting.md 9.2 cardShade); world.ts keeps them in sync with LIGHTS for cardshade.ts */
export const CHAR = {
  uCharTint: { value: new THREE.Vector3(1, 0.94, 0.92) }, uCharShade: { value: 0.86 }, uGrad: { value: 0.07 },
  uBodyGrad: { value: 0.2 }, uSideTint: { value: new THREE.Vector3(0.92, 0.9, 0.96) },
};

// directional light 0 = the sun = the only shadow caster (three sorts shadow-casting lights first). Only the
// UNROLLED index 0 compiles the shadow block, so sunVis is written once.
export const LFB = THREE.ShaderChunk.lights_fragment_begin
  .replace("directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]",
    "sunVis = ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]")
  .replace("vDirectionalShadowCoord[ i ] ) : 1.0;", "vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\tdirectLight.color *= sunVis;");
if (!LFB.includes("directLight.color *= sunVis")) throw new Error("shade.ts: three lights_fragment_begin changed");

const TWO_TONE = /* glsl */ `
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;                               // view space, towards the sun
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float ndl = max( dot( geometryNormal, sunV ), 0.0 );
  float sunTerm = sunVis * smoothstep( 0.0, uTerm, ndl );                     // 0 = cast/form shadow, 1 = lit
  float skyK = mix( uSideK, 1.0, 0.5 + 0.5 * dot( geometryNormal, upV ) );    // up-facing a bit brighter
  vec3 lit = uLitCol * mix( 1.0, ndl, uLambert );                             // keep some cosine modelling
  float facing = max( dot( geometryNormal, geometryViewDir ), 0.0 );        // 1 = faces the lens
  vec3 alb = max( mix( vec3( dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) ), diffuseColor.rgb, uSat ), 0.0 );
  reflectedLight.directDiffuse = alb * ( mix( uShadeCol, lit, sunTerm ) * skyK + uBounce * facing * clamp( 1.0 - dot( geometryNormal, upV ), 0.0, 1.0 ) * ( 1.0 - sunTerm ) )
    + uShadeLift * LIFT_K * ( 1.0 - sunTerm );
  reflectedLight.indirectDiffuse = vec3( 0.0 );                               // hemisphere/fill no longer used here
}
#endif
`;
const DECL = "#include <common>\nuniform vec3 uLitCol; uniform vec3 uShadeCol; uniform vec3 uShadeLift; uniform float uLambert; uniform float uSideK; uniform float uTerm; uniform vec3 uBounce; uniform float uSat;";

/** Lambert (or Phong: its specular term is kept, masked by the shadow) -> two-tone. Call once per material.
 *  `over` swaps the shared shade/lift uniforms for per-material ones (the tower's TOWER_TONE);
 *  the cache key changes with it so the override gets its own program. */
export function twoTone<T extends THREE.Material>(m: T, liftK = 1, over?: { shade: { value: THREE.Vector3 }; lift: { value: THREE.Vector3 } }): T {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TONE);
    if (over) { sh.uniforms.uShadeCol = over.shade; sh.uniforms.uShadeLift = over.lift; }
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", DECL + `\n#define LIFT_K ${liftK.toFixed(3)}`)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + TWO_TONE);
  };
  m.customProgramCacheKey = () => "twoTone5_" + liftK.toFixed(3) + (over ? "_over" : "");
  return m;
}

// ---------------- tone-map inversion ----------------
// The composer ends in PBR-Neutral tone mapping, so a colour written to the scene buffer is NOT what lands on screen
// (toe: -0.04 linear offset, shoulder above 0.76). Self-lit things whose on-screen colour is a measured target (sky,
// fog, river) are written as untone(target): the linear value that the Neutral curve maps onto the target.
const neutral = (c: number[]) => {
  const x = Math.min(c[0], c[1], c[2]), off = x < 0.08 ? x - 6.25 * x * x : 0.04;
  const v = c.map((k) => k - off), peak = Math.max(v[0], v[1], v[2]), S = 0.76;
  if (peak < S) return v;
  const d = 1 - S, np = 1 - (d * d) / (peak + d - S), g = 1 - 1 / (0.15 * (peak - np) + 1);
  return v.map((k) => (k * np) / peak * (1 - g) + np * g);
};
/** linear input that the Neutral tone map turns into the given on-screen colour (hex or THREE.Color, sRGB target) */
export const untone = (target: THREE.ColorRepresentation, out = new THREE.Color()) => {
  const t = new THREE.Color(target); // linear working space
  const tt = [t.r, t.g, t.b].map((k) => Math.min(k, 0.985));
  let c = tt.slice();
  for (let i = 0; i < 60; i++) { const y = neutral(c); c = c.map((k, j) => Math.max(0, k + (tt[j] - y[j]))); }
  return out.setRGB(c[0], c[1], c[2]);
};
