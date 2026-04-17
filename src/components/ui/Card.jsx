import "./Card.css";

export default function Card({ title, subtitle, actions, children, padded = true, className = "" }) {
  return (
    <section className={`ui-card ${className}`}>
      {(title || actions) && (
        <header className="ui-card-header">
          <div>
            {title && <h3 className="ui-card-title">{title}</h3>}
            {subtitle && <p className="ui-card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="ui-card-actions">{actions}</div>}
        </header>
      )}
      <div className={`ui-card-body ${padded ? "padded" : ""}`}>{children}</div>
    </section>
  );
}
