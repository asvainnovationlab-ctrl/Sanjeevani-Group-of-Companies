import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { createCompany, listAdminCompanies } from "@/server/companies/service";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { companyCreateSchema, companyListQuery } from "@/server/validation/company";

export const dynamic = "force-dynamic";

// Lists only the companies the user may see.
export const GET = handle(async (request: Request) => {
  const user = await requirePermission(request, "company.read", "any");
  const query = companyListQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(await listAdminCompanies(user, query));
});

// Creating companies is a group-level action.
export const POST = handle(async (request: Request) => {
  const user = await requirePermission(request, "company.create");
  const input = companyCreateSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const company = await createCompany(user, input, { ipHash, userAgent });
  return NextResponse.json({ company }, { status: 201 });
});
