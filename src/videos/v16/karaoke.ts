// karaoke.ts - Timing TERUKUR WhisperX untuk Video16 Wojtek (History Rush #7).
// Diperbaiki 27 Nov 2026 dari audio/whisperx-transcript.json (model tiny, CPU,
// int8): tiap frasa = kata pertama start s.d. kata terakhir end, frame =
// round(detik * 30). Kata-kata SAMA PERSIS dengan SCRIPT.md L1-L9 (160 kata,
// rekonstruksi per baris diverifikasi dengan script). Pemetaan posisi dipakai
// untuk kata yang dieja WhisperX berbeda tapi bunyinya sama (Wojtek->Voitek,
// Cassino->Casino, soldiers->soldier, Two->II, sixteen->16,
// demobilised->demobilized); teks frasa TIDAK diubah.
// 33 frasa, maks 35 karakter, 1 baris 46px (spesifikasi Lustig v3).
// SATU-SATUNYA sumber timing teks; komposisi membaca file ini.
export type KaraokePhrase = { phrase: string; startFrame: number; endFrame: number; line: number };

export const KARAOKE: KaraokePhrase[] = [
  { phrase: "A bear joined the army", startFrame: 3, endFrame: 42, line: 1 },
  { phrase: "in World War Two. He had a rank,", startFrame: 45, endFrame: 113, line: 1 },
  { phrase: "a serial number, and a job.", startFrame: 126, endFrame: 183, line: 1 },
  { phrase: "In 1942, in Iran, Polish", startFrame: 196, endFrame: 284, line: 2 },
  { phrase: "soldiers bought an orphaned cub.", startFrame: 286, endFrame: 340, line: 2 },
  { phrase: "They named him Wojtek.", startFrame: 360, endFrame: 409, line: 2 },
  { phrase: "He wrestled with the soldiers.", startFrame: 420, endFrame: 456, line: 3 },
  { phrase: "He drank their beer.", startFrame: 464, endFrame: 491, line: 3 },
  { phrase: "He even learned to salute.", startFrame: 504, endFrame: 539, line: 3 },
  { phrase: "But pets were not allowed", startFrame: 563, endFrame: 601, line: 4 },
  { phrase: "on the ship to Italy. So the", startFrame: 603, endFrame: 654, line: 4 },
  { phrase: "army enlisted him. Private", startFrame: 656, endFrame: 714, line: 4 },
  { phrase: "Wojtek, serial number 253.", startFrame: 716, endFrame: 789, line: 4 },
  { phrase: "At Monte Cassino, in 1944, he", startFrame: 800, endFrame: 865, line: 5 },
  { phrase: "carried crates of artillery", startFrame: 866, endFrame: 899, line: 5 },
  { phrase: "shells, boxes so heavy they took", startFrame: 899, endFrame: 957, line: 5 },
  { phrase: "four men to lift. He never", startFrame: 960, endFrame: 1010, line: 5 },
  { phrase: "dropped one.", startFrame: 1012, endFrame: 1030, line: 5 },
  { phrase: "They promoted him.", startFrame: 1041, endFrame: 1062, line: 6 },
  { phrase: "Corporal Wojtek. And the bear", startFrame: 1074, endFrame: 1129, line: 6 },
  { phrase: "carrying a shell became his", startFrame: 1130, endFrame: 1172, line: 6 },
  { phrase: "company's symbol.", startFrame: 1175, endFrame: 1199, line: 6 },
  { phrase: "Then the war ended. His unit was", startFrame: 1223, endFrame: 1277, line: 7 },
  { phrase: "demobilised. Wojtek went to a zoo", startFrame: 1278, endFrame: 1347, line: 7 },
  { phrase: "in Edinburgh, and lived there", startFrame: 1349, endFrame: 1394, line: 7 },
  { phrase: "sixteen more years.", startFrame: 1397, endFrame: 1429, line: 7 },
  { phrase: "The soldiers still visited him.", startFrame: 1442, endFrame: 1486, line: 8 },
  { phrase: "He still answered when they", startFrame: 1508, endFrame: 1540, line: 8 },
  { phrase: "spoke Polish. But he never went", startFrame: 1541, endFrame: 1606, line: 8 },
  { phrase: "home again.", startFrame: 1608, endFrame: 1626, line: 8 },
  { phrase: "A bear became a soldier.", startFrame: 1654, endFrame: 1703, line: 9 },
  { phrase: "And the army was the only home", startFrame: 1717, endFrame: 1762, line: 9 },
  { phrase: "he ever had.", startFrame: 1764, endFrame: 1786, line: 9 },
];
