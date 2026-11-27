// "VideoBlockyRonaldo": our ~6.5 min vertical blocky 3D short, in the same file structure
// as v08 (Video08.tsx, story.ts, cast.ts, world.ts, captions.ts, map.tsx) — but the
// characters are REAL blocky 3D (blocky.ts: cube head, block body/arms/legs, flat colours,
// bold outline), not v08's flat 2D sprites. One three.js world (world.ts) posed per frame
// from the story timeline (story.ts). Post chain, same as v08: InkPass -> lens blur ->
// [bloom + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// NOTE: no Kenney GLB kit is loaded here — every prop is built from boxes / code in world.ts.
// Composition id: "VideoBlockyRonaldo". TOTAL is an estimate until the VO is measured;
// register it in src/Composition.tsx only when the VO duration is known (Langkah 5).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { MapOverlay, NumbersOverlay } from "./map";
import { InkPass, noInkFallback } from "../v08/ink";
import { LensBlur, GrainEffect } from "../v08/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../v08/grade";
import { TOTAL, layersAt, FPS, sceneAt } from "./story";
import { captionAt, captionLayout } from "./captions";

export const VIDEO_BLOCKY_RONALDO_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene, advance } = useThree();
  const world = useMemo(() => new World(), []);
  const [warmHandle] = useState(() => delayRender("blocky-ronaldo composer warmup"));
  useEffect(() => {
    const tid = setTimeout(() => { advance(performance.now()); continueRender(warmHandle); }, 0);
    return () => clearTimeout(tid);
  }, [advance, warmHandle]);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      {on.grain ? <primitive object={fx.grain} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  world.update(id, f, cam);
  noInkFallback(world.root);
  gradeFor(fx.grade, "day");
  fx.grain.seed = f;
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; alpha: number }> = ({ id, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} />
    </ThreeCanvas>
  </AbsoluteFill>
);

const CAPTION_BASE: React.CSSProperties = {
  color: "#ffffff",
  fontWeight: 800,
  lineHeight: 1.25,
  fontFamily: "Arial, Helvetica, sans-serif",
  textAlign: "center",
  textShadow: "3px 0 0 #000000, -3px 0 0 #000000, 0 3px 0 #000000, 0 -3px 0 #000000, 2px 2px 0 #000000, -2px -2px 0 #000000, 2px -2px 0 #000000, -2px 2px 0 #000000, 0 6px 12px rgba(0,0,0,0.55)",
};
const CaptionOverlay: React.FC<{ text: string; marginBottom?: number }> = ({ text, marginBottom = 430 }) => {
  const { fontSize, lines } = captionLayout(text);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", pointerEvents: "none" }}>
      <div style={{ marginBottom, maxWidth: 920, fontSize, ...CAPTION_BASE }}>
        {lines.map((line, i) => <div key={i}>{line}</div>)}
      </div>
    </AbsoluteFill>
  );
};

/** Year + place label, top of frame, only while its scene is active. */
const SceneLabel: React.FC = () => {
  const f = useCurrentFrame();
  const scene = sceneAt(f);
  if (!scene.label) return null;
  const opacity = Math.min(1, (f - scene.a) / 8, (scene.b - f) / 8);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", pointerEvents: "none", opacity }}>
      <div style={{ marginTop: 120, fontSize: 54, ...CAPTION_BASE }}>{scene.label}</div>
    </AbsoluteFill>
  );
};

/** Closing frame: "BELUM SELESAI" over the Madeira sunset (scene 29). */
const ClosingFrame: React.FC = () => {
  const f = useCurrentFrame();
  const scene = sceneAt(f);
  if (scene.id !== 29) return null;
  const opacity = Math.min(1, (f - scene.a) / 30);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none", opacity }}>
      <div style={{ fontSize: 96, ...CAPTION_BASE }}>BELUM SELESAI</div>
    </AbsoluteFill>
  );
};

export const VideoBlockyRonaldo: React.FC = () => {
  const f = useCurrentFrame();
  const cap = captionAt(f / FPS);
  return (
    <AbsoluteFill style={{ background: "#a8d0ea" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} alpha={l.alpha} />)}
      <MapOverlay />
      <NumbersOverlay />
      <SceneLabel />
      <ClosingFrame />
      {cap && <CaptionOverlay text={cap} />}
    </AbsoluteFill>
  );
};
