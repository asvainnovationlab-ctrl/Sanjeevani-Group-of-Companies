import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { handle } from "@/server/http/errors";
import { listApplications } from "@/server/recruitment/applications";
import { applicationListQuery } from "@/server/validation/recruitment";

export const dynamic = "force-dynamic";

// Applications of the companies the user may see; filters + pagination.
export const GET = handle(async (request: Request) => {
  const user = await requirePermission(request, "application.read", "any");
  const query = applicationListQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(await listApplications(user, query));
});
