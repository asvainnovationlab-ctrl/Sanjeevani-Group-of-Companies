import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { addApplicationNote } from "@/server/recruitment/applications";
import { applicationNoteSchema } from "@/server/validation/recruitment";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

// Internal review notes; never shown to the applicant.
export const POST = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "application.update", "any");
  const id = z.string().uuid().parse(params.id);
  const { body } = applicationNoteSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ note: await addApplicationNote(user, id, body, { ipHash, userAgent }) }, { status: 201 });
});
