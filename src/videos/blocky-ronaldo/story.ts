// Timeline BLOCKY-RONALDO: shot timed to the voice words, camera grammar from the
// cartoon_3d_short skill: continuous slow push-ins; symmetric ease-in-out glides ~23 f;
// big reframes are cuts; every hold creeps (no static hold >= 4 f).
// True story: Cristiano Ronaldo, full life story, Indonesian VO, 887 words in SCRIPT.md
// (bill's order says 937 — recount 2026-11-27: 887 words of VO text, 39 words of section
// headers; the script text itself is the source of truth, unchanged).
// 7 parts (prolog, 5 babak, epilog), 29 scene groups. Every scene visualises EXACTLY
// the VO line spoken at that moment (SCRIPT.md scene plan). No invented scene/dialogue.
// Numbers on screen must match the script exactly: 980+, 146, 140, 42, 17, 807, 234, 1000.
// Years on labels must match exactly: 1985, 1997, 2003, 2008, 2009, 2014, 2016, 2018, 2021, 2022, 2026.
// Jerseys per era: Sporting green-white, United red, Madrid white, Juventus black-white,
// Al Nassr yellow-blue, Portugal red-green.
// TOTAL is MEASURED: mix.wav is 446.784 s, so 446.784 x 30 = 13404 frames.
// Scene boundaries below are the WhisperX-measured caption timings x 30 (captions.ts),
// rounded to whole frames. Exactly like v08, whose timings were measured Casper timings.
export const FPS = 30;
export const TOTAL = 13404; // MEASURED — mix.wav 446.784 s x 30 fps
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const bezX = (t: number) => 3 * 0.4 * t * (1 - t) * (1 - t) + 3 * 0.2 * t * t * (1 - t) + t * t * t;
const bezY = (t: number) => 3 * t * t * (1 - t) + t * t * t;
/** Premium signature easing: cubic-bezier(0.4, 0, 0.2, 1) (same as v08 story.ts). */
export const premium = (u: number) => {
  const x = clamp01(u);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (bezX(mid) < x) lo = mid; else hi = mid; }
  return bezY((lo + hi) / 2);
};
export const glide = (u: number) => premium(u);

// ---------------- key places (ground y=0; north = -z; 1u = 1m) ----------------
// Madeira: tin-roof house at the shore, dirt street, sea to the west (-x).
export const HOUSE_POS: V3 = [0, 0, 0]; // tin-roof house, Funchal workers' village
export const STREET_POS: V3 = [0, 0, 12]; // dirt street where child Ronaldo plays
export const PLANE_POS: V3 = [0, 0, -30]; // small plane on the Madeira runway
export const LISBON_DORM: V3 = [0, 0, 0]; // academy dorm, Lisbon (own zone, same local origin)
export const SPORTING_PITCH: V3 = [0, 0, 0];
export const OLD_TRAFFORD: V3 = [0, 0, 0];
export const BERNABEU: V3 = [0, 0, 0];
export const TURIN_PITCH: V3 = [0, 0, 0];
export const RIYADH_PITCH: V3 = [0, 0, 0];
export const EURO_FINAL: V3 = [0, 0, 0];
export const AIRPORT_POS: V3 = [0, 0, -30]; // Aeroporto Cristiano Ronaldo, Madeira

// ---------------- scenes ----------------
// One scene per scene group in SCRIPT.md. `vo` is the exact VO line (for the still
// check: which VO line is spoken, and does the frame show that line's content?).
// `a`/`b` are ESTIMATED frame boundaries from word-count pacing (150 wpm) — replace
// with WhisperX-measured timings after Langkah 2. `zone` is the world zone in world.ts.
export type Zone =
  | "stadium-night" | "madeira-map" | "funchal" | "lisbon" | "manchester"
  | "madrid" | "turin" | "world-map" | "riyadh" | "euro" | "airport" | "sunset";
