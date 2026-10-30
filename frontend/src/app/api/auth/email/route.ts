import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/guard";
import { changeEmail } from "@/server/auth/service";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { changeEmailSchema } from "@/server/validation/auth";

export const dynamic = "force-dynamic";

export const POST = handle(async (request: Request) => {
  const user = await requireUser(request);
  const input = changeEmailSchema.parse(await readJson(request));
  const result = await changeEmail(user, input, requestMeta(request));
  return NextResponse.json({ message: `Your sign-in email is now ${result.email}.`, email: result.email });
});
