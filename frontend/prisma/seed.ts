// Seeds PostgreSQL from the content that currently lives in src/data/*.ts.
//
// - Idempotent: every write is an upsert on a unique key, so running it again
//   updates nothing that an editor has since changed in the CMS (existing rows
//   are left as they are; only missing rows are created).
// - Honest about samples: vacancies, newsroom items, gallery content and
//   placeholder leaders are seeded as DRAFT so nothing invented is published.
//   Real, already-public content (companies, FAQs, the chairman) is PUBLISHED.
//
// Run: npm run db:seed   (needs DATABASE_URL)

import { PrismaClient, type Prisma } from "@prisma/client";
import { businesses, businessGroups } from "../src/data/businesses";
import { getBusinessLogo } from "../src/data/businessLogos";
import { careerAreas, vacancies } from "../src/data/careers";
import { companyProfiles, getCompanySlug, sectorImages } from "../src/data/companyProfiles";
import { faqs } from "../src/data/faqs";
import { allLeaders, leadershipBoard } from "../src/data/leaders";
import { companyNotices, galleryPhotos, latestEvents, latestPressReleases, youtubeVideos } from "../src/data/newsroom";
import { PERMISSIONS, SYSTEM_ROLES } from "../src/server/auth/permissions";
import {
  guessMimeType,
  isPlaceholder,
  localMediaKey,
  parseAgeRange,
  parseMonthYear,
  slugify,
  toCompanyCategory,
  toEmploymentType,
} from "./seed-helpers";

const prisma = new PrismaClient();
const counts: Record<string, number> = {};
const bump = (key: string) => (counts[key] = (counts[key] ?? 0) + 1);

async function media(url: string | undefined | null, altText?: string) {
  if (!url) return null;
  const storageKey = localMediaKey(url);
  const asset = await prisma.mediaAsset.upsert({
    where: { storageKey },
    update: {},
    create: { provider: "LOCAL", storageKey, url, kind: guessMimeType(storageKey).startsWith("video/") ? "VIDEO" : "IMAGE", mimeType: guessMimeType(storageKey), altText },
  });
  bump("media");
  return asset.id;
}

async function seedAccessControl() {
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
  }
  const permissionRows = await prisma.permission.findMany();
  const permissionId = new Map(permissionRows.map((row) => [row.key, row.id]));
  for (const [key, role] of Object.entries(SYSTEM_ROLES)) {
    const row = await prisma.role.upsert({
      where: { key },
      update: { name: role.name, description: role.description },
      create: { key, name: role.name, description: role.description, isSystem: true },
    });
    // System roles always match the catalogue exactly.
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: row.id } }),
      prisma.rolePermission.createMany({
        data: role.permissions.map((permission) => ({ roleId: row.id, permissionId: permissionId.get(permission)! })),
      }),
    ]);
    bump("roles");
  }
}

async function seedCompanies(groupId: string) {
  const sectorIds = new Map<string, string>();
  for (const [index, group] of businessGroups.entries()) {
    const imageId = await media(sectorImages[group.value], group.label);
    const sector = await prisma.sector.upsert({
      where: { slug: group.value },
      update: {},
      create: { slug: group.value, name: group.label, detail: group.detail, imageId, sortOrder: index },
    });
    sectorIds.set(group.value, sector.id);
    bump("sectors");
  }

  const companyIds = new Map<string, string>();
  for (const business of businesses) {
    const profile = companyProfiles[business.name];
    const group = businessGroups.find((item) => item.matches(business));
    const established = profile && !isPlaceholder(profile.established) ? Number.parseInt(profile.established, 10) : NaN;
    const data: Prisma.CompanyUncheckedCreateInput = {
      groupId,
      sectorId: group ? sectorIds.get(group.value) : undefined,
      name: business.name,
      slug: getCompanySlug(business.name),
      category: toCompanyCategory(business.category),
      sectorLabel: business.sector,
      description: business.description,
      website: business.website || null,
      email: profile?.email || null,
      phone: profile?.phone || null,
      establishedYear: Number.isFinite(established) ? established : null,
      logoId: await media(getBusinessLogo(business.name), `${business.name} logo`),
      bannerId: await media(profile?.photo, business.name),
      sortOrder: business.order,
      status: business.published ? "PUBLISHED" : "DRAFT",
      publishedAt: business.published ? new Date() : null,
    };
    const company = await prisma.company.upsert({ where: { slug: data.slug }, update: {}, create: data });
    companyIds.set(business.name, company.id);
    if (business.location && (await prisma.location.count({ where: { companyId: company.id } })) === 0) {
      await prisma.location.create({ data: { companyId: company.id, name: "Main office", addressLine: business.location, isPrimary: true } });
      bump("locations");
    }
    bump("companies");
  }
  return companyIds;
}

async function seedLeaders() {
  const boardSlugs = new Set(leadershipBoard.map((leader) => leader.slug));
  for (const [index, leader] of allLeaders.entries()) {
    const isPlaceholderPerson = leader.name === "Leader Name";
    const row = await prisma.leader.upsert({
      where: { slug: leader.slug },
      update: {},
      create: {
        slug: leader.slug,
        name: leader.name,
        photoId: await media(leader.photo, `Portrait of ${leader.name}`),
        isChairman: leader.slug === "chairman",
        status: isPlaceholderPerson ? "DRAFT" : "PUBLISHED",
        publishedAt: isPlaceholderPerson ? null : new Date(),
        message: [],
        responsibilities: [],
      },
    });
    if ((await prisma.leaderAssignment.count({ where: { leaderId: row.id, companyId: null } })) === 0) {
      await prisma.leaderAssignment.create({
        data: { leaderId: row.id, title: leader.role, tier: boardSlugs.has(leader.slug) ? "BOARD" : "TEAM", sortOrder: index },
      });
    }
    bump("leaders");
  }
}

