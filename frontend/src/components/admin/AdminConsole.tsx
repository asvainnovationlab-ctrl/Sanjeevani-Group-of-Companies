"use client";
import Link from "next/link";
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import GroupEmblem from "@/components/GroupEmblem";
import { api, ApiError, hasPermission, type Me } from "@/components/admin/api";
import { AccountPanel, AuditPanel, SettingsPanel } from "@/components/admin/SystemPanels";
import { ApplicationsPanel, VacanciesPanel } from "@/components/admin/RecruitmentPanels";
import { ContactPanel, UsersPanel } from "@/components/admin/PeoplePanels";
import TrafficChart from "@/components/admin/TrafficChart";
import { SECTIONS, roleAbilities } from "@/components/admin/sections";
import { SYSTEM_ROLES } from "@/server/auth/permissions";
import { BusinessesPanel, LeadershipPanel, NewsroomPanel } from "@/components/admin/CmsPanels";
import ApprovalsPanel from "@/components/admin/ApprovalsPanel";

type TabKey = "dashboard" | "applications" | "vacancies" | "businesses" | "leadership" | "newsroom" | "approvals" | "contact" | "users" | "audit" | "settings" | "account";
type Group = "Overview" | "Organization" | "Website" | "Recruitment" | "Communications" | "Administration";
type Tab = { key: TabKey; label: string; title: string; context: string; permission?: string; anyOf?: string[]; group: Group; scoped?: boolean; icon: ReactNode };
const GROUPS: Group[] = ["Overview", "Organization", "Website", "Recruitment", "Communications", "Administration"];

// Line icons, drawn on a 24px grid with the current text colour.
const icon = (d: string) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const TABS: Tab[] = [
  { key: "dashboard", label: "Dashboard", title: "Dashboard", context: "Today at a glance", group: "Overview", scoped: true, icon: icon("M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z") },
  { key: "applications", label: "Applications", title: "Applications", context: "Every job application, newest first", permission: "application.read", group: "Recruitment", scoped: true, icon: icon("M8 4h8l2 2v14H6V6zM9 10h6M9 14h6M9 18h3") },
  { key: "vacancies", label: "Vacancies", title: "Vacancies", context: "Drafts stay here until you publish them", permission: "vacancy.read", group: "Recruitment", scoped: true, icon: icon("M4 8h16v11H4zM9 8V5h6v3M4 13h16") },
  { key: "businesses", label: "Companies", title: "Companies", context: "Categories and every company's page", permission: "company.read", group: "Organization", icon: icon("M4 20V8l6-4v16M10 20V10h10v10M4 20h16M13 13h1M17 13h1M13 16h1M17 16h1") },
  { key: "leadership", label: "Leadership", title: "Leadership", context: "Chairman, board, managing directors and team", permission: "leader.update", group: "Organization", icon: icon("M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8 9.5 8z") },
  { key: "newsroom", label: "Newsroom", title: "Newsroom", context: "Press releases, events, notices, videos and gallery", permission: "content.update", group: "Website", icon: icon("M5 5h12v14H6a1 1 0 0 1-1-1zM17 9h2v9a1 1 0 0 1-2 0M8 9h6M8 12h6M8 15h4") },
  { key: "contact", label: "Enquiries", title: "Enquiries", context: "Messages from the contact page", permission: "contact.read", group: "Communications", scoped: true, icon: icon("M4 6h16v12H4zM4 7l8 6 8-6") },
  { key: "approvals", label: "Approvals", title: "Publishing approvals", context: "Content waiting for a publisher", anyOf: ["content.publish", "leader.publish"], group: "Administration", icon: icon("M9 12l2 2 4-4M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z") },
  { key: "users", label: "Users and roles", title: "Users and roles", context: "Each person signs in with their own account", permission: "user.manage", group: "Administration", icon: icon("M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a6 6 0 0 1 3 5.5") },
  { key: "audit", label: "Audit log", title: "Audit log", context: "Who did what, in Nepal time", permission: "audit.read", group: "Administration", icon: icon("M12 7v5l3 2M21 12a9 9 0 1 1-3-6.7M21 4v4h-4") },
  { key: "settings", label: "Settings", title: "Settings", context: "Website details and your own account", permission: "settings.manage", group: "Administration", icon: icon("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z") },
  { key: "account", label: "My account", title: "My account", context: "", group: "Administration", icon: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0") },
];

const allowed = (me: Me, t: Tab) => (t.anyOf ? t.anyOf.some((p) => hasPermission(me, p)) : !t.permission || hasPermission(me, t.permission));

const roleLabel = (role: string) => SYSTEM_ROLES[role]?.name ?? role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ");
const roleName = (roles: string[]) => roles.map(roleLabel).join(", ") || "No role yet";

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("sanjeevani-theme", next); } catch { /* storage blocked: the choice lasts this visit */ }
    setDark(!dark);
  };
  return { dark, toggle };
}

