"use client";
import { type KeyboardEvent, type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/components/admin/api";

// Website visits on the dashboard: page views and visitors per Nepal day,
// one axis (both are counts), monotone curves that never overshoot below
// zero, a crosshair tooltip (mouse and arrow keys) and a table view.

type Point = { date: string; views: number; visitors: number };
type Summary = { series: Point[]; totals: { views: number; visitors: number }; topPages: { path: string; views: number }[]; countingSince: string | null };

const SERIES = [
  { key: "views" as const, label: "Page views", className: "adm-series-1" },
  { key: "visitors" as const, label: "Visitors", className: "adm-series-2" },
];
const HEIGHT = 260;
const PAD = { top: 16, right: 76, bottom: 28, left: 40 };
const fmt = new Intl.NumberFormat("en-IN");
const dayLabel = (iso: string, long = false) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", ...(long ? { weekday: "short", year: "numeric" } : {}) }).format(new Date(`${iso}T00:00:00Z`));
const pageName = (path: string) => (path === "/" ? "Home" : path.replace(/^\//, "").replace(/[-/]/g, " ").replace(/\b\w/, (c) => c.toUpperCase()));

// Round the top of the axis up to 1, 2 or 5 times a power of ten.
function niceMax(value: number) {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * power >= value / 4)! * power;
  return step * 4;
}

// Monotone cubic (Fritsch-Carlson): smooth, but never above or below the data.
function smoothPath(points: [number, number][]) {
  if (points.length < 2) return "";
  const n = points.length;
  const dx = points.slice(1).map((p, i) => p[0] - points[i][0]);
  const slope = points.slice(1).map((p, i) => (p[1] - points[i][1]) / dx[i]);
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    return slope[i - 1] * slope[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]);
  });
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + h * tangent[i]} ${x1 - h},${y1 - h * tangent[i + 1]} ${x1},${y1}`;
  }
  return d;
}

export default function TrafficChart() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await api<Summary>(`/api/admin/traffic?days=${days}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [days]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, [asTable]);

  const series = useMemo(() => data?.series ?? [], [data]);
  const geometry = useMemo(() => {
    const max = niceMax(Math.max(0, ...series.map((p) => Math.max(p.views, p.visitors))));
    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (series.length <= 1 ? 0 : (i / (series.length - 1)) * plotW);
    const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
    const lines = SERIES.map((s) => {
      const pts = series.map((p, i) => [x(i), y(p[s.key])] as [number, number]);
      const line = smoothPath(pts);
      const area = line ? `${line} L${x(series.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";
      return { ...s, line, area, end: pts[pts.length - 1] };
    });
    const ticks = [0, 1, 2, 3, 4].map((k) => (max / 4) * k);
    const every = series.length > 60 ? 14 : series.length > 14 ? 7 : 1;
    const xLabels = series.map((p, i) => ({ i, label: dayLabel(p.date) })).filter(({ i }) => (series.length - 1 - i) % every === 0);
    return { x, y, lines, ticks, xLabels, plotW, plotH };
  }, [series, width]);

  const empty = data !== null && data.totals.views === 0;

  function pick(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const rel = (event.clientX - box.left) / box.width;
    setActive(Math.round(rel * (series.length - 1)));
  }
  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (!series.length) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setActive((cur) => Math.min(series.length - 1, Math.max(0, (cur ?? series.length - 1) + (cur === null ? 0 : step))));
    } else if (event.key === "Escape") setActive(null);
  }

  const point = active !== null ? series[active] : null;
  const maxPage = Math.max(1, ...(data?.topPages ?? []).map((p) => p.views));

  return (
    <section className="adm-card adm-traffic" aria-labelledby="adm-traffic-title">
      <header className="adm-traffic-head">
        <div>
          <h2 id="adm-traffic-title">Website visits</h2>
          <p className="adm-muted">Counted without cookies; bots and admin pages are left out.</p>
        </div>
        <div className="adm-segmented" role="group" aria-label="Period">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" aria-pressed={days === d} onClick={() => { setActive(null); setDays(d); }}>{d} days</button>
          ))}
        </div>
      </header>

      <dl className="adm-traffic-legend">
        {SERIES.map((s) => (
          <div key={s.key}>
            <dt><span className={`adm-swatch ${s.className}`} aria-hidden="true" />{s.label}</dt>
            <dd className="num">{data ? fmt.format(data.totals[s.key]) : "…"}</dd>
          </div>
        ))}
      </dl>

      {error && <p className="admin-message admin-error" role="alert">{error} <button type="button" className="admin-link-button" onClick={load}>Try again</button></p>}

      <div className="adm-traffic-body">
        <div className="adm-traffic-plot">
          {asTable ? (
            <div className="adm-table-scroll">
              <table className="admin-table">
                <caption className="visually-hidden">Page views and visitors per day</caption>
                <thead><tr><th scope="col">Day</th><th scope="col">Page views</th><th scope="col">Visitors</th></tr></thead>
                <tbody>
                  {[...series].reverse().map((p) => (
                    <tr key={p.date}><td>{dayLabel(p.date, true)}</td><td className="num">{fmt.format(p.views)}</td><td className="num">{fmt.format(p.visitors)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div ref={frame} className="adm-chart-frame" tabIndex={0} role="group" onKeyDown={keys} onBlur={() => setActive(null)}
              aria-label={data ? `Line chart of page views and visitors over the last ${days} days: ${fmt.format(data.totals.views)} page views and ${fmt.format(data.totals.visitors)} visitors in total. Use the arrow keys to read each day.` : "Loading the visits chart"}
              aria-busy={data === null}>
              <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden="true">
                <defs>
                  {SERIES.map((s) => (
                    <linearGradient key={s.key} id={`adm-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" className={`${s.className} adm-stop-top`} />
                      <stop offset="100%" className={`${s.className} adm-stop-bottom`} />
                    </linearGradient>
                  ))}
                </defs>
                {geometry.ticks.map((t) => (
                  <g key={t}>
                    <line className="adm-grid" x1={PAD.left} x2={PAD.left + geometry.plotW} y1={geometry.y(t)} y2={geometry.y(t)} />
                    <text className="adm-axis" x={PAD.left - 8} y={geometry.y(t)} dy="0.32em" textAnchor="end">{fmt.format(t)}</text>
                  </g>
                ))}
                {geometry.xLabels.map(({ i, label }) => (
                  <text key={i} className="adm-axis" x={geometry.x(i)} y={HEIGHT - 8} textAnchor="middle">{label}</text>
                ))}
                {data && geometry.lines.map((l) => <path key={`a-${l.key}`} d={l.area} fill={`url(#adm-fill-${l.key})`} />)}
                {data && geometry.lines.map((l) => <path key={`l-${l.key}`} className={`adm-line ${l.className}`} d={l.line} />)}
                {data && !empty && geometry.lines.map((l) => l.end && (
                  <text key={`t-${l.key}`} className="adm-end-label" x={l.end[0] + 10} y={l.end[1]} dy="0.32em">{l.label}</text>
                ))}
                {point && (
                  <g>
                    <line className="adm-crosshair" x1={geometry.x(active!)} x2={geometry.x(active!)} y1={PAD.top} y2={PAD.top + geometry.plotH} />
                    {SERIES.map((s) => (
                      <circle key={s.key} className={`adm-dot ${s.className}`} cx={geometry.x(active!)} cy={geometry.y(point[s.key])} r={5} />
                    ))}
                  </g>
                )}
                <rect x={PAD.left} y={PAD.top} width={geometry.plotW} height={geometry.plotH} fill="transparent" onPointerMove={pick} onPointerLeave={() => setActive(null)} />
              </svg>
              {point && (
                <div className="adm-tooltip" style={{ left: Math.min(Math.max(geometry.x(active!), 90), width - 90) }} role="status">
                  <strong>{dayLabel(point.date, true)}</strong>
                  {SERIES.map((s) => (
                    <span key={s.key}><span className={`adm-swatch ${s.className}`} aria-hidden="true" />{s.label}<b className="num">{fmt.format(point[s.key])}</b></span>
                  ))}
                </div>
              )}
              {empty && (
                <p className="adm-chart-empty">
                  {data?.countingSince ? `No visits in this period. Counting started on ${dayLabel(data.countingSince, true)}.` : "No visits recorded yet. They appear here as people browse the website."}
                </p>
              )}
            </div>
          )}
          <button type="button" className="admin-link-button" onClick={() => { setActive(null); setAsTable(!asTable); }}>{asTable ? "Show as chart" : "Show as table"}</button>
        </div>

        <div className="adm-top-pages">
          <h3>Most visited pages</h3>
          {data && data.topPages.length === 0 ? (
            <p className="adm-muted">Nothing yet for this period.</p>
          ) : (
            <ol>
              {(data?.topPages ?? []).map((p) => (
                <li key={p.path}>
                  <span className="adm-top-name" title={p.path}>{pageName(p.path)}</span>
                  <span className="num">{fmt.format(p.views)}</span>
                  <span className="adm-top-bar" aria-hidden="true"><span style={{ transform: `scaleX(${p.views / maxPage})` }} /></span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
