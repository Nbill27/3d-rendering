// "TobaTest": TEST composition in the @fafnir.id "FaktaUnik" style
// (reference: "Warga Garut Ini Dilarang Menambah Rumah", Kampung Pulo,
// 50 s, 127 ribu like). Storyline: Danau Toba (facts verified, SCRIPT.md).
// Bahasa Indonesia. Render lokal saja, jangan pernah stage/upload ke repo.
//
// GAYA FAFNIR (dari studi frame per frame 2026-11-26):
// - CHARACTERS: flat 2D, giant round/oval white head ~1/3 of total height,
//   small square body, VERY long thin stick legs (40% of height), short
//   arms, no detailed fingers. Thick black outline. Pale white skin,
//   flat fill, no shading.
// - FACE: small black dot eyes or "><" lines when angry, NO NOSE, small
//   wavy "~" mouth or flat line, THREE short mustache lines on each cheek,
//   pink oval blush cheeks, thick black eyebrows angled when worried/angry.
//   Exaggerated expressions: yellow star eyes, blue sweat drops when panicked.
// - BACKGROUNDS: flat characters over detailed semi-realistic 3D-textured
//   backgrounds with light and shadow. Frame filled top to bottom, NO empty
//   space. Bright, saturated, warm daylight palette: green grass/trees, blue
//   sky/lake, red roof tiles, brown wood/bamboo/stone, cream walls.
// - TEXT: karaoke word-by-word, bold sans, lowercase (except sentence
//   starts/names), WHITE with thick black outline, no color highlight.
//   Very big (one word ~8-10% of frame height), 1 line, 1-2 words per
//   display, changing every ~0.5-1 s following the narration. Position
//   center-lower, 60-75% of frame height. May cover body/legs, NEVER face.
// - CAMERA: mostly static per shot, hard cuts, very slow zoom-in.
//   Character movement very limited, 2-3 pose loops only.
// - VO: young male narrator, fast everyday Indonesian, energetic, slightly
//   funny, sounds like neat TTS. Almost no background music.
//
// TIMING: karaoke.ts is the ONLY source of text timing. Scene is derived
// from the line of the phrase currently showing (S1=lines 1-2, S2=line 3,
// S3=lines 4-5, S4=line 6, S5=line 7, S6=line 8, S7=line 9, S8=line 10).
// karaoke.ts currently holds MEASURED VO timings (karaoke.json, 1622 frames).
// TOTAL_FRAMES = 1622 (mix 54,062 dtk).
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { KARAOKE } from "./karaoke";

const W = 1080;
const H = 1920;
const TOTAL_FRAMES = 1622;

const SKIN = "#fdf8f2";
const INK = "#141414";
const GREEN_SHIRT = "#2f9e4f";
const BLUSH = "#ffb4b4";

/* ------------------------------------------------------------------ */
/* Character: Fafnir style. Natural size 480 x 900. Head 300 px       */
/* (~1/3 of height), small square body, very long thin stick legs      */
/* (~40% of height), short arms, small black sandals, NO nose.         */
/* ------------------------------------------------------------------ */

type CharKind = "guide" | "elder";
type Pose = "stand" | "point" | "walk" | "worried" | "amazed" | "smile";
type EyeKind = "dot" | "star" | "angry";
type MouthKind = "wavy" | "line" | "smirk" | "open";

/** Small black dot eye. */
const DotEye: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 16,
      height: 16,
      backgroundColor: INK,
      borderRadius: "50%",
    }}
  />
);

/** Angry "><" eye: two short crossed lines. */
const AngryEye: React.FC<{ x: number; y: number; flip?: boolean }> = ({ x, y, flip }) => (
  <svg
    style={{ position: "absolute", left: x, top: y }}
    width="34"
    height="26"
    viewBox="0 0 34 26"
  >
    <path
      d={flip ? "M4 4 L30 13 L4 22" : "M30 4 L4 13 L30 22"}
      stroke={INK}
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Yellow star eye (amazed / excited child). */
const StarEye: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      fontSize: 52,
      lineHeight: 1,
      color: "#ffd700",
      textShadow: "0 0 0 #141414, 3px 0 0 #141414, -3px 0 0 #141414, 0 3px 0 #141414, 0 -3px 0 #141414",
    }}
  >
    ★
  </div>
);

/** Thick black eyebrow, angled when worried/angry. */
const Brow: React.FC<{ x: number; y: number; rotate: number }> = ({ x, y, rotate }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 62,
      height: 26,
      borderTop: `10px solid ${INK}`,
      borderRadius: "50%",
      transform: `rotate(${rotate}deg)`,
    }}
  />
);

/** Three short mustache lines on one cheek. */
const CheekLines: React.FC<{ left: number; top: number; flip?: boolean }> = ({ left, top, flip }) => (
  <>
    {[0, 1, 2].map((k) => (
      <div
        key={k}
        style={{
          position: "absolute",
          left: left,
          top: top + k * 18,
          width: 30,
          height: 6,
          backgroundColor: INK,
          borderRadius: 3,
          transform: `rotate(${flip ? -22 : 22}deg)`,
          transformOrigin: "left center",
        }}
      />
    ))}
  </>
);

const Mouth: React.FC<{ kind: MouthKind }> = ({ kind }) => {
  if (kind === "wavy") {
    return (
      <svg style={{ position: "absolute", left: 192, top: 218 }} width="96" height="20" viewBox="0 0 96 20">
        <path
          d="M4 10 Q 16 2, 28 10 T 52 10 T 76 10 T 92 10"
          stroke={INK}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "smirk") {
    return (
      <div
        style={{
          position: "absolute",
          left: 198,
          top: 216,
          width: 84,
          height: 34,
          borderBottom: `7px solid ${INK}`,
          borderRadius: "0 0 84px 84px",
          transform: "rotate(-8deg)",
        }}
      />
    );
  }
  if (kind === "open") {
    return (
      <div
        style={{
          position: "absolute",
          left: 212,
          top: 214,
          width: 56,
          height: 66,
          backgroundColor: "#6e1f1f",
          border: `5px solid ${INK}`,
          borderRadius: "50%",
        }}
      />
    );
  }
  // flat line (default)
  return (
    <div
      style={{
        position: "absolute",
        left: 200,
        top: 224,
        width: 80,
        height: 7,
        backgroundColor: INK,
        borderRadius: 4,
      }}
    />
  );
};

/** Blue sweat drop (panic). */
const SweatDrop: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 34,
      height: 44,
      backgroundColor: "#4aa8e0",
      border: `4px solid ${INK}`,
      borderRadius: "50% 50% 50% 0",
      transform: "rotate(-45deg)",
    }}
  />
);

