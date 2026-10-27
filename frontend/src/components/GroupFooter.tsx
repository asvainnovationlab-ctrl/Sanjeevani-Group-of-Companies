import Link from "next/link";
import GroupEmblem from "@/components/GroupEmblem";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Businesses", href: "/businesses" },
  { label: "Community", href: "/community" },
  { label: "Media", href: "/media" },
  { label: "Careers", href: "/careers" },
  { label: "Contact Us", href: "/contact" },
];

const contactItems = [
  {
    title: "Get in touch",
    detail: "Send us an enquiry",
    href: "/contact",
    icon: <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm-3 11H7v-2h10v2Zm0-4H7V7h10v2Z" />,
  },
  {
    title: "Work with us",
    detail: "info@sanjeevanigroup.com",
    href: "mailto:info@sanjeevanigroup.com",
    icon: <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />,
  },
  {
    title: "Our Location",
    detail: "Kathmandu, Nepal",
    icon: <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />,
  },
];

export default function GroupFooter() {
  return (
    <footer className="group-footer site-footer">
      <span className="site-footer-mark site-footer-mark-left" aria-hidden="true"><GroupEmblem /></span>
      <span className="site-footer-mark site-footer-mark-right" aria-hidden="true"><GroupEmblem /></span>
      <div className="reference-wrap">
        <section className="site-footer-main" aria-label="Footer navigation">
          <div className="site-footer-about">
            <p>Sanjeevani Group is a family of independent businesses across healthcare, education, agriculture, construction and hydropower. We grow with long-term thinking, disciplined execution and a commitment to Nepal.</p>
          </div>

          <div className="site-footer-column">
            <h2>Quick Links</h2>
            <ul className="site-footer-links">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}><span aria-hidden="true">→</span>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer-column">
            <h2>Contact Us</h2>
            <ul className="site-footer-contact">
              {contactItems.map((item) => (
                <li key={item.title}>
                  <span className="site-footer-contact-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{item.icon}</svg>
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    {item.href ? (
                      item.href.startsWith("mailto:") ? <a href={item.href}>{item.detail}</a> : <Link href={item.href}>{item.detail}</Link>
                    ) : (
                      <span>{item.detail}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="site-footer-bottom">
        <div className="reference-wrap">
          <small>Sanjeevani Group - Copyright {new Date().getFullYear()}. All rights reserved.</small>
          <nav aria-label="Legal">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-use">Terms &amp; Condition</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
