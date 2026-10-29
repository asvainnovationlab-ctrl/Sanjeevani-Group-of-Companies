import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { deleteContent, getForAdmin, updateContent } from "@/server/content/service";
import { contentType } from "@/server/content/types";
import { handle, notFound, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

type Context = { params: { type: string; id: string } };

function resolve(params: Context["params"]) {
  const type = contentType(params.type);
  if (!type) throw notFound("Unknown content type.");
  return { type, id: z.string().uuid().parse(params.id) };
}

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const { type, id } = resolve(params);
  return NextResponse.json({ item: await getForAdmin(user, type, id) });
});

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const { type, id } = resolve(params);
  const input = type.updateSchema.parse(await readJson(request)) as Record<string, unknown>;
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ item: await updateContent(user, type, id, input, { ipHash, userAgent }) });
});

export const DELETE = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const { type, id } = resolve(params);
  const { ipHash, userAgent } = requestMeta(request);
  await deleteContent(user, type, id, { ipHash, userAgent });
  return NextResponse.json({ ok: true });
});
