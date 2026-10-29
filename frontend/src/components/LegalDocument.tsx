"use client";

import Link from "next/link";
import { type MouseEvent, type ReactNode, useState } from "react";

type LegalKind = "privacy-policy" | "terms-of-use" | "faq";

// Clause headings, one per paragraph in SectionPage's pageContent, in order.
// Each names what its paragraph already says; the paragraph text itself is
// rendered exactly as written.
const clauseTitles: Record<LegalKind, string[]> = {
  "privacy-policy": [
    "Directory searches",
    "The business directory",
    "Email enquiries",
    "Links to Google Maps",
    "The embedded map",
    "Tracking and hosting",
    "Questions about privacy",
  ],
  "terms-of-use": [
    "Information on this website",
    "No offer or advice",
    "Acceptable use",
    "Third-party links",
    "Questions about these terms",
  ],
  // The FAQ passes its own questions as `titles`.
  faq: [],
};

const otherDocument: Record<LegalKind, { label: string; href: string }> = {
  "privacy-policy": { label: "Read the terms of use", href: "/terms-of-use" },
  "terms-of-use": { label: "Read the privacy policy", href: "/privacy-policy" },
  faq: { label: "Read the privacy policy", href: "/privacy-policy" },
};

const contactEmail = "info@sanjeevanigroup.com";

// Turns the plain-text email address in a clause into a mailto link.
function withEmailLinks(text: string): ReactNode[] {
  return text.split(/(\S+@\S+\.[a-z]{2,})/i).map((part, index) =>
    /\S+@\S+\.[a-z]{2,}/i.test(part) ? (
      <a key={index} href={`mailto:${part}`}>{part}</a>
    ) : (
      part
    ),
  );
}

export default function LegalDocument({
  kind,
  title,
  intro,
  lead,
  paragraphs,
  titles: givenTitles,
}: {
  kind: LegalKind;
  title: string;
  intro: string;
  lead: string;
  paragraphs: string[];
  titles?: string[];
}) {
  const titles = givenTitles ?? clauseTitles[kind];
  const isFaq = kind === "faq";
  // Which boxes are open. The first starts open so the page never looks empty.
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set([0]));

  function setItem(index: number, open: boolean) {
    setOpenItems((current) => {
      const next = new Set(current);
      if (open) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  // "On this page" links open the box they point to, then scroll to it.
  function jumpTo(event: MouseEvent<HTMLAnchorElement>, index: number) {
    event.preventDefault();
    setItem(index, true);
    const target = document.getElementById(`clause-${index + 1}`);
    window.history.replaceState(null, "", `#clause-${index + 1}`);
    requestAnimationFrame(() => target?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  const other = otherDocument[kind];
  const isPrivacy = kind === "privacy-policy";
  const subject = isPrivacy ? "Privacy question" : isFaq ? "Question about Sanjeevani Group" : "Question about the website terms";

  return (
    <>
      <section className="lg-hero" aria-labelledby="lg-title">
        <div className="bx-wrap lg-hero-grid">
          <div className="lg-hero-copy">
            <h1 id="lg-title">
              {title.split(/<br\s*\/?>/i).map((line, index, lines) => (
                <span key={line}>{line}{index < lines.length - 1 && <br />}</span>
              ))}
            </h1>
            <p className="bx-lead">{intro}</p>
            <div className="lg-actions">
              <a className="bx-button" href={`mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`}>
                {isPrivacy ? "Email a privacy question" : "Email a question"}
              </a>
              <Link className="lg-text-link" href={other.href}>{other.label}</Link>
            </div>
          </div>
          <dl className="lg-summary">
            <div><dt>Document</dt><dd>{lead}</dd></div>
            <div><dt>{isFaq ? "Questions" : "Sections"}</dt><dd className="num">{paragraphs.length}</dd></div>
            {!isFaq && <div><dt>Status</dt><dd>Draft, pending review</dd></div>}
            <div><dt>{isFaq ? "Contact" : "Questions"}</dt><dd><a href={`mailto:${contactEmail}`}>{contactEmail}</a></dd></div>
          </dl>
        </div>
      </section>

      <section className="lg-body" aria-labelledby="lg-document-title">
        <div className="bx-wrap lg-body-grid">
          <nav className="lg-toc" aria-label="On this page">
            <p className="lg-toc-title">On this page</p>
            <ul>
              {paragraphs.map((_, index) => (
                <li key={index}>
                  <a href={`#clause-${index + 1}`} onClick={(event) => jumpTo(event, index)} aria-current={openItems.has(index) ? "true" : undefined}>
                    {titles[index] ?? `Section ${index + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="lg-document">
            <div className="lg-document-head">
              <h2 id="lg-document-title">{lead}</h2>
            </div>
            <div className="lg-items">
              {paragraphs.map((paragraph, index) => (
                <details
                  className="lg-item"
                  id={`clause-${index + 1}`}
                  key={index}
                  open={openItems.has(index)}
                  onToggle={(event) => {
                    const open = event.currentTarget.open;
                    if (open !== openItems.has(index)) setItem(index, open);
                  }}
                >
                  <summary>
                    <h3>{titles[index] ?? `Section ${index + 1}`}</h3>
                    <span className="lg-item-icon" aria-hidden="true" />
                  </summary>
                  <div className="lg-item-body">
                    <p>{withEmailLinks(paragraph)}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
