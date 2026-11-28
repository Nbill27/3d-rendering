// story.ts — SHOT PLAN Video23 Ghost Army (History Rush #14).
// 9 adegan (S1 L1 hook, S2 L2, S3 L3, S4 L4, S5 L5, S6 L6, S7 L7 peta,
// S8 L8, S9 L9+L10 foto), 3 beat, 2 lokasi (Camp Forrest, Tennessee +
// Eropa / Sungai Rhine).
// Timing adegan = onset TERUKUR WhisperX Tahap 7 (28 Nov 2026 — L1 0.09-4.09,
// L2 5.10-13.32, L3 14.25-19.24, L4 20.27-25.19, L5 25.97-31.66,
// L6 32.52-35.43, L7 36.54-42.28, L8 43.33-47.61, L9 48.44-53.15,
// L10 54.38-59.67; alignment per baris, mix v2).
// MAP_A/MAP_B = 1150-1280 (di dalam S7, L7: penyeberangan palsu 10 mil
// dari yang asli). PHOTO_A = 1700 (di dalam S9, L10: foto tank Sherman
// tiup domain publik, Wikimedia Commons File:DummyShermanTank.jpg).
// Naskah VO TIDAK BOLEH diubah (SCRIPT.md, 158 kata, 10 baris).
// Fakta terverifikasi di RESEARCH.md: 23rd Headquarters Special Troops
// diaktifkan 20 Jan 1944, Camp Forrest, Tennessee, gagasan Ralph
// Ingersoll; 82 perwira + 1.023 prajurit = 1.105 (~1.100), komandan
// Kol. Harry L. Reeder; anggota termasuk Bill Blass, Ellsworth Kelly,
// Art Kane; 603rd Engineer Camouflage Battalion (379 camoufleurs, tank
// tiup karet dengan kompresor gas, dibuat U.S. Rubber dan Goodyear,
// realistis dari beberapa ratus yard / dari pesawat); Signal Company
// Special (lalu lintas radio palsu); 3132nd Signal Service Company
// (speaker 500 pon di half-track, suara terdengar sampai 15 mil,
// paling efektif di malam hari); 406th Engineer Combat Company (168
// prajurit tempur, keamanan + MP palsu + jejak tank dari bulldozer);
// 22 operasi penipuan besar, Normandia sampai Rhine, Jun 1944-Mar 1945,
// 1.100 orang memproyeksikan dua divisi (~30.000); Operasi Viersen
// 18-24 Mar 1945 mensimulasikan Divisi Infanteri ke-30 + ke-79,
// penyeberangan palsu 10 mil di selatan yang asli, 600+ tank tiup dan
// artileri di Rhine, Ninth Army menyeberang hampir tanpa halangan;
// dibuka 1996; Congressional Gold Medal disahkan 2022, diberikan
// 21 Mar 2024. TIDAK dipakai: "15.000-30.000 nyawa diselamatkan"
// sebagai angka mutlak (hanya perkiraan dari pidato); berat tank tiup
// (tidak terverifikasi); adegan/dialog/quote karangan apa pun.
// NADA: cerdas dan penuh trik, tetap hormat (WWII).
// Kepribadian gerak PLAYFUL (MOTION Tahap 5): ease-out-back untuk
// mengembang, overshoot 10-20% (material karet).
// KAMERA (aturan kamera bill 28 Nov, desain.md): LOCKED-OFF statis;
// framing berubah lewat hard cut; hanya 2 push-in per video (cepat di
// hook S1, lambat ke tank tiup S4); tidak ada pan/tilt/tracking.
// MULUT: tidak ada dialog; mulut bentuk tetap sesuai ekspresi, tidak
// pernah bergerak mengikuti narasi. TIDAK ADA prop speaking.

export type Shot = {
  scene: number;
  line: number;
  startFrame: number;
  endFrame: number;
  beat: 1 | 2 | 3;
  location: "Tennessee" | "Europe" | "Rhine" | "Map";
  shot: string;
  camera: string;
  keyAction: string;
};

