import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import Card from "../../components/ui/Card";
import DataTable, { Pagination } from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { contentApi } from "../../api/content";
import { qk } from "../../queries/keys";

/**
 * PersonasPanel — admin-managed (demo) characters.
 *
 * Each demo character is generated from three face photos (front,
 * left, right) — same multi-view composite the user app uses. The
 * resulting row has `visibility="admin"` and `user_id=NULL` so every
 * user sees it at the top of their character library with a "Demo"
 * badge. Renaming and deleting are allowed; the image is set once at
 * creation time (no replace flow).
 */
export default function PersonasPanel() {
  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const params = { page, page_size: 25 };
  const { data, isLoading } = useQuery({
    queryKey: qk.adminPersonas(params),
    queryFn: () => contentApi.personas.list(params),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-personas"] });

  const uploadM = useMutation({
    mutationFn: ({ front, left, right, name }) => {
      const fd = new FormData();
      fd.append("front", front);
      fd.append("left", left);
      fd.append("right", right);
      fd.append("name", name);
      return contentApi.personas.createFromUpload(fd);
    },
    onSuccess: () => {
      toast.success("Demo character generated");
      setCreating(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const renameM = useMutation({
    mutationFn: ({ id, body }) => contentApi.personas.update(id, body),
    onSuccess: () => {
      toast.success("Renamed");
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeM = useMutation({
    mutationFn: (id) => contentApi.personas.remove(id),
    onSuccess: () => {
      toast.success("Deleted");
      setDeleting(null);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const columns = [
    {
      key: "image_url",
      header: "",
      width: 64,
      cell: (r) =>
        r.image_url ? (
          <img
            src={r.image_url}
            alt=""
            style={{
              width: 38,
              height: 38,
              objectFit: "cover",
              borderRadius: "50%",
              border: "1px solid var(--border)",
            }}
          />
        ) : (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
            }}
          >
            <User size={16} />
          </div>
        ),
    },
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <b>{r.name}</b>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.92)",
              background: "rgba(0, 0, 0, 0.62)",
              boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.16)",
            }}
          >
            Demo
          </span>
        </div>
      ),
    },
    { key: "id", header: "ID" },
    {
      key: "_actions",
      header: "",
      align: "right",
      cell: (r) => (
        <div style={{ display: "inline-flex", gap: 6 }}>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(r);
            }}
            title="Rename"
          >
            <Pencil size={12} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(r);
            }}
            title="Delete"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card
        title={`Demo characters${data ? ` (${data.total})` : ""}`}
        subtitle="Visible to every user at the top of their character library with a Demo badge"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={14} /> New
          </Button>
        }
        padded={false}
      >
        <DataTable
          columns={columns}
          rows={data?.items || []}
          loading={isLoading}
          empty="No demo characters yet — generate one to make it available to every user."
        />
        <Pagination page={page} pageSize={25} total={data?.total || 0} onChange={setPage} />
      </Card>

      <UploadModal
        open={creating}
        loading={uploadM.isPending}
        onClose={() => setCreating(false)}
        onSubmit={(payload) => uploadM.mutate(payload)}
      />

      <RenameModal
        open={!!editing}
        initial={editing}
        loading={renameM.isPending}
        onClose={() => setEditing(null)}
        onSubmit={(name) => renameM.mutate({ id: editing.id, body: { name } })}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => removeM.mutate(deleting.id)}
        title="Delete demo character?"
        message={`This removes "${deleting?.name}" from every user's character library.`}
        loading={removeM.isPending}
      />
    </>
  );
}

/* ── Upload modal — three image slots + name + Generate ──────────── */

const SLOTS = [
  { key: "front", label: "Front" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
];

function UploadModal({ open, onClose, onSubmit, loading }) {
  const [name, setName] = useState("");
  const [files, setFiles] = useState({ front: null, left: null, right: null });
  const [previews, setPreviews] = useState({ front: "", left: "", right: "" });
  const [error, setError] = useState("");

  // Reset every time the modal opens.
  useEffect(() => {
    if (open) {
      setName("");
      setFiles({ front: null, left: null, right: null });
      setPreviews({ front: "", left: "", right: "" });
      setError("");
    }
  }, [open]);

  // Keep object-URL previews in sync; revoke the previous URL on each
  // change so we don't leak blob: handles.
  useEffect(() => {
    const next = { front: "", left: "", right: "" };
    const created = [];
    SLOTS.forEach(({ key }) => {
      const f = files[key];
      if (f) {
        const url = URL.createObjectURL(f);
        next[key] = url;
        created.push(url);
      }
    });
    setPreviews(next);
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const pickFile = (slotKey, file) => {
    if (!file) return;
    const label = slotKey.charAt(0).toUpperCase() + slotKey.slice(1);
    if (!file.type.startsWith("image/")) {
      setError(`${label} must be an image (jpeg, png, webp)`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(`${label} too large — max 5 MB`);
      return;
    }
    setError("");
    setFiles((prev) => ({ ...prev, [slotKey]: file }));
  };

  const canSubmit =
    !!files.front && !!files.left && !!files.right && !!name.trim() && !loading;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate demo character"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                front: files.front,
                left: files.left,
                right: files.right,
                name: name.trim(),
              })
            }
            loading={loading}
            disabled={!canSubmit}
          >
            {loading ? "Generating…" : "Generate"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 80))}
          maxLength={80}
          placeholder="e.g. Studio host, Cinematic dad"
          required
        />

        <div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
            Three reference photos of the same person — front, left side, right side.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {SLOTS.map(({ key, label }) => (
              <SlotInput
                key={key}
                label={label}
                preview={previews[key]}
                hasFile={!!files[key]}
                onPick={(f) => pickFile(key, f)}
                onClear={() => setFiles((prev) => ({ ...prev, [key]: null }))}
                slotKey={key}
              />
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: "#fca5a5",
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.22)",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ fontSize: 11, color: "var(--text-tertiary, var(--text-secondary))" }}>
          Generating runs the same multi-view face composite the user app uses (gpt-image-1 medium,
          1024² portrait). Takes ~10–15 s.
        </div>
      </div>
    </Modal>
  );
}

function SlotInput({ label, preview, hasFile, onPick, onClear }) {
  const inputRef = useRef(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {hasFile && preview ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid var(--border)",
            background: "#0a0a0c",
          }}
        >
          <img
            src={preview}
            alt={label}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${label}`}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 22,
              height: 22,
              borderRadius: 999,
              border: "none",
              background: "rgba(0, 0, 0, 0.62)",
              color: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: 10,
            border: "1.5px dashed var(--border)",
            background: "var(--surface-2, rgba(255,255,255,0.02))",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
          }}
        >
          <Plus size={20} />
          <span>Click to upload</span>
        </button>
      )}
    </div>
  );
}

/* ── Rename modal ─────────────────────────────────────────────────── */

function RenameModal({ open, initial, onClose, onSubmit, loading }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(initial?.name || "");
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rename demo character"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(name.trim())}
            loading={loading}
            disabled={!name.trim() || loading}
          >
            Save
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {initial?.image_url && (
          <img
            src={initial.image_url}
            alt=""
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              objectFit: "cover",
              alignSelf: "center",
              border: "1px solid var(--border)",
            }}
          />
        )}
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 80))}
          maxLength={80}
          required
        />
      </div>
    </Modal>
  );
}
