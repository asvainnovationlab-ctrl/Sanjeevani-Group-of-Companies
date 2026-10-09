"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { businessGroups, type Business } from "@/data/businesses";

function CategoryIcon({ category }: { category: string }) {
  const paths: Record<string, ReactNode> = {
    healthcare: <><path d="M12 21s-8-4.6-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.4-8 11-8 11Z" /><path d="M12 8v7m-3.5-3.5h7" /></>,
    "medical-colleges": <><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6" /></>,
    education: <><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6" /></>,
    agriculture: <><path d="M12 21V11" /><path d="M12 14c-5 0-8-3-8-8 5 0 8 3 8 8Zm0-3c0-5 3-8 8-8 0 5-3 8-8 8Z" /></>,
    infrastructure: <><rect x="3" y="10" width="18" height="10" rx="1" /><path d="M2 20h20M7 10V6h10v4M10 6V3h4v3M7 14h.01M12 14h.01M17 14h.01" /></>,
    "business-services": <><path d="M4 7h16v13H4zM8 7V4h8v3M4 12h16M10 12v2h4v-2" /></>,
    other: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="9" y="14" width="6" height="6" rx="1" /><path d="M10 7h4m-2 3v4" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[category]}
    </svg>
  );
}

export default function BusinessNavMenu({
  businesses,
  isCurrent = false,
}: {
  businesses: Business[];
  isCurrent?: boolean;
}) {
  return (
    <div className="reference-nav-item">
      <Link
        className={isCurrent ? "is-current" : ""}
        href="/businesses"
        aria-haspopup="true"
        aria-expanded="false"
        onClick={(event) => {
          event.preventDefault();
          window.location.assign("/businesses");
        }}
      >
        Business <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <div className="business-nav-dropdown">
        <div className="business-nav-map">
          <Image src="/nepal-outline.svg" alt="" width={700} height={300} />
          <Link className="business-nav-map-pin" href="/#locations" aria-label="Kathmandu main office. View Sanjeevani Group locations in Nepal">
            <span />
          </Link>
          <span className="business-nav-map-label"><strong>KATHMANDU</strong> · MAIN OFFICE</span>
        </div>
        <div className="business-nav-location">
          <span className="business-nav-eyebrow">ROOTED IN NEPAL</span>
          <h2>Growing across<br /><em>the country.</em></h2>
          <p>Discover Sanjeevani Group businesses and the places we call home.</p>
          <Link className="business-nav-location-link" href="/#locations">
            <span className="business-nav-live-dot" />
            Explore our locations <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="business-nav-categories">
          <span className="business-nav-eyebrow">EXPLORE OUR BUSINESSES</span>
          <div className="business-nav-category-grid">
            {businessGroups.map((category) => {
              const categoryBusinesses = businesses.filter(category.matches);
              const categoryHref = `/businesses?group=${category.value}`;

              return (
                <section className="business-nav-category-group" key={category.value}>
                  <Link
                    className="business-nav-category"
                    href={categoryHref}
                    onClick={(event) => {
                      event.preventDefault();
                      window.location.assign(categoryHref);
                    }}
                  >
                    <span className="business-nav-category-icon"><CategoryIcon category={category.value} /></span>
                    <span className="business-nav-category-copy">
                      <strong>{category.label}</strong>
                      <small>{category.detail}</small>
                    </span>
                    <span className="business-nav-category-arrow" aria-hidden="true">↗</span>
                  </Link>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
