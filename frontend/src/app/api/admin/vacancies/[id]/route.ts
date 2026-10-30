import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { refreshCareerPages } from "@/server/public/vacancies";
import { getAdminVacancy, updateVacancy } from "@/server/recruitment/vacancies";
import { vacancyUpdateSchema } from "@/server/validation/recruitment";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "vacancy.read", "any");
  return NextResponse.json({ vacancy: await getAdminVacancy(user, z.string().uuid().parse(params.id)) });
});

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "vacancy.update", "any");
  const id = z.string().uuid().parse(params.id);
  const input = vacancyUpdateSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const vacancy = await updateVacancy(user, id, input, { ipHash, userAgent });
  refreshCareerPages();
  return NextResponse.json({ vacancy });
});
