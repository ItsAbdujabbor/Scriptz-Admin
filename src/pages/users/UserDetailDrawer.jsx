import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Youtube, Coins, UserCog, KeyRound, Copy, Trash2 } from "lucide-react";
import { qk } from "../../queries/keys";
import { usersApi } from "../../api/users";
import Drawer from "../../components/ui/Drawer";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Tabs from "../../components/ui/Tabs";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Modal from "../../components/ui/Modal";
import { Select, Textarea, Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { formatDateTime, formatNumber, formatRelative } from "../../lib/format";

export default function UserDetailDrawer({ userId, open, onClose }) {
  const [tab, setTab] = useState("profile");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [impersonateData, setImpersonateData] = useState(null);
  const [resetData, setResetData] = useState(null);
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.user(userId),
    queryFn: () => usersApi.get(userId),
    enabled: !!userId && open,
  });

  const { data: activity } = useQuery({
    queryKey: qk.userActivity(userId, { page: 1 }),
    queryFn: () => usersApi.activity(userId, { page: 1, page_size: 50 }),
    enabled: !!userId && open && tab === "activity",
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: qk.user(userId) });
  };

  const updateM = useMutation({
    mutationFn: (body) => usersApi.update(userId, body),
    onSuccess: () => { toast.success("User updated"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: () => usersApi.remove(userId),
    onSuccess: () => { toast.success("User deactivated"); invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const creditsM = useMutation({
    mutationFn: (body) => usersApi.adjustCredits(userId, body),
    onSuccess: (data) => {
      toast.success(`${data.delta > 0 ? "+" : ""}${data.delta} credits applied`);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const impersonateM = useMutation({
    mutationFn: () => usersApi.impersonate(userId),
    onSuccess: (data) => setImpersonateData(data),
    onError: (e) => toast.error(e.message),
  });

  const resetM = useMutation({
    mutationFn: () => usersApi.resetPassword(userId),
    onSuccess: (data) => setResetData(data),
    onError: (e) => toast.error(e.message),
  });

  const user = data;

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={user?.email || "User"}
        subtitle={user ? `User #${user.id} · joined ${formatRelative(user.created_at)}` : ""}
        width={600}
      >
        {isLoading || !user ? (
          <div style={{ color: "var(--text-secondary)" }}>Loading…</div>
        ) : (
          <>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "profile", label: "Profile" },
                { value: "youtube", label: "YouTube", count: user.youtube_channels?.length || 0 },
                { value: "credits", label: "Credits" },
                { value: "activity", label: "Activity" },
                { value: "actions", label: "Actions" },
              ]}
            />

            {tab === "profile" && <ProfileTab user={user} />}
            {tab === "youtube" && <YouTubeTab user={user} />}
            {tab === "credits" && <CreditsTab user={user} onApply={creditsM.mutate} loading={creditsM.isPending} />}
            {tab === "activity" && <ActivityTab items={activity?.items || []} />}
            {tab === "actions" && (
              <ActionsTab
                user={user}
                banReason={banReason}
                setBanReason={setBanReason}
                onUpdate={updateM.mutate}
                onImpersonate={() => impersonateM.mutate()}
                onReset={() => resetM.mutate()}
                onDelete={() => setConfirmDelete(true)}
                impersonating={impersonateM.isPending}
                resetting={resetM.isPending}
              />
            )}
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteM.mutate();
          setConfirmDelete(false);
        }}
        title="Deactivate this user?"
        message="The user will be marked banned and their account deactivated."
        confirmLabel="Deactivate"
        loading={deleteM.isPending}
      />

      <ImpersonateModal
        data={impersonateData}
        onClose={() => setImpersonateData(null)}
      />

      <ResetTokenModal
        data={resetData}
        onClose={() => setResetData(null)}
      />
    </>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, alignItems: "center" }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--text-primary)", wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}

function ProfileTab({ user }) {
  return (
    <div style={{ display: "grid", gap: 14, marginTop: 18, animation: "fade-in 0.2s var(--ease)" }}>
      <Row label="Email" value={user.email} />
      <Row label="Username" value={user.username || "—"} />
      <Row label="Role" value={<Badge tone={user.role === "admin" ? "accent" : user.role === "banned" ? "danger" : "neutral"}>{user.role}</Badge>} />
      <Row label="Status" value={<Badge tone={user.is_active ? "success" : "danger"}>{user.is_active ? "active" : "inactive"}</Badge>} />
      <Row label="Model tier" value={user.selected_model_tier || "—"} />
      <Row label="Created" value={formatDateTime(user.created_at)} />
      <Row label="Paddle customer" value={user.paddle_customer_id || "—"} />
      {user.ban_reason && <Row label="Ban reason" value={user.ban_reason} />}
      <Row
        label="Active subscription"
        value={
          user.stats?.active_subscription
            ? <Badge tone="success">{user.stats.active_subscription}</Badge>
            : "none"
        }
      />
    </div>
  );
}

function YouTubeTab({ user }) {
  const channels = user.youtube_channels || [];
  if (channels.length === 0) {
    return (
      <div style={{ marginTop: 20, padding: 24, textAlign: "center", color: "var(--text-secondary)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
        <Youtube size={28} style={{ color: "var(--red)", marginBottom: 8 }} />
        <div style={{ fontSize: 13 }}>No YouTube channel connected.</div>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10, animation: "fade-in 0.2s var(--ease)" }}>
      {channels.map((c) => (
        <div
          key={c.channel_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: 14,
            background: "var(--bg-tertiary)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,69,58,0.14)", color: "var(--red)", display: "grid", placeItems: "center" }}>
              <Youtube size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.channel_title || c.channel_id}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{c.channel_id}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                Connected {formatRelative(c.connected_at)}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-light)" }}>
              {formatNumber(c.subscriber_count || 0)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>subscribers</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreditsTab({ user, onApply, loading }) {
  const [delta, setDelta] = useState(100);
  const [reason, setReason] = useState("Admin grant");
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14, animation: "fade-in 0.2s var(--ease)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Stat label="Subscription" value={user.stats?.credits_subscription} />
        <Stat label="Permanent" value={user.stats?.credits_permanent} />
        <Stat label="Lifetime used" value={user.stats?.credits_used_lifetime} />
        <Stat label="Lifetime granted" value={user.stats?.credits_granted_lifetime} />
      </div>
      <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "8px 0" }} />
      <h4 style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Adjust credits</h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
        <Input
          label="Delta (+ grant / − deduct)"
          type="number"
          value={delta}
          onChange={(e) => setDelta(Number(e.target.value))}
        />
        <Input
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          onClick={() => onApply({ delta, reason })}
          loading={loading}
          disabled={!delta || !reason.trim()}
        >
          <Coins size={14} /> Apply
        </Button>
        <Button size="md" variant="ghost" onClick={() => { setDelta(100); setReason("Admin grant"); }}>+100 quick</Button>
        <Button size="md" variant="ghost" onClick={() => { setDelta(-100); setReason("Admin adjustment"); }}>-100 quick</Button>
      </div>
    </div>
  );
}

function ActivityTab({ items }) {
  if (items.length === 0) {
    return <div style={{ marginTop: 18, color: "var(--text-secondary)", fontSize: 13 }}>No recent activity.</div>;
  }
  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, animation: "fade-in 0.2s var(--ease)" }}>
      {items.map((e) => (
        <div
          key={e.id}
          style={{
            display: "flex", justifyContent: "space-between", gap: 12,
            padding: 10, background: "var(--bg-tertiary)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, fontFamily: "var(--font-mono)" }}>{e.feature_key}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
              {formatRelative(e.created_at)} · {e.credits_charged} credits
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionsTab({ user, banReason, setBanReason, onUpdate, onImpersonate, onReset, onDelete, impersonating, resetting }) {
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16, animation: "fade-in 0.2s var(--ease)" }}>
      <div style={{ display: "grid", gap: 10 }}>
        <h4 style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Role & status</h4>
        <Select
          label="Role"
          value={user.role}
          onChange={(e) => onUpdate({ role: e.target.value })}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="banned">Banned</option>
        </Select>
        <div style={{ display: "flex", gap: 8 }}>
          {user.is_active ? (
            <Button variant="secondary" onClick={() => onUpdate({ is_active: false })}>Deactivate</Button>
          ) : (
            <Button variant="secondary" onClick={() => onUpdate({ is_active: true, role: "user", ban_reason: "" })}>Reactivate</Button>
          )}
          <Button variant="danger" onClick={() => onUpdate({ role: "banned", ban_reason: banReason || "Banned by admin" })}>Ban</Button>
        </div>
        <Textarea
          label="Ban reason (optional)"
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          rows={2}
          placeholder="Reason for ban or deactivation"
        />
      </div>

      <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

      <div style={{ display: "grid", gap: 10 }}>
        <h4 style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Access</h4>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={onImpersonate} loading={impersonating}>
            <UserCog size={14} /> Impersonate
          </Button>
          <Button variant="secondary" onClick={onReset} loading={resetting}>
            <KeyRound size={14} /> Password reset link
          </Button>
        </div>
      </div>

      <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: 0 }} />

      <div style={{ display: "grid", gap: 10 }}>
        <h4 style={{ margin: 0, fontSize: 13, color: "var(--red)" }}>Danger zone</h4>
        <Button variant="danger" onClick={onDelete}>
          <Trash2 size={14} /> Permanently deactivate
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: 12, background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{formatNumber(value || 0)}</div>
    </div>
  );
}

function ImpersonateModal({ data, onClose }) {
  return (
    <Modal open={!!data} onClose={onClose} title="Impersonation token" width={520}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Short-lived access token ({Math.floor((data.expires_in || 0) / 60)} min) for {data.user?.email}.
            Paste it into the main app's <code>localStorage</code> or use it as a Bearer in API calls.
            This action is logged.
          </div>
          <CopyBlock label="Access token" value={data.access_token} />
          <CopyBlock label="Refresh token" value={data.refresh_token} />
        </div>
      )}
    </Modal>
  );
}

function ResetTokenModal({ data, onClose }) {
  return (
    <Modal open={!!data} onClose={onClose} title="Password reset token" width={520}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {data.message}
          </div>
          <CopyBlock label="Reset token" value={data.reset_token} />
        </div>
      )}
    </Modal>
  );
}

function CopyBlock({ label, value }) {
  const toast = useToast();
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <code
          style={{
            flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border)",
            padding: "8px 10px", borderRadius: "var(--radius-sm)",
            fontSize: 11, fontFamily: "var(--font-mono)", wordBreak: "break-all",
            maxHeight: 120, overflow: "auto",
          }}
        >{value}</code>
        <Button variant="secondary" size="sm" onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("Copied");
        }}>
          <Copy size={12} />
        </Button>
      </div>
    </div>
  );
}
