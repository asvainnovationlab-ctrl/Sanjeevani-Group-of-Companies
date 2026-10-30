"use client";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { api, formatDate, hasPermission, label, type Me } from "@/components/admin/api";
import { Pager } from "@/components/admin/RecruitmentPanels";
import { roleAbilities, roleDescription, roleSections } from "@/components/admin/sections";

// ------------------------------------------------------------------ enquiries

type Message = { id: string; name: string; email: string; phone: string | null; subject: string | null; status: string; createdAt: string; company: { name: string } | null; message?: string; preview?: string };

const INBOX_TABS: [string, string][] = [["", "All"], ["NEW", "New"], ["IN_PROGRESS", "In progress"], ["RESOLVED", "Resolved"], ["SPAM", "Spam"]];
const EMPTY_TEXT: Record<string, [string, string]> = {
  "": ["No enquiries yet", "Messages people send from the Contact page appear here."],
  NEW: ["You're all caught up", "There are no new enquiries waiting for a reply."],
  IN_PROGRESS: ["Nothing in progress", "Enquiries you are working on appear here."],
  RESOLVED: ["Nothing resolved yet", "Enquiries you mark as resolved are kept here."],
  SPAM: ["No spam", "Messages you mark as spam are moved here."],
};
const mailIcon = (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
);

