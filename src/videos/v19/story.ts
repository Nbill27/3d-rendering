// story.ts — SHOT PLAN Video19 Operation Mincemeat (History Rush #11).
// 9 adegan (L1 hook, L2, L3, L4, L5, L6, L7+L8 + peta, L9, L10 penutup),
// 3 beat, 2 lokasi (London + laut/peta Mediterania). Timing adegan =
// onset frame tiap baris VO (karaoke.ts, TERUKUR WhisperX Tahap 7,
// 28 Nov 2026 — L1 0.31-3.47, L2 4.50-7.94, L3 8.46-13.18,
// L4 13.68-18.81, L5 19.29-26.41, L6 27.41-31.50, L7 32.10-36.64,
// L8 37.12-42.19, L9 43.18-50.28, L10 51.28-58.29).
// MAP_A/MAP_B = 1140-1260 (120 frame, di dalam L8, frasa panzer division
// 1114-1252). PHOTO_A = 1700 (di dalam L10 terukur, 1538-1749).
// Naskah VO TIDAK BOLEH diubah (SCRIPT.md, 167 kata, 10 baris).
// Fakta terverifikasi di RESEARCH.md: Trout Memo Ian Fleming 1939
// (ide #28, dari novel Basil Thompson 1937); perencana Charles
// Cholmondeley (RAF, MI5) + Ewen Montagu (Naval Intelligence);
// Churchill menyetujui 16 Apr 1943; jenazah Glyndwr Michael, 34 tahun,
// tunawisma Wales, meninggal karena racun tikus, tanpa kerabat;
// identitas Capt. (Acting Maj.) William Martin, Royal Marines;
// surat Nye ke Alexander (target Yunani + Kreta, Sisilia pengalihan);
// badan dilepas dekat Huelva, ditemukan nelayan pagi 30 Apr 1943;
// tas dikembalikan 11 Mei 1943; 14 Mei 1943 Hitler memindah Divisi
// Panzer 1 ke Yunani, 7 divisi infanteri ke Yunani, 10 ke Balkan;
// invasi Sisilia 9 Jul 1943, 150.000+ tentara, pulau jatuh 38 hari
// (bukan 90 yang diprediksi); identitas asli Michael baru diungkap
// 1997. Tidak ada adegan/dialog/quote karangan di naskah.
// NADA: hormat dan serius (bukan lelucon). Mayat tidak pernah tampil
// sebagai karakter berjalan: S3 hanya seragam terhampar + kartu dicap,
// S6 hanya sosok kecil mengapung di laut.
// KAMERA (aturan kamera bill 28 Nov, desain.md): LOCKED-OFF statis;
// framing berubah lewat hard cut; hanya 2 push-in per video (cepat di
// hook S1, lambat ke briefcase S5); tidak ada pan/tilt/tracking.

export type Shot = {
  scene: number;
  line: number;
  startFrame: number;
  endFrame: number;
  beat: 1 | 2 | 3;
  location: "London" | "Sea" | "Map" | "Sicily" | "Huelva";
  shot: string;
  camera: string;
  keyAction: string;
};

export const TOTAL_FRAMES = 1800;
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SHOTS: Shot[] = [
  { scene: 1, line: 1, startFrame: 0, endFrame: 130, beat: 1, location: "London", shot: "Kantor gelap London, briefcase + kartu identitas 'WILLIAM MARTIN' di atas meja", camera: "Locked-off + fast push-in hook (1 -> 1.18)", keyAction: "Hook: Britain won a battle with a dead body; label '1943, London'" },
  { scene: 2, line: 2, startFrame: 131, endFrame: 251, beat: 1, location: "London", shot: "Dua perwira (Montagu seragam laut, Cholmondeley RAF biru) di meja dengan peta Sisilia + panah merah", camera: "Locked-off", keyAction: "Sicily obvious target; two officers plan a trick; label '1943, London'" },
  { scene: 3, line: 3, startFrame: 252, endFrame: 408, beat: 1, location: "London", shot: "Seragam Royal Marines terhampar + kartu identitas dicap 'WILLIAM MARTIN'; hormat, tanpa wajah mayat", camera: "Locked-off", keyAction: "Glyndwr Michael menjadi Major William Martin; label '1943, London'" },
  { scene: 4, line: 4, startFrame: 409, endFrame: 576, beat: 1, location: "London", shot: "Close-up pocket litter di meja: foto tunangan, kartu identitas, kuitansi", camera: "Locked-off", keyAction: "Satu gagasan per layar: isi saku yang membuat Martin hidup" },
  { scene: 5, line: 5, startFrame: 577, endFrame: 820, beat: 1, location: "London", shot: "Briefcase diborgol ke pergelangan tangan berseragam, surat 'GREECE' terbaca", camera: "Locked-off + slow push-in ke briefcase (1 -> 1.08)", keyAction: "Surat rahasia: target Yunani, Sisilia pengalihan" },
  { scene: 6, line: 6, startFrame: 821, endFrame: 958, beat: 2, location: "Sea", shot: "Kapal selam HMS Seraph di laut fajar, sosok kecil mengapung menjauhi kapal, nelayan di perahu", camera: "Locked-off", keyAction: "Mayat dilepas di lepas pantai Spanyol; nelayan menemukan pagi 30 April; label '30 April 1943, Huelva, Spain'" },
  { scene: 7, line: 7, startFrame: 959, endFrame: 1292, beat: 2, location: "Map", shot: "Peta Mediterania f1140-1260, panah divisi Jerman bergerak dari Sisilia ke Yunani + Balkan", camera: "Locked-off", keyAction: "Hitler percaya setiap kata; panzer ke Yunani, 10 divisi ke Balkan" },
  { scene: 8, line: 9, startFrame: 1293, endFrame: 1537, beat: 3, location: "Sicily", shot: "Pendaratan Sisilia, landing craft + tentara merapat ke pantai", camera: "Locked-off", keyAction: "9 Juli 1943, 150.000 tentara mendarat; pulau jatuh 38 hari, bukan 90; label '9 July 1943, Sicily'" },
  { scene: 9, line: 10, startFrame: 1538, endFrame: 1800, beat: 3, location: "Huelva", shot: "Senja Huelva, hening; foto asli f1700-1800 (Cholmondeley dan Montagu, 1943)", camera: "Locked-off", keyAction: "Twist penutup loop kembali ke hook: tidak pernah berperang, dikubur pahlawan, nama asli rahasia sampai 1997" },
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
  { scene: 1, text: "1943, London" },
  { scene: 2, text: "1943, London" },
  { scene: 3, text: "1943, London" },
  { scene: 6, text: "30 April 1943, Huelva, Spain" },
  { scene: 8, text: "9 July 1943, Sicily" },
];

/** Jendela peta Mediterania (di dalam adegan 7, L8 terukur 1114-1266). */
export const MAP_A = 1140;
export const MAP_B = 1260;

/** Frame foto asli mulai tampil (di dalam L10 terukur, 1538-1749). */
export const PHOTO_A = 1700;
