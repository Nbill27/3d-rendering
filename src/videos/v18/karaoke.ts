// karaoke.ts - Timing TERUKUR WhisperX untuk Video18 Paraguayan War (History Rush #10).
// Diperbaiki dari audio/whisperx-transcript.json (model tiny, CPU, int8):
// tiap frasa = kata pertama start s.d. kata terakhir end, frame =
// round(detik * 30). Kata-kata SAMA PERSIS dengan SCRIPT.md L1-L10 (164 kata).
// Pemetaan posisi dipakai untuk kata yang dieja WhisperX berbeda tapi
// bunyinya sama (López->Lopez, in to->into, Riachuelo->Riahuello,
// Tuyutí->Tuyuti, Asunción->a sunshen, Acosta Ñu->a cost of new,
// the 1st->1, Cerro Corá->Sarokora); teks frasa TIDAK diubah.
// 34 frasa, maks 35 karakter, 1 baris 46px (spesifikasi Lustig v3).
// SATU-SATUNYA sumber timing teks; komposisi membaca file ini.
export type KaraokePhrase = { phrase: string; startFrame: number; endFrame: number; line: number };

export const KARAOKE: KaraokePhrase[] = [
  { phrase: "By the end of this war,", startFrame: 2, endFrame: 32, line: 1 },
  { phrase: "children were fighting in the army.", startFrame: 41, endFrame: 84, line: 1 },
  { phrase: "How did it get that far? It started", startFrame: 97, endFrame: 164, line: 2 },
  { phrase: "with one ship.", startFrame: 165, endFrame: 201, line: 2 },
  { phrase: "In 1864, Brazil invaded Uruguay.", startFrame: 205, endFrame: 280, line: 3 },
  { phrase: "Paraguay's president,", startFrame: 293, endFrame: 319, line: 3 },
  { phrase: "Francisco Solano López,", startFrame: 325, endFrame: 365, line: 3 },
  { phrase: "stepped in to defend it.", startFrame: 372, endFrame: 400, line: 3 },
  { phrase: "López seized a Brazilian ship and", startFrame: 412, endFrame: 460, line: 4 },
  { phrase: "declared war on Brazil.", startFrame: 462, endFrame: 494, line: 4 },
  { phrase: "Months later,", startFrame: 507, endFrame: 522, line: 4 },
  { phrase: "he declared war on Argentina too.", startFrame: 526, endFrame: 575, line: 4 },
  { phrase: "So Brazil, Argentina,", startFrame: 588, endFrame: 628, line: 5 },
  { phrase: "and Uruguay joined forces against", startFrame: 633, endFrame: 687, line: 5 },
  { phrase: "him. Three countries against one.", startFrame: 689, endFrame: 746, line: 5 },
  { phrase: "In 1865, Paraguay's fleet was", startFrame: 774, endFrame: 839, line: 6 },
  { phrase: "destroyed at Riachuelo.", startFrame: 840, endFrame: 893, line: 6 },
  { phrase: "In 1866, at Tuyutí,", startFrame: 896, endFrame: 942, line: 6 },
  { phrase: "the greatest battle in South", startFrame: 951, endFrame: 983, line: 6 },
  { phrase: "American history,", startFrame: 984, endFrame: 1004, line: 6 },
  { phrase: "thousands died in a single day.", startFrame: 1013, endFrame: 1061, line: 6 },
  { phrase: "By 1869, the Allies had taken the", startFrame: 1073, endFrame: 1142, line: 7 },
  { phrase: "capital, Asunción.", startFrame: 1143, endFrame: 1175, line: 7 },
  { phrase: "Paraguay's army was almost gone.", startFrame: 1190, endFrame: 1243, line: 7 },
  { phrase: "At Acosta Ñu,", startFrame: 1266, endFrame: 1289, line: 8 },
  { phrase: "the last defenders were old men and", startFrame: 1299, endFrame: 1346, line: 8 },
  { phrase: "boys. Paraguay still remembers that", startFrame: 1347, endFrame: 1410, line: 8 },
  { phrase: "day as the Day of the Children.", startFrame: 1412, endFrame: 1459, line: 8 },
  { phrase: "On March the 1st,", startFrame: 1472, endFrame: 1513, line: 9 },
  { phrase: "1870, López was killed at Cerro", startFrame: 1514, endFrame: 1572, line: 9 },
  { phrase: "Corá. The war was over.", startFrame: 1572, endFrame: 1624, line: 9 },
  { phrase: "It all started with one ship.", startFrame: 1651, endFrame: 1687, line: 10 },
  { phrase: "It ended with half the people gone,", startFrame: 1699, endFrame: 1746, line: 10 },
  { phrase: "and a third of the land.", startFrame: 1752, endFrame: 1782, line: 10 },
];
