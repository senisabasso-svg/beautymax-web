export type Slice = { label: string; value: number; color: string };

export function Donut({
  title,
  caption,
  slices,
  center,
}: {
  title: string;
  caption?: string;
  slices: Slice[];
  center?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;

  return (
    <article className="border border-white/10 bg-white/[0.03] p-5">
      <header>
        <h2 className="font-serif text-2xl text-cream">{title}</h2>
        {caption ? <p className="mt-1 text-xs text-cream/45">{caption}</p> : null}
      </header>
      <div className="mt-5 flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(247,244,238,0.08)" strokeWidth="12" />
          {total > 0
            ? slices.map((slice) => {
                const length = (slice.value / total) * circumference;
                const gap = slices.length > 1 ? 2 : 0;
                const dash = Math.max(length - gap, 0);
                const node = (
                  <circle
                    key={slice.label}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-cursor}
                    strokeLinecap="butt"
                  />
                );
                cursor += length;
                return node;
              })
            : null}
        </svg>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-3xl text-gold">{center ?? String(total)}</p>
          <ul className="mt-3 space-y-1.5">
            {slices.length === 0 ? <li className="text-xs text-cream/40">Sin datos en este período</li> : null}
            {slices.map((slice) => (
              <li key={slice.label} className="flex items-center justify-between gap-3 text-xs text-cream/70">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: slice.color }} />
                  <span className="truncate">{slice.label}</span>
                </span>
                <span className="text-cream">{slice.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function Trend({
  title,
  caption,
  points,
  valueKey,
  formatValue,
}: {
  title: string;
  caption?: string;
  points: Array<{ date: string; [key: string]: string | number }>;
  valueKey: string;
  formatValue?: (value: number) => string;
}) {
  const values = points.map((point) => Number(point[valueKey] ?? 0));
  const max = Math.max(...values, 1);
  const sum = values.reduce((total, value) => total + value, 0);
  const width = 320;
  const height = 120;
  const pad = 8;
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const coords = values.map((value, index) => {
    const x = pad + index * step;
    const y = height - pad - (value / max) * (height - pad * 2);
    return { x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const curve = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = coords.length
    ? `${curve} L ${coords[coords.length - 1].x} ${height - pad} L ${coords[0].x} ${height - pad} Z`
    : "";
  const gradId = `trend-${valueKey}`;

  return (
    <article className="border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-cream">{title}</h2>
          {caption ? <p className="mt-1 text-xs text-cream/45">{caption}</p> : null}
        </div>
        <p className="font-serif text-3xl text-gold">{formatValue ? formatValue(sum) : sum}</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-32 w-full" role="img" aria-label={title}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A24A" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#C9A24A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((mark) => (
          <line
            key={mark}
            x1={pad}
            x2={width - pad}
            y1={height - pad - mark * (height - pad * 2)}
            y2={height - pad - mark * (height - pad * 2)}
            stroke="rgba(247,244,238,0.08)"
          />
        ))}
        {area ? <path d={area} fill={`url(#${gradId})`} /> : null}
        {line ? <polyline points={line} fill="none" stroke="#E8D29A" strokeWidth="2" /> : null}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.14em] text-cream/35">
        <span>{points[0]?.date.slice(5) ?? ""}</span>
        <span>{points.at(-1)?.date.slice(5) ?? ""}</span>
      </div>
    </article>
  );
}

export function MeterList({
  title,
  caption,
  rows,
}: {
  title: string;
  caption?: string;
  rows: Array<{ label: string; value: number; hint?: string }>;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <article className="border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-serif text-2xl text-cream">{title}</h2>
      {caption ? <p className="mt-1 text-xs text-cream/45">{caption}</p> : null}
      {rows.length === 0 ? <p className="mt-5 text-sm text-cream/40">Todavía no hay movimiento.</p> : null}
      <ul className="mt-5 space-y-3">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-cream/80">{row.label}</span>
              <span className="shrink-0 text-gold">{row.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
            {row.hint ? <p className="mt-1 text-[11px] text-cream/40">{row.hint}</p> : null}
          </li>
        ))}
      </ul>
    </article>
  );
}
