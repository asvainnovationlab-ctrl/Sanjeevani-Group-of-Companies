import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cvProblem, safeFileName, sniffCv } from "../src/server/documents/rules";
import { escapeHtml, renderEmail } from "../src/server/email/templates";
import { retryDelayMs } from "../src/server/email/sender";
import {
  ageProblem,
  applicationTransitionProblem,
  csvCell,
  isAcceptingApplications,
  nextApplicationReference,
  nextVacancyCode,
  toCsv,
  vacancyPublishProblem,
  vacancyTransition,
} from "../src/server/recruitment/rules";
import { endOfKathmanduDay, formatKathmandu, kathmanduDate, kathmanduDateToInstant } from "../src/server/time";
import { applicationFormSchema, vacancyCreateSchema } from "../src/server/validation/recruitment";

const pad = (header: number[] | string, extra = "", length = 64) => {
  const head = typeof header === "string" ? [...header].map((c) => c.charCodeAt(0)) : header;
  const out = new Uint8Array(length);
  out.set([...head, ...[...extra].map((c) => c.charCodeAt(0))]);
  return out;
};

describe("Nepal time", () => {
  it("uses UTC+05:45 calendar days", () => {
    // 18:30 UTC on 30 Nov is 00:15 on 1 Dec in Kathmandu.
    assert.deepEqual(kathmanduDate(new Date("2026-11-30T18:30:00Z")), { year: 2026, month: 12, day: 1 });
    assert.deepEqual(kathmanduDate(new Date("2026-11-30T18:00:00Z")), { year: 2026, month: 11, day: 30 });
  });
  it("deadline dates run to the end of the Nepal day", () => {
    const deadline = kathmanduDateToInstant("2026-11-30");
    assert.equal(deadline.toISOString(), "2026-11-29T18:15:00.000Z");
    assert.equal(endOfKathmanduDay(deadline).toISOString(), "2026-11-30T18:14:59.999Z");
  });
  it("formats in Nepal time", () => {
    assert.equal(formatKathmandu(new Date("2026-11-29T18:15:00Z")), "30 November 2026");
  });
});

