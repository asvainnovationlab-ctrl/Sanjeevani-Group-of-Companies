import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/server/auth/guard";
import { requestPasswordReset } from "@/server/auth/service";
import { siteUrl } from "@/server/email/outbox";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { resetRequestSchema } from "@/server/validation/auth";

export const dynamic = "force-dynamic";

// Always the same answer, whether or not the account exists.
export const POST = handle(async (request: Request) => {
  assertSameOrigin(request);
  const { email } = resetRequestSchema.parse(await readJson(request));
  await requestPasswordReset(email, requestMeta(request), siteUrl(request));
  return NextResponse.json({ message: "If an account exists for that email, a reset link is on its way." }, { status: 202 });
});
