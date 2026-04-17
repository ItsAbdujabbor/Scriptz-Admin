import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Card from "../../components/ui/Card";
import DataTable, { Pagination } from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Input, Textarea, Switch } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { contentApi } from "../../api/content";
import { qk } from "../../queries/keys";

export default function TemplatesPanel() {
  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const params = { page, page_size: 25 };
  const { data, isLoading } = useQuery({
    queryKey: qk.templates(params),
    queryFn: () => contentApi.templates.list(params),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["templates"] });

  const createM = useMutation({
    mutationFn: (body) => contentApi.templates.create(body),
    onSuccess: () => { toast.success("Template created"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: ({ id, body }) => contentApi.templates.update(id, body),
    onSuccess: () => { toast.success("Template updated"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const removeM = useMutation({
    mutationFn: (id) => contentApi.templates.remove(id),
    onSuccess: () => { toast.success("Template deleted"); setDeleting(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const columns = [
    { key: "image_url", header: "", width: 72, cell: (r) => (
      <img src={r.image_url} alt="" style={{ width: 54, height: 30, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
    ) },
    { key: "name", header: "Name", cell: (r) => <b>{r.name}</b> },
    { key: "category", header: "Category" },
    { key: "is_active", header: "Status", cell: (r) => (
      <Badge tone={r.is_active ? "success" : "neutral"}>{r.is_active ? "active" : "inactive"}</Badge>
    ) },
    { key: "sort_order", header: "Sort", align: "right" },
    {
      key: "_actions",
      header: "",
      align: "right",
      cell: (r) => (
        <div style={{ display: "inline-flex", gap: 6 }}>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditing(r); }}>
            <Pencil size={12} />
          </Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleting(r); }}>
            <Trash2 size={12} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card
        title={`Thumbnail templates${data ? ` (${data.total})` : ""}`}
        actions={<Button onClick={() => setEditing({})}><Plus size={14} /> New</Button>}
        padded={false}
      >
        <DataTable columns={columns} rows={data?.items || []} loading={isLoading} empty="No templates yet." />
        <Pagination page={page} pageSize={25} total={data?.total || 0} onChange={setPage} />
      </Card>

      <TemplateFormModal
        open={!!editing}
        initial={editing}
        loading={createM.isPending || updateM.isPending}
        onClose={() => setEditing(null)}
        onSubmit={(body) => {
          if (editing?.id) updateM.mutate({ id: editing.id, body });
          else createM.mutate(body);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => removeM.mutate(deleting.id)}
        title="Delete template?"
        message={`This removes "${deleting?.name}" from the template gallery.`}
        loading={removeM.isPending}
      />
    </>
  );
}

function TemplateFormModal({ open, initial, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ name: "", category: "General", description: "", image_url: "", sort_order: 0, is_active: true });

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || "",
        category: initial?.category || "General",
        description: initial?.description || "",
        image_url: initial?.image_url || "",
        sort_order: initial?.sort_order ?? 0,
        is_active: initial?.is_active ?? true,
      });
    }
  }, [open, initial]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? "Edit template" : "New template"}
      width={600}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={() => onSubmit(form)}
            loading={loading}
            disabled={!form.name.trim() || !form.image_url.trim()}
          >
            Save
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Name" value={form.name} onChange={(e) => upd("name", e.target.value)} required />
        <Input label="Category" value={form.category} onChange={(e) => upd("category", e.target.value)} />
        <Textarea label="Description" value={form.description} onChange={(e) => upd("description", e.target.value)} />
        <Input label="Image URL" value={form.image_url} onChange={(e) => upd("image_url", e.target.value)} required />
        <Input label="Sort order" type="number" value={form.sort_order} onChange={(e) => upd("sort_order", Number(e.target.value))} />
        <Switch label="Active" checked={form.is_active} onChange={(v) => upd("is_active", v)} />
      </div>
    </Modal>
  );
}