const Person: React.FC<{
  x: number;
  y: number;
  scale?: number;
  kind?: CharKind;
  shirt?: string;
  pose?: Pose;
  eye?: EyeKind;
  mouth?: MouthKind;
  worried?: boolean;
  sweat?: boolean;
  sarong?: boolean;
  local?: number;
}> = ({
  x,
  y,
  scale = 1,
  kind = "guide",
  shirt = GREEN_SHIRT,
  pose = "stand",
  eye = "dot",
  mouth = "wavy",
  worried = false,
  sweat = false,
  sarong = false,
  local = 0,
}) => {
  // Walk: legs alternate every 15 frames; stand: gentle breathing bob.
  const step = Math.floor(local / 15) % 2 === 0;
  const legAngle = pose === "walk" ? (step ? 22 : -22) : 0;
  const bob = pose === "walk" ? Math.abs(Math.sin(local * 0.35)) * -8 : Math.sin(local * 0.08) * 2;
  const armAngle = (left: boolean): number => {
    if (pose === "point") return left ? 14 : -84; // right arm raised, pointing right
    if (pose === "walk") return left ? (step ? 28 : -28) : (step ? -28 : 28);
    if (pose === "worried") return left ? 24 : -24;
    return left ? 12 : -12;
  };
  // Short white arm with black outline.
  const armStyle = (left: boolean): React.CSSProperties => ({
    position: "absolute",
    left: left ? 138 : 318,
    top: 336,
    width: 24,
    height: 118,
    backgroundColor: SKIN,
    border: `4px solid ${INK}`,
    borderRadius: 12,
    transform: `rotate(${armAngle(left)}deg)`,
    transformOrigin: "top center",
  });
  // Very long thin black stick leg (40% of height).
  const legTop = sarong ? 580 : 470;
  const legLen = sarong ? 250 : 360;
  const legStyle = (left: boolean): React.CSSProperties => ({
    position: "absolute",
    left: left ? 204 : 262,
    top: legTop,
    width: 14,
    height: legLen,
    backgroundColor: INK,
    borderRadius: 7,
    transform: `rotate(${left ? -legAngle : legAngle}deg)`,
    transformOrigin: "top center",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bob,
        width: 480,
        height: 900,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {/* legs */}
      <div style={legStyle(true)} />
      <div style={legStyle(false)} />
      {/* small black sandals */}
      <div style={{ position: "absolute", left: 182, top: 824, width: 66, height: 24, backgroundColor: INK, borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 240, top: 824, width: 66, height: 24, backgroundColor: INK, borderRadius: "50%" }} />
      {/* checkered sarong (elder) covering the top of the legs */}
      {sarong && (
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 468,
            width: 180,
            height: 120,
            backgroundColor: "#f5f2ea",
            backgroundImage:
              "linear-gradient(45deg, #2b5aa8 25%, transparent 25%), linear-gradient(-45deg, #2b5aa8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2b5aa8 75%), linear-gradient(-45deg, transparent 75%, #2b5aa8 75%)",
            backgroundSize: "40px 40px",
            backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0",
            border: `4px solid ${INK}`,
            borderRadius: 8,
          }}
        />
      )}
      {/* small square body */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 320,
          width: 180,
          height: 150,
          backgroundColor: shirt,
          border: `4px solid ${INK}`,
          borderRadius: 10,
        }}
      />
      {/* short arms */}
      <div style={armStyle(true)} />
      <div style={armStyle(false)} />
      {/* GIANT HEAD: 300 px diameter = ~1/3 of total height */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 0,
          width: 300,
          height: 300,
          backgroundColor: SKIN,
          border: `5px solid ${INK}`,
          borderRadius: "50%",
        }}
      />
      {/* guide: short black hair with bangs */}
      {kind === "guide" && (
        <>
          <div
            style={{
              position: "absolute",
              left: 90,
              top: -4,
              width: 300,
              height: 110,
              backgroundColor: INK,
              borderRadius: "150px 150px 16px 16px",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 82,
              width: 300,
              height: 44,
              backgroundColor: INK,
              borderRadius: "0 0 140px 140px",
            }}
          />
        </>
      )}
      {/* elder: brown polkadot headband */}
      {kind === "elder" && (
        <div
          style={{
            position: "absolute",
            left: 92,
            top: 56,
            width: 296,
            height: 52,
            backgroundColor: "#7a4a2b",
            backgroundImage: "radial-gradient(circle, #ffffff 5px, transparent 6px)",
            backgroundSize: "30px 30px",
            borderTop: `4px solid ${INK}`,
            borderBottom: `4px solid ${INK}`,
            borderRadius: 6,
          }}
        />
      )}
      {/* face: NO NOSE. Dot/star/angry eyes, brows, blush, cheek lines. */}
      <Brow x={138} y={104} rotate={worried ? -16 : 6} />
      <Brow x={280} y={104} rotate={worried ? 16 : -6} />
      {eye === "dot" && (
        <>
          <DotEye x={162} y={140} />
          <DotEye x={302} y={140} />
        </>
      )}
      {eye === "star" && (
        <>
          <StarEye x={148} y={128} />
          <StarEye x={288} y={128} />
        </>
      )}
      {eye === "angry" && (
        <>
          <AngryEye x={150} y={138} />
          <AngryEye x={296} y={138} flip />
        </>
      )}
      {/* pink oval blush cheeks */}
      <div style={{ position: "absolute", left: 116, top: 192, width: 38, height: 24, backgroundColor: BLUSH, borderRadius: "50%", opacity: 0.9 }} />
      <div style={{ position: "absolute", left: 326, top: 192, width: 38, height: 24, backgroundColor: BLUSH, borderRadius: "50%", opacity: 0.9 }} />
      {/* three short mustache lines on each cheek */}
      <CheekLines left={104} top={196} />
      <CheekLines left={346} top={196} flip />
      {/* elder: thick mustache bar above the mouth */}
      {kind === "elder" && (
        <div
          style={{
            position: "absolute",
            left: 196,
            top: 200,
            width: 88,
            height: 14,
            backgroundColor: INK,
            borderRadius: 7,
          }}
        />
      )}
      <Mouth kind={mouth} />
      {/* blue sweat drop (panic) */}
      {sweat && <SweatDrop x={398} y={96} />}
    </div>
  );
};

/** Karaoke text: one phrase at a time, Poppins ExtraBold, white with thick
 *  black outline, single line, center-lower (60-75% of frame height).
 *  Font size auto-fits the phrase into ~1020 px (cap 170 px, floor 95 px)
 *  so long phrases stay on one line. */
const fitFontSize = (phrase: string): number => {
  const est = phrase.length * 0.68; // conservative em-width of Poppins ExtraBold lowercase (wide letters like m/g/a)
  return Math.max(90, Math.min(170, Math.floor(1000 / est)));
};

const KaraokeText: React.FC<{ phrase: string }> = ({ phrase }) => {
  const outline =
    "0 7px 0 #111111, 7px 0 0 #111111, -7px 0 0 #111111, 0 -7px 0 #111111, 5px 5px 0 #111111, -5px 5px 0 #111111, 5px -5px 0 #111111, -5px -5px 0 #111111, 0 10px 20px rgba(0,0,0,0.35)";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 470,
        display: "flex",
        justifyContent: "center",
        paddingLeft: 30,
        paddingRight: 30,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Poppins, 'Poppins ExtraBold', Arial, sans-serif",
          fontWeight: 800,
          fontSize: fitFontSize(phrase),
          lineHeight: 1.05,
          color: "#ffffff",
          textShadow: outline,
          whiteSpace: "nowrap",
        }}
      >
        {phrase}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* SCENES — 8 scenes, hard cuts, very slow zoom. Each takes `local`    */
/* (frames since the scene started) for the 2-3 pose loop.             */
/* ------------------------------------------------------------------ */

