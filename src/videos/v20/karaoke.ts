// karaoke.ts - Timing TERUKUR WhisperX untuk Video20 War of the Pacific (History Rush #12).
// Diperbaiki dari audio/mix.json (model tiny, CPU, int8):
// tiap frasa = kata pertama start s.d. kata terakhir end, frame =
// round(detik * 30). Kata-kata SAMA PERSIS dengan SCRIPT.md L1-L10 (161 kata).
// Pemetaan posisi dipakai untuk kata yang dieja WhisperX berbeda tapi
// bunyinya sama (Antofagasta->Antophagasta, Huascar->Wascar,
// Esmeralda->Moralda, Iquique->Equique, Grau->Rau, Tacna->Takna,
// Arica->Erika, ten->10); teks frasa TIDAK diubah.
// 36 frasa, maks 35 karakter, 1 baris 46px (spesifikasi Lustig v3).
// SATU-SATUNYA sumber timing teks; komposisi membaca file ini.
export type KaraokePhrase = { phrase: string; startFrame: number; endFrame: number; line: number };

export const KARAOKE: KaraokePhrase[] = [
  { phrase: "Three countries went to war over", startFrame: 2, endFrame: 53, line: 1 },
  { phrase: "bird poop. One of them lost its", startFrame: 56, endFrame: 117, line: 1 },
  { phrase: "ocean.", startFrame: 121, endFrame: 129, line: 1 },
  { phrase: "In the Atacama Desert,", startFrame: 152, endFrame: 181, line: 2 },
  { phrase: "the driest place on Earth,", startFrame: 187, endFrame: 221, line: 2 },
  { phrase: "the ground was full of guano and", startFrame: 229, endFrame: 273, line: 2 },
  { phrase: "nitrate.", startFrame: 275, endFrame: 287, line: 2 },
  { phrase: "Bird poop and white salt.", startFrame: 298, endFrame: 341, line: 3 },
  { phrase: "As fertilizer and gunpowder,", startFrame: 357, endFrame: 400, line: 3 },
  { phrase: "they were worth a fortune.", startFrame: 410, endFrame: 440, line: 3 },
  { phrase: "Chilean companies mined them on", startFrame: 463, endFrame: 508, line: 4 },
  { phrase: "Bolivian land.", startFrame: 508, endFrame: 553, line: 4 },
  { phrase: "In 1878, Bolivia raised their tax", startFrame: 556, endFrame: 626, line: 4 },
  { phrase: "by ten cents.", startFrame: 628, endFrame: 652, line: 4 },
  { phrase: "The companies refused to pay.", startFrame: 666, endFrame: 704, line: 5 },
  { phrase: "So in February 1879,", startFrame: 712, endFrame: 763, line: 5 },
  { phrase: "Chile seized the port of", startFrame: 772, endFrame: 811, line: 5 },
  { phrase: "Antofagasta.", startFrame: 815, endFrame: 838, line: 5 },
  { phrase: "Peru had a secret treaty with", startFrame: 849, endFrame: 892, line: 6 },
  { phrase: "Bolivia. In April,", startFrame: 893, endFrame: 933, line: 6 },
  { phrase: "Chile declared war on both", startFrame: 940, endFrame: 981, line: 6 },
  { phrase: "countries.", startFrame: 984, endFrame: 995, line: 6 },
  { phrase: "At sea, Peru\'s ironclad Huascar", startFrame: 1020, endFrame: 1074, line: 7 },
  { phrase: "sank Chile\'s Esmeralda at Iquique.", startFrame: 1080, endFrame: 1129, line: 7 },
  { phrase: "But in October,", startFrame: 1141, endFrame: 1159, line: 7 },
  { phrase: "Chile captured the Huascar and", startFrame: 1165, endFrame: 1203, line: 7 },
  { phrase: "killed its admiral, Grau.", startFrame: 1204, endFrame: 1238, line: 7 },
  { phrase: "On land, Chile took Tacna and", startFrame: 1252, endFrame: 1299, line: 8 },
  { phrase: "Arica. Bolivia quit the war.", startFrame: 1300, endFrame: 1368, line: 8 },
  { phrase: "In 1881, Chile occupied Lima.", startFrame: 1371, endFrame: 1431, line: 8 },
  { phrase: "In 1883, Peru gave up Tarapaca.", startFrame: 1443, endFrame: 1528, line: 9 },
  { phrase: "In 1884, Bolivia gave up its entire", startFrame: 1531, endFrame: 1602, line: 9 },
  { phrase: "coast.", startFrame: 1605, endFrame: 1614, line: 9 },
  { phrase: "It all started with bird poop.", startFrame: 1641, endFrame: 1680, line: 10 },
  { phrase: "And Bolivia still has no sea,", startFrame: 1694, endFrame: 1741, line: 10 },
  { phrase: "more than a hundred years later.", startFrame: 1749, endFrame: 1788, line: 10 },
];
