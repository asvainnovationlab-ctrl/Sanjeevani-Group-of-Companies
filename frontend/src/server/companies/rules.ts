// Pure company rules (no I/O).

export type PublishStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";
export type StatusAction = "publish" | "unpublish" | "archive" | "restore";

export type StatusChange = { status: PublishStatus; publishedAt?: Date | null; archivedAt?: Date | null };

export function statusTransition(current: PublishStatus, action: StatusAction, now = new Date()): StatusChange | string {
  switch (action) {
    case "publish":
      if (current === "PUBLISHED") return "This company is already published.";
      if (current === "ARCHIVED") return "Restore the company before publishing it.";
      return { status: "PUBLISHED", publishedAt: now, archivedAt: null };
    case "unpublish":
      if (current !== "PUBLISHED") return "Only a published company can be unpublished.";
      return { status: "DRAFT" };
    case "archive":
      if (current === "ARCHIVED") return "This company is already archived.";
      return { status: "ARCHIVED", archivedAt: now };
    case "restore":
      if (current !== "ARCHIVED") return "Only an archived company can be restored.";
      return { status: "DRAFT", archivedAt: null };
  }
}

// What must be filled in before a company can go live.
export function publishProblem(company: { name: string; description: string; sectorLabel: string }): string | null {
  if (company.name.trim().length < 2) return "Add the company name before publishing.";
  if (company.sectorLabel.trim().length < 2) return "Add the sector label before publishing.";
  if (company.description.trim().length < 20) return "Add a description (at least 20 characters) before publishing.";
  return null;
}

// Changing the address of a live page breaks links people have shared.
export function slugChangeProblem(status: PublishStatus, currentSlug: string, nextSlug: string | undefined): string | null {
  if (nextSlug === undefined || nextSlug === currentSlug) return null;
  if (status === "PUBLISHED") return "Unpublish the company before changing its web address (slug).";
  return null;
}

// At most one primary location; with none marked, the first one is primary.
export function normalizeLocations<T extends { isPrimary?: boolean }>(locations: T[]): (T & { isPrimary: boolean })[] {
  const primaryIndex = Math.max(0, locations.findIndex((l) => l.isPrimary));
  return locations.map((location, index) => ({ ...location, isPrimary: index === primaryIndex }));
}

// Field names whose values differ, for the audit log.
export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter((key) => after[key] !== undefined && JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}
