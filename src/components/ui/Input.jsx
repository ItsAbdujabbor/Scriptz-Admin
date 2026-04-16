import "./Input.css";

export function Input({ label, hint, error, className = "", ...rest }) {
  return (
    <label className={`ui-field ${error ? "has-error" : ""}`}>
      {label && <span className="ui-field-label">{label}</span>}
      <input className={`ui-input ${className}`} {...rest} />
      {error ? (
        <span className="ui-field-error">{error}</span>
      ) : hint ? (
        <span className="ui-field-hint">{hint}</span>
      ) : null}
    </label>
  );
}

export function Textarea({ label, hint, error, className = "", rows = 4, ...rest }) {
  return (
    <label className={`ui-field ${error ? "has-error" : ""}`}>
      {label && <span className="ui-field-label">{label}</span>}
      <textarea rows={rows} className={`ui-input ${className}`} {...rest} />
      {error ? (
        <span className="ui-field-error">{error}</span>
      ) : hint ? (
        <span className="ui-field-hint">{hint}</span>
      ) : null}
    </label>
  );
}

export function Select({ label, hint, error, children, className = "", ...rest }) {
  return (
    <label className={`ui-field ${error ? "has-error" : ""}`}>
      {label && <span className="ui-field-label">{label}</span>}
      <select className={`ui-input ${className}`} {...rest}>
        {children}
      </select>
      {error ? (
        <span className="ui-field-error">{error}</span>
      ) : hint ? (
        <span className="ui-field-hint">{hint}</span>
      ) : null}
    </label>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="ui-switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
      {label && <span className="ui-switch-label">{label}</span>}
    </label>
  );
}
