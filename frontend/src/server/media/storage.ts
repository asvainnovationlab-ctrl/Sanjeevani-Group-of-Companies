import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { cloudinarySignature, type ImageType } from "@/server/media/rules";

// Where public images live. Cloudinary in every real environment; in local
// development without Cloudinary keys, files go to public/uploads/ so the
// admin can still be tried out. Production refuses to start an upload
// without Cloudinary.

export type StoredFile = {
  provider: "CLOUDINARY" | "LOCAL";
  storageKey: string;
  url: string;
  bytes: number;
  width?: number;
  height?: number;
};

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

export function storageMode(): "CLOUDINARY" | "LOCAL" | null {
  if (cloudinaryConfig()) return "CLOUDINARY";
  return process.env.NODE_ENV === "production" ? null : "LOCAL";
}

const FOLDER = process.env.CLOUDINARY_FOLDER || "sanjeevani";

export async function storeImage(bytes: Uint8Array, type: ImageType, folder: string): Promise<StoredFile> {
  const config = cloudinaryConfig();
  if (config) {
    const params = { folder: `${FOLDER}/${folder}`, timestamp: Math.floor(Date.now() / 1000) };
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(bytes)], { type: type.mimeType }));
    form.append("api_key", config.apiKey);
    form.append("timestamp", String(params.timestamp));
    form.append("folder", params.folder);
    form.append("signature", cloudinarySignature(params, config.apiSecret));
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, { method: "POST", body: form });
    const result = (await response.json().catch(() => ({}))) as {
      public_id?: string; secure_url?: string; bytes?: number; width?: number; height?: number; error?: { message?: string };
    };
    if (!response.ok || !result.public_id || !result.secure_url) {
      throw new Error(`Cloudinary upload failed: ${result.error?.message ?? response.status}`);
    }
    return { provider: "CLOUDINARY", storageKey: result.public_id, url: result.secure_url, bytes: result.bytes ?? bytes.length, width: result.width, height: result.height };
  }

  if (storageMode() !== "LOCAL") throw new Error("Image storage is not configured. Set the CLOUDINARY_* variables.");
  const name = `${randomUUID()}.${type.extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  const key = `uploads/${folder}/${name}`;
  return { provider: "LOCAL", storageKey: key, url: `/${key}`, bytes: bytes.length };
}

export async function deleteStoredImage(provider: string, storageKey: string) {
  const config = cloudinaryConfig();
  if (provider === "CLOUDINARY" && config) {
    const params = { public_id: storageKey, timestamp: Math.floor(Date.now() / 1000) };
    const form = new FormData();
    form.append("public_id", params.public_id);
    form.append("api_key", config.apiKey);
    form.append("timestamp", String(params.timestamp));
    form.append("signature", cloudinarySignature(params, config.apiSecret));
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, { method: "POST", body: form });
    if (!response.ok) throw new Error(`Cloudinary delete failed: ${response.status}`);
    return;
  }
  // Only files uploaded through the admin are deleted from disk; the site's
  // own images in public/ (seeded as LOCAL media) are never touched.
  if (provider === "LOCAL" && storageKey.startsWith("uploads/") && !storageKey.includes("..")) {
    await unlink(path.join(process.cwd(), "public", storageKey)).catch(() => undefined);
  }
}