async function seedRecruitment(companyIds: Map<string, string>) {
  const areaIds = new Map<string, string>();
  for (const [index, area] of careerAreas.entries()) {
    const row = await prisma.careerArea.upsert({
      where: { slug: area.slug },
      update: {},
      create: { slug: area.slug, title: area.title, type: area.type, imageId: await media(area.image, area.title), sortOrder: index },
    });
    areaIds.set(area.slug, row.id);
    for (const [order, name] of area.companyNames.entries()) {
      const companyId = companyIds.get(name);
      if (!companyId) throw new Error(`Career area "${area.title}" lists unknown company "${name}".`);
      await prisma.careerAreaCompany.upsert({
        where: { careerAreaId_companyId: { careerAreaId: row.id, companyId } },
        update: {},
        create: { careerAreaId: row.id, companyId, sortOrder: order },
      });
    }
    bump("careerAreas");
  }

  for (const [index, vacancy] of vacancies.entries()) {
    const companyId = companyIds.get(vacancy.company);
    if (!companyId) throw new Error(`Vacancy "${vacancy.id}" names unknown company "${vacancy.company}".`);
    const age = parseAgeRange(vacancy.ageRange);
    await prisma.vacancy.upsert({
      where: { slug: vacancy.id },
      update: {},
      create: {
        slug: vacancy.id,
        referenceCode: `SG-V-${String(index + 1).padStart(4, "0")}`,
        companyId,
        careerAreaId: areaIds.get(vacancy.areaSlug),
        locationText: vacancy.location,
        title: vacancy.title,
        summary: vacancy.summary,
        requiredEducation: vacancy.education,
        requiredExperience: vacancy.experience,
        skills: vacancy.skills,
        qualifications: [vacancy.education],
        responsibilities: [],
        requiredDocuments: ["CV"],
        employmentType: toEmploymentType(vacancy.employmentType),
        openings: vacancy.openings,
        minAge: age.min,
        maxAge: age.max,
        // Sample vacancies stay DRAFT until HR replaces them with real ones.
        status: vacancy.sample ? "DRAFT" : "PUBLISHED",
        publishedAt: vacancy.sample ? null : new Date(),
      },
    });
    bump(vacancy.sample ? "vacancies (draft samples)" : "vacancies");
  }
}

async function seedContent(companyIds: Map<string, string>) {
  for (const [index, faq] of faqs.entries()) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.faq.create({ data: { question: faq.question, answer: faq.answer, sortOrder: index, status: "PUBLISHED", publishedAt: new Date() } });
    }
    bump("faqs");
  }

  // The newsroom data files are marked as samples to replace: seed as DRAFT.
  for (const story of latestPressReleases) {
    const slug = slugify(story.title);
    await prisma.newsArticle.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        type: "PRESS_RELEASE",
        title: story.title,
        excerpt: story.summary,
        coverImageId: await media(story.image, story.alt),
        body: story.link ? { type: "external", url: story.link } : undefined,
        status: "DRAFT",
        publishAt: parseMonthYear(story.date),
      },
    });
    bump("news (draft samples)");
  }
  for (const story of latestEvents) {
    const slug = slugify(story.title);
    await prisma.event.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: story.title,
        summary: story.summary,
        coverImageId: await media(story.image, story.alt),
        startsAt: parseMonthYear(story.date) ?? new Date(),
        status: "DRAFT",
      },
    });
    bump("events (draft samples)");
  }
  for (const notice of companyNotices) {
    const exists = await prisma.notice.findFirst({ where: { title: notice.title } });
    if (!exists) {
      await prisma.notice.create({
        data: { title: notice.title, noticeDate: parseMonthYear(notice.date) ?? new Date(), companyId: companyIds.get(notice.company) ?? null, status: "DRAFT" },
      });
    }
    bump("notices (draft samples)");
  }
  for (const [index, video] of youtubeVideos.entries()) {
    const exists = await prisma.video.findFirst({ where: { url: video.url, placement: "NEWSROOM_YOUTUBE", sortOrder: index } });
    if (!exists) {
      await prisma.video.create({
        data: { title: video.title, provider: "YOUTUBE", url: video.url, thumbnailId: await media(video.thumbnail), placement: "NEWSROOM_YOUTUBE", sortOrder: index, status: "DRAFT" },
      });
    }
    bump("videos (draft samples)");
  }
  const gallery = await prisma.gallery.upsert({
    where: { slug: "newsroom" },
    update: {},
    create: { slug: "newsroom", title: "Newsroom gallery", status: "DRAFT" },
  });
  if ((await prisma.galleryItem.count({ where: { galleryId: gallery.id } })) === 0) {
    for (const [index, photo] of galleryPhotos.entries()) {
      await prisma.galleryItem.create({
        data: { galleryId: gallery.id, mediaId: (await media(photo.src, photo.alt))!, caption: photo.caption, altText: photo.alt, sortOrder: index },
      });
      bump("gallery photos (draft)");
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  await seedAccessControl();
  const group = await prisma.group.upsert({
    where: { slug: "sanjeevani-group" },
    update: {},
    create: { name: "Sanjeevani Group of Companies", slug: "sanjeevani-group", tagline: "One horizon, many ambitions" },
  });
  const companyIds = await seedCompanies(group.id);
  await seedLeaders();
  await seedRecruitment(companyIds);
  await seedContent(companyIds);
  console.table(counts);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
