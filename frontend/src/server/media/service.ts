import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { badRequest, conflict, forbidden, notFound } from "@/server/http/errors";
import { can } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { cleanAltText, imageProblem, sniffImage } from "@/server/media/rules";
import { deleteStoredImage, storeImage } from "@/server/media/storage";

type Meta = { ipHash: string; userAgent: string | null };

export const mediaSelect = {
  id: true, provider: true, url: true, kind: true, mimeType: true, bytes: true, width: true, height: true, altText: true, createdAt: true,
} satisfies Prisma.MediaAssetSelect;

const FOLDERS = ["companies", "leaders", "news", "gallery", "homepage", "general"] as const;
export type MediaFolder = (typeof FOLDERS)[number];
export const isMediaFolder = (value: string): value is MediaFolder => (FOLDERS as readonly string[]).includes(value);

export async function uploadImage(actor: SessionUser, file: File, input: { altText?: string | null; folder: MediaFolder }, meta: Meta) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = imageProblem(bytes);
  if (problem) throw badRequest(problem);
  const altText = cleanAltText(input.altText);
  if (!altText) throw badRequest("Describe the image in a few words (alt text) for visitors using screen readers.");

  const type = sniffImage(bytes)!;
  const stored = await storeImage(bytes, type, input.folder);
  try {
    const asset = await prisma.mediaAsset.create({
      data: { ...stored, kind: "IMAGE", mimeType: type.mimeType, altText, uploadedById: actor.id },
      select: mediaSelect,
    });
    await recordAudit({ actorId: actor.id, action: "media.upload", entityType: "MediaAsset", entityId: asset.id, metadata: { folder: input.folder, bytes: stored.bytes, mimeType: type.mimeType }, ...meta });
    return asset;
  } catch (error) {
    await deleteStoredImage(stored.provider, stored.storageKey).catch(() => undefined); // don't leave orphans
    throw error;
  }
}

export async function listMedia(input: { cursor?: string; take?: number }) {
  const take = Math.min(Math.max(input.take ?? 40, 1), 100);
  const items = await prisma.mediaAsset.findMany({
    where: { kind: "IMAGE" },
    select: mediaSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });
  return { items: items.slice(0, take), nextCursor: items.length > take ? items[take - 1].id : null };
}

export async function updateAltText(actor: SessionUser, id: string, altText: string, meta: Meta) {
  const clean = cleanAltText(altText);
  if (!clean) throw badRequest("Alt text cannot be empty.");
  const before = await prisma.mediaAsset.findUnique({ where: { id }, select: { altText: true } });
  if (!before) throw notFound("Image not found.");
  const asset = await prisma.mediaAsset.update({ where: { id }, data: { altText: clean }, select: mediaSelect });
  await recordAudit({ actorId: actor.id, action: "media.update", entityType: "MediaAsset", entityId: id, metadata: { before: before.altText, after: clean }, ...meta });
  return asset;
}

// Images still used anywhere on the site cannot be deleted.
export async function deleteMedia(actor: SessionUser, id: string, meta: Meta) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          sectorImages: true, companyLogos: true, companyBanners: true, leaderPhotos: true, careerAreaImages: true, newsCovers: true,
          eventCovers: true, galleryItems: true, videoThumbnails: true, videoFiles: true, homepageSlides: true, keySectors: true,
          impactPillars: true, noticeFiles: true,
        },
      },
    },
  });
  if (!asset) throw notFound("Image not found.");
  if (!can(actor.access, "media.upload") && asset.uploadedById !== actor.id) {
    throw forbidden("You can only delete images you uploaded.");
  }
  const uses = Object.values(asset._count).reduce((sum, n) => sum + n, 0);
  if (uses > 0) throw conflict(`This image is used in ${uses} place${uses === 1 ? "" : "s"}. Replace it there first.`);

  await prisma.mediaAsset.delete({ where: { id } });
  await deleteStoredImage(asset.provider, asset.storageKey);
  await recordAudit({ actorId: actor.id, action: "media.delete", entityType: "MediaAsset", entityId: id, metadata: { url: asset.url }, ...meta });
}
