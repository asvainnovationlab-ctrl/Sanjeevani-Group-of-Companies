import { NextResponse } from "next/server";
import { handle, notFound } from "@/server/http/errors";
import { getPublicVacancy } from "@/server/recruitment/vacancies";
import { slugSchema } from "@/server/validation/company";

export const dynamic = "force-dynamic";

type Context = { params: { slug: string } };

export const GET = handle(async (_request: Request, { params }: Context) => {
  const parsed = slugSchema.safeParse(params.slug);
  const vacancy = parsed.success ? await getPublicVacancy(parsed.data) : null;
  if (!vacancy) throw notFound("Vacancy not found.");
  return NextResponse.json({ data: vacancy }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
