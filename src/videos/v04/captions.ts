// Burned-in English captions for VIDEO04 (Emu War).
// The text is EXACTLY the VO script (projects/emu-war/SCRIPT.md, L1-L10).
// Never translate it, never reword it, never paraphrase it.
// Timings are the measured VO timings (audio/ah_timeline.py): each caption
// starts when its VO line starts and ends when the trimmed clip ends.
// Edit only the start/end numbers below if the VO is re-recorded;
// the text stays untouched.
export type Caption = { start: number; end: number; text: string };
export const CAPTIONS: Caption[] = [
  { start: 0.0, end: 6.52, text: "In 1932, Australia sent soldiers with machine guns to fight birds. The birds won." },
  { start: 6.69, end: 10.96, text: "After the First World War, soldiers were given wheat farms in Western Australia." },
  { start: 11.13, end: 17.53, text: "Then a drought drove twenty thousand emus into the farms. They ate the wheat and smashed the fences." },
  { start: 17.7, end: 20.98, text: "The farmers were losing everything, so they called the army." },
  { start: 21.5, end: 26.64, text: "On November 2nd, Major Meredith arrived with two machine guns and ten thousand rounds." },
  { start: 26.81, end: 31.09, text: "But the emus scattered in small groups and ran fifty kilometers an hour." },
  { start: 31.26, end: 37.77, text: "At a watering hole, a thousand emus came to drink. The gun jammed after twelve birds, and the rest escaped." },
  { start: 37.94, end: 42.23, text: "They even mounted a gun on a truck. The emus simply outran it." },
  { start: 42.75, end: 47.82, text: "After weeks of fighting, only about a thousand emus were dead, out of twenty thousand." },
  { start: 48.44, end: 55.87, text: "The army called it off. Meredith himself said the emus could face machine guns with the invulnerability of tanks." },
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
