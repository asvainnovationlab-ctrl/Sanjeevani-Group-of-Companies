import { requirePermission } from "@/server/auth/guard";
import { handle } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { exportApplicationsCsv } from "@/server/recruitment/applications";
import { applicationListQuery } from "@/server/validation/recruitment";

export const dynamic = "force-dynamic";

// CSV of the filtered applications (max 5,000 rows). Every export is audited.
export const GET = handle(async (request: Request) => {
  const user = await requirePermission(request, "application.export", "any");
  const { page: _page, pageSize: _size, ...filters } = applicationListQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { ipHash, userAgent } = requestMeta(request);
  const csv = await exportApplicationsCsv(user, filters, { ipHash, userAgent });
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
