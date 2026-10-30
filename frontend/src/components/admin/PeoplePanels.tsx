"use client";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { api, formatDate, hasPermission, label, type Me } from "@/components/admin/api";
import { Pager } from "@/components/admin/RecruitmentPanels";

// ------------------------------------------------------------------ enquiries

type Message = { id: string; name: string; email: string; phone: string | null; subject: string | null; status: string; createdAt: string; company: { name: string } | null; message?: string };

export function ContactPanel({ me }: { me: Me }) {
  const [status, setStatus] = useState("NEW");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; items: Message[] }>({ total: 0, items: [] });
  const [open, setOpen] = useState<Message | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await api(`/api/admin/contact?${status ? `status=${status}&` : ""}page=${page}`)); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [status, page]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("contact");
    if (id) void api<{ message: Message }>(`/api/admin/contact/${id}`).then((r) => setOpen(r.message)).catch(() => undefined);
  }, []);

  async function openMessage(id: string) {
    try { setOpen((await api<{ message: Message }>(`/api/admin/contact/${id}`)).message); } catch (e) { setError((e as Error).message); }
  }
  async function setMessageStatus(id: string, next: string) {
    try { setOpen((await api<{ message: Message }>(`/api/admin/contact/${id}`, { method: "PATCH", body: { status: next } })).message); await load(); } catch (e) { setError((e as Error).message); }
  }

  return (
    <>
      <div className="admin-list-heading">
        <div><h2>Website enquiries</h2><p>{data.total} {status ? label(status).toLowerCase() : "in total"}</p></div>
        <a className="admin-secondary-button" href={`/api/admin/contact/export${status ? `?status=${status}` : ""}`}>Export CSV</a>
      </div>
      <div className="admin-toolbar">
        <select aria-label="Filter by status" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All</option>
          {["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"].map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {data.items.length === 0 ? <p className="admin-empty">{loading ? "Loading…" : "No enquiries here."}</p> : (
        <table className="admin-table">
          <thead><tr><th>From</th><th>Subject</th><th>Status</th><th>Received</th></tr></thead>
          <tbody>
            {data.items.map((m) => (
              <tr key={m.id} onClick={() => openMessage(m.id)} className={open?.id === m.id ? "is-selected" : ""}>
                <td><button type="button" className="admin-link-button" onClick={() => openMessage(m.id)}>{m.name}</button><small>{m.email}</small></td>
                <td>{m.subject ?? "—"}<small>{m.company?.name ?? "Group"}</small></td>
                <td><span className={`admin-badge admin-badge-${m.status.toLowerCase()}`}>{label(m.status)}</span></td>
                <td>{formatDate(m.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Pager page={page} pageSize={25} total={data.total} onPage={setPage} />
      {open && (
        <aside className="admin-drawer" aria-label="Enquiry">
          <div className="admin-drawer-head"><h3>{open.name}</h3><button className="admin-close-button" type="button" onClick={() => setOpen(null)} aria-label="Close">×</button></div>
          <dl className="admin-facts">
            <dt>Email</dt><dd><a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject ?? "your enquiry"}`)}`}>{open.email}</a></dd>
            <dt>Phone</dt><dd>{open.phone ?? "—"}</dd>
            <dt>Received</dt><dd>{formatDate(open.createdAt)}</dd>
            <dt>Status</dt><dd>{label(open.status)}</dd>
          </dl>
          <p className="admin-cover-letter">{open.message}</p>
          {hasPermission(me, "contact.update") && (
            <div className="admin-button-row">
              {["IN_PROGRESS", "RESOLVED", "SPAM", "NEW"].filter((s) => s !== open.status).map((s) => (
                <button key={s} type="button" className="admin-secondary-button" onClick={() => setMessageStatus(open.id, s)}>Mark {label(s).toLowerCase()}</button>
              ))}
            </div>
          )}
        </aside>
      )}
    </>
  );
}

// ---------------------------------------------------------------------- users

type Membership = { roleKey: string; companyId: string | null };
type UserRow = {
  id: string; email: string; name: string; status: string; lastLoginAt: string | null; lockedUntil: string | null;
  memberships: { companyId: string | null; role: { key: string; name: string }; company: { name: string } | null }[];
};
const ROLES: { key: string; name: string; scope: "group" | "company" | "either" }[] = [
  { key: "SUPER_ADMIN", name: "Super Administrator", scope: "group" },
  { key: "GROUP_ADMIN", name: "Group Administrator", scope: "group" },
  { key: "COMPANY_ADMIN", name: "Company Administrator", scope: "company" },
  { key: "HR_MANAGER", name: "HR Manager", scope: "company" },
  { key: "CONTENT_EDITOR", name: "Content Editor", scope: "either" },
  { key: "CONTENT_PUBLISHER", name: "Content Publisher", scope: "either" },
  { key: "AUDITOR", name: "Read-only Auditor", scope: "either" },
];

function RolesEditor({ value, onChange, companies }: { value: Membership[]; onChange: (v: Membership[]) => void; companies: { id: string; name: string }[] }) {
  return (
    <div className="admin-roles">
      {value.map((m, i) => {
        const scope = ROLES.find((r) => r.key === m.roleKey)?.scope ?? "either";
        return (
          <div className="admin-role-row" key={i}>
            <select aria-label="Role" value={m.roleKey} onChange={(e) => {
              const role = ROLES.find((r) => r.key === e.target.value)!;
              const companyId = role.scope === "group" ? null : role.scope === "company" ? m.companyId ?? companies[0]?.id ?? null : m.companyId;
              onChange(value.map((x, j) => (j === i ? { roleKey: role.key, companyId } : x)));
            }}>
              {ROLES.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </select>
            <select aria-label="Applies to" value={m.companyId ?? ""} disabled={scope === "group"} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, companyId: e.target.value || null } : x)))}>
              {scope !== "company" && <option value="">Whole group</option>}
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" className="admin-close-button" aria-label="Remove role" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
          </div>
        );
      })}
      <button type="button" className="admin-link-button" onClick={() => onChange([...value, { roleKey: "HR_MANAGER", companyId: companies[0]?.id ?? null }])}>+ Add a role</button>
    </div>
  );
}

export function UsersPanel({ me }: { me: Me }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [invite, setInvite] = useState<{ email: string; name: string; memberships: Membership[] } | null>(null);
  const [editingRoles, setEditingRoles] = useState<{ id: string; memberships: Membership[] } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setUsers((await api<{ users: UserRow[] }>("/api/admin/users")).users);
      setCompanies((await api<{ companies: { id: string; name: string }[] }>("/api/admin/companies")).companies);
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function act(fn: () => Promise<unknown>, message: string) {
    setError(""); setNotice("");
    try { await fn(); setNotice(message); await load(); } catch (e) { setError((e as Error).message); }
  }

  return (
    <>
      <div className="admin-list-heading">
        <div><h2>Admin users</h2><p>Everyone signs in with their own account. Roles apply to the whole group or one company.</p></div>
        <button className="admin-primary-button" type="button" onClick={() => setInvite({ email: "", name: "", memberships: [{ roleKey: "HR_MANAGER", companyId: companies[0]?.id ?? null }] })}>Invite user <span aria-hidden="true">＋</span></button>
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}
      {invite && (
        <form className="admin-business-form" onSubmit={(e: FormEvent) => { e.preventDefault(); void act(async () => { await api("/api/admin/users", { body: invite }); setInvite(null); }, "Invitation sent. The link in the email is valid for 3 days."); }}>
          <div className="admin-form-heading"><h3>Invite a user</h3><button className="admin-close-button" type="button" onClick={() => setInvite(null)} aria-label="Close">×</button></div>
          <div className="admin-form-grid">
            <label>Full name<input value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} required maxLength={120} /></label>
            <label>Email<input type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} required /></label>
          </div>
          <RolesEditor value={invite.memberships} onChange={(memberships) => setInvite({ ...invite, memberships })} companies={companies} />
          <div className="admin-form-actions"><button className="admin-primary-button" type="submit">Send invitation</button></div>
        </form>
      )}
      {loading && <p className="admin-empty">Loading…</p>}
      <table className="admin-table">
        <thead><tr><th>User</th><th>Roles</th><th>Status</th><th>Last sign-in</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}<small>{u.email}</small></td>
              <td>
                {editingRoles?.id === u.id ? (
                  <>
                    <RolesEditor value={editingRoles.memberships} onChange={(memberships) => setEditingRoles({ id: u.id, memberships })} companies={companies} />
                    <div className="admin-button-row">
                      <button type="button" className="admin-primary-button" onClick={() => act(async () => { await api(`/api/admin/users/${u.id}/memberships`, { method: "PUT", body: { memberships: editingRoles.memberships } }); setEditingRoles(null); }, "Roles updated.")}>Save roles</button>
                      <button type="button" className="admin-secondary-button" onClick={() => setEditingRoles(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  u.memberships.map((m, i) => <small key={i}>{m.role.name} · {m.company?.name ?? "whole group"}</small>)
                )}
              </td>
              <td><span className={`admin-badge admin-badge-${u.status.toLowerCase()}`}>{label(u.status)}</span>{u.lockedUntil && new Date(u.lockedUntil) > new Date() && <small>Locked after failed sign-ins</small>}</td>
              <td>{formatDate(u.lastLoginAt)}</td>
              <td className="admin-button-row">
                <button type="button" className="admin-secondary-button" onClick={() => setEditingRoles({ id: u.id, memberships: u.memberships.map((m) => ({ roleKey: m.role.key, companyId: m.companyId })) })}>Roles</button>
                {u.id !== me.user.id && u.status === "ACTIVE" && <button type="button" className="admin-secondary-button" onClick={() => act(() => api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { status: "SUSPENDED" } }), `${u.name} suspended and signed out.`)}>Suspend</button>}
                {u.status === "SUSPENDED" && <button type="button" className="admin-secondary-button" onClick={() => act(() => api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { status: "ACTIVE" } }), `${u.name} reactivated.`)}>Reactivate</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
