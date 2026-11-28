// story.ts — SHOT PLAN Video18 Paraguayan War (History Rush #10).
// 9 adegan (L1+L2 hook, L3, L4, L5, L6a Riachuelo, L6b Tuyuti + peta,
// L7, L8, L9+L10 penutup), 3 beat, 2 lokasi (Paraguay / cekungan
// Rio de la Plata + peta). Timing adegan = onset frame tiap baris VO
// (karaoke.ts, TERUKUR WhisperX Tahap 7, 28 Nov 2026 — L1 0.07-2.81,
// L2 3.23-6.70, L3 6.82-13.32, L4 13.74-19.17, L5 19.61-24.85,
// L6 25.79-35.35, L7 35.75-41.44, L8 42.22-48.62, L9 49.06-54.14,
// L10 55.02-59.39). MAP_A/MAP_B = 960-1050 (90 frame, di dalam L6b,
// frasa Tuyuti 896-1061). PHOTO_A = 1700 (di dalam L10 terukur,
// 1651-1782).
// Naskah VO TIDAK BOLEH diubah (SCRIPT.md, 164 kata, 10 baris).
// Fakta terverifikasi di RESEARCH.md: perang 1864-1870, Paraguay vs
// Triple Alliance (Brasil, Argentina, Uruguay); Lopez menyita kapal
// Marques de Olinda 12 Nov 1864; Riachuelo 11 Jun 1865 (armada Paraguay
// hampir hancur); Tuyuti 24 Mei 1866 (pertempuran darat terbesar di
// Amerika Selatan); Asuncion jatuh Jan 1869; Acosta Nu 16 Agu 1869
// (20.000 Aliansi vs 6.000 Paraguay, kebanyakan orang tua dan anak);
// Cerro Cora 1 Mar 1870 (Lopez tewas); Paraguay kehilangan sekitar
// separuh penduduk dan sepertiga wilayah. Angka korban yang
// diperdebatkan TIDAK dipakai sebagai fakta tunggal (lihat RESEARCH.md).
// Tidak ada adegan/dialog/quote karangan di naskah.
// KAMERA (aturan kamera bill 28 Nov, desain.md): LOCKED-OFF statis;
// framing berubah lewat hard cut; hanya 2 push-in per video (cepat di
// hook S1, lambat ke objek kunci S3 kapal Olinda); tidak ada
// pan/tilt/tracking. NADA: hormat dan serius (bukan lelucon).

export type Shot = {
  scene: number;
  line: number;
  startFrame: number;
  endFrame: number;
  beat: 1 | 2 | 3;
  location: "Battlefield" | "Asuncion" | "River" | "Field" | "Map" | "City" | "CerroCora";
  shot: string;
  camera: string;
  keyAction: string;
};

export const TOTAL_FRAMES = 1800;
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SHOTS: Shot[] = [
  { scene: 1, line: 1, startFrame: 2, endFrame: 201, beat: 1, location: "Battlefield", shot: "Medan perang senja, tentara muda berdiri hening, asap jauh", camera: "Locked-off + fast push-in hook (1 -> 1.18)", keyAction: "Hook: anak-anak bertempur; open loop 'satu kapal'" },
  { scene: 2, line: 3, startFrame: 205, endFrame: 400, beat: 1, location: "Asuncion", shot: "Asuncion 1864, Lopez menunjuk peta, pasukan Brasil masuk Uruguay", camera: "Locked-off", keyAction: "Label '1864, Asunción'; Lopez membela Uruguay" },
  { scene: 3, line: 4, startFrame: 412, endFrame: 575, beat: 1, location: "River", shot: "Kapal dagang Marques de Olinda di sungai, Lopez di dek menyita kapal", camera: "Locked-off + slow push-in ke kapal (1 -> 1.08)", keyAction: "Kapal disita; label 'ONE SHIP'" },
  { scene: 4, line: 5, startFrame: 588, endFrame: 746, beat: 1, location: "Field", shot: "Tiga bendera bersatu (Brasil, Argentina, Uruguay) vs satu tentara Paraguay", camera: "Locked-off", keyAction: "Tiga negara melawan satu" },
  { scene: 5, line: 6, startFrame: 774, endFrame: 893, beat: 2, location: "River", shot: "Riachuelo, kapal perang Brasil menembak, kapal Paraguay terbakar", camera: "Locked-off", keyAction: "Armada Paraguay hancur di Riachuelo" },
  { scene: 6, line: 6, startFrame: 896, endFrame: 1061, beat: 2, location: "Battlefield", shot: "Peta Paraguay f960-1050, lalu medan Tuyuti, meriam menembak, asap", camera: "Locked-off", keyAction: "Peta Paraguay + 4 pertempuran; Tuyuti, pertempuran terbesar" },
  { scene: 7, line: 7, startFrame: 1073, endFrame: 1243, beat: 2, location: "City", shot: "Asuncion 1869, tentara Aliansi BERJALAN MAJU ke kamera di jalan kota", camera: "Locked-off", keyAction: "Tentara Aliansi berjalan maju (kaki kanan lalu kiri, badan maju)" },
  { scene: 8, line: 8, startFrame: 1266, endFrame: 1459, beat: 3, location: "Field", shot: "Acosta Ñu, pertahanan terakhir: orang tua dan anak-anak, hening", camera: "Locked-off", keyAction: "Label '16 August 1869 · Day of the Children'; nada hening" },
  { scene: 9, line: 9, startFrame: 1472, endFrame: 1782, beat: 3, location: "CerroCora", shot: "Cerro Cora 1870, Lopez sendirian di senja; foto asli f1700-1800", camera: "Locked-off", keyAction: "Lopez gugur; twist penutup loop kembali ke 'satu kapal'; foto Lopez 1859" },
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
  { scene: 1, text: "1864–1870, Paraguay" },
  { scene: 2, text: "1864, Asunción" },
  { scene: 6, text: "1866, Tuyutí" },
  { scene: 7, text: "1869, Asunción" },
  { scene: 9, text: "1870, Cerro Corá" },
];

/** Jendela peta Paraguay (di dalam adegan 6): f960-1050. */
export const MAP_A = 960;
export const MAP_B = 1050;

/** Frame foto asli mulai tampil (di dalam L10 terukur, 1651-1782). */
export const PHOTO_A = 1700;
