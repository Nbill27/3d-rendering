// Burned-in English captions for VIDEO14 (Peshtigo Fire).
// The text is EXACTLY the VO script (projects/peshtigo-fire/SCRIPT.md, L1-L10).
// Never translate it, never reword it, never paraphrase it.
// Timings are the measured VO timings (timings.json, Casper):
// start = clip_start_s, end = speech_end_s per line.
// Style (Molasses spec, Video05 captions.ts): Poppins ExtraBold 46px,
// outline 3px, maxWidth 920, marginBottom 430 - implemented in Video14.tsx
// KaraokeText (phrase-by-phrase, same words, same spec). This file is the
// line-level source of truth; karaoke.ts splits these lines into phrases.
export type Caption = { start: number; end: number; text: string };
export const CAPTIONS: Caption[] = [
  { start: 0.0, end: 5.42, text: "Everyone knows the Chicago Fire. Nobody knows the fire that killed five times as many people the same night." },
  { start: 5.49, end: 10.61, text: "October 8th, 1871. A small logging town in Wisconsin called Peshtigo." },
  { start: 10.57, end: 17.98, text: "That summer was one of the driest on record. The town was built of wood, its streets paved with wood chips, and fires had burned for days." },
  { start: 17.79, end: 22.71, text: "Then the wind came. A hundred miles an hour. The fire started making its own weather." },
  { start: 23.09, end: 28.22, text: "A tornado of flame swept through the town. In less than two hours, Peshtigo was gone." },
  { start: 28.21, end: 34.13, text: "People fled to the river and stood in the water while their town burned. Some drowned. Some froze." },
  { start: 34.03, end: 39.91, text: "Between 1,200 and 2,500 people died. It is still the deadliest wildfire in American history." },
  { start: 39.9, end: 42.56, text: "So why has nobody heard of it?" },
  { start: 42.82, end: 50.36, text: "Because that same night, 250 miles south, Chicago burned. Only 300 died there, but big cities make the news." },
  { start: 50.84, end: 56.44, text: "The deadliest wildfire in America was forgotten because a bigger city burned on the same night." },
];
