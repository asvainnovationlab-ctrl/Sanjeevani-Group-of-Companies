"use client";

import Link from "next/link";

const aboutLinks = [
  { label: "Mission, Vision & Values", href: "/mission-vision-values" },
  { label: "Leadership", href: "/leadership" },
];

export default function AboutNavMenu({ isCurrent = false }: { isCurrent?: boolean }) {
  return (
    <div className="reference-nav-item about-nav-item">
      <Link
        className={isCurrent ? "is-current" : ""}
        href="/about-us"
        aria-haspopup="true"
        aria-expanded="false"
        onClick={(event) => {
          event.preventDefault();
          window.location.assign("/about-us");
        }}
      >
        About us <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <div className="nav-simple-dropdown">
        {aboutLinks.map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </div>
    </div>
  );
}
