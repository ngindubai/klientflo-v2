/** Dependency-free SVG donut chart with a legend. */
export const CHART_COLORS = [
  "#108BFF",
  "#65C1FF",
  "#006DD5",
  "#0EA5E9",
  "#6366F1",
  "#94A3B8",
];

export function Donut({
  data,
  size = 132,
}: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="shrink-0 -rotate-90"
      >
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-muted)" strokeWidth="16" />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * c;
            const seg = (
              <circle
                key={d.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-foreground-muted">
              {d.label}
            </span>
            <span className="shrink-0 font-medium tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
