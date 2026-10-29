import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { legalVersionUpdateSchema, updateLegalDraft } from "@/server/content/legal";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const id = z.string().uuid().parse(params.id);
  const input = legalVersionUpdateSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ version: await updateLegalDraft(user, id, input, { ipHash, userAgent }) });
});
