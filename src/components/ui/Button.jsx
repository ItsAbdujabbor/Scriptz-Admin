import "./Button.css";

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}) {
  return (
    <Tag
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${loading ? "is-loading" : ""} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="ui-btn-spinner" /> : null}
      <span className="ui-btn-label">{children}</span>
    </Tag>
  );
}
