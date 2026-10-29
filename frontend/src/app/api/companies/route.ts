import { NextResponse } from "next/server";
import { listPublicCompanies } from "@/server/companies/service";
import { handle } from "@/server/http/errors";

export const dynamic = "force-dynamic";

// Published companies only, for the public website.
export const GET = handle(async (request: Request) => {
  const sector = new URL(request.url).searchParams.get("sector")?.slice(0, 60) || undefined;
  const companies = await listPublicCompanies({ sector });
  return NextResponse.json({ data: companies }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
