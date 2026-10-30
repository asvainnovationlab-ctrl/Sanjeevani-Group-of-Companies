import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { refreshCareerPages } from "@/server/public/vacancies";
import { changeVacancyStatus } from "@/server/recruitment/vacancies";
import { vacancyStatusSchema } from "@/server/validation/recruitment";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

// { "action": "publish" | "close" | "archive" | "restore" }
export const POST = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "vacancy.publish", "any");
  const id = z.string().uuid().parse(params.id);
  const { action } = vacancyStatusSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const vacancy = await changeVacancyStatus(user, id, action, { ipHash, userAgent });
  refreshCareerPages();
  return NextResponse.json({ vacancy });
});
