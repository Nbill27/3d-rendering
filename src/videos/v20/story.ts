// story.ts — SHOT PLAN Video20 War of the Pacific (History Rush #12).
// 9 adegan (L1 hook, L2, L3, L4, L5, L6, L7 laut, L8 darat, L9+L10 peta+foto),
// 3 beat, 2 lokasi (Gurun Atacama + laut/peta Pasifik). Timing adegan =
// onset frame tiap baris VO (karaoke.ts, TERUKUR WhisperX Tahap 7,
// 28 Nov 2026 — L1 0.05-4.31, L2 5.07-9.58, L3 9.94-14.68,
// L4 15.42-21.74, L5 22.20-27.94, L6 28.30-33.16, L7 34.01-41.27,
// L8 41.73-47.69, L9 48.09-53.81, L10 54.69-59.61).
// MAP_A/MAP_B = 1450-1610 (160 frame, di dalam L9, frasa Tarapaca
// 1443-1614). PHOTO_A = 1700 (di dalam L10 terukur, 1641-1788).
// Naskah VO TIDAK BOLEH diubah (SCRIPT.md, 161 kata, 10 baris).
// Fakta terverifikasi di RESEARCH.md: Perang Pasifik 1879-1883, Chile
// vs Peru + Bolivia, memperebutkan guano + nitrat Atacama; Bolivia
// menaikkan pajak 10 sen per kuintal atas Antofagasta Nitrate and
// Railway Company Feb 1878 (melanggar traktat 1874); Chile mendarat
// di Antofagasta 14 Feb 1879; traktat rahasia Bolivia-Peru 1873 diakui
// Peru Mar 1879; Chile menyatakan perang 5 Apr 1879; Iquique 21 Mei
// 1879 (Huascar menenggelamkan Esmeralda, Prat gugur; Independencia
// kandas di Punta Gruesa); Angamos 8 Okt 1879 (Chile merebut Huascar,
// Grau gugur); Tacna 26 Mei 1880 (Bolivia mundur), Arica 7 Jun 1880,
// Lima diduduki Jan 1881; Traktat Ancon Okt 1883 (Peru menyerahkan
// Tarapaca selamanya; Tacna/Arica diduduki, diselesaikan 1929: Chile
// menyimpan Arica, Tacna kembali ke Peru); Pacto de Tregua 1884
// (Bolivia menerima kekuasaan Chile atas pesisir Antofagasta); traktat
// 1904 menjadikannya permanen; Bolivia tidak punya laut sampai sekarang.
// Tidak ada adegan/dialog/quote karangan di naskah.
// NADA: ringan/absurd pada premisnya (perang gara-gara kotoran burung),
// tetap hormat pada yang gugur (Prat, Grau). Kepribadian gerak PLAYFUL
// (MOTION.md), overshoot dimatikan pada beat pertempuran S7-S8.
// KAMERA (aturan kamera bill 28 Nov, desain.md): LOCKED-OFF statis;
// framing berubah lewat hard cut; hanya 2 push-in per video (cepat di
// hook S1, lambat ke Huascar S7); tidak ada pan/tilt/tracking.

export type Shot = {
  scene: number;
  line: number;
  startFrame: number;
  endFrame: number;
  beat: 1 | 2 | 3;
  location: "Atacama" | "Antofagasta" | "Treaty" | "Sea" | "Land" | "Map";
  shot: string;
  camera: string;
  keyAction: string;
};

