// karaoke.ts - Timing TERUKUR WhisperX untuk Video22 Battle of Myeongnyang (History Rush #13).
// Diperbaiki dari audio/mix.json (model tiny, CPU, int8):
// tiap frasa = kata pertama start s.d. kata terakhir end, frame =
// round(detik * 30). Kata-kata SAMA PERSIS dengan SCRIPT.md L1-L10 (162 kata).
// Pemetaan posisi dipakai untuk kata yang dieja WhisperX berbeda tapi
// bunyinya sama (Yi->Yee, strait->straight, was->war, shoved->shove,
// ten->10, twelve->12, thirty-one->31, thirteen->13th, 26th->26,
// one hundred and thirty-three->133); teks frasa TIDAK diubah.
// 36 frasa, maks 35 karakter, 1 baris 46px (spesifikasi Lustig v3).
// SATU-SATUNYA sumber timing teks; komposisi membaca file ini.
export type KaraokePhrase = { phrase: string; startFrame: number; endFrame: number; line: number };

export const KARAOKE: KaraokePhrase[] = [
  { phrase: "Thirteen ships against a hundred", startFrame: 1, endFrame: 61, line: 1 },
  { phrase: "and thirty-three.", startFrame: 61, endFrame: 77, line: 1 },
  { phrase: "Nobody should have won. He did.", startFrame: 99, endFrame: 165, line: 1 },
  { phrase: "In 1597, Korea's navy was almost", startFrame: 195, endFrame: 275, line: 2 },
  { phrase: "gone. Japan had destroyed it in one", startFrame: 276, endFrame: 341, line: 2 },
  { phrase: "battle.", startFrame: 342, endFrame: 350, line: 2 },
  { phrase: "Admiral Yi Sun-sin was given what", startFrame: 367, endFrame: 426, line: 3 },
  { phrase: "was left. The king told him to give", startFrame: 428, endFrame: 485, line: 3 },
  { phrase: "up the sea and fight on land.", startFrame: 486, endFrame: 540, line: 3 },
  { phrase: "Yi answered: I still have twelve", startFrame: 556, endFrame: 611, line: 4 },
  { phrase: "ships.", startFrame: 613, endFrame: 620, line: 4 },
  { phrase: "A thirteenth ship joined him.", startFrame: 651, endFrame: 690, line: 5 },
  { phrase: "So he chose one place to fight: a", startFrame: 710, endFrame: 773, line: 5 },
  { phrase: "strait so narrow,", startFrame: 775, endFrame: 805, line: 5 },
  { phrase: "only a few ships could enter at", startFrame: 812, endFrame: 859, line: 5 },
  { phrase: "once.", startFrame: 863, endFrame: 869, line: 5 },
  { phrase: "The current there runs ten knots,", startFrame: 885, endFrame: 925, line: 6 },
  { phrase: "then turns around.", startFrame: 937, endFrame: 959, line: 6 },
  { phrase: "It roars so loud,", startFrame: 974, endFrame: 1000, line: 6 },
  { phrase: "the strait is called the Roaring", startFrame: 1006, endFrame: 1046, line: 6 },
  { phrase: "Current.", startFrame: 1048, endFrame: 1058, line: 6 },
  { phrase: "On October the 26th,", startFrame: 1088, endFrame: 1116, line: 7 },
  { phrase: "the Japanese fleet sailed in.", startFrame: 1136, endFrame: 1180, line: 7 },
  { phrase: "One hundred and thirty-three", startFrame: 1180, endFrame: 1198, line: 7 },
  { phrase: "warships. Yi's flagship fought", startFrame: 1199, endFrame: 1297, line: 7 },
  { phrase: "almost alone.", startFrame: 1301, endFrame: 1326, line: 7 },
  { phrase: "Then the tide turned.", startFrame: 1343, endFrame: 1374, line: 8 },
  { phrase: "The current shoved the Japanese", startFrame: 1385, endFrame: 1419, line: 8 },
  { phrase: "ships back, and Yi struck.", startFrame: 1420, endFrame: 1464, line: 8 },
  { phrase: "When it was over,", startFrame: 1481, endFrame: 1499, line: 9 },
  { phrase: "thirty-one Japanese ships were", startFrame: 1513, endFrame: 1556, line: 9 },
  { phrase: "gone. Korea had not lost a single", startFrame: 1558, endFrame: 1633, line: 9 },
  { phrase: "one.", startFrame: 1638, endFrame: 1642, line: 9 },
  { phrase: "Thirteen ships beat a hundred and", startFrame: 1674, endFrame: 1709, line: 10 },
  { phrase: "thirty-three. And the sea did half", startFrame: 1709, endFrame: 1728, line: 10 },
  { phrase: "the fighting.", startFrame: 1728, endFrame: 1738, line: 10 },
];
