import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/server/auth/guard";
import { contactFormSchema, submitContact } from "@/server/contact/service";
import { siteUrl } from "@/server/email/outbox";
import { handle, readJson } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";

export const dynamic = "force-dynamic";

// Public enquiry form (JSON): name, email, phone?, subject?, message, companySlug?
export const POST = handle(async (request: Request) => {
  assertSameOrigin(request);
  const input = contactFormSchema.parse(await readJson(request));
  const { ipHash, userAgent } = requestMeta(request);
  await submitContact(input, { ipHash, userAgent }, siteUrl(request));
  return NextResponse.json({ ok: true, message: "Thank you. Your message has been sent to our team." }, { status: 201 });
});
