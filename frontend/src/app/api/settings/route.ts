import { NextResponse } from "next/server";
import { handle } from "@/server/http/errors";
import { getSettings } from "@/server/settings/service";

export const dynamic = "force-dynamic";

// Public site settings (contact details, social links, SEO defaults).
export const GET = handle(async () => {
  return NextResponse.json({ data: await getSettings() }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
});
