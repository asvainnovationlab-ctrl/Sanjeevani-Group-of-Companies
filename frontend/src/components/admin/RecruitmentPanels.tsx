"use client";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { api, formatDate, hasPermission, label, type Me } from "@/components/admin/api";
import { allowedNextStatuses, type ApplicationStatus } from "@/server/recruitment/rules";

const APPLICATION_STATUSES: ApplicationStatus[] = ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"];

type ApplicationRow = {
  id: string; referenceNumber: string; vacancyTitle: string; fullName: string; email: string; phone: string; status: ApplicationStatus; createdAt: string;
  company: { name: string } | null;
};

type ApplicationDetail = ApplicationRow & {
  age: number; gender: string | null; address: string; education: string; experienceYears: string; currentEmployer: string | null; expectedSalary: string | null; coverLetter: string | null;
  documents: { id: string; originalName: string; bytes: number }[];
  statusHistory: { id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string; changedBy: { name: string } | null }[];
  notes: { id: string; body: string; createdAt: string; author: { name: string } | null }[];
};

export function ApplicationsPanel({ me }: { me: Me }) {
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; items: ApplicationRow[] }>({ total: 0, items: [] });
  const [openId, setOpenId] = useState<string | null>(() => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("application")));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const query = new URLSearchParams({ ...(filters.q ? { q: filters.q } : {}), ...(filters.status ? { status: filters.status } : {}) }).toString();
  const load = useCallback(async () => {
    try {
      setData(await api(`/api/admin/job-applications?${query}&page=${page}&pageSize=25`));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query, page]);
  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="admin-list-heading">
        <div><h2>Job applications</h2><p>{loading ? "Loading…" : `${data.total} matching`}</p></div>
        {hasPermission(me, "application.export") && <a className="admin-secondary-button" href={`/api/admin/job-applications/export?${query}`}>Export CSV</a>}
      </div>
      <div className="admin-toolbar">
        <input aria-label="Search applications" placeholder="Name, email, phone or reference" value={filters.q} onChange={(e) => { setPage(1); setFilters({ ...filters, q: e.target.value }); }} />
        <select aria-label="Filter by status" value={filters.status} onChange={(e) => { setPage(1); setFilters({ ...filters, status: e.target.value }); }}>
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {data.items.length === 0 ? <p className="admin-empty">{loading ? "Loading…" : "No applications match."}</p> : (
        <table className="admin-table">
          <thead><tr><th>Reference</th><th>Applicant</th><th>Position</th><th>Status</th><th>Received</th></tr></thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.id} className={row.id === openId ? "is-selected" : ""} onClick={() => setOpenId(row.id)}>
                <td><button type="button" className="admin-link-button" onClick={() => setOpenId(row.id)}>{row.referenceNumber}</button></td>
                <td>{row.fullName}<small>{row.email}</small></td>
                <td>{row.vacancyTitle}<small>{row.company?.name ?? "Group"}</small></td>
                <td><span className={`admin-badge admin-badge-${row.status.toLowerCase()}`}>{label(row.status)}</span></td>
                <td>{formatDate(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Pager page={page} pageSize={25} total={data.total} onPage={setPage} />
      {openId && <ApplicationDrawer id={openId} me={me} onClose={() => setOpenId(null)} onChanged={load} />}
    </>
  );
}

function ApplicationDrawer({ id, me, onClose, onChanged }: { id: string; me: Me; onClose: () => void; onChanged: () => void }) {
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [note, setNote] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [error, setError] = useState("");
  const canUpdate = hasPermission(me, "application.update");

  const load = useCallback(async () => {
    try {
      setApp((await api<{ application: ApplicationDetail }>(`/api/admin/job-applications/${id}`)).application);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function act(fn: () => Promise<unknown>) {
    setError("");
    try { await fn(); await load(); onChanged(); } catch (e) { setError((e as Error).message); }
  }

  return (
    <aside className="admin-drawer" aria-label="Application details">
      <div className="admin-drawer-head">
        <h3>{app ? app.fullName : "Loading…"}</h3>
        <button className="admin-close-button" type="button" onClick={onClose} aria-label="Close">×</button>
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {app && (
        <>
          <dl className="admin-facts">
            <dt>Reference</dt><dd>{app.referenceNumber}</dd>
            <dt>Position</dt><dd>{app.vacancyTitle}, {app.company?.name ?? "Group"}</dd>
            <dt>Status</dt><dd>{label(app.status)}</dd>
            <dt>Email</dt><dd><a href={`mailto:${app.email}`}>{app.email}</a></dd>
            <dt>Phone</dt><dd><a href={`tel:${app.phone}`}>{app.phone}</a></dd>
            <dt>Age / gender</dt><dd>{app.age}{app.gender ? `, ${app.gender}` : ""}</dd>
            <dt>Address</dt><dd>{app.address}</dd>
            <dt>Education</dt><dd>{app.education}</dd>
            <dt>Experience</dt><dd>{Number(app.experienceYears)} years{app.currentEmployer ? `, now at ${app.currentEmployer}` : ""}</dd>
            <dt>Expected salary</dt><dd>{app.expectedSalary ?? "—"}</dd>
            <dt>Received</dt><dd>{formatDate(app.createdAt)}</dd>
          </dl>
          {app.coverLetter && <><h4>Cover letter</h4><p className="admin-cover-letter">{app.coverLetter}</p></>}
          <h4>Documents</h4>
          <ul className="admin-plain-list">
            {app.documents.map((d) => <li key={d.id}><a href={`/api/admin/job-applications/${app.id}/documents/${d.id}`}>{d.originalName}</a> ({Math.ceil(d.bytes / 1024)} KB)</li>)}
          </ul>
          {canUpdate && allowedNextStatuses(app.status).length > 0 && (
            <>
              <h4>Change status</h4>
              <input aria-label="Note for this status change (optional)" placeholder="Note (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
              <div className="admin-button-row">
                {allowedNextStatuses(app.status).map((s) => (
                  <button key={s} type="button" className="admin-secondary-button" onClick={() => act(async () => { await api(`/api/admin/job-applications/${app.id}/status`, { body: { status: s, note: statusNote || undefined } }); setStatusNote(""); })}>
                    {label(s)}
                  </button>
                ))}
              </div>
            </>
          )}
          <h4>History</h4>
          <ul className="admin-plain-list">
            {app.statusHistory.map((h) => <li key={h.id}><strong>{h.fromStatus ? `${label(h.fromStatus)} to ${label(h.toStatus).toLowerCase()}` : label(h.toStatus)}</strong><small>{formatDate(h.createdAt)}{h.changedBy ? `, by ${h.changedBy.name}` : ""}</small>{h.note && <small>“{h.note}”</small>}</li>)}
          </ul>
          <h4>Internal notes</h4>
          <ul className="admin-plain-list">
            {app.notes.map((n) => <li key={n.id}><strong>{n.author?.name ?? "Former user"}</strong><small>{formatDate(n.createdAt)}</small>{n.body}</li>)}
          </ul>
          {canUpdate && (
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); void act(async () => { await api(`/api/admin/job-applications/${app.id}/notes`, { body: { body: note } }); setNote(""); }); }}>
              <textarea aria-label="Add an internal note" placeholder="Add a note for the hiring team" value={note} onChange={(e) => setNote(e.target.value)} required maxLength={5000} />
              <button className="admin-primary-button" type="submit">Add note</button>
            </form>
          )}
          {hasPermission(me, "application.delete") && (
            <button type="button" className="admin-danger-button" onClick={() => { if (window.confirm("Permanently delete this application and its CV? This cannot be undone.")) void act(async () => { await api(`/api/admin/job-applications/${app.id}`, { method: "DELETE" }); onClose(); }); }}>
              Delete application
            </button>
          )}
        </>
      )}
    </aside>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="admin-pager">
      <button type="button" className="admin-secondary-button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span>Page {page} of {pages}</span>
      <button type="button" className="admin-secondary-button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}

// ------------------------------------------------------------------ vacancies

type Company = { id: string; name: string; locations: { id: string; name: string }[] };
type VacancyRow = {
  id: string; title: string; referenceCode: string; status: string; slug: string; companyId: string; careerAreaId: string | null; skills: string[]; locationText: string; summary: string;
  requiredEducation: string; requiredExperience: string; responsibilities: string[]; qualifications: string[]; minAge: number | null; maxAge: number | null;
  salaryMin: string | null; salaryMax: string | null; salaryDisclosed: boolean; deadline: string | null; openings: number; employmentType: string; updatedAt: string;
  company: { name: string }; _count: { applications: number };
};

const EMPTY_VACANCY = { companyId: "", careerAreaId: "", skills: "", title: "", locationText: "", summary: "", requiredEducation: "", requiredExperience: "", responsibilities: "", qualifications: "", minAge: "", maxAge: "", salaryMin: "", salaryMax: "", salaryDisclosed: false, deadline: "", openings: "1", employmentType: "FULL_TIME" };
type VacancyForm = typeof EMPTY_VACANCY;

const toDay = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date(iso)) : "");
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

export function VacanciesPanel({ me }: { me: Me }) {
  const [rows, setRows] = useState<VacancyRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [areas, setAreas] = useState<{ id: string; title: string }[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; updatedAt?: string; form: VacancyForm } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await api<{ vacancies: VacancyRow[]; careerAreas: { id: string; title: string }[] }>("/api/admin/vacancies");
      setRows(result.vacancies);
      setAreas(result.careerAreas);
      if (hasPermission(me, "company.read")) setCompanies((await api<{ companies: Company[] }>("/api/admin/companies")).companies);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [me]);
  useEffect(() => { void load(); }, [load]);

  const [savedId, setSavedId] = useState<string | null>(null);

  async function act(fn: () => Promise<unknown>, message: string) {
    setError(""); setNotice(""); setSavedId(null);
    try { await fn(); setNotice(message); await load(); } catch (e) { setError((e as Error).message); }
  }

  const publishable = (v: VacancyRow) => v.status === "DRAFT" || v.status === "CLOSED";
  const deletable = (v: VacancyRow) => v.status !== "PUBLISHED" && v._count.applications === 0;
  const setStatus = (v: VacancyRow, action: string, message: string) => act(() => api(`/api/admin/vacancies/${v.id}/status`, { body: { action } }), message);
  const remove = (v: VacancyRow) => {
    if (window.confirm(`Delete "${v.title}" permanently? This cannot be undone.`)) void act(() => api(`/api/admin/vacancies/${v.id}`, { method: "DELETE" }), "Vacancy deleted.");
  };

  function edit(row: VacancyRow) {
    setEditing({
      id: row.id, updatedAt: row.updatedAt,
      form: {
        companyId: row.companyId, careerAreaId: row.careerAreaId ?? "", skills: row.skills.join("\n"), title: row.title, locationText: row.locationText, summary: row.summary, requiredEducation: row.requiredEducation, requiredExperience: row.requiredExperience,
        responsibilities: row.responsibilities.join("\n"), qualifications: row.qualifications.join("\n"), minAge: row.minAge?.toString() ?? "", maxAge: row.maxAge?.toString() ?? "",
        salaryMin: row.salaryMin ? String(Number(row.salaryMin)) : "", salaryMax: row.salaryMax ? String(Number(row.salaryMax)) : "", salaryDisclosed: row.salaryDisclosed,
        deadline: toDay(row.deadline), openings: String(row.openings), employmentType: row.employmentType,
      },
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const f = editing.form;
    const body = {
      companyId: f.companyId, careerAreaId: f.careerAreaId || null, skills: lines(f.skills), title: f.title, locationText: f.locationText, summary: f.summary, requiredEducation: f.requiredEducation, requiredExperience: f.requiredExperience,
      responsibilities: lines(f.responsibilities), qualifications: lines(f.qualifications), minAge: numOrNull(f.minAge), maxAge: numOrNull(f.maxAge),
      salaryMin: numOrNull(f.salaryMin), salaryMax: numOrNull(f.salaryMax), salaryDisclosed: f.salaryDisclosed, deadline: f.deadline || null,
      openings: Number(f.openings) || 1, employmentType: f.employmentType,
    };
    await act(async () => {
      const result = editing.id
        ? await api<{ vacancy: { id: string } }>(`/api/admin/vacancies/${editing.id}`, { method: "PATCH", body: { ...body, expectedUpdatedAt: editing.updatedAt } })
        : await api<{ vacancy: { id: string } }>("/api/admin/vacancies", { body });
      setEditing(null);
      setSavedId(result.vacancy.id);
    }, editing.id ? "Vacancy saved." : "Draft vacancy created. Publish it when it is ready.");
  }

  const set = (key: keyof VacancyForm) => (e: { target: { value: string; checked?: boolean; type?: string } }) =>
    setEditing((cur) => (cur ? { ...cur, form: { ...cur.form, [key]: e.target.type === "checkbox" ? Boolean(e.target.checked) : e.target.value } } : cur));

  return (
    <>
      <div className="admin-list-heading">
        <div><h2>Vacancies</h2><p>{loading ? "Loading…" : `${rows.length} vacancies`}</p></div>
        {hasPermission(me, "vacancy.update") && <button className="admin-primary-button" type="button" onClick={() => setEditing({ id: null, form: { ...EMPTY_VACANCY, companyId: companies[0]?.id ?? "", careerAreaId: areas[0]?.id ?? "" } })}>New vacancy <span aria-hidden="true">＋</span></button>}
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}
      {(() => {
        const v = savedId ? rows.find((r) => r.id === savedId) : undefined;
        if (!v || editing) return null;
        return (
          <div className="adm-next-step">
            <span>Next for <strong>{v.title}</strong>:</span>
            <div className="admin-button-row">
              {hasPermission(me, "vacancy.publish") && publishable(v) && <button type="button" className="admin-primary-button" onClick={() => setStatus(v, "publish", "Vacancy published. It is on the careers page now.")}>Publish now</button>}
              <button type="button" className="admin-secondary-button" onClick={() => edit(v)}>Edit again</button>
              {hasPermission(me, "vacancy.publish") && v.status !== "ARCHIVED" && <button type="button" className="admin-secondary-button" onClick={() => setStatus(v, "archive", "Vacancy archived.")}>Archive</button>}
              {hasPermission(me, "vacancy.publish") && deletable(v) && <button type="button" className="admin-secondary-button" onClick={() => remove(v)}>Delete</button>}
            </div>
          </div>
        );
      })()}
      {editing && (
        <form className="admin-business-form" onSubmit={save}>
          <div className="admin-form-heading"><h3>{editing.id ? "Edit vacancy" : "New vacancy"}</h3><button className="admin-close-button" type="button" onClick={() => setEditing(null)} aria-label="Close">×</button></div>
          <div className="admin-form-grid">
            <label>Company<select value={editing.form.companyId} onChange={set("companyId")} required>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>Career area (where it appears on /careers)<select value={editing.form.careerAreaId} onChange={set("careerAreaId")} required><option value="">Choose…</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
            <label>Position title<input value={editing.form.title} onChange={set("title")} required maxLength={160} /></label>
            <label>Location shown<input value={editing.form.locationText} onChange={set("locationText")} required maxLength={160} placeholder="Pokhara, Nepal" /></label>
            <label>Deadline (Nepal date)<input type="date" value={editing.form.deadline} onChange={set("deadline")} /></label>
            <label>Employment type<select value={editing.form.employmentType} onChange={set("employmentType")}>{["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY", "VOLUNTEER"].map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></label>
            <label>Openings<input type="number" min={1} value={editing.form.openings} onChange={set("openings")} /></label>
            <label>Minimum age<input type="number" min={16} max={80} value={editing.form.minAge} onChange={set("minAge")} /></label>
            <label>Maximum age<input type="number" min={16} max={80} value={editing.form.maxAge} onChange={set("maxAge")} /></label>
            <label>Salary from (NPR / month)<input type="number" min={0} value={editing.form.salaryMin} onChange={set("salaryMin")} /></label>
            <label>Salary to (NPR / month)<input type="number" min={0} value={editing.form.salaryMax} onChange={set("salaryMax")} /></label>
            <label className="admin-publish-field"><input type="checkbox" checked={editing.form.salaryDisclosed} onChange={set("salaryDisclosed")} /> Show salary on the website</label>
            <label>Required education<input value={editing.form.requiredEducation} onChange={set("requiredEducation")} maxLength={200} /></label>
            <label>Required experience<input value={editing.form.requiredExperience} onChange={set("requiredExperience")} maxLength={200} /></label>
          </div>
          <label className="admin-description-field">Summary<textarea value={editing.form.summary} onChange={set("summary")} maxLength={600} /></label>
          <label className="admin-description-field">Responsibilities (one per line)<textarea value={editing.form.responsibilities} onChange={set("responsibilities")} /></label>
          <label className="admin-description-field">Skills (one per line)<textarea value={editing.form.skills} onChange={set("skills")} /></label>
          <label className="admin-description-field">Qualifications (one per line)<textarea value={editing.form.qualifications} onChange={set("qualifications")} /></label>
          <div className="admin-form-actions"><button className="admin-primary-button" type="submit">Save</button><button className="admin-secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button></div>
        </form>
      )}
      {rows.length === 0 ? <p className="admin-empty">{loading ? "Loading…" : "No vacancies yet."}</p> : (
        <table className="admin-table">
          <thead><tr><th>Position</th><th>Status</th><th>Deadline</th><th>Applications</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td>{v.title}<small>{v.company.name}</small><small>{v.referenceCode}</small></td>
                <td><span className={`admin-badge admin-badge-${v.status.toLowerCase()}`}>{label(v.status)}</span></td>
                <td>{v.deadline ? formatDate(v.deadline, false) : "—"}</td>
                <td>{v._count.applications}</td>
                <td className="admin-button-row">
                  {hasPermission(me, "vacancy.update") && v.status !== "ARCHIVED" && <button type="button" className="admin-secondary-button" onClick={() => edit(v)}>Edit</button>}
                  {hasPermission(me, "vacancy.publish") && (["DRAFT", "CLOSED"].includes(v.status) ? (
                    <button type="button" className="admin-secondary-button" onClick={() => act(() => api(`/api/admin/vacancies/${v.id}/status`, { body: { action: "publish" } }), "Vacancy published.")}>Publish</button>
                  ) : v.status === "PUBLISHED" ? (
                    <button type="button" className="admin-secondary-button" onClick={() => act(() => api(`/api/admin/vacancies/${v.id}/status`, { body: { action: "close" } }), "Vacancy closed.")}>Close</button>
                  ) : (
                    <button type="button" className="admin-secondary-button" onClick={() => act(() => api(`/api/admin/vacancies/${v.id}/status`, { body: { action: "restore" } }), "Vacancy restored as a draft.")}>Restore</button>
                  ))}
                  {hasPermission(me, "vacancy.publish") && v.status !== "ARCHIVED" && <button type="button" className="admin-secondary-button" onClick={() => setStatus(v, "archive", "Vacancy archived.")}>Archive</button>}
                  {hasPermission(me, "vacancy.publish") && deletable(v) && <button type="button" className="admin-secondary-button" onClick={() => remove(v)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
