import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { contactUpdateSchema, getContactMessage, updateContactMessage } from "@/server/contact/service";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "contact.read", "any");
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ message: await getContactMessage(user, z.string().uuid().parse(params.id), { ipHash, userAgent }) });
});

// { "status": "IN_PROGRESS" | "RESOLVED" | "SPAM" | "NEW", "assignedToId": uuid | null }
export const PATCH = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "contact.update", "any");
  const id = z.string().uuid().parse(params.id);
  const input = contactUpdateSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ message: await updateContactMessage(user, id, input, { ipHash, userAgent }) });
});
