import { useEffect } from "react";
import { X } from "lucide-react";
import "./Modal.css";

export default function Modal({ open, onClose, title, children, footer, width = 520 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div
        className="ui-modal"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="ui-modal-header">
          <h3>{title}</h3>
          <button className="ui-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="ui-modal-body">{children}</div>
        {footer && <footer className="ui-modal-footer">{footer}</footer>}
      </div>
    </div>
  );
}
