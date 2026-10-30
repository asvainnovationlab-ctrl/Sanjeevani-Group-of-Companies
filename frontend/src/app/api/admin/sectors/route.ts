import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guard";
import { createSector, listSectors, sectorSchema } from "@/server/companies/sectors";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request) => {
  await requirePermission(request, "company.read", "any");
  return NextResponse.json({ sectors: await listSectors() });
});

export const POST = handle(async (request: Request) => {
  const user = await requirePermission(request, "company.create");
  const input = sectorSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ sector: await createSector(user, input, { ipHash, userAgent }) }, { status: 201 });
});
