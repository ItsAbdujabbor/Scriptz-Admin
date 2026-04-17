import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { qk } from "../../queries/keys";
import { analyticsApi } from "../../api/analytics";
import Card from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
import LineChart from "../../components/charts/LineChart";
import PieChart from "../../components/charts/PieChart";
import StatCard from "../../components/shared/StatCard";
import { TrendingUp, Activity, Wallet } from "lucide-react";
import { formatCurrency, formatNumber } from "../../lib/format";

const RANGES = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

export default function Analytics() {
  const [tab, setTab] = useState("growth");
  const [range, setRange] = useState("30d");

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "growth", label: "Growth" },
            { value: "usage", label: "Usage" },
            { value: "revenue", label: "Revenue" },
          ]}
        />
        <Tabs value={range} onChange={setRange} tabs={RANGES} />
      </div>

      {tab === "growth" && <GrowthTab range={range} />}
      {tab === "usage" && <UsageTab range={range} />}
      {tab === "revenue" && <RevenueTab range={range} />}
    </div>
  );
}

function GrowthTab({ range }) {
  const { data } = useQuery({
    queryKey: qk.analyticsGrowth(range),
    queryFn: () => analyticsApi.growth(range),
  });
  const signups = data?.signups || [];
  const total = signups.reduce((a, b) => a + b.value, 0);
  return (
    <>
      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <StatCard label="New signups" value={total} icon={TrendingUp} tone="success" hint={`over ${range}`} />
        <StatCard label="Peak day" value={Math.max(0, ...signups.map((p) => p.value))} icon={Activity} />
        <StatCard
          label="Cumulative"
          value={data?.cumulative?.[data.cumulative.length - 1]?.value || 0}
          icon={TrendingUp}
        />
      </div>
      <Card title="Daily signups">
        <LineChart data={signups} height={260} />
      </Card>
    </>
  );
}

function UsageTab({ range }) {
  const [feature, setFeature] = useState("");
  const { data } = useQuery({
    queryKey: qk.analyticsUsage(range, feature),
    queryFn: () => analyticsApi.usage(range, feature || undefined),
  });
  const features = Object.keys(data?.by_feature || {});
  const total = (data?.points || []).reduce((a, b) => a + b.value, 0);
  const featurePie = Object.entries(data?.by_feature || {})
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <select
          className="ui-input"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          style={{ maxWidth: 260 }}
        >
          <option value="">All features</option>
          {features.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <StatCard label="Events" value={total} icon={Activity} tone="info" />
        <StatCard label="Features tracked" value={features.length} icon={TrendingUp} />
        <StatCard
          label="Top feature"
          value={
            Object.entries(data?.by_feature || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"
          }
          icon={Activity}
          formatter={(v) => v}
        />
      </div>
      <div className="grid grid-2">
        <Card title="Events over time">
          <LineChart data={data?.points || []} color="var(--blue)" height={260} />
        </Card>
        <Card title="Share by feature">
          <PieChart data={featurePie} size={220} thickness={34} centerLabel="Events" formatter={formatNumber} />
        </Card>
      </div>
    </>
  );
}

function RevenueTab({ range }) {
  const { data } = useQuery({
    queryKey: qk.analyticsRevenue(range),
    queryFn: () => analyticsApi.revenue(range),
  });
  const { data: bd } = useQuery({
    queryKey: qk.analyticsRevenueBreakdown(range),
    queryFn: () => analyticsApi.revenueBreakdown(range),
  });
  const totals = data?.totals || {};
  const points = (data?.points || []).map((p) => ({ date: p.date, value: p.credits_purchased }));
  const consumed = (data?.points || []).map((p) => ({ date: p.date, value: p.credits_consumed }));
  const mrrTotal = (bd?.mrr_by_plan || []).reduce((a, b) => a + Number(b.value), 0);

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <StatCard label="Credits purchased" value={totals.credits_purchased} icon={Wallet} tone="success" />
        <StatCard label="Credits consumed" value={totals.credits_consumed} icon={Activity} tone="warning" />
        <StatCard
          label="Net"
          value={formatNumber((totals.credits_purchased || 0) - (totals.credits_consumed || 0))}
          icon={Wallet}
          formatter={(v) => v}
        />
        <StatCard
          label="MRR"
          value={formatCurrency(mrrTotal)}
          icon={Wallet}
          tone="success"
          formatter={(v) => v}
        />
      </div>
      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <Card title="Credits purchased"><LineChart data={points} height={240} color="var(--green)" /></Card>
        <Card title="Credits consumed"><LineChart data={consumed} height={240} color="var(--orange)" /></Card>
      </div>
      <div className="grid grid-3">
        <Card title="MRR by plan" subtitle="Monthly recurring revenue">
          <PieChart
            data={bd?.mrr_by_plan || []}
            size={220}
            thickness={34}
            centerLabel="MRR"
            centerValue={formatCurrency(mrrTotal)}
            formatter={formatCurrency}
          />
        </Card>
        <Card title="Subscriptions by plan">
          <PieChart
            data={bd?.subs_by_plan || []}
            size={220}
            thickness={34}
            centerLabel="Subs"
            formatter={formatNumber}
          />
        </Card>
        <Card title="Users by tier">
          <PieChart
            data={bd?.users_by_tier || []}
            size={220}
            thickness={34}
            centerLabel="Users"
            formatter={formatNumber}
          />
        </Card>
      </div>
    </>
  );
}