describe("vacancy rules", () => {
  const deadline = kathmanduDateToInstant("2026-11-30");
  const open = { status: "PUBLISHED" as const, publishAt: null, closeAt: null, deadline };
  it("accepts applications until the end of the deadline day", () => {
    assert.equal(isAcceptingApplications(open, new Date("2026-11-30T18:00:00Z")), true); // 23:45 Nepal
    assert.equal(isAcceptingApplications(open, new Date("2026-11-30T18:20:00Z")), false); // 00:05 next day
  });
  it("respects status, scheduling and closeAt", () => {
    const now = new Date("2026-11-01T00:00:00Z");
    assert.equal(isAcceptingApplications({ ...open, status: "DRAFT" }, now), false);
    assert.equal(isAcceptingApplications({ ...open, publishAt: new Date("2026-11-02T00:00:00Z") }, now), false);
    assert.equal(isAcceptingApplications({ ...open, closeAt: new Date("2026-10-31T00:00:00Z") }, now), false);
    assert.equal(isAcceptingApplications({ ...open, deadline: null }, now), true);
  });
  it("moves through the vacancy workflow", () => {
    assert.equal((vacancyTransition("DRAFT", "publish") as { status: string }).status, "PUBLISHED");
    assert.equal((vacancyTransition("CLOSED", "publish") as { status: string }).status, "PUBLISHED");
    assert.equal(typeof vacancyTransition("DRAFT", "close"), "string");
    assert.equal(typeof vacancyTransition("ARCHIVED", "publish"), "string");
    assert.equal((vacancyTransition("ARCHIVED", "restore") as { status: string }).status, "DRAFT");
  });
  it("checks a vacancy is complete before publishing", () => {
    const good = {
      title: "Staff Nurse", summary: "Provide safe, compassionate nursing care.", requiredEducation: "PCL Nursing", requiredExperience: "1 year",
      responsibilities: ["Patient care"], minAge: 20, maxAge: 40, salaryMin: 30000, salaryMax: 45000, salaryDisclosed: true, deadline, openings: 2,
    };
    const now = new Date("2026-11-01T00:00:00Z");
    assert.equal(vacancyPublishProblem(good, now), null);
    assert.ok(vacancyPublishProblem({ ...good, responsibilities: [] }, now));
    assert.ok(vacancyPublishProblem({ ...good, minAge: 50 }, now));
    assert.ok(vacancyPublishProblem({ ...good, salaryMin: 90000 }, now));
    assert.ok(vacancyPublishProblem({ ...good, salaryMin: null, salaryMax: null }, now));
    assert.ok(vacancyPublishProblem(good, new Date("2026-12-05T00:00:00Z")));
  });
  it("checks applicant age against the vacancy", () => {
    assert.match(ageProblem(18, { minAge: 20, maxAge: 40 }) ?? "", /at least 20/);
    assert.match(ageProblem(45, { minAge: 20, maxAge: 40 }) ?? "", /40 years old or younger/);
    assert.equal(ageProblem(30, { minAge: 20, maxAge: 40 }), null);
    assert.equal(ageProblem(70, { minAge: null, maxAge: null }), null);
  });
  it("numbers vacancies and applications sequentially", () => {
    assert.equal(nextVacancyCode(null), "SG-V-0001");
    assert.equal(nextVacancyCode("SG-V-0041"), "SG-V-0042");
    assert.equal(nextApplicationReference(2026, null), "SG-2026-000001");
    assert.equal(nextApplicationReference(2026, "SG-2026-000123"), "SG-2026-000124");
    assert.equal(nextApplicationReference(2027, "SG-2026-000123"), "SG-2027-000001");
  });
});

describe("application workflow", () => {
  it("allows the normal review path", () => {
    assert.equal(applicationTransitionProblem("SUBMITTED", "UNDER_REVIEW"), null);
    assert.equal(applicationTransitionProblem("SHORTLISTED", "INTERVIEW"), null);
    assert.equal(applicationTransitionProblem("INTERVIEW", "OFFERED"), null);
    assert.equal(applicationTransitionProblem("REJECTED", "UNDER_REVIEW"), null);
  });
  it("refuses skipping steps and changing withdrawn applications", () => {
    assert.ok(applicationTransitionProblem("SUBMITTED", "OFFERED"));
    assert.ok(applicationTransitionProblem("WITHDRAWN", "UNDER_REVIEW"));
    assert.ok(applicationTransitionProblem("SUBMITTED", "SUBMITTED"));
  });
});

