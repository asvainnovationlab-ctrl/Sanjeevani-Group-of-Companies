"use client";

import Link from "next/link";

const mediaLinks = [
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Press Release", href: "/press-release" },
  { label: "Newsletter", href: "/newsletter" },
];

export default function MediaNavMenu({
  isCurrent = false,
  onNavigate,
}: {
  isCurrent?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="reference-nav-item media-nav-item">
      <Link
        className={isCurrent ? "is-current" : ""}
        href="/media"
        aria-haspopup="true"
        onClick={onNavigate}
      >
        Media <span className="reference-nav-chevron" aria-hidden="true">⌄</span>
      </Link>
      <div className="media-nav-dropdown">
        {mediaLinks.map((item) => (
          <Link href={item.href} key={item.href} onClick={onNavigate}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
