import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AdminShell({ route, navigate, children }) {
  return (
    <div className="app-shell">
      <Sidebar route={route} navigate={navigate} />
      <div className="app-main">
        <TopBar route={route} />
        {children}
      </div>
    </div>
  );
}
