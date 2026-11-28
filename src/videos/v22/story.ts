// story.ts — SHOT PLAN Video22 Battle of Myeongnyang (History Rush #13).
// 9 adegan (L1 hook, L2, L3+L4, L5, L6, L7, L8, L9 peta, L10 foto),
// 3 beat, 2 lokasi (darat Korea + Selat Myeongnyang).
// Timing adegan = batas onset tiap baris VO TERUKUR WhisperX Tahap 7
// (28 Nov 2026 — L1 0.03-5.51, L2 6.49-11.68, L3 12.23-18.00,
// L4 18.54-20.68, L5 21.69-28.96, L6 29.50-35.26, L7 36.26-44.19,
// L8 44.75-48.82, L9 49.36-54.74, L10 55.78-57.95).
// MAP_A/MAP_B = 1541-1642 (di dalam S8, L9). PHOTO_A = 1700 (di dalam
// S9, L10). Naskah VO TIDAK BOLEH diubah (SCRIPT.md, 162 kata, 10 baris).
// Fakta terverifikasi di RESEARCH.md: 26 Okt 1597, Selat Myeongnyang
// (Uldolmok) antara Pulau Jindo dan Haenam; armada Korea dihancurkan di
// Chilcheollyang Jul 1597 (160+ kapal hilang, Won Gyun gugur, hanya Bae
// Seol lolos dengan 12 kapal); Yi Sun-sin diangkat kembali; Raja Seonjo
// memerintahkan bubarkan armada dan bergabung ke pasukan darat di bawah
// Jenderal Kwon Yul; jawaban Yi yang TERDOKUMENTASI di suratnya:
// "Your majesty, this vassal still has twelve battleships" (satu-satunya
// kutipan di naskah, bukan karangan); Yi memulai dengan 10 panokseon
// yang diselamatkan Bae Seol + 2 dari Kim Eok-chu + 1 lagi sebelum
// pertempuran = 13 kapal perang, ~1.500 pelaut/marinir; Jepang 133 kapal
// perang tempur menurut diary Yi (Nanjung Ilgi) — total sampai 330
// termasuk kapal pendukung TIDAK dipakai sebagai angka tempur; selat
// tersempit ~290 m, panjang ~1.700 m; arus ~10 knot, berbalik tiap
// ~3 jam; Myeongnyang/Uldolmok berarti "mengaum"; Yi bertempur di utara
// selat tempat arus lebih tenang; selat sempit mencegah pengepungan;
// perubahan pasang mendorong Jepang mundur dan memberi jalan serangan
// balik; pagi 26 Okt Jepang terlihat di ujung selatan, Yi pindah dari
// Usuyeong untuk memblokir ujung utara; kapal bendera Yi bertempur
// hampir sendirian sampai ia memberi isyarat An Wi dan Kim Eung-ham
// maju; kerugian: Korea TIDAK ADA kapal hilang (sedikitnya 2 gugur,
// 3 luka di kapal bendera; ~10 orang total menurut Peterson); Jepang
// 31 kapal tenggelam/rusak berat (hitungan Yi), Kurushima Michifusa
// gugur, Todo Takatora luka; setelah menang Yi mundur ke Laut Kuning
// untuk perbekalan. TIDAK dipakai: kapal kura-kura (Geobukseon) di
// Myeongnyang — 13 kapal Yi adalah panokseon; tanggal 25 Okt (hanya
// sebagian studi Korea; naskah memakai 26 Okt); adegan/dialog/quote
// karangan apa pun.
// NADA: hormat dan serius (pertempuran berdarah, bukan lucu).
// Kepribadian gerak PREMIUM (MOTION.md), overshoot 0% di semua beat.
// KAMERA (aturan kamera bill 28 Nov, desain.md): LOCKED-OFF statis;
// framing berubah lewat hard cut; hanya 2 push-in per video (cepat di
// hook S1, lambat ke pusaran S5); tidak ada pan/tilt/tracking.

export type Shot = {
  scene: number;
  line: number;
  startFrame: number;
  endFrame: number;
  beat: 1 | 2 | 3;
  location: "Korea" | "Chilcheollyang" | "Court" | "Strait" | "Sea" | "Map";
  shot: string;
  camera: string;
  keyAction: string;
};

