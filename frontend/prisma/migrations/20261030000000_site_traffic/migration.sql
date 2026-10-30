-- CreateTable
CREATE TABLE "SiteTrafficDay" (
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteTrafficDay_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "SiteVisitorDay" (
    "day" DATE NOT NULL,
    "visitorHash" TEXT NOT NULL,

    CONSTRAINT "SiteVisitorDay_pkey" PRIMARY KEY ("day","visitorHash")
);

-- CreateTable
CREATE TABLE "SitePageDay" (
    "day" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SitePageDay_pkey" PRIMARY KEY ("day","path")
);

-- CreateIndex
CREATE INDEX "SitePageDay_day_idx" ON "SitePageDay"("day");

