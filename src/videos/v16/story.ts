// story.ts — SHOT PLAN Video16 Wojtek (History Rush #7).
// Satu adegan per baris VO (9 adegan, hard cut), 3 beat, 3 lokasi
// (Iran 1942 -> Monte Cassino 1944 -> Edinburgh Zoo 1947-1963).
// Timing adegan = onset frame tiap baris VO (karaoke.ts, TERUKUR
// WhisperX Tahap 7, 27 Nov 2026 — L1 0.00-6.19, L2 6.44-13.68,
// L3 13.93-18.05, L4 18.65-26.35, L5 26.60-34.42, L6 34.67-40.08,
// L7 40.68-47.78, L8 48.03-54.34, L9 55.04-59.63).
// MAP_A/MAP_B = 570-660 (90 frame, di dalam L4 terukur, 560-791).
// PHOTO_A = 1680 (di dalam L9 terukur, 1651-1789).
// Tabel SHOTS di bawah ini menyimpan frame rencana awal (provisional)
// dan TIDAK dipakai komposisi (inert — adegan diturunkan dari karaoke
// line saja); jangan jadikan acuan timing.
// Naskah VO TIDAK BOLEH diubah (SCRIPT.md,
// 160 kata, 9 baris). Cerita membawa peti Monte Cassino dipakai versi
// IPN + lambang unit (lihat RESEARCH.md — diperdebatkan satu memoar
// veteran; tidak ada dialog/quote karangan di naskah).

export type Shot = {
  scene: number;
  line: number;
  startFrame: number;
  endFrame: number;
  beat: 1 | 2 | 3;
  location: "Iran" | "Monte Cassino" | "Edinburgh Zoo" | "Ship" | "Map";
  shot: string;
  camera: string;
  keyAction: string;
};

export const TOTAL_FRAMES = 1800;
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SHOTS: Shot[] = [
  { scene: 1, line: 1, startFrame: 9, endFrame: 188, beat: 1, location: "Iran", shot: "Wide jalan Iran, Wojtek dewasa tegak di tengah tentara", camera: "Slow push-in, fov 46", keyAction: "Hook: beruang berdiri seperti tentara; 2 tentara menunjuk; host di tepi kanan menonton" },
  { scene: 2, line: 2, startFrame: 195, endFrame: 327, beat: 1, location: "Iran", shot: "Kamp pengungsi, anak beruang kecil di tengah tentara", camera: "MS, slow push-in", keyAction: "Label '1942, Iran'; tentara menunjuk anak beruang; host di tepi kiri" },
  { scene: 3, line: 3, startFrame: 335, endFrame: 466, beat: 1, location: "Iran", shot: "Kamp, tentara bergulat + minum bir + hormat", camera: "MS, slow push-in", keyAction: "Tentara memberi hormat; anak beruang mengangkat kaki depan; mug bir di meja; host menonton" },
  { scene: 4, line: 4, startFrame: 474, endFrame: 662, beat: 2, location: "Ship", shot: "Peta perjalanan f474-564, lalu dermaga kapal + pendaftaran", camera: "Static map, lalu MS push-in", keyAction: "Peta Iran -> Italia -> Skotlandia; tentara memegang kertas 'PRIVATE WOJTEK, SERIAL 253'; host di tepi" },
  { scene: 5, line: 5, startFrame: 670, endFrame: 896, beat: 2, location: "Monte Cassino", shot: "Garis suplai, Wojtek membawa peti peluru, berjalan maju", camera: "MS, slow push-in", keyAction: "Wojtek dewasa BERJALAN MAJU bawa peti; 2 tentara berjalan; truk amunisi + biara hancur di bukit; host jongkok di balik truk" },
  { scene: 6, line: 6, startFrame: 903, endFrame: 1044, beat: 2, location: "Monte Cassino", shot: "Upacara promosi, badge unit beruang bawa peluru", camera: "MS, slow push-in", keyAction: "Wojtek memberi hormat; badge unit muncul; label 'CORPORAL WOJTEK'; host di tepi" },
  { scene: 7, line: 7, startFrame: 1052, endFrame: 1250, beat: 3, location: "Edinburgh Zoo", shot: "Kandang kebun binatang, Wojtek tua sendirian di balik pagar", camera: "Wide, slow push-in", keyAction: "Label '1947-1963, Edinburgh'; Wojtek tua menunduk di balik pagar; host di luar pagar" },
  { scene: 8, line: 8, startFrame: 1257, endFrame: 1426, beat: 3, location: "Edinburgh Zoo", shot: "Mantan tentara tua berkunjung ke kandang", camera: "MS, slow push-in", keyAction: "2 tentara tua melambai di luar pagar; Wojtek tua menoleh; host di tepi" },
  { scene: 9, line: 9, startFrame: 1434, endFrame: 1575, beat: 3, location: "Edinburgh Zoo", shot: "Wojtek tua memandang keluar pagar; foto asli f1680-1800", camera: "MS, slow push-in, lalu static foto", keyAction: "Wojtek tua diam menatap; host menunduk hormat; foto asli IWM 1942 (domain publik)" },
];

/** Adegan aktif pada frame f (di luar rentang VO: tahan adegan terakhir). */
export const shotAt = (f: number): Shot => {
  const s = SHOTS.find((x) => f >= x.startFrame && f <= x.endFrame);
  if (s) return s;
  if (f < SHOTS[0].startFrame) return SHOTS[0];
  return SHOTS[SHOTS.length - 1];
};

/** Label tahun + tempat per beat (wajib sejak video 5). */
export const BEAT_LABELS: { scene: number; text: string }[] = [
  { scene: 1, text: "1942, Iran" },
  { scene: 4, text: "1944, Monte Cassino" },
  { scene: 7, text: "1947-1963, Edinburgh" },
];

/** Jendela peta perjalanan (di dalam adegan 4): f474-564. */
export const MAP_A = 570;
export const MAP_B = 660;

/** Frame foto asli mulai tampil (setelah VO berakhir 52.51 dtk). */
export const PHOTO_A = 1680;
