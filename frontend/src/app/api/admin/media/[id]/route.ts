import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { deleteMedia, updateAltText } from "@/server/media/service";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

const altSchema = z.object({ altText: z.string().max(250) });

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "media.upload", "any");
  const id = z.string().uuid().parse(params.id);
  const { altText } = altSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ asset: await updateAltText(user, id, altText, { ipHash, userAgent }) });
});

export const DELETE = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "media.upload", "any");
  const id = z.string().uuid().parse(params.id);
  const { ipHash, userAgent } = requestMeta(request);
  await deleteMedia(user, id, { ipHash, userAgent });
  return NextResponse.json({ ok: true });
});
