// Burned-in English captions for VIDEO06 (Tsutomu Yamaguchi).
// The text is EXACTLY the VO script (projects/yamaguchi/SCRIPT.md, L1-L10).
// Never translate it, never reword it, never paraphrase it.
// Timings are the MEASURED VO timings (avocado_v2:casper, voice ends 55.58s).
// Edit only the start/end numbers below if the VO is re-recorded;
// the text stays untouched.
export type Caption = { start: number; end: number; text: string };
export const CAPTIONS: Caption[] = [
  { start: 0.0, end: 4.34, text: "One man survived two atomic bombs. Three days apart." },
  { start: 4.59, end: 10.14, text: "Tsutomu Yamaguchi was a twenty-nine-year-old engineer from Nagasaki, on a business trip to Hiroshima." },
  { start: 10.39, end: 16.69, text: "On August sixth, nineteen forty-five, at eight fifteen in the morning, the first atomic bomb exploded three kilometers from him." },
  { start: 16.94, end: 21.0, text: "His eardrums burst, his skin burned, but he was alive." },
  { start: 21.6, end: 26.03, text: "The next day he went home to Nagasaki, bandaged and barely able to hear." },
  { start: 26.28, end: 32.48, text: "On August ninth, he was back at work, telling his boss about Hiroshima, when the second bomb fell." },
  { start: 32.73, end: 37.23, text: "Again, he was three kilometers from the blast. Again, he survived." },
  { start: 37.48, end: 41.04, text: "He had been in the wrong place twice. And he had walked away from both." },
  { start: 41.64, end: 49.83, text: "He lived to ninety-three. And in two thousand nine, Japan officially recognized him as the only person who survived both bombs." },
  { start: 50.53, end: 55.58, text: "One man. Two bombs. Three days. And he lived to tell the world about it." },
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

/** layout for one caption: split into at most 2 balanced lines, then shrink the font so the
 *  longest line actually fits 920 px (bold Arial runs ~0.58 em per char). The old fixed tiers
 *  let long captions (L2, L3, L9) wrap to a 3rd visual line inside the 920 px box. */
export const captionLayout = (text: string): { fontSize: number; lines: string[] } => {
  const lines = wrapCaption(text, 44);
  const longest = Math.max(...lines.map((l) => l.length));
  const fontSize = Math.max(22, Math.min(46, Math.floor(920 / (longest * 0.58))));
  return { fontSize, lines };
};
