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
 * VideoChibi — "Selanjutnya, Kamu Mau Jadi Apa?"
 * 60 detik, vertikal 9:16 (1080x1920), 30 fps, 1800 frame.
 *
 * GAYA (disetujui bill 2026-11-24): CHIBI EXPLAINER ala Ardio
 * (@ardio.animasi, TikTok "Desa Ninja Versi Indonesia") — bukan kartun
 * padat lama, bukan editorial gelap. Karakter chibi: kepala besar, mata
 * besar, garis tepi tebal, warna datar cerah. Satu ilustrasi besar per
 * segmen, ditahan lama, gerakan kecil saja (bob pelan, push-in lambat,
 * drift). Latar sederhana dan lapang. Satu gagasan per layar, info lewat
 * label pil kata kunci (huruf kapital tebal), bukan teks panjang.
 * Judul besar di atas, karakter di tengah, label di bawah.
 *
 * STRUKTUR (dipakai dari FINAL_STORYBOARD.md): 6 adegan + timecode,
 * VO baru 6 kalimat pendek (belum dibuat — tahap ini berhenti sebelum
 * VO). Adegan 6: montage 5 adegan (50-53), satu orang diam (53-58,
 * TANPA narasi), layar hitam 58-60 dengan teks akhir
 * "Selanjutnya, kamu mau jadi apa?".
 * Zona aman bawah 400px dijaga untuk caption & tombol TikTok.
 *
 * Gambar dasar: chibi-images/scene1-6.png (1152x2048), disalin ke
 * public/chibi/ dan dimuat via staticFile. Tidak ada teks terbaca di
 * dalam gambar; semua teks ditambahkan di sini sebagai teks bersih.
 */

const W = 1080;
const H = 1920;
const SCENE = 300;

type SceneDef = {
  src: string;
  color: string;
  title: string;
  pills: string[];
  /** Y posisi label pil — per adegan, dipilih dari celah kosong di gambar
   *  agar pil TIDAK pernah menutupi wajah/tangan karakter. */
  pillY: number;
};

const SCENES: SceneDef[] = [
  {
    src: "chibi/scene1.png",
    color: "#5B8DBF",
    title: "REALITAS KEHIDUPAN",
    pills: ["JALAN BERLUBANG", "DOMPET TIPIS"],
    pillY: 1500,
  },
  {
    src: "chibi/scene2.png",
    color: "#E86A1F",
    title: "HARAPAN DISUARAKAN",
    pills: ["JANJI", "HARAPAN"],
    pillY: 1140,
  },
  {
    src: "chibi/scene3.png",
    color: "#8A8A8A",
    title: "KENYATAAN TERTINGGAL",
    pills: ["PROYEK MANGKRAK"],
    pillY: 1200,
  },
  {
    src: "chibi/scene4.png",
    color: "#7A5A3A",
    title: "DI BALIK ANGKA",
    pills: ["ANGGARAN BOCOR"],
    pillY: 1600,
  },
  {
    src: "chibi/scene5.png",
    color: "#C9A86A",
    title: "MENUNGGU PROSEDUR",
    pills: ["ANTRE", "CAP"],
    pillY: 1120,
  },
  {
    src: "chibi/scene6.png",
    color: "#8E6BBF",
    title: "PERTANYAAN",
    pills: [],
    pillY: 0,
  },
];

/** Satu ilustrasi besar, gerakan kecil saja: zoom pelan + bob lembut. */
const ChibiScene: React.FC<{ scene: SceneDef; duration?: number }> = ({
  scene,
  duration = SCENE,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, duration], [0, 1], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(p, [0, 1], [1.06, 1.13]);
  // Bob lembut: naik-turun 6px, satu siklus per ~2 detik.
  const bob = Math.sin((frame / 30) * Math.PI) * 6;
  const opacity = interpolate(
    frame,
    [0, 15, duration - 15, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#111111" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity,
          transform: `translateY(${bob}px) scale(${scale})`,
        }}
      >
        <Img
          src={staticFile(scene.src)}
          style={{ width: W, height: H, objectFit: "cover" }}
        />
      </div>

      {/* Judul besar di atas */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: scene.color,
            color: "#FFFFFF",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 58,
            fontWeight: 900,
            letterSpacing: 2,
            lineHeight: 1.15,
            padding: "18px 34px",
            borderRadius: 18,
            boxShadow: "0 6px 0 rgba(0,0,0,0.25)",
          }}
        >
          {scene.title}
        </div>
      </div>

      {/* Label pil kata kunci di bawah karakter */}
      {scene.pills.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: scene.pillY,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: 18,
            padding: "0 40px",
          }}
        >
          {scene.pills.map((pill) => (
            <div
              key={pill}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#1A1A1A",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: 1,
                padding: "16px 30px",
                borderRadius: 999,
                border: "4px solid #1A1A1A",
                boxShadow: "0 4px 0 rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Teks akhir di layar hitam: fade-in pelan, huruf sans tebal. */
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
          color: "#FFFFFF",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 76,
          fontWeight: 900,
          lineHeight: 1.3,
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
  "chibi/scene1.png",
  "chibi/scene2.png",
  "chibi/scene3.png",
  "chibi/scene4.png",
  "chibi/scene5.png",
];

export const VideoChibi: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Adegan 1-5: satu ilustrasi besar per segmen */}
      {SCENES.slice(0, 5).map((scene, i) => (
        <Sequence key={scene.src} from={i * SCENE} durationInFrames={SCENE}>
          <ChibiScene scene={scene} />
        </Sequence>
      ))}

      {/* Adegan 6a — Montage 5 adegan sebelumnya (50-53 dtk): 18 frame per gambar */}
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

      {/* Adegan 6b — Satu orang diam di tengah kerumunan (53-58 dtk) */}
      <Sequence from={1590} durationInFrames={150}>
        <ChibiScene scene={SCENES[5]} duration={150} />
      </Sequence>

      {/* Adegan 6c — Layar hitam + teks akhir (58-60 dtk) */}
      <Sequence from={1740} durationInFrames={60}>
        <FinalText />
      </Sequence>
    </AbsoluteFill>
  );
};
