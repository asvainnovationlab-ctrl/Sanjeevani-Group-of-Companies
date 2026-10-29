import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/server/auth/guard";
import { HttpError, badRequest, handle } from "@/server/http/errors";
import { requestMeta } from "@/server/http/request";
import { IMAGE_MAX_BYTES } from "@/server/media/rules";
import { isMediaFolder, listMedia, uploadImage } from "@/server/media/service";
import { storageMode } from "@/server/media/storage";

export const dynamic = "force-dynamic";

const listQuery = z.object({ cursor: z.string().uuid().optional(), take: z.coerce.number().int().optional() });

export const GET = handle(async (request: Request) => {
  await requirePermission(request, "media.upload", "any");
  const query = listQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json({ ...(await listMedia(query)), storage: storageMode() });
});

// multipart/form-data: file, altText, folder
export const POST = handle(async (request: Request) => {
  const user = await requirePermission(request, "media.upload", "any");
  if (!storageMode()) throw new HttpError(503, "Image storage is not configured on this server.", "unavailable");

  // Reject oversized bodies before reading them (multipart adds a little overhead).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > IMAGE_MAX_BYTES + 64 * 1024) throw new HttpError(413, "Images must be 5 MB or smaller.", "too_large");

  const form = await request.formData().catch(() => {
    throw badRequest("Send the image as multipart form data.");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw badRequest("Choose an image to upload.");
  const folder = String(form.get("folder") ?? "general");
  if (!isMediaFolder(folder)) throw badRequest("Unknown upload folder.");

  const { ipHash, userAgent } = requestMeta(request);
  const asset = await uploadImage(user, file, { altText: String(form.get("altText") ?? ""), folder }, { ipHash, userAgent });
  return NextResponse.json({ asset }, { status: 201 });
});
