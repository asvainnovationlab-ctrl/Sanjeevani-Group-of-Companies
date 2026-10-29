import { NextResponse } from "next/server";
import { handle } from "@/server/http/errors";
import { listPublicVacancies } from "@/server/recruitment/vacancies";

export const dynamic = "force-dynamic";

// Published vacancies of published companies; ?careerArea=slug&company=slug
export const GET = handle(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const vacancies = await listPublicVacancies({
    careerArea: params.get("careerArea")?.slice(0, 100) || undefined,
    company: params.get("company")?.slice(0, 100) || undefined,
  });
  return NextResponse.json({ data: vacancies }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
