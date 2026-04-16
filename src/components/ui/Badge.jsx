import "./Badge.css";

export default function Badge({ tone = "neutral", children }) {
  return <span className={`ui-badge tone-${tone}`}>{children}</span>;
}
