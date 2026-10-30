"use client";
import { type ChangeEvent, useState } from "react";
import { api } from "@/components/admin/api";

// A small form engine: each screen describes its fields once, and this file
// draws them and converts between what the API stores and what people type.

export type Option = [value: string, label: string];
export type Field =
  | { k: string; label: string; type: "text" | "textarea" | "url" | "email" | "number"; required?: boolean; help?: string; wide?: boolean }
  | { k: string; label: string; type: "lines" | "paragraphs" | "blocks"; help?: string; required?: boolean }
  | { k: string; label: string; type: "date" | "datetime"; required?: boolean; help?: string }
  | { k: string; label: string; type: "select"; options: Option[] | "companies" | "sectors"; required?: boolean; empty?: string; help?: string }
  | { k: string; label: string; type: "checkbox"; help?: string }
  | { k: string; label: string; type: "image"; rel: string; folder: string; help?: string }
  | { k: string; label: string; type: "rows"; fields: Field[]; blank: Record<string, unknown>; add: string; help?: string };

export type Lookups = { companies: Option[]; sectors: Option[] };
type Values = Record<string, unknown>;

const asText = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const toLocal = (iso: unknown) => {
  if (!iso) return "";
  const d = new Date(String(iso));
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// API record → editor values
export function fromItem(fields: Field[], item: Values | null): Values {
  const out: Values = {};
  for (const f of fields) {
    const v = item?.[f.k];
    switch (f.type) {
      case "lines": out[f.k] = Array.isArray(v) ? v.join("\n") : ""; break;
      case "paragraphs": out[f.k] = Array.isArray(v) ? v.join("\n\n") : ""; break;
      case "blocks": out[f.k] = Array.isArray(v) ? (v as { text?: string; items?: string[] }[]).map((b) => b.text ?? (b.items ?? []).join("\n")).join("\n\n") : ""; break;
      case "datetime": out[f.k] = toLocal(v); break;
      case "date": out[f.k] = v ? String(v).slice(0, 10) : ""; break;
      case "checkbox": out[f.k] = Boolean(v); break;
      case "image": out[f.k] = { id: v ?? null, url: (item?.[f.rel] as { url?: string } | null)?.url ?? null }; break;
      case "rows": out[f.k] = Array.isArray(v) ? (v as Values[]).map((row) => fromItem(f.fields, row)) : []; break;
      default: out[f.k] = asText(v);
    }
  }
  return out;
}

// editor values → API input. Empty optional values become null; required ones stay as typed.
export function toInput(fields: Field[], values: Values): Values {
  const out: Values = {};
  for (const f of fields) {
    const v = values[f.k];
    switch (f.type) {
      case "lines": out[f.k] = asText(v).split("\n").map((s) => s.trim()).filter(Boolean); break;
      case "paragraphs": out[f.k] = asText(v).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean); break;
      case "blocks": {
        const parts = asText(v).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
        out[f.k] = parts.length ? parts.map((text) => ({ type: "paragraph", text })) : null;
        break;
      }
      case "datetime": out[f.k] = v ? new Date(String(v)).toISOString() : null; break;
      case "date": out[f.k] = v ? `${String(v)}T00:00:00.000Z` : null; break;
      case "number": out[f.k] = asText(v).trim() === "" ? undefined : Number(v); break; // empty = leave unchanged
      case "checkbox": out[f.k] = Boolean(v); break;
      case "image": out[f.k] = (v as { id: string | null } | undefined)?.id ?? null; break;
      case "rows": out[f.k] = ((v as Values[]) ?? []).map((row) => toInput(f.fields, row)); break;
      case "select": out[f.k] = asText(v) === "" ? null : v; break;
      default: {
        const t = asText(v).trim();
        out[f.k] = t === "" && !f.required ? null : t;
      }
    }
  }
  return out;
}

