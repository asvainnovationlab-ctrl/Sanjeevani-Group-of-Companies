import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { siteUrl } from "@/server/email/outbox";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { inviteUser, listUsers } from "@/server/users/service";
import { inviteUserSchema } from "@/server/validation/auth";

export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request) => {
  await requirePermission(request, "user.manage");
  return NextResponse.json({ users: await listUsers() });
});

export const POST = handle(async (request: Request) => {
  const actor = await requirePermission(request, "user.manage");
  const input = inviteUserSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const user = await inviteUser(actor, input, siteUrl(request), { ipHash, userAgent });
  return NextResponse.json({ user }, { status: 201 });
});
