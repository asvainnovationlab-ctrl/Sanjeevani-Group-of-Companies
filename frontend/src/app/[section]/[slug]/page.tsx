import { notFound } from "next/navigation";
import SectionPage from "@/components/SectionPage";
import { businesses } from "@/data/businesses";
import { getCompanySlug } from "@/data/companyProfiles";
import { allLeaders, getLeader } from "@/data/leaders";
import { careerAreas, getCareerArea } from "@/data/careers";

// Sub-pages under two sections:
//   /businesses/<slug>  company profiles. Slugs not in the bundled list still
//                       render, so a company added through the admin directory
//                       gets a page too (CompanyProfile resolves it against
//                       /api/businesses on the client).
//   /leadership/<slug>  leader profiles (the chairman keeps /chairman).
//   /careers/<slug>     a career area's vacancies and the application form.
export function generateStaticParams() {
  return [
    ...businesses.map((business) => ({ section: "businesses", slug: getCompanySlug(business.name) })),
    ...careerAreas.map((area) => ({ section: "careers", slug: area.slug })),
    ...allLeaders.filter((leader) => leader.slug !== "chairman").map((leader) => ({ section: "leadership", slug: leader.slug })),
  ];
}

export function generateMetadata({ params }: { params: { section: string; slug: string } }) {
  if (params.section === "leadership") {
    const leader = getLeader(params.slug);
    return { title: `${leader ? `${leader.name}, ${leader.role}` : "Our leadership"} | Sanjeevani Group of Companies` };
  }
  if (params.section === "careers") {
    const area = getCareerArea(params.slug);
    return { title: `${area ? `${area.title} vacancies` : "Careers"} | Sanjeevani Group of Companies` };
  }
  const business = businesses.find((item) => getCompanySlug(item.name) === params.slug);
  return { title: `${business?.name ?? "Our businesses"} | Sanjeevani Group of Companies` };
}

export default function SubPage({ params }: { params: { section: string; slug: string } }) {
  if (params.section === "businesses") return <SectionPage section="businesses" companySlug={params.slug} />;
  if (params.section === "leadership") {
    const leader = getLeader(params.slug);
    if (!leader || leader.slug === "chairman") notFound();
    return <SectionPage section="leadership" leaderSlug={params.slug} />;
  }
  if (params.section === "careers") {
    if (!getCareerArea(params.slug)) notFound();
    return <SectionPage section="careers" careerAreaSlug={params.slug} />;
  }
  notFound();
}
