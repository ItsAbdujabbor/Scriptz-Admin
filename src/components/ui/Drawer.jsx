import { useEffect } from "react";
import { X } from "lucide-react";
import "./Drawer.css";

export default function Drawer({ open, onClose, title, subtitle, children, width = 520 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`ui-drawer-overlay ${open ? "is-open" : ""}`}
        onClick={onClose}
      />
      <aside
        className={`ui-drawer ${open ? "is-open" : ""}`}
        style={{ width }}
        aria-hidden={!open}
      >
        <header className="ui-drawer-header">
          <div>
            <h3 className="ui-drawer-title">{title}</h3>
            {subtitle && <p className="ui-drawer-subtitle">{subtitle}</p>}
          </div>
          <button className="ui-drawer-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="ui-drawer-body">{children}</div>
      </aside>
    </>
  );
}
