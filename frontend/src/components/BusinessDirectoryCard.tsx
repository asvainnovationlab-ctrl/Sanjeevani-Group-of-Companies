"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Business, BusinessCategory } from "@/data/businesses";

const businessLogos: Record<string, string> = {
  "janakpur agro": "/companylogo/janakpur agro farm limited.jpeg",
  "khilung kalika agro": "/companylogo/khilung kalika agro farm pvt ltd.jpeg",
  "khilung kalika construction": "/companylogo/khilung kalika construction.webp",
  "khilung kalika foods": "/companylogo/khilung kalika food limited.jpeg",
  "khilung kalika marketing": "/companylogo/khilung kalika marketing.jpeg",
  "khilung kalika suppliers": "/companylogo/khilung kalika general trading.jpeg",
  "laughing budha hydro power": "/companylogo/lord buddha.jpeg",
  "mount everest school": "/companylogo/Mount-Everest-Boarding-School.png",
  "nepalgunj medical college": "/companylogo/nepalgunj medical college.png",
  "om agro": "/companylogo/om agro pvt ltd.jpeg",
  "sanjeevani hospital, nepalgunj": "/companylogo/sanjevani hospital nepalgunj.png",
  "sanjeevani hospital, pokhara": "/companylogo/sanjevani hospital logo.png",
  "sanjeevani institute of advance science and teaching hospital": "/companylogo/sanjeevani institute of advanced studeis and teaching hospital.jpg",
  "sanjeevani developers": "/companylogo/sanjevani debelopers.jpg",
  "gandaki medical college": "/companylogo/gandaki medical college.png",
  "universal medical college": "/companylogo/universal college of medical science.jpeg",
};

function BusinessArt({ business }: { business: Business }) {
  const initial = business.name.trim().charAt(0).toUpperCase();
  const [logoFailed, setLogoFailed] = useState(false);
  const logo = businessLogos[business.name.trim().toLowerCase()];
  const colors: Record<BusinessCategory, string> = {
    healthcare: "monogram-health",
    education: "monogram-education",
    agriculture: "monogram-agriculture",
    other: "monogram-other",
  };

  return (
    <div className="business-logo">
      {logo && !logoFailed ? (
        <Image
          className="business-logo-image"
          src={logo}
          alt={`${business.name} logo`}
          fill
          sizes="150px"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div aria-hidden="true">
          <span className={`business-monogram ${colors[business.category]}`}>{initial}</span>
          <span className="business-logo-caption">SANJEEVANI GROUP</span>
        </div>
      )}
    </div>
  );
}

export default function BusinessDirectoryCard({
  business,
  index,
}: {
  business: Business;
  index: number;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const website = business.website?.trim() ?? "";
  const location = business.location?.trim() ?? "";
  let websiteUrl: string | undefined;

  if (website) {
    try {
      const parsedWebsite = new URL(/^[a-z][a-z\d+.-]*:/i.test(website) ? website : `https://${website}`);
      if (parsedWebsite.protocol === "http:" || parsedWebsite.protocol === "https:") {
        websiteUrl = parsedWebsite.href;
      }
    } catch {
      websiteUrl = undefined;
    }
  }

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      className={`directory-card${isVisible ? " is-visible" : ""}`}
      style={{ transitionDelay: `${Math.min(index * 65, 390)}ms` }}
    >
      <div className="business-directory-card-top">
        <BusinessArt business={business} />
        <span className="directory-card-sector">{business.sector}</span>
      </div>
      <h3>{business.name}</h3>
      <dl className="directory-card-details">
        <div className="directory-location">
          <dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></dt>
          <dd title={location || "Location details coming soon"}>{location || "Location details coming soon"}</dd>
        </div>
        <div className="directory-website">
          <dt><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg></dt>
          <dd title={websiteUrl ? website : "Website"}>{websiteUrl
            ? <a href={websiteUrl} target="_blank" rel="noreferrer">Website</a>
            : <span className="directory-website-unavailable">Website</span>}
          </dd>
        </div>
      </dl>
    </article>
  );
}
