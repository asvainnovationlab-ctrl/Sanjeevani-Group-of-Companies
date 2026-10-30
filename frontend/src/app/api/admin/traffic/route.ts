import { NextResponse } from "next/server";
import { z } from "zod";
import { canAny } from "@/server/auth/access";
import { requireUser } from "@/server/auth/guard";
import { forbidden, handle } from "@/server/http/errors";
import { trafficSummary } from "@/server/traffic/service";

export const dynamic = "force-dynamic";

const query = z.object({ days: z.coerce.number().int().refine((d) => [7, 30, 90].includes(d)).default(30) });

// Website visits for the dashboard chart: anyone who manages settings or
// reads the audit log (group and company administrators, auditors).
export const GET = handle(async (request: Request) => {
  const user = await requireUser(request);
  if (!canAny(user.access, "settings.manage") && !canAny(user.access, "audit.read")) throw forbidden();
  const { days } = query.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(await trafficSummary(days));
});
