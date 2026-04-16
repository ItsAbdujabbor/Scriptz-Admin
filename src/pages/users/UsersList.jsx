import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { qk } from "../../queries/keys";
import { usersApi } from "../../api/users";
import Card from "../../components/ui/Card";
import DataTable, { Pagination } from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import { Input, Select } from "../../components/ui/Input";
import UserDetailDrawer from "./UserDetailDrawer";
import { formatRelative } from "../../lib/format";

export default function UsersList() {
  const [filters, setFilters] = useState({ q: "", role: "", status: "" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const pageSize = 25;

  const params = { ...filters, page, page_size: pageSize };
  const { data, isLoading } = useQuery({
    queryKey: qk.users(params),
    queryFn: () => usersApi.list(params),
  });

  const columns = [
    {
      key: "email",
      header: "User",
      cell: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--accent)", color: "#fff",
              display: "grid", placeItems: "center",
              fontSize: 12, fontWeight: 700,
            }}
          >
            {(u.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 500 }}>{u.email}</span>
            {u.username && (
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                {u.username}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (u) => (
        <Badge
          tone={
            u.role === "admin" ? "accent" : u.role === "banned" ? "danger" : "neutral"
          }
        >
          {u.role}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => (
        <Badge tone={u.is_active ? "success" : "danger"}>
          {u.is_active ? "active" : "inactive"}
        </Badge>
      ),
    },
    {
      key: "selected_model_tier",
      header: "Tier",
      cell: (u) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {u.selected_model_tier || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      cell: (u) => <span style={{ color: "var(--text-secondary)" }}>{formatRelative(u.created_at)}</span>,
    },
  ];

  return (
    <div className="page">
      <Card
        title={`Users${data ? ` (${data.total})` : ""}`}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-tertiary)",
                }}
              />
              <input
                className="ui-input"
                style={{ paddingLeft: 30, width: 240 }}
                placeholder="Search email or username"
                value={filters.q}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, q: e.target.value }));
                }}
              />
            </div>
            <select
              className="ui-input"
              value={filters.role}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, role: e.target.value }));
              }}
            >
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="banned">Banned</option>
            </select>
            <select
              className="ui-input"
              value={filters.status}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, status: e.target.value }));
              }}
            >
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        }
        padded={false}
      >
        <DataTable
          columns={columns}
          rows={data?.items || []}
          loading={isLoading}
          onRowClick={(u) => setSelected(u.id)}
          empty="No users match your filters"
        />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data?.total || 0}
          onChange={setPage}
        />
      </Card>

      <UserDetailDrawer
        userId={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