export default function AdminConsole() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [company, setCompany] = useState("");
  const { dark, toggle } = useDarkMode();

  const load = useCallback(async () => {
    try {
      const result = await api<Me>("/api/auth/me");
      setMe(result);
      const params = new URLSearchParams(window.location.search);
      const wanted: TabKey | null = params.has("application") ? "applications" : params.has("contact") ? "contact" : null;
      const open = TABS.filter((t) => allowed(result, t)).map((t) => t.key);
      setTab(wanted && open.includes(wanted) ? wanted : "dashboard");
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setMe(null);
  }

  if (me === undefined) return <main className="adm adm-center" aria-busy="true"><p className="adm-muted">Loading the admin…</p></main>;
  if (me === null) return <SignIn onSignedIn={load} />;

  const tabs = TABS.filter((t) => allowed(me, t));
  const current = tabs.find((t) => t.key === tab) ?? tabs[0];
  const go = (key: TabKey) => { setTab(key); setMenuOpen(false); };

  return (
    <div className="adm adm-app" data-menu={menuOpen ? "open" : "closed"}>
      <header className="adm-topbar">
        <Brand />
        <button type="button" className="adm-icon-button" aria-expanded={menuOpen} aria-controls="adm-sidebar" onClick={() => setMenuOpen(!menuOpen)}>
          {icon(menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16")}
          <span className="visually-hidden">{menuOpen ? "Close menu" : "Open menu"}</span>
        </button>
      </header>

      <aside id="adm-sidebar" className="adm-sidebar" aria-label="Admin">
        <div className="adm-sidebar-brand"><Brand role={roleName(me.roles)} /></div>
        <nav className="adm-nav" aria-label="Admin sections">
          {GROUPS.map((g) => {
            const items = tabs.filter((t) => t.group === g);
            if (!items.length) return null;
            return (
              <div key={g} className="adm-nav-group" role="group" aria-label={g}>
                <span className="adm-nav-group-label" aria-hidden="true">{g}</span>
                {items.map((t) => (
                  <button key={t.key} type="button" className="adm-nav-item" aria-current={t.key === current.key ? "page" : undefined} onClick={() => go(t.key)}>
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="adm-sidebar-foot">
          <div className="adm-profile">
            <span className="adm-avatar" aria-hidden="true"><GroupEmblem /></span>
            <span className="adm-profile-text">
              <span className="adm-profile-label">Signed in as</span>
              <strong>{me.user.name}</strong>
              <span className="adm-profile-email">{me.user.email}</span>
            </span>
          </div>
          <div className="adm-foot-actions">
            <button type="button" className="adm-foot-action" onClick={toggle} aria-pressed={dark}>
              {icon(dark ? "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" : "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z")}
              <span>{dark ? "Light" : "Dark"}</span>
            </button>
            <Link className="adm-foot-action" href="/">
              {icon("M3 11l9-7 9 7M5 10v10h14V10")}
              <span>Website</span>
            </Link>
            <button type="button" className="adm-foot-action adm-foot-logout" onClick={signOut}>
              {icon("M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10")}
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
      {menuOpen && <button type="button" className="adm-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="adm-main">
        <header className="adm-page-head">
          <div>
            <h1>{current.title}</h1>
            <p className="adm-muted">{current.key === "account" ? me.user.email : current.context}</p>
          </div>
          {current.scoped && <CompanySwitcher me={me} value={company} onChange={setCompany} />}
        </header>
        <div className="adm-view">
          {current.key === "dashboard" && <Dashboard key={company} me={me} onOpen={go} companyId={company} />}
          {current.key === "applications" && <ApplicationsPanel key={company} me={me} companyId={company} />}
          {current.key === "vacancies" && <VacanciesPanel key={company} me={me} companyId={company} />}
          {current.key === "approvals" && <ApprovalsPanel me={me} />}
          {current.key === "businesses" && <BusinessesPanel me={me} />}
          {current.key === "leadership" && <LeadershipPanel me={me} />}
          {current.key === "newsroom" && <NewsroomPanel me={me} />}
          {current.key === "contact" && <ContactPanel key={company} me={me} companyId={company} />}
          {current.key === "users" && <UsersPanel me={me} />}
          {current.key === "audit" && <AuditPanel />}
          {current.key === "settings" && (
            <>
              <SettingsPanel />
              <h2 className="adm-section-title">Your account</h2>
              <AccountPanel me={me} onSignedOut={() => setMe(null)} onEmailChanged={(email) => setMe({ ...me, user: { ...me.user, email } })} />
            </>
          )}
          {current.key === "account" && <AccountPanel me={me} onSignedOut={() => setMe(null)} onEmailChanged={(email) => setMe({ ...me, user: { ...me.user, email } })} />}
        </div>
      </main>
    </div>
  );
}

// Narrows the dashboard and lists to one company. Only companies the person may
// see are offered, and the server applies the choice inside their own scope.
function CompanySwitcher({ me, value, onChange }: { me: Me; value: string; onChange: (id: string) => void }) {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    if (!hasPermission(me, "company.read")) return;
    api<{ companies: { id: string; name: string }[] }>("/api/admin/companies").then((r) => setCompanies(r.companies)).catch(() => setCompanies([]));
  }, [me]);
  if (companies.length < 2 && !value) return null;
  return (
    <label className="adm-switcher">
      <span>Company</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All companies</option>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </label>
  );
}

function Brand({ role }: { role?: string }) {
  return (
    <span className="adm-brand">
      <span className="adm-brand-mark"><GroupEmblem /></span>
      <span className="adm-brand-text">
        <strong>Sanjeevani Group</strong>
        <span>{role ?? "Admin"}</span>
      </span>
    </span>
  );
}

// ------------------------------------------------------------------ dashboard

type Figure = { key: string; label: string; value: number | null; note: string; tab: TabKey };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "numeric", hour12: false }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

// The top of each person's dashboard: who they are, what they look after,
// and the sections their role opens. Nothing here is shown without access.
function Welcome({ me, onOpen }: { me: Me; onOpen: (tab: TabKey) => void }) {
  const [scope, setScope] = useState<string | null>(null);
  const grants = Object.values(me.permissions);
  const groupWide = grants.some((g) => g === "all");

  useEffect(() => {
    if (groupWide) { setScope("The whole Sanjeevani Group"); return; }
    const ids = [...new Set(grants.flatMap((g) => (Array.isArray(g) ? g : [])))];
    if (ids.length === 0) { setScope("No company assigned yet"); return; }
    if (!hasPermission(me, "company.read")) { setScope(`${ids.length} ${ids.length === 1 ? "company" : "companies"}`); return; }
    api<{ companies: { id: string; name: string }[] }>("/api/admin/companies")
      .then((r) => setScope(r.companies.filter((c) => ids.includes(c.id)).map((c) => c.name).join(", ") || `${ids.length} companies`))
      .catch(() => setScope(`${ids.length} ${ids.length === 1 ? "company" : "companies"}`));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the signed-in person changes
  }, [me]);

  const sections = SECTIONS.filter((s) => hasPermission(me, s.permission));
  const abilities = [...new Set(me.roles.flatMap((r) => roleAbilities(r)))];
  return (
    <section className="adm-welcome" aria-labelledby="adm-welcome-title">
      <div className="adm-welcome-head">
        <div>
          <p className="adm-welcome-greeting">{greeting()},</p>
          <h2 id="adm-welcome-title">{me.user.name}</h2>
          <div className="adm-role-chips">
            {me.roles.map((r) => <span key={r} className="adm-role-chip">{roleLabel(r)}</span>)}
          </div>
        </div>
        <dl className="adm-welcome-facts">
          <div><dt>You look after</dt><dd>{scope ?? "…"}</dd></div>
          {abilities.length > 0 && <div><dt>You can</dt><dd>{abilities.join(", ")}</dd></div>}
        </dl>
      </div>
      {sections.length > 0 && (
        <ul className="adm-workspace" aria-label="Your workspace">
          {sections.map((s) => (
            <li key={s.key}>
              <button type="button" onClick={() => onOpen(s.key as TabKey)}>
                <span className="adm-workspace-icon" aria-hidden="true">{TABS.find((t) => t.key === s.key)?.icon}</span>
                <span className="adm-workspace-text"><strong>{s.label}</strong><span>{s.text}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Dashboard({ me, onOpen, companyId = "" }: { me: Me; onOpen: (tab: TabKey) => void; companyId?: string }) {
  const scope = companyId ? `&companyId=${companyId}` : "";
  const [figures, setFigures] = useState<Figure[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    const wanted: Figure[] = [];
    if (hasPermission(me, "application.read")) wanted.push({ key: "applications", label: "New applications", value: null, note: "Waiting for a first review", tab: "applications" });
    if (hasPermission(me, "contact.read")) wanted.push({ key: "contact", label: "New enquiries", value: null, note: "Not answered yet", tab: "contact" });
    if (hasPermission(me, "vacancy.read")) wanted.push({ key: "vacancies", label: "Live vacancies", value: null, note: "", tab: "vacancies" });
    if (hasPermission(me, "content.update")) wanted.push({ key: "newsroom", label: "Newsroom drafts", value: null, note: "", tab: "newsroom" });
    if (hasPermission(me, "company.read") && !companyId) wanted.push({ key: "companies", label: "Companies", value: null, note: "", tab: "businesses" });
    if (hasPermission(me, "content.publish") || hasPermission(me, "leader.publish")) wanted.push({ key: "approvals", label: "Waiting for approval", value: null, note: "Drafts sent for review", tab: "approvals" });
    if (hasPermission(me, "user.manage")) wanted.push({ key: "users", label: "Admin users", value: null, note: "", tab: "users" });
    setFigures(wanted);

    const fill = (key: string, value: number, note?: string) => {
      if (live) setFigures((all) => all.map((f) => (f.key === key ? { ...f, value, note: note ?? f.note } : f)));
    };
    const tasks: Promise<unknown>[] = [];
    if (wanted.some((f) => f.key === "applications")) tasks.push(api<{ total: number }>(`/api/admin/job-applications?status=SUBMITTED&pageSize=1${scope}`).then((r) => fill("applications", r.total)));
    if (wanted.some((f) => f.key === "contact")) tasks.push(api<{ total: number }>(`/api/admin/contact?status=NEW&pageSize=1${scope}`).then((r) => fill("contact", r.total)));
    if (wanted.some((f) => f.key === "vacancies")) {
      tasks.push(api<{ vacancies: { status: string }[] }>(`/api/admin/vacancies${companyId ? `?companyId=${companyId}` : ""}`).then((r) => {
        const drafts = r.vacancies.filter((v) => v.status === "DRAFT").length;
        fill("vacancies", r.vacancies.filter((v) => v.status === "PUBLISHED").length, drafts ? `${drafts} draft${drafts === 1 ? "" : "s"} not published` : "No drafts waiting");
      }));
    }
    if (wanted.some((f) => f.key === "newsroom")) {
      tasks.push(Promise.all(["news", "events", "notices"].map((t) => api<{ items: { status: string }[] }>(`/api/admin/content/${t}`))).then((lists) => {
        const all = lists.flatMap((l) => l.items);
        const waiting = all.filter((i) => i.status === "PENDING_REVIEW").length;
        fill("newsroom", all.filter((i) => i.status === "DRAFT").length, waiting ? `${waiting} waiting for review` : "Nothing waiting for review");
      }));
    }
    if (wanted.some((f) => f.key === "companies")) {
      tasks.push(api<{ companies: { status: string }[] }>("/api/admin/companies").then((r) => {
        const live = r.companies.filter((c) => c.status === "PUBLISHED").length;
        fill("companies", r.companies.length, `${live} live on the website`);
      }));
    }
    if (wanted.some((f) => f.key === "approvals")) {
      const types = [...(hasPermission(me, "content.publish") ? ["news", "events", "notices", "galleries", "videos"] : []), ...(hasPermission(me, "leader.publish") ? ["leaders"] : [])];
      tasks.push(Promise.all(types.map((t) => api<{ items: unknown[] }>(`/api/admin/content/${t}?status=PENDING_REVIEW`))).then((lists) => fill("approvals", lists.reduce((n, l) => n + l.items.length, 0))));
    }
    if (wanted.some((f) => f.key === "users")) {
      tasks.push(api<{ users: { status: string }[] }>("/api/admin/users").then((r) => {
        const invited = r.users.filter((u) => u.status === "INVITED").length;
        fill("users", r.users.filter((u) => u.status === "ACTIVE").length, invited ? `${invited} invitation${invited === 1 ? "" : "s"} pending` : "All accounts active");
      }));
    }
    Promise.all(tasks).catch((e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, [me, companyId, scope]);

  const steps = [
    hasPermission(me, "vacancy.update") && { title: "Publish a vacancy", text: "Add it under Vacancies, choose its career area, then press Publish. It shows on the careers page at once.", tab: "vacancies" as TabKey },
    hasPermission(me, "application.read") && { title: "Review applications", text: "Open one to read it, download the CV and move it to the next stage.", tab: "applications" as TabKey },
    hasPermission(me, "user.manage") && { title: "Give your team their own accounts", text: "Each person gets a role for the whole group or for one company.", tab: "users" as TabKey },
    hasPermission(me, "settings.manage") && { title: "Check the contact details", text: "The email, phone and social links shown on the website.", tab: "settings" as TabKey },
  ].filter(Boolean) as { title: string; text: string; tab: TabKey }[];

  return (
    <>
      {/* Super Administrators see everything already; the banner is for scoped roles. */}
      {!me.roles.includes("SUPER_ADMIN") && <Welcome me={me} onOpen={onOpen} />}
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {figures.length > 0 && (
        <ul className="adm-figures" aria-label="Work waiting">
          {figures.map((f) => (
            <li key={f.key}>
              <button type="button" className="adm-figure" onClick={() => onOpen(f.tab)} aria-busy={f.value === null}>
                <span className="adm-figure-head">
                  <span className="adm-figure-label">{f.label}</span>
                  <span className="adm-figure-icon" aria-hidden="true">{TABS.find((t) => t.key === f.tab)?.icon}</span>
                </span>
                <span className="adm-figure-value num">{f.value ?? <span className="adm-skeleton" aria-hidden="true" />}</span>
                {f.note && f.value !== null && <span className="adm-figure-note">{f.note}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {(hasPermission(me, "settings.manage") || hasPermission(me, "audit.read")) && <TrafficChart />}
      {steps.length > 0 && (
        <section className="adm-card adm-steps" aria-labelledby="adm-steps-title">
          <h2 id="adm-steps-title">Getting started</h2>
          <ol>
            {steps.map((s) => (
              <li key={s.title}>
                <div>
                  <h3>{s.title}</h3>
                  <p className="adm-muted">{s.text}</p>
                </div>
                <button type="button" className="admin-secondary-button" onClick={() => onOpen(s.tab)}>Open</button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}

// -------------------------------------------------------------------- sign-in

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (forgot) {
        const result = await api<{ message: string }>("/api/auth/password-reset", { body: { email } });
        setNotice(result.message);
      } else {
        await api("/api/auth/login", { body: { email, password } });
        onSignedIn();
      }
    } catch (e) {
      setError(e instanceof ApiError && e.status === 503 ? "The admin is temporarily unavailable. Please try again shortly." : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="adm adm-center">
      <section className="adm-auth-card">
        <Brand role="Admin" />
        <h1>{forgot ? "Reset your password" : "Sign in"}</h1>
        <p className="adm-muted">{forgot ? "Enter your email and we will send you a reset link." : "Use your own admin account."}</p>
        {error && <p className="admin-message admin-error" role="alert">{error}</p>}
        {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}
        <form onSubmit={submit} className="adm-auth-form">
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {!forgot && (
            <>
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </>
          )}
          <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "Please wait…" : forgot ? "Send reset link" : "Sign in"}</button>
        </form>
        <div className="adm-auth-links">
          <button className="admin-link-button" type="button" onClick={() => { setForgot(!forgot); setError(""); setNotice(""); }}>
            {forgot ? "Back to sign in" : "Forgot your password?"}
          </button>
          <Link className="admin-link-button" href="/">Back to website</Link>
        </div>
      </section>
    </main>
  );
}
