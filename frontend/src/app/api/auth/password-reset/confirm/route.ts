import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/server/auth/guard";
import { resetPassword } from "@/server/auth/service";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { resetConfirmSchema } from "@/server/validation/auth";

export const dynamic = "force-dynamic";

// Completes a password reset or accepts an invite. The user then signs in.
export const POST = handle(async (request: Request) => {
  assertSameOrigin(request);
  const input = resetConfirmSchema.parse(await readJson(request));
  await resetPassword(input, requestMeta(request));
  return NextResponse.json({ message: "Your password has been set. You can now sign in." });
});
