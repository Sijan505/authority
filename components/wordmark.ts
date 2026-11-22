// The AUTHORITY wordmark gradient (same stops as .wordmark-gradient in globals.css),
// as [position, r, g, b]. Used to colour letters one by one when each letter is
// animated separately, since a background-clip gradient doesn't paint transformed children.
const WORDMARK_STOPS = [
  [0, 0x3b, 0x1a, 0x12],
  [0.35, 0x6b, 0x3a, 0x10],
  [0.65, 0xa0, 0x6a, 0x18],
  [1, 0xc8, 0x96, 0x2a],
] as const;

/** The gradient's colour at position t (0 → 1). */
export function gradientAt(t: number) {
  const hi = Math.max(
    1,
    WORDMARK_STOPS.findIndex((s) => s[0] >= t),
  );
  const a = WORDMARK_STOPS[hi - 1];
  const b = WORDMARK_STOPS[hi];
  const k = (t - a[0]) / (b[0] - a[0]);
  const mix = (j: 1 | 2 | 3) => Math.round(a[j] + (b[j] - a[j]) * k);
  return `rgb(${mix(1)} ${mix(2)} ${mix(3)})`;
}

/** Colour for letter i of a word of length n. */
export const letterColour = (i: number, n: number) => gradientAt(n > 1 ? i / (n - 1) : 0);
