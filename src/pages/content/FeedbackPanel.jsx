import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "../../components/ui/Card";
import DataTable, { Pagination } from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { contentApi } from "../../api/content";
import { qk } from "../../queries/keys";
import { formatRelative } from "../../lib/format";

export default function FeedbackPanel() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [interestedFilter, setInterestedFilter] = useState("");

  const params = {
    page, page_size: 25,
    status: statusFilter || undefined,
    interested: interestedFilter === "" ? undefined : interestedFilter === "true",
  };
  const { data, isLoading } = useQuery({
    queryKey: qk.feedback(params),
    queryFn: () => contentApi.feedback.list(params),
  });

  const mutate = useMutation({
    mutationFn: ({ id, body }) => contentApi.feedback.update(id, body),
    onSuccess: () => {
      toast.success("Feedback updated");
      qc.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const columns = [
    { key: "idea_title", header: "Idea", cell: (r) => <b>{r.idea_title}</b> },
    { key: "interested", header: "Sentiment", cell: (r) => (
      <Badge tone={r.interested ? "success" : "warning"}>
        {r.interested ? "interested" : r.reason || "not interested"}
      </Badge>
    ) },
    { key: "admin_status", header: "Status", cell: (r) => (
      <Select
        value={r.admin_status || "pending"}
        onChange={(e) => mutate.mutate({ id: r.id, body: { admin_status: e.target.value } })}
      >
        <option value="pending">Pending</option>
        <option value="reviewed">Reviewed</option>
        <option value="updated">Updated</option>
        <option value="hidden">Hidden</option>
      </Select>
    ) },
    { key: "created_at", header: "When", cell: (r) => (
      <span style={{ color: "var(--text-secondary)" }}>{formatRelative(r.created_at)}</span>
    ) },
  ];

  return (
    <Card
      title={`User feedback${data ? ` (${data.total})` : ""}`}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <select className="ui-input" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">Any status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="updated">Updated</option>
            <option value="hidden">Hidden</option>
          </select>
          <select className="ui-input" value={interestedFilter} onChange={(e) => { setPage(1); setInterestedFilter(e.target.value); }}>
            <option value="">Any sentiment</option>
            <option value="true">Interested</option>
            <option value="false">Not interested</option>
          </select>
        </div>
      }
      padded={false}
    >
      <DataTable columns={columns} rows={data?.items || []} loading={isLoading} empty="No feedback yet." />
      <Pagination page={page} pageSize={25} total={data?.total || 0} onChange={setPage} />
    </Card>
  );
}
