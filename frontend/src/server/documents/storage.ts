import { randomUUID } from "node:crypto";
import { cloudinarySignature } from "@/server/media/rules";

// Private documents (CVs). Never reachable by a public URL:
// - CLOUDINARY: uploaded as `authenticated` raw files; only the server can
//   create a short-lived signed download link, after checking permissions.
// - DATABASE: bytes stored in PrivateDocument.data (no extra service needed;
//   fine for modest volumes, uses database storage).
// Default: Cloudinary when configured, otherwise the database. Override with
// CV_STORAGE=database|cloudinary.

export type StoredDocument = { provider: "CLOUDINARY" | "DATABASE"; storageKey: string; data?: Uint8Array };

function cloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

export function documentStorageMode(): "CLOUDINARY" | "DATABASE" {
  const choice = process.env.CV_STORAGE?.toLowerCase();
  if (choice === "database") return "DATABASE";
  if (choice === "cloudinary" && !cloudinary()) throw new Error("CV_STORAGE=cloudinary needs the CLOUDINARY_* variables.");
  return cloudinary() ? "CLOUDINARY" : "DATABASE";
}

const FOLDER = `${process.env.CLOUDINARY_FOLDER || "sanjeevani"}/private`;

export async function storeDocument(bytes: Uint8Array, mimeType: string, extension: string, folder: string): Promise<StoredDocument> {
  if (documentStorageMode() === "DATABASE") {
    return { provider: "DATABASE", storageKey: `db/${folder}/${randomUUID()}.${extension}`, data: bytes };
  }
  const config = cloudinary()!;
  const params = {
    folder: `${FOLDER}/${folder}`,
    public_id: `${randomUUID()}.${extension}`, // raw files keep the extension in the id
    timestamp: Math.floor(Date.now() / 1000),
    type: "authenticated",
  };
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mimeType }));
  form.append("api_key", config.apiKey);
  for (const [key, value] of Object.entries(params)) form.append(key, String(value));
  form.append("signature", cloudinarySignature(params, config.apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/raw/upload`, { method: "POST", body: form });
  const result = (await response.json().catch(() => ({}))) as { public_id?: string; error?: { message?: string } };
  if (!response.ok || !result.public_id) throw new Error(`Private upload failed: ${result.error?.message ?? response.status}`);
  return { provider: "CLOUDINARY", storageKey: result.public_id };
}

// Reads a document's bytes for an authorised download.
export async function readDocument(doc: { provider: string; storageKey: string; data: Uint8Array | null }): Promise<Uint8Array> {
  if (doc.provider === "DATABASE") {
    if (!doc.data) throw new Error("Document data is missing.");
    return doc.data;
  }
  if (doc.provider !== "CLOUDINARY") throw new Error(`Unsupported document provider ${doc.provider}.`);
  const config = cloudinary();
  if (!config) throw new Error("Cloudinary is not configured, so this document cannot be read.");
  const params = {
    public_id: doc.storageKey,
    timestamp: Math.floor(Date.now() / 1000),
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 60,
  };
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    api_key: config.apiKey,
    signature: cloudinarySignature(params, config.apiSecret),
  });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/raw/download?${query}`);
  if (!response.ok) throw new Error(`Private download failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function deleteDocument(doc: { provider: string; storageKey: string }) {
  if (doc.provider !== "CLOUDINARY") return; // database rows are deleted with the record
  const config = cloudinary();
  if (!config) return;
  const params = { public_id: doc.storageKey, timestamp: Math.floor(Date.now() / 1000), type: "authenticated" };
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) form.append(key, String(value));
  form.append("api_key", config.apiKey);
  form.append("signature", cloudinarySignature(params, config.apiSecret));
  form.append("resource_type", "raw");
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/raw/destroy`, { method: "POST", body: form });
  if (!response.ok) throw new Error(`Private delete failed: ${response.status}`);
}
