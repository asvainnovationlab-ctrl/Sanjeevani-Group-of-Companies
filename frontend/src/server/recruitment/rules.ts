import { endOfKathmanduDay } from "@/server/time";

// Pure recruitment rules (no I/O).

export type VacancyStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
export type VacancyAction = "publish" | "close" | "archive" | "restore";
export type ApplicationStatus = "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";

export function vacancyTransition(current: VacancyStatus, action: VacancyAction, now = new Date()) {
  switch (action) {
    case "publish":
      if (current === "PUBLISHED") return "This vacancy is already published.";
      if (current === "ARCHIVED") return "Restore the vacancy before publishing it.";
      return { status: "PUBLISHED" as const, publishedAt: now, closedAt: null };
    case "close":
      if (current !== "PUBLISHED") return "Only a published vacancy can be closed.";
      return { status: "CLOSED" as const, closedAt: now };
    case "archive":
      if (current === "ARCHIVED") return "This vacancy is already archived.";
      return { status: "ARCHIVED" as const };
    case "restore":
      if (current !== "ARCHIVED") return "Only an archived vacancy can be restored.";
      return { status: "DRAFT" as const };
  }
}

type Window = { status: VacancyStatus; publishAt: Date | null; closeAt: Date | null; deadline: Date | null };

// Applications are accepted until the end of the deadline day, Nepal time.
export function isAcceptingApplications(v: Window, now = new Date()): boolean {
  if (v.status !== "PUBLISHED") return false;
  if (v.publishAt && v.publishAt.getTime() > now.getTime()) return false;
  if (v.closeAt && v.closeAt.getTime() <= now.getTime()) return false;
  if (v.deadline && endOfKathmanduDay(v.deadline).getTime() < now.getTime()) return false;
  return true;
}

// Visible on the public site: published and past its publish time (a closed
// position stays hidden; one past its deadline shows as closed).
export function isPubliclyVisible(v: Window, now = new Date()): boolean {
  return v.status === "PUBLISHED" && (!v.publishAt || v.publishAt.getTime() <= now.getTime());
}

type Publishable = {
  title: string;
  summary: string;
  requiredEducation: string;
  requiredExperience: string;
  responsibilities: string[];
  minAge: number | null;
  maxAge: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryDisclosed: boolean;
  deadline: Date | null;
  openings: number;
};

export function vacancyPublishProblem(v: Publishable, now = new Date()): string | null {
  if (v.title.trim().length < 3) return "Add the position title.";
  if (v.summary.trim().length < 20) return "Add a summary of at least 20 characters.";
  if (!v.requiredEducation.trim()) return "Add the required education.";
  if (!v.requiredExperience.trim()) return "Add the required experience.";
  if (v.responsibilities.length === 0) return "List at least one responsibility.";
  if (v.openings < 1) return "Openings must be at least 1.";
  if (v.minAge !== null && v.maxAge !== null && v.minAge > v.maxAge) return "The minimum age is above the maximum age.";
  if (v.salaryMin !== null && v.salaryMax !== null && v.salaryMin > v.salaryMax) return "The minimum salary is above the maximum salary.";
  if (v.salaryDisclosed && v.salaryMin === null && v.salaryMax === null) return "Add a salary, or choose not to show it.";
  if (v.deadline && endOfKathmanduDay(v.deadline).getTime() < now.getTime()) return "The deadline has already passed. Set a new one.";
  return null;
}

export function ageProblem(age: number, v: { minAge: number | null; maxAge: number | null }): string | null {
  if (v.minAge !== null && age < v.minAge) return `Applicants for this position must be at least ${v.minAge} years old.`;
  if (v.maxAge !== null && age > v.maxAge) return `Applicants for this position must be ${v.maxAge} years old or younger.`;
  return null;
}

const APPLICATION_FLOW: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "SHORTLISTED", "REJECTED", "WITHDRAWN"],
  UNDER_REVIEW: ["SHORTLISTED", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["INTERVIEW", "UNDER_REVIEW", "REJECTED", "WITHDRAWN"],
  INTERVIEW: ["OFFERED", "SHORTLISTED", "REJECTED", "WITHDRAWN"],
  OFFERED: ["REJECTED", "WITHDRAWN"],
  REJECTED: ["UNDER_REVIEW"], // reopen
  WITHDRAWN: [],
};

export function applicationTransitionProblem(from: ApplicationStatus, to: ApplicationStatus): string | null {
  if (from === to) return "The application already has this status.";
  if (!APPLICATION_FLOW[from].includes(to)) return `An application cannot move from ${label(from)} to ${label(to)}.`;
  return null;
}

export const allowedNextStatuses = (from: ApplicationStatus) => APPLICATION_FLOW[from];

const label = (status: string) => status.toLowerCase().replace(/_/g, " ");

// "SG-V-0007" → "SG-V-0008"; null → "SG-V-0001".
export function nextVacancyCode(last: string | null): string {
  const n = last ? Number(/(\d+)$/.exec(last)?.[1] ?? 0) : 0;
  return `SG-V-${String(n + 1).padStart(4, "0")}`;
}

// Per Nepal calendar year: SG-2026-000001.
export function nextApplicationReference(year: number, last: string | null): string {
  const prefix = `SG-${year}-`;
  const n = last?.startsWith(prefix) ? Number(last.slice(prefix.length)) : 0;
  return `${prefix}${String(n + 1).padStart(6, "0")}`;
}

// CSV cell that is safe to open in Excel: quoted, and formulas neutralised
// (a cell starting with = + - @ tab or CR is prefixed with ').
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
