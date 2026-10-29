import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { listCompanyRevisions } from "@/server/companies/service";
import { handle } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

// The last 20 saved versions (state before each change).
export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const revisions = await listCompanyRevisions(user, z.string().uuid().parse(params.id));
  return NextResponse.json({ revisions });
});
