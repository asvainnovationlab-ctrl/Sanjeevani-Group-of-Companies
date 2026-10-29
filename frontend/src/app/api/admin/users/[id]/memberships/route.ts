import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { setMemberships } from "@/server/users/service";
import { membershipsSchema } from "@/server/validation/auth";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

// Replaces the user's full set of roles (group-wide or per company).
export const PUT = handle(async (request: Request, { params }: Context) => {
  const actor = await requirePermission(request, "user.manage");
  const id = z.string().uuid().parse(params.id);
  const { memberships } = membershipsSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const user = await setMemberships(actor, id, memberships, { ipHash, userAgent });
  return NextResponse.json({ user });
});
