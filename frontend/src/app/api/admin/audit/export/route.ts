import { requirePermission } from "@/server/auth/guard";
import { auditQuery, exportAuditCsv } from "@/server/audit-viewer";
import { handle } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request) => {
  const user = await requirePermission(request, "audit.read", "any");
  const { page: _p, pageSize: _s, ...filters } = auditQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { ipHash, userAgent } = requestMeta(request);
  const csv = await exportAuditCsv(user, filters, { ipHash, userAgent });
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
