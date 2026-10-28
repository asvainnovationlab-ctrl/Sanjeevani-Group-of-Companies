import Link from "next/link";
import type { ReactNode } from "react";

type LegalKind = "privacy-policy" | "terms-of-use";

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
};

const otherDocument: Record<LegalKind, { label: string; href: string }> = {
  "privacy-policy": { label: "Read the terms of use", href: "/terms-of-use" },
  "terms-of-use": { label: "Read the privacy policy", href: "/privacy-policy" },
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
}: {
  kind: LegalKind;
  title: string;
  intro: string;
  lead: string;
  paragraphs: string[];
}) {
  const titles = clauseTitles[kind];
  const other = otherDocument[kind];
  const isPrivacy = kind === "privacy-policy";
  const subject = isPrivacy ? "Privacy question" : "Question about the website terms";

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
            <div><dt>Sections</dt><dd className="num">{paragraphs.length}</dd></div>
            <div><dt>Status</dt><dd>Draft, pending review</dd></div>
            <div><dt>Questions</dt><dd><a href={`mailto:${contactEmail}`}>{contactEmail}</a></dd></div>
          </dl>
        </div>
      </section>

      <section className="lg-body" aria-labelledby="lg-document-title">
        <div className="bx-wrap lg-body-grid">
          <nav className="lg-toc" aria-label="On this page">
            <p className="lg-toc-title">On this page</p>
            <ol>
              {paragraphs.map((_, index) => (
                <li key={index}>
                  <a href={`#clause-${index + 1}`}>
                    <span className="num">{String(index + 1).padStart(2, "0")}</span>
                    {titles[index] ?? `Section ${index + 1}`}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="lg-document">
          <h2 id="lg-document-title">{lead}</h2>
          <ol className="lg-clauses">
            {paragraphs.map((paragraph, index) => (
              <li className="lg-clause" id={`clause-${index + 1}`} key={index}>
                <span className="lg-clause-number num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{titles[index] ?? `Section ${index + 1}`}</h3>
                  <p>{withEmailLinks(paragraph)}</p>
                </div>
              </li>
            ))}
          </ol>
          </div>
        </div>
      </section>
    </>
  );
}
