import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/guard";
import { createLegalDraft, legalKind, legalVersionSchema, listLegalVersions } from "@/server/content/legal";
import { badRequest, handle, notFound } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

type Context = { params: { kind: string } };

function kindOf(params: Context["params"]) {
  const kind = legalKind(params.kind);
  if (!kind) throw notFound("Unknown legal document.");
  return kind;
}

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  return NextResponse.json({ versions: await listLegalVersions(user, kindOf(params)) });
});

// New draft version. An empty body copies the latest version.
export const POST = handle(async (request: Request, { params }: Context) => {
  const user = await requireUser(request);
  const kind = kindOf(params);
  const raw = (await request.text()).trim();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    throw badRequest("The request body must be valid JSON.");
  }
  const empty = body === null || (typeof body === "object" && Object.keys(body as object).length === 0);
  const input = empty ? null : legalVersionSchema.parse(body);
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ version: await createLegalDraft(user, kind, input, { ipHash, userAgent }) }, { status: 201 });
});
