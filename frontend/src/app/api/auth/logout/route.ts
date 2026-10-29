import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/server/auth/guard";
import { logout } from "@/server/auth/service";
import { clearSessionCookie, getSessionUser } from "@/server/auth/session";
import { handle } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

export const POST = handle(async (request: Request) => {
  assertSameOrigin(request);
  const user = await getSessionUser();
  if (user) await logout(user, requestMeta(request));
  else clearSessionCookie();
  return NextResponse.json({ ok: true });
});
