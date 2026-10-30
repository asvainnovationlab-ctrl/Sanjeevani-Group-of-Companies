"use client";
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { api, formatDate, hasPermission, label, type Me } from "@/components/admin/api";
import { type Field, FieldInputs, fromItem, type Lookups, toInput } from "@/components/admin/FieldForm";

// One list-and-edit screen for any content type the API's content registry
// knows (leaders, news, events, notices, videos, galleries…): a table with
// status and workflow actions, and a form drawn from a field list.

type Item = Record<string, unknown> & { id: string; status: string; updatedAt: string; publishedAt?: string | null };

export type ContentConfig = {
  type: string; // API registry key, e.g. "leaders"
  noun: string; // "leader", "press release"
  fields: Field[];
  update: string; // permission keys
  publish: string;
  title: (item: Item) => string;
  meta?: (item: Item) => ReactNode;
  defaults?: Record<string, unknown>;
  newDefaults?: (items: Item[]) => Record<string, unknown>; // defaults that depend on existing records
  altFrom?: string; // field used to describe uploaded images
  filter?: (item: Item) => boolean; // show only part of the type, e.g. gallery videos
  heading?: string; // shown above the list when several managers share a screen
};

export default function ContentManager({ me, config, lookups }: { me: Me; config: ContentConfig; lookups: Lookups }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; updatedAt?: string; values: Record<string, unknown> } | null>(null);
  const canEdit = hasPermission(me, config.update);
  const canPublish = hasPermission(me, config.publish);
  const shown = config.filter ? items.filter(config.filter) : items;

  const load = useCallback(async () => {
    try {
      setItems((await api<{ items: Item[] }>(`/api/admin/content/${config.type}`)).items);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [config.type]);
  useEffect(() => { setLoading(true); setEditing(null); void load(); }, [load]);

  async function act(fn: () => Promise<unknown>, message: string) {
    setError(""); setNotice("");
    try { await fn(); setNotice(message); await load(); } catch (e) { setError((e as Error).message); }
  }

  function startNew() {
    setEditing({ id: null, values: fromItem(config.fields, { ...(config.defaults ?? {}), ...(config.newDefaults?.(items) ?? {}) }) });
  }
  function startEdit(item: Item) {
    setEditing({ id: item.id, updatedAt: item.updatedAt, values: fromItem(config.fields, item) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // The form's buttons say what happens after saving: nothing, publish,
  // unpublish or send for review. An archived item is restored first, since
  // archived content cannot be edited.
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const then = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value ?? "";
    const body = toInput(config.fields, editing.values);
    const base = `/api/admin/content/${config.type}`;
    const flow = (id: string, action: string) => api<{ item: Item }>(`${base}/${id}/workflow`, { body: { action } });
    const messages: Record<string, string> = { publish: "Saved and published.", unpublish: "Saved and taken off the website.", submit: "Saved and sent for review." };
    await act(async () => {
      let id = editing.id;
      if (id) {
        let updatedAt = editing.updatedAt;
        if (current?.status === "ARCHIVED") updatedAt = (await flow(id, "restore")).item.updatedAt;
        await api(`${base}/${id}`, { method: "PATCH", body: { ...body, expectedUpdatedAt: updatedAt } });
      } else {
        id = (await api<{ item: Item }>(base, { body })).item.id;
      }
      if (then) await flow(id, then);
      setEditing(null);
    }, messages[then] ?? (editing.id ? "Saved." : `Draft ${config.noun} created. Publish it when it is ready.`));
  }

  const current = editing?.id ? items.find((i) => i.id === editing.id) : undefined;
  const live = current?.status === "PUBLISHED";
  const altFrom = String(editing?.values[config.altFrom ?? "title"] ?? "");

  return (
    <>
      <div className="admin-list-heading">
        <div>{config.heading ? <h3 className="adm-manager-title">{config.heading}</h3> : <h2>{config.noun}</h2>}<p>{loading ? "Loading…" : `${shown.length} in total`}</p></div>
        {canEdit && !editing && <button className="admin-primary-button" type="button" onClick={startNew}>Add {config.noun} <span aria-hidden="true">＋</span></button>}
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}

      {editing && (
        <form className="admin-business-form" onSubmit={save}>
          <div className="admin-form-heading">
            <h3>{editing.id ? `Edit ${config.noun}` : `New ${config.noun}`}</h3>
            <button className="admin-close-button" type="button" onClick={() => setEditing(null)} aria-label="Close">×</button>
          </div>
          <div className="admin-form-grid">
            <FieldInputs fields={config.fields} values={editing.values} onChange={(values) => setEditing({ ...editing, values })} lookups={lookups} altFrom={altFrom} idPrefix={`cm-${config.type}`} />
          </div>
          <div className="admin-form-actions">
            <button className={canPublish && !live ? "admin-secondary-button" : "admin-primary-button"} type="submit">{live ? "Save changes" : "Save as draft"}</button>
            {canPublish && !live && <button className="admin-primary-button" type="submit" value="publish">Save and publish</button>}
            {canPublish && live && <button className="admin-secondary-button" type="submit" value="unpublish">Save and unpublish</button>}
            {!canPublish && (!current || current.status === "DRAFT") && <button className="admin-secondary-button" type="submit" value="submit">Save and send for review</button>}
            <button className="admin-secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <p className="admin-empty">{loading ? "Loading…" : `No ${config.noun} yet.`}</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Status</th><th>Last change</th><th>Actions</th></tr></thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.id}>
                <td>{config.title(item)}{config.meta && <small>{config.meta(item)}</small>}</td>
                <td><span className={`admin-badge admin-badge-${item.status.toLowerCase()}`}>{label(item.status)}</span></td>
                <td>{formatDate(item.updatedAt)}</td>
                <td className="admin-button-row">
                  {canEdit && (canPublish || ["DRAFT", "PENDING_REVIEW", "APPROVED"].includes(item.status)) && <button type="button" className="admin-secondary-button" onClick={() => startEdit(item)}>Edit</button>}
                  {canPublish && (
                    <button type="button" className="admin-secondary-button" onClick={() => { if (window.confirm(`Delete this ${config.noun} permanently? It is removed from the website at once and cannot be restored here.`)) void act(() => api(`/api/admin/content/${config.type}/${item.id}`, { method: "DELETE" }), "Deleted."); }}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