/* S1 (L1+L2): wide Lake Toba, blue water, green hills, blue sky, sun */
const Scene1: React.FC<{ local: number }> = ({ local }) => {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #6ec1f0 0%, #a8dcf7 42%, #d8f2ff 55%, #2a7fd8 56%, #5cb3e8 100%)" }}>
      {/* sun with glow */}
      <div style={{ position: "absolute", left: 760, top: 60, width: 360, height: 360, background: "radial-gradient(circle, rgba(255,217,122,0.8) 0%, rgba(255,217,122,0) 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 840, top: 120, width: 190, height: 190, backgroundColor: "#ffd97a", borderRadius: "50%" }} />
      {/* clouds */}
      <div style={{ position: "absolute", left: 90, top: 160, width: 230, height: 64, backgroundColor: "#ffffff", borderRadius: 32 }} />
      <div style={{ position: "absolute", left: 150, top: 130, width: 150, height: 54, backgroundColor: "#ffffff", borderRadius: 27 }} />
      <div style={{ position: "absolute", left: 560, top: 300, width: 190, height: 56, backgroundColor: "#ffffff", borderRadius: 28, opacity: 0.9 }} />
      <div style={{ position: "absolute", left: 420, top: 420, width: 150, height: 46, backgroundColor: "#ffffff", borderRadius: 23, opacity: 0.85 }} />
      {/* birds */}
      <div style={{ position: "absolute", left: 420, top: 220, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 52, color: "#3d5a80" }}>⌄ ⌄</div>
      <div style={{ position: "absolute", left: 680, top: 180, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 42, color: "#3d5a80" }}>⌄</div>
      {/* far hills: lower ridges so the lake reads tall */}
      <div style={{ position: "absolute", left: -200, top: 780, width: 900, height: 300, backgroundColor: "#57a86a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 380, top: 830, width: 900, height: 280, backgroundColor: "#3f8a52", borderRadius: "50%" }} />
      {/* tree silhouettes sitting ON the far ridge */}
      <div style={{ position: "absolute", left: 120, top: 770, width: 90, height: 90, backgroundColor: "#2e7a44", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 300, top: 800, width: 70, height: 70, backgroundColor: "#2e7a44", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 700, top: 810, width: 80, height: 80, backgroundColor: "#2e7a44", borderRadius: "50%" }} />
      {/* lake sparkles + wave lines */}
      <div style={{ position: "absolute", left: 420, top: 1080, width: 140, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.75 }} />
      <div style={{ position: "absolute", left: 700, top: 1160, width: 110, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.6 }} />
      <div style={{ position: "absolute", left: 180, top: 1240, width: 160, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: 520, top: 1320, width: 100, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.5 }} />
      <div style={{ position: "absolute", left: 820, top: 1300, width: 120, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.55 }} />
      <div style={{ position: "absolute", left: 60, top: 1150, width: 100, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.5 }} />
      {/* wooden boat on the lake */}
      <div style={{ position: "absolute", left: 620, top: 1180, width: 220, height: 46, backgroundColor: "#7a4a2b", borderRadius: "0 0 60px 60px", border: "4px solid #4a2c1e" }} />
      <div style={{ position: "absolute", left: 680, top: 1110, width: 100, height: 70, backgroundColor: "#fdf6e3", borderRadius: "50px 50px 0 0", border: "4px solid #b9a68e" }} />
      <div style={{ position: "absolute", left: 720, top: 1040, width: 8, height: 80, backgroundColor: "#5d4023" }} />
      {/* shore: grass strip then sand, with detail */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 480, backgroundColor: "#e8d5a0" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 360, height: 120, backgroundColor: "#4e9d5e" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 450, height: 10, backgroundColor: "#3e7d4e", opacity: 0.7 }} />
      {/* water edge foam line where the lake meets the shore */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 478, height: 12, backgroundColor: "#ffffff", opacity: 0.65, borderRadius: 6 }} />
      {/* grass tufts + flowers on the shore */}
      <div style={{ position: "absolute", left: 80, top: 1470, width: 70, height: 50, backgroundColor: "#3e7d4e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 880, top: 1480, width: 80, height: 56, backgroundColor: "#3e7d4e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 100, top: 1450, width: 24, height: 24, backgroundColor: "#ff8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 910, top: 1460, width: 24, height: 24, backgroundColor: "#ffe14d", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 820, top: 1500, width: 20, height: 20, backgroundColor: "#ff8a8a", borderRadius: "50%" }} />
      {/* rocks + footprints on the sand */}
      <div style={{ position: "absolute", left: 700, top: 1620, width: 90, height: 60, backgroundColor: "#9a9a9a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 790, top: 1640, width: 60, height: 40, backgroundColor: "#7a7a7a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 480, top: 1700, width: 34, height: 22, backgroundColor: "#c9b18a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 540, top: 1760, width: 34, height: 22, backgroundColor: "#c9b18a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 420, top: 1820, width: 34, height: 22, backgroundColor: "#c9b18a", borderRadius: "50%" }} />
      {/* big tree at the right edge */}
      <div style={{ position: "absolute", left: 990, top: 1000, width: 34, height: 460, backgroundColor: "#5d4023", borderRadius: 10 }} />
      <div style={{ position: "absolute", left: 880, top: 860, width: 240, height: 200, backgroundColor: "#2e7a44", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 960, top: 780, width: 200, height: 160, backgroundColor: "#3f8a52", borderRadius: "50%" }} />
      {/* guide on the shore, pointing at the lake (smaller, wide-shot scale) */}
      <Person x={150} y={760} scale={0.75} kind="guide" pose="point" eye="dot" mouth="smirk" local={local} />
    </AbsoluteFill>
  );
};

/* S2 (L3): volcano erupting, red-orange sky, ash cloud, lava */
const Scene2: React.FC<{ local: number }> = ({ local }) => {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #ff8a3d 0%, #d84a2a 45%, #7a2418 75%, #4a2c1e 100%)" }}>
      {/* ash cloud billowing above the crater */}
      <div style={{ position: "absolute", left: 240, top: 60, width: 600, height: 260, backgroundColor: "#5d5d5d", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 120, top: 160, width: 380, height: 200, backgroundColor: "#6e6e6e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 560, top: 170, width: 400, height: 200, backgroundColor: "#4a4a4a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 360, top: 20, width: 360, height: 180, backgroundColor: "#7a7a7a", borderRadius: "50%" }} />
      {/* volcano cone: truncated top so the crater reads as an opening */}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 420,
          width: 800,
          height: 900,
          backgroundColor: "#5d3a28",
          clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
        }}
      />
      {/* darker shaded right half of the cone (same box, right half only) */}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 420,
          width: 800,
          height: 900,
          backgroundColor: "#4a2c1e",
          clipPath: "polygon(50% 0, 58% 0, 100% 100%, 50% 100%)",
          opacity: 0.85,
        }}
      />
      {/* rocky bumps on the cone */}
      <div style={{ position: "absolute", left: 300, top: 900, width: 70, height: 50, backgroundColor: "#4a2c1e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 680, top: 980, width: 80, height: 56, backgroundColor: "#4a2c1e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 420, top: 1080, width: 60, height: 44, backgroundColor: "#4a2c1e", borderRadius: "50%" }} />
      {/* crater glow sitting INSIDE the flat crater opening */}
      <div style={{ position: "absolute", left: 470, top: 424, width: 140, height: 44, backgroundColor: "#ff6b1a", borderRadius: "50%", boxShadow: "0 0 60px #ff8a3d" }} />
      <div style={{ position: "absolute", left: 505, top: 434, width: 70, height: 24, backgroundColor: "#ffd97a", borderRadius: "50%" }} />
      {/* lava streams: tapered wedges following the cone slope */}
      <div style={{ position: "absolute", left: 505, top: 470, width: 44, height: 400, backgroundColor: "#ff6b1a", borderRadius: 13, clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)", transform: "rotate(12deg)", transformOrigin: "top center", boxShadow: "0 0 30px #ff6b1a" }} />
      <div style={{ position: "absolute", left: 590, top: 470, width: 36, height: 310, backgroundColor: "#ff8a3d", borderRadius: 10, clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)", transform: "rotate(-9deg)", transformOrigin: "top center" }} />
      <div style={{ position: "absolute", left: 440, top: 470, width: 32, height: 250, backgroundColor: "#ff8a3d", borderRadius: 9, clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)", transform: "rotate(16deg)", transformOrigin: "top center" }} />
      {/* lava pool at the base */}
      <div style={{ position: "absolute", left: 280, top: 1220, width: 520, height: 64, backgroundColor: "#ff6b1a", borderRadius: "50%", boxShadow: "0 0 60px #ff6b1a" }} />
      {/* scorched ground with cracks, embers, rocks, burnt stumps */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 560, backgroundColor: "#3a2115" }} />
      <div style={{ position: "absolute", left: 200, top: 1400, width: 200, height: 8, backgroundColor: "#ff6b1a", transform: "rotate(-8deg)", borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 700, top: 1500, width: 180, height: 8, backgroundColor: "#ff8a3d", transform: "rotate(6deg)", borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 480, top: 1600, width: 150, height: 8, backgroundColor: "#ff6b1a", transform: "rotate(-4deg)", borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 120, top: 1520, width: 80, height: 56, backgroundColor: "#2c2c2c", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 880, top: 1560, width: 100, height: 64, backgroundColor: "#2c2c2c", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 560, top: 1700, width: 70, height: 48, backgroundColor: "#2c2c2c", borderRadius: "50%" }} />
      {/* glowing embers on the ground */}
      <div style={{ position: "absolute", left: 380, top: 1560, width: 16, height: 16, backgroundColor: "#ff6b1a", borderRadius: "50%", boxShadow: "0 0 16px #ff6b1a" }} />
      <div style={{ position: "absolute", left: 760, top: 1680, width: 14, height: 14, backgroundColor: "#ff8a3d", borderRadius: "50%", boxShadow: "0 0 14px #ff8a3d" }} />
      <div style={{ position: "absolute", left: 640, top: 1800, width: 16, height: 16, backgroundColor: "#ff6b1a", borderRadius: "50%", boxShadow: "0 0 16px #ff6b1a" }} />
      {/* burnt tree stumps */}
      <div style={{ position: "absolute", left: 140, top: 1660, width: 22, height: 90, backgroundColor: "#1e140e", borderRadius: 8, transform: "rotate(-6deg)" }} />
      <div style={{ position: "absolute", left: 920, top: 1700, width: 22, height: 80, backgroundColor: "#1e140e", borderRadius: 8, transform: "rotate(8deg)" }} />
      {/* ash piles */}
      <div style={{ position: "absolute", left: 300, top: 1760, width: 140, height: 50, backgroundColor: "#5d5d5d", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 700, top: 1790, width: 120, height: 44, backgroundColor: "#5d5d5d", borderRadius: "50%" }} />
      {/* falling ash particles */}
      {[
        { x: 160, y: 300 }, { x: 320, y: 380 }, { x: 700, y: 320 }, { x: 860, y: 420 },
        { x: 240, y: 560 }, { x: 780, y: 600 }, { x: 100, y: 700 }, { x: 950, y: 700 },
      ].map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x, top: d.y, width: 12, height: 12, backgroundColor: "#d8d8d8", borderRadius: "50%", opacity: 0.8 }} />
      ))}
      {/* guide at the bottom-left, worried, sweating */}
      <Person x={90} y={980} scale={0.8} kind="guide" pose="worried" eye="dot" mouth="wavy" worried sweat local={local} />
    </AbsoluteFill>
  );
};

/* S3 (L4+L5): ash cloud spreading over the land, wind, grey sky */
const Scene3: React.FC<{ local: number }> = ({ local }) => {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #a8b0b5 0%, #8a959c 45%, #6e7a82 70%, #5d6b54 100%)" }}>
      {/* huge ash cloud mass across the sky, with darker ragged underside */}
      <div style={{ position: "absolute", left: -100, top: 40, width: 700, height: 300, backgroundColor: "#4a4a4a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 400, top: 120, width: 800, height: 320, backgroundColor: "#5d5d5d", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 200, top: 260, width: 700, height: 260, backgroundColor: "#6e6e6e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 100, top: 380, width: 420, height: 180, backgroundColor: "#7a7a7a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 620, top: 400, width: 380, height: 160, backgroundColor: "#7a7a7a", borderRadius: "50%" }} />
      {/* small darker blobs breaking the smooth cloud edge */}
      <div style={{ position: "absolute", left: 180, top: 500, width: 180, height: 90, backgroundColor: "#5d5d5d", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 700, top: 520, width: 160, height: 80, backgroundColor: "#5d5d5d", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 440, top: 480, width: 200, height: 90, backgroundColor: "#4a4a4a", borderRadius: "50%" }} />
      {/* wind streaks (kept clear of the guide's head) */}
      <div style={{ position: "absolute", left: 80, top: 620, width: 300, height: 10, backgroundColor: "#e8e8e8", borderRadius: 5, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: 840, top: 660, width: 200, height: 10, backgroundColor: "#e8e8e8", borderRadius: 5, opacity: 0.6 }} />
      <div style={{ position: "absolute", left: 120, top: 760, width: 260, height: 10, backgroundColor: "#e8e8e8", borderRadius: 5, opacity: 0.5 }} />
      {/* grey-brown hills with texture */}
      <div style={{ position: "absolute", left: -200, top: 900, width: 900, height: 380, backgroundColor: "#6b6252", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 380, top: 960, width: 900, height: 360, backgroundColor: "#5d5648", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 120, top: 980, width: 160, height: 70, backgroundColor: "#5d5648", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 700, top: 1040, width: 180, height: 80, backgroundColor: "#4a4438", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 420, top: 1100, width: 140, height: 60, backgroundColor: "#5d5648", borderRadius: "50%" }} />
      {/* bent trees leaning in the wind (trunk + canopy rotated together) */}
      <div style={{ position: "absolute", left: 60, top: 880, width: 220, height: 420, transform: "rotate(16deg)", transformOrigin: "bottom center" }}>
        <div style={{ position: "absolute", left: 100, top: 120, width: 26, height: 300, backgroundColor: "#4a3a28", borderRadius: 10 }} />
        <div style={{ position: "absolute", left: 10, top: 0, width: 200, height: 150, backgroundColor: "#4a5d3a", borderRadius: "50%" }} />
      </div>
      <div style={{ position: "absolute", left: 820, top: 940, width: 200, height: 380, transform: "rotate(20deg)", transformOrigin: "bottom center" }}>
        <div style={{ position: "absolute", left: 90, top: 110, width: 24, height: 270, backgroundColor: "#4a3a28", borderRadius: 10 }} />
        <div style={{ position: "absolute", left: 10, top: 0, width: 180, height: 130, backgroundColor: "#4a5d3a", borderRadius: "50%" }} />
      </div>
      {/* dry ground with tufts, rocks, ash drifts, cracks */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 560, backgroundColor: "#7a6f52" }} />
      <div style={{ position: "absolute", left: 100, top: 1480, width: 70, height: 40, backgroundColor: "#8a7d5e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 800, top: 1520, width: 80, height: 44, backgroundColor: "#8a7d5e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 200, top: 1620, width: 60, height: 36, backgroundColor: "#8a7d5e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 640, top: 1700, width: 70, height: 40, backgroundColor: "#8a7d5e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 420, top: 1780, width: 90, height: 44, backgroundColor: "#9a9a9a", borderRadius: "50%", opacity: 0.7 }} />
      <div style={{ position: "absolute", left: 120, top: 1720, width: 90, height: 40, backgroundColor: "#9a9a9a", borderRadius: "50%", opacity: 0.6 }} />
      <div style={{ position: "absolute", left: 700, top: 1560, width: 180, height: 8, backgroundColor: "#5d5648", transform: "rotate(-5deg)", borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 200, top: 1840, width: 160, height: 8, backgroundColor: "#5d5648", transform: "rotate(4deg)", borderRadius: 4 }} />
      {/* falling ash */}
      {[
        { x: 140, y: 640 }, { x: 360, y: 720 }, { x: 640, y: 660 }, { x: 880, y: 740 },
        { x: 240, y: 860 }, { x: 760, y: 880 }, { x: 60, y: 980 }, { x: 980, y: 960 },
      ].map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x, top: d.y, width: 11, height: 11, backgroundColor: "#e8e8e8", borderRadius: "50%", opacity: 0.75 }} />
      ))}
      {/* birds flying away, below the cloud, left side */}
      <div style={{ position: "absolute", left: 120, top: 640, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 44, color: "#3d3d3d" }}>⌄ ⌄</div>
      {/* guide in the center, looking up worried, sweating */}
      <Person x={380} y={700} scale={0.9} kind="guide" pose="worried" eye="dot" mouth="wavy" worried sweat local={local} />
    </AbsoluteFill>
  );
};

