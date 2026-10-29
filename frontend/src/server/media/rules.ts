import { createHash } from "node:crypto";

// Pure upload rules (no I/O): what may be uploaded, judged by the file's
// actual bytes, never by its name or the browser-supplied type.

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type ImageType = { mimeType: string; extension: string };

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value);
const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));

// JPEG, PNG, WebP, GIF and AVIF. SVG is refused: it can carry scripts.
export function sniffImage(bytes: Uint8Array): ImageType | null {
  if (bytes.length < 12) return null;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mimeType: "image/jpeg", extension: "jpg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mimeType: "image/png", extension: "png" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return { mimeType: "image/webp", extension: "webp" };
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return { mimeType: "image/gif", extension: "gif" };
  if (ascii(bytes, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(bytes, 8, 12))) return { mimeType: "image/avif", extension: "avif" };
  return null;
}

// Returns a reason the upload is refused, or null.
export function imageProblem(bytes: Uint8Array): string | null {
  if (bytes.length === 0) return "The file is empty.";
  if (bytes.length > IMAGE_MAX_BYTES) return `Images must be ${IMAGE_MAX_BYTES / 1024 / 1024} MB or smaller.`;
  if (!sniffImage(bytes)) return "Upload a JPG, PNG, WebP, GIF or AVIF image.";
  return null;
}

// Cloudinary request signature: the parameters (except file, api_key,
// resource_type, cloud_name) sorted by name, joined as k=v&k=v, followed by
// the API secret, SHA-1 hex.
export function cloudinarySignature(params: Record<string, string | number>, apiSecret: string): string {
  const payload = Object.keys(params)
    .filter((key) => !["file", "api_key", "resource_type", "cloud_name"].includes(key) && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

// Alt text is required for accessibility; keep it short and plain.
export function cleanAltText(value: string | null | undefined): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 250) : null;
}
