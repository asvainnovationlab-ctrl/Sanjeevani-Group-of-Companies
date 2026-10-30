import { SYSTEM_ROLES } from "@/server/auth/permissions";

// Which admin sections a permission opens. The sidebar, the role-based
// dashboard and the Users page all read this, so they always agree.
export const SECTIONS = [
  { key: "applications", label: "Applications", permission: "application.read", text: "Review job applications and CVs" },
  { key: "vacancies", label: "Vacancies", permission: "vacancy.read", text: "Post and manage job openings" },
  { key: "businesses", label: "Businesses", permission: "company.read", text: "Company pages and categories" },
  { key: "leadership", label: "Leadership", permission: "leader.update", text: "Leader profiles and messages" },
  { key: "newsroom", label: "Newsroom", permission: "content.update", text: "News, events, notices and gallery" },
  { key: "contact", label: "Enquiries", permission: "contact.read", text: "Messages from the contact page" },
  { key: "users", label: "Users", permission: "user.manage", text: "Accounts, roles and access" },
  { key: "audit", label: "Audit log", permission: "audit.read", text: "Who changed what, and when" },
  { key: "settings", label: "Settings", permission: "settings.manage", text: "Website details and contacts" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

export function sectionsForPermissions(permissions: readonly string[]) {
  return SECTIONS.filter((s) => permissions.includes(s.permission));
}

export function roleSections(roleKey: string) {
  return sectionsForPermissions(SYSTEM_ROLES[roleKey]?.permissions ?? []);
}

export function roleDescription(roleKey: string) {
  return SYSTEM_ROLES[roleKey]?.description ?? "";
}

// What a role can do beyond opening a section, in plain words.
export function roleAbilities(roleKey: string): string[] {
  const p = new Set<string>(SYSTEM_ROLES[roleKey]?.permissions ?? []);
  const out: string[] = [];
  if (p.has("vacancy.publish")) out.push("publish vacancies");
  if (p.has("application.update")) out.push("move applications forward");
  if (p.has("application.export")) out.push("export applications");
  if (p.has("company.publish")) out.push("publish company pages");
  if (p.has("content.publish")) out.push("publish news and pages");
  else if (p.has("content.update")) out.push("write drafts for review");
  if (p.has("legal.publish")) out.push("publish legal pages");
  if (p.has("user.manage")) out.push("manage users");
  if (out.length === 0 && p.size > 0) out.push("view only");
  return out;
}
