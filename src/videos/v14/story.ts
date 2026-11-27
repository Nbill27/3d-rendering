// story.ts — SHOT PLAN Video14 Peshtigo Fire (History Rush #5).
// Satu adegan per baris VO (10 adegan, hard cut), 3 beat, 2 lokasi
// (Peshtigo + Sungai Peshtigo; Chicago hanya visual koran/peta).
// Timing adegan = onset frame tiap baris VO (timings.json, TERUKUR).
// Naskah VO TIDAK BOLEH diubah (SCRIPT.md, 164 kata, 10 baris).
// Angka korban selalu rentang "1,200–2,500"; pemicu api TIDAK diketahui.

export type Shot = {
  scene: number;
  line: number;
  startFrame: number;
  endFrame: number;
  beat: 1 | 2 | 3;
  location: "Peshtigo" | "Peshtigo River" | "Map" | "Newspaper";
  shot: string;
  camera: string;
  keyAction: string;
};

export const TOTAL_FRAMES = 1800;
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SHOTS: Shot[] = [
  { scene: 1, line: 1, startFrame: 5, endFrame: 163, beat: 1, location: "Peshtigo", shot: "Wide dusk, kota terbakar di kejauhan", camera: "Slow push-in, fov 46", keyAction: "Hook: dua warga menunjuk ke arah api; asap + bara beterbangan" },
  { scene: 2, line: 2, startFrame: 173, endFrame: 318, beat: 1, location: "Peshtigo", shot: "Jalan kota kayu, siang kering", camera: "MS, slow push-in", keyAction: "Label 'October 8, 1871, Peshtigo, Wisconsin'; warga berjalan; tumpukan kayu + serbuk gergaji" },
  { scene: 3, line: 3, startFrame: 330, endFrame: 539, beat: 1, location: "Peshtigo", shot: "Close-up jalan serpihan kayu", camera: "Low MS, slow push-in", keyAction: "Api kecil flicker di sela kayu; pinus kering sway; serbuk gergaji" },
  { scene: 4, line: 4, startFrame: 540, endFrame: 681, beat: 1, location: "Peshtigo", shot: "Angin datang, senja merah", camera: "MS, slight shake-in", keyAction: "Pinus membungkuk, serpihan beterbangan, api kecil membesar, kolom asap naik cepat" },
  { scene: 5, line: 5, startFrame: 700, endFrame: 847, beat: 2, location: "Peshtigo", shot: "Firestorm: tornado api di tengah kota", camera: "Wide, shake 0.06", keyAction: "Corong api berputar makin cepat; atap beterbangan; warga lari" },
  { scene: 6, line: 6, startFrame: 857, endFrame: 1024, beat: 2, location: "Peshtigo River", shot: "Sungai malam, warga berdiri di air", camera: "MS, slow push-in", keyAction: "3 warga bahu di atas air; perahu + puing hanyut; api di tepi seberang" },
  { scene: 7, line: 7, startFrame: 1029, endFrame: 1197, beat: 2, location: "Peshtigo", shot: "Kota hangus, fajar kelabu", camera: "Wide, slow push-in", keyAction: "Angka '1,200–2,500 PEOPLE DIED' di layar; kerangka hangus + cerobong sisa" },
  { scene: 8, line: 8, startFrame: 1207, endFrame: 1277, beat: 2, location: "Peshtigo", shot: "Foto asli 1871 + satu warga", camera: "Static, foto miring -1.5deg", keyAction: "Frame Harper's Weekly 25 Nov 1871 (domain publik); warga menatap" },
  { scene: 9, line: 9, startFrame: 1291, endFrame: 1511, beat: 3, location: "Map", shot: "Peta kartun Peshtigo vs Chicago", camera: "Static, overlay DOM", keyAction: "Garis putus-putus 250 MILES; dua titik api; 'THE SAME NIGHT'" },
  { scene: 10, line: 10, startFrame: 1535, endFrame: 1693, beat: 3, location: "Newspaper", shot: "Koran Chicago + kotak Peshtigo", camera: "Static, overlay DOM", keyAction: "Headline 'CHICAGO IN FLAMES'; kotak merah Peshtigo 1,200–2,500; twist penutup" },
];

/** Adegan aktif pada frame f (di luar rentang VO: tahan adegan terakhir). */
export const shotAt = (f: number): Shot => {
  const s = SHOTS.find((x) => f >= x.startFrame && f <= x.endFrame);
  if (s) return s;
  if (f < SHOTS[0].startFrame) return SHOTS[0];
  return SHOTS[SHOTS.length - 1];
};
