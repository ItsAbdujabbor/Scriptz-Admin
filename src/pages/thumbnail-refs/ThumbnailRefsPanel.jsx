import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  ImageOff,
  Eye,
  EyeOff,
  Upload,
  Youtube,
} from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Input } from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import { thumbnailRefsApi } from "../../api/thumbnailRefs";
import { qk } from "../../queries/keys";
import "./ThumbnailRefsPanel.css";

/**
 * Admin panel — manage the curated reference thumbnails fed to the AI
 * at generation time. The taxonomy (topic classes) is code-driven on
 * the backend; admins only pick which of those classes each uploaded
 * reference belongs to.
 */
export default function ThumbnailRefsPanel() {
  const toast = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [classFilter, setClassFilter] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const classesQuery = useQuery({
    queryKey: qk.thumbnailRefTopicClasses,
    queryFn: () => thumbnailRefsApi.listTopicClasses(),
    staleTime: 5 * 60 * 1000,
  });

  const listParams = useMemo(
    () => ({ topic_class: classFilter || undefined, include_inactive: includeInactive }),
    [classFilter, includeInactive]
  );
  const listQuery = useQuery({
    queryKey: qk.thumbnailRefs(listParams),
    queryFn: () => thumbnailRefsApi.list(listParams),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["thumbnail-refs"] });

  const removeM = useMutation({
    mutationFn: (id) => thumbnailRefsApi.remove(id),
    onSuccess: () => {
      toast.success("Reference deleted");
      setDeleting(null);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActiveM = useMutation({
    mutationFn: ({ id, is_active }) => thumbnailRefsApi.update(id, { is_active }),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const classes = classesQuery.data?.items || [];
  const items = listQuery.data?.items || [];
  const total = listQuery.data?.total || 0;

  // Group references by topic class for the grid display.
  const grouped = useMemo(() => {
    const out = new Map();
    for (const cls of classes) out.set(cls.key, { cls, items: [] });
    for (const item of items) {
      if (!out.has(item.topic_class)) {
        out.set(item.topic_class, { cls: { key: item.topic_class, label: item.topic_class }, items: [] });
      }
      out.get(item.topic_class).items.push(item);
    }
    return Array.from(out.values()).filter((g) => !classFilter || g.cls.key === classFilter);
  }, [classes, items, classFilter]);

  return (
    <div className="page">
      <Card
        title={`Thumbnail references${total ? ` (${total})` : ""}`}
        actions={
          <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="tr-select"
              aria-label="Filter by topic class"
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <label className="tr-toggle" title="Show inactive references">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              <span>Inactive</span>
            </label>
            <Button onClick={() => setUploading(true)}>
              <Plus size={14} /> Upload reference
            </Button>
          </div>
        }
        padded
      >
        <p className="tr-help">
          Upload example thumbnails for each topic class. When a user generates a
          thumbnail without selecting a persona or style, the AI pulls 1–2 of
          these references for the matching topic and uses them as visual
          grounding for <code>gpt-image-1</code>.
        </p>

        {listQuery.isLoading ? (
          <div className="tr-loading">
            <Spinner /> Loading references…
          </div>
        ) : grouped.every((g) => g.items.length === 0) ? (
          <EmptyState
            title="No references yet"
            description="Upload your first reference thumbnail to start guiding the AI."
          />
        ) : (
          <div className="tr-groups">
            {grouped.map((group) => (
              <div key={group.cls.key} className="tr-group">
                <div className="tr-group-header">
                  <h3 className="tr-group-title">{group.cls.label}</h3>
                  <span className="tr-group-count">{group.items.length}</span>
                </div>
                {group.cls.description ? (
                  <p className="tr-group-desc">{group.cls.description}</p>
                ) : null}
                {group.items.length === 0 ? (
                  <div className="tr-group-empty">No references in this class yet.</div>
                ) : (
                  <div className="tr-grid">
                    {group.items.map((item) => (
                      <ReferenceCard
                        key={item.id}
                        item={item}
                        onDelete={() => setDeleting(item)}
                        onToggleActive={() =>
                          toggleActiveM.mutate({ id: item.id, is_active: !item.is_active })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <UploadReferenceModal
        open={uploading}
        classes={classes}
        onClose={() => setUploading(false)}
        onUploaded={() => {
          setUploading(false);
          invalidate();
          toast.success("Reference uploaded");
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete reference?"
        message={
          deleting
            ? `"${deleting.name || deleting.topic_class + ' reference'}" will be removed from Supabase and the library.`
            : ""
        }
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && removeM.mutate(deleting.id)}
        loading={removeM.isPending}
      />
    </div>
  );
}

function ReferenceCard({ item, onDelete, onToggleActive }) {
  const [copied, setCopied] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.image_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be blocked — silent */
    }
  };

  const urlShort = useMemo(() => truncateUrl(item.image_url), [item.image_url]);

  return (
    <div className={`tr-card ${item.is_active ? "" : "is-inactive"}`}>
      <div className="tr-card-thumb">
        {imgOk ? (
          <img
            src={item.image_url}
            alt={item.name || item.topic_class}
            loading="lazy"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="tr-card-broken">
            <ImageOff size={24} />
            <span>Image failed to load</span>
          </div>
        )}
        {!item.is_active && <Badge tone="neutral" className="tr-inactive-badge">Inactive</Badge>}
      </div>

      <div className="tr-card-body">
        {item.name ? <div className="tr-card-name">{item.name}</div> : null}
        <button
          type="button"
          className="tr-card-url"
          onClick={handleCopy}
          title="Copy URL"
        >
          <span className="tr-card-url-text">{urlShort}</span>
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>

      <div className="tr-card-actions">
        <Button size="sm" variant="ghost" onClick={onToggleActive} title={item.is_active ? "Disable" : "Enable"}>
          {item.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} title="Delete">
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}

/**
 * Parse a YouTube URL into a video ID on the client so we can render a
 * live preview without bouncing through the backend. Matches watch URLs,
 * short URLs, and shorts URLs. Returns null on invalid input.
 */
function parseYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{6,})/,
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function UploadReferenceModal({ open, classes, onClose, onUploaded }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState("file"); // "file" | "youtube"

  // Shared
  const [topicClass, setTopicClass] = useState("");
  const [name, setName] = useState("");

  // File tab
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // YouTube tab
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const youtubeId = useMemo(() => parseYouTubeId(youtubeUrl), [youtubeUrl]);
  const [youtubePreviewOk, setYoutubePreviewOk] = useState(true);
  useEffect(() => setYoutubePreviewOk(true), [youtubeId]);

  const resetForm = () => {
    setTab("file");
    setTopicClass("");
    setName("");
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setYoutubeUrl("");
  };

  const uploadM = useMutation({
    mutationFn: (payload) => thumbnailRefsApi.upload(payload),
    onSuccess: () => {
      resetForm();
      onUploaded?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const importM = useMutation({
    mutationFn: (payload) => thumbnailRefsApi.importFromYouTube(payload),
    onSuccess: () => {
      resetForm();
      onUploaded?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const busy = uploadM.isPending || importM.isPending;

  const handlePickFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const canSubmit =
    !busy &&
    !!topicClass &&
    (tab === "file" ? !!file : !!youtubeId);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!topicClass) return toast.error("Choose a topic class.");
    if (tab === "file") {
      if (!file) return toast.error("Pick an image first.");
      uploadM.mutate({
        file,
        topic_class: topicClass,
        name: name.trim() || undefined,
      });
      return;
    }
    if (tab === "youtube") {
      if (!youtubeId) return toast.error("Paste a valid YouTube URL.");
      importM.mutate({
        youtube_url: youtubeUrl.trim(),
        topic_class: topicClass,
        name: name.trim() || undefined,
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) {
          resetForm();
          onClose();
        }
      }}
      title="Upload reference thumbnail"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {uploadM.isPending
              ? "Uploading…"
              : importM.isPending
                ? "Importing…"
                : tab === "file"
                  ? "Upload"
                  : "Import from YouTube"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="tr-form">
        {/* Source tabs */}
        <div className="tr-source-tabs" role="tablist" aria-label="Source type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "file"}
            className={`tr-source-tab ${tab === "file" ? "is-active" : ""}`}
            onClick={() => setTab("file")}
          >
            <Upload size={14} />
            <span>Upload image</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "youtube"}
            className={`tr-source-tab ${tab === "youtube" ? "is-active" : ""}`}
            onClick={() => setTab("youtube")}
          >
            <Youtube size={14} />
            <span>From YouTube</span>
          </button>
        </div>

        {tab === "file" ? (
          <div
            className={`tr-drop ${previewUrl ? "has-file" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("is-drag");
            }}
            onDragLeave={(e) => e.currentTarget.classList.remove("is-drag")}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("is-drag");
              handlePickFile(e.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => handlePickFile(e.target.files?.[0])}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="tr-drop-preview" />
            ) : (
              <div className="tr-drop-empty">
                <Upload size={22} />
                <span>Click or drop an image here</span>
                <small>JPEG, PNG, or WebP — up to 8 MB</small>
              </div>
            )}
          </div>
        ) : (
          <div className="tr-yt-block">
            <Input
              label="YouTube URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              autoComplete="off"
            />
            <div className={`tr-yt-preview ${youtubeId ? "" : "is-empty"}`}>
              {youtubeId ? (
                youtubePreviewOk ? (
                  <img
                    key={youtubeId}
                    src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                    alt="YouTube thumbnail preview"
                    onError={() => setYoutubePreviewOk(false)}
                  />
                ) : (
                  <div className="tr-yt-preview-empty">
                    <ImageOff size={22} />
                    <span>Couldn't find a thumbnail for that URL.</span>
                  </div>
                )
              ) : (
                <div className="tr-yt-preview-empty">
                  <Youtube size={22} />
                  <span>Paste a YouTube watch / share / Shorts URL.</span>
                  <small>We'll download the highest-res thumbnail to Supabase.</small>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="tr-label">Topic class</label>
          <select
            className="tr-select tr-select--full"
            value={topicClass}
            onChange={(e) => setTopicClass(e.target.value)}
            required
          >
            <option value="">Choose a topic class…</option>
            {classes.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          {topicClass ? (
            <p className="tr-field-hint">
              {classes.find((c) => c.key === topicClass)?.description}
            </p>
          ) : null}
        </div>

        <Input
          label="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. MrBeast $1 vs $1M hotel"
          maxLength={160}
        />
      </form>
    </Modal>
  );
}

function truncateUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:")) {
    const head = url.slice(0, 22);
    return `${head}…(${Math.round((url.length - 23) / 1024)} KB)`;
  }
  if (url.length <= 60) return url;
  return `${url.slice(0, 36)}…${url.slice(-20)}`;
}
