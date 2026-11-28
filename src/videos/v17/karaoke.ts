// karaoke.ts - Timing TERUKUR WhisperX untuk Video17 Pig War (History Rush #9).
// Diperbaiki dari audio/whisperx-transcript.json (model tiny, CPU, int8):
// tiap frasa = kata pertama start s.d. kata terakhir end, frame =
// round(detik * 30). Kata-kata SAMA PERSIS dengan SCRIPT.md L1-L9 (155 kata).
// Pemetaan posisi dipakai untuk kata yang dieja WhisperX berbeda tapi
// bunyinya sama (Cutlar->Cutler, neighbour's->neighbors', June the 15th->
// June 15, sixty-four->64, two thousand->2,000, twelve->12, ten dollars->
// $10); teks frasa TIDAK diubah.
// 33 frasa, maks 35 karakter, 1 baris 46px (spesifikasi Lustig v3).
// SATU-SATUNYA sumber timing teks; komposisi membaca file ini.
export type KaraokePhrase = { phrase: string; startFrame: number; endFrame: number; line: number };

export const KARAOKE: KaraokePhrase[] = [
  { phrase: "One pig. Two countries.", startFrame: 5, endFrame: 38, line: 1 },
  { phrase: "And a war that almost happened.", startFrame: 47, endFrame: 104, line: 1 },
  { phrase: "In 1859, on San Juan Island,", startFrame: 107, endFrame: 169, line: 2 },
  { phrase: "a farmer named Lyman Cutlar grew", startFrame: 176, endFrame: 226, line: 2 },
  { phrase: "potatoes. His neighbour's pig kept", startFrame: 228, endFrame: 287, line: 2 },
  { phrase: "eating them.", startFrame: 289, endFrame: 302, line: 2 },
  { phrase: "The pig belonged to Charles", startFrame: 315, endFrame: 349, line: 3 },
  { phrase: "Griffin, a British farm manager.", startFrame: 350, endFrame: 398, line: 3 },
  { phrase: "Cutlar offered ten dollars for it.", startFrame: 418, endFrame: 464, line: 3 },
  { phrase: "Griffin demanded a hundred.", startFrame: 485, endFrame: 520, line: 3 },
  { phrase: "So on June the 15th,", startFrame: 555, endFrame: 594, line: 4 },
  { phrase: "Cutlar shot the pig.", startFrame: 607, endFrame: 643, line: 4 },
  { phrase: "And Britain threatened to arrest", startFrame: 659, endFrame: 702, line: 4 },
  { phrase: "him.", startFrame: 704, endFrame: 708, line: 4 },
  { phrase: "America sent soldiers to protect", startFrame: 723, endFrame: 775, line: 5 },
  { phrase: "him. Captain George Pickett landed", startFrame: 776, endFrame: 840, line: 5 },
  { phrase: "with sixty-four men.", startFrame: 841, endFrame: 875, line: 5 },
  { phrase: "Britain sent warships.", startFrame: 889, endFrame: 919, line: 6 },
  { phrase: "By August, 461 American soldiers", startFrame: 933, endFrame: 1003, line: 6 },
  { phrase: "faced five British warships,", startFrame: 1007, endFrame: 1046, line: 6 },
  { phrase: "with over two thousand men and 167", startFrame: 1053, endFrame: 1087, line: 6 },
  { phrase: "guns.", startFrame: 1088, endFrame: 1097, line: 6 },
  { phrase: "But the British admiral refused to", startFrame: 1178, endFrame: 1235, line: 7 },
  { phrase: "fight. He would not start a war", startFrame: 1237, endFrame: 1290, line: 7 },
  { phrase: "over a squabble about a pig.", startFrame: 1293, endFrame: 1339, line: 7 },
  { phrase: "So both sides just stayed.", startFrame: 1352, endFrame: 1393, line: 8 },
  { phrase: "For twelve years,", startFrame: 1407, endFrame: 1432, line: 8 },
  { phrase: "American and British soldiers", startFrame: 1439, endFrame: 1478, line: 8 },
  { phrase: "shared one small island.", startFrame: 1484, endFrame: 1527, line: 8 },
  { phrase: "In 1872, the German Kaiser settled", startFrame: 1559, endFrame: 1636, line: 9 },
  { phrase: "it. The island went to America.", startFrame: 1637, endFrame: 1686, line: 9 },
  { phrase: "And the only casualty of the Pig", startFrame: 1699, endFrame: 1739, line: 9 },
  { phrase: "War was the pig.", startFrame: 1740, endFrame: 1776, line: 9 },
];