export const TOTAL_FRAMES = 1800;
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SHOTS: Shot[] = [
  { scene: 1, line: 1, startFrame: 0, endFrame: 150, beat: 1, location: "Atacama", shot: "Gurun Atacama, tumpukan guano + tiga bendera (Chile, Peru, Bolivia) di atas bukit pasir", camera: "Locked-off + fast push-in hook (1 -> 1.18)", keyAction: "Hook: tiga negara berperang gara-gara kotoran burung; satu kehilangan lautnya; label '1879, Atacama Desert'" },
  { scene: 2, line: 2, startFrame: 151, endFrame: 297, beat: 1, location: "Atacama", shot: "Oficina salitrera: tumpukan caliche, kereta bijih meluncur di rel, pekerja mengayun sekop, bak rebus beruap", camera: "Locked-off", keyAction: "Atacama, tempat terkering di Bumi, tanahnya penuh guano dan nitrat; label '1879, Atacama Desert'" },
  { scene: 3, line: 3, startFrame: 298, endFrame: 462, beat: 1, location: "Atacama", shot: "Close-up timbangan: guano di satu sisi, koin emas di sisi lain, lengan timbangan miring lalu seimbang", camera: "Locked-off", keyAction: "Kotoran burung dan garam putih: sebagai pupuk dan mesiu, harganya selangit" },
  { scene: 4, line: 4, startFrame: 463, endFrame: 665, beat: 2, location: "Antofagasta", shot: "Kantor perusahaan tambang: pejabat Bolivia mengangkat kertas pajak, pemilik tambang Chile menggeleng, pill '10 CENTS'", camera: "Locked-off", keyAction: "Perusahaan Chile menambang di tanah Bolivia; 1878 Bolivia menaikkan pajak sepuluh sen; label '1878, Antofagasta'" },
  { scene: 5, line: 5, startFrame: 666, endFrame: 848, beat: 2, location: "Antofagasta", shot: "Pelabuhan Antofagasta: prajurit Chile mendarat dan berbaris maju (aturan jalan), bendera Chile berkibar", camera: "Locked-off", keyAction: "Perusahaan menolak bayar; Feb 1879 Chile merebut pelabuhan Antofagasta; label 'February 1879, Antofagasta'" },
  { scene: 6, line: 6, startFrame: 849, endFrame: 1019, beat: 2, location: "Treaty", shot: "Ruangan gelap: dua tangan berjabat dalam bayangan (perjanjian rahasia), kertas deklarasi perang jatuh ke meja", camera: "Locked-off", keyAction: "Peru punya perjanjian rahasia dengan Bolivia; April, Chile menyatakan perang pada kedua negara" },
  { scene: 7, line: 7, startFrame: 1020, endFrame: 1251, beat: 3, location: "Sea", shot: "Laut Iquique: monitor Huascar (menara Coles berputar, 2 meriam 10 inci) vs korvet Esmeralda; Huascar menabrak dengan haluan pendobrak", camera: "Locked-off + slow push-in ke Huascar (1 -> 1.08)", keyAction: "Huascar menenggelamkan Esmeralda di Iquique; Oktober, Chile merebut Huascar dan membunuh Laksamana Grau; label '1879, Iquique'" },
  { scene: 8, line: 8, startFrame: 1252, endFrame: 1442, beat: 3, location: "Land", shot: "Darat Tacna-Arica: prajurit berbaris maju, meriam Krupp menembak sekali (laras mundur lurus), bendera Chile naik di bukit Arica", camera: "Locked-off", keyAction: "Chile merebut Tacna dan Arica; Bolivia keluar dari perang; 1881 Chile menduduki Lima; label '1880, Tacna'" },
  { scene: 9, line: 9, startFrame: 1443, endFrame: 1800, beat: 3, location: "Map", shot: "Peta pantai Pasifik f1450-1610 (panah Chile ke utara, Tarapaca + Litoral berubah warna), lalu foto asli f1700-1800 (monitor Huascar, 1903)", camera: "Locked-off", keyAction: "Twist penutup loop kembali ke hook: 1883 Peru menyerahkan Tarapaca, 1884 Bolivia menyerahkan seluruh pesisirnya; Bolivia masih tidak punya laut sampai sekarang; label '1883-1884'" },
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
  { scene: 1, text: "1879, Atacama Desert" },
  { scene: 2, text: "1879, Atacama Desert" },
  { scene: 4, text: "1878, Antofagasta" },
  { scene: 5, text: "February 1879, Antofagasta" },
  { scene: 7, text: "1879, Iquique" },
  { scene: 8, text: "1880, Tacna" },
  { scene: 9, text: "1883-1884" },
];

/** Jendela peta pantai Pasifik (di dalam adegan 9, L9 terukur 1443-1614). */
export const MAP_A = 1450;
export const MAP_B = 1610;

/** Frame foto asli mulai tampil (di dalam L10 terukur, 1641-1788). */
export const PHOTO_A = 1700;
