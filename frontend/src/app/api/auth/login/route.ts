import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/server/auth/guard";
import { login } from "@/server/auth/service";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { loginSchema } from "@/server/validation/auth";

export const dynamic = "force-dynamic";

export const POST = handle(async (request: Request) => {
  assertSameOrigin(request);
  const input = loginSchema.parse(await readJson(request));
  const user = await login(input, requestMeta(request));
  return NextResponse.json({ user });
});
