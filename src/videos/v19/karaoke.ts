// karaoke.ts - Timing TERUKUR WhisperX untuk Video19 Operation Mincemeat (History Rush #11).
// Diperbaiki dari audio/mix.json (model tiny, CPU, int8):
// tiap frasa = kata pertama start s.d. kata terakhir end, frame =
// round(detik * 30). Kata-kata SAMA PERSIS dengan SCRIPT.md L1-L10 (167 kata).
// Pemetaan posisi dipakai untuk kata yang dieja WhisperX berbeda tapi
// bunyinya sama (Glyndwr->Glinder, fiancee's->fiance's, ten->10,
// the 9th->9, the di "April the 30th" dan "July the 9th" tidak
// terdengar WhisperX); teks frasa TIDAK diubah.
// 36 frasa, maks 35 karakter, 1 baris 46px (spesifikasi Lustig v3).
// SATU-SATUNYA sumber timing teks; komposisi membaca file ini.
export type KaraokePhrase = { phrase: string; startFrame: number; endFrame: number; line: number };

export const KARAOKE: KaraokePhrase[] = [
  { phrase: "In 1943, Britain won a battle with", startFrame: 9, endFrame: 81, line: 1 },
  { phrase: "a dead body.", startFrame: 83, endFrame: 104, line: 1 },
  { phrase: "Sicily was the obvious target.", startFrame: 135, endFrame: 176, line: 2 },
  { phrase: "So two British officers planned a", startFrame: 187, endFrame: 230, line: 2 },
  { phrase: "trick.", startFrame: 232, endFrame: 238, line: 2 },
  { phrase: "They took the body of a homeless", startFrame: 254, endFrame: 292, line: 3 },
  { phrase: "Welshman, Glyndwr Michael,", startFrame: 293, endFrame: 337, line: 3 },
  { phrase: "who had died after eating rat", startFrame: 345, endFrame: 384, line: 3 },
  { phrase: "poison.", startFrame: 385, endFrame: 395, line: 3 },
  { phrase: "They dressed him as Major William", startFrame: 410, endFrame: 455, line: 4 },
  { phrase: "Martin, a Royal Marine.", startFrame: 457, endFrame: 499, line: 4 },
  { phrase: "His pockets held a fiancee\'s photo.", startFrame: 517, endFrame: 564, line: 4 },
  { phrase: "Handcuffed to his wrist,", startFrame: 579, endFrame: 607, line: 5 },
  { phrase: "a briefcase.", startFrame: 617, endFrame: 635, line: 5 },
  { phrase: "Inside, a secret letter.", startFrame: 651, endFrame: 694, line: 5 },
  { phrase: "Greece was the target.", startFrame: 708, endFrame: 736, line: 5 },
  { phrase: "Sicily was only a diversion.", startFrame: 750, endFrame: 792, line: 5 },
  { phrase: "A submarine dropped him off Spain.", startFrame: 822, endFrame: 866, line: 6 },
  { phrase: "On the morning of April the 30th,", startFrame: 879, endFrame: 914, line: 6 },
  { phrase: "a fisherman found him.", startFrame: 920, endFrame: 945, line: 6 },
  { phrase: "Spain passed the letters to the", startFrame: 963, endFrame: 1009, line: 7 },
  { phrase: "Germans. And Hitler believed every", startFrame: 1011, endFrame: 1081, line: 7 },
  { phrase: "word.", startFrame: 1089, endFrame: 1099, line: 7 },
  { phrase: "He moved a whole panzer division to", startFrame: 1114, endFrame: 1152, line: 8 },
  { phrase: "Greece, and ten divisions to the", startFrame: 1153, endFrame: 1194, line: 8 },
  { phrase: "Balkans. Sicily was left almost", startFrame: 1195, endFrame: 1252, line: 8 },
  { phrase: "unguarded.", startFrame: 1254, endFrame: 1266, line: 8 },
  { phrase: "On July the 9th,", startFrame: 1295, endFrame: 1332, line: 9 },
  { phrase: "150,000 Allied troops landed in", startFrame: 1334, endFrame: 1397, line: 9 },
  { phrase: "Sicily. The island fell in 38 days,", startFrame: 1400, endFrame: 1475, line: 9 },
  { phrase: "not 90.", startFrame: 1487, endFrame: 1508, line: 9 },
  { phrase: "He never fought a day in his life.", startFrame: 1538, endFrame: 1579, line: 10 },
  { phrase: "He was buried a hero under a name", startFrame: 1593, endFrame: 1642, line: 10 },
  { phrase: "that was never his.", startFrame: 1643, endFrame: 1668, line: 10 },
  { phrase: "His real name stayed secret until", startFrame: 1692, endFrame: 1743, line: 10 },
  { phrase: "1997.", startFrame: 1743, endFrame: 1749, line: 10 },
];
