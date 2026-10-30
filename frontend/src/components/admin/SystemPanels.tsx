"use client";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { api, formatDate, type Me } from "@/components/admin/api";
import { Pager } from "@/components/admin/RecruitmentPanels";

// --------------------------------------------------------------------- audit

type AuditRow = { id: string; action: string; entityType: string | null; entityId: string | null; createdAt: string; metadata: unknown; actor: { name: string; email: string } | null };

export function AuditPanel() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; items: AuditRow[] }>({ total: 0, items: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const query = action ? `action=${encodeURIComponent(action)}&` : "";

  const load = useCallback(async () => {
    try { setData(await api(`/api/admin/audit?${query}page=${page}&pageSize=50`)); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [query, page]);
  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="admin-list-heading">
        <div><h2>Audit log</h2><p>{loading ? "Loading…" : `${data.total} entries · who did what, and when (Nepal time)`}</p></div>
        <a className="admin-secondary-button" href={`/api/admin/audit/export?${query}`}>Export CSV</a>
      </div>
      <div className="admin-toolbar">
        <select aria-label="Filter by area" value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }}>
          <option value="">Everything</option>
          <option value="auth.">Sign-ins and passwords</option>
          <option value="user.">Users and roles</option>
          <option value="application.">Applications</option>
          <option value="vacancy.">Vacancies</option>
          <option value="company.">Companies</option>
          <option value="contact.">Enquiries</option>
          <option value="settings.">Settings</option>
          <option value="media.">Media</option>
        </select>
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      <table className="admin-table">
        <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th></tr></thead>
        <tbody>
          {data.items.map((r) => (
            <tr key={r.id}>
              <td>{formatDate(r.createdAt)}</td>
              <td>{r.actor ? <>{r.actor.name}<small>{r.actor.email}</small></> : <small>Website visitor / system</small>}</td>
              <td><code>{r.action}</code></td>
              <td>{r.entityType ?? "—"}{r.metadata ? <small>{JSON.stringify(r.metadata).slice(0, 140)}</small> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager page={page} pageSize={50} total={data.total} onPage={setPage} />
    </>
  );
}

// ------------------------------------------------------------------ settings

const FIELDS: { key: string; label: string; type?: "checkbox" | "url" | "email" }[] = [
  { key: "contact.email", label: "Contact email", type: "email" },
  { key: "contact.phone", label: "Contact phone" },
  { key: "contact.address", label: "Head office address" },
  { key: "social.facebook", label: "Facebook page", type: "url" },
  { key: "social.youtube", label: "YouTube channel", type: "url" },
  { key: "social.linkedin", label: "LinkedIn page", type: "url" },
  { key: "social.instagram", label: "Instagram", type: "url" },
  { key: "seo.defaultTitle", label: "Default page title (search engines)" },
  { key: "seo.defaultDescription", label: "Default description (search engines)" },
  { key: "careers.applicationsOpen", label: "Accept online job applications", type: "checkbox" },
];

export function SettingsPanel() {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api<{ settings: Record<string, unknown> }>("/api/admin/settings").then((r) => setValues(r.settings)).catch((e: Error) => setError(e.message));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(""); setNotice("");
    const body = Object.fromEntries(FIELDS.map((f) => {
      const v = values[f.key];
      return [f.key, f.type === "checkbox" ? Boolean(v) : typeof v === "string" && v.trim() ? v.trim() : null];
    }));
    try { setValues((await api<{ settings: Record<string, unknown> }>("/api/admin/settings", { method: "PUT", body })).settings); setNotice("Settings saved."); } catch (e) { setError((e as Error).message); }
  }

  return (
    <form className="admin-business-form" onSubmit={save}>
      <div className="admin-form-heading"><h3>Site settings</h3></div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}
      <div className="admin-form-grid">
        {FIELDS.map((f) => f.type === "checkbox" ? (
          <label key={f.key} className="admin-publish-field"><input type="checkbox" checked={Boolean(values[f.key])} onChange={(e) => setValues({ ...values, [f.key]: e.target.checked })} /> {f.label}</label>
        ) : (
          <label key={f.key}>{f.label}<input type={f.type ?? "text"} value={typeof values[f.key] === "string" ? (values[f.key] as string) : ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} /></label>
        ))}
      </div>
      <div className="admin-form-actions"><button className="admin-primary-button" type="submit">Save settings</button></div>
    </form>
  );
}

// ------------------------------------------------------------------- account

export function AccountPanel({ me, onSignedOut }: { me: Me; onSignedOut: () => void }) {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setNotice("");
    if (newPassword !== confirm) return setError("The new passwords do not match.");
    try {
      const r = await api<{ message: string }>("/api/auth/password", { body: { currentPassword, newPassword } });
      setNotice(r.message); setCurrent(""); setNew(""); setConfirm("");
    } catch (e) {
      setError((e as Error).message);
      if ((e as { status?: number }).status === 401) onSignedOut();
    }
  }

  return (
    <form className="admin-business-form" onSubmit={submit}>
      <div className="admin-form-heading"><h3>My account</h3></div>
      <p>{me.user.name} · {me.user.email}</p>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}
      <div className="admin-form-grid">
        <label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required /></label>
        <label>New password (12+ characters)<input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={newPassword} onChange={(e) => setNew(e.target.value)} required /></label>
        <label>Repeat new password<input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></label>
      </div>
      <div className="admin-form-actions"><button className="admin-primary-button" type="submit">Change password</button></div>
    </form>
  );
}
