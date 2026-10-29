// Pure rules for private documents (CVs): judged by the file's bytes and
// extension together, never by the browser-supplied type.

export const CV_MAX_BYTES = 5 * 1024 * 1024;

export type DocumentType = { mimeType: string; extension: string };

const TYPES: Record<string, { mimeType: string; magic: number[] }> = {
  pdf: { mimeType: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  docx: { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: [0x50, 0x4b, 0x03, 0x04] }, // zip
  doc: { mimeType: "application/msword", magic: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE
  jpg: { mimeType: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  jpeg: { mimeType: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  png: { mimeType: "image/png", magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
};

export function fileExtension(name: string): string {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name.trim());
  return match ? match[1].toLowerCase() : "";
}

export function sniffCv(bytes: Uint8Array, fileName: string): DocumentType | null {
  const extension = fileExtension(fileName);
  const type = TYPES[extension];
  if (!type || bytes.length < type.magic.length) return null;
  if (!type.magic.every((value, index) => bytes[index] === value)) return null;
  // A .docx is a zip; make sure it is a Word document, not any archive.
  if (extension === "docx" && !Buffer.from(bytes.subarray(0, Math.min(bytes.length, 64 * 1024))).includes("word/")) return null;
  return { mimeType: type.mimeType, extension: extension === "jpeg" ? "jpg" : extension };
}

export function cvProblem(bytes: Uint8Array, fileName: string): string | null {
  if (bytes.length === 0) return "Attach your CV.";
  if (bytes.length > CV_MAX_BYTES) return "Your CV must be 5 MB or smaller.";
  if (!TYPES[fileExtension(fileName)]) return "Your CV must be a PDF, Word or image file (.pdf, .doc, .docx, .jpg or .png).";
  if (!sniffCv(bytes, fileName)) return "That file does not look like a real PDF, Word document or image.";
  return null;
}

// Safe for a Content-Disposition header and for display: no paths, quotes or
// control characters.
export function safeFileName(name: string, fallbackExtension: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[^\w.\- ()]+/g, "_").replace(/\s+/g, " ").replace(/^\.+/, "").trim().slice(0, 150);
  return clean && fileExtension(clean) ? clean : `document.${fallbackExtension}`;
}
