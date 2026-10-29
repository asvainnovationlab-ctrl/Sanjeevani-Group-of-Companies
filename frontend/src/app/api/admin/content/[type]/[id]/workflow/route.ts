import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { runWorkflow } from "@/server/content/service";
import { contentType } from "@/server/content/types";
import { WORKFLOW_ACTIONS, type WorkflowAction } from "@/server/content/workflow";
import { handle, notFound, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

type Context = { params: { type: string; id: string } };

const body = z.object({ action: z.enum(WORKFLOW_ACTIONS as [WorkflowAction, ...WorkflowAction[]]) });

// { "action": "submit" | "approve" | "reject" | "publish" | "unpublish" | "archive" | "restore" }
export const POST = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const type = contentType(params.type);
  if (!type) throw notFound("Unknown content type.");
  const id = z.string().uuid().parse(params.id);
  const { action } = body.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ item: await runWorkflow(user, type, id, action, { ipHash, userAgent }) });
});
