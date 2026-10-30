"use client";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/components/admin/api";

// Used by /admin/accept-invite and /admin/reset-password: both set a
// password with the one-time token from the emailed link.
export default function SetPasswordForm({ mode }: { mode: "invite" | "reset" }) {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    try {
      const result = await api<{ message: string }>("/api/auth/password-reset/confirm", { body: { token, password } });
      setDone(result.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-card">
        <Link className="admin-home-link" href="/">← Back to website</Link>
        <p className="section-overline">SANJEEVANI GROUP / ADMIN</p>
        <h1>{mode === "invite" ? "Activate your account" : "Choose a new password"}</h1>
        {!token ? (
          <p className="admin-message admin-error" role="alert">This link is incomplete. Open the link from your email again, or ask for a new one.</p>
        ) : done ? (
          <>
            <p className="admin-message admin-notice" role="status">{done}</p>
            <Link className="admin-primary-button" href="/admin">Go to sign in</Link>
          </>
        ) : (
          <>
            <p>Use at least 12 characters. A few unrelated words make a strong, memorable password.</p>
            {error && <p className="admin-message admin-error" role="alert">{error}</p>}
            <form onSubmit={submit}>
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <label htmlFor="confirm-password">Repeat password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Set password"}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
