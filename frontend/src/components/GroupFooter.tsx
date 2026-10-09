import Link from "next/link";
import GroupEmblem from "@/components/GroupEmblem";
import SocialLinks from "@/components/SocialLinks";

export default function GroupFooter() {
  return (
    <footer className="group-footer">
      <section className="group-footer-contact" aria-label="Contact Sanjeevani Group">
        <Link className="group-footer-brand" href="/" aria-label="Sanjeevani Group home">
          <span className="group-footer-emblem"><GroupEmblem /></span>
          <span>Sanjeevani<small>GROUP OF COMPANIES</small></span>
        </Link>
        <div className="group-footer-address">
          <strong>Sanjeevani Group</strong>
          <span>Group of companies</span>
          <a href="mailto:info@sanjeevanigroup.com">info@sanjeevanigroup.com</a>
        </div>
        <div className="group-footer-social">
          <SocialLinks />
        </div>
        <Link className="group-footer-contact-button" href="/contact">Contact us <span>↗</span></Link>
        <small className="group-footer-copyright">© {new Date().getFullYear()} Sanjeevani Group of Companies.</small>
      </section>

      <section className="group-footer-navigation" aria-label="Footer navigation">
        <div className="group-footer-intro">
          <span>EXPLORE SANJEEVANI</span>
          <p>One horizon, <strong>many ambitions.</strong></p>
        </div>
        <div className="group-footer-link-columns">
          <div>
            <h2>Company</h2>
            <Link href="/about-us">About us</Link>
            <Link href="/businesses">Businesses</Link>
            <Link href="/community">Community</Link>
          </div>
          <div>
            <h2>Investors</h2>
            <Link href="/investors">Investor information</Link>
            <a href="mailto:info@sanjeevanigroup.com?subject=Investor%20enquiry">Investor enquiries</a>
          </div>
          <div>
            <h2>Resources</h2>
            <Link href="/careers">Careers</Link>
            <Link href="/media">Media</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">Frequently asked questions</Link>
          </div>
          <div>
            <h2>Policies</h2>
            <Link href="/privacy-policy">Privacy policy</Link>
            <Link href="/terms-of-use">Terms of use</Link>
            <Link href="/accessibility">Accessibility</Link>
            <Link href="/sitemap">Sitemap</Link>
          </div>
        </div>
        <div className="group-footer-bottom">
          <span>Building a better tomorrow, together.</span>
        </div>
      </section>
    </footer>
  );
}
