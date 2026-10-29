import { notFound } from "next/navigation";
import SectionPage from "@/components/SectionPage";
import { getCareerArea, vacancies } from "@/data/careers";

// /careers/<area-slug>/<vacancy-id>: one vacancy's detail page.
export function generateStaticParams() {
  return vacancies.map((vacancy) => ({ section: "careers", slug: vacancy.areaSlug, item: vacancy.id }));
}

export function generateMetadata({ params }: { params: { section: string; slug: string; item: string } }) {
  const vacancy = vacancies.find((entry) => entry.id === params.item && entry.areaSlug === params.slug);
  return { title: `${vacancy ? `${vacancy.title}, ${vacancy.company}` : "Careers"} | Sanjeevani Group of Companies` };
}

export default function VacancyPage({ params }: { params: { section: string; slug: string; item: string } }) {
  if (params.section !== "careers" || !getCareerArea(params.slug)) notFound();
  if (!vacancies.some((entry) => entry.id === params.item && entry.areaSlug === params.slug)) notFound();
  return <SectionPage section="careers" careerAreaSlug={params.slug} vacancyId={params.item} />;
}
