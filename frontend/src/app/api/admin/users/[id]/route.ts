import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { updateUser } from "@/server/users/service";
import { updateUserSchema } from "@/server/validation/auth";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const actor = await requirePermission(request, "user.manage");
  const id = z.string().uuid().parse(params.id);
  const input = updateUserSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const user = await updateUser(actor, id, input, { ipHash, userAgent });
  return NextResponse.json({ user });
});
