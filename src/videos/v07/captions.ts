// Burned-in English captions for VIDEO07 (Victor Lustig).
// The text is EXACTLY the VO script (projects/lustig/SCRIPT.md, L1-L10).
// Never translate it, never reword it, never paraphrase it.
// Timings are MEASURED from the recorded Casper VO (voice ends 52.28s);
// the text stays untouched.
export type Caption = { start: number; end: number; text: string };
export const CAPTIONS: Caption[] = [
  { start: 0.0, end: 3.55, text: "A con man sold the Eiffel Tower. Twice." },
  { start: 3.8, end: 10.74, text: "In May nineteen twenty-five, Victor Lustig read that the Eiffel Tower was rusting, and the city could barely afford to keep it standing." },
  { start: 10.99, end: 16.84, text: "So he forged government letters and invited the five biggest scrap dealers in Paris to a luxury hotel." },
  { start: 17.09, end: 23.07, text: "He told them the government had decided to tear the tower down, and seven thousand tons of iron were for sale." },
  { start: 23.67, end: 28.43, text: "The dealers believed him. He picked one, Andre Poisson, and took his money." },
  { start: 28.68, end: 32.6, text: "Then he fled to Austria, and waited to see if anyone would call the police." },
  { start: 32.85, end: 37.2, text: "Nobody did. Poisson was too embarrassed to admit he had bought the Eiffel Tower." },
  { start: 37.8, end: 43.73, text: "Months later, Lustig came back to Paris and tried the exact same trick on five new dealers." },
  { start: 43.98, end: 47.61, text: "But this time, the police were tipped off, and he had to flee to America." },
  { start: 48.31, end: 52.28, text: "He was never arrested for the Eiffel Tower. And the tower is still standing." },
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
