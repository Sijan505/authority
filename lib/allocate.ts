// Splitting a period's net sales between shareholders. Pure functions, no database,
// so they can be tested on their own. All money is in paisa (NPR 0.01) as BigInt, and
// ownership is in basis points (hundredths of a percent): 100% = 10,000.

export const FULL_SHARE = 10_000;

export type Share = { id: string; basisPoints: number };

/**
 * Splits `total` paisa by ownership with the largest-remainder method:
 * 1. each shareholder gets the whole paisa of their exact share (rounded down);
 * 2. the few paisa left over go, one each, to those whose exact share had the
 *    largest fraction cut off (ties: larger ownership first, then id, so the result
 *    never depends on list order).
 * The amounts always add up to exactly `total`. The shares must total 100%.
 */
export function allocate(total: bigint, shares: Share[]): Map<string, bigint> {
  if (total < BigInt(0)) throw new Error("Net sales cannot be negative.");
  const sum = shares.reduce((s, x) => s + x.basisPoints, 0);
  if (sum !== FULL_SHARE) throw new Error(`Ownership must total 100% (it is ${formatPercent(sum)}).`);
  if (new Set(shares.map((s) => s.id)).size !== shares.length) throw new Error("A shareholder is listed twice.");

  const full = BigInt(FULL_SHARE);
  const rows = shares.map((s) => {
    const exact = total * BigInt(s.basisPoints); // the share × 10,000
    return { ...s, amount: exact / full, cut: exact % full };
  });
  let left = total - rows.reduce((s, r) => s + r.amount, BigInt(0));
  rows.sort((a, b) => (a.cut === b.cut ? b.basisPoints - a.basisPoints || a.id.localeCompare(b.id) : a.cut > b.cut ? -1 : 1));
  for (const r of rows) {
    if (left === BigInt(0)) break;
    r.amount += BigInt(1);
    left -= BigInt(1);
  }
  return new Map(rows.map((r) => [r.id, r.amount]));
}

/** "35.5" or "35.50" → 3550 basis points; null if not 0.01–100 with at most two decimals. */
export function parsePercent(raw: string): number | null {
  const v = raw.trim().replace(/%$/, "").trim();
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) return null;
  const [whole, frac = ""] = v.split(".");
  const bp = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return bp >= 1 && bp <= FULL_SHARE ? bp : null;
}

/** 3550 → "35.50%". */
export const formatPercent = (bp: number) => `${(bp / 100).toFixed(2)}%`;

/** BigInt(123450) paisa → "NPR 1,234.50". */
export function formatPaisa(paisa: bigint) {
  const neg = paisa < BigInt(0);
  const abs = neg ? -paisa : paisa;
  const rupees = (abs / BigInt(100)).toLocaleString("en-IN");
  const p = (abs % BigInt(100)).toString().padStart(2, "0");
  return `${neg ? "−" : ""}NPR ${rupees}.${p}`;
}
