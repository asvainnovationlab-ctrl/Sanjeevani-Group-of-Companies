import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { createVacancy, listAdminVacancies } from "@/server/recruitment/vacancies";
import { vacancyCreateSchema, vacancyListQuery } from "@/server/validation/recruitment";

export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request) => {
  const user = await requirePermission(request, "vacancy.read", "any");
  const query = vacancyListQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json({ vacancies: await listAdminVacancies(user, query) });
});

export const POST = handle(async (request: Request) => {
  const user = await requirePermission(request, "vacancy.update", "any");
  const input = vacancyCreateSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ vacancy: await createVacancy(user, input, { ipHash, userAgent }) }, { status: 201 });
});
