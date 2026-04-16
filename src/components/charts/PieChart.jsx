import { useMemo, useState } from "react";
import "./PieChart.css";

const PALETTE = [
  "#7c3aed", "#0a84ff", "#30d158", "#ffd60a", "#ff9f0a",
  "#ff375f", "#64d2ff", "#bf5af2", "#5e5ce6", "#ff453a",
];

function polar(cx, cy, r, angle) {
  const a = (angle - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx, cy, rOuter, rInner, a0, a1) {
  const [x0o, y0o] = polar(cx, cy, rOuter, a0);
  const [x1o, y1o] = polar(cx, cy, rOuter, a1);
  const [x0i, y0i] = polar(cx, cy, rInner, a1);
  const [x1i, y1i] = polar(cx, cy, rInner, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1o} ${y1o} L ${x0i} ${y0i} A ${rInner} ${rInner} 0 ${large} 0 ${x1i} ${y1i} Z`;
}

export default function PieChart({
  data = [],
  size = 200,
  thickness = 32,
  centerLabel,
  centerValue,
  formatter = (v) => v,
  showLegend = true,
}) {
  const [hover, setHover] = useState(null);
  const { slices, total } = useMemo(() => {
    const items = (data || []).filter((d) => Number(d.value) > 0);
    const total = items.reduce((a, b) => a + Number(b.value), 0) || 0;
    if (total === 0) return { slices: [], total: 0 };
    let acc = 0;
    const out = items.map((d, i) => {
      const pct = (Number(d.value) / total) * 100;
      const a0 = (acc / total) * 360;
      acc += Number(d.value);
      const a1 = (acc / total) * 360;
      return {
        ...d,
        color: d.color || PALETTE[i % PALETTE.length],
        a0,
        a1,
        pct,
      };
    });
    return { slices: out, total };
  }, [data]);

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = rOuter - thickness;

  if (!slices.length) {
    return (
      <div className="ui-pie-empty" style={{ height: size }}>
        No data
      </div>
    );
  }

  const active = hover ?? slices.reduce((a, b) => (b.value > a.value ? b : a), slices[0]);

  return (
    <div className="ui-pie">
      <div className="ui-pie-chart-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s) => (
            <path
              key={s.label}
              d={arcPath(cx, cy, rOuter, rInner, s.a0, s.a1)}
              fill={s.color}
              opacity={hover && hover.label !== s.label ? 0.4 : 1}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
              style={{ transition: "opacity 0.15s ease" }}
            />
          ))}
          <circle cx={cx} cy={cy} r={rInner - 1} fill="var(--bg-secondary)" />
        </svg>
        <div className="ui-pie-center">
          {centerLabel && <div className="ui-pie-center-label">{active?.label || centerLabel}</div>}
          <div className="ui-pie-center-value">
            {hover ? formatter(hover.value) : centerValue != null ? centerValue : formatter(total)}
          </div>
          {hover && (
            <div className="ui-pie-center-pct">{hover.pct.toFixed(1)}%</div>
          )}
        </div>
      </div>
      {showLegend && (
        <ul className="ui-pie-legend">
          {slices.map((s) => (
            <li
              key={s.label}
              className={hover?.label === s.label ? "is-active" : ""}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="ui-pie-swatch" style={{ background: s.color }} />
              <span className="ui-pie-legend-label">{s.label}</span>
              <span className="ui-pie-legend-value">{formatter(s.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