export function ContactPanel({ me, companyId = "" }: { me: Me; companyId?: string }) {
  const [status, setStatus] = useState("NEW");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; items: Message[] }>({ total: 0, items: [] });
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [open, setOpen] = useState<Message | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const scope = companyId ? `companyId=${companyId}&` : "";
  const filter = `${status ? `status=${status}&` : ""}${search ? `q=${encodeURIComponent(search)}&` : ""}${scope}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/api/admin/contact?${filter}page=${page}`));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);
  useEffect(() => { void load(); }, [load]);

  const loadCounts = useCallback(async () => {
    try {
      const pairs = await Promise.all(INBOX_TABS.map(async ([s]) => [s, (await api<{ total: number }>(`/api/admin/contact?${s ? `status=${s}&` : ""}${scope}pageSize=1`)).total] as const));
      setCounts(Object.fromEntries(pairs));
    } catch {
      setCounts({});
    }
  }, [scope]);
  useEffect(() => { void loadCounts(); }, [loadCounts]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("contact");
    if (id) void api<{ message: Message }>(`/api/admin/contact/${id}`).then((r) => setOpen(r.message)).catch(() => undefined);
  }, []);

  async function openMessage(id: string) {
    try { setOpen((await api<{ message: Message }>(`/api/admin/contact/${id}`)).message); } catch (e) { setError((e as Error).message); }
  }
  async function setMessageStatus(id: string, next: string) {
    try {
      setOpen((await api<{ message: Message }>(`/api/admin/contact/${id}`, { method: "PATCH", body: { status: next } })).message);
      await Promise.all([load(), loadCounts()]);
    } catch (e) { setError((e as Error).message); }
  }

  const [emptyTitle, emptyText] = EMPTY_TEXT[status] ?? EMPTY_TEXT[""];
  return (
    <>
      <div className="adm-inbox-bar">
        <div className="adm-inbox-tabs" role="tablist" aria-label="Filter by status">
          {INBOX_TABS.map(([s, l]) => (
            <button key={s || "all"} type="button" role="tab" aria-selected={status === s} onClick={() => { setPage(1); setStatus(s); }}>
              {l}
              <span className="adm-inbox-count num">{counts[s] ?? "…"}</span>
            </button>
          ))}
        </div>
        <a className="admin-secondary-button" href={`/api/admin/contact/export?${filter}`}>Export CSV</a>
      </div>

      <form className="adm-inbox-search" role="search" onSubmit={(e: FormEvent) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
        <input type="search" aria-label="Search enquiries" placeholder="Search by name, email or subject" value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) { setPage(1); setSearch(""); } }} />
        <button type="submit" className="admin-secondary-button">Search</button>
      </form>

      {error && <p className="admin-message admin-error" role="alert">{error} <button type="button" className="admin-link-button" onClick={() => void load()}>Try again</button></p>}

      <section className="adm-card adm-inbox" aria-busy={loading}>
        {data.items.length === 0 ? (
          <div className="adm-empty-state">
            <span className="adm-empty-icon">{mailIcon}</span>
            <h3>{loading ? "Loading enquiries…" : search ? "No matches" : emptyTitle}</h3>
            {!loading && <p className="adm-muted">{search ? `Nothing matches "${search}".` : emptyText}</p>}
            {!loading && (status || search) && (
              <button type="button" className="admin-secondary-button" onClick={() => { setStatus(""); setQ(""); setSearch(""); setPage(1); }}>Show all enquiries</button>
            )}
          </div>
        ) : (
          <ul className="adm-inbox-list">
            {data.items.map((m) => (
              <li key={m.id}>
                <button type="button" className={`adm-inbox-row${open?.id === m.id ? " is-selected" : ""}`} onClick={() => openMessage(m.id)}>
                  <span className="adm-inbox-avatar" aria-hidden="true">{m.name.trim().charAt(0).toUpperCase()}</span>
                  <span className="adm-inbox-main">
                    <span className="adm-inbox-top"><strong>{m.name}</strong><span className="adm-muted">{formatDate(m.createdAt)}</span></span>
                    <span className="adm-inbox-subject">{m.subject ?? "Website enquiry"}</span>
                    <span className="adm-inbox-meta">{m.email}{m.company ? `, for ${m.company.name}` : ""}</span>
                  </span>
                  <span className={`admin-badge admin-badge-${m.status.toLowerCase()}`}>{label(m.status)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Pager page={page} pageSize={25} total={data.total} onPage={setPage} />

      {open && <button type="button" className="adm-drawer-scrim" aria-label="Close enquiry" onClick={() => setOpen(null)} />}
      {open && (
        <aside className="admin-drawer" aria-label="Enquiry">
          <div className="admin-drawer-head">
            <div>
              <h3>{open.subject ?? "Website enquiry"}</h3>
              <p className="adm-muted">From {open.name}, {formatDate(open.createdAt)}</p>
            </div>
            <button className="admin-close-button" type="button" onClick={() => setOpen(null)} aria-label="Close">×</button>
          </div>
          <a className="admin-primary-button adm-reply" href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject ?? "your enquiry"}`)}`}>Reply by email</a>
          <dl className="admin-facts">
            <dt>Email</dt><dd><a href={`mailto:${open.email}`}>{open.email}</a></dd>
            <dt>Phone</dt><dd>{open.phone ? <a href={`tel:${open.phone}`}>{open.phone}</a> : "Not given"}</dd>
            <dt>For</dt><dd>{open.company?.name ?? "Sanjeevani Group"}</dd>
            <dt>Status</dt><dd><span className={`admin-badge admin-badge-${open.status.toLowerCase()}`}>{label(open.status)}</span></dd>
          </dl>
          <h4>Message</h4>
          <p className="admin-cover-letter">{open.message}</p>
          {hasPermission(me, "contact.update") && (
            <>
              <h4>Update status</h4>
              <div className="admin-button-row">
                {["IN_PROGRESS", "RESOLVED", "SPAM", "NEW"].filter((s) => s !== open.status).map((s) => (
                  <button key={s} type="button" className="admin-secondary-button" onClick={() => setMessageStatus(open.id, s)}>Mark {label(s).toLowerCase()}</button>
                ))}
              </div>
            </>
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

// Super and Group Administrator accounts are handled only by a Super
// Administrator (the server refuses anyone else), so others are not offered them.
const ADMIN_ROLES = ["SUPER_ADMIN", "GROUP_ADMIN"];

function RolesEditor({ value, onChange, companies, canGrantAdmin }: { value: Membership[]; onChange: (v: Membership[]) => void; companies: { id: string; name: string }[]; canGrantAdmin: boolean }) {
  // A company role needs a company: pick the first one once the list has loaded.
  useEffect(() => {
    if (!companies.length) return;
    const fixed = value.map((m) => (ROLES.find((r) => r.key === m.roleKey)?.scope === "company" && !m.companyId ? { ...m, companyId: companies[0].id } : m));
    if (fixed.some((m, i) => m !== value[i])) onChange(fixed);
  }, [companies, value, onChange]);
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
              {ROLES.filter((r) => canGrantAdmin || !ADMIN_ROLES.includes(r.key)).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </select>
            <select aria-label="Applies to" value={m.companyId ?? ""} disabled={scope === "group"} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, companyId: e.target.value || null } : x)))}>
              {scope !== "company" && <option value="">Whole group</option>}
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" className="admin-close-button" aria-label="Remove role" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
            <div className="adm-role-explain">
              <p>{roleDescription(m.roleKey)}</p>
              <p className="adm-chips">
                {roleSections(m.roleKey).map((s) => <span key={s.key} className="adm-chip">{s.label}</span>)}
              </p>
              <p className="adm-muted">Can {roleAbilities(m.roleKey).join(", ")}, for {m.companyId ? companies.find((c) => c.id === m.companyId)?.name ?? "one company" : "the whole group"}.</p>
            </div>
          </div>
        );
      })}
      <button type="button" className="admin-link-button" onClick={() => onChange([...value, { roleKey: "HR_MANAGER", companyId: companies[0]?.id ?? null }])}>+ Add a role</button>
    </div>
  );
}