export const TOTAL_FRAMES = 1800;
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SHOTS: Shot[] = [
  { scene: 1, line: 1, startFrame: 0, endFrame: 194, beat: 1, location: "Sea", shot: "Laut di depan Selat Myeongnyang: 13 kapal panokseon Korea kecil di utara lawan 133 kapal Jepang di selatan; angka besar 13 lawan 133", camera: "Locked-off + fast push-in hook (1 -> 1.18)", keyAction: "Hook: tiga belas kapal lawan seratus tiga puluh tiga; tidak ada yang seharusnya menang; dia menang; label 'October 26, 1597'" },
  { scene: 2, line: 2, startFrame: 195, endFrame: 366, beat: 1, location: "Chilcheollyang", shot: "Chilcheollyang Juli 1597: kapal-kapal Korea terbakar dan tenggelam; asap tebal; laut gelap", camera: "Locked-off", keyAction: "Tahun 1597, armada Korea hampir habis; Jepang menghancurkannya dalam satu pertempuran; label 'July 1597, Chilcheollyang'" },
  { scene: 3, line: 3, startFrame: 367, endFrame: 650, beat: 1, location: "Court", shot: "Yi Sun-sin berdiri diam di depan istana/darat Korea, menunjuk ke laut; 12 kapal kecil di belakangnya; surat raja", camera: "Locked-off", keyAction: "Yi diberi sisa armada; raja menyuruhnya menyerahkan laut dan bertempur di darat; Yi menjawab: saya masih punya dua belas kapal; label '1597, Korea'" },
  { scene: 4, line: 4, startFrame: 651, endFrame: 884, beat: 2, location: "Strait", shot: "Selat Myeongnyang dari atas: dua tebing (Jindo + Haenam) mengapit saluran sempit; kapal ke-13 meluncur masuk bergabung", camera: "Locked-off", keyAction: "Kapal ketiga belas bergabung; Yi memilih satu tempat bertempur: selat yang sangat sempit, hanya beberapa kapal bisa masuk sekaligus; label '1597, Myeongnyang Strait'" },
  { scene: 5, line: 5, startFrame: 885, endFrame: 1087, beat: 2, location: "Strait", shot: "Pusaran besar berputar di tengah selat; panah arus 10 knot berbalik arah; motif pusaran (motif yang diulang)", camera: "Locked-off + slow push-in ke pusaran (1 -> 1.08)", keyAction: "Arus di sana mengalir sepuluh knot, lalu berbalik; suaranya mengaum, selat itu disebut Arus Mengaum; label 'Myeongnyang Strait'" },
  { scene: 6, line: 6, startFrame: 1088, endFrame: 1342, beat: 3, location: "Sea", shot: "Pagi 26 Oktober: armada Jepang masuk dari selatan berbaris; kapal bendera Yi sendirian di utara memblokir jalan", camera: "Locked-off", keyAction: "26 Oktober, armada Jepang berlayar masuk; seratus tiga puluh tiga kapal perang; kapal bendera Yi bertempur hampir sendirian; label 'October 26, 1597'" },
  { scene: 7, line: 7, startFrame: 1343, endFrame: 1480, beat: 3, location: "Sea", shot: "Pasang berbalik: panah arus membalik, kapal Jepang terdorong mundur; meriam chongtong kapal Yi menembak sekali (laras mundur lurus); kapal Korea maju menyerang", camera: "Locked-off", keyAction: "Lalu pasang berbalik; arus mendorong kapal Jepang ke belakang, dan Yi menyerang; label 'October 26, 1597'" },
  { scene: 8, line: 8, startFrame: 1481, endFrame: 1673, beat: 3, location: "Map", shot: "Peta Selat Myeongnyang f1541-1642 (Jindo + Haenam, selat sempit, panah arus, 31 kapal Jepang tenggelam ditandai, 0 kapal Korea hilang)", camera: "Locked-off", keyAction: "Ketika selesai, tiga puluh satu kapal Jepang hilang; Korea tidak kehilangan satu kapal pun; label 'October 26, 1597'" },
  { scene: 9, line: 9, startFrame: 1674, endFrame: 1800, beat: 3, location: "Sea", shot: "Laut matahari terbenam amber: 13 kapal Korea berlayar; foto asli f1700-1800 (potret Yi Sun-sin, domain publik); pusaran kecil di laut", camera: "Locked-off", keyAction: "Twist penutup loop kembali ke hook: tiga belas kapal mengalahkan seratus tiga puluh tiga; dan laut melakukan setengah pertempuran; label '1597'" },
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
  { scene: 1, text: "October 26, 1597" },
  { scene: 2, text: "July 1597, Chilcheollyang" },
  { scene: 3, text: "1597, Korea" },
  { scene: 4, text: "1597, Myeongnyang Strait" },
  { scene: 5, text: "Myeongnyang Strait" },
  { scene: 6, text: "October 26, 1597" },
  { scene: 7, text: "October 26, 1597" },
  { scene: 8, text: "October 26, 1597" },
  { scene: 9, text: "1597" },
];

/** Jendela peta Selat Myeongnyang (di dalam adegan 8, L9). */
export const MAP_A = 1541;
export const MAP_B = 1642;

/** Frame foto asli mulai tampil (di dalam L10). */
export const PHOTO_A = 1700;
