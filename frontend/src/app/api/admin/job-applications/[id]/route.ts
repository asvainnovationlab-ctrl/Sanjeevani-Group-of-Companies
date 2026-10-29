import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { handle } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { deleteApplication, getApplication } from "@/server/recruitment/applications";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "application.read", "any");
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ application: await getApplication(user, z.string().uuid().parse(params.id), { ipHash, userAgent }) });
});

// Permanently removes the application and its CV (retention / data requests).
export const DELETE = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "application.delete", "any");
  const { ipHash, userAgent } = requestMeta(request);
  await deleteApplication(user, z.string().uuid().parse(params.id), { ipHash, userAgent });
  return NextResponse.json({ ok: true });
});
