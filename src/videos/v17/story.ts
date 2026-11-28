// story.ts — SHOT PLAN Video17 Pig War (History Rush #9).
// Satu adegan per baris VO (9 adegan, hard cut), 3 beat, 2 lokasi
// (kebun + farm San Juan Island -> pantai/kamp + laut).
// Timing adegan = onset frame tiap baris VO (karaoke.ts, TERUKUR
// WhisperX Tahap 7, 28 Nov 2026 — L1 0.15-3.45, L2 3.55-10.06,
// L3 10.50-17.32, L4 18.51-23.59, L5 24.11-29.18, L6 29.64-36.56,
// L7 39.27-44.63, L8 45.05-50.92, L9 51.98-59.20).
// MAP_A/MAP_B = 920-1010 (90 frame, di dalam L6 terukur, 889-1097).
// PHOTO_A = 1700 (di dalam L9 terukur, 1559-1776).
// Tabel SHOTS di bawah ini menyimpan frame rencana awal (provisional)
// dan TIDAK dipakai komposisi (inert — adegan diturunkan dari karaoke
// line saja); jangan jadikan acuan timing.
// Naskah VO TIDAK BOLEH diubah (SCRIPT.md,
// 155 kata, 9 baris). Fakta terverifikasi di RESEARCH.md: Cutlar
// menembak babi Griffin 15 Jun 1859; $10 vs $100; Pickett 64 orang
// mendarat 27 Jul 1859; Agustus 461 tentara AS + 14 meriam vs 5 kapal
// perang Inggris, 167 meriam, 2.140 tentara; Laksamana Baynes menolak
// berperang; okupasi bersama 12 tahun; arbitrase Kaiser Wilhelm I
// 21 Okt 1872 untuk AS; satu-satunya korban adalah babi. Tidak ada
// tembakan antar manusia, tidak ada dialog/quote karangan di naskah.
// KAMERA (aturan kamera bill 28 Nov, desain.md): LOCKED-OFF statis;
// framing berubah lewat hard cut; hanya 2 push-in per video (cepat di
// hook S1, lambat ke objek kunci S6); tidak ada pan/tilt/tracking.

export type Shot = {
  scene: number;
  line: number;
  startFrame: number;
  endFrame: number;
  beat: 1 | 2 | 3;
  location: "Garden" | "Farm" | "Shore" | "Sea" | "Camp" | "Map";
  shot: string;
  camera: string;
  keyAction: string;
};

export const TOTAL_FRAMES = 1800;
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SHOTS: Shot[] = [
  { scene: 1, line: 1, startFrame: 5, endFrame: 104, beat: 1, location: "Garden", shot: "Wide kebun kentang, babi mengorek di tengah, Cutlar + Griffin menunjuk", camera: "Locked-off + fast push-in hook (1 -> 1.18)", keyAction: "Hook: satu babi, dua negara; babi mengorek kentang" },
  { scene: 2, line: 2, startFrame: 107, endFrame: 302, beat: 1, location: "Garden", shot: "Kebun, Cutlar merawat kentang, babi makan kentang, Griffin di pagar", camera: "Locked-off", keyAction: "Label '1859, San Juan Island'; babi mengorek barisan kentang" },
  { scene: 3, line: 3, startFrame: 315, endFrame: 520, beat: 1, location: "Farm", shot: "Farm, Cutlar pegang tanda $10, Griffin pegang tanda $100, babi di tengah", camera: "Locked-off", keyAction: "Tanda harga $10 vs $100; dua pria berhadapan" },
  { scene: 4, line: 4, startFrame: 555, endFrame: 708, beat: 1, location: "Garden", shot: "Kebun, Cutlar dengan senapan, babi terbaring, perwira Inggris menunjuk (ancam tangkap)", camera: "Locked-off", keyAction: "Babi terbaring diam (tanpa darah); perwira merah menunjuk Cutlar" },
  { scene: 5, line: 5, startFrame: 723, endFrame: 875, beat: 2, location: "Shore", shot: "Pantai, Pickett + 2 tentara BERJALAN MAJU ke kamera dari perahu", camera: "Locked-off", keyAction: "Pickett + tentara berjalan maju (kaki kanan lalu kiri, badan maju)" },
  { scene: 6, line: 6, startFrame: 889, endFrame: 1097, beat: 2, location: "Shore", shot: "Peta pulau f920-1010, lalu benteng AS + meriam vs 5 kapal perang di laut", camera: "Locked-off + slow push-in ke standoff (1 -> 1.08)", keyAction: "Peta San Juan Island; benteng 14 meriam vs kapal perang" },
  { scene: 7, line: 7, startFrame: 1178, endFrame: 1339, beat: 2, location: "Sea", shot: "Geladak kapal, Laksamana Baynes menolak berperang, tangan terangkat", camera: "Locked-off", keyAction: "Laksamana mengangkat tangan 'berhenti'; label 'A SQUABBLE ABOUT A PIG'" },
  { scene: 8, line: 8, startFrame: 1352, endFrame: 1527, beat: 3, location: "Camp", shot: "Kamp bersama, tentara AS + tentara Inggris berdiri berdampingan, dua bendera", camera: "Locked-off", keyAction: "Label '1859-1872, San Juan Island'; dua seragam berdampingan damai" },
  { scene: 9, line: 9, startFrame: 1559, endFrame: 1776, beat: 3, location: "Camp", shot: "Pengibaran bendera AS, Pickett + tentara hormat; foto asli f1700-1800", camera: "Locked-off", keyAction: "Hormat ke bendera; label '1872'; foto Belle Vue Sheep Farm Sep 1859" },
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
  { scene: 1, text: "1859, San Juan Island" },
  { scene: 5, text: "August 1859" },
  { scene: 7, text: "1859–1872, San Juan Island" },
];

/** Jendela peta pulau (di dalam adegan 6): f920-1010. */
export const MAP_A = 920;
export const MAP_B = 1010;

/** Frame foto asli mulai tampil (di dalam L9 terukur, 1559-1776). */
export const PHOTO_A = 1700;
