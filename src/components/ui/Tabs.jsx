import "./Tabs.css";

export default function Tabs({ value, onChange, tabs }) {
  return (
    <div className="ui-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          className={`ui-tab ${value === t.value ? "is-active" : ""}`}
          onClick={() => onChange(t.value)}
          type="button"
        >
          {t.label}
          {t.count != null && <span className="ui-tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