// The sections a set of roles opens, as labels (Dashboard and My account are always there).
function accessFor(roles: string[]) {
  return [...new Set(roles.flatMap((r) => roleSections(r).map((s) => s.label)))];
}

function AccessPreview({ roles }: { roles: string[] }) {
  const labels = accessFor(roles);
  return (
    <div className="adm-access-preview">
      <strong>This person will see</strong>
      <p className="adm-chips">
        <span className="adm-chip">Dashboard</span>
        {labels.map((l) => <span key={l} className="adm-chip">{l}</span>)}
        <span className="adm-chip">My account</span>
      </p>
      {labels.length === 0 && <p className="adm-muted">Add a role to give access to more sections.</p>}
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
  const isSuper = me.roles.includes("SUPER_ADMIN");

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
          <RolesEditor value={invite.memberships} onChange={(memberships) => setInvite({ ...invite, memberships })} companies={companies} canGrantAdmin={isSuper} />
          <AccessPreview roles={invite.memberships.map((m) => m.roleKey)} />
          <div className="admin-form-actions"><button className="admin-primary-button" type="submit">Send invitation</button></div>
        </form>
      )}
      {loading && users.length === 0 && <p className="admin-empty">Loading…</p>}
      <table className="admin-table">
        <thead><tr><th>User</th><th>Roles</th><th>Can open</th><th>Status</th><th>Last sign-in</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}<small>{u.email}</small></td>
              <td>
                {editingRoles?.id === u.id ? (
                  <>
                    <RolesEditor value={editingRoles.memberships} onChange={(memberships) => setEditingRoles({ id: u.id, memberships })} companies={companies} canGrantAdmin={isSuper} />
                    <div className="admin-button-row">
                      <button type="button" className="admin-primary-button" onClick={() => act(async () => { await api(`/api/admin/users/${u.id}/memberships`, { method: "PUT", body: { memberships: editingRoles.memberships } }); setEditingRoles(null); }, "Roles updated.")}>Save roles</button>
                      <button type="button" className="admin-secondary-button" onClick={() => setEditingRoles(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  u.memberships.map((m, i) => <small key={i}>{m.role.name}, {m.company?.name ?? "whole group"}</small>)
                )}
              </td>
              <td><p className="adm-chips">{accessFor(u.memberships.map((m) => m.role.key)).map((label) => <span key={label} className="adm-chip">{label}</span>)}</p></td>
              <td><span className={`admin-badge admin-badge-${u.status.toLowerCase()}`}>{label(u.status)}</span>{u.lockedUntil && new Date(u.lockedUntil) > new Date() && <small>Locked after failed sign-ins</small>}</td>
              <td>{formatDate(u.lastLoginAt)}</td>
              <td className="admin-button-row">
                {!isSuper && u.memberships.some((m) => ADMIN_ROLES.includes(m.role.key)) ? <small>Managed by a Super Administrator</small> : <>
                <button type="button" className="admin-secondary-button" onClick={() => setEditingRoles({ id: u.id, memberships: u.memberships.map((m) => ({ roleKey: m.role.key, companyId: m.companyId })) })}>Roles</button>
                {u.id !== me.user.id && u.status === "ACTIVE" && <button type="button" className="admin-secondary-button" onClick={() => act(() => api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { status: "SUSPENDED" } }), `${u.name} suspended and signed out.`)}>Suspend</button>}
                {u.status === "SUSPENDED" && <button type="button" className="admin-secondary-button" onClick={() => act(() => api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { status: "ACTIVE" } }), `${u.name} reactivated.`)}>Reactivate</button>}
                </>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
