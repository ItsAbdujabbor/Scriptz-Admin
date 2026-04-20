import "./TopBar.css";

const TITLES = {
  dashboard: "Dashboard",
  users: "Users",
  analytics: "Analytics",
  channels: "Popular Channels",
  content: "Content",
  logs: "Logs & Monitoring",
  config: "Configuration",
};

const SUBTITLES = {
  dashboard: "Platform health at a glance",
  users: "Manage accounts, credits, and access",
  analytics: "Growth, usage, and revenue",
  channels: "Connected YouTube channels, 10K+ subscribers",
  content: "Styles, thumbnail templates, and feedback",
  logs: "Audit trail, usage events, errors",
  config: "Feature flags, billing, cloud costs, environment",
};

export default function TopBar({ route }) {
  const title = TITLES[route.page] || "Admin";
  const subtitle = SUBTITLES[route.page] || "";
  return (
    <header className="topbar">
      <div>
        <h1 className="topbar-title">{title}</h1>
        <p className="topbar-subtitle">{subtitle}</p>
      </div>
    </header>
  );
}
