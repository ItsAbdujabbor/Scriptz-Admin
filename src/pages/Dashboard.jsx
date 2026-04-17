import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Activity,
  Zap,
  Wallet,
  CircleDollarSign,
  ShieldCheck,
  Flame,
  Cloud,
  Server,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Users2,
} from "lucide-react";
import { qk } from "../queries/keys";
import { analyticsApi } from "../api/analytics";
import { costsApi } from "../api/costs";
import StatCard from "../components/shared/StatCard";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import LineChart from "../components/charts/LineChart";
import PieChart from "../components/charts/PieChart";
import { formatCurrency, formatNumber } from "../lib/format";

export default function Dashboard() {
  const overview = useQuery({ queryKey: qk.analyticsOverview, queryFn: analyticsApi.overview });
  const growth = useQuery({
    queryKey: qk.analyticsGrowth("30d"),
    queryFn: () => analyticsApi.growth("30d"),
  });
  const usage = useQuery({
    queryKey: qk.analyticsUsage("30d"),
    queryFn: () => analyticsApi.usage("30d"),
  });
  const costs = useQuery({
    queryKey: qk.cloudCosts(30),
    queryFn: () => costsApi.cloud(30),
  });
  const finance = useQuery({
    queryKey: qk.finance(30),
    queryFn: () => analyticsApi.finance(30),
  });

  const o = overview.data || {};
  const fin = finance.data;

  return (
    <div className="page">
      {/* KPI cards */}
      <div className="grid grid-4" style={{ marginBottom: "var(--space-5)" }}>
        <StatCard label="Total users" value={o.total_users} icon={Users} tone="info" />
        <StatCard
          label="New users (7d)"
          value={o.new_users_7d}
          icon={UserPlus}
          tone="success"
          hint={`${formatNumber(o.new_users_30d)} in 30d`}
        />
        <StatCard label="Active (24h)" value={o.active_users_24h} icon={Activity} tone="warning" />
        <StatCard
          label="Active (30d)"
          value={o.active_users_30d}
          icon={Flame}
          tone="danger"
          hint={`${formatNumber(o.active_users_7d)} in 7d`}
        />
        <StatCard label="Paying users" value={o.paying_users} icon={Wallet} />
        <StatCard
          label="MRR"
          value={formatCurrency(o.mrr_usd)}
          icon={CircleDollarSign}
          tone="success"
          formatter={(v) => v}
        />
        <StatCard
          label="Credits used (7d)"
          value={o.credits_consumed_7d}
          icon={Zap}
          tone="warning"
          hint={`${formatNumber(o.total_events_7d)} events`}
        />
        <StatCard label="Admins" value={o.admins} icon={ShieldCheck} />
      </div>

      {/* Financial health — revenue, cost, profit */}
      {fin && <FinancialHealth fin={fin} loading={finance.isLoading} />}

      {/* Growth + usage line charts */}
      <div className="grid grid-2" style={{ margin: "var(--space-5) 0" }}>
        <Card title="Signups" subtitle="Last 30 days">
          <LineChart data={growth.data?.signups || []} />
        </Card>
        <Card title="Usage events" subtitle="Last 30 days">
          <LineChart data={usage.data?.points || []} color="var(--blue)" />
        </Card>
      </div>

      {/* Cloud providers — split AWS + GCP */}
      <div className="grid grid-2" style={{ marginBottom: "var(--space-5)" }}>
        <ProviderCard
          title="AWS"
          icon={Cloud}
          tone="warning"
          provider={costs.data?.aws}
          accent="#ff9f0a"
        />
        <ProviderCard
          title="GCP"
          icon={Server}
          tone="info"
          provider={costs.data?.gcp}
          accent="#0a84ff"
        />
      </div>

      <Card title="Usage by feature" subtitle="Events in the last 30 days">
        <UsageBars byFeature={usage.data?.by_feature || {}} />
      </Card>
    </div>
  );
}

