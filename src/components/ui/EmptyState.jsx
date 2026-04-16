import "./EmptyState.css";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="ui-empty">
      {Icon && <div className="ui-empty-icon"><Icon size={22} /></div>}
      {title && <h4 className="ui-empty-title">{title}</h4>}
      {description && <p className="ui-empty-desc">{description}</p>}
      {action}
    </div>
  );
}
