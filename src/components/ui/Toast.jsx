import { createContext, useCallback, useContext, useState } from "react";
import "./Toast.css";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    const entry = { id, tone: "info", duration: 3500, ...toast };
    setItems((prev) => [...prev, entry]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, entry.duration);
  }, []);

  const api = {
    info: (message) => push({ message, tone: "info" }),
    success: (message) => push({ message, tone: "success" }),
    error: (message) => push({ message, tone: "error" }),
    warning: (message) => push({ message, tone: "warning" }),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="ui-toast-stack">
        {items.map((t) => (
          <div key={t.id} className={`ui-toast tone-${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
