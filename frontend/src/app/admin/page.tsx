"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { Business, BusinessCategory } from "@/data/businesses";

type BusinessForm = {
  name: string;
  category: BusinessCategory;
  sector: string;
  description: string;
  website: string;
  location: string;
  published: boolean;
  order: string;
};

const emptyForm: BusinessForm = {
  name: "",
  category: "other",
  sector: "",
  description: "",
  website: "",
  location: "",
  published: true,
  order: "0",
};

function isBusinessCategory(value: string): value is BusinessCategory {
  return ["healthcare", "education", "agriculture", "other"].includes(value);
}

async function responseMessage(response: Response, fallback: string) {
  try {
    const result = (await response.json()) as { message?: unknown };
    return typeof result.message === "string" ? result.message : fallback;
  } catch {
    return fallback;
  }
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [password, setPassword] = useState("");
  const [form, setForm] = useState<BusinessForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadBusinesses() {
    setLoadingBusinesses(true);
    try {
      const response = await fetch("/api/admin/businesses");
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Could not load businesses."));
      }
      const result = (await response.json()) as { data: Business[] };
      setBusinesses(result.data);
    } finally {
      setLoadingBusinesses(false);
    }
  }

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session");
        if (response.status === 401) {
          setAuthenticated(false);
        } else if (!response.ok) {
          throw new Error(await responseMessage(response, "Could not check admin access."));
        } else {
          setAuthenticated(true);
          await loadBusinesses();
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not connect to the admin service.");
      } finally {
        setCheckingSession(false);
      }
    }
    void checkSession();
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Could not sign in."));
      }
      setAuthenticated(true);
      setPassword("");
      await loadBusinesses();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Could not sign out."));
      }
      setAuthenticated(false);
      setBusinesses([]);
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Could not sign out.");
    }
  }

  function startNewBusiness() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setError("");
    setNotice("");
  }

  function startEditing(business: Business) {
    setEditingId(business._id);
    setForm({
      name: business.name,
      category: business.category,
      sector: business.sector,
      description: business.description,
      website: business.website,
      location: business.location,
      published: business.published,
      order: String(business.order),
    });
    setFormOpen(true);
    setError("");
    setNotice("");
  }

  async function saveBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const body = { ...form, order: Number(form.order) };
    try {
      const response = await fetch(
        editingId ? `/api/admin/businesses/${encodeURIComponent(editingId)}` : "/api/admin/businesses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Could not save this business."));
      }
      await loadBusinesses();
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setNotice(editingId ? "Business details updated." : "Business added to the directory.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this business.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(business: Business) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/businesses/${encodeURIComponent(business._id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !business.published }),
      });
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Could not update the publication status."));
      }
      setBusinesses((current) => current.map((item) => item._id === business._id
        ? { ...item, published: !item.published }
        : item));
      setNotice(`${business.name} is now ${business.published ? "hidden from" : "visible in"} the public directory.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the publication status.");
    }
  }

  async function deleteBusiness(business: Business) {
    if (!window.confirm(`Permanently delete ${business.name}? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/businesses/${encodeURIComponent(business._id)}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Could not delete this business."));
      }
      setBusinesses((current) => current.filter((item) => item._id !== business._id));
      setNotice(`${business.name} was deleted.`);
      if (editingId === business._id) setFormOpen(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this business.");
    }
  }

  if (checkingSession) {
    return <main className="admin-shell"><p className="admin-loading">Checking admin access…</p></main>;
  }

  if (!authenticated) {
    return (
      <main className="admin-shell admin-login-shell">
        <section className="admin-login-card">
          <Link className="admin-home-link" href="/">← Back to website</Link>
          <p className="section-overline">SANJEEVANI GROUP / ADMIN</p>
          <h1>Admin sign in</h1>
          <p>Sign in to manage the group business directory.</p>
          {error && <p className="admin-message admin-error" role="alert">{error}</p>}
          <form onSubmit={handleLogin}>
            <label htmlFor="admin-password">Admin password</label>
            <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <Link className="admin-home-link" href="/">← Sanjeevani Group</Link>
          <p className="section-overline">CONTENT MANAGEMENT</p>
          <h1>Business directory</h1>
          <p>Manage business details and control what appears on the public website.</p>
        </div>
        <button className="admin-secondary-button" type="button" onClick={handleLogout}>Sign out</button>
      </header>
      <section className="admin-content">
        <div className="admin-list-heading">
          <div><h2>Businesses</h2><p>{businesses.length} records · Published records appear on the website</p></div>
          <button className="admin-primary-button" type="button" onClick={startNewBusiness}>Add business <span aria-hidden="true">＋</span></button>
        </div>

        {error && <p className="admin-message admin-error" role="alert">{error}</p>}
        {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}

        {formOpen && (
          <form className="admin-business-form" onSubmit={saveBusiness}>
            <div className="admin-form-heading"><h2>{editingId ? "Edit business" : "Add a business"}</h2><button type="button" className="admin-close-button" onClick={() => setFormOpen(false)} aria-label="Close business form">×</button></div>
            <div className="admin-form-grid">
              <label>Business name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={150} required /></label>
              <label>Category<select value={form.category} onChange={(event) => { if (isBusinessCategory(event.target.value)) setForm({ ...form, category: event.target.value }); }}><option value="healthcare">Healthcare</option><option value="education">Education</option><option value="agriculture">Agriculture</option><option value="other">Other</option></select></label>
              <label>Sector<input value={form.sector} onChange={(event) => setForm({ ...form, sector: event.target.value })} maxLength={100} required /></label>
              <label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} maxLength={150} /></label>
              <label>Website<input type="url" placeholder="https://example.com" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} maxLength={2048} /></label>
              <label>Display order<input type="number" min="0" max="9999" step="1" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} required /></label>
              <label className="admin-description-field">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={2000} rows={4} required /></label>
              <label className="admin-publish-field"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Publish on public website</label>
            </div>
            <div className="admin-form-actions"><button className="admin-secondary-button" type="button" onClick={() => setFormOpen(false)}>Cancel</button><button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save business"}</button></div>
          </form>
        )}

        {loadingBusinesses ? <p className="admin-loading">Loading businesses…</p> : businesses.length ? (
          <div className="admin-business-list">
            {businesses.map((business) => (
              <article className="admin-business-row" key={business._id}>
                <div className="admin-business-summary"><span className={`admin-status${business.published ? " is-published" : ""}`}>{business.published ? "Published" : "Draft"}</span><h3>{business.name}</h3><p>{business.sector} · {business.location || "Location not set"}</p></div>
                <div className="admin-business-actions"><button type="button" onClick={() => startEditing(business)}>Edit</button><button type="button" onClick={() => void togglePublished(business)}>{business.published ? "Unpublish" : "Publish"}</button><button className="admin-delete-button" type="button" onClick={() => void deleteBusiness(business)}>Delete</button></div>
              </article>
            ))}
          </div>
        ) : <p className="admin-empty">No businesses have been added yet.</p>}
      </section>
    </main>
  );
}
