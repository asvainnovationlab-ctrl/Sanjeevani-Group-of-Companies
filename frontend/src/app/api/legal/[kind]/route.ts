import { NextResponse } from "next/server";
import { getPublishedLegal, legalKind } from "@/server/content/legal";
import { handle, notFound } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type Context = { params: { kind: string } };

// The live version of /privacy-policy or /terms-of-use.
export const GET = handle(async (_request: Request, { params }: Context) => {
  const kind = legalKind(params.kind);
  const version = kind ? await getPublishedLegal(kind) : null;
  if (!version) throw notFound("Not found.");
  return NextResponse.json({ data: version }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
});
