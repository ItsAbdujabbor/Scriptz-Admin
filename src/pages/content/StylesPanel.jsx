import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Card from "../../components/ui/Card";
import DataTable, { Pagination } from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { contentApi } from "../../api/content";
import { qk } from "../../queries/keys";

export default function StylesPanel() {
  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const params = { page, page_size: 25 };
  const { data, isLoading } = useQuery({
    queryKey: qk.styles(params),
    queryFn: () => contentApi.styles.list(params),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["styles"] });

  const createM = useMutation({
    mutationFn: (body) => contentApi.styles.create(body),
    onSuccess: () => { toast.success("Style created"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: ({ id, body }) => contentApi.styles.update(id, body),
    onSuccess: () => { toast.success("Style updated"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const removeM = useMutation({
    mutationFn: (id) => contentApi.styles.remove(id),
    onSuccess: () => { toast.success("Style deleted"); setDeleting(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const columns = [
    { key: "image_url", header: "", width: 72, cell: (r) => (
      <img
        src={r.image_url}
        alt=""
        style={{ width: 54, height: 30, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
      />
    ) },
    { key: "name", header: "Name", cell: (r) => <b>{r.name}</b> },
    { key: "id", header: "ID" },
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
        title={`Admin styles${data ? ` (${data.total})` : ""}`}
        actions={<Button onClick={() => setEditing({})}><Plus size={14} /> New</Button>}
        padded={false}
      >
        <DataTable columns={columns} rows={data?.items || []} loading={isLoading} empty="No styles yet." />
        <Pagination page={page} pageSize={25} total={data?.total || 0} onChange={setPage} />
      </Card>

      <StyleFormModal
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
        title="Delete style?"
        message={`This removes "${deleting?.name}" from the admin-managed styles.`}
        loading={removeM.isPending}
      />
    </>
  );
}

function StyleFormModal({ open, initial, onClose, onSubmit, loading }) {
  const [name, setName] = useState("");
  const [image_url, setImage] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setImage(initial?.image_url || "");
    }
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? "Edit style" : "New style"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={() => onSubmit({ name, image_url })} loading={loading} disabled={!name.trim() || !image_url.trim()}>
            Save
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Image URL" value={image_url} onChange={(e) => setImage(e.target.value)} required />
        {image_url && (
          <img src={image_url} alt="" style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid var(--border)" }} />
        )}
      </div>
    </Modal>
  );
}
