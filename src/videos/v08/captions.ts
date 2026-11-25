// Burned-in English captions for VIDEO08 (Annie Edson Taylor).
// The text is EXACTLY the VO script (projects/annie-taylor/SCRIPT.md, L1-L10).
// Never translate it, never reword it, never paraphrase it.
// Timings are MEASURED VO timings from the recorded Casper clips
// (2026-11-26 05:22 WIB): L1 0.00/6.42, L2 6.67/6.45, L3 13.37/5.29,
// L4 18.91/5.08, L5 24.59/6.02, L6 30.86/4.68, L7 35.79/3.83,
// L8 39.87/5.77, L9 46.24/4.18, L10 51.12/5.56 (start/trimmed duration).
// Gaps: 0.25s inside beats, 0.60s between beats, 0.70s before L10.
// Voice ends 56.68s. The text stays untouched.
export type Caption = { start: number; end: number; text: string };
export const CAPTIONS: Caption[] = [
  { start: 0.0, end: 6.42, text: "She was sixty-three, broke, and out of options. So she climbed into a barrel and went over Niagara Falls." },
  { start: 6.67, end: 13.12, text: "Annie Edson Taylor, a broke schoolteacher, had one wild idea: be the first person to survive the falls in a barrel." },
  { start: 13.37, end: 18.66, text: "She knew the stakes. In her own words: fame and fortune, or instant death." },
  { start: 18.91, end: 23.99, text: "She designed the barrel herself: oak and iron, and tested it by sending her cat over the falls first." },
  { start: 24.59, end: 30.61, text: "On her sixty-third birthday, October twenty-fourth, nineteen-oh-one, she climbed in, and friends sealed the lid." },
  { start: 30.86, end: 35.54, text: "They pumped it full of air with a bicycle pump, then set her adrift above the falls." },
  { start: 35.79, end: 39.62, text: "The current grabbed her, and she dropped a hundred and sixty-seven feet." },
  { start: 39.87, end: 45.64, text: "Seventeen minutes later, rescuers opened the barrel. Annie climbed out alive, with only a small cut on her head." },
  { start: 46.24, end: 50.42, text: "She got the fame. Crowds cheered. But the fortune never came." },
  { start: 51.12, end: 56.68, text: "She sold photos and told her story for twenty years, and died poor in nineteen twenty-one." },
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
