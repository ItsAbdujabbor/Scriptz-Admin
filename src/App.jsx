import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { authApi } from "./api/auth";
import { qk } from "./queries/keys";
import AdminShell from "./components/Layout/AdminShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersList from "./pages/users/UsersList";
import Analytics from "./pages/analytics/Analytics";
import Channels from "./pages/channels/Channels";
import ContentHub from "./pages/content/ContentHub";
import Logs from "./pages/logs/Logs";
import Config from "./pages/config/Config";

function parseHash() {
  const raw = (window.location.hash || "#/").replace(/^#/, "");
  const [pathname] = raw.split("?");
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/" || clean === "") return { page: "dashboard", path: "/" };
  const [, first] = clean.split("/");
  const page = first || "dashboard";
  return { page, path: clean };
}

export default function App() {
  const [route, setRoute] = useState(parseHash());
  const isAuth = useAuthStore((s) => !!s.session?.access_token);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (path) => {
    if (path === "/") window.location.hash = "/";
    else window.location.hash = path;
  };

  // Validate session against backend on mount (not when already on /login)
  const me = useQuery({
    queryKey: qk.me,
    queryFn: authApi.me,
    enabled: isAuth && route.page !== "login",
    retry: false,
  });

  useEffect(() => {
    if (me.isError && (me.error?.status === 401 || me.error?.status === 403)) {
      clear();
      if (route.page !== "login") window.location.hash = "/login";
    }
  }, [me.isError, me.error, clear, route.page]);

  if (!isAuth || route.page === "login") {
    return <Login navigate={navigate} />;
  }

  let Page;
  switch (route.page) {
    case "users": Page = UsersList; break;
    case "analytics": Page = Analytics; break;
    case "channels": Page = Channels; break;
    case "content": Page = ContentHub; break;
    case "logs": Page = Logs; break;
    case "config": Page = Config; break;
    default: Page = Dashboard;
  }

  return (
    <AdminShell route={route} navigate={navigate}>
      <Page />
    </AdminShell>
  );
}
