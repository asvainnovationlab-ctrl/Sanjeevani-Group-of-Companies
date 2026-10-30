import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { contactListQuery, listContactMessages } from "@/server/contact/service";
import { handle } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request) => {
  const user = await requirePermission(request, "contact.read", "any");
  const query = contactListQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(await listContactMessages(user, query));
});