function ImageInput({ value, onChange, folder, alt }: { value: { id: string | null; url: string | null }; onChange: (v: { id: string | null; url: string | null }) => void; folder: string; alt: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("altText", alt || file.name.replace(/\.[^.]+$/, ""));
      form.append("folder", folder);
      const { asset } = await api<{ asset: { id: string; url: string } }>("/api/admin/media", { form });
      onChange({ id: asset.id, url: asset.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="adm-image-input">
      {/* eslint-disable-next-line @next/next/no-img-element -- a preview of an uploaded file, any size */}
      <span className="adm-image-preview">{value.url ? <img src={value.url} alt="" /> : <span className="adm-muted">No image</span>}</span>
      <div className="adm-image-actions">
        <label className="admin-secondary-button">
          {busy ? "Uploading…" : value.url ? "Replace" : "Upload"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={upload} disabled={busy} className="visually-hidden" />
        </label>
        {value.url && <button type="button" className="admin-link-button" onClick={() => onChange({ id: null, url: null })}>Remove</button>}
        <small className="adm-muted">JPG, PNG or WebP, up to 5 MB</small>
        {error && <small className="adm-field-error" role="alert">{error}</small>}
      </div>
    </div>
  );
}

export function FieldInputs({ fields, values, onChange, lookups, altFrom, idPrefix }: { fields: Field[]; values: Values; onChange: (v: Values) => void; lookups: Lookups; altFrom: string; idPrefix: string }) {
  const set = (k: string, v: unknown) => onChange({ ...values, [k]: v });
  return (
    <>
      {fields.map((f) => {
        const id = `${idPrefix}-${f.k}`;
        const help = f.help ? <small className="adm-muted">{f.help}</small> : null;
        if (f.type === "checkbox") {
          return <label key={f.k} className="admin-publish-field adm-field-wide"><input id={id} type="checkbox" checked={Boolean(values[f.k])} onChange={(e) => set(f.k, e.target.checked)} /> {f.label}</label>;
        }
        if (f.type === "image") {
          return <div key={f.k} className="adm-field adm-field-wide"><span className="adm-field-label">{f.label}</span>{help}<ImageInput value={(values[f.k] as { id: string | null; url: string | null }) ?? { id: null, url: null }} onChange={(v) => set(f.k, v)} folder={f.folder} alt={altFrom} /></div>;
        }
        if (f.type === "rows") {
          const rows = (values[f.k] as Values[]) ?? [];
          return (
            <fieldset key={f.k} className="adm-rows adm-field-wide">
              <legend>{f.label}</legend>
              {help}
              {rows.map((row, i) => (
                <div className="adm-row" key={i}>
                  <div className="adm-row-fields">
                    <FieldInputs fields={f.fields} values={row} onChange={(next) => set(f.k, rows.map((r, j) => (j === i ? next : r)))} lookups={lookups} altFrom={altFrom} idPrefix={`${id}-${i}`} />
                  </div>
                  <div className="adm-row-tools">
                    <button type="button" className="admin-close-button" aria-label="Move up" disabled={i === 0} onClick={() => { const next = [...rows]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; set(f.k, next); }}>↑</button>
                    <button type="button" className="admin-close-button" aria-label="Remove" onClick={() => set(f.k, rows.filter((_, j) => j !== i))}>×</button>
                  </div>
                </div>
              ))}
              <button type="button" className="admin-secondary-button" onClick={() => set(f.k, [...rows, fromItem(f.fields, f.blank)])}>{f.add}</button>
            </fieldset>
          );
        }
        const common = { id, value: asText(values[f.k]), onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(f.k, e.target.value) };
        const wide = f.type === "textarea" || f.type === "lines" || f.type === "paragraphs" || f.type === "blocks" || ("wide" in f && f.wide);
        let control;
        if (f.type === "select") {
          const options = f.options === "companies" ? lookups.companies : f.options === "sectors" ? lookups.sectors : f.options;
          control = (
            <select {...common} required={f.required}>
              {(!f.required || f.empty) && <option value="">{f.empty ?? "None"}</option>}
              {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          );
        } else if (f.type === "textarea" || f.type === "lines" || f.type === "paragraphs" || f.type === "blocks") {
          control = <textarea {...common} rows={f.type === "lines" ? 4 : 6} required={f.required} />;
        } else {
          const type = f.type === "datetime" ? "datetime-local" : f.type;
          control = <input {...common} type={type} required={f.required} />;
        }
        return (
          <label key={f.k} htmlFor={id} className={`adm-field${wide ? " adm-field-wide" : ""}`}>
            <span className="adm-field-label">{f.label}{f.required && <span aria-hidden="true"> *</span>}</span>
            {control}
            {help}
          </label>
        );
      })}
    </>
  );
}
