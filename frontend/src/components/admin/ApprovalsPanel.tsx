"use client";
import { useCallback, useEffect, useState } from "react";
import { api, formatDate, hasPermission, type Me } from "@/components/admin/api";

// Everything waiting for a publisher, across content types, in one queue.
// The workflow API checks the publish permission again for every action.

const TYPES: { type: string; label: string; permission: string; title: (i: Item) => string }[] = [
  { type: "news", label: "News", permission: "content.publish", title: (i) => String(i.title) },
  { type: "events", label: "Event", permission: "content.publish", title: (i) => String(i.title) },
  { type: "notices", label: "Notice", permission: "content.publish", title: (i) => String(i.title) },
  { type: "galleries", label: "Gallery", permission: "content.publish", title: (i) => String(i.title) },
  { type: "videos", label: "Video", permission: "content.publish", title: (i) => String(i.title) },
  { type: "leaders", label: "Leader", permission: "leader.publish", title: (i) => String(i.name) },
];

type Item = Record<string, unknown> & { id: string; status: string; updatedAt: string };
type Row = { type: string; label: string; title: string; item: Item };

export default function ApprovalsPanel({ me }: { me: Me }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const types = TYPES.filter((t) => hasPermission(me, t.permission));

  const load = useCallback(async () => {
    try {
      const lists = await Promise.all(types.map(async (t) => {
        const { items } = await api<{ items: Item[] }>(`/api/admin/content/${t.type}?status=PENDING_REVIEW`);
        return items.map((item) => ({ type: t.type, label: t.label, title: t.title(item), item }));
      }));
      setRows(lists.flat().sort((a, b) => a.item.updatedAt.localeCompare(b.item.updatedAt)));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the allowed types only change with the signed-in person
  }, [me]);
  useEffect(() => { void load(); }, [load]);

  async function act(row: Row, action: "publish" | "reject") {
    setError(""); setNotice("");
    try {
      await api(`/api/admin/content/${row.type}/${row.item.id}/workflow`, { body: { action } });
      setNotice(action === "publish" ? `"${row.title}" is published.` : `"${row.title}" was sent back to its author.`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <div className="admin-list-heading">
        <div><h2>Publishing approvals</h2><p>{loading ? "Loading…" : `${rows.length} waiting for review, oldest first`}</p></div>
      </div>
      {error && <p className="admin-message admin-error" role="alert">{error} <button type="button" className="admin-link-button" onClick={() => void load()}>Try again</button></p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}
      {rows.length === 0 ? (
        <p className="admin-empty">{loading ? "Loading…" : "Nothing is waiting for review. Items sent for review by editors appear here."}</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Item</th><th>Kind</th><th>Sent for review</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.type}-${r.item.id}`}>
                <td>{r.title}</td>
                <td><span className="adm-chip">{r.label}</span></td>
                <td>{formatDate(r.item.updatedAt)}</td>
                <td className="admin-button-row">
                  <button type="button" className="admin-primary-button" onClick={() => act(r, "publish")}>Approve and publish</button>
                  <button type="button" className="admin-secondary-button" onClick={() => act(r, "reject")}>Send back</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
