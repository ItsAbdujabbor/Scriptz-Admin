import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Card from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
import DataTable, { Pagination } from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import { logsApi } from "../../api/logs";
import { qk } from "../../queries/keys";
import { formatDateTime, formatRelative } from "../../lib/format";

export default function Logs() {
  const [tab, setTab] = useState("audit");

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "audit", label: "Audit trail" },
            { value: "events", label: "Usage events" },
            { value: "errors", label: "Errors" },
          ]}
        />
      </div>
      {tab === "audit" && <AuditTab />}
      {tab === "events" && <EventsTab />}
      {tab === "errors" && <ErrorsTab />}
    </div>
  );
}

function AuditTab() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const params = { page, page_size: 50, action: action || undefined, user_id: userId || undefined };
  const { data, isLoading } = useQuery({ queryKey: qk.audit(params), queryFn: () => logsApi.audit(params) });

  const columns = [
    { key: "created_at", header: "When", width: 160, cell: (r) => (
      <span title={formatDateTime(r.created_at)}>{formatRelative(r.created_at)}</span>
    ) },
    { key: "action", header: "Action", cell: (r) => <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.action}</code> },
    { key: "user_id", header: "Actor" },
    { key: "resource_type", header: "Resource", cell: (r) => r.resource_type ? `${r.resource_type}:${r.resource_id || ""}` : "—" },
    { key: "ip_address", header: "IP" },
    { key: "details", header: "Details", cell: (r) => (
      <code style={{ fontSize: 11, color: "var(--text-secondary)" }}>
        {r.details ? JSON.stringify(r.details).slice(0, 80) : "—"}
      </code>
    ) },
  ];

  return (
    <Card
      title={`Audit log${data ? ` (${data.total})` : ""}`}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <input className="ui-input" placeholder="Filter action" value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }} />
          <input className="ui-input" placeholder="Actor user ID" value={userId} onChange={(e) => { setPage(1); setUserId(e.target.value); }} style={{ width: 140 }} />
        </div>
      }
      padded={false}
    >
      <DataTable columns={columns} rows={data?.items || []} loading={isLoading} empty="No audit events." />
      <Pagination page={page} pageSize={50} total={data?.total || 0} onChange={setPage} />
    </Card>
  );
}

function EventsTab() {
  const [page, setPage] = useState(1);
  const [feature, setFeature] = useState("");
  const [userId, setUserId] = useState("");
  const params = { page, page_size: 50, feature: feature || undefined, user_id: userId || undefined };
  const { data, isLoading } = useQuery({ queryKey: qk.events(params), queryFn: () => logsApi.events(params) });

  const columns = [
    { key: "created_at", header: "When", width: 160, cell: (r) => (
      <span title={formatDateTime(r.created_at)}>{formatRelative(r.created_at)}</span>
    ) },
    { key: "feature_key", header: "Feature", cell: (r) => (
      <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.feature_key}</code>
    ) },
    { key: "user_id", header: "User" },
    { key: "credits_charged", header: "Credits", align: "right" },
    { key: "metadata", header: "Meta", cell: (r) => (
      <code style={{ fontSize: 11, color: "var(--text-secondary)" }}>
        {r.metadata ? JSON.stringify(r.metadata).slice(0, 80) : "—"}
      </code>
    ) },
  ];

  return (
    <Card
      title={`Usage events${data ? ` (${data.total})` : ""}`}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <input className="ui-input" placeholder="Feature key" value={feature} onChange={(e) => { setPage(1); setFeature(e.target.value); }} />
          <input className="ui-input" placeholder="User ID" value={userId} onChange={(e) => { setPage(1); setUserId(e.target.value); }} style={{ width: 140 }} />
        </div>
      }
      padded={false}
    >
      <DataTable columns={columns} rows={data?.items || []} loading={isLoading} empty="No usage events." />
      <Pagination page={page} pageSize={50} total={data?.total || 0} onChange={setPage} />
    </Card>
  );
}

function ErrorsTab() {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState("");
  const params = { page, page_size: 50, level: level || undefined };
  const { data, isLoading } = useQuery({ queryKey: qk.errors(params), queryFn: () => logsApi.errors(params) });

  const [expanded, setExpanded] = useState(null);

  const columns = [
    { key: "created_at", header: "When", width: 160, cell: (r) => (
      <span title={formatDateTime(r.created_at)}>{formatRelative(r.created_at)}</span>
    ) },
    { key: "level", header: "Level", cell: (r) => (
      <Badge tone={r.level === "error" ? "danger" : "warning"}>{r.level}</Badge>
    ) },
    { key: "message", header: "Message", cell: (r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.message}</span> },
    { key: "path", header: "Path" },
    { key: "status_code", header: "Status", align: "right" },
  ];

  return (
    <>
      <Card
        title={`Errors${data ? ` (${data.total})` : ""}`}
        actions={
          <select className="ui-input" value={level} onChange={(e) => { setPage(1); setLevel(e.target.value); }}>
            <option value="">Any level</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
        }
        padded={false}
      >
        <DataTable columns={columns} rows={data?.items || []} loading={isLoading} empty="No errors recorded." onRowClick={setExpanded} />
        <Pagination page={page} pageSize={50} total={data?.total || 0} onChange={setPage} />
      </Card>

      {expanded && (
        <div
          onClick={() => setExpanded(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 720, width: "100%", maxHeight: "80vh", overflow: "auto",
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>{expanded.message}</h3>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
              {formatDateTime(expanded.created_at)} · {expanded.method} {expanded.path} · req {expanded.request_id}
            </div>
            <pre style={{ fontSize: 12, whiteSpace: "pre-wrap", background: "var(--bg-primary)", padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
              {expanded.stack || "—"}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
