import { NextResponse } from "next/server";
import { getPublished } from "@/server/content/service";
import { contentType } from "@/server/content/types";
import { handle, notFound } from "@/server/http/errors";
import { slugSchema } from "@/server/validation/company";

export const dynamic = "force-dynamic";

type Context = { params: { type: string; key: string } };

// One published item by slug (news, events, galleries, leaders) or key (pages).
export const GET = handle(async (_request: Request, { params }: Context) => {
  const type = contentType(params.type);
  const key = slugSchema.safeParse(params.key);
  const item = type && key.success ? await getPublished(type, key.data) : null;
  if (!item) throw notFound("Not found.");
  return NextResponse.json({ data: item }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
