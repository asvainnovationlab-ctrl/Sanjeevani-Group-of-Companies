"use client";

import { useEffect, useRef, useState } from "react";
import type { Business, BusinessCategory } from "@/data/businesses";

function BusinessArt({ business }: { business: Business }) {
  const initial = business.name.trim().charAt(0).toUpperCase();
  const colors: Record<BusinessCategory, string> = {
    healthcare: "monogram-health",
    education: "monogram-education",
    agriculture: "monogram-agriculture",
    other: "monogram-other",
  };

  return (
    <div className="business-logo" aria-hidden="true">
      <span className={`business-monogram ${colors[business.category]}`}>{initial}</span>
      <span className="business-logo-caption">SANJEEVANI GROUP</span>
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
      <BusinessArt business={business} />
      <span className="directory-card-sector">{business.sector}</span>
      <h3>{business.name}</h3>
      <dl className="directory-card-details">
        <div>
          <dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></dt>
          <dd title={location || "Location"}>{location || "Location"}</dd>
        </div>
        <div>
          <dt><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg></dt>
          <dd title={website || "Website"}>{websiteUrl
            ? <a href={websiteUrl} target="_blank" rel="noreferrer">{website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</a>
            : "Website"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
