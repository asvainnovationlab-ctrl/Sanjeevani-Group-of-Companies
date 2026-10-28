import { notFound } from "next/navigation";
import SectionPage from "@/components/SectionPage";
import { businesses } from "@/data/businesses";
import { getCompanySlug } from "@/data/companyProfiles";

// Company profile pages live under /businesses/<slug>. Other sections have no
// sub-pages. Slugs not in the bundled list still render, so a company added
// through the admin directory gets a page too (CompanyProfile resolves it
// against /api/businesses on the client).
export function generateStaticParams() {
  return businesses.map((business) => ({ section: "businesses", slug: getCompanySlug(business.name) }));
}

export function generateMetadata({ params }: { params: { section: string; slug: string } }) {
  const business = businesses.find((item) => getCompanySlug(item.name) === params.slug);
  return { title: `${business?.name ?? "Our businesses"} | Sanjeevani Group of Companies` };
}

export default function CompanyPage({ params }: { params: { section: string; slug: string } }) {
  if (params.section !== "businesses") notFound();
  return <SectionPage section="businesses" companySlug={params.slug} />;
}
