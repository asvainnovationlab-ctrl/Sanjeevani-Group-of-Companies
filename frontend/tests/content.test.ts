import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blocksSchema, isSafeHref } from "../src/server/content/blocks";
import { legalKind, legalVersionSchema } from "../src/server/content/legal";
import { CONTENT_TYPES, contentType, toPublic } from "../src/server/content/types";
import { deleteProblem, editProblem, workflowTransition } from "../src/server/content/workflow";

describe("editorial workflow", () => {
  const now = new Date("2026-10-29T00:00:00Z");
  it("goes draft → review → approved → published", () => {
    assert.deepEqual(workflowTransition("DRAFT", "submit", now), { status: "PENDING_REVIEW" });
    assert.deepEqual(workflowTransition("PENDING_REVIEW", "approve", now), { status: "APPROVED", approve: true });
    assert.deepEqual(workflowTransition("APPROVED", "publish", now), { status: "PUBLISHED", publishedAt: now, approve: true });
  });
  it("lets publishers reject, unpublish, archive and restore", () => {
    assert.deepEqual(workflowTransition("PENDING_REVIEW", "reject", now), { status: "DRAFT" });
    assert.deepEqual(workflowTransition("PUBLISHED", "unpublish", now), { status: "DRAFT" });
    assert.deepEqual(workflowTransition("PUBLISHED", "archive", now), { status: "ARCHIVED" });
    assert.deepEqual(workflowTransition("ARCHIVED", "restore", now), { status: "DRAFT" });
  });
  it("refuses impossible moves", () => {
    for (const [from, action] of [["PUBLISHED", "submit"], ["DRAFT", "approve"], ["ARCHIVED", "publish"], ["DRAFT", "unpublish"]] as const) {
      assert.equal(typeof workflowTransition(from, action, now), "string", `${from} ${action}`);
    }
  });
  it("protects live and archived content from edits", () => {
    assert.ok(editProblem("PUBLISHED", false));
    assert.equal(editProblem("PUBLISHED", true), null);
    assert.ok(editProblem("ARCHIVED", true));
    assert.equal(editProblem("DRAFT", false), null);
  });
  it("lets publishers delete content in any state", () => {
    for (const status of ["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"] as const) {
      assert.equal(deleteProblem(status, true), null, status);
    }
  });
});

describe("rich text blocks", () => {
  it("accepts structured text", () => {
    const result = blocksSchema.safeParse([
      { type: "heading", text: "Our new wing" },
      { type: "paragraph", text: "<script>alert(1)</script> is stored as plain text, never HTML." },
      { type: "list", items: ["Beds", "ICU"] },
      { type: "link", text: "Careers", href: "/careers" },
    ]);
    assert.equal(result.success, true);
  });
  it("rejects unknown block types and unsafe links", () => {
    assert.equal(blocksSchema.safeParse([{ type: "html", html: "<b>x</b>" }]).success, false);
    assert.equal(blocksSchema.safeParse([{ type: "link", text: "x", href: "javascript:alert(1)" }]).success, false);
    assert.equal(isSafeHref("//evil.example"), false);
    assert.equal(isSafeHref("data:text/html,x"), false);
    assert.equal(isSafeHref("https://sanjeevani.com.np"), true);
  });
});

describe("content registry", () => {
  it("resolves known types only", () => {
    assert.ok(contentType("faqs"));
    assert.equal(contentType("users"), null);
    assert.equal(contentType("__proto__"), null);
    assert.equal(contentType("toString"), null);
  });
  it("requires the essentials and refuses unknown fields such as status", () => {
    const faq = CONTENT_TYPES.faqs;
    assert.equal(faq.createSchema.safeParse({ question: "How do I apply?", answer: "Use the form on each vacancy." }).success, true);
    assert.equal(faq.createSchema.safeParse({ question: "How do I apply?" }).success, false);
    assert.equal(faq.createSchema.safeParse({ question: "How do I apply?", answer: "Use the form.", status: "PUBLISHED" }).success, false);
    assert.equal(faq.updateSchema.safeParse({ answer: "Updated answer text." }).success, true);
  });
  it("only accepts YouTube links for videos", () => {
    const v = CONTENT_TYPES.videos.createSchema;
    assert.equal(v.safeParse({ title: "Hospital tour", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", placement: "GALLERY" }).success, true);
    assert.equal(v.safeParse({ title: "Hospital tour", url: "https://evil.example/video", placement: "GALLERY" }).success, false);
  });
  it("works out which companies own a leader", () => {
    const owners = CONTENT_TYPES.leaders.owners;
    assert.deepEqual(owners({ id: "1", isChairman: true, assignments: [{ companyId: "c1" }] }), [null]);
    assert.deepEqual(owners({ id: "1", assignments: [{ companyId: "c1" }, { companyId: "c1" }, { companyId: "c2" }] }), ["c1", "c2"]);
    assert.deepEqual(owners({ id: "1", assignments: [] }), [null]);
  });
  it("replaces nested lists on update", () => {
    const data = CONTENT_TYPES.leaders.toData({ name: "A", career: [{ period: "2020", position: "MD", organisation: "X" }] }, "update");
    assert.deepEqual(data.career, { deleteMany: {}, create: [{ period: "2020", position: "MD", organisation: "X", sortOrder: 0 }] });
    assert.equal(data.education, undefined);
  });
  it("hides internal fields from the public", () => {
    const view = toPublic({ id: "1", title: "T", status: "PUBLISHED", createdById: "u", approvedById: "u", authorId: "u", publishedAt: null });
    assert.deepEqual(Object.keys(view).sort(), ["id", "publishedAt", "title"]);
  });
});

describe("legal documents", () => {
  it("maps URL slugs to kinds", () => {
    assert.equal(legalKind("privacy-policy"), "PRIVACY_POLICY");
    assert.equal(legalKind("terms-of-use"), "TERMS_OF_USE");
    assert.equal(legalKind("cookies"), null);
  });
  it("validates versions", () => {
    const good = { title: "Privacy Policy", intro: "How we use data.", lead: "We respect your privacy.", clauses: [{ title: "Data we collect", body: ["Name and email."] }] };
    assert.equal(legalVersionSchema.safeParse(good).success, true);
    assert.equal(legalVersionSchema.safeParse({ ...good, clauses: [] }).success, false);
    assert.equal(legalVersionSchema.safeParse({ ...good, status: "PUBLISHED" }).success, false);
  });
});
