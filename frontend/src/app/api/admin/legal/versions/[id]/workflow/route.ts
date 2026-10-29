import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { legalWorkflow, legalWorkflowSchema } from "@/server/content/legal";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

// { "action": "submit" | "approve" | "reject" | "publish" | "archive" }
export const POST = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const id = z.string().uuid().parse(params.id);
  const { action } = legalWorkflowSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ version: await legalWorkflow(user, id, action, { ipHash, userAgent }) });
});
