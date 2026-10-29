import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { replaceLocations } from "@/server/companies/service";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { locationsSchema } from "@/server/validation/company";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

// Replaces the company's full list of locations.
export const PUT = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "company.update", "any");
  const id = z.string().uuid().parse(params.id);
  const { locations } = locationsSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const company = await replaceLocations(user, id, locations, { ipHash, userAgent });
  return NextResponse.json({ company });
});
