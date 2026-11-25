import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

/**
 * VideoFinal — "Selanjutnya, Kamu Mau Jadi Apa?"
 * 60 detik, vertikal 9:16 (1080x1920), 30 fps, 1800 frame.
 *
 * GAYA (koreksi bill 2026-11-24): TETAP KARTUN — tokoh berkepala bulat,
 * warna cerah, playful, padat, latar penuh, seperti VideoKetiga.
 * Gaya dark editorial paper collage dari FINAL_STORYBOARD.md TIDAK dipakai.
 *
 * STRUKTUR (dipakai dari FINAL_STORYBOARD.md):
 * - 6 adegan + timecode: 1 realitas kehidupan (0-10), 2 harapan (10-20),
 *   3 proyek tertinggal (20-30), 4 di balik angka (30-40),
 *   5 menunggu prosedur (40-50), 6 pertanyaan penutup (50-60).
 * - VO baru 6 kalimat pendek, tenang reflektif (belum dibuat — tahap ini
 *   berhenti sebelum VO). 50-58 detik TANPA narasi.
 * - Adegan 6: montage 5 adegan sebelumnya (50-53, potongan cepat),
 *   lalu satu orang diam di tengah kerumunan (53-58, slow push-in),
 *   lalu layar hitam 58-60 dengan teks akhir "Selanjutnya, kamu mau jadi apa?"
 * - Transisi: dissolve lembut antar adegan (simulasi dari transisi yang
 *   tertulis di storyboard: suara berubah, match cut papan->dokumen,
 *   dokumen menutup frame->meja loket, suara antrean berhenti).
 * - Gerak: tenang dan terkendali (slow push-in, lateral tracking, 2.5D
 *   parallax disimulasikan lewat Ken Burns: zoom + pan pelan per adegan).
 *   Tidak ada teks di layar kecuali teks akhir di layar hitam.
 *   Zona aman bawah 400px dijaga: teks akhir dipusatkan di tengah layar.
 *
 * Gambar dasar: kartun cerah, digenerate konsisten (final-images/scene1-6.png),
 * disalin ke public/final/ dan dimuat via staticFile.
 */

const W = 1080;
const H = 1920;
const SCENE = 300;

type KenBurnsProps = {
  src: string;
  fromScale: number;
  toScale: number;
  fromX: number;
  toX: number;
  fromY?: number;
  toY?: number;
  duration?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
};

/** Ken Burns pelan: zoom + pan dengan easing in-out, plus fade masuk/keluar. */
const KenBurns: React.FC<KenBurnsProps> = ({
  src,
  fromScale,
  toScale,
  fromX,
  toX,
  fromY = 0,
  toY = 0,
  duration = SCENE,
  fadeIn = true,
  fadeOut = true,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, duration], [0, 1], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(p, [0, 1], [fromScale, toScale]);
  const x = interpolate(p, [0, 1], [fromX, toX]);
  const y = interpolate(p, [0, 1], [fromY, toY]);

  let opacity = 1;
  if (fadeIn && fadeOut) {
    opacity = interpolate(
      frame,
      [0, 15, duration - 15, duration],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  } else if (fadeIn) {
    opacity = interpolate(frame, [0, 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (fadeOut) {
    opacity = interpolate(frame, [duration - 15, duration], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#1a1a1a" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: W,
          height: H,
          objectFit: "cover",
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};

/** Teks akhir di layar hitam: fade-in pelan, dipusatkan di tengah layar. */
const FinalText: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 30], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          textAlign: "center",
          color: "#F5F1E8",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.35,
          padding: "0 80px",
        }}
      >
        Selanjutnya,
        <br />
        kamu mau jadi apa?
      </div>
    </AbsoluteFill>
  );
};

const MONTAGE = [
  "final/scene1.png",
  "final/scene2.png",
  "final/scene3.png",
  "final/scene4.png",
  "final/scene5.png",
];

export const VideoFinal: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Adegan 1 — Realitas kehidupan (0-10 dtk): slow push-in */}
      <Sequence from={0} durationInFrames={SCENE}>
        <KenBurns
          src="final/scene1.png"
          fromScale={1.14}
          toScale={1.02}
          fromX={20}
          toX={-20}
        />
      </Sequence>

      {/* Adegan 2 — Harapan yang disuarakan (10-20 dtk): dolly-in */}
      <Sequence from={300} durationInFrames={SCENE}>
        <KenBurns
          src="final/scene2.png"
          fromScale={1.06}
          toScale={1.18}
          fromX={0}
          toX={0}
        />
      </Sequence>

      {/* Adegan 3 — Kenyataan yang tertinggal (20-30 dtk): lateral tracking */}
      <Sequence from={600} durationInFrames={SCENE}>
        <KenBurns
          src="final/scene3.png"
          fromScale={1.12}
          toScale={1.12}
          fromX={60}
          toX={-60}
        />
      </Sequence>

      {/* Adegan 4 — Di balik angka (30-40 dtk): top-down push-in */}
      <Sequence from={900} durationInFrames={SCENE}>
        <KenBurns
          src="final/scene4.png"
          fromScale={1.16}
          toScale={1.02}
          fromX={0}
          toX={0}
          fromY={20}
          toY={-10}
        />
      </Sequence>

      {/* Adegan 5 — Menunggu di antara prosedur (40-50 dtk): lateral */}
      <Sequence from={1200} durationInFrames={SCENE}>
        <KenBurns
          src="final/scene5.png"
          fromScale={1.12}
          toScale={1.12}
          fromX={-50}
          toX={50}
        />
      </Sequence>

      {/* Adegan 6a — Montage 5 adegan sebelumnya (50-53 dtk): potongan cepat 18f */}
      <Sequence from={1500} durationInFrames={90}>
        {MONTAGE.map((src, i) => (
          <Sequence key={src} from={i * 18} durationInFrames={18}>
            <AbsoluteFill style={{ overflow: "hidden" }}>
              <Img
                src={staticFile(src)}
                style={{
                  width: W,
                  height: H,
                  objectFit: "cover",
                  transform: "scale(1.12)",
                }}
              />
            </AbsoluteFill>
          </Sequence>
        ))}
      </Sequence>

      {/* Adegan 6b — Satu orang diam di tengah kerumunan (53-58 dtk): slow push-in */}
      <Sequence from={1590} durationInFrames={150}>
        <KenBurns
          src="final/scene6.png"
          fromScale={1.05}
          toScale={1.16}
          fromX={0}
          toX={0}
          duration={150}
        />
      </Sequence>

      {/* Adegan 6c — Layar hitam + teks akhir (58-60 dtk) */}
      <Sequence from={1740} durationInFrames={60}>
        <FinalText />
      </Sequence>
    </AbsoluteFill>
  );
};
