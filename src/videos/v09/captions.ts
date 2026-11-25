// Burned-in English captions for VIDEO09 (The London Beer Flood).
// The text is EXACTLY the VO script (projects/beer-flood/SCRIPT.md, L1-L10).
// Never translate it, never reword it, never paraphrase it.
// Timings are MEASURED VO timings from the recorded Casper clips
// (2026-11-26 05:53 WIB): L1 0.00/4.84, L2 5.09/5.33, L3 10.67/6.37,
// L4 17.29/5.43, L5 23.32/4.97, L6 28.54/4.85, L7 33.64/6.02,
// L8 39.91/4.90, L9 45.41/5.15, L10 51.26/6.52 (start/trimmed duration).
// Gaps: 0.25s inside beats, 0.60s between beats, 0.70s before L10.
// Voice ends 57.78s. The text stays untouched.
export type Caption = { start: number; end: number; text: string };
export const CAPTIONS: Caption[] = [
  { start: 0.0, end: 4.84, text: "In eighteen fourteen, a wave of beer flooded London. And it killed eight people." },
  { start: 5.09, end: 10.42, text: "At Meux's Horse Shoe Brewery, one wooden vat stood twenty-two feet tall, full of porter." },
  { start: 10.67, end: 17.04, text: "On October seventeenth, a seven-hundred-pound iron ring slipped off. The clerk wrote a note to fix it later." },
  { start: 17.29, end: 22.72, text: "An hour later, the vat exploded, knocking open a second vat and smashing the barrels around it." },
  { start: 23.32, end: 28.29, text: "More than a million litres of beer smashed through the wall in a wave fifteen feet high." },
  { start: 28.54, end: 33.39, text: "It poured into the cellars of St Giles, where a family held a wake for a two-year-old boy." },
  { start: 33.64, end: 39.66, text: "All five mourners drowned. So did a four-year-old girl at tea, and a teenage servant under a wall." },
  { start: 39.91, end: 44.81, text: "Eight people dead, all women and children. No one inside the brewery was killed." },
  { start: 45.41, end: 50.56, text: "The brewery went to court. The judge called it an act of God, so the families got nothing." },
  { start: 51.26, end: 57.78, text: "The brewery survived. The giant vats did not. Today, a theatre stands where the beer once flowed." },
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
