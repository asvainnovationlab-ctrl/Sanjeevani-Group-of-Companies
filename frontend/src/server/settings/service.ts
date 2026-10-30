import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import type { SessionUser } from "@/server/auth/session";

// Site-wide settings. Only the keys below exist; each has its own validation.
// All of them are public information shown on the website.

const httpsUrl = z.string().trim().url().refine((v) => v.startsWith("https://"), "Use an https:// link.");

export const SETTINGS = {
  "contact.email": z.string().trim().email(),
  "contact.phone": z.string().trim().max(40),
  "contact.address": z.string().trim().max(300),
  "social.facebook": httpsUrl,
  "social.youtube": httpsUrl,
  "social.linkedin": httpsUrl,
  "social.instagram": httpsUrl,
  "seo.defaultTitle": z.string().trim().max(70),
  "seo.defaultDescription": z.string().trim().max(160),
  "careers.applicationsOpen": z.boolean(),
} as const;

export type SettingKey = keyof typeof SETTINGS;

// { key: value | null } — null removes the setting (the site falls back to its default).
export const settingsUpdateSchema = z
  .record(z.unknown())
  .superRefine((value, ctx) => {
    for (const [key, raw] of Object.entries(value)) {
      if (!(key in SETTINGS)) { ctx.addIssue({ code: "custom", path: [key], message: `Unknown setting "${key}".` }); continue; }
      if (raw === null) continue;
      const parsed = SETTINGS[key as SettingKey].safeParse(raw);
      if (!parsed.success) ctx.addIssue({ code: "custom", path: [key], message: `${key}: ${parsed.error.issues[0]?.message}` });
    }
  });

export async function getSettings(): Promise<Partial<Record<SettingKey, unknown>>> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.keys(SETTINGS) } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function updateSettings(user: SessionUser, input: Record<string, unknown>, meta: { ipHash: string; userAgent: string | null }) {
  const before = await getSettings();
  await prisma.$transaction(async (tx) => {
    for (const [key, raw] of Object.entries(input)) {
      if (raw === null) {
        await tx.siteSetting.deleteMany({ where: { key } });
      } else {
        const value = SETTINGS[key as SettingKey].parse(raw) as Prisma.InputJsonValue;
        await tx.siteSetting.upsert({ where: { key }, create: { key, value, updatedById: user.id }, update: { value, updatedById: user.id } });
      }
    }
    await recordAudit({
      actorId: user.id, action: "settings.update", entityType: "SiteSetting",
      metadata: { before: Object.fromEntries(Object.keys(input).map((k) => [k, (before as Record<string, unknown>)[k] ?? null])), after: input } as Prisma.InputJsonValue,
      ...meta,
    }, tx);
  });
  return getSettings();
}