export type SceneDef = {
  id: number; part: string; a: number; b: number; zone: Zone;
  label?: string; numbers?: string[]; vo: string;
};
// Boundaries below are the WhisperX-measured VO timings (captions.ts) x 30 fps.
// They were replaced with measured values after Langkah 2, before any still was rendered.
export const SCENES: SceneDef[] = [
  { id: 1, part: "PROLOG", a: 0, b: 216, zone: "stadium-night", numbers: ["980+"], vo: "Anak dari rumah beratap seng di pulau kecil ini sekarang memegang semua rekor gol dalam sejarah sepak bola." },
  { id: 2, part: "PROLOG", a: 243, b: 552, zone: "stadium-night", numbers: ["980+", "146", "140"], vo: "Lebih dari sembilan ratus delapan puluh gol resmi. Seratus empat puluh enam gol untuk Portugal. Seratus empat puluh gol di Liga Champions." },
  { id: 3, part: "PROLOG", a: 591, b: 849, zone: "madeira-map", vo: "Tapi semua itu mulai dari sebuah pulau kecil di tengah Atlantik, dari seorang anak yang tidak punya apa-apa kecuali bola dan mimpi." },
  { id: 4, part: "BABAK 1", a: 849, b: 1515, zone: "funchal", label: "5 FEBRUARI 1985, FUNCHAL, MADEIRA", vo: "Ceritanya mulai tahun 1985. Cristiano Ronaldo dos Santos Aveiro lahir lima Februari seribu sembilan ratus delapan puluh lima, di Funchal, ibu kota Madeira. Madeira pulau kecil milik Portugal, jauh di Samudra Atlantik." },
  { id: 5, part: "BABAK 1", a: 1554, b: 2169, zone: "funchal", vo: "Ronaldo anak bungsu dari empat bersaudara. Ayahnya, Jose Dinis Aveiro, petugas perlengkapan klub kecil bernama Andorinha. Ibunya juru masak. Mereka tinggal di rumah beratap seng di kampung pekerja, rumah kecil yang menghadap ke laut. Nama Ronaldo diambil dari aktor kesukaan ayahnya, Ronald Reagan." },
  { id: 6, part: "BABAK 1", a: 2208, b: 2733, zone: "funchal", vo: "Sejak kecil Ronaldo hanya punya satu mainan yang dia suka: bola. Dia main di jalanan, di lapangan tanah, di mana saja ada ruang. Di klub Andorinha dia mulai main serius. Lalu dia pindah ke Nacional, klub yang lebih besar di Madeira." },
  { id: 7, part: "BABAK 1", a: 2751, b: 3381, zone: "airport", label: "1997", vo: "Tahun seribu sembilan ratus sembilan puluh tujuh, saat Ronaldo berumur dua belas tahun, datang tawaran yang mengubah hidupnya. Sporting Lisbon, salah satu klub besar Portugal, mau dia masuk akademi mereka. Artinya Ronaldo harus meninggalkan Madeira sendirian, naik pesawat ke Lisbon, kota yang belum pernah dia tinggali." },
  { id: 8, part: "BABAK 1", a: 3411, b: 3756, zone: "lisbon", vo: "Dia berumur dua belas tahun. Dia pergi. Di Lisbon dia jauh dari keluarga, jauh dari rumah, dan di sana dia belajar satu hal: bakat saja tidak cukup." },
  { id: 9, part: "BABAK 2", a: 3798, b: 4371, zone: "lisbon", vo: "Jadi dia latihan seperti orang kesurupan. Pagi sekolah, sore latihan, malam latihan sendiri. Setahun kemudian, umur tujuh belas tahun, dia debut di tim utama Sporting. Eropa mulai memperhatikan." },
  { id: 10, part: "BABAK 2", a: 4398, b: 4920, zone: "manchester", label: "2003, 18 TAHUN", vo: "Tahun dua ribu tiga, Manchester United membelinya. Dia baru delapan belas tahun. United memberinya nomor tujuh, nomor yang baru saja ditinggal David Beckham. Tekanannya besar. Tapi Ronaldo menjawab dengan kerja." },
  { id: 11, part: "BABAK 2", a: 4953, b: 5346, zone: "manchester", numbers: ["42"], vo: "Tiga gelar Premier League beruntun, dua ribu tujuh, dua ribu delapan, dua ribu sembilan. Musim dua ribu tujuh dua ribu delapan dia mencetak empat puluh dua gol dan meraih Sepatu Emas Eropa." },
  { id: 12, part: "BABAK 2", a: 5373, b: 5850, zone: "manchester", label: "2008", vo: "Tahun dua ribu delapan dia juara Liga Champions dan meraih Ballon d'Or pertamanya. Anak dari Madeira itu sekarang bintang terbesar Inggris. Tapi Inggris sudah terlalu kecil buat dia. Klub terbesar di dunia datang mengetuk." },
  { id: 13, part: "BABAK 3", a: 5877, b: 6342, zone: "madrid", label: "2009, 131 JUTA DOLAR, REKOR DUNIA", vo: "Tahun dua ribu sembilan, Real Madrid membelinya dengan biaya seratus tiga puluh satu juta dolar, rekor dunia saat itu. Madrid bukan klub biasa. Di sana, bagus saja tidak cukup. Ronaldo menjawab dengan gol." },
  { id: 14, part: "BABAK 3", a: 6363, b: 6573, zone: "madrid", vo: "Di Madrid dia bersaing dengan Lionel Messi, rival yang membuat keduanya semakin hebat, musim demi musim." },
  { id: 15, part: "BABAK 3", a: 6588, b: 6948, zone: "madrid", numbers: ["17"], label: "2014, LA DECIMA", vo: "Tahun dua ribu empat belas, Madrid juara Liga Champions untuk ke sepuluh kalinya, La Decima. Musim itu Ronaldo mencetak tujuh belas gol di Liga Champions, rekor satu musim yang belum terpecahkan." },
  { id: 16, part: "BABAK 3", a: 6972, b: 7374, zone: "madrid", vo: "Lalu dia melakukannya lagi. Dan lagi. Empat gelar Liga Champions dalam lima tahun. Total lima gelar. Dia menjadi pencetak gol terbanyak sepanjang sejarah Real Madrid. Lima Ballon d'Or." },
  { id: 17, part: "BABAK 3", a: 7413, b: 8331, zone: "euro", label: "2016, MENIT 25", vo: "Tapi di tengah semua itu, ada satu hal yang belum pernah dia menangkan bersama negaranya. Tahun dua ribu enam belas, dia melakukan hal yang belum pernah dilakukan Portugal: juara Euro. Di final melawan Prancis, dia cedera di menit dua puluh lima dan harus keluar lapangan. Dia menonton dari pinggir, memberi semangat, sampai Eder mencetak gol di perpanjangan waktu. Portugal juara. Trofi besar pertama dalam sejarah mereka." },
  { id: 18, part: "BABAK 3", a: 8358, b: 8556, zone: "madrid", vo: "Sembilan tahun di Madrid, semua rekor dipecahkan. Tidak ada lagi yang bisa dia buktikan di sana." },
  { id: 19, part: "BABAK 4", a: 8601, b: 8856, zone: "turin", label: "2018, JUVENTUS", vo: "Jadi tahun dua ribu delapan belas, dia cari tantangan baru: Juventus di Italia. Di sana dia juara Serie A dua kali." },
  { id: 20, part: "BABAK 4", a: 8886, b: 9279, zone: "manchester", numbers: ["807"], label: "2021", vo: "Tahun dua ribu dua puluh satu, dia pulang ke Manchester United. Di musim itu dia mencapai delapan ratus tujuh gol dan menjadi pencetak gol terbanyak dalam sejarah sepak bola profesional." },
  { id: 21, part: "BABAK 4", a: 9327, b: 9801, zone: "world-map", label: "2022", vo: "Tapi musim keduanya tidak berjalan baik. Tahun dua ribu dua puluh dua, kontraknya dengan United berakhir. Sebulan kemudian, dia mengambil jalan yang tidak diduga siapa pun: bukan klub besar Eropa lain, bukan pensiun. Dia pergi ke Arab Saudi." },
  { id: 22, part: "BABAK 5", a: 9831, b: 10212, zone: "riyadh", label: "DESEMBER 2022", vo: "Desember dua ribu dua puluh dua, Ronaldo gabung Al Nassr di Arab Saudi. Banyak yang bilang kariernya sudah selesai. Dia menjawab dengan terus mencetak gol." },
  { id: 23, part: "BABAK 5", a: 10230, b: 11262, zone: "euro", vo: "Bersama Portugal dia juara Nations League dua kali, dua ribu sembilan belas dan dua ribu dua puluh lima. Piala Dunia dua ribu dua puluh enam menjadi Piala Dunia keenamnya. Dia satu-satunya pemain dalam sejarah yang mencetak gol di enam Piala Dunia berbeda. Portugal menang atas Kroasia di babak tiga puluh dua besar lewat gol Goncalo Ramos." },
  { id: 24, part: "BABAK 5", a: 11289, b: 11790, zone: "airport", label: "2017, AEROPORTO CRISTIANO RONALDO", vo: "Sementara itu, di kampung halamannya, namanya sudah jadi kebanggaan pulau itu sejak 2017, saat bandara di Madeira dinamai Aeroporto Cristiano Ronaldo. Anak dari rumah beratap seng itu sekarang namanya ada di bandara." },
  { id: 25, part: "BABAK 5", a: 11838, b: 12309, zone: "euro", numbers: ["146", "234"], vo: "Seratus empat puluh enam gol internasional, terbanyak sepanjang masa. Dua ratus tiga puluh empat penampilan untuk Portugal, juga terbanyak. Semua rekor sudah dia pegang. Yang tersisa tinggal satu angka." },
  { id: 26, part: "EPILOG", a: 12348, b: 12591, zone: "euro", label: "2026", vo: "Tahun dua ribu dua puluh enam, Ronaldo pensiun dari timnas Portugal sebagai pencetak gol terbanyak sepanjang masa. Tapi dia belum berhenti." },
  { id: 27, part: "EPILOG", a: 12609, b: 13050, zone: "riyadh", numbers: ["980+", "1000"], label: "UMUR 41 TAHUN", vo: "Di umur empat puluh satu tahun dia masih mencetak gol bersama Al Nassr. Totalnya lebih dari sembilan ratus delapan puluh gol resmi, terbanyak yang pernah dicetak pemain mana pun. Target berikutnya: seribu gol." },
  { id: 28, part: "EPILOG", a: 13074, b: 13224, zone: "riyadh", vo: "Selebrasi lompatnya, Siu, masih ditiru anak-anak di seluruh dunia." },
  { id: 29, part: "EPILOG", a: 13266, b: 13404, zone: "sunset", vo: "Anak dari pulau kecil itu belum selesai menulis ceritanya." },
];

