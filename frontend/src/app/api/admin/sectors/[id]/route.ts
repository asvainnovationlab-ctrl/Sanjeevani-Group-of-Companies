import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { deleteSector, sectorUpdateSchema, updateSector } from "@/server/companies/sectors";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export const PATCH = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "company.create");
  const input = sectorUpdateSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  return NextResponse.json({ sector: await updateSector(user, z.string().uuid().parse(params.id), input, { ipHash, userAgent }) });
});

export const DELETE = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "company.create");
  const { ipHash, userAgent } = requestMeta(request);
  await deleteSector(user, z.string().uuid().parse(params.id), { ipHash, userAgent });
  return NextResponse.json({ ok: true });
});
