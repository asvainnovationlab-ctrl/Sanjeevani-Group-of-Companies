import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, requireUser } from "@/server/auth/guard";
import { deleteCompany, getAdminCompany, updateCompany } from "@/server/companies/service";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { companyUpdateSchema } from "@/server/validation/company";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const company = await getAdminCompany(user, z.string().uuid().parse(params.id));
  return NextResponse.json({ company });
});

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "company.update", "any");
  const id = z.string().uuid().parse(params.id);
  const input = companyUpdateSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const company = await updateCompany(user, id, input, { ipHash, userAgent });
  return NextResponse.json({ company });
});

// Only for companies that are not live and have no vacancies or applications.
export const DELETE = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "company.create");
  const { ipHash, userAgent } = requestMeta(request);
  await deleteCompany(user, z.string().uuid().parse(params.id), { ipHash, userAgent });
  return NextResponse.json({ ok: true });
});
