import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { getSettings, settingsUpdateSchema, updateSettings } from "@/server/settings/service";

export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request) => {
  await requirePermission(request, "settings.manage");
  return NextResponse.json({ settings: await getSettings() });
});

// { "contact.email": "info@…", "social.facebook": null, … } — null removes a setting.
export const PUT = handle(async (request: Request) => {
  const user = await requirePermission(request, "settings.manage");
  const input = settingsUpdateSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ settings: await updateSettings(user, input, { ipHash, userAgent }) });
});
