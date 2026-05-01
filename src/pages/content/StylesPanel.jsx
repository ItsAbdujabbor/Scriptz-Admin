import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
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
 * StylesPanel — admin-managed (stock) thumbnail styles.
 *
 * Each style is one image upload + a name. The image is stored as a
 * base64 data URL on the server (same pipeline the user app uses for
 * personal style uploads). Renaming an existing style is allowed; the
 * image is set once at creation time, no URL field, no replace flow.
 */
export default function StylesPanel() {
  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const params = { page, page_size: 25 };
  const { data, isLoading } = useQuery({
    queryKey: qk.styles(params),
    queryFn: () => contentApi.styles.list(params),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["styles"] });

  const uploadM = useMutation({
    mutationFn: ({ image, name }) => {
      const fd = new FormData();
      fd.append("image", image);
      fd.append("name", name);
      return contentApi.styles.createFromUpload(fd);
    },
    onSuccess: () => {
      toast.success("Style uploaded");
      setCreating(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const renameM = useMutation({
    mutationFn: ({ id, body }) => contentApi.styles.update(id, body),
    onSuccess: () => {
      toast.success("Style renamed");
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeM = useMutation({
    mutationFn: (id) => contentApi.styles.remove(id),
    onSuccess: () => {
      toast.success("Style deleted");
      setDeleting(null);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const columns = [
    {
      key: "image_url",
      header: "",
      width: 72,
      cell: (r) => (
        <img
          src={r.image_url}
          alt=""
          style={{
            width: 54,
            height: 30,
            objectFit: "cover",
            borderRadius: 6,
            border: "1px solid var(--border)",
          }}
        />
      ),
    },
    { key: "name", header: "Name", cell: (r) => <b>{r.name}</b> },
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
        title={`Stock styles${data ? ` (${data.total})` : ""}`}
        subtitle="Visible to every user as Stock styles in their styles dialog"
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
          empty="No stock styles yet — upload one to make it available to every user."
        />
        <Pagination
          page={page}
          pageSize={25}
          total={data?.total || 0}
          onChange={setPage}
        />
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
        title="Delete style?"
        message={`This removes "${deleting?.name}" from the stock styles every user sees.`}
        loading={removeM.isPending}
      />
    </>
  );
}

/* ── Upload modal ─────────────────────────────────────────────────── */

function UploadModal({ open, onClose, onSubmit, loading }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Reset state every time the modal opens.
  useEffect(() => {
    if (open) {
      setName("");
      setFile(null);
      setPreviewUrl("");
      setError("");
    }
  }, [open]);

  // Local object URL preview so the admin sees what they're uploading.
  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Pick an image file (jpeg, png, webp).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image too large — max 5 MB.");
      return;
    }
    setError("");
    setFile(f);
  };

  const canSubmit = !!file && !!name.trim() && !loading;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New stock style"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit({ image: file, name: name.trim() })}
            loading={loading}
            disabled={!canSubmit}
          >
            Upload
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
          placeholder="e.g. MrBeast challenge, Cinematic dad"
          required
        />

        <div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            Thumbnail image
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          {previewUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Choose a different image
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 10,
                border: "1.5px dashed var(--border)",
                background: "var(--surface-2, rgba(255,255,255,0.02))",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            >
              <Upload size={20} />
              <span>Click to upload thumbnail</span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-tertiary, var(--text-secondary))",
                }}
              >
                JPEG, PNG, or WEBP · up to 5 MB
              </span>
            </button>
          )}
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
      </div>
    </Modal>
  );
}

/* ── Rename modal — image is set at creation, only name is mutable ── */

function RenameModal({ open, initial, onClose, onSubmit, loading }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(initial?.name || "");
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rename style"
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
              width: "100%",
              aspectRatio: "16 / 9",
              objectFit: "cover",
              borderRadius: 10,
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
