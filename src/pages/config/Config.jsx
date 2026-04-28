import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
import Badge from "../../components/ui/Badge";
import PieChart from "../../components/charts/PieChart";
import LineChart from "../../components/charts/LineChart";
import StatCard from "../../components/shared/StatCard";
import { Switch } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { configApi } from "../../api/config";
import { costsApi } from "../../api/costs";
import { qk } from "../../queries/keys";
import { formatCurrency, formatNumber, formatRelative } from "../../lib/format";
import { Cloud, Server, DollarSign } from "lucide-react";

export default function Config() {
  const [tab, setTab] = useState("flags");
  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "flags", label: "Feature flags" },
            { value: "billing", label: "Billing" },
            { value: "cloud", label: "Cloud costs" },
            { value: "env", label: "Environment" },
          ]}
        />
      </div>
      {tab === "flags" && <FlagsTab />}
      {tab === "billing" && <BillingTab />}
      {tab === "cloud" && <CloudCostsTab />}
      {tab === "env" && <EnvTab />}
    </div>
  );
}

function CloudCostsTab() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: qk.cloudCosts(days),
    queryFn: () => costsApi.cloud(days),
  });
  if (isLoading) return <div style={{ color: "var(--text-secondary)" }}>Loading cloud costs…</div>;
  if (!data) return null;

  const aws = data.aws || {};
  const gcp = data.gcp || {};
  const combinedTotal = data.total_usd || 0;
  const bothOk = aws.status === "ok" && gcp.status === "ok";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "fade-in 0.25s var(--ease)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Real billing data from AWS Cost Explorer + GCP Cloud Billing. Set env vars to enable.
        </div>
        <Tabs
          value={String(days)}
          onChange={(v) => setDays(Number(v))}
          tabs={[
            { value: "7", label: "7d" },
            { value: "30", label: "30d" },
            { value: "90", label: "90d" },
          ]}
        />
      </div>

      <div className="grid grid-3">
        <StatCard
          label="Combined spend"
          value={formatCurrency(combinedTotal)}
          icon={DollarSign}
          tone={bothOk ? "success" : "warning"}
          hint={`last ${days} days`}
          formatter={(v) => v}
        />
        <StatCard
          label="AWS"
          value={aws.status === "ok" ? formatCurrency(aws.total_usd || 0) : "Not configured"}
          icon={Cloud}
          tone={aws.status === "ok" ? "info" : "neutral"}
          formatter={(v) => v}
        />
        <StatCard
          label="GCP"
          value={gcp.status === "ok" ? formatCurrency(gcp.total_usd || 0) : "Not configured"}
          icon={Server}
          tone={gcp.status === "ok" ? "info" : "neutral"}
          formatter={(v) => v}
        />
      </div>

      <ProviderPanel title="AWS Cost Explorer" data={aws} />
      <ProviderPanel title="GCP Cloud Billing" data={gcp} />
    </div>
  );
}

function ProviderPanel({ title, data }) {
  if (data.status === "not_configured") {
    return (
      <Card title={title} actions={<Badge tone="warning">Not configured</Badge>}>
        <pre style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>
          {data.instructions}
        </pre>
      </Card>
    );
  }
  if (data.status === "error") {
    return (
      <Card title={title} actions={<Badge tone="danger">Error</Badge>}>
        <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 8 }}>{data.error}</div>
        <pre style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>
          {data.instructions}
        </pre>
      </Card>
    );
  }
  const daily = data.daily || [];
  const services = data.by_service || [];
  return (
    <Card title={title} actions={<Badge tone="success">Connected</Badge>}>
      <div className="grid grid-2">
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Daily spend · {formatCurrency(data.total_usd)} total
          </div>
          <LineChart data={daily} color="var(--accent)" height={200} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Top services
          </div>
          <PieChart
            data={services}
            size={200}
            thickness={30}
            centerLabel="Services"
            centerValue={formatCurrency(data.total_usd)}
            formatter={formatCurrency}
          />
        </div>
      </div>
    </Card>
  );
}

