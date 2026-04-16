import "./StatCard.css";
import { formatNumber } from "../../lib/format";

export default function StatCard({ label, value, hint, icon: Icon, tone = "neutral", formatter = formatNumber }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {Icon && <span className="stat-card-icon"><Icon size={16} /></span>}
      </div>
      <div className="stat-card-value">{typeof value === "string" ? value : formatter(value)}</div>
      {hint && <div className="stat-card-hint">{hint}</div>}
    </div>
  );
}
