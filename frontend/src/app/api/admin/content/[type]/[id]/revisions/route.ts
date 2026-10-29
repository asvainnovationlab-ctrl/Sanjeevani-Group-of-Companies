import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { listRevisions } from "@/server/content/service";
import { contentType } from "@/server/content/types";
import { handle, notFound } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type Context = { params: { type: string; id: string } };

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const type = contentType(params.type);
  if (!type) throw notFound("Unknown content type.");
  return NextResponse.json({ revisions: await listRevisions(user, type, z.string().uuid().parse(params.id)) });
});