function FlagsTab() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: qk.flags, queryFn: configApi.flags });
  const mutate = useMutation({
    mutationFn: ({ key, body }) => configApi.updateFlag(key, body),
    onSuccess: () => {
      toast.success("Flag updated");
      qc.invalidateQueries({ queryKey: qk.flags });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card title="Feature flags" subtitle="Toggle product-level features. Writes an audit log entry." padded>
      {isLoading && <div style={{ color: "var(--text-secondary)" }}>Loading…</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(data || []).map((flag) => (
          <div
            key={flag.full_key}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 16,
              alignItems: "center",
              padding: "14px 16px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-primary)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                <code style={{ fontFamily: "var(--font-mono)" }}>{flag.key}</code>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                {flag.description || "No description"}
              </div>
              {flag.updated_at && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                  Updated {formatRelative(flag.updated_at)}
                  {flag.updated_by ? ` by admin #${flag.updated_by}` : ""}
                </div>
              )}
            </div>
            <Switch
              checked={flag.enabled}
              onChange={(v) => mutate.mutate({ key: flag.key, body: { enabled: v, description: flag.description } })}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function BillingTab() {
  const { data, isLoading } = useQuery({ queryKey: qk.billing, queryFn: configApi.billing });
  if (isLoading) return <div style={{ color: "var(--text-secondary)" }}>Loading…</div>;
  if (!data) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Card title="Plans" subtitle="Managed in Paddle" padded={false}>
        <table className="ui-table">
          <thead><tr><th>Slug</th><th>Name</th><th>Credits/mo</th><th>Price</th><th>Period</th><th>Status</th></tr></thead>
          <tbody>
            {data.plans.map((p) => (
              <tr key={p.id}>
                <td><code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.slug}</code></td>
                <td>{p.name}</td>
                <td>{formatNumber(p.monthly_credits)}</td>
                <td>{formatCurrency(p.price_usd)}</td>
                <td>{p.billing_period}</td>
                <td><Badge tone={p.is_active ? "success" : "neutral"}>{p.is_active ? "active" : "inactive"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Credit packs" padded={false}>
        <table className="ui-table">
          <thead><tr><th>Slug</th><th>Name</th><th>Credits</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            {data.packs.map((p) => (
              <tr key={p.id}>
                <td><code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.slug}</code></td>
                <td>{p.name}</td>
                <td>{formatNumber(p.credits)}</td>
                <td>{formatCurrency(p.price_usd)}</td>
                <td><Badge tone={p.is_active ? "success" : "neutral"}>{p.is_active ? "active" : "inactive"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Feature credit costs" subtitle="Per model tier">
        {Object.keys(data.feature_costs || {}).length === 0 ? (
          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>No per-feature cost config.</div>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>Feature</th>
                {tiersOf(data.feature_costs).map((t) => <th key={t} style={{ textAlign: "right" }}>{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.feature_costs).map(([feat, tiers]) => (
                <tr key={feat}>
                  <td><code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{feat}</code></td>
                  {tiersOf(data.feature_costs).map((t) => (
                    <td key={t} style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{tiers?.[t] ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function tiersOf(costs) {
  const set = new Set();
  for (const tiers of Object.values(costs || {})) {
    Object.keys(tiers || {}).forEach((t) => set.add(t));
  }
  return Array.from(set).sort();
}

function EnvTab() {
  const { data } = useQuery({ queryKey: qk.env, queryFn: configApi.env });
  if (!data) return <div style={{ color: "var(--text-secondary)" }}>Loading…</div>;
  const rows = [
    ["Environment", data.env],
    ["Version", data.version],
    ["Auth enforcement", data.auth_enforcement_enabled ? "enabled" : "disabled"],
    ["Rate limiting", data.rate_limit_enabled ? "enabled" : "disabled"],
    ["Supabase", data.supabase_configured ? "configured" : "not configured"],
    ["Paddle", data.paddle_env || "—"],
    ["Text provider", data.text_provider_configured ? "configured" : "not configured"],
    ["Frontend base URL", data.frontend_base_url || "—"],
  ];
  return (
    <Card title="Environment">
      <table className="ui-table">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}><td style={{ color: "var(--text-secondary)" }}>{k}</td><td>{String(v)}</td></tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
