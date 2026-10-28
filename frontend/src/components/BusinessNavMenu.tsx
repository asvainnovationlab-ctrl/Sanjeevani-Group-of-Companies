"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { businessGroups, type Business } from "@/data/businesses";

// Full page loads on purpose: the Businesses page only reads ?group/?search
// on mount, so a client-side navigation from /businesses to itself wouldn't
// re-filter the directory.
function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  window.location.assign(href);
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
        onClick={(event) => navigate(event, "/businesses")}
      >
        Business <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <div className="nav-simple-dropdown">
        {businessGroups.map((category) => {
          const categoryHref = `/businesses?group=${category.value}`;
          const companies = businesses.filter(category.matches);
          return (
            <div className="nav-sub-item" key={category.value}>
              <Link
                className={companies.length ? "has-sub" : ""}
                href={categoryHref}
                aria-haspopup={companies.length ? "true" : undefined}
                onClick={(event) => navigate(event, categoryHref)}
              >
                {category.label}
              </Link>
              {companies.length > 0 && (
                <div className="nav-subflyout" aria-label={`${category.label} companies`}>
                  <span className="nav-subflyout-title">{category.label}</span>
                  {companies.map((business) => {
                    const companyHref = `${categoryHref}&search=${encodeURIComponent(business.name)}`;
                    return (
                      <Link href={companyHref} key={business._id} onClick={(event) => navigate(event, companyHref)}>
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
