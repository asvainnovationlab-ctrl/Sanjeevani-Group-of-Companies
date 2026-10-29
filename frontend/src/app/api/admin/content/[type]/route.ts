import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { createContent, listForAdmin } from "@/server/content/service";
import { contentType } from "@/server/content/types";
import { handle, notFound, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

type Context = { params: { type: string } };

const listQuery = z.object({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]).optional(),
  q: z.string().trim().max(100).optional(),
});

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const type = contentType(params.type);
  if (!type) throw notFound("Unknown content type.");
  const query = listQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json({ items: await listForAdmin(user, type, query) });
});

// Creates a draft. Permissions are checked against the owning company.
export const POST = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const type = contentType(params.type);
  if (!type) throw notFound("Unknown content type.");
  const input = type.createSchema.parse(await readJson(request)) as Record<string, unknown>;
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ item: await createContent(user, type, input, { ipHash, userAgent }) }, { status: 201 });
});
