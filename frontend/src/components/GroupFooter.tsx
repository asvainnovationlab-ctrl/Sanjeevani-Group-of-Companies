import Link from "next/link";
import GroupEmblem from "@/components/GroupEmblem";
import SocialLinks from "@/components/SocialLinks";

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about-us" },
      { label: "Our story", href: "/our-story" },
      { label: "Businesses", href: "/businesses" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "Investors",
    links: [
      { label: "Investor information", href: "/investors" },
      { label: "Investor enquiries", href: "mailto:info@sanjeevanigroup.com?subject=Investor%20enquiry" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Careers", href: "/careers" },
      { label: "Media", href: "/media" },
      { label: "Contact", href: "/contact" },
      { label: "Frequently asked questions", href: "/faq" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms of use", href: "/terms-of-use" },
      { label: "Accessibility", href: "/accessibility" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
];

export default function GroupFooter() {
  return (
    <footer className="group-footer site-footer">
      <span className="site-footer-watermark" aria-hidden="true"><GroupEmblem /></span>
      <div className="reference-wrap">
        <section className="site-footer-cta" aria-label="Contact Sanjeevani Group">
          <div>
            <span className="site-footer-eyebrow">Let&apos;s work together</span>
            <p>Building a better tomorrow, <strong>together.</strong></p>
          </div>
          <div className="site-footer-cta-actions">
            <Link className="site-footer-button" href="/contact">Contact us <span aria-hidden="true">↗</span></Link>
            <a className="site-footer-email" href="mailto:info@sanjeevanigroup.com">info@sanjeevanigroup.com</a>
          </div>
        </section>

        <section className="site-footer-main" aria-label="Footer navigation">
          <div className="site-footer-brand-column">
            <Link className="site-footer-brand" href="/" aria-label="Sanjeevani Group home">
              <span className="site-footer-emblem"><GroupEmblem /></span>
              <span>Sanjeevani<small>Group of Companies</small></span>
            </Link>
            <p className="site-footer-tagline">One horizon, <strong>many ambitions.</strong></p>
            <p className="site-footer-description">A family of independent businesses across healthcare, education, agriculture, construction and hydropower, growing together with Nepal.</p>
            <SocialLinks className="site-footer-social" />
          </div>
          {footerColumns.map((column) => (
            <div className="site-footer-column" key={column.title}>
              <h2>{column.title}</h2>
              {column.links.map((link) => link.href.startsWith("mailto:") ? (
                <a href={link.href} key={link.label}>{link.label}</a>
              ) : (
                <Link href={link.href} key={link.label}>{link.label}</Link>
              ))}
            </div>
          ))}
        </section>

        <div className="site-footer-bottom">
          <small>© {new Date().getFullYear()} Sanjeevani Group of Companies. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
}