function FinancialHealth({ fin }) {
  const revenue = fin.revenue.total;
  const cost = fin.cost.total;
  const profit = fin.profit.total;
  const margin = fin.profit.margin_pct;
  const profitable = profit >= 0;
  const perUser = fin.per_user;

  const revenueVsCost = [
    { label: "Revenue", value: revenue, color: "#30d158" },
    { label: "Cost", value: cost, color: "#ff453a" },
  ];

  return (
    <Card
      title="Financial health"
      subtitle={`Real numbers · last ${fin.range_days} days`}
      actions={
        <Badge tone={profitable ? "success" : "danger"}>
          {profitable ? <TrendingUp size={10} style={{ marginRight: 4 }} /> : <TrendingDown size={10} style={{ marginRight: 4 }} />}
          {profitable ? "Profitable" : "Loss"} · {margin}%
        </Badge>
      }
    >
      <div className="grid grid-4" style={{ gap: "var(--space-4)", marginBottom: 18 }}>
        <MoneyTile label="Revenue" value={revenue} tone="success" sub={`MRR ${formatCurrency(fin.revenue.mrr)}`} />
        <MoneyTile label="Total cost" value={cost} tone="danger" sub={`${fin.cost.infra_total > 0 ? `infra ${formatCurrency(fin.cost.infra_total)} · ` : ""}AI ${formatCurrency(fin.cost.ai_models_total)}`} />
        <MoneyTile
          label="Profit"
          value={profit}
          tone={profitable ? "success" : "danger"}
          sub={`${margin}% margin`}
          big
        />
        <MoneyTile label="ARPU" value={perUser.arpu} tone="info" sub={`${perUser.paying_users} paying / ${perUser.total_users} total`} />
      </div>

      <div className="grid grid-3">
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Revenue vs cost
          </div>
          <PieChart
            data={revenueVsCost}
            size={180}
            thickness={28}
            centerLabel={profitable ? "Profit" : "Loss"}
            centerValue={formatCurrency(Math.abs(profit))}
            formatter={formatCurrency}
            showLegend={true}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Cost breakdown
          </div>
          <PieChart
            data={fin.cost.breakdown_pie || []}
            size={180}
            thickness={28}
            centerLabel="Total cost"
            centerValue={formatCurrency(cost)}
            formatter={formatCurrency}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Per-user economics
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <InlineStat icon={Users2} label="Paying" value={`${perUser.paying_users} / ${perUser.total_users}`} />
            <InlineStat icon={Activity} label="Active (30d)" value={perUser.active_users} formatter={formatNumber} />
            <InlineStat icon={Wallet} label="ARPU (paying)" value={perUser.arpu} formatter={formatCurrency} tone="success" />
            <InlineStat icon={Zap} label="Cost / active" value={perUser.cost_per_active_user} formatter={formatCurrency} tone="danger" />
            <InlineStat icon={Users2} label="Cost / user (all)" value={perUser.cost_per_user} formatter={formatCurrency} />
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Sparkles size={14} style={{ color: "var(--accent-light)", marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              AI cost uses <code>cost_usd.&lt;feature&gt;</code> in AppConfig (falls back to defaults).
              Paddle fees approximated at 5% + $0.50/txn.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MoneyTile({ label, value, sub, tone = "neutral", big = false }) {
  const color =
    tone === "success" ? "var(--green)"
      : tone === "danger" ? "var(--red)"
        : tone === "info" ? "var(--accent-light)"
          : "var(--text-primary)";
  return (
    <div style={{
      padding: 16,
      background: "var(--bg-tertiary)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      transition: "transform var(--motion) var(--spring), border-color var(--motion-fast) var(--ease)",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: big ? 30 : 24, fontWeight: 700, color, marginTop: 6, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {formatCurrency(value)}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function InlineStat({ icon: Icon, label, value, formatter = (v) => v, tone }) {
  const color =
    tone === "success" ? "var(--green)"
      : tone === "danger" ? "var(--red)"
        : "var(--text-primary)";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 12 }}>
        <Icon size={13} /> {label}
      </span>
      <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color, fontSize: 13 }}>
        {typeof value === "string" ? value : formatter(value)}
      </span>
    </div>
  );
}

function ProviderCard({ title, icon: Icon, tone, provider = {}, accent }) {
  const status = provider.status;
  const isOk = status === "ok";
  const isErr = status === "error";
  const total = provider.total_usd || 0;
  const daily = provider.daily || [];
  const services = provider.by_service || [];

  return (
    <Card
      title={title}
      subtitle={provider.days ? `Last ${provider.days} days` : "Infrastructure spend"}
      actions={
        <Badge tone={isOk ? "success" : isErr ? "danger" : "neutral"}>
          <Icon size={10} style={{ marginRight: 4 }} />
          {isOk ? formatCurrency(total) : isErr ? "Error" : "Not configured"}
        </Badge>
      }
    >
      {!isOk ? (
        <div style={{
          padding: 24, textAlign: "center", color: "var(--text-secondary)",
          background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)",
          border: "1px dashed var(--border)", fontSize: 13,
        }}>
          {isErr ? (
            <div>
              <div style={{ color: "var(--red)", marginBottom: 6, fontWeight: 600 }}>Error</div>
              <div style={{ fontSize: 12 }}>{provider.error}</div>
            </div>
          ) : (
            <div>
              <Icon size={22} style={{ color: accent, opacity: 0.7, marginBottom: 8 }} />
              <div>Not yet connected.</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>See <b>Config → Cloud costs</b> for setup.</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Daily
            </div>
            <LineChart data={daily} color={accent} height={160} />
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)" }}>
              <span>Total</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Top services
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {services.slice(0, 6).map((s, i) => (
                <div key={`${s.label}-${i}`} style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 8, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.label}
                    </div>
                    <div style={{ height: 4, background: "var(--bg-tertiary)", borderRadius: 4, marginTop: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.max(4, (Number(s.value) / Math.max(...services.map((x) => Number(x.value)))) * 100)}%`,
                        background: accent,
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                  <span style={{ textAlign: "right", fontSize: 12, fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                    {formatCurrency(s.value)}
                  </span>
                </div>
              ))}
              {services.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>No service data yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function UsageBars({ byFeature }) {
  const entries = Object.entries(byFeature).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (entries.length === 0)
    return (
      <div style={{ color: "var(--text-secondary)", fontSize: 13, padding: "16px 0" }}>
        No events recorded yet.
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map(([feat, count]) => (
        <div key={feat} style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {feat}
          </span>
          <div style={{ background: "var(--bg-tertiary)", height: 8, borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${(count / max) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--accent), var(--blue))",
                transition: "width var(--motion) var(--ease)",
              }}
            />
          </div>
          <span style={{ fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {formatNumber(count)}
          </span>
        </div>
      ))}
    </div>
  );
}
