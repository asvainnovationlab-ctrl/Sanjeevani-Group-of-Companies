import { revalidatePath } from "next/cache";
import { vacancies as sampleVacancies, type Vacancy } from "@/data/careers";
import { isDatabaseConfigured } from "@/server/db";
import { listPublicVacancies } from "@/server/recruitment/vacancies";
import { formatKathmandu } from "@/server/time";

// Vacancies for the public careers pages, in the shape the page components
// use. They come from the database (what HR publishes in /admin); only a
// local setup without a database falls back to the sample list in
// src/data/careers.ts. A database error shows no vacancies rather than
// samples that cannot be applied for.

const EMPLOYMENT: Record<string, string> = {
  FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship", TEMPORARY: "Temporary", VOLUNTEER: "Volunteer",
};
const PERIOD: Record<string, string> = { HOUR: "per hour", DAY: "per day", MONTH: "per month", YEAR: "per year" };
const npr = (n: number) => new Intl.NumberFormat("en-IN").format(n);

type PublicVacancy = Awaited<ReturnType<typeof listPublicVacancies>>[number];

export function toSiteVacancy(v: PublicVacancy): Vacancy | null {
  if (!v.careerArea) return null; // the careers pages are organised by area
  const age = v.minAge && v.maxAge ? `${v.minAge}-${v.maxAge} years` : v.minAge ? `${v.minAge} years or older` : v.maxAge ? `Up to ${v.maxAge} years` : "";
  const s = v.salary;
  const salary = !s
    ? ""
    : s.min !== null && s.max !== null
      ? `${s.currency} ${npr(s.min)} - ${npr(s.max)} ${PERIOD[s.period] ?? ""}`.trim()
      : s.min !== null || s.max !== null
        ? `${s.min === null ? "Up to" : "From"} ${s.currency} ${npr((s.min ?? s.max)!)} ${PERIOD[s.period] ?? ""}`.trim()
        : s.note ?? "";
  return {
    id: v.slug,
    areaSlug: v.careerArea.slug,
    title: v.title,
    company: v.company.name,
    location: v.location,
    employmentType: EMPLOYMENT[v.employmentType] ?? v.employmentType,
    openings: v.openings,
    deadline: v.deadline ? formatKathmandu(new Date(v.deadline)) : "Open until filled",
    summary: v.summary,
    education: v.requiredEducation,
    experience: v.requiredExperience,
    skills: v.skills,
    ageRange: age,
    salary,
  };
}

export async function loadSiteVacancies(): Promise<Vacancy[]> {
  if (!isDatabaseConfigured()) return sampleVacancies;
  try {
    const rows = await listPublicVacancies();
    return rows.filter((v) => v.acceptingApplications).map(toSiteVacancy).filter((v): v is Vacancy => v !== null);
  } catch (error) {
    console.error("Could not load vacancies:", error instanceof Error ? error.message.split("\n")[0] : error);
    return [];
  }
}

// After a vacancy is published, edited, closed or archived, drop the cached
// careers pages so visitors see the change at once instead of up to a minute
// later. The site is small, so clearing every cached page is cheap.
export function refreshCareerPages() {
  try {
    revalidatePath("/", "layout");
  } catch (error) {
    // Outside a request (e.g. a script) there is no cache to clear.
    console.warn("Page cache not refreshed:", error instanceof Error ? error.message : error);
  }
}
