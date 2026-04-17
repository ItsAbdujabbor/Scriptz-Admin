import { useMemo } from "react";
import "./LineChart.css";

export default function LineChart({ data = [], height = 180, valueKey = "value", color = "var(--accent)" }) {
  const { path, area, max, points } = useMemo(() => {
    const values = data.map((d) => Number(d[valueKey]) || 0);
    const max = Math.max(1, ...values);
    const w = 100;
    const h = 100;
    const step = values.length > 1 ? w / (values.length - 1) : 0;
    const pts = values.map((v, i) => [i * step, h - (v / max) * h]);
    const path = pts
      .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
      .join(" ");
    const area =
      pts.length > 1
        ? `${path} L ${pts[pts.length - 1][0]} ${h} L 0 ${h} Z`
        : "";
    return { path, area, max, points: pts };
  }, [data, valueKey]);

  if (!data.length) return <div className="ui-linechart-empty" style={{ height }}>No data</div>;

  return (
    <div className="ui-linechart" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="ui-line-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {area && <path d={area} fill="url(#ui-line-grad)" />}
        <path d={path} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="ui-linechart-axis">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
