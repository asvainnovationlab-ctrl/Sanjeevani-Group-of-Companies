import { NextResponse } from "next/server";
import { listPublished } from "@/server/content/service";
import { contentType } from "@/server/content/types";
import { handle, notFound } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type Context = { params: { type: string } };

// Published content: /api/content/faqs, /news, /events, /notices, /videos,
// /galleries, /homepage-slides, /key-sectors, /impact-pillars, /pages, /leaders.
// Optional ?company=slug (company content) and ?placement= (videos).
export const GET = handle(async (request: Request, { params }: Context) => {
  const type = contentType(params.type);
  if (!type) throw notFound("Unknown content type.");
  const search = new URL(request.url).searchParams;
  const data = await listPublished(type, {
    company: search.get("company")?.slice(0, 100) || undefined,
    placement: search.get("placement")?.slice(0, 40) || undefined,
  });
  return NextResponse.json({ data }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
