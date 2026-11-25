// Burned-in English captions for VIDEO05 (Great Molasses Flood).
// The text is EXACTLY the VO script (projects/molasses-flood/SCRIPT.md, L1-L10).
// Never translate it, never reword it, never paraphrase it.
// Timings are the measured VO timings (recorded 2026-11-26, Casper):
// start/end per line from mo_timeline.py in the project audio folder.
// The text is untouched and exactly the VO script.
export type Caption = { start: number; end: number; text: string };
export const CAPTIONS: Caption[] = [
  { start: 0.0, end: 2.44, text: "How did a wave of syrup kill 21 people?" },
  { start: 2.69, end: 9.23, text: "On January 15th, 1919, a giant tank in Boston held two point three million gallons of molasses." },
  { start: 9.48, end: 15.15, text: "The tank was badly built. Its steel was too thin, it leaked, and nobody ever tested it properly." },
  { start: 15.4, end: 20.99, text: "That day, the weather warmed up fast, and the molasses inside started to expand." },
  { start: 21.59, end: 24.43, text: "At half past twelve, the tank burst open." },
  { start: 24.68, end: 29.16, text: "A twenty-five-foot wave of syrup swept down the street at thirty-five miles an hour." },
  { start: 29.41, end: 34.4, text: "It was forty percent heavier than water, and it thickened in the cold. People could not run through it." },
  { start: 34.65, end: 40.15, text: "The wave smashed buildings, lifted a train off its tracks, and trapped people where they stood." },
  { start: 40.75, end: 46.15, text: "Twenty-one people died. A hundred and fifty were injured. It took weeks to clean the streets." },
  { start: 46.85, end: 54.42, text: "The company was found guilty and paid for it. And for decades, people said Boston still smelled of molasses on hot days." },
];

/** the caption active at story time t (seconds), or null in the gaps */
export const captionAt = (t: number): string | null => {
  const c = CAPTIONS.find((x) => t >= x.start && t < x.end);
  return c ? c.text : null;
};

/** split a caption into at most 2 balanced lines (word boundaries only, words never change).
 *  Both lines must fit maxChars; if no split satisfies that, the most balanced split wins. */
export const wrapCaption = (text: string, maxChars = 44): string[] => {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  let best = 1, bestDiff = Infinity, anyFit = false;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length, b = words.slice(i).join(" ").length;
    const fits = a <= maxChars && b <= maxChars, diff = Math.abs(a - b);
    if (fits && (!anyFit || diff < bestDiff)) { best = i; bestDiff = diff; anyFit = true; }
    else if (!anyFit && diff < bestDiff) { best = i; bestDiff = diff; }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
};

/** layout for one caption: font shrinks for long lines so the text always fits in 2 lines
 *  at 920 px width (measured: ~0.52 em per char for bold Arial, with margin). */
export const captionLayout = (text: string): { fontSize: number; lines: string[] } => {
  const len = text.length;
  const fontSize = len <= 76 ? 46 : len <= 88 ? 40 : len <= 104 ? 34 : len <= 110 ? 32 : 30;
  const maxChars = Math.floor(920 / (fontSize * 0.52));
  return { fontSize, lines: wrapCaption(text, maxChars) };
};
