import "./Skeleton.css";

export default function Skeleton({
  w = "100%",
  h = 14,
  r = 6,
  className = "",
  style,
  inline = false,
}) {
  return (
    <span
      className={`ui-skeleton${inline ? " is-inline" : ""}${className ? ` ${className}` : ""}`}
      style={{ width: w, height: h, borderRadius: r, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 1, w = "100%", gap = 8 }) {
  const rows = [];
  for (let i = 0; i < lines; i++) {
    const width = Array.isArray(w) ? w[i % w.length] : w;
    rows.push(<Skeleton key={i} h={12} w={width} r={4} />);
  }
  return (
    <span className="ui-skeleton-text" style={{ gap }}>
      {rows}
    </span>
  );
}
