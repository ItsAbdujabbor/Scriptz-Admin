import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Card from "../../components/ui/Card";
import DataTable, { Pagination } from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Input, Textarea } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { contentApi } from "../../api/content";
import { qk } from "../../queries/keys";

export default function PersonasPanel() {
  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const params = { page, page_size: 25 };
  const { data, isLoading } = useQuery({
    queryKey: qk.personas(params),
    queryFn: () => contentApi.personas.list(params),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["personas"] });

  const createM = useMutation({
    mutationFn: (body) => contentApi.personas.create(body),
    onSuccess: () => { toast.success("Persona created"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: ({ id, body }) => contentApi.personas.update(id, body),
    onSuccess: () => { toast.success("Persona updated"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const removeM = useMutation({
    mutationFn: (id) => contentApi.personas.remove(id),
    onSuccess: () => { toast.success("Persona deleted"); setDeleting(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const columns = [
    { key: "name", header: "Name", cell: (r) => <b>{r.name}</b> },
    { key: "description", header: "Description", cell: (r) => (
      <span style={{ color: "var(--text-secondary)" }}>{(r.description || "").slice(0, 80) || "—"}</span>
    ) },
    { key: "tone", header: "Tone" },
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
        title={`Admin personas${data ? ` (${data.total})` : ""}`}
        actions={<Button onClick={() => setEditing({})}><Plus size={14} /> New</Button>}
        padded={false}
      >
        <DataTable columns={columns} rows={data?.items || []} loading={isLoading} empty="No personas yet." />
        <Pagination page={page} pageSize={25} total={data?.total || 0} onChange={setPage} />
      </Card>

      <PersonaFormModal
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
        title="Delete persona?"
        message={`This removes "${deleting?.name}" from the admin-managed personas.`}
        loading={removeM.isPending}
      />
    </>
  );
}

function PersonaFormModal({ open, initial, onClose, onSubmit, loading }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("");
  const [image_url, setImage] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setDescription(initial?.description || "");
      setTone(initial?.tone || "");
      setImage(initial?.image_url || "");
    }
  }, [open, initial]);

  const handleClose = () => onClose();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={initial?.id ? "Edit persona" : "New persona"}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={() => onSubmit({ name, description, tone, image_url })}
            loading={loading}
            disabled={!name.trim()}
          >
            Save
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Tone" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. warm, authoritative" />
        <Input label="Image URL" value={image_url} onChange={(e) => setImage(e.target.value)} />
      </div>
    </Modal>
  );
}
