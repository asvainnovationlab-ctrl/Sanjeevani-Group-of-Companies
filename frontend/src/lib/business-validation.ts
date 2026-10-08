import type { BusinessRecord } from "@/lib/business-model";

const categories = ["healthcare", "education", "agriculture", "other"];
const fields = ["name", "category", "sector", "description", "website", "location", "published", "order"];

type ValidationResult =
  | { success: true; data: Partial<BusinessRecord> }
  | { success: false; message: string };

export function validateBusinessInput(input: unknown, partial = false): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { success: false, message: "Business details must be an object." };
  }

  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((field) => !fields.includes(field))) {
    return { success: false, message: "Business details contain an unsupported field." };
  }

  const requiredFields = ["name", "category", "sector", "description"];
  if (!partial && requiredFields.some((field) => !(field in record))) {
    return { success: false, message: "Name, category, sector, and description are required." };
  }

  const data: Partial<BusinessRecord> = {};
  if ("name" in record) {
    if (typeof record.name !== "string" || !record.name.trim() || record.name.trim().length > 150) {
      return { success: false, message: "Enter a business name of 1–150 characters." };
    }
    data.name = record.name.trim();
  }
  if ("category" in record) {
    if (typeof record.category !== "string" || !categories.includes(record.category)) {
      return { success: false, message: "Choose a valid business category." };
    }
    data.category = record.category;
  }
  for (const field of ["sector", "description", "location"] as const) {
    if (!(field in record)) continue;
    const value = record[field];
    const maxLength = field === "description" ? 2000 : field === "sector" ? 100 : 150;
    if (typeof value !== "string" || (field !== "location" && !value.trim()) || value.trim().length > maxLength) {
      return { success: false, message: `${field[0].toUpperCase()}${field.slice(1)} must be non-empty and ${maxLength} characters or fewer.` };
    }
    data[field] = value.trim();
  }
  if ("website" in record) {
    if (typeof record.website !== "string" || record.website.length > 2048) {
      return { success: false, message: "Website must be a valid HTTP or HTTPS address." };
    }
    const website = record.website.trim();
    if (website) {
      try {
        const parsed = new URL(/^[a-z][a-z\d+.-]*:/i.test(website) ? website : `https://${website}`);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Invalid protocol");
        data.website = parsed.href;
      } catch {
        return { success: false, message: "Website must be a valid HTTP or HTTPS address." };
      }
    } else {
      data.website = "";
    }
  }
  if ("published" in record) {
    if (typeof record.published !== "boolean") {
      return { success: false, message: "Published must be true or false." };
    }
    data.published = record.published;
  }
  if ("order" in record) {
    if (typeof record.order !== "number" || !Number.isInteger(record.order) || record.order < 0 || record.order > 9999) {
      return { success: false, message: "Display order must be a whole number between 0 and 9999." };
    }
    data.order = record.order;
  }

  if (!partial) {
    data.website ??= "";
    data.location ??= "";
    data.published ??= true;
    data.order ??= 0;
  }
  return { success: true, data };
}
