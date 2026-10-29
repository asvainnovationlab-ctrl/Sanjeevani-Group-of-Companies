import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { changeApplicationStatus } from "@/server/recruitment/applications";
import { applicationStatusSchema } from "@/server/validation/recruitment";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export const POST = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "application.update", "any");
  const id = z.string().uuid().parse(params.id);
  const input = applicationStatusSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json(await changeApplicationStatus(user, id, input, { ipHash, userAgent }));
});
