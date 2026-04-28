import { useMemo } from "react";
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
import "./Dashboard.css";

const PROVIDER_TONE = { aws: "#ff9f0a", gcp: "#0a84ff" };

// Auto-refresh cadences. Each query polls itself while the dashboard is mounted
// AND the browser tab is visible — React Query's default `refetchIntervalInBackground:
// false` pauses these timers when the tab is hidden, which gives us the
// "refresh only for active admins" guarantee on the client side. The matching
// server cache (see services/admin/dashboard_cache.py) absorbs the load if
// multiple admins poll simultaneously.
const REFRESH_KPIS_MS = 60_000;        // overview is the "live" feeling card
const REFRESH_SERIES_MS = 5 * 60_000;  // daily series barely move within a day
const REFRESH_CLOUD_MS = 15 * 60_000;  // AWS Cost Explorer is paid — keep this slow

export default function Dashboard() {
  const overview = useQuery({
    queryKey: qk.analyticsOverview,
    queryFn: analyticsApi.overview,
    refetchInterval: REFRESH_KPIS_MS,
  });
  const growth = useQuery({
    queryKey: qk.analyticsGrowth("30d"),
    queryFn: () => analyticsApi.growth("30d"),
    refetchInterval: REFRESH_SERIES_MS,
  });
  const usage = useQuery({
    queryKey: qk.analyticsUsage("30d"),
    queryFn: () => analyticsApi.usage("30d"),
    refetchInterval: REFRESH_SERIES_MS,
  });
  const costs = useQuery({
    queryKey: qk.cloudCosts(30),
    queryFn: () => costsApi.cloud(30),
    refetchInterval: REFRESH_CLOUD_MS,
  });
  const finance = useQuery({
    queryKey: qk.finance(30),
    queryFn: () => analyticsApi.finance(30),
    refetchInterval: REFRESH_SERIES_MS,
  });

  return (
    <div className="page">
      {overview.data && <KpiGrid data={overview.data} />}

      {finance.data ? <FinancialHealth fin={finance.data} /> : null}

      {(growth.data || usage.data) && (
        <div className="grid grid-2" style={{ margin: "var(--space-5) 0" }}>
          {growth.data && (
            <Card title="Signups" subtitle="Last 30 days">
              <LineChart data={growth.data?.signups || []} />
            </Card>
          )}
          {usage.data && (
            <Card title="Usage events" subtitle="Last 30 days">
              <LineChart data={usage.data?.points || []} color="var(--blue)" />
            </Card>
          )}
        </div>
      )}

      {costs.data && (
        <div className="grid grid-2" style={{ marginBottom: "var(--space-5)" }}>
          <ProviderCard
            title="AWS"
            icon={Cloud}
            provider={costs.data?.aws}
            accent={PROVIDER_TONE.aws}
          />
          <ProviderCard
            title="GCP"
            icon={Server}
            provider={costs.data?.gcp}
            accent={PROVIDER_TONE.gcp}
          />
        </div>
      )}

      {usage.data && (
        <Card title="Usage by feature" subtitle="Events in the last 30 days">
          <UsageBars byFeature={usage.data?.by_feature || {}} />
        </Card>
      )}
    </div>
  );
}

/* ----------------------------- KPI grid ------------------------------ */

function KpiGrid({ data }) {
  const o = data || {};
  return (
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
  );
}

/* -------------------------- Financial health ------------------------- */

