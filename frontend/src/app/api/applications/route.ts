import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/server/auth/guard";
import { CV_MAX_BYTES } from "@/server/documents/rules";
import { siteUrl } from "@/server/email/outbox";
import { badRequest, handle, HttpError } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { submitApplication } from "@/server/recruitment/applications";

export const dynamic = "force-dynamic";

// Public job application (multipart). Same fields as the current
// /api/careers/applications form, so the site switches by changing the URL.
export const POST = handle(async (request: Request) => {
  assertSameOrigin(request);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > CV_MAX_BYTES + 256 * 1024) throw new HttpError(413, "Your CV must be 5 MB or smaller.", "too_large");
  const form = await request.formData().catch(() => {
    throw badRequest("The application could not be read. Please try again.");
  });
  const { ipHash, userAgent } = requestMeta(request);
  const result = await submitApplication(form, { ipHash, userAgent }, siteUrl(request));
  return NextResponse.json({ ok: true, referenceNumber: result.referenceNumber }, { status: 201 });
});
