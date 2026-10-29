import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { handle } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { downloadApplicationDocument } from "@/server/recruitment/applications";

export const dynamic = "force-dynamic";

type Context = { params: { id: string; documentId: string } };

// Streams a CV after the permission check. Always a download, never shown
// inline, so a crafted file cannot run in the admin's browser.
export const GET = handle(async (request: Request, { params }: Context) => {
  const user = await requirePermission(request, "application.read", "any");
  const id = z.string().uuid().parse(params.id);
  const documentId = z.string().uuid().parse(params.documentId);
  const { ipHash, userAgent } = requestMeta(request);
  const file = await downloadApplicationDocument(user, id, documentId, { ipHash, userAgent });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.bytes.length),
      "Content-Disposition": `attachment; filename="${file.fileName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'",
    },
  });
});
