"use client";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { api, formatDate, hasPermission, label, type Me } from "@/components/admin/api";
import ContentManager, { type ContentConfig } from "@/components/admin/ContentManager";
import { type Field, FieldInputs, fromItem, type Lookups, toInput } from "@/components/admin/FieldForm";

type Company = Record<string, unknown> & {
  id: string; name: string; slug: string; status: string; updatedAt: string; sectorId: string | null; website: string | null;
  sector: { name: string } | null; locations: Record<string, unknown>[];
};
type Sector = { id: string; slug: string; name: string; detail: string | null; sortOrder: number; _count: { companies: number } };

function useLookups(me: Me) {
  const [lookups, setLookups] = useState<Lookups>({ companies: [], sectors: [] });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const reload = useCallback(async () => {
    if (!hasPermission(me, "company.read")) { setLoading(false); return; }
    try {
      const [c, s] = await Promise.all([
        api<{ companies: Company[] }>("/api/admin/companies"),
        api<{ sectors: Sector[] }>("/api/admin/sectors"),
      ]);
      setCompanies(c.companies);
      setSectors(s.sectors);
      setLookups({ companies: c.companies.map((x) => [x.id, x.name]), sectors: s.sectors.map((x) => [x.id, x.name]) });
      setLoadError("");
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [me]);
  useEffect(() => { void reload(); }, [reload]);
  return { lookups, companies, sectors, reload, loading, loadError };
}

function SubTabs({ tabs, current, onChange }: { tabs: [string, string][]; current: string; onChange: (k: string) => void }) {
  return (
    <div className="adm-subtabs" role="tablist">
      {tabs.map(([k, l]) => (
        <button key={k} type="button" role="tab" aria-selected={current === k} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- leadership

const LEADER: ContentConfig = {
  type: "leaders",
  noun: "leader",
  update: "leader.update",
  publish: "leader.publish",
  altFrom: "name",
  title: (i) => String(i.name),
  meta: (i) => ((i.assignments as { title: string; company: { name: string } | null }[]) ?? []).map((a) => `${a.title}, ${a.company?.name ?? "Sanjeevani Group"}`).join("; "),
  defaults: { assignments: [{ companyId: null, title: "", tier: "TEAM", isManagingDirector: false }] },
  // A new leader starts with the Chairman's portrait as a stand-in; replace it when the real photo is ready.
  newDefaults: (items) => {
    const chairman = items.find((i) => i.isChairman === true && i.photoId);
    return chairman ? { photoId: chairman.photoId, photo: chairman.photo } : {};
  },
  fields: [
    { k: "name", label: "Full name", type: "text", required: true },
    { k: "photoId", label: "Photo", type: "image", rel: "photo", folder: "leaders", help: "A clear portrait, ideally square." },
    { k: "summary", label: "Short introduction", type: "textarea", help: "One or two sentences shown on cards." },
    { k: "biography", label: "Profile", type: "textarea" },
    { k: "message", label: "Message", type: "paragraphs", help: "The leader's message. Leave a blank line between paragraphs." },
    { k: "responsibilities", label: "Responsibilities", type: "lines", help: "One per line." },
    {
      k: "assignments", label: "Roles", type: "rows", add: "Add a role", help: "A role for the whole group or for one company. Tick Managing Director to show this person's message on that company's page.",
      blank: { companyId: null, title: "", tier: "TEAM", isManagingDirector: false },
      fields: [
        { k: "title", label: "Title", type: "text", required: true },
        { k: "companyId", label: "Company", type: "select", options: "companies", empty: "Whole group" },
        { k: "tier", label: "Shown under", type: "select", options: [["BOARD", "Board of directors"], ["TEAM", "Leadership team"]], required: true },
        { k: "isManagingDirector", label: "Managing Director of this company", type: "checkbox" },
      ],
    },
    {
      k: "education", label: "Education", type: "rows", add: "Add a qualification", blank: { qualification: "", institution: "" },
      fields: [
        { k: "qualification", label: "Qualification", type: "text", required: true },
        { k: "institution", label: "Institution", type: "text", required: true },
      ],
    },
    {
      k: "career", label: "Career", type: "rows", add: "Add a position", blank: { period: "", position: "", organisation: "" },
      fields: [
        { k: "period", label: "Period", type: "text", required: true, help: "e.g. 2015 to 2020" },
        { k: "position", label: "Position", type: "text", required: true },
        { k: "organisation", label: "Organisation", type: "text", required: true },
      ],
    },
    { k: "linkedinUrl", label: "LinkedIn", type: "url" },
    { k: "facebookUrl", label: "Facebook", type: "url" },
    { k: "instagramUrl", label: "Instagram", type: "url" },
    { k: "xUrl", label: "X (Twitter)", type: "url" },
  ],
};

export function LeadershipPanel({ me }: { me: Me }) {
  const { lookups } = useLookups(me);
  return <ContentManager me={me} config={LEADER} lookups={lookups} />;
}

// ------------------------------------------------------------------ newsroom

const companyField: Field = { k: "companyId", label: "Company", type: "select", options: "companies", empty: "Sanjeevani Group (all)" };

const NEWSROOM: Record<string, ContentConfig> = {
  news: {
    type: "news", noun: "press release or news", update: "content.update", publish: "content.publish",
    title: (i) => String(i.title),
    meta: (i) => `${label(String(i.type))}${i.publishedAt ? `, published ${formatDate(String(i.publishedAt), false)}` : ""}`,
    defaults: { type: "PRESS_RELEASE" },
    fields: [
      { k: "title", label: "Headline", type: "text", required: true, wide: true },
      { k: "type", label: "Kind", type: "select", options: [["PRESS_RELEASE", "Press release"], ["NEWS", "News"], ["ANNOUNCEMENT", "Announcement"]], required: true },
      companyField,
      { k: "coverImageId", label: "Cover photo", type: "image", rel: "coverImage", folder: "news" },
      { k: "excerpt", label: "Summary", type: "textarea", help: "Shown in the newsroom list." },
      { k: "body", label: "Full text", type: "blocks", help: "Leave a blank line between paragraphs." },
      { k: "tags", label: "Tags", type: "lines", help: "One per line." },
      { k: "publishAt", label: "Publish on (optional)", type: "datetime", help: "Leave empty to publish as soon as you press Publish." },
    ],
  },
  events: {
    type: "events", noun: "event", update: "content.update", publish: "content.publish",
    title: (i) => String(i.title),
    meta: (i) => `${formatDate(String(i.startsAt))}${i.venue ? `, ${i.venue}` : ""}`,
    fields: [
      { k: "title", label: "Event name", type: "text", required: true, wide: true },
      { k: "startsAt", label: "Starts", type: "datetime", required: true },
      { k: "endsAt", label: "Ends", type: "datetime" },
      { k: "venue", label: "Venue", type: "text" },
      companyField,
      { k: "coverImageId", label: "Photo", type: "image", rel: "coverImage", folder: "news" },
      { k: "summary", label: "Summary", type: "textarea" },
      { k: "body", label: "Details", type: "blocks", help: "Leave a blank line between paragraphs." },
    ],
  },
  notices: {
    type: "notices", noun: "notice", update: "content.update", publish: "content.publish",
    title: (i) => String(i.title),
    meta: (i) => formatDate(String(i.noticeDate), false),
    fields: [
      { k: "title", label: "Title", type: "text", required: true, wide: true },
      { k: "noticeDate", label: "Notice date", type: "datetime", required: true },
      companyField,
      { k: "body", label: "Notice text", type: "textarea" },
      { k: "attachmentId", label: "Notice image (optional)", type: "image", rel: "attachment", folder: "news" },
    ],
  },
  videos: {
    type: "videos", noun: "YouTube video", update: "content.update", publish: "content.publish",
    title: (i) => String(i.title),
    meta: (i) => String(i.url ?? ""),
    filter: (i) => i.placement === "NEWSROOM_YOUTUBE",
    defaults: { placement: "NEWSROOM_YOUTUBE" },
    fields: [
      { k: "title", label: "Title", type: "text", required: true, wide: true },
      { k: "url", label: "YouTube link", type: "url", required: true, help: "Paste the video's address from YouTube." },
      { k: "placement", label: "Show in", type: "select", options: [["NEWSROOM_YOUTUBE", "Newsroom videos"], ["GALLERY", "Gallery (moves it to the Gallery tab)"]], required: true },
      { k: "thumbnailId", label: "Thumbnail (optional)", type: "image", rel: "thumbnail", folder: "news", help: "YouTube's own thumbnail is used when empty." },
      { k: "sortOrder", label: "Order", type: "number" },
    ],
  },
  galleries: {
    type: "galleries", noun: "photo album", heading: "Photo albums", update: "content.update", publish: "content.publish",
    title: (i) => String(i.title),
    meta: (i) => `${((i.items as unknown[]) ?? []).length} photos`,
    fields: [
      { k: "title", label: "Album name", type: "text", required: true, wide: true },
      companyField,
      {
        k: "items", label: "Photos", type: "rows", add: "Add a photo", blank: { mediaId: null, caption: "", altText: "" },
        fields: [
          { k: "mediaId", label: "Photo", type: "image", rel: "media", folder: "gallery" },
          { k: "caption", label: "Caption", type: "text", required: true },
          { k: "altText", label: "Description for screen readers", type: "text", required: true },
        ],
      },
    ],
  },
};

const GALLERY_VIDEOS: ContentConfig = {
  type: "videos", noun: "video", heading: "Videos", update: "content.update", publish: "content.publish",
  title: (i) => String(i.title),
  meta: (i) => String(i.url ?? ""),
  filter: (i) => i.placement === "GALLERY",
  defaults: { placement: "GALLERY" },
  fields: [
    { k: "title", label: "Title", type: "text", required: true, wide: true },
    { k: "url", label: "YouTube link", type: "url", required: true, help: "Upload the video to YouTube, then paste its address here." },
    { k: "placement", label: "Show in", type: "select", options: [["GALLERY", "Gallery"], ["NEWSROOM_YOUTUBE", "Newsroom videos (moves it to the YouTube tab)"]], required: true },
    { k: "thumbnailId", label: "Cover image (optional)", type: "image", rel: "thumbnail", folder: "gallery", help: "YouTube's own thumbnail is used when empty." },
    { k: "sortOrder", label: "Order", type: "number" },
  ],
};

export function NewsroomPanel({ me }: { me: Me }) {
  const { lookups } = useLookups(me);
  const [tab, setTab] = useState("news");
  return (
    <>
      <SubTabs tabs={[["news", "Press releases & news"], ["events", "Events"], ["notices", "Notices"], ["videos", "YouTube videos"], ["galleries", "Gallery"]]} current={tab} onChange={setTab} />
      {tab === "galleries" ? (
        <div className="adm-gallery-managers">
          <section className="adm-card"><ContentManager key="gallery-photos" me={me} config={NEWSROOM.galleries} lookups={lookups} /></section>
          <section className="adm-card"><ContentManager key="gallery-videos" me={me} config={GALLERY_VIDEOS} lookups={lookups} /></section>
        </div>
      ) : (
        <ContentManager key={tab} me={me} config={NEWSROOM[tab]} lookups={lookups} />
      )}
    </>
  );
}

// ---------------------------------------------------------------- businesses

const COMPANY_HEAD: Field[] = [
  { k: "s-basics", label: "Basic details", type: "section" },
  { k: "name", label: "Company name", type: "text", required: true },
  { k: "sectorId", label: "Category", type: "select", options: "sectors", empty: "No category" },
  { k: "sectorLabel", label: "Sector shown on the page", type: "text", required: true, help: "e.g. Healthcare, Education or Agriculture" },
  { k: "category", label: "Kind", type: "select", options: [["HEALTHCARE", "Healthcare"], ["EDUCATION", "Education"], ["AGRICULTURE", "Agriculture"], ["OTHER", "Other"]], required: true },
  { k: "establishedYear", label: "Established (year)", type: "number" },
  { k: "s-images", label: "Logo and photo", type: "section", help: "The page photo is the large picture at the top of the company page." },
  { k: "logoId", label: "Logo", type: "image", rel: "logo", folder: "companies" },
  { k: "bannerId", label: "Page photo", type: "image", rel: "banner", folder: "companies" },
  { k: "s-about", label: "About the company", type: "section", help: "Shown in the page introduction and the Overview section." },
  { k: "description", label: "Overview", type: "textarea", required: true },
  { k: "mission", label: "Mission", type: "textarea" },
  { k: "vision", label: "Vision", type: "textarea" },
  { k: "services", label: "Services or departments", type: "lines", help: "One per line." },
  { k: "s-contact", label: "Get in touch", type: "section", help: "Contact details shown at the bottom of the company page." },
  { k: "email", label: "Email", type: "email" },
  { k: "phone", label: "Phone", type: "text" },
  { k: "website", label: "Website", type: "text", help: "e.g. www.example.com" },
];
const COMPANY_TAIL: Field[] = [
  { k: "s-social", label: "Social media", type: "section" },
  { k: "facebookUrl", label: "Facebook", type: "url" },
  { k: "linkedinUrl", label: "LinkedIn", type: "url" },
  { k: "instagramUrl", label: "Instagram", type: "url" },
  { k: "youtubeUrl", label: "YouTube", type: "url" },
  { k: "s-seo", label: "Search engines", type: "section", help: "Optional. The company name and overview are used when these are empty." },
  { k: "seoTitle", label: "Search title", type: "text", help: "Up to 70 characters." },
  { k: "seoDescription", label: "Search description", type: "textarea", help: "Up to 160 characters." },
  { k: "s-display", label: "Display", type: "section" },
  { k: "featured", label: "Feature this company", type: "checkbox" },
  { k: "sortOrder", label: "Order in lists", type: "number" },
];
// All company fields, for converting to and from the API in one go.
const COMPANY_FIELDS: Field[] = [...COMPANY_HEAD, ...COMPANY_TAIL];
const LOCATION_FIELDS: Field[] = [
  {
    k: "locations", label: "Offices and addresses", type: "rows", add: "Add a location",
    blank: { name: "Head office", addressLine: "", municipality: "", district: "", province: "", phone: "", email: "", isPrimary: false },
    fields: [
      { k: "name", label: "Name", type: "text", required: true },
      { k: "addressLine", label: "Address", type: "text" },
      { k: "municipality", label: "Municipality", type: "text" },
      { k: "district", label: "District", type: "text" },
      { k: "province", label: "Province", type: "text" },
      { k: "phone", label: "Phone", type: "text" },
      { k: "email", label: "Email", type: "email" },
      { k: "isPrimary", label: "Main office", type: "checkbox" },
    ],
  },
];

// The people shown in the Leadership section of this company's page. They are
// managed under Leadership, where one person can hold roles in several companies.
function CompanyLeaders({ me, companyId }: { me: Me; companyId: string }) {
  const [rows, setRows] = useState<{ id: string; name: string; status: string; title: string; md: boolean }[] | null>(null);
  useEffect(() => {
    if (!hasPermission(me, "leader.update")) { setRows([]); return; }
    api<{ items: { id: string; name: string; status: string; assignments: { companyId: string | null; title: string; isManagingDirector: boolean }[] }[] }>("/api/admin/content/leaders")
      .then((r) => setRows(r.items.flatMap((l) => l.assignments.filter((a) => a.companyId === companyId).map((a) => ({ id: l.id, name: l.name, status: l.status, title: a.title, md: a.isManagingDirector })))))
      .catch(() => setRows([]));
  }, [me, companyId]);
  const hasMd = rows?.some((r) => r.md);
  return (
    <div className="adm-company-leaders adm-field-wide">
      <div className="adm-form-section"><h4>Leadership on this page</h4><p className="adm-muted">The Chairman is shown on every company page. Add the Managing Director and other leaders under Leadership, choosing this company in their role.</p></div>
      {rows === null ? <p className="adm-muted">Loading…</p> : rows.length === 0 ? (
        <p className="admin-message admin-error">No Managing Director yet. Until one is added, the page shows &ldquo;To be announced&rdquo;.</p>
      ) : (
        <ul className="adm-plain-cards">
          {rows.map((r) => (
            <li key={r.id + r.title}><strong>{r.name}</strong><span>{r.title}{r.md ? ", Managing Director" : ""}</span><span className={`admin-badge admin-badge-${r.status.toLowerCase()}`}>{label(r.status)}</span></li>
          ))}
        </ul>
      )}
      {rows && rows.length > 0 && !hasMd && <p className="adm-muted">None of these is ticked as Managing Director, so the page still shows &ldquo;To be announced&rdquo;.</p>}
    </div>
  );
}

export function BusinessesPanel({ me }: { me: Me }) {
  const { lookups, companies, sectors, reload, loading, loadError } = useLookups(me);
  const [editing, setEditing] = useState<{ id: string | null; updatedAt?: string; values: Record<string, unknown>; locations: Record<string, unknown> } | null>(null);
  const [sectorForm, setSectorForm] = useState<{ id: string | null; name: string; detail: string } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canCreate = hasPermission(me, "company.create");
  const canUpdate = hasPermission(me, "company.update");
  const canPublish = hasPermission(me, "company.publish");

  const [savedId, setSavedId] = useState<string | null>(null);

  async function act(fn: () => Promise<unknown>, message: string) {
    setError(""); setNotice(""); setSavedId(null);
    try { await fn(); setNotice(message); await reload(); } catch (e) { setError((e as Error).message); }
  }

  const removeCompany = (c: Company) => {
    if (window.confirm(`Delete ${c.name} permanently? Its page, offices, vacancies and leadership roles are removed from the website at once. This cannot be undone.`)) {
      void act(() => api(`/api/admin/companies/${c.id}`, { method: "DELETE" }), `${c.name} deleted.`);
    }
  };

  async function saveCompany(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const body = toInput(COMPANY_FIELDS, editing.values);
    const { locations } = toInput(LOCATION_FIELDS, editing.locations) as { locations: unknown[] };
    await act(async () => {
      const id = editing.id
        ? (await api<{ company: Company }>(`/api/admin/companies/${editing.id}`, { method: "PATCH", body: { ...body, expectedUpdatedAt: editing.updatedAt } })).company.id
        : (await api<{ company: Company }>("/api/admin/companies", { body })).company.id;
      await api(`/api/admin/companies/${id}/locations`, { method: "PUT", body: { locations } });
      setEditing(null);
      setSavedId(id);
    }, editing.id ? "Company saved." : "Company created as a draft. Publish it when its page is ready.");
  }

  async function saveSector(event: FormEvent) {
    event.preventDefault();
    if (!sectorForm) return;
    const body = { name: sectorForm.name, detail: sectorForm.detail.trim() || null };
    await act(async () => {
      if (sectorForm.id) await api(`/api/admin/sectors/${sectorForm.id}`, { method: "PATCH", body });
      else await api("/api/admin/sectors", { body });
      setSectorForm(null);
    }, sectorForm.id ? "Category saved." : "Category added.");
  }

  const status = (c: Company, action: string, message: string) => act(() => api(`/api/admin/companies/${c.id}/status`, { body: { action } }), message);

  function newCompany(sectorId: string | null) {
    const sector = sectors.find((s) => s.id === sectorId);
    setSectorForm(null);
    setEditing({
      id: null,
      values: fromItem(COMPANY_FIELDS, { category: "OTHER", sectorId, sectorLabel: sector?.name ?? "" }),
      locations: fromItem(LOCATION_FIELDS, { locations: [{ name: "Head office", isPrimary: true }] }),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function editCompany(c: Company) {
    setSectorForm(null);
    setEditing({ id: c.id, updatedAt: c.updatedAt, values: fromItem(COMPANY_FIELDS, c), locations: fromItem(LOCATION_FIELDS, c) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Categories in their order, each with its companies; companies without one last.
  const groups: { sector: Sector | null; companies: Company[] }[] = [
    ...sectors.map((s) => ({ sector: s, companies: companies.filter((c) => c.sectorId === s.id) })),
    { sector: null, companies: companies.filter((c) => !c.sectorId || !sectors.some((s) => s.id === c.sectorId)) },
  ].filter((g) => g.sector || g.companies.length > 0);

  return (
    <>
      <div className="admin-list-heading">
        <div><h2>Businesses</h2><p aria-busy={loading}>{loading ? "Loading…" : `${sectors.length} categories, ${companies.length} companies`}</p></div>
        {canCreate && !sectorForm && !editing && <button type="button" className="admin-primary-button" onClick={() => setSectorForm({ id: null, name: "", detail: "" })}>Add category <span aria-hidden="true">＋</span></button>}
      </div>
      {loadError && <p className="admin-message admin-error" role="alert">{loadError} <button type="button" className="admin-link-button" onClick={() => void reload()}>Try again</button></p>}
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}
      {(() => {
        const c = savedId ? companies.find((x) => x.id === savedId) : undefined;
        if (!c || editing) return null;
        return (
          <div className="adm-next-step">
            <span>Next for <strong>{c.name}</strong>:</span>
            <div className="admin-button-row">
              {canPublish && c.status !== "PUBLISHED" && c.status !== "ARCHIVED" && <button type="button" className="admin-primary-button" onClick={() => status(c, "publish", `${c.name} is live.`)}>Publish now</button>}
              <button type="button" className="admin-secondary-button" onClick={() => editCompany(c)}>Edit again</button>
              {canPublish && c.status !== "ARCHIVED" && <button type="button" className="admin-secondary-button" onClick={() => status(c, "archive", `${c.name} archived.`)}>Archive</button>}
              {canCreate && <button type="button" className="admin-secondary-button" onClick={() => removeCompany(c)}>Delete</button>}
            </div>
          </div>
        );
      })()}

      {sectorForm && (
        <form className="admin-business-form" onSubmit={saveSector}>
          <div className="admin-form-heading"><h3>{sectorForm.id ? "Edit category" : "New category"}</h3><button type="button" className="admin-close-button" aria-label="Close" onClick={() => setSectorForm(null)}>×</button></div>
          <div className="admin-form-grid">
            <label className="adm-field"><span className="adm-field-label">Name *</span><input value={sectorForm.name} onChange={(e) => setSectorForm({ ...sectorForm, name: e.target.value })} required maxLength={80} /></label>
            <label className="adm-field adm-field-wide"><span className="adm-field-label">Short description</span><textarea rows={3} value={sectorForm.detail} onChange={(e) => setSectorForm({ ...sectorForm, detail: e.target.value })} maxLength={400} /></label>
          </div>
          <div className="admin-form-actions"><button type="submit" className="admin-primary-button">Save</button><button type="button" className="admin-secondary-button" onClick={() => setSectorForm(null)}>Cancel</button></div>
        </form>
      )}

      {editing && (
        <form className="admin-business-form" onSubmit={saveCompany}>
          <div className="admin-form-heading"><h3>{editing.id ? `Edit ${String(editing.values.name || "company")}` : "New company"}</h3><button type="button" className="admin-close-button" aria-label="Close" onClick={() => setEditing(null)}>×</button></div>
          <div className="admin-form-grid">
            <FieldInputs fields={COMPANY_HEAD} values={editing.values} onChange={(values) => setEditing({ ...editing, values })} lookups={lookups} altFrom={String(editing.values.name ?? "")} idPrefix="co" />
            <FieldInputs fields={LOCATION_FIELDS} values={editing.locations} onChange={(locations) => setEditing({ ...editing, locations })} lookups={lookups} altFrom="" idPrefix="co-loc" />
            <FieldInputs fields={COMPANY_TAIL} values={editing.values} onChange={(values) => setEditing({ ...editing, values })} lookups={lookups} altFrom={String(editing.values.name ?? "")} idPrefix="co-tail" />
          </div>
          {editing.id && <CompanyLeaders me={me} companyId={editing.id} />}
          <div className="admin-form-actions"><button type="submit" className="admin-primary-button">Save</button><button type="button" className="admin-secondary-button" onClick={() => setEditing(null)}>Cancel</button></div>
        </form>
      )}

      <div className="adm-categories">
        {groups.map(({ sector, companies: list }) => (
          <section key={sector?.id ?? "none"} className="adm-category" aria-labelledby={`cat-${sector?.id ?? "none"}`}>
            <header className="adm-category-head">
              <div>
                <h3 id={`cat-${sector?.id ?? "none"}`}>{sector?.name ?? "No category yet"}</h3>
                <p className="adm-muted">{sector?.detail ?? (sector ? "" : "Give these companies a category so they appear in the right group.")}</p>
              </div>
              <div className="admin-button-row">
                <span className="adm-count num">{list.length} {list.length === 1 ? "company" : "companies"}</span>
                {canCreate && <button type="button" className="admin-primary-button" onClick={() => newCompany(sector?.id ?? null)}>Add company</button>}
                {canCreate && sector && <button type="button" className="admin-secondary-button" onClick={() => { setEditing(null); setSectorForm({ id: sector.id, name: sector.name, detail: sector.detail ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit category</button>}
                {canCreate && sector && list.length === 0 && <button type="button" className="admin-secondary-button" onClick={() => { if (window.confirm(`Delete the category "${sector.name}"?`)) void act(() => api(`/api/admin/sectors/${sector.id}`, { method: "DELETE" }), "Category deleted."); }}>Delete</button>}
              </div>
            </header>
            {list.length === 0 ? (
              <p className="admin-empty">No companies in this category yet.</p>
            ) : (
              <table className="admin-table">
                <thead><tr><th>Company</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {list.sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}{c.website && <small>{c.website}</small>}<small>/businesses/{c.slug}</small></td>
                      <td><span className={`admin-badge admin-badge-${c.status.toLowerCase()}`}>{label(c.status)}</span></td>
                      <td className="admin-button-row">
                        {canUpdate && c.status !== "ARCHIVED" && <button type="button" className="admin-secondary-button" onClick={() => editCompany(c)}>Edit</button>}
                        {canPublish && c.status !== "PUBLISHED" && c.status !== "ARCHIVED" && <button type="button" className="admin-secondary-button" onClick={() => status(c, "publish", `${c.name} is live.`)}>Publish</button>}
                        {canPublish && c.status === "PUBLISHED" && <button type="button" className="admin-secondary-button" onClick={() => status(c, "unpublish", `${c.name} is hidden from the website.`)}>Unpublish</button>}
                        {canPublish && c.status !== "ARCHIVED" && <button type="button" className="admin-secondary-button" onClick={() => status(c, "archive", `${c.name} archived.`)}>Archive</button>}
                        {canPublish && c.status === "ARCHIVED" && <button type="button" className="admin-secondary-button" onClick={() => status(c, "restore", `${c.name} restored as a draft.`)}>Restore</button>}
                        {canCreate && <button type="button" className="admin-secondary-button" onClick={() => removeCompany(c)}>Delete</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
