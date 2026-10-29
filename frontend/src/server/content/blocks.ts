import { z } from "zod";

// Rich text is stored as structured blocks of plain text, never HTML. React
// escapes text when rendering, so stored content cannot inject scripts.

const text = (max: number) => z.string().trim().min(1).max(max);

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: text(5000) }),
  z.object({ type: z.literal("heading"), text: text(200), level: z.union([z.literal(2), z.literal(3)]).default(2) }),
  z.object({ type: z.literal("list"), ordered: z.boolean().default(false), items: z.array(text(1000)).min(1).max(50) }),
  z.object({ type: z.literal("quote"), text: text(2000), cite: z.string().trim().max(200).optional() }),
  z.object({ type: z.literal("image"), mediaId: z.string().uuid(), caption: z.string().trim().max(300).optional() }),
  z.object({ type: z.literal("link"), text: text(200), href: z.string().trim().max(500).refine(isSafeHref, "Links must start with https:// or /.") }),
]);

export const blocksSchema = z.array(blockSchema).max(200);
export type Block = z.infer<typeof blockSchema>;

// Internal paths ("/careers") or http(s) URLs only: no javascript:, data: etc.
export function isSafeHref(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const hrefSchema = z.string().trim().max(500).refine(isSafeHref, "Links must start with https:// or /.");

// Image ids referenced inside blocks, so they can be checked to exist.
export function blockMediaIds(blocks: Block[] | null | undefined): string[] {
  return (blocks ?? []).flatMap((block) => (block.type === "image" ? [block.mediaId] : []));
}
