import { requirePermission } from "@/server/auth/guard";
import { contactListQuery, exportContactCsv } from "@/server/contact/service";
import { handle } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request) => {
  const user = await requirePermission(request, "contact.read", "any");
  const { status, q } = contactListQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { ipHash, userAgent } = requestMeta(request);
  const csv = await exportContactCsv(user, { status, q }, { ipHash, userAgent });
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
