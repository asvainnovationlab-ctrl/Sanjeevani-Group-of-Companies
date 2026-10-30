import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contactFormSchema, contactUpdateSchema } from "../src/server/contact/service";
import { renderEmail } from "../src/server/email/templates";
import { settingsUpdateSchema } from "../src/server/settings/service";

describe("contact form", () => {
  const valid = { name: "Sita Gurung", email: "Sita@Example.com", message: "I would like to know about nursing vacancies." };
  it("accepts and normalises a normal enquiry", () => {
    const parsed = contactFormSchema.parse({ ...valid, phone: "" });
    assert.equal(parsed.email, "sita@example.com");
    assert.equal(parsed.phone, null);
  });
  it("rejects short or malformed messages with readable errors", () => {
    assert.equal(contactFormSchema.safeParse({ ...valid, message: "hi" }).error?.issues[0].message, "Write a message of at least 10 characters.");
    assert.equal(contactFormSchema.safeParse({ ...valid, email: "nope" }).error?.issues[0].message, "Enter a valid email address.");
    assert.equal(contactFormSchema.safeParse({ ...valid, phone: "call me" }).success, false);
  });
  it("needs something to update", () => {
    assert.equal(contactUpdateSchema.safeParse({}).success, false);
    assert.equal(contactUpdateSchema.safeParse({ status: "RESOLVED" }).success, true);
  });
  it("keeps the message out of the notification email", () => {
    const { text } = renderEmail("contact-new", { name: "Sita", subject: "", companyName: "Sanjeevani Group", submittedAt: "30 October 2026", link: "https://example.com/admin" });
    assert.ok(text.includes("only available in the admin"));
    assert.ok(text.includes("(none)"));
  });
});

describe("site settings", () => {
  it("accepts known keys with valid values, and null to remove", () => {
    assert.equal(settingsUpdateSchema.safeParse({ "contact.email": "info@sanjeevanigroup.com", "social.facebook": "https://facebook.com/x", "careers.applicationsOpen": true, "seo.defaultTitle": null }).success, true);
  });
  it("rejects unknown keys and bad values", () => {
    assert.equal(settingsUpdateSchema.safeParse({ "admin.password": "x" }).success, false);
    assert.equal(settingsUpdateSchema.safeParse({ "social.facebook": "http://facebook.com/x" }).success, false);
    assert.equal(settingsUpdateSchema.safeParse({ "contact.email": "not-an-email" }).success, false);
    assert.equal(settingsUpdateSchema.safeParse({ "careers.applicationsOpen": "yes" }).success, false);
  });
});

describe("email provider choice", () => {
  // Imported lazily so the SMTP client is only loaded by this test.
  const pick = async (env: Record<string, string>) => (await import("../src/server/email/sender")).emailProvider(env as NodeJS.ProcessEnv);
  it("prefers SMTP (Gmail) when its credentials are set", async () => {
    assert.equal(await pick({ SMTP_USER: "a@gmail.com", SMTP_PASS: "x", RESEND_API_KEY: "re_x", EMAIL_FROM: "a@b.c" }), "smtp");
  });
  it("falls back to Resend, or nothing", async () => {
    assert.equal(await pick({ RESEND_API_KEY: "re_x", EMAIL_FROM: "a@b.c" }), "resend");
    assert.equal(await pick({}), null);
  });
  it("EMAIL_PROVIDER forces a choice only when that provider is configured", async () => {
    assert.equal(await pick({ EMAIL_PROVIDER: "resend", SMTP_USER: "a", SMTP_PASS: "b", RESEND_API_KEY: "re_x", EMAIL_FROM: "a@b.c" }), "resend");
    assert.equal(await pick({ EMAIL_PROVIDER: "smtp", RESEND_API_KEY: "re_x", EMAIL_FROM: "a@b.c" }), null);
  });
});
