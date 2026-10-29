import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changedFields, normalizeLocations, publishProblem, slugChangeProblem, statusTransition } from "../src/server/companies/rules";
import { cleanAltText, cloudinarySignature, imageProblem, IMAGE_MAX_BYTES, sniffImage } from "../src/server/media/rules";
import { companyCreateSchema, companyUpdateSchema, locationsSchema } from "../src/server/validation/company";

const bytes = (...values: number[]) => {
  const out = new Uint8Array(16);
  out.set(values);
  return out;
};
const text = (value: string, length = 16) => {
  const out = new Uint8Array(length);
  out.set([...value].map((c) => c.charCodeAt(0)));
  return out;
};

describe("image sniffing", () => {
  it("recognises real image signatures", () => {
    assert.equal(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))?.mimeType, "image/jpeg");
    assert.equal(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.mimeType, "image/png");
    assert.equal(sniffImage(text("RIFF\0\0\0\0WEBPVP8 "))?.mimeType, "image/webp");
    assert.equal(sniffImage(text("GIF89a"))?.mimeType, "image/gif");
    assert.equal(sniffImage(text("\0\0\0\x1cftypavif"))?.mimeType, "image/avif");
  });
  it("refuses SVG, HTML, PDF and renamed files", () => {
    assert.equal(sniffImage(text('<svg xmlns="http://www.w3.org/2000/svg">', 48)), null);
    assert.equal(sniffImage(text("<!doctype html><script>", 32)), null);
    assert.equal(sniffImage(text("%PDF-1.7")), null);
    assert.equal(sniffImage(text("MZ executable")), null);
  });
  it("enforces size limits", () => {
    assert.ok(imageProblem(new Uint8Array(0)));
    const big = new Uint8Array(IMAGE_MAX_BYTES + 1);
    big.set([0xff, 0xd8, 0xff]);
    assert.match(imageProblem(big) ?? "", /5 MB/);
    assert.equal(imageProblem(bytes(0xff, 0xd8, 0xff)), null);
  });
  it("cleans alt text", () => {
    assert.equal(cleanAltText("  Hospital   entrance \n at dawn "), "Hospital entrance at dawn");
    assert.equal(cleanAltText("   "), null);
    assert.equal(cleanAltText("x".repeat(400))?.length, 250);
  });
});

describe("cloudinary signature", () => {
  it("matches Cloudinary's documented example", () => {
    // From Cloudinary's "Generating authentication signatures" documentation.
    const signature = cloudinarySignature(
      { eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510, api_key: "ignored", file: "ignored" },
      "abcd",
    );
    assert.equal(signature, "bfd09f95f331f558cbd1320e67aa8d488770583e");
  });
});

describe("company status workflow", () => {
  const now = new Date("2026-10-29T00:00:00Z");
  it("publishes drafts and stamps publishedAt", () => {
    assert.deepEqual(statusTransition("DRAFT", "publish", now), { status: "PUBLISHED", publishedAt: now, archivedAt: null });
  });
  it("refuses impossible transitions", () => {
    assert.equal(typeof statusTransition("PUBLISHED", "publish", now), "string");
    assert.equal(typeof statusTransition("ARCHIVED", "publish", now), "string");
    assert.equal(typeof statusTransition("DRAFT", "unpublish", now), "string");
    assert.equal(typeof statusTransition("DRAFT", "restore", now), "string");
  });
  it("archives and restores to draft (never straight back to live)", () => {
    assert.deepEqual(statusTransition("PUBLISHED", "archive", now), { status: "ARCHIVED", archivedAt: now });
    assert.deepEqual(statusTransition("ARCHIVED", "restore", now), { status: "DRAFT", archivedAt: null });
  });
  it("requires content before publishing", () => {
    assert.ok(publishProblem({ name: "Om Agro", sectorLabel: "Agriculture", description: "Short" }));
    assert.equal(publishProblem({ name: "Om Agro", sectorLabel: "Agriculture", description: "Agricultural products from Nepal." }), null);
  });
  it("blocks slug changes on live companies only", () => {
    assert.ok(slugChangeProblem("PUBLISHED", "om-agro", "om-agro-nepal"));
    assert.equal(slugChangeProblem("PUBLISHED", "om-agro", "om-agro"), null);
    assert.equal(slugChangeProblem("DRAFT", "om-agro", "om-agro-nepal"), null);
  });
  it("keeps exactly one primary location", () => {
    const primaries = (list: { name: string; isPrimary?: boolean }[]) => normalizeLocations(list).map((l) => l.isPrimary);
    assert.deepEqual(primaries([{ name: "a" }, { name: "b" }]), [true, false]);
    assert.deepEqual(primaries([{ name: "a", isPrimary: true }, { name: "b", isPrimary: true }]), [true, false]);
    assert.deepEqual(primaries([{ name: "a" }, { name: "b", isPrimary: true }]), [false, true]);
  });
  it("lists changed fields only", () => {
    assert.deepEqual(changedFields({ name: "A", phone: null, featured: false }, { name: "A", phone: "061", featured: undefined }), ["phone"]);
  });
});

describe("company validation", () => {
  const valid = { name: "Om Agro", category: "AGRICULTURE", sectorLabel: "Agriculture", description: "" };
  it("normalises websites, emails and empty values", () => {
    const parsed = companyCreateSchema.parse({ ...valid, website: "omagro.com.np", email: " Info@OmAgro.com.np ", phone: "" });
    assert.equal(parsed.website, "https://omagro.com.np/");
    assert.equal(parsed.email, "info@omagro.com.np");
    assert.equal(parsed.phone, null);
  });
  it("rejects bad input", () => {
    assert.equal(companyCreateSchema.safeParse({ ...valid, website: "javascript:alert(1)" }).success, false);
    assert.equal(companyCreateSchema.safeParse({ ...valid, slug: "Om Agro!" }).success, false);
    assert.equal(companyCreateSchema.safeParse({ ...valid, establishedYear: 1700 }).success, false);
    assert.equal(companyCreateSchema.safeParse({ ...valid, category: "BANKING" }).success, false);
    assert.equal(companyUpdateSchema.safeParse({ status: "PUBLISHED" }).success, false); // status only via the workflow
  });
  it("accepts partial updates", () => {
    assert.deepEqual(companyUpdateSchema.parse({ phone: "+977 61-123456" }), { phone: "+977 61-123456" });
  });
  it("validates locations", () => {
    assert.equal(locationsSchema.safeParse({ locations: [{ name: "Main campus", latitude: 28.2, longitude: 83.98 }] }).success, true);
    assert.equal(locationsSchema.safeParse({ locations: [{ name: "Main campus", latitude: 120 }] }).success, false);
  });
});
