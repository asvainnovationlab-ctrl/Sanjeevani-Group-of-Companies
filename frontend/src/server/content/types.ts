import { z } from "zod";
import type { PermissionKey } from "@/server/auth/permissions";
import { blockMediaIds, blocksSchema, hrefSchema, type Block } from "@/server/content/blocks";
import { slugSchema } from "@/server/validation/company";

// The registry of editable content types. Each entry says how its input is
// validated, how it maps to the database, who may edit and publish it, which
// companies own it, and what the public site may see.

type Row = Record<string, unknown> & { id: string };
type Input = Record<string, unknown>;

export type ContentType = {
  model: "faq" | "newsArticle" | "event" | "notice" | "video" | "gallery" | "homepageSlide" | "keySector" | "impactPillar" | "staticPage" | "leader";
  label: string;
  update: PermissionKey;
  publish: PermissionKey;
  createSchema: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;
  // Prisma data for create / update (nested lists are replaced on update).
  toData: (input: Input, mode: "create" | "update") => Input;
  // Companies that own an item: null means group-level (group-wide rights).
  owners: (item: Row | Input) => (string | null)[];
  include?: Record<string, unknown>;
  orderBy: Record<string, unknown>[];
  slugFrom?: string; // field to derive the slug from when none is given
  publicKey?: "slug" | "key"; // detail lookup on the public API
  publicWhere?: (now: Date) => Record<string, unknown>;
  mediaIds: (input: Input) => string[];
  // Which "who did it" columns the model has.
  stamps: "none" | "edit" | "approve";
  // group: group-level only; company: has companyId; leader: via assignments.
  scope: "group" | "company" | "leader";
};

const image = { select: { id: true, url: true, altText: true, width: true, height: true } } as const;
const str = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalStr = (max: number) => z.string().trim().max(max).nullable().optional();
const uuidOrNull = z.string().uuid().nullable().optional();
const sortOrder = z.number().int().min(0).max(10000).optional();
const ids = (...values: unknown[]) => values.filter((v): v is string => typeof v === "string");
const companyOwner = (item: Row | Input) => [typeof item.companyId === "string" ? item.companyId : null];
const groupOwner = () => [null];
const pick = (input: Input, keys: string[]) => Object.fromEntries(keys.filter((k) => input[k] !== undefined).map((k) => [k, input[k]]));
const dateField = (value: unknown) => (value === undefined ? undefined : value === null ? null : new Date(String(value)));

const youtube = z
  .string()
  .trim()
  .url()
  .refine((value) => /^https:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{6,}/.test(value), "Paste a YouTube video link.");

function strictBoth<T extends z.ZodRawShape>(shape: T, required: (keyof T)[]) {
  const base = z.object(shape);
  // zod cannot type a mask over a generic shape; the registry only exposes ZodTypeAny anyway.
  const requiredMask = Object.fromEntries(required.map((k) => [k, true])) as never;
  return {
    createSchema: base.partial().required(requiredMask).strict(),
    updateSchema: base.partial().extend({ expectedUpdatedAt: z.string().datetime().optional() }).strict(),
  };
}

// ------------------------------------------------------------------ types

const faq = strictBoth({ question: str(5, 300), answer: str(10, 5000), sortOrder }, ["question", "answer"]);

const news = strictBoth(
  {
    slug: slugSchema,
    type: z.enum(["PRESS_RELEASE", "NEWS", "ANNOUNCEMENT"]),
    title: str(3, 200),
    excerpt: optionalStr(500),
    body: blocksSchema.nullable(),
    coverImageId: uuidOrNull,
    companyId: uuidOrNull,
    categoryId: uuidOrNull,
    tags: z.array(str(1, 40)).max(15),
    seoTitle: optionalStr(70),
    seoDescription: optionalStr(160),
    publishAt: z.string().datetime().nullable(),
  },
  ["title"],
);

const event = strictBoth(
  {
    slug: slugSchema,
    title: str(3, 200),
    summary: optionalStr(500),
    body: blocksSchema.nullable(),
    venue: optionalStr(200),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().nullable(),
    coverImageId: uuidOrNull,
    companyId: uuidOrNull,
  },
  ["title", "startsAt"],
);

const notice = strictBoth(
  { title: str(3, 200), body: optionalStr(5000), noticeDate: z.string().datetime(), companyId: uuidOrNull, attachmentId: uuidOrNull },
  ["title", "noticeDate"],
);

const video = strictBoth(
  { title: str(3, 200), url: youtube, thumbnailId: uuidOrNull, placement: z.enum(["NEWSROOM_YOUTUBE", "GALLERY"]), sortOrder },
  ["title", "url", "placement"],
);

