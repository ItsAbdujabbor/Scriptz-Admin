import {
  LayoutDashboard,
  Users,
  BarChart3,
  Tv,
  Library,
  ImagePlus,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import "./Sidebar.css";
import { useAuthStore } from "../../stores/authStore";
import { authApi } from "../../api/auth";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { key: "users", label: "Users", icon: Users, path: "/users" },
  { key: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  { key: "channels", label: "Channels", icon: Tv, path: "/channels" },
  { key: "content", label: "Content", icon: Library, path: "/content" },
  { key: "thumbnail-refs", label: "Thumbnail refs", icon: ImagePlus, path: "/thumbnail-refs" },
  { key: "logs", label: "Logs", icon: FileText, path: "/logs" },
  { key: "config", label: "Config", icon: Settings, path: "/config" },
];

export default function Sidebar({ route, navigate }) {
  const user = useAuthStore((s) => s.getUser());
  const clear = useAuthStore((s) => s.clear);
  const refresh = useAuthStore((s) => s.getRefreshToken());

  const handleLogout = async () => {
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {}
    clear();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">S</div>
        <div>
          <div className="sidebar-brand-name">Scriptz</div>
          <div className="sidebar-brand-label">Admin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.path === "/"
              ? route.page === "dashboard"
              : route.page === item.key;
          return (
            <button
              key={item.key}
              className={`sidebar-link ${active ? "is-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {(user?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-email">{user?.email || "—"}</div>
            <div className="sidebar-user-role">Admin</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={14} /> Log out
        </button>
      </div>
    </aside>
  );
}
