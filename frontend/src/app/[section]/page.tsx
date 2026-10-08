import { notFound } from "next/navigation";
import SectionPage from "@/components/SectionPage";

const sectionSlugs = [
  "our-story",
  "about-us",
  "businesses",
  "media",
  "investors",
  "community",
  "careers",
  "contact",
  "faq",
  "privacy-policy",
  "terms-of-use",
  "accessibility",
  "sitemap",
];

export function generateStaticParams() {
  return sectionSlugs.map((section) => ({ section }));
}

export function generateMetadata({ params }: { params: { section: string } }) {
  const titles: Record<string, string> = {
    "our-story": "Our story",
    "about-us": "About us",
    businesses: "Our businesses",
    media: "Media and updates",
    investors: "Investor information",
    community: "Our community",
    careers: "Careers",
    contact: "Contact",
    faq: "Frequently asked questions",
    "privacy-policy": "Privacy policy",
    "terms-of-use": "Terms of use",
    accessibility: "Accessibility",
    sitemap: "Sitemap",
  };
  const title = titles[params.section];
  return title
    ? { title: `${title} | Sanjeevani Group of Companies` }
    : { title: "Page not found | Sanjeevani Group" };
}

export default function GroupSectionPage({
  params,
}: {
  params: { section: string };
}) {
  if (!sectionSlugs.includes(params.section)) notFound();
  return <SectionPage section={params.section} />;
}
