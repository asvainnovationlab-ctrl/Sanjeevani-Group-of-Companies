import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { changeCompanyStatus } from "@/server/companies/service";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { companyStatusSchema } from "@/server/validation/company";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

// { "action": "publish" | "unpublish" | "archive" | "restore" }
export const POST = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "company.publish", "any");
  const id = z.string().uuid().parse(params.id);
  const { action } = companyStatusSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  const company = await changeCompanyStatus(user, id, action, { ipHash, userAgent });
  return NextResponse.json({ company });
});