const galleryItem = z.object({ mediaId: z.string().uuid(), caption: str(1, 300), altText: str(1, 250) });
const gallery = strictBoth({ slug: slugSchema, title: str(3, 200), companyId: uuidOrNull, items: z.array(galleryItem).max(200) }, ["title"]);

const slide = strictBoth({ label: str(2, 120), theme: str(2, 40), imageId: uuidOrNull, href: hrefSchema.nullable().optional(), sortOrder }, ["label", "theme"]);

const keySector = strictBoth(
  { title: str(2, 120), detail: str(10, 600), href: hrefSchema, iconKey: z.string().regex(/^[a-z0-9-]{2,40}$/), imageId: uuidOrNull, sortOrder },
  ["title", "detail", "href", "iconKey"],
);

const impact = strictBoth(
  { tab: str(2, 60), title: str(2, 160), imageId: uuidOrNull, imageAlt: str(1, 250), paragraphs: z.array(str(1, 3000)).min(1).max(20), sortOrder },
  ["tab", "title", "imageAlt", "paragraphs"],
);

const page = strictBoth(
  { key: slugSchema, title: str(2, 200), intro: optionalStr(1000), body: blocksSchema.nullable(), seoTitle: optionalStr(70), seoDescription: optionalStr(160) },
  ["key", "title"],
);

const socialUrl = z.string().trim().url().refine((v) => v.startsWith("https://"), "Use an https:// link.").nullable().optional();
const leader = strictBoth(
  {
    slug: slugSchema,
    name: str(2, 120),
    photoId: uuidOrNull,
    summary: optionalStr(600),
    biography: optionalStr(10000),
    message: z.array(str(1, 5000)).max(20),
    responsibilities: z.array(str(1, 500)).max(30),
    linkedinUrl: socialUrl,
    facebookUrl: socialUrl,
    instagramUrl: socialUrl,
    xUrl: socialUrl,
    assignments: z
      .array(z.object({ companyId: z.string().uuid().nullable(), title: str(2, 120), tier: z.enum(["BOARD", "TEAM"]).default("TEAM"), isManagingDirector: z.boolean().default(false) }))
      .min(1)
      .max(20),
    career: z.array(z.object({ period: str(1, 60), position: str(1, 160), organisation: str(1, 160) })).max(40),
    education: z.array(z.object({ qualification: str(1, 160), institution: str(1, 160) })).max(20),
  },
  ["name", "assignments"],
);

function nested(list: unknown, mode: "create" | "update") {
  if (!Array.isArray(list)) return undefined;
  const create = list.map((item, sortOrder) => ({ ...(item as object), sortOrder }));
  return mode === "create" ? { create } : { deleteMany: {}, create };
}

