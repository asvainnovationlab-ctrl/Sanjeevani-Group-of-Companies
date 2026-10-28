"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { businessGroups, type Business } from "@/data/businesses";

// Full page loads on purpose: the Careers page only reads ?company on mount,
// so a client-side navigation from /careers to itself wouldn't re-filter it.
function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  window.location.assign(href);
}

export default function CareersNavMenu({
  businesses,
  isCurrent = false,
}: {
  businesses: Business[];
  isCurrent?: boolean;
}) {
  return (
    <div className="reference-nav-item careers-nav-item">
      <Link
        className={isCurrent ? "is-current" : ""}
        href="/careers"
        aria-haspopup="true"
        aria-expanded="false"
        onClick={(event) => navigate(event, "/careers")}
      >
        Careers <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <div className="nav-simple-dropdown">
        {businessGroups.map((category) => {
          const companies = businesses.filter(category.matches);
          return (
            <div className="nav-sub-item" key={category.value}>
              <Link
                className={companies.length ? "has-sub" : ""}
                href="/careers"
                aria-haspopup={companies.length ? "true" : undefined}
                onClick={(event) => navigate(event, "/careers")}
              >
                {category.label}
              </Link>
              {companies.length > 0 && (
                <div className="nav-subflyout" aria-label={`${category.label} companies`}>
                  <span className="nav-subflyout-title">{category.label}</span>
                  {companies.map((business) => {
                    const href = `/careers?company=${encodeURIComponent(business.name)}`;
                    return (
                      <Link href={href} key={business._id} onClick={(event) => navigate(event, href)}>
                        {business.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