export const sceneAt = (f: number) => SCENES.find((s) => f >= s.a && f < s.b) ?? SCENES[SCENES.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: sceneAt(f).id, alpha: 1 }];

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const full = (c: Partial<Cam> & { pos: V3; look: V3 }): Cam => ({ fov: 40, roll: 0, ...c });
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}) =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k] as V3, look, ...rest });
/** One slow push-in per scene, from the scene's key framing. Reframes between scenes are cuts.
 *  The push-in is CLAMPED to k >= 0.65: at the old rate (0.002) the camera ended up 60%
 *  closer by mid-scene and characters filled the whole frame (stills round 1, 2026-11-27). */
export const camAt = (id: number, f: number): Cam => {
  const s = SCENES.find((x) => x.id === id) ?? SCENES[0];
  const k = Math.max(0.65, pushK(f, s.a, 0.0008));
  switch (s.zone) {
    case "stadium-night": return full(dolly([4.2, 2.2, -13.2], [1.8, 1.5, -18], k, { fov: 40 }));
    case "madeira-map": return full(dolly([0, 14, 6], [0, 0, -2], k, { fov: 40 }));
    case "funchal":
      // Frontal from the south: the family (z=2) stands in front, houses behind them.
      // Round 2 had the camera at [5,2.4,-10] with a house at eye level filling half
      // the frame (stills 2026-11-27). Scene 6 is on the street (z=12), so it gets
      // its own framing looking south down the street.
      if (s.id === 6) return full(dolly([0, 3, 6], [0, 1, 12], k, { fov: 42 }));
      // Closer and lower than round 3 ([0,3.2,13]): the family was small and the frame
      // was mostly empty grass (stills 2026-11-27).
      return full(dolly([0, 2.5, 9], [0.25, 1, 1], k, { fov: 42 }));
    case "lisbon": {
      // Two scenes share this zone with actors in different places: scene 8's child
      // walks at z=0 (close framing), scene 9's debut is on the pitch at z=-18.
      // Round 5: scene 9's actor stood behind the camera — the still was empty grass.
      // Round 6 polish: closer camera (was [5,2.8,-12] -> [1.8,1.4,-18], fov 42) —
      // the old framing left the actor small and half the frame empty grass.
      if (s.id === 9) return full(dolly([4.2, 2.2, -13.2], [1.8, 1.5, -18], k, { fov: 40 }));
      // Scene 8: the child walks at (0,0,0) — round 7 found the old look target
      // [1.5,1.2,0] put him small at the right edge, 10 m from the camera.
      return full(dolly([3, 2.0, -6], [0, 0.8, 0], k, { fov: 42 }));
    }
    case "manchester": return full(dolly([4.2, 2.2, -13.2], [1.8, 1.5, -18], k, { fov: 40 }));
    case "madrid": return full(dolly([4.2, 2.2, -13.2], [1.8, 1.5, -18], k, { fov: 40 }));
    case "turin": return full(dolly([4.2, 2.2, -13.2], [1.8, 1.5, -18], k, { fov: 40 }));
    case "world-map": return full(dolly([0, 14, 6], [0, 0, -2], k, { fov: 40 }));
    case "riyadh": return full(dolly([4.2, 2.2, -13.2], [1.8, 1.5, -18], k, { fov: 40 }));
    case "euro":
      // Frontal: camera due south of the actors, looking north. Round 2 had the camera
      // off to the side at [5,2.8,-12], which pushed Eder to the frame edge (stills 2026-11-27).
      // Round 6 tried a closer camera ([1.2,2.2,-11.5]) — at max push-in Eder was cut
      // at the right edge and his feet below the frame. Reverted to the round-4 framing.
      return full(dolly([1.2, 2.6, -9], [1.0, 0.9, -17.5], k, { fov: 42 }));
    case "airport": return full(dolly([6, 3, -8], [0, 2, -28], k, { fov: 42 }));
    case "sunset": return full(dolly([0, 3, 10], [1, 1, 0], k, { fov: 48 }));
    default: return full(dolly([5, 2.8, -12], [1.8, 1.6, -18.5], k, { fov: 42 }));
  }
};

// ---------------- Siu jump (motion_design springs, blocky-toy Stage 9) ----------------
// Siu: jump up, turn 180 deg in the air, land with arms down, shout. Height 0.9 m,
// airtime 18 f at 30 fps. u = 0..1 across the jump.
export const siuAt = (f: number, f0: number): { y: number; yaw: number; armsDown: number } => {
  const u = clamp01((f - f0) / 18);
  if (u <= 0) return { y: 0, yaw: 0, armsDown: 0 };
  if (u >= 1) return { y: 0, yaw: Math.PI, armsDown: 1 };
  return { y: 0.9 * 4 * u * (1 - u), yaw: Math.PI * u, armsDown: u };
};
// ---------------- goal counter (hairline_create line + numbers, no other numbers) ----------------
export const counterAt = (f: number, f0: number, f1: number, target: number) => {
  const u = clamp01((f - f0) / Math.max(1, f1 - f0));
  return Math.round(target * u * u * (3 - 2 * u));
};