function FinancialHealth({ fin }) {
  const revenue = fin.revenue.total;
  const cost = fin.cost.total;
  const profit = fin.profit.total;
  const margin = fin.profit.margin_pct;
  const profitable = profit >= 0;
  const perUser = fin.per_user;

  const revenueVsCost = useMemo(
    () => [
      { label: "Revenue", value: revenue, color: "#30d158" },
      { label: "Cost", value: cost, color: "#ff453a" },
    ],
    [revenue, cost]
  );

  return (
    <Card
      title="Financial health"
      subtitle={`Real numbers · last ${fin.range_days} days`}
      actions={
        <Badge tone={profitable ? "success" : "danger"}>
          {profitable ? (
            <TrendingUp size={10} style={{ marginRight: 4 }} />
          ) : (
            <TrendingDown size={10} style={{ marginRight: 4 }} />
          )}
          {profitable ? "Profitable" : "Loss"} · {margin}%
        </Badge>
      }
    >
      <div className="grid grid-4" style={{ gap: "var(--space-4)", marginBottom: 18 }}>
        <MoneyTile label="Revenue" value={revenue} tone="success" sub={`MRR ${formatCurrency(fin.revenue.mrr)}`} />
        <MoneyTile
          label="Total cost"
          value={cost}
          tone="danger"
          sub={`${fin.cost.infra_total > 0 ? `infra ${formatCurrency(fin.cost.infra_total)} · ` : ""}AI ${formatCurrency(fin.cost.ai_models_total)}`}
        />
        <MoneyTile
          label="Profit"
          value={profit}
          tone={profitable ? "success" : "danger"}
          sub={`${margin}% margin`}
          big
        />
        <MoneyTile
          label="ARPU"
          value={perUser.arpu}
          tone="info"
          sub={`${perUser.paying_users} paying / ${perUser.total_users} total`}
        />
      </div>

      <div className="grid grid-3">
        <div>
          <div className="dash-section-label">Revenue vs cost</div>
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
          <div className="dash-section-label">Cost breakdown</div>
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
          <div className="dash-section-label">Per-user economics</div>
          <div className="dash-stat-stack">
            <InlineStat icon={Users2} label="Paying" value={`${perUser.paying_users} / ${perUser.total_users}`} />
            <InlineStat icon={Activity} label="Active (30d)" value={perUser.active_users} formatter={formatNumber} />
            <InlineStat icon={Wallet} label="ARPU (paying)" value={perUser.arpu} formatter={formatCurrency} tone="success" />
            <InlineStat icon={Zap} label="Cost / active" value={perUser.cost_per_active_user} formatter={formatCurrency} tone="danger" />
            <InlineStat icon={Users2} label="Cost / user (all)" value={perUser.cost_per_user} formatter={formatCurrency} />
          </div>
          <div className="dash-info-tip">
            <Sparkles size={14} className="dash-info-tip-icon" />
            <div className="dash-info-tip-body">
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
  return (
    <div className={`dash-money-tile tone-${tone}${big ? " is-big" : ""}`}>
      <div className="dash-money-tile-label">{label}</div>
      <div className="dash-money-tile-value">{formatCurrency(value)}</div>
      <div className="dash-money-tile-sub">{sub}</div>
    </div>
  );
}

function InlineStat({ icon: Icon, label, value, formatter = (v) => v, tone }) {
  return (
    <div className="dash-inline-stat">
      <span className="dash-inline-stat-key">
        <Icon size={13} aria-hidden="true" /> {label}
      </span>
      <span className={`dash-inline-stat-val${tone ? ` tone-${tone}` : ""}`}>
        {typeof value === "string" ? value : formatter(value)}
      </span>
    </div>
  );
}

/* --------------------------- Provider card --------------------------- */

function ProviderCard({ title, icon: Icon, provider, accent }) {
  const p = provider || {};
  const status = p.status;
  const isOk = status === "ok";
  const isErr = status === "error";
  const total = p.total_usd || 0;
  const daily = p.daily || [];
  const services = p.by_service || [];
  const maxService = services.length
    ? Math.max(...services.map((s) => Number(s.value) || 0))
    : 0;

  return (
    <Card
      title={title}
      subtitle={p.days ? `Last ${p.days} days` : "Infrastructure spend"}
      actions={
        <Badge tone={isOk ? "success" : isErr ? "danger" : "neutral"}>
          <Icon size={10} style={{ marginRight: 4 }} />
          {isOk ? formatCurrency(total) : isErr ? "Error" : "Not configured"}
        </Badge>
      }
    >
      {!isOk ? (
        <div className="dash-provider-empty">
          {isErr ? (
            <>
              <div className="dash-provider-empty-error">Error</div>
              <div className="dash-provider-empty-detail">{p.error}</div>
            </>
          ) : (
            <>
              <Icon size={22} style={{ color: accent, opacity: 0.7, marginBottom: 8 }} aria-hidden="true" />
              <div>Not yet connected.</div>
              <div className="dash-provider-empty-hint">See <b>Config → Cloud costs</b> for setup.</div>
            </>
          )}
        </div>
      ) : (
        <div className="dash-provider">
          <div>
            <div className="dash-section-label">Daily</div>
            <LineChart data={daily} color={accent} height={160} />
            <div className="dash-provider-total">
              <span>Total</span>
              <span className="dash-provider-total-value">{formatCurrency(total)}</span>
            </div>
          </div>
          <div>
            <div className="dash-section-label">Top services</div>
            <div className="dash-services">
              {services.slice(0, 6).map((s, i) => {
                const pct = maxService > 0 ? (Number(s.value) / maxService) * 100 : 0;
                return (
                  <div key={`${s.label}-${i}`} className="dash-service-row">
                    <div>
                      <div className="dash-service-name">{s.label}</div>
                      <div className="dash-service-bar">
                        <div
                          className="dash-service-bar-fill"
                          style={{ width: `${Math.max(4, pct)}%`, background: accent }}
                        />
                      </div>
                    </div>
                    <span className="dash-service-value">{formatCurrency(s.value)}</span>
                  </div>
                );
              })}
              {services.length === 0 && (
                <div className="dash-service-empty">No service data yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------- Usage bars ----------------------------- */

function UsageBars({ byFeature }) {
  const { entries, max } = useMemo(() => {
    const e = Object.entries(byFeature).sort((a, b) => b[1] - a[1]);
    return { entries: e, max: Math.max(1, ...e.map(([, v]) => v)) };
  }, [byFeature]);

  if (entries.length === 0) {
    return (
      <div style={{ color: "var(--text-secondary)", fontSize: 13, padding: "16px 0" }}>
        No events recorded yet.
      </div>
    );
  }
  return (
    <div className="dash-bars">
      {entries.map(([feat, count]) => (
        <div key={feat} className="dash-bar-row">
          <span className="dash-bar-label">{feat}</span>
          <div className="dash-bar-track">
            <div className="dash-bar-fill" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="dash-bar-value">{formatNumber(count)}</span>
        </div>
      ))}
    </div>
  );
}