export const TOTAL_FRAMES = 1800;
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SHOTS: Shot[] = [
  { scene: 1, line: 1, startFrame: 0, endFrame: 152, beat: 1, location: "Tennessee", shot: "Lapangan di Camp Forrest: deretan tank Sherman tiup setengah mengembang; satu tank mengembang penuh di depan; kata besar FAKE ARMY", camera: "Locked-off + fast push-in hook (1 -> 1.18)", keyAction: "Hook: Amerika membangun pasukan dari tank tiup; itu menipu para jenderal Hitler; label '1944, Camp Forrest, Tennessee'" },
  { scene: 2, line: 2, startFrame: 153, endFrame: 427, beat: 1, location: "Tennessee", shot: "1.100 seniman, insinyur, dan prajurit berkumpul di barak rahasia; peta dan cetak biru di meja; stempel TOP SECRET", camera: "Locked-off", keyAction: "Tahun 1944, Angkatan Darat AS mengumpulkan 1.100 orang ke satu unit rahasia: 23rd Headquarters Special Troops; label '1944, Camp Forrest, Tennessee'" },
  { scene: 3, line: 3, startFrame: 428, endFrame: 607, beat: 1, location: "Tennessee", shot: "Tiga trik berjajar: tank karet, radio palsu dengan gelombang, speaker di half-track; kata besar THREE TRICKS", camera: "Locked-off", keyAction: "Senjata mereka: tank karet, obrolan radio palsu, dan rekaman pasukan yang tidak ada; label '1944'" },
  { scene: 4, line: 4, startFrame: 608, endFrame: 778, beat: 2, location: "Tennessee", shot: "Tank Sherman karet mengembang dari datar lewat selang kompresor; lalu tampak dari atas seperti dari pesawat, terlihat asli; motif tank tiup (motif yang diulang)", camera: "Locked-off + slow push-in ke tank mengembang (1 -> 1.08)", keyAction: "Tank Sherman dari karet, ditiup dengan kompresor udara; dari pesawat, terlihat asli; label '1944, Camp Forrest'" },
  { scene: 5, line: 5, startFrame: 779, endFrame: 975, beat: 2, location: "Europe", shot: "Malam: speaker besar di half-track, gelombang suara menyebar 15 mil ke pos pendengar Jerman; kata besar 15 MILES", camera: "Locked-off", keyAction: "Dari pos pendengar, terdengar asli; speaker di half-track memainkan suara tank, lima belas mil jauhnya; label '1944-1945, Europe'" },
  { scene: 6, line: 6, startFrame: 976, endFrame: 1095, beat: 2, location: "Europe", shot: "Dua puluh dua penanda operasi di peta Eropa; angka 1,100 membesar menjadi 30,000; kata besar 30,000", camera: "Locked-off", keyAction: "Dalam dua puluh dua operasi di seluruh Eropa, 1.100 orang berpura-pura menjadi tiga puluh ribu; label '1944-1945, Europe'" },
  { scene: 7, line: 7, startFrame: 1096, endFrame: 1299, beat: 3, location: "Map", shot: "Peta Rhine f1150-1280: dua panah penyeberangan, yang palsu 10 mil di selatan yang asli; kata besar THE RHINE", camera: "Locked-off", keyAction: "Trik terakhir mereka yang terbaik: Maret 1945, mereka memalsukan penyeberangan Rhine, sepuluh mil dari yang asli; label 'March 1945, Rhine River'" },
  { scene: 8, line: 8, startFrame: 1300, endFrame: 1452, beat: 3, location: "Rhine", shot: "Enam ratus tank tiup berbaris di tepi Rhine; pengamat Jerman dengan teropong menoleh ke arah yang salah; warna suasana mendingin ke biru-abu", camera: "Locked-off", keyAction: "Enam ratus tank karet berbaris di sungai; Jerman percaya penyeberangan akan terjadi di sana; label 'March 1945, Rhine River'" },
  { scene: 9, line: 9, startFrame: 1453, endFrame: 1800, beat: 3, location: "Rhine", shot: "Matahari terbit hangat di Rhine: pasukan asli menyeberang hampir tanpa halangan; foto asli f1700-1800 (tank Sherman tiup, domain publik); tank tiup motif muncul terakhir; kata besar UNTOUCHED lalu SECRET", camera: "Locked-off", keyAction: "Twist penutup loop kembali ke hook: pasukan asli menyeberangi Rhine hampir tanpa disentuh; rahasia yang dunia tidak ketahui sampai 1996; label '1945-1996'" },
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
  { scene: 1, text: "1944, Camp Forrest, Tennessee" },
  { scene: 2, text: "1944, Camp Forrest, Tennessee" },
  { scene: 3, text: "1944" },
  { scene: 4, text: "1944, Camp Forrest" },
  { scene: 5, text: "1944-1945, Europe" },
  { scene: 6, text: "1944-1945, Europe" },
  { scene: 7, text: "March 1945, Rhine River" },
  { scene: 8, text: "March 1945, Rhine River" },
  { scene: 9, text: "1945-1996" },
];

/** Jendela peta Sungai Rhine (di dalam adegan 7, L7). */
export const MAP_A = 1150;
export const MAP_B = 1280;

/** Frame foto asli mulai tampil (di dalam L10). */
export const PHOTO_A = 1700;
