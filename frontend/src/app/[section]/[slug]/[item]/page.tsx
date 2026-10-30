import { notFound } from "next/navigation";
import SectionPage from "@/components/SectionPage";
import { getCareerArea } from "@/data/careers";
import { loadSiteVacancies } from "@/server/public/vacancies";

// /careers/<area-slug>/<vacancy-slug>: one vacancy's detail page. Vacancies
// come from the database, so pages are rendered on request and refreshed
// at most once a minute.
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { section: string; slug: string; item: string } }) {
  const vacancy = (await loadSiteVacancies()).find((entry) => entry.id === params.item && entry.areaSlug === params.slug);
  return { title: `${vacancy ? `${vacancy.title}, ${vacancy.company}` : "Careers"} | Sanjeevani Group of Companies` };
}

export default async function VacancyPage({ params }: { params: { section: string; slug: string; item: string } }) {
  if (params.section !== "careers" || !getCareerArea(params.slug)) notFound();
  const siteVacancies = await loadSiteVacancies();
  if (!siteVacancies.some((entry) => entry.id === params.item && entry.areaSlug === params.slug)) notFound();
  return <SectionPage section="careers" careerAreaSlug={params.slug} vacancyId={params.item} siteVacancies={siteVacancies} />;
}
