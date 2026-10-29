// Pure helpers used by the seed and the MongoDB migration. No database access,
// so they are unit-tested directly (tests/seed-helpers.test.ts).

import type { CompanyCategory, EmploymentType } from "@prisma/client";

export function toCompanyCategory(value: string): CompanyCategory {
  const map: Record<string, CompanyCategory> = {
    healthcare: "HEALTHCARE",
    education: "EDUCATION",
    agriculture: "AGRICULTURE",
    other: "OTHER",
  };
  const category = map[value.trim().toLowerCase()];
  if (!category) throw new Error(`Unknown company category: ${value}`);
  return category;
}

export function toEmploymentType(value: string): EmploymentType {
  const key = value.trim().toLowerCase().replace(/[\s_]+/g, "-");
  const map: Record<string, EmploymentType> = {
    "full-time": "FULL_TIME",
    "part-time": "PART_TIME",
    contract: "CONTRACT",
    internship: "INTERNSHIP",
    temporary: "TEMPORARY",
    volunteer: "VOLUNTEER",
  };
  return map[key] ?? "FULL_TIME";
}

// "18-35 years" / "18 – 35" → { min: 18, max: 35 }. Anything else → nulls.
export function parseAgeRange(value: string | undefined): { min: number | null; max: number | null } {
  const match = value?.match(/(\d{2})\s*[-–to]+\s*(\d{2})/i);
  if (!match) return { min: null, max: null };
  const min = Number(match[1]);
  const max = Number(match[2]);
  return min <= max ? { min, max } : { min: null, max: null };
}

// Placeholder text such as "[Add deadline]" is treated as "not set".
export function isPlaceholder(value: string | undefined | null): boolean {
  return !value || /^\s*\[add\b/i.test(value);
}

// Public-folder paths are stored URL-encoded in the data files
// ("/key%20factor/edu.jpg"); the storage key keeps the decoded path.
export function localMediaKey(url: string): string {
  try {
    return decodeURI(url);
  } catch {
    return url;
  }
}

export function guessMimeType(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
  };
  return map[extension] ?? "application/octet-stream";
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Best-effort date for "November 2026"-style labels; first of the month.
export function parseMonthYear(value: string): Date | null {
  const time = Date.parse(`1 ${value}`);
  return Number.isNaN(time) ? null : new Date(time);
}
