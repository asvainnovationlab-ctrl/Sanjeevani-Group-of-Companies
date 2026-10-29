import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/guard";
import { changePassword } from "@/server/auth/service";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { changePasswordSchema } from "@/server/validation/auth";

export const dynamic = "force-dynamic";

export const POST = handle(async (request: Request) => {
  const user = await requireUser(request);
  const input = changePasswordSchema.parse(await readJson(request));
  await changePassword(user, input, requestMeta(request));
  return NextResponse.json({ message: "Password changed. Other devices have been signed out." });
});
