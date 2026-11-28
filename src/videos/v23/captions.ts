// Burned-in English captions for VIDEO23 (Ghost Army).
// The text is EXACTLY the VO script (projects/history-60s/ghost-army/SCRIPT.md, L1-L10).
// Never translate it, never reword it, never paraphrase it.
// Timings are WhisperX-MEASURED from per-line alignment (audio/wx-lines/,
// model tiny, CPU, int8, mapped to mix v2 via build_mix.py VO+SPANS):
// line span = first word start to last word end.
// Style (Lustig v3 / Peshtigo / Wojtek / Pig War / Paraguayan War / Mincemeat /
// War of the Pacific): karaoke phrases, max 35 chars, 1 line 46px,
// maxWidth 920, marginBottom 430. This file is the line-level source of truth;
// karaoke.ts splits these lines into phrases.
export type Caption = { start: number; end: number; text: string };
export const CAPTIONS: Caption[] = [
  { start: 0.09, end: 4.09, text: "America built an army of inflatable tanks. It fooled Hitler's generals." },
  { start: 5.1, end: 13.32, text: "In 1944, the U.S. Army gathered 1,100 artists, engineers, and soldiers into one top-secret unit: the 23rd Headquarters Special Troops." },
  { start: 14.25, end: 19.24, text: "Their weapons were rubber tanks, fake radio chatter, and recordings of an army that did not exist." },
  { start: 20.27, end: 25.19, text: "A Sherman tank made of rubber, blown up with an air compressor. From a plane, it looked real." },
  { start: 25.97, end: 31.66, text: "From a listening post, it sounded real. Speakers on half-tracks played the noise of tanks, fifteen miles away." },
  { start: 32.52, end: 35.43, text: "In twenty-two operations across Europe, 1,100 men pretended to be thirty thousand." },
  { start: 36.54, end: 42.28, text: "Their last trick was their best. In March 1945, they faked a Rhine crossing, ten miles from the real one." },
  { start: 43.33, end: 47.61, text: "Six hundred rubber tanks lined the river. The Germans believed the crossing would happen there." },
  { start: 48.44, end: 53.15, text: "The real army crossed the Rhine almost untouched. The fake army had done its job." },
  { start: 54.38, end: 59.67, text: "One thousand one hundred men. Rubber tanks. And a secret the world did not learn until 1996." },
];