/* S4 (L6): the mountain collapses, giant caldera forms */
const Scene4: React.FC<{ local: number }> = ({ local }) => {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #c9b18a 0%, #b09a76 45%, #8a7a5e 70%, #6b5d48 100%)" }}>
      {/* dusty sky sun, dimmed, + faint dust clouds */}
      <div style={{ position: "absolute", left: 800, top: 100, width: 170, height: 170, backgroundColor: "#e8c98a", borderRadius: "50%", opacity: 0.8 }} />
      <div style={{ position: "absolute", left: 80, top: 220, width: 260, height: 70, backgroundColor: "#b09a76", borderRadius: 35, opacity: 0.6 }} />
      <div style={{ position: "absolute", left: 620, top: 300, width: 220, height: 60, backgroundColor: "#b09a76", borderRadius: 30, opacity: 0.5 }} />
      {/* ONE mountain: full truncated cone */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 380,
          width: 840,
          height: 880,
          backgroundColor: "#6b4a34",
          clipPath: "polygon(44% 0, 56% 0, 100% 100%, 0 100%)",
        }}
      />
      {/* darker right half (shading, same box) */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 380,
          width: 840,
          height: 880,
          backgroundColor: "#5d3f2c",
          clipPath: "polygon(50% 0, 56% 0, 100% 100%, 50% 100%)",
          opacity: 0.8,
        }}
      />
      {/* the crack: dark fissure with orange glow flanks, apex to base */}
      <div style={{ position: "absolute", left: 530, top: 430, width: 18, height: 800, backgroundColor: "#2c2118", transform: "rotate(2deg)", borderRadius: 9 }} />
      <div style={{ position: "absolute", left: 508, top: 440, width: 10, height: 700, backgroundColor: "#ff6b1a", transform: "rotate(2deg)", borderRadius: 5, boxShadow: "0 0 24px #ff6b1a", opacity: 0.9 }} />
      <div style={{ position: "absolute", left: 558, top: 460, width: 10, height: 650, backgroundColor: "#ff8a3d", transform: "rotate(2deg)", borderRadius: 5, opacity: 0.9 }} />
      {/* sliding slab: a chunk of the right flank slipping down */}
      <div
        style={{
          position: "absolute",
          left: 600,
          top: 640,
          width: 400,
          height: 620,
          backgroundColor: "#5d3f2c",
          clipPath: "polygon(18% 0, 100% 100%, 0 100%)",
          transform: "rotate(5deg)",
          transformOrigin: "bottom center",
        }}
      />
      {/* rocky bumps on the mountain */}
      <div style={{ position: "absolute", left: 300, top: 800, width: 60, height: 44, backgroundColor: "#4a2c1e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 700, top: 900, width: 70, height: 50, backgroundColor: "#4a2c1e", borderRadius: "50%" }} />
      {/* dust clouds at the base */}
      <div style={{ position: "absolute", left: 100, top: 1050, width: 420, height: 180, backgroundColor: "#a08a6a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 500, top: 1100, width: 480, height: 200, backgroundColor: "#8a7a5e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 300, top: 1000, width: 380, height: 160, backgroundColor: "#b09a76", borderRadius: "50%" }} />
      {/* falling rocks */}
      <div style={{ position: "absolute", left: 300, top: 700, width: 44, height: 44, backgroundColor: "#3a2c22", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 700, top: 820, width: 36, height: 36, backgroundColor: "#3a2c22", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 180, top: 900, width: 30, height: 30, backgroundColor: "#3a2c22", borderRadius: "50%" }} />
      {/* caldera: wide dark depression in the middle ground */}
      <div style={{ position: "absolute", left: 140, top: 1230, width: 800, height: 220, backgroundColor: "#4a3828", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 220, top: 1270, width: 640, height: 140, backgroundColor: "#2c2118", borderRadius: "50%" }} />
      {/* cracked ground with rocks + ash piles */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 480, backgroundColor: "#7a6a52" }} />
      <div style={{ position: "absolute", left: 150, top: 1520, width: 220, height: 8, backgroundColor: "#4a3828", transform: "rotate(-6deg)", borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 650, top: 1600, width: 200, height: 8, backgroundColor: "#4a3828", transform: "rotate(5deg)", borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 120, top: 1620, width: 90, height: 60, backgroundColor: "#5d5d5d", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 820, top: 1660, width: 100, height: 64, backgroundColor: "#5d5d5d", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 400, top: 1740, width: 80, height: 50, backgroundColor: "#6b6252", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 700, top: 1800, width: 70, height: 44, backgroundColor: "#6b6252", borderRadius: "50%" }} />
      {/* guide small at the bottom, watching the collapse */}
      <Person x={420} y={1060} scale={0.55} kind="guide" pose="worried" eye="dot" mouth="wavy" worried sweat local={local} />
    </AbsoluteFill>
  );
};

/* S5 (L7): the crater fills with water, calm blue lake returns */
const Scene5: React.FC<{ local: number }> = ({ local }) => {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #7ec8f5 0%, #b8e4f8 45%, #2a7fd8 55%, #4aa8e0 100%)" }}>
      {/* sun with glow + clouds */}
      <div style={{ position: "absolute", left: 780, top: 80, width: 300, height: 300, background: "radial-gradient(circle, rgba(255,217,122,0.7) 0%, rgba(255,217,122,0) 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 850, top: 130, width: 160, height: 160, backgroundColor: "#ffd97a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 100, top: 170, width: 220, height: 60, backgroundColor: "#ffffff", borderRadius: 30 }} />
      <div style={{ position: "absolute", left: 480, top: 260, width: 170, height: 50, backgroundColor: "#ffffff", borderRadius: 25, opacity: 0.9 }} />
      <div style={{ position: "absolute", left: 620, top: 380, width: 150, height: 46, backgroundColor: "#ffffff", borderRadius: 23, opacity: 0.85 }} />
      <div style={{ position: "absolute", left: 120, top: 520, width: 160, height: 48, backgroundColor: "#ffffff", borderRadius: 24, opacity: 0.8 }} />
      {/* birds */}
      <div style={{ position: "absolute", left: 420, top: 200, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 48, color: "#3d5a80" }}>⌄ ⌄</div>
      {/* crater rim hills: low ridges with tree silhouettes */}
      <div style={{ position: "absolute", left: -220, top: 820, width: 700, height: 260, backgroundColor: "#4e9d5e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 600, top: 860, width: 700, height: 260, backgroundColor: "#3f8a52", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 200, top: 900, width: 680, height: 220, backgroundColor: "#2e7a44", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 120, top: 780, width: 80, height: 80, backgroundColor: "#2e7a44", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 760, top: 820, width: 70, height: 70, backgroundColor: "#2e7a44", borderRadius: "50%" }} />
      {/* small stream trickling down into the lake, far left on the hill */}
      <div style={{ position: "absolute", left: 90, top: 840, width: 34, height: 180, backgroundColor: "#b8e4f8", borderRadius: 17, transform: "rotate(5deg)" }} />
      {/* gentle waves + sparkles on the calm lake */}
      <div style={{ position: "absolute", left: 420, top: 1120, width: 150, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: 700, top: 1200, width: 120, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.6 }} />
      <div style={{ position: "absolute", left: 180, top: 1260, width: 170, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.65 }} />
      <div style={{ position: "absolute", left: 560, top: 1320, width: 110, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.5 }} />
      {/* shore: grass + sand with rocks, footprints, flowers */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 500, backgroundColor: "#e8d5a0" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 380, height: 120, backgroundColor: "#4e9d5e" }} />
      <div style={{ position: "absolute", left: 700, top: 1400, width: 60, height: 60, backgroundColor: "#3e7d4e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 920, top: 1420, width: 70, height: 66, backgroundColor: "#3e7d4e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 720, top: 1380, width: 24, height: 24, backgroundColor: "#ff8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 950, top: 1400, width: 24, height: 24, backgroundColor: "#ffe14d", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 700, top: 1620, width: 90, height: 60, backgroundColor: "#9a9a9a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 790, top: 1640, width: 60, height: 40, backgroundColor: "#7a7a7a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 480, top: 1700, width: 34, height: 22, backgroundColor: "#c9b18a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 540, top: 1760, width: 34, height: 22, backgroundColor: "#c9b18a", borderRadius: "50%" }} />
      {/* guide at the shore, relieved smile (smaller, off-center) */}
      <Person x={150} y={780} scale={0.75} kind="guide" pose="smile" eye="dot" mouth="smirk" local={local} />
    </AbsoluteFill>
  );
};

/* S6 (L8): green Samosir island in the middle of the lake */
const Scene6: React.FC<{ local: number }> = ({ local }) => {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #6ec1f0 0%, #a8dcf7 40%, #2a7fd8 52%, #4aa8e0 100%)" }}>
      {/* sun + clouds */}
      <div style={{ position: "absolute", left: 120, top: 90, width: 320, height: 320, background: "radial-gradient(circle, rgba(255,217,122,0.75) 0%, rgba(255,217,122,0) 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 190, top: 150, width: 170, height: 170, backgroundColor: "#ffd97a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 620, top: 180, width: 210, height: 58, backgroundColor: "#ffffff", borderRadius: 29 }} />
      <div style={{ position: "absolute", left: 700, top: 150, width: 140, height: 48, backgroundColor: "#ffffff", borderRadius: 24 }} />
      {/* birds */}
      <div style={{ position: "absolute", left: 480, top: 280, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 48, color: "#3d5a80" }}>⌄ ⌄</div>
      {/* Samosir island: wide green island with hills, beach rim at the waterline */}
      <div style={{ position: "absolute", left: 330, top: 620, width: 750, height: 360, backgroundColor: "#3f8a52", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 450, top: 520, width: 500, height: 280, backgroundColor: "#4e9d5e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 560, top: 460, width: 300, height: 180, backgroundColor: "#57a86a", borderRadius: "50%" }} />
      {/* sand beach rim where the island meets the water */}
      <div style={{ position: "absolute", left: 360, top: 900, width: 700, height: 90, backgroundColor: "#e8d5a0", borderRadius: "50%" }} />
      {/* trees on the island (trunk below canopy, rooted on the island) */}
      <div style={{ position: "absolute", left: 470, top: 620, width: 120, height: 120, backgroundColor: "#2e7a44", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 520, top: 720, width: 16, height: 70, backgroundColor: "#5d4023" }} />
      <div style={{ position: "absolute", left: 880, top: 660, width: 110, height: 110, backgroundColor: "#2e7a44", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 925, top: 750, width: 16, height: 60, backgroundColor: "#5d4023" }} />
      {/* small houses on the island, right side, clear of the guide */}
      <div style={{ position: "absolute", left: 700, top: 760, width: 90, height: 70, backgroundColor: "#e8d5a0", border: "4px solid #7a5a34" }} />
      <div style={{ position: "absolute", left: 690, top: 720, width: 110, height: 46, backgroundColor: "#c0392b", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", left: 830, top: 780, width: 80, height: 60, backgroundColor: "#fdf6e3", border: "4px solid #7a5a34" }} />
      <div style={{ position: "absolute", left: 822, top: 744, width: 96, height: 42, backgroundColor: "#8e3a3a", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      {/* lake waves around the island */}
      <div style={{ position: "absolute", left: 120, top: 1080, width: 150, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: 780, top: 1120, width: 160, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.65 }} />
      <div style={{ position: "absolute", left: 300, top: 1240, width: 120, height: 10, backgroundColor: "#ffffff", borderRadius: 5, opacity: 0.5 }} />
      {/* boat on the lake */}
      <div style={{ position: "absolute", left: 700, top: 1200, width: 180, height: 40, backgroundColor: "#7a4a2b", borderRadius: "0 0 50px 50px", border: "4px solid #4a2c1e" }} />
      <div style={{ position: "absolute", left: 760, top: 1140, width: 70, height: 60, backgroundColor: "#fdf6e3", borderRadius: "35px 35px 0 0", border: "4px solid #b9a68e" }} />
      {/* foreground shore */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 480, backgroundColor: "#e8d5a0" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 360, height: 120, backgroundColor: "#4e9d5e" }} />
      {/* bushes + flowers + rocks + footprints on the foreground sand */}
      <div style={{ position: "absolute", left: 880, top: 1400, width: 140, height: 90, backgroundColor: "#3e7d4e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 910, top: 1380, width: 24, height: 24, backgroundColor: "#ff8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 90, top: 1440, width: 120, height: 80, backgroundColor: "#3e7d4e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 600, top: 1620, width: 90, height: 60, backgroundColor: "#9a9a9a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 690, top: 1640, width: 60, height: 40, backgroundColor: "#7a7a7a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 420, top: 1700, width: 34, height: 22, backgroundColor: "#c9b18a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 480, top: 1760, width: 34, height: 22, backgroundColor: "#c9b18a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 540, top: 1820, width: 34, height: 22, backgroundColor: "#c9b18a", borderRadius: "50%" }} />
      {/* guide on the shore, pointing at the island (smaller, off to the left) */}
      <Person x={90} y={780} scale={0.75} kind="guide" pose="point" eye="dot" mouth="smirk" local={local} />
    </AbsoluteFill>
  );
};

/* S7 (L9): Batak village, traditional houses with curved roofs, villagers */
const Scene7: React.FC<{ local: number }> = ({ local }) => {
  // One Batak traditional house (rumah adat): curved saddle roof with
  // horn tips, wooden plank walls, stilts, stairs.
  const House: React.FC<{ x: number; y: number; scale: number; roof: string; wall: string }> = ({ x, y, scale, roof, wall }) => (
    <div style={{ position: "absolute", left: x, top: y, width: 360, height: 520, transform: `scale(${scale})`, transformOrigin: "top left" }}>
      {/* stilts */}
      <div style={{ position: "absolute", left: 40, top: 380, width: 22, height: 140, backgroundColor: "#5d4023" }} />
      <div style={{ position: "absolute", left: 300, top: 380, width: 22, height: 140, backgroundColor: "#5d4023" }} />
      {/* stairs */}
      <div style={{ position: "absolute", left: 140, top: 440, width: 90, height: 26, backgroundColor: "#7a5a34" }} />
      <div style={{ position: "absolute", left: 150, top: 470, width: 70, height: 26, backgroundColor: "#7a5a34" }} />
      <div style={{ position: "absolute", left: 160, top: 500, width: 50, height: 20, backgroundColor: "#7a5a34" }} />
      {/* wooden plank walls */}
      <div style={{ position: "absolute", left: 30, top: 220, width: 300, height: 170, backgroundColor: wall, border: "6px solid #5d4023", borderRadius: 6 }}>
        {[0, 1, 2, 3, 4].map((k) => (
          <div key={k} style={{ position: "absolute", left: 50 + k * 52, top: 0, width: 5, height: 158, backgroundColor: "#5d4023", opacity: 0.55 }} />
        ))}
        {/* door + window */}
        <div style={{ position: "absolute", left: 125, top: 60, width: 54, height: 100, backgroundColor: "#3a2c22", border: "4px solid #5d4023", borderRadius: 4 }} />
        <div style={{ position: "absolute", left: 30, top: 40, width: 56, height: 56, backgroundColor: "#9ecfec", border: "4px solid #5d4023", borderRadius: 4 }} />
        <div style={{ position: "absolute", left: 220, top: 40, width: 56, height: 56, backgroundColor: "#9ecfec", border: "4px solid #5d4023", borderRadius: 4 }} />
      </div>
      {/* curved saddle roof with horn tips */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 60,
          width: 360,
          height: 180,
          backgroundColor: roof,
          clipPath: "polygon(0 100%, 6% 22%, 50% 0, 94% 22%, 100% 100%)",
        }}
      />
      {/* upturned horn tips: triangles, not circles */}
      <div style={{ position: "absolute", left: -8, top: 40, width: 56, height: 70, backgroundColor: roof, clipPath: "polygon(0 0, 100% 100%, 20% 100%)" }} />
      <div style={{ position: "absolute", left: 312, top: 40, width: 56, height: 70, backgroundColor: roof, clipPath: "polygon(100% 0, 0 100%, 80% 100%)" }} />
      {/* roof ridge decoration */}
      <div style={{ position: "absolute", left: 150, top: 40, width: 60, height: 22, backgroundColor: "#ffd97a", borderRadius: 11 }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #6ec1f0 0%, #a8dcf7 38%, #7a9a6a 55%, #8a7a52 100%)" }}>
      {/* sun + clouds */}
      <div style={{ position: "absolute", left: 830, top: 90, width: 280, height: 280, background: "radial-gradient(circle, rgba(255,217,122,0.75) 0%, rgba(255,217,122,0) 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 890, top: 140, width: 150, height: 150, backgroundColor: "#ffd97a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 90, top: 150, width: 200, height: 56, backgroundColor: "#ffffff", borderRadius: 28 }} />
      {/* birds */}
      <div style={{ position: "absolute", left: 420, top: 260, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 44, color: "#3d5a80" }}>⌄ ⌄</div>
      {/* mountains behind the village */}
      <div style={{ position: "absolute", left: -160, top: 420, width: 700, height: 380, backgroundColor: "#5d7a52", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 500, top: 460, width: 760, height: 360, backgroundColor: "#4e6b44", borderRadius: "50%" }} />
      {/* the village houses */}
      <House x={80} y={560} scale={0.95} roof="#3a2c22" wall="#c9a06a" />
      <House x={600} y={600} scale={0.85} roof="#4a3a2c" wall="#b98d5f" />
      {/* stone wall + dirt path */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 420, backgroundColor: "#b09a6a" }} />
      <div style={{ position: "absolute", left: 380, top: 1240, width: 320, height: 680, backgroundColor: "#c9a06a" }} />
      <div style={{ position: "absolute", left: 420, top: 1300, width: 26, height: 26, backgroundColor: "#9a9a9a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 620, top: 1450, width: 30, height: 30, backgroundColor: "#8a8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 480, top: 1600, width: 24, height: 24, backgroundColor: "#9a9a9a", borderRadius: "50%" }} />
      {/* fence + plants + flowers */}
      <div style={{ position: "absolute", left: 60, top: 1150, width: 220, height: 14, backgroundColor: "#7a5a34" }} />
      {[0, 1, 2, 3, 4].map((k) => (
        <div key={k} style={{ position: "absolute", left: 70 + k * 48, top: 1110, width: 12, height: 60, backgroundColor: "#7a5a34" }} />
      ))}
      <div style={{ position: "absolute", left: 820, top: 1180, width: 120, height: 80, backgroundColor: "#3e7d4e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 850, top: 1160, width: 22, height: 22, backgroundColor: "#ff8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 890, top: 1180, width: 20, height: 20, backgroundColor: "#ffe14d", borderRadius: "50%" }} />
      {/* grass tufts + rocks + flowers on the village ground */}
      <div style={{ position: "absolute", left: 120, top: 1620, width: 70, height: 44, backgroundColor: "#6b8a52", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 240, top: 1700, width: 60, height: 40, backgroundColor: "#6b8a52", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 940, top: 1660, width: 70, height: 44, backgroundColor: "#6b8a52", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 900, top: 1760, width: 80, height: 54, backgroundColor: "#8a8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 160, top: 1780, width: 70, height: 48, backgroundColor: "#8a8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 300, top: 1600, width: 22, height: 22, backgroundColor: "#ff8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 980, top: 1580, width: 22, height: 22, backgroundColor: "#ffe14d", borderRadius: "50%" }} />
      {/* a chicken pecking near the path */}
      <div style={{ position: "absolute", left: 700, top: 1500, width: 56, height: 40, backgroundColor: "#ffffff", border: "4px solid #141414", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 744, top: 1490, width: 26, height: 26, backgroundColor: "#ffffff", border: "4px solid #141414", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 748, top: 1482, width: 16, height: 12, backgroundColor: "#e74c3c", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 716, top: 1540, width: 6, height: 22, backgroundColor: "#e8a34a" }} />
      <div style={{ position: "absolute", left: 736, top: 1540, width: 6, height: 22, backgroundColor: "#e8a34a" }} />
      {/* guide + old man in front of the houses */}
      <Person x={180} y={780} scale={0.85} kind="guide" pose="smile" eye="dot" mouth="smirk" local={local} />
      <Person x={620} y={800} scale={0.85} kind="elder" shirt="#2b2b2b" sarong pose="point" eye="dot" mouth="line" local={local} />
    </AbsoluteFill>
  );
};

/* S8 (L10): sunset over the lake, small boat */
const Scene8: React.FC<{ local: number }> = ({ local }) => {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #ffb347 0%, #ff7b6b 40%, #b85a8a 62%, #2a5a8a 100%)" }}>
      {/* big low sun with glow */}
      <div style={{ position: "absolute", left: 290, top: 420, width: 500, height: 500, background: "radial-gradient(circle, rgba(255,157,69,0.8) 0%, rgba(255,157,69,0) 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 390, top: 540, width: 300, height: 300, backgroundColor: "#ff9d45", borderRadius: "50%" }} />
      {/* clouds tinted pink */}
      <div style={{ position: "absolute", left: 80, top: 240, width: 220, height: 56, backgroundColor: "#ffc9b0", borderRadius: 28, opacity: 0.9 }} />
      <div style={{ position: "absolute", left: 700, top: 180, width: 190, height: 50, backgroundColor: "#ffc9b0", borderRadius: 25, opacity: 0.85 }} />
      {/* birds */}
      <div style={{ position: "absolute", left: 200, top: 320, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 50, color: "#5d3a4a" }}>⌄ ⌄</div>
      <div style={{ position: "absolute", left: 820, top: 280, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 42, color: "#5d3a4a" }}>⌄</div>
      {/* hills silhouettes */}
      <div style={{ position: "absolute", left: -200, top: 780, width: 800, height: 340, backgroundColor: "#7a4a5e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 480, top: 820, width: 800, height: 320, backgroundColor: "#6b3f52", borderRadius: "50%" }} />
      {/* lake with orange reflection streaks under the sun */}
      <div style={{ position: "absolute", left: 470, top: 1020, width: 140, height: 14, backgroundColor: "#ff9d45", borderRadius: 7, opacity: 0.75, boxShadow: "0 0 20px #ff9d45" }} />
      <div style={{ position: "absolute", left: 450, top: 1090, width: 180, height: 14, backgroundColor: "#ff9d45", borderRadius: 7, opacity: 0.7, boxShadow: "0 0 20px #ff9d45" }} />
      <div style={{ position: "absolute", left: 470, top: 1160, width: 140, height: 14, backgroundColor: "#ff9d45", borderRadius: 7, opacity: 0.65 }} />
      <div style={{ position: "absolute", left: 490, top: 1230, width: 100, height: 12, backgroundColor: "#ff9d45", borderRadius: 6, opacity: 0.6 }} />
      <div style={{ position: "absolute", left: 140, top: 1180, width: 150, height: 10, backgroundColor: "#ffc9b0", borderRadius: 5, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: 760, top: 1240, width: 170, height: 10, backgroundColor: "#ffc9b0", borderRadius: 5, opacity: 0.6 }} />
      <div style={{ position: "absolute", left: 340, top: 1300, width: 120, height: 10, backgroundColor: "#ffc9b0", borderRadius: 5, opacity: 0.5 }} />
      {/* small boat with a seated figure on the lake */}
      <div style={{ position: "absolute", left: 620, top: 1080, width: 190, height: 42, backgroundColor: "#3a2c22", borderRadius: "0 0 55px 55px" }} />
      <div style={{ position: "absolute", left: 682, top: 1040, width: 76, height: 46, backgroundColor: "#e8e8e8", border: "4px solid #141414", borderRadius: "20px 20px 0 0" }} />
      <div style={{ position: "absolute", left: 695, top: 995, width: 50, height: 50, backgroundColor: "#fdf8f2", border: "4px solid #141414", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 695, top: 988, width: 50, height: 26, backgroundColor: "#141414", borderRadius: "25px 25px 0 0" }} />
      {/* shore: sand + grass */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 460, backgroundColor: "#c9a06a" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 340, height: 120, backgroundColor: "#4e7a4e" }} />
      {/* grass tufts + flowers + rocks + footprints on the sand */}
      <div style={{ position: "absolute", left: 100, top: 1420, width: 60, height: 70, backgroundColor: "#3e7d4e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 900, top: 1440, width: 60, height: 70, backgroundColor: "#3e7d4e", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 120, top: 1400, width: 22, height: 22, backgroundColor: "#ff8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 300, top: 1620, width: 90, height: 60, backgroundColor: "#8a8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 700, top: 1680, width: 80, height: 54, backgroundColor: "#8a8a8a", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 480, top: 1700, width: 34, height: 22, backgroundColor: "#a08050", borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 540, top: 1760, width: 34, height: 22, backgroundColor: "#a08050", borderRadius: "50%" }} />
      {/* guide at the shore, watching the sunset, relaxed */}
      <Person x={160} y={700} scale={0.95} kind="guide" pose="smile" eye="dot" mouth="smirk" local={local} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene is derived from the karaoke line ONLY.                        */
/* ------------------------------------------------------------------ */

const SCENE_LINES: number[][] = [[1, 2], [3], [4, 5], [6], [7], [8], [9], [10]];
const SCENES: React.FC<{ local: number }>[] = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8];

const lineToScene = (line: number): number => {
  if (line <= 2) return 0;
  if (line === 3) return 1;
  if (line <= 5) return 2;
  if (line === 6) return 3;
  if (line === 7) return 4;
  if (line === 8) return 5;
  if (line === 9) return 6;
  return 7;
};

const sceneSpan = (scene: number): [number, number] => {
  const lines = SCENE_LINES[scene];
  const ps = KARAOKE.filter((p) => lines.includes(p.line));
  return [ps[0].startFrame, ps[ps.length - 1].endFrame];
};

export const TobaTest: React.FC = () => {
  const frame = useCurrentFrame();
  // Current phrase (if any); in gaps, use the NEXT phrase's line so the
  // hard cut lands when the next line starts.
  const phrase = KARAOKE.find((p) => frame >= p.startFrame && frame < p.endFrame);
  let line: number;
  if (phrase) {
    line = phrase.line;
  } else if (frame < KARAOKE[0].startFrame) {
    line = 1;
  } else {
    const next = KARAOKE.find((p) => p.startFrame > frame);
    line = next ? next.line : 10;
  }
  const scene = lineToScene(line);
  const [sStart, sEnd] = sceneSpan(scene);
  const local = Math.max(0, Math.min(frame - sStart, sEnd - sStart));
  const len = Math.max(1, sEnd - sStart);
  // Very slow zoom-in, tiny pan, over the whole scene.
  const zoom = interpolate(local, [0, len], [1, 1.02]);
  const panX = interpolate(local, [0, len], [0, -6]);
  const panY = interpolate(local, [0, len], [0, -4]);
  const Scene = SCENES[scene];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}>
        <Scene local={local} />
      </div>
      {phrase && <KaraokeText phrase={phrase.phrase} />}
    </AbsoluteFill>
  );
};

export const TOBA_TEST_FRAMES = TOTAL_FRAMES;
export const TOBA_TEST_SIZE = { width: W, height: H };
