// karaoke.ts - Timing TERUKUR WhisperX untuk Video23 Ghost Army (History Rush #14).
// Dibangun dari alignment PER BARIS (audio/wx-lines/lineN.json, model tiny,
// CPU, int8) yang dipetakan ke waktu mix lewat build_mix.py VO+SPANS (mix v2,
// repeat TTS L6/L10 sudah dipotong): tiap frasa = kata pertama start s.d.
// kata terakhir end, frame = round(detik * 30). Kata-kata SAMA PERSIS dengan
// SCRIPT.md L1-L10 (163 kata). Pemetaan posisi dipakai untuk kata yang dieja
// WhisperX berbeda tapi bunyinya sama (Rhine->Orion di L7, Rhine->line di L9,
// twenty-two->22, thirty thousand->30,000, Six hundred->600, One thousand one
// hundred->1,100, fifteen->15, ten->10, top-secret->top secret,
// half-tracks->half tracks); teks frasa TIDAK diubah.
// 37 frasa, maks 35 karakter, 1 baris 46px (spesifikasi Lustig v3).
// SATU-SATUNYA sumber timing teks; komposisi membaca file ini.
export type KaraokePhrase = { phrase: string; startFrame: number; endFrame: number; line: number };

export const KARAOKE: KaraokePhrase[] = [
  { phrase: "America built an army of inflatable", startFrame: 3, endFrame: 56, line: 1 },
  { phrase: "tanks. It fooled Hitler's generals.", startFrame: 58, endFrame: 123, line: 1 },
  { phrase: "In 1944, the U.S.", startFrame: 153, endFrame: 197, line: 2 },
  { phrase: "Army gathered 1,100 artists,", startFrame: 198, endFrame: 252, line: 2 },
  { phrase: "engineers, and soldiers into one", startFrame: 260, endFrame: 308, line: 2 },
  { phrase: "top-secret unit: the 23rd", startFrame: 309, endFrame: 364, line: 2 },
  { phrase: "Headquarters Special Troops.", startFrame: 366, endFrame: 400, line: 2 },
  { phrase: "Their weapons were rubber tanks,", startFrame: 428, endFrame: 470, line: 3 },
  { phrase: "fake radio chatter,", startFrame: 479, endFrame: 507, line: 3 },
  { phrase: "and recordings of an army that did", startFrame: 513, endFrame: 559, line: 3 },
  { phrase: "not exist.", startFrame: 560, endFrame: 577, line: 3 },
  { phrase: "A Sherman tank made of rubber,", startFrame: 608, endFrame: 647, line: 4 },
  { phrase: "blown up with an air compressor.", startFrame: 655, endFrame: 691, line: 4 },
  { phrase: "From a plane,", startFrame: 707, endFrame: 724, line: 4 },
  { phrase: "it looked real.", startFrame: 738, endFrame: 756, line: 4 },
  { phrase: "From a listening post,", startFrame: 779, endFrame: 804, line: 5 },
  { phrase: "it sounded real.", startFrame: 815, endFrame: 837, line: 5 },
  { phrase: "Speakers on half-tracks played the", startFrame: 854, endFrame: 894, line: 5 },
  { phrase: "noise of tanks,", startFrame: 896, endFrame: 924, line: 5 },
  { phrase: "fifteen miles away.", startFrame: 927, endFrame: 950, line: 5 },
  { phrase: "In twenty-two operations across", startFrame: 976, endFrame: 1018, line: 6 },
  { phrase: "Europe, 1,100 men pretended to be", startFrame: 1021, endFrame: 1056, line: 6 },
  { phrase: "thirty thousand.", startFrame: 1057, endFrame: 1063, line: 6 },
  { phrase: "Their last trick was their best.", startFrame: 1096, endFrame: 1131, line: 7 },
  { phrase: "In March 1945,", startFrame: 1144, endFrame: 1180, line: 7 },
  { phrase: "they faked a Rhine crossing,", startFrame: 1186, endFrame: 1225, line: 7 },
  { phrase: "ten miles from the real one.", startFrame: 1234, endFrame: 1268, line: 7 },
  { phrase: "Six hundred rubber tanks lined the", startFrame: 1300, endFrame: 1348, line: 8 },
  { phrase: "river. The Germans believed the", startFrame: 1349, endFrame: 1399, line: 8 },
  { phrase: "crossing would happen there.", startFrame: 1399, endFrame: 1428, line: 8 },
  { phrase: "The real army crossed the Rhine", startFrame: 1453, endFrame: 1501, line: 9 },
  { phrase: "almost untouched.", startFrame: 1505, endFrame: 1530, line: 9 },
  { phrase: "The fake army had done its job.", startFrame: 1549, endFrame: 1594, line: 9 },
  { phrase: "One thousand one hundred men.", startFrame: 1631, endFrame: 1673, line: 10 },
  { phrase: "Rubber tanks.", startFrame: 1687, endFrame: 1704, line: 10 },
  { phrase: "And a secret the world did not", startFrame: 1722, endFrame: 1764, line: 10 },
  { phrase: "learn until 1996.", startFrame: 1766, endFrame: 1790, line: 10 },
];
