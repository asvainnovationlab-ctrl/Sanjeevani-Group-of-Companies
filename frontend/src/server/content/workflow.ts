// Pure editorial workflow shared by every content type (no I/O).
//
//   DRAFT ──submit──▶ PENDING_REVIEW ──approve──▶ APPROVED
//     │                    │  ╰──reject──▶ DRAFT       │
//     ╰──────────────── publish ◀───────────────────────╯
//   PUBLISHED ──unpublish──▶ DRAFT;  any ──archive──▶ ARCHIVED ──restore──▶ DRAFT
//
// Editors (content.update) may submit; publishers (content.publish) may
// approve, reject, publish, unpublish, archive and restore.

export type PublishStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";
export type WorkflowAction = "submit" | "approve" | "reject" | "publish" | "unpublish" | "archive" | "restore";

export const WORKFLOW_ACTIONS: WorkflowAction[] = ["submit", "approve", "reject", "publish", "unpublish", "archive", "restore"];

export function needsPublishRight(action: WorkflowAction): boolean {
  return action !== "submit";
}

type Change = { status: PublishStatus; publishedAt?: Date | null; approve?: boolean };

const ALLOWED: Record<WorkflowAction, PublishStatus[]> = {
  submit: ["DRAFT"],
  approve: ["PENDING_REVIEW"],
  reject: ["PENDING_REVIEW", "APPROVED"],
  publish: ["DRAFT", "PENDING_REVIEW", "APPROVED"],
  unpublish: ["PUBLISHED"],
  archive: ["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED"],
  restore: ["ARCHIVED"],
};

const TARGET: Record<WorkflowAction, PublishStatus> = {
  submit: "PENDING_REVIEW",
  approve: "APPROVED",
  reject: "DRAFT",
  publish: "PUBLISHED",
  unpublish: "DRAFT",
  archive: "ARCHIVED",
  restore: "DRAFT",
};

export function workflowTransition(current: PublishStatus, action: WorkflowAction, now = new Date()): Change | string {
  if (!ALLOWED[action].includes(current)) {
    return `Cannot ${action} an item that is ${current.toLowerCase().replace("_", " ")}.`;
  }
  const status = TARGET[action];
  if (action === "publish") return { status, publishedAt: now, approve: true };
  if (action === "approve") return { status, approve: true };
  return { status };
}

// Editing published content would change the live site without review, so
// a publisher's edit keeps it live but an editor's edit is refused: they must
// ask a publisher to unpublish first.
export function editProblem(status: PublishStatus, canPublish: boolean): string | null {
  if (status === "PUBLISHED" && !canPublish) return "This item is live. Ask a publisher to unpublish it before editing.";
  if (status === "ARCHIVED") return "Restore this item before editing it.";
  return null;
}

// Anything can be deleted (a wrong upload should go, not linger as archived).
// Only publishers may delete, every delete is audited, and the item's earlier
// versions stay in ContentRevision. Kept as a hook for future rules.
export function deleteProblem(_status: PublishStatus, _everPublished: boolean): string | null {
  return null;
}
