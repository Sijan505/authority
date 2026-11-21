// Small server-rendered charts for the admin dashboard. No client JS: each mark carries
// a native <title> tooltip, and every chart sits next to the numbers it draws.

const BAR = "var(--color-gold-dark)";

/** Daily counts as a column chart. `days` must be in date order. */
export function DailyBars({ days, label }: { days: { date: string; count: number }[]; label: string }) {
  const W = 640;
  const H = 180;
  const padL = 28;
  const padB = 24;
  const padT = 10;
  const max = Math.max(1, ...days.map((d) => d.count));
  const niceMax = max <= 4 ? max : Math.ceil(max / 5) * 5;
  const plotW = W - padL;
  const plotH = H - padB - padT;
  const slot = plotW / days.length;
  const barW = Math.max(2, slot - 2); // 2px gap between bars
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const ticks = [0, Math.round(days.length / 2), days.length - 1];

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
        {/* recessive grid: baseline + max line */}
        <line x1={padL} x2={W} y1={padT + plotH} y2={padT + plotH} stroke="#8b5e1a66" />
        <line x1={padL} x2={W} y1={padT} y2={padT} stroke="#8b5e1a26" strokeDasharray="3 3" />
        <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize="11" fill="var(--color-ink)">
          {niceMax}
        </text>
        <text x={padL - 6} y={padT + plotH + 4} textAnchor="end" fontSize="11" fill="var(--color-ink)">
          0
        </text>
        {days.map((d, i) => {
          const h = (d.count / niceMax) * plotH;
          const x = padL + i * slot + 1;
          const y = padT + plotH - h;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.date}>
              <title>{`${fmt(d.date)}: ${d.count} sign-up${d.count === 1 ? "" : "s"}`}</title>
              {/* hit target taller and wider than the mark */}
              <rect x={padL + i * slot} y={padT} width={slot} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${padT + plotH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${padT + plotH} Z`}
                  fill={BAR}
                />
              )}
            </g>
          );
        })}
        {ticks.map((i) => (
          <text
            key={i}
            x={padL + i * slot + slot / 2}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"}
            fontSize="11"
            fill="var(--color-ink)"
          >
            {fmt(days[i].date)}
          </text>
        ))}
      </svg>
    </figure>
  );
}

/** Labelled horizontal bars with the value printed beside each bar. */
export function BarList({
  rows,
  total,
  empty = "No data yet.",
}: {
  rows: { label: string; value: number }[];
  total?: number;
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.every((r) => r.value === 0)) return <p className="mt-3 text-base text-ink">{empty}</p>;
  return (
    <ul className="mt-3 space-y-2">
      {rows.map((r) => {
        const pct = total ? Math.round((r.value / Math.max(1, total)) * 100) : null;
        return (
          <li key={r.label} title={`${r.label}: ${r.value}${pct !== null ? ` (${pct}%)` : ""}`}>
            <div className="flex items-baseline justify-between gap-3 text-base">
              <span className="truncate text-brown">{r.label}</span>
              <span className="shrink-0 tabular-nums text-ink">
                {r.value}
                {pct !== null && <span className="ml-1 text-sm">({pct}%)</span>}
              </span>
            </div>
            <div className="mt-1 h-2 rounded bg-gold/15">
              <div className="h-2 rounded" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: BAR }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
