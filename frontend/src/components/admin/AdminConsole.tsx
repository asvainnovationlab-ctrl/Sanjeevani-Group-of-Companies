"use client";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError, hasPermission, type Me } from "@/components/admin/api";
import { AccountPanel, AuditPanel, SettingsPanel } from "@/components/admin/SystemPanels";
import { ApplicationsPanel, VacanciesPanel } from "@/components/admin/RecruitmentPanels";
import { ContactPanel, UsersPanel } from "@/components/admin/PeoplePanels";

type Tab = { key: string; label: string; permission?: string };

const TABS: Tab[] = [
  { key: "applications", label: "Applications", permission: "application.read" },
  { key: "vacancies", label: "Vacancies", permission: "vacancy.read" },
  { key: "contact", label: "Enquiries", permission: "contact.read" },
  { key: "users", label: "Users", permission: "user.manage" },
  { key: "audit", label: "Audit log", permission: "audit.read" },
  { key: "settings", label: "Settings", permission: "settings.manage" },
  { key: "account", label: "My account" },
];

export default function AdminConsole() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [tab, setTab] = useState("account");

  const load = useCallback(async () => {
    try {
      const result = await api<Me>("/api/auth/me");
      setMe(result);
      const first = TABS.find((t) => !t.permission || hasPermission(result, t.permission));
      const wanted = new URLSearchParams(window.location.search).has("application") ? "applications" : new URLSearchParams(window.location.search).has("contact") ? "contact" : null;
      const allowed = TABS.filter((t) => !t.permission || hasPermission(result, t.permission)).map((t) => t.key);
      setTab(wanted && allowed.includes(wanted) ? wanted : first?.key ?? "account");
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setMe(null);
  }

  if (me === undefined) return <main className="admin-shell admin-login-shell"><p>Loading…</p></main>;
  if (me === null) return <SignIn onSignedIn={load} />;

  const tabs = TABS.filter((t) => !t.permission || hasPermission(me, t.permission));
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <Link className="admin-home-link" href="/">← Sanjeevani Group</Link>
          <p className="section-overline">ADMIN</p>
          <h1>Welcome, {me.user.name}</h1>
          <p>{me.roles.map((r) => r.replace(/_/g, " ").toLowerCase()).join(", ") || "No role assigned yet"}</p>
        </div>
        <button className="admin-secondary-button" type="button" onClick={signOut}>Sign out</button>
      </header>
      <nav className="admin-tabs" aria-label="Admin sections">
        {tabs.map((t) => (
          <button key={t.key} type="button" className={t.key === tab ? "is-active" : ""} aria-current={t.key === tab ? "page" : undefined} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>
      <section className="admin-content">
        {tab === "applications" && <ApplicationsPanel me={me} />}
        {tab === "vacancies" && <VacanciesPanel me={me} />}
        {tab === "contact" && <ContactPanel me={me} />}
        {tab === "users" && <UsersPanel me={me} />}
        {tab === "audit" && <AuditPanel />}
        {tab === "settings" && <SettingsPanel />}
        {tab === "account" && <AccountPanel me={me} onSignedOut={() => setMe(null)} />}
      </section>
    </main>
  );
}

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
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-card">
        <Link className="admin-home-link" href="/">← Back to website</Link>
        <p className="section-overline">SANJEEVANI GROUP / ADMIN</p>
        <h1>{forgot ? "Reset your password" : "Admin sign in"}</h1>
        <p>{forgot ? "Enter your email and we will send you a reset link." : "Sign in with your own admin account."}</p>
        {error && <p className="admin-message admin-error" role="alert">{error}</p>}
        {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}
        <form onSubmit={submit}>
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
        <button className="admin-link-button" type="button" onClick={() => { setForgot(!forgot); setError(""); setNotice(""); }}>
          {forgot ? "Back to sign in" : "Forgot your password?"}
        </button>
      </section>
    </main>
  );
}