describe("CV files", () => {
  it("accepts real documents", () => {
    assert.equal(sniffCv(pad("%PDF-1.7"), "cv.pdf")?.mimeType, "application/pdf");
    assert.equal(sniffCv(pad([0x50, 0x4b, 0x03, 0x04], "....word/document.xml"), "CV.DOCX")?.extension, "docx");
    assert.equal(sniffCv(pad([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), "cv.doc")?.mimeType, "application/msword");
    assert.equal(sniffCv(pad([0xff, 0xd8, 0xff, 0xe0]), "scan.jpeg")?.extension, "jpg");
  });
  it("refuses renamed or disguised files", () => {
    assert.equal(sniffCv(pad("%PDF-1.7"), "cv.docx"), null);
    assert.equal(sniffCv(pad([0x50, 0x4b, 0x03, 0x04], "....other.bin"), "cv.docx"), null); // a zip that is not Word
    assert.equal(sniffCv(pad("<html><script>"), "cv.pdf"), null);
    assert.match(cvProblem(pad("MZ"), "cv.exe") ?? "", /PDF, Word or image/);
    assert.match(cvProblem(new Uint8Array(5 * 1024 * 1024 + 1), "cv.pdf") ?? "", /5 MB/);
  });
  it("makes file names safe for download headers", () => {
    assert.equal(safeFileName("../../etc/passwd", "pdf"), "document.pdf");
    assert.equal(safeFileName('C:\\Users\\Ram\\My "CV".pdf', "pdf"), "My _CV_.pdf");
    assert.equal(safeFileName("राम CV.pdf", "pdf"), "_ CV.pdf");
  });
});

describe("CSV export", () => {
  it("neutralises spreadsheet formulas and quotes", () => {
    assert.equal(csvCell('=HYPERLINK("http://x")'), `"'=HYPERLINK(""http://x"")"`);
    assert.equal(csvCell("-2+3"), `"'-2+3"`);
    assert.equal(csvCell("Ram Sharma"), `"Ram Sharma"`);
    assert.equal(csvCell(null), `""`);
    assert.equal(toCsv(["a", "b"], [[1, "x"]]), `"a","b"\r\n"1","x"\r\n`);
  });
});

describe("emails", () => {
  it("escapes everything from the payload", () => {
    assert.equal(escapeHtml(`<img src=x onerror="alert(1)">`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    const { html, text } = renderEmail("application-received", { name: "<b>Ram</b>", vacancyTitle: "Nurse", companyName: "Hospital", referenceNumber: "SG-2026-000001", submittedAt: "1 Nov" });
    assert.ok(!html.includes("<b>Ram</b>"));
    assert.ok(html.includes("&lt;b&gt;Ram&lt;/b&gt;"));
    assert.ok(text.includes("SG-2026-000001"));
  });
  it("drops non-http links", () => {
    const { html } = renderEmail("password-reset", { name: "Ram", link: "javascript:alert(1)" });
    assert.ok(!html.includes("javascript:"));
  });
  it("keeps CV details out of the HR email", () => {
    const { text } = renderEmail("application-new", { name: "Ram", vacancyTitle: "Nurse", companyName: "H", referenceNumber: "R", submittedAt: "S", link: "https://example.com/admin" });
    assert.ok(text.includes("only available in the admin"));
  });
  it("backs off between retries", () => {
    assert.deepEqual([1, 2, 3, 10].map((n) => retryDelayMs(n) / 60000), [1, 2, 4, 60]);
  });
});

describe("validation", () => {
  const form = {
    vacancyId: "staff-nurse-pokhara", fullName: "Sita Gurung", email: "Sita@Example.com", phone: "9812345678", age: "26", address: "Pokhara",
    education: "Bachelor's degree", experienceYears: "2.5", consent: "yes",
  };
  it("parses the existing application form fields", () => {
    const parsed = applicationFormSchema.safeParse(form);
    if (!parsed.success) assert.fail(parsed.error.issues[0].message);
    assert.equal(parsed.data.email, "sita@example.com");
    assert.equal(parsed.data.age, 26);
    assert.equal(parsed.data.gender, null);
  });
  it("rejects bad form input with readable messages", () => {
    assert.equal(applicationFormSchema.safeParse({ ...form, age: "12" }).error?.issues[0].message, "Enter your age (16 to 80).");
    assert.equal(applicationFormSchema.safeParse({ ...form, consent: undefined }).error?.issues[0].message, "Please confirm that your details are correct.");
    assert.equal(applicationFormSchema.safeParse({ ...form, education: "PhD in hacking" }).success, false);
  });
  it("checks vacancy ranges", () => {
    const base = { companyId: "11111111-1111-1111-1111-111111111111", title: "Staff Nurse", locationText: "Pokhara" };
    assert.equal(vacancyCreateSchema.safeParse(base).success, true);
    assert.equal(vacancyCreateSchema.safeParse({ ...base, minAge: 40, maxAge: 20 }).success, false);
    assert.equal(vacancyCreateSchema.safeParse({ ...base, deadline: "30/11/2026" }).success, false);
  });
});