export const CONTENT_TYPES = {
  faqs: {
    model: "faq", scope: "group", stamps: "edit", label: "FAQ", update: "content.update", publish: "content.publish", ...faq,
    toData: (i) => pick(i, ["question", "answer", "sortOrder"]),
    owners: groupOwner, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], mediaIds: () => [],
  },
  news: {
    model: "newsArticle", scope: "company", stamps: "approve", label: "News article", update: "content.update", publish: "content.publish", ...news,
    toData: (i) => ({ ...pick(i, ["slug", "type", "title", "excerpt", "body", "coverImageId", "companyId", "categoryId", "tags", "seoTitle", "seoDescription"]), publishAt: dateField(i.publishAt) }),
    owners: companyOwner, slugFrom: "title", publicKey: "slug",
    include: { coverImage: image, company: { select: { id: true, name: true, slug: true } }, category: { select: { slug: true, name: true } } },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    publicWhere: (now) => ({ OR: [{ publishAt: null }, { publishAt: { lte: now } }] }),
    mediaIds: (i) => [...ids(i.coverImageId), ...blockMediaIds(i.body as Block[] | null)],
  },
  events: {
    model: "event", scope: "company", stamps: "approve", label: "Event", update: "content.update", publish: "content.publish", ...event,
    toData: (i) => ({ ...pick(i, ["slug", "title", "summary", "body", "venue", "coverImageId", "companyId"]), startsAt: dateField(i.startsAt), endsAt: dateField(i.endsAt) }),
    owners: companyOwner, slugFrom: "title", publicKey: "slug",
    include: { coverImage: image, company: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ startsAt: "desc" }], mediaIds: (i) => [...ids(i.coverImageId), ...blockMediaIds(i.body as Block[] | null)],
  },
  notices: {
    model: "notice", scope: "company", stamps: "edit", label: "Notice", update: "content.update", publish: "content.publish", ...notice,
    toData: (i) => ({ ...pick(i, ["title", "body", "companyId", "attachmentId"]), noticeDate: dateField(i.noticeDate) }),
    owners: companyOwner, include: { attachment: image, company: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ noticeDate: "desc" }], mediaIds: (i) => ids(i.attachmentId),
  },
  videos: {
    model: "video", scope: "group", stamps: "none", label: "Video", update: "content.update", publish: "content.publish", ...video,
    toData: (i) => ({ ...pick(i, ["title", "url", "thumbnailId", "placement", "sortOrder"]), ...(i.url !== undefined ? { provider: "YOUTUBE" } : {}) }),
    owners: groupOwner, include: { thumbnail: image }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], mediaIds: (i) => ids(i.thumbnailId),
  },
  galleries: {
    model: "gallery", scope: "company", stamps: "none", label: "Gallery", update: "content.update", publish: "content.publish", ...gallery,
    toData: (i, mode) => ({ ...pick(i, ["slug", "title", "companyId"]), items: nested(i.items, mode) }),
    owners: companyOwner, slugFrom: "title", publicKey: "slug",
    include: { items: { orderBy: { sortOrder: "asc" }, include: { media: image } }, company: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ createdAt: "desc" }],
    mediaIds: (i) => (Array.isArray(i.items) ? i.items.map((item) => (item as { mediaId: string }).mediaId) : []),
  },
  "homepage-slides": {
    model: "homepageSlide", scope: "group", stamps: "none", label: "Homepage slide", update: "content.update", publish: "content.publish", ...slide,
    toData: (i) => pick(i, ["label", "theme", "imageId", "href", "sortOrder"]),
    owners: groupOwner, include: { image }, orderBy: [{ sortOrder: "asc" }], mediaIds: (i) => ids(i.imageId),
  },
  "key-sectors": {
    model: "keySector", scope: "group", stamps: "none", label: "Key sector", update: "content.update", publish: "content.publish", ...keySector,
    toData: (i) => pick(i, ["title", "detail", "href", "iconKey", "imageId", "sortOrder"]),
    owners: groupOwner, include: { image }, orderBy: [{ sortOrder: "asc" }], mediaIds: (i) => ids(i.imageId),
  },
  "impact-pillars": {
    model: "impactPillar", scope: "group", stamps: "none", label: "Impact pillar", update: "content.update", publish: "content.publish", ...impact,
    toData: (i) => pick(i, ["tab", "title", "imageId", "imageAlt", "paragraphs", "sortOrder"]),
    owners: groupOwner, include: { image }, orderBy: [{ sortOrder: "asc" }], mediaIds: (i) => ids(i.imageId),
  },
  pages: {
    model: "staticPage", scope: "group", stamps: "approve", label: "Page", update: "content.update", publish: "content.publish", ...page,
    toData: (i) => pick(i, ["key", "title", "intro", "body", "seoTitle", "seoDescription"]),
    owners: groupOwner, publicKey: "key", orderBy: [{ key: "asc" }], mediaIds: (i) => blockMediaIds(i.body as Block[] | null),
  },
  leaders: {
    model: "leader", scope: "leader", stamps: "approve", label: "Leader", update: "leader.update", publish: "leader.publish", ...leader,
    toData: (i, mode) => ({
      ...pick(i, ["slug", "name", "photoId", "summary", "biography", "message", "responsibilities", "linkedinUrl", "facebookUrl", "instagramUrl", "xUrl"]),
      assignments: nested(i.assignments, mode),
      career: nested(i.career, mode),
      education: nested(i.education, mode),
    }),
    // A leader belongs to every company they hold a role in; group roles and
    // the chairman are group-level.
    owners: (item) => {
      if (item.isChairman === true) return [null];
      const list = Array.isArray(item.assignments) ? (item.assignments as { companyId: string | null }[]) : [];
      return list.length ? [...new Set(list.map((a) => a.companyId))] : [null];
    },
    slugFrom: "name", publicKey: "slug",
    include: {
      photo: image,
      assignments: { orderBy: { sortOrder: "asc" }, include: { company: { select: { id: true, name: true, slug: true } } } },
      career: { orderBy: { sortOrder: "asc" } },
      education: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ isChairman: "desc" }, { name: "asc" }],
    mediaIds: (i) => ids(i.photoId),
  },
} satisfies Record<string, ContentType>;

export type ContentTypeKey = keyof typeof CONTENT_TYPES;

export function contentType(key: string): ContentType | null {
  return Object.prototype.hasOwnProperty.call(CONTENT_TYPES, key) ? CONTENT_TYPES[key as ContentTypeKey] : null;
}

// Fields the public never sees.
const PRIVATE_FIELDS = new Set(["createdById", "updatedById", "approvedById", "authorId", "status", "createdAt", "updatedAt"]);

export function toPublic(row: Row): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !PRIVATE_FIELDS.has(key)));
}
