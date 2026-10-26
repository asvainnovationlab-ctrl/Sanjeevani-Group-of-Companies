"use client";

import Image from "next/image";
import Link from "next/link";
import GroupEmblem from "@/components/GroupEmblem";

const aboutLinks = [
  {
    label: "Mission, Vision & Values",
    description: "The principles and ambition behind our work.",
    href: "/mission-vision-values",
    image: "/education.jpg",
    imageAlt: "Sanjeevani Group education campus",
  },
  {
    label: "Our Story",
    description: "How our shared purpose has grown over time.",
    href: "/our-story",
    image: "/agro.jpg",
    imageAlt: "Sanjeevani Group agriculture fields",
  },
  {
    label: "Leadership",
    description: "Meet the people guiding Sanjeevani Group.",
    href: "/leadership",
    image: "/khumaa.jpeg",
    imageAlt: "Sanjeevani Group chairman",
  },
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
      <div className="about-nav-dropdown">
        <Link className="about-nav-brand-card" href="/about-us" aria-label="Discover Sanjeevani Group">
          <span className="about-nav-emblem"><GroupEmblem /></span>
          <span className="about-nav-brand-name">Sanjeevani Group</span>
          <span className="about-nav-brand-subtitle">ONE HORIZON, MANY AMBITIONS</span>
          <span className="about-nav-brand-description">
            A family of independent businesses, growing together with Nepal.
          </span>
          <span className="about-nav-learn-more">Discover our group <span aria-hidden="true">↗</span></span>
        </Link>
        <div className="about-nav-links">
          <span className="business-nav-eyebrow">GET TO KNOW US</span>
          <div className="about-nav-link-list">
            {aboutLinks.map((item) => (
              <Link className="about-nav-link" href={item.href} key={item.href}>
                <span className="about-nav-link-image">
                  <Image src={item.image} alt={item.imageAlt} width={128} height={88} />
                </span>
                <span className="about-nav-link-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <span className="about-nav-link-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
