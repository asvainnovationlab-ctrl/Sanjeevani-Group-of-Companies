import { NextResponse } from "next/server";
import { getPublicCompany } from "@/server/companies/service";
import { handle, notFound } from "@/server/http/errors";
import { slugSchema } from "@/server/validation/company";

export const dynamic = "force-dynamic";

type Context = { params: { slug: string } };

export const GET = handle(async (_request: Request, { params }: Context) => {
  const parsed = slugSchema.safeParse(params.slug);
  const company = parsed.success ? await getPublicCompany(parsed.data) : null;
  if (!company) throw notFound("Company not found.");
  return NextResponse.json({ data: company }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
