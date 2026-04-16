import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users2, Crown, Rocket, TrendingUp } from "lucide-react";
import Card from "../../components/ui/Card";
import DataTable, { Pagination } from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/shared/StatCard";
import PieChart from "../../components/charts/PieChart";
import { channelsApi } from "../../api/channels";
import { qk } from "../../queries/keys";
import { formatNumber, formatRelative } from "../../lib/format";

const BUCKETS = [
  { key: "all", label: "All 10K+", min: 10_000 },
  { key: "10k", label: "10K–100K", min: 10_000 },
  { key: "100k", label: "100K–1M", min: 100_000 },
  { key: "1m", label: "1M–10M", min: 1_000_000 },
  { key: "10m", label: "10M+", min: 10_000_000 },
];

export default function Channels() {
  const [bucket, setBucket] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const min = BUCKETS.find((b) => b.key === bucket)?.min ?? 10_000;

  const { data: summary } = useQuery({
    queryKey: qk.channelsSummary(10_000),
    queryFn: () => channelsApi.summary({ min_subs: 10_000 }),
  });

  const params = { min_subs: min, q: q || undefined, page, page_size: 50 };
  const { data, isLoading } = useQuery({
    queryKey: qk.channels(params),
    queryFn: () => channelsApi.list(params),
  });

  const pieData = summary
    ? [
        { label: "10K–100K", value: summary["10K–100K"] || 0, color: "#64d2ff" },
        { label: "100K–1M", value: summary["100K–1M"] || 0, color: "#0a84ff" },
        { label: "1M–10M", value: summary["1M–10M"] || 0, color: "#7c3aed" },
        { label: "10M+", value: summary["10M+"] || 0, color: "#ffd60a" },
      ]
    : [];

  const columns = [
    { key: "channel_title", header: "Channel", cell: (r) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gradient-accent)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12 }}>
          {(r.channel_title || "?").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{r.channel_title}</div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            {r.channel_id}
          </div>
        </div>
      </div>
    ) },
    { key: "subscriber_count", header: "Subscribers", align: "right", cell: (r) => (
      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-light)", fontVariantNumeric: "tabular-nums" }}>
        {formatNumber(r.subscriber_count)}
      </span>
    ) },
    { key: "bucket", header: "Bucket", cell: (r) => <Badge tone="accent">{r.bucket}</Badge> },
    { key: "user", header: "Owner", cell: (r) => r.user?.email ? (
      <span>{r.user.email}</span>
    ) : <span style={{ color: "var(--text-tertiary)" }}>—</span> },
    { key: "connected_at", header: "Connected", cell: (r) => (
      <span style={{ color: "var(--text-secondary)" }}>{formatRelative(r.connected_at)}</span>
    ) },
  ];

  return (
    <div className="page">
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total 10K+" value={(summary?.["10K–100K"] || 0) + (summary?.["100K–1M"] || 0) + (summary?.["1M–10M"] || 0) + (summary?.["10M+"] || 0)} icon={Users2} />
        <StatCard label="100K–1M" value={summary?.["100K–1M"] || 0} icon={TrendingUp} tone="info" />
        <StatCard label="1M–10M" value={summary?.["1M–10M"] || 0} icon={Rocket} tone="success" />
        <StatCard label="10M+" value={summary?.["10M+"] || 0} icon={Crown} tone="warning" />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <Card title="Distribution" subtitle="Connected channels by subscriber tier">
          <PieChart data={pieData} size={220} thickness={34} centerLabel="Channels" centerValue={formatNumber(pieData.reduce((a, b) => a + b.value, 0))} formatter={formatNumber} />
        </Card>
        <Card title="Where to look" subtitle="Bucket shortcuts">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {BUCKETS.filter((b) => b.key !== "all").map((b) => (
              <button
                key={b.key}
                onClick={() => { setBucket(b.key); setPage(1); }}
                className="channels-bucket-pill"
              >
                <span>{b.label}</span>
                <span style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                  {summary?.[b.label] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title={`Channels · ${BUCKETS.find((b) => b.key === bucket)?.label}`}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="ui-input"
              placeholder="Search channel title"
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              style={{ width: 240 }}
            />
            <select
              className="ui-input"
              value={bucket}
              onChange={(e) => { setPage(1); setBucket(e.target.value); }}
            >
              {BUCKETS.map((b) => (
                <option key={b.key} value={b.key}>{b.label}</option>
              ))}
            </select>
          </div>
        }
        padded={false}
      >
        <DataTable columns={columns} rows={data?.items || []} loading={isLoading} empty="No connected channels in this bucket." />
        <Pagination page={page} pageSize={50} total={data?.total || 0} onChange={setPage} />
      </Card>

      <style>{`
        .channels-bucket-pill {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 10px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13px; font-weight: 500;
          transition: all var(--motion-fast) var(--ease);
          cursor: pointer;
        }
        .channels-bucket-pill:hover {
          border-color: var(--accent);
          transform: translateY(-1px);
          box-shadow: var(--gradient-glow);
        }
      `}</style>
    </div>
  );
}
