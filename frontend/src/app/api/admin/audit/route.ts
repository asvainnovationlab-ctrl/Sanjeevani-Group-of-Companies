import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { auditQuery, listAudit } from "@/server/audit-viewer";
import { handle } from "@/server/http/errors";

export const dynamic = "force-dynamic";

// ?action=prefix&actorId=&entityType=&entityId=&companyId=&from=&to=&page=&pageSize=
export const GET = handle(async (request: Request) => {
  const user = await requirePermission(request, "audit.read", "any");
  const query = auditQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(await listAudit(user, query));
});
