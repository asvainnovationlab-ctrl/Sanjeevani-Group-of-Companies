import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  guessMimeType,
  isPlaceholder,
  localMediaKey,
  parseAgeRange,
  parseMonthYear,
  slugify,
  toCompanyCategory,
  toEmploymentType,
} from "../prisma/seed-helpers";

describe("seed helpers", () => {
  it("maps company categories and rejects unknown ones", () => {
    assert.equal(toCompanyCategory("healthcare"), "HEALTHCARE");
    assert.equal(toCompanyCategory(" Agriculture "), "AGRICULTURE");
    assert.throws(() => toCompanyCategory("mining"), /Unknown company category/);
  });

  it("maps employment types, defaulting to full-time", () => {
    assert.equal(toEmploymentType("Full-time"), "FULL_TIME");
    assert.equal(toEmploymentType("part time"), "PART_TIME");
    assert.equal(toEmploymentType("Internship"), "INTERNSHIP");
    assert.equal(toEmploymentType("something else"), "FULL_TIME");
  });

  it("parses age ranges and ignores invalid ones", () => {
    assert.deepEqual(parseAgeRange("18-35 years"), { min: 18, max: 35 });
    assert.deepEqual(parseAgeRange("21 – 40"), { min: 21, max: 40 });
    assert.deepEqual(parseAgeRange(""), { min: null, max: null });
    assert.deepEqual(parseAgeRange("40-20"), { min: null, max: null });
  });

  it("treats [Add …] text and blanks as placeholders", () => {
    assert.equal(isPlaceholder("[Add deadline]"), true);
    assert.equal(isPlaceholder(""), true);
    assert.equal(isPlaceholder(undefined), true);
    assert.equal(isPlaceholder("2026-12-31"), false);
  });

  it("decodes public paths into storage keys", () => {
    assert.equal(localMediaKey("/key%20factor/edu.jpg"), "/key factor/edu.jpg");
    assert.equal(localMediaKey("/hospital.jpg"), "/hospital.jpg");
  });

  it("guesses MIME types from extensions", () => {
    assert.equal(guessMimeType("/a/b.JPG"), "image/jpeg");
    assert.equal(guessMimeType("/a/b.webp"), "image/webp");
    assert.equal(guessMimeType("/a/b.unknown"), "application/octet-stream");
  });

  it("builds URL-safe slugs", () => {
    assert.equal(slugify("Sanjeevani Hospital, Pokhara"), "sanjeevani-hospital-pokhara");
    assert.equal(slugify("Agriculture & Food"), "agriculture-and-food");
  });

  it("parses month-year labels", () => {
    const date = parseMonthYear("November 2026");
    assert.ok(date);
    assert.equal(date!.getFullYear(), 2026);
    assert.equal(date!.getMonth(), 10);
    assert.equal(parseMonthYear("not a date"), null);
  });
});
