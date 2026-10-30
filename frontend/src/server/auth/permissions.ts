// The permission catalogue and the system roles that grant them.
//
// Permissions are checked on the server for every protected operation, always
// together with the company the record belongs to (see Membership: a role is
// either group-wide or granted for one company). The seed writes this
// catalogue into the Role / Permission / RolePermission tables; custom roles
// can be added later in the admin without code changes.

export const PERMISSIONS = {
  // Platform
  "user.manage": "Create, suspend and assign roles to admin users",
  "role.manage": "Edit roles and their permissions",
  "settings.manage": "Edit global site settings",
  "audit.read": "View the audit log",

  // Companies
  "company.read": "View company records in the admin",
  "company.create": "Create companies",
  "company.update": "Edit company details, locations and media",
  "company.publish": "Publish, unpublish, archive and restore companies",

  // Leadership
  "leader.update": "Create and edit leader profiles",
  "leader.publish": "Publish leader profiles",

  // Recruitment
  "vacancy.read": "View vacancies in the admin",
  "vacancy.update": "Create and edit vacancies",
  "vacancy.publish": "Publish, close and archive vacancies",
  "application.read": "View job applications and download CVs",
  "application.update": "Change application status and add review notes",
  "application.export": "Export applications",
  "application.delete": "Delete applications under the retention policy",

  // Content
  "content.update": "Create and edit news, events, notices, galleries, homepage, FAQs and pages",
  "content.publish": "Approve and publish content",
  "legal.update": "Draft new versions of legal pages",
  "legal.publish": "Publish legal page versions",
  "media.upload": "Upload images and videos",

  // Contact
  "contact.read": "View contact messages",
  "contact.update": "Assign and resolve contact messages",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as PermissionKey[];
const READ_ONLY: PermissionKey[] = ["audit.read", "company.read", "vacancy.read", "application.read", "contact.read"];

export const SYSTEM_ROLES: Record<string, { name: string; description: string; scope: "group" | "company" | "either"; permissions: PermissionKey[] }> = {
  SUPER_ADMIN: {
    name: "Super Administrator",
    description: "Manages the whole platform, users, roles, settings and every company.",
    scope: "group",
    permissions: ALL,
  },
  GROUP_ADMIN: {
    name: "Group Administrator",
    description: "Manages group-wide information, the companies and their users (not administrators).",
    scope: "group",
    // user.manage is limited by highRoleProblem: administrators stay with the Super Administrator.
    permissions: ALL.filter((key) => key !== "role.manage"),
  },
  COMPANY_ADMIN: {
    name: "Company Administrator",
    description: "Manages one company's profile, vacancies, applications and content.",
    scope: "company",
    permissions: [
      "company.read", "company.update", "leader.update",
      "vacancy.read", "vacancy.update", "vacancy.publish",
      "application.read", "application.update", "application.export",
      "content.update", "media.upload", "contact.read", "contact.update",
    ],
  },
  HR_MANAGER: {
    name: "HR Manager",
    description: "Manages vacancies and job applications for assigned companies.",
    scope: "company",
    permissions: [
      "company.read", "vacancy.read", "vacancy.update", "vacancy.publish",
      "application.read", "application.update", "application.export",
    ],
  },
  CONTENT_EDITOR: {
    name: "Content Editor",
    description: "Drafts and edits website content; cannot publish.",
    scope: "either",
    permissions: ["company.read", "leader.update", "content.update", "legal.update", "media.upload"],
  },
  CONTENT_PUBLISHER: {
    name: "Content Publisher",
    description: "Reviews, approves and publishes content.",
    scope: "either",
    permissions: ["company.read", "leader.update", "leader.publish", "content.update", "content.publish", "legal.update", "legal.publish", "media.upload"],
  },
  AUDITOR: {
    name: "Read-only Auditor",
    description: "Views authorized operational and audit information without changing anything.",
    scope: "either",
    permissions: READ_ONLY,
  },
};

export function roleHasPermission(roleKey: string, permission: PermissionKey): boolean {
  return SYSTEM_ROLES[roleKey]?.permissions.includes(permission) ?? false;
}
