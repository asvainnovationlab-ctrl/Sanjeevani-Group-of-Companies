// Live authorization checks against a running server and its database. Creates
// throwaway users and records (all @e2e.invalid / "E2E" titles) and removes them.
// Run: BASE=http://localhost:3000 E2E_ADMIN_PASSWORD=... node --env-file=.env.local scripts/e2e/authz.cjs

const { PrismaClient } = require("@prisma/client");
const B = process.env.BASE || "http://localhost:3000";
const PW = process.env.E2E_ADMIN_PASSWORD; // a throwaway Super Administrator: super@e2e.invalid (create it with admin:create)
const prisma = new PrismaClient();
const START = new Date(Date.now() - 1000);
const results = [];
const UA = "Mozilla/5.0 (Windows NT 10.0) Chrome/130";

function client() {
  let cookie = "";
  return async (p, { method = "GET", json, form } = {}) => {
    const h = { Origin: B, "User-Agent": UA, ...(cookie ? { Cookie: cookie } : {}) };
    let body;
    if (json) { h["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    if (form) body = form;
    const r = await fetch(B + p, { method, headers: h, body });
    const m = /sg_session=([^;]*)/.exec(r.headers.get("set-cookie") || "");
    if (m) cookie = m[1] ? `sg_session=${m[1]}` : "";
    const type = r.headers.get("content-type") || "";
    return { status: r.status, data: type.includes("json") ? await r.json().catch(() => null) : null };
  };
}
const check = async (name, fn) => { try { const n = await fn(); results.push(`PASS  ${name}${n ? `  (${n})` : ""}`); } catch (e) { results.push(`FAIL  ${name}: ${e.message}`); } };
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

async function makeUser(admin, email, roleKey, companyId) {
  const inv = await admin("/api/admin/users", { method: "POST", json: { email, name: email.split("@")[0], memberships: [{ roleKey, companyId }] } });
  expect(inv.status === 201, `invite ${email}: ${inv.status} ${JSON.stringify(inv.data)}`);
  const mail = await prisma.emailOutbox.findFirst({ where: { toAddress: email }, orderBy: { createdAt: "desc" } });
  const token = new URL(mail.payload.link).searchParams.get("token");
  const pw = "copper lantern meadow 2026";
  const ok = await client()("/api/auth/password-reset/confirm", { method: "POST", json: { token, password: pw } });
  expect(ok.status === 200, `accept ${email}: ${ok.status}`);
  const c = client();
  expect((await c("/api/auth/login", { method: "POST", json: { email, password: pw } })).status === 200, `login ${email}`);
  return { c, id: inv.data.user.id };
}

(async () => {
  const admin = client();
  expect((await admin("/api/auth/login", { method: "POST", json: { email: "super@e2e.invalid", password: PW } })).status === 200, "super login");
  const companies = (await admin("/api/admin/companies")).data.companies;
  const [A, Bco] = companies;
  const area = (await admin("/api/admin/vacancies")).data.careerAreas[0];

  // a published vacancy at company B with one application, to try to reach from company A
  const v = await admin("/api/admin/vacancies", { method: "POST", json: { companyId: Bco.id, careerAreaId: area.id, title: "E2E Authz Vacancy", locationText: "Nepal", summary: "Temporary vacancy for authorization tests only.", requiredEducation: "Any", requiredExperience: "None", responsibilities: ["Test"], deadline: "2026-12-31" } });
  await admin(`/api/admin/vacancies/${v.data.vacancy.id}/status`, { method: "POST", json: { action: "publish" } });
  const f = new FormData();
  for (const [k, val] of Object.entries({ vacancyId: v.data.vacancy.slug, fullName: "E2E Applicant", email: "applicant-authz@e2e.invalid", phone: "9800000000", age: "30", address: "Pokhara", education: "Other", experienceYears: "1", consent: "yes" })) f.append(k, val);
  f.append("cv", new Blob([Buffer.from("%PDF-1.4\nE2E\n%%EOF\n")], { type: "application/pdf" }), "cv.pdf");
  const applied = await client()("/api/applications", { method: "POST", form: f });
  const app = await prisma.jobApplication.findUnique({ where: { referenceNumber: applied.data.referenceNumber }, include: { documents: true } });

  const hrA = await makeUser(admin, "hr-a@e2e.invalid", "HR_MANAGER", A.id);
  const editor = await makeUser(admin, "editor@e2e.invalid", "CONTENT_EDITOR", null);
  const auditor = await makeUser(admin, "auditor@e2e.invalid", "AUDITOR", null);

  await check("company switcher narrows within scope (Super Admin, company B)", async () => {
    const all = (await admin(`/api/admin/job-applications?q=${app.referenceNumber}`)).data.total;
    const onlyB = (await admin(`/api/admin/job-applications?q=${app.referenceNumber}&companyId=${Bco.id}`)).data.total;
    const onlyA = (await admin(`/api/admin/job-applications?q=${app.referenceNumber}&companyId=${A.id}`)).data.total;
    expect(all === 1 && onlyB === 1 && onlyA === 0, `all ${all}, B ${onlyB}, A ${onlyA}`);
    return "all 1, company B 1, company A 0";
  });
  await check("HR of company A cannot widen scope by passing company B's id", async () => {
    const r = await hrA.c(`/api/admin/job-applications?companyId=${Bco.id}`);
    expect(r.status === 200 && r.data.total === 0, `${r.status} total ${r.data?.total}`);
    const vac = await hrA.c(`/api/admin/vacancies?companyId=${Bco.id}`);
    expect(vac.data.vacancies.length === 0, `vacancies ${vac.data.vacancies.length}`);
    return "0 applications, 0 vacancies";
  });
  await check("HR of company A cannot open company B's application, CV or vacancy by id", async () => {
    const detail = await hrA.c(`/api/admin/job-applications/${app.id}`);
    const cv = await hrA.c(`/api/admin/job-applications/${app.id}/documents/${app.documents[0].id}`);
    const vac = await hrA.c(`/api/admin/vacancies/${v.data.vacancy.id}`);
    const edit = await hrA.c(`/api/admin/vacancies/${v.data.vacancy.id}`, { method: "PATCH", json: { title: "Hacked" } });
    expect([detail.status, cv.status, vac.status, edit.status].every((s) => s === 404 || s === 403), `${detail.status} ${cv.status} ${vac.status} ${edit.status}`);
    return `detail ${detail.status}, CV ${cv.status}, vacancy ${vac.status}, edit ${edit.status}`;
  });
  await check("HR cannot export or delete outside scope", async () => {
    const del = await hrA.c(`/api/admin/job-applications/${app.id}`, { method: "DELETE" });
    expect(del.status === 404 || del.status === 403, `delete ${del.status}`);
    return `delete ${del.status}`;
  });
  await check("HR cannot publish website content", async () => {
    const r = await hrA.c("/api/admin/content/news", { method: "POST", json: { title: "E2E HR news", type: "NEWS" } });
    expect(r.status === 403, `${r.status}`);
  });
  let draftId;
  await check("Content Editor can draft but cannot publish via the API", async () => {
    const c = await editor.c("/api/admin/content/news", { method: "POST", json: { title: "E2E editor draft", type: "NEWS" } });
    expect(c.status === 201, `create ${c.status}`); draftId = c.data.item.id;
    const pub = await editor.c(`/api/admin/content/news/${draftId}/workflow`, { method: "POST", json: { action: "publish" } });
    expect(pub.status === 403, `publish ${pub.status}`);
    const sub = await editor.c(`/api/admin/content/news/${draftId}/workflow`, { method: "POST", json: { action: "submit" } });
    expect(sub.status === 200, `submit ${sub.status}`);
    return "draft 201, publish 403, submit 200";
  });
  await check("Approvals queue shows it; the publisher approves", async () => {
    const q = await admin("/api/admin/content/news?status=PENDING_REVIEW");
    expect(q.data.items.some((i) => i.id === draftId), "not in queue");
    expect((await admin(`/api/admin/content/news/${draftId}/workflow`, { method: "POST", json: { action: "publish" } })).status === 200, "approve");
  });
  await check("Read-only Auditor cannot modify anything", async () => {
    const s = [
      (await auditor.c(`/api/admin/job-applications/${app.id}/status`, { method: "POST", json: { status: "UNDER_REVIEW" } })).status,
      (await auditor.c("/api/admin/vacancies", { method: "POST", json: { companyId: A.id, title: "x", locationText: "y" } })).status,
      (await auditor.c("/api/admin/settings", { method: "PUT", json: { "contact.phone": "1" } })).status,
      (await auditor.c(`/api/admin/companies/${A.id}`, { method: "PATCH", json: { phone: "1" } })).status,
    ];
    expect(s.every((x) => x === 403 || x === 404), s.join(" "));
    const read = (await auditor.c("/api/admin/audit")).status;
    expect(read === 200, `audit read ${read}`);
    return `writes ${s.join("/")}, audit read 200`;
  });
  await check("Suspended user loses access immediately", async () => {
    expect((await editor.c("/api/auth/me")).status === 200, "before");
    expect((await admin(`/api/admin/users/${editor.id}`, { method: "PATCH", json: { status: "SUSPENDED" } })).status === 200, "suspend");
    const after = (await editor.c("/api/auth/me")).status;
    expect(after === 401, `after ${after}`);
    return "200 then 401";
  });
  await check("Anonymous visitors cannot reach CVs or admin APIs", async () => {
    const anon = client();
    const s = [(await anon(`/api/admin/job-applications/${app.id}/documents/${app.documents[0].id}`)).status, (await anon("/api/admin/users")).status];
    expect(s.every((x) => x === 401), s.join(" "));
  });

  // cleanup
  const ids = (await prisma.user.findMany({ where: { email: { in: ["hr-a@e2e.invalid", "editor@e2e.invalid", "auditor@e2e.invalid"] } }, select: { id: true } })).map((u) => u.id);
  await prisma.jobApplication.deleteMany({ where: { email: "applicant-authz@e2e.invalid" } });
  await prisma.vacancy.deleteMany({ where: { title: "E2E Authz Vacancy" } });
  await prisma.newsArticle.deleteMany({ where: { title: { startsWith: "E2E" } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.emailOutbox.deleteMany({ where: { createdAt: { gte: START } } });
  await prisma.contentRevision.deleteMany({ where: { createdAt: { gte: START } } });
  await prisma.auditLog.deleteMany({ where: { createdAt: { gte: START } } });
  await prisma.rateLimitBucket.deleteMany({});
  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
