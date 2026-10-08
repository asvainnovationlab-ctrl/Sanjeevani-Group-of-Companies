"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { businesses as directory, type BusinessCategory } from "@/data/businesses";

const categories: { label: string; value: BusinessCategory | "all" }[] = [
  { label: "All businesses", value: "all" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Education", value: "education" },
  { label: "Agriculture", value: "agriculture" },
  { label: "Other sectors", value: "other" },
];

function Brand() {
  return (
    <Link className="brand" href="#home" aria-label="Sanjeevani Group home">
      <span className="brand-mark" aria-hidden="true">S</span>
      <span className="brand-name">SANJEEVANI<span>GROUP</span></span>
    </Link>
  );
}

export default function HomePage() {
  const [businesses] = useState(directory);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "all">("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return businesses.filter((business) => {
      const matchesCategory = category === "all" || business.category === category;
      const searchableText = `${business.name} ${business.sector} ${business.description}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [businesses, category, query]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.querySelector("#business")?.scrollIntoView({ behavior: "smooth" });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <Brand />
        <button className="menu-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span />
        </button>
        <nav className={`main-nav${menuOpen ? " is-open" : ""}`} id="primary-navigation" aria-label="Main navigation">
          <a href="#story" onClick={closeMenu}>Our story</a>
          <a href="#business" onClick={closeMenu}>Business</a>
          <a href="#media" onClick={closeMenu}>Media</a>
          <a href="#investors" onClick={closeMenu}>Investors</a>
          <a href="#community" onClick={closeMenu}>Community</a>
          <a href="#careers" onClick={closeMenu}>Careers</a>
        </nav>
        <form className="search-form" role="search" onSubmit={submitSearch}>
          <label className="visually-hidden" htmlFor="site-search">Search businesses</label>
          <input id="site-search" type="search" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="submit" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
          </button>
        </form>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow"><span />A group built around possibility</p>
            <h1>Progress, with<br /><span>purpose.</span></h1>
            <p className="hero-description">From caring for communities to cultivating new ideas, Sanjeevani Group brings diverse businesses together to help build a brighter tomorrow.</p>
            <a className="button button-light" href="#business">Explore our businesses <span aria-hidden="true">↗</span></a>
            <div className="hero-note"><span className="note-line" /><span>Many paths. One shared purpose.</span></div>
          </div>
          <div className="hero-art" aria-label="Abstract illustration of growth and connection" role="img">
            <div className="art-sun" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-hill hill-back" /><div className="art-hill hill-front" />
            <div className="art-stem stem-one" /><div className="art-stem stem-two" /><div className="art-stem stem-three" />
            <div className="art-leaf leaf-one" /><div className="art-leaf leaf-two" /><div className="art-leaf leaf-three" />
            <div className="art-leaf leaf-four" /><div className="art-leaf leaf-five" /><div className="art-leaf leaf-six" />
            <div className="art-caption"><span>01 / MANY BUSINESSES</span><span>GROWING TOGETHER</span></div>
          </div>
          <a className="scroll-cue" href="#story"><span />Scroll to explore</a>
        </section>

        <section className="intro section-wrap" id="story">
          <div className="section-kicker"><span>01</span><span>OUR STORY</span></div>
          <div className="intro-content">
            <h2>Different industries.<br /><span>Shared ambition.</span></h2>
            <div className="intro-text">
              <p>Sanjeevani Group is a growing family of businesses working across healthcare, education, agriculture, infrastructure, and more.</p>
              <p>Each company brings its own expertise. Together, they reflect a belief in building useful services, creating opportunity, and contributing to the communities around us.</p>
              <a className="text-link" href="#community">What guides us <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="values-strip">
            <div><span className="value-number">01</span><span>Care for people</span></div>
            <div><span className="value-number">02</span><span>Think for tomorrow</span></div>
            <div><span className="value-number">03</span><span>Grow together</span></div>
          </div>
        </section>

        <section className="business-section" id="business">
          <div className="section-wrap">
            <div className="business-heading">
              <div><div className="section-kicker section-kicker-light"><span>02</span><span>OUR BUSINESSES</span></div><h2>A broad portfolio.<br /><span>One connected future.</span></h2></div>
              <p>Explore the businesses that make up Sanjeevani Group. Search by name or browse across our areas of work.</p>
            </div>
            <div className="business-toolbar">
              <div className="category-list" aria-label="Business categories">
                {categories.map((item) => (
                  <button className={`category-chip${category === item.value ? " is-active" : ""}`} type="button" key={item.value} aria-pressed={category === item.value} onClick={() => setCategory(item.value)}>
                    {item.label}{item.value === "all" && <span>{businesses.length}</span>}
                  </button>
                ))}
              </div>
              <p className="result-count" aria-live="polite">{`${filteredBusinesses.length} ${filteredBusinesses.length === 1 ? "business" : "businesses"} found`}</p>
            </div>
            <div className="business-grid">
              {filteredBusinesses.map((business, index) => (
                <article className="business-card" key={business._id}>
                  <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="card-icon" aria-hidden="true">✳</span>
                  <p className="card-sector">{business.sector}</p>
                  <h3>{business.name}</h3>
                  <p className="business-description">{business.description}</p>
                  {business.website ? <a href={business.website} target="_blank" rel="noreferrer"><span>Visit website</span><span aria-hidden="true">↗</span></a> : <span className="business-card-spacer" />}
                </article>
              ))}
            </div>
            {filteredBusinesses.length === 0 && <p className="empty-state">No businesses match your search. Try another name or category.</p>}
          </div>
        </section>

        <section className="feature-section section-wrap" id="media">
          <div className="section-kicker"><span>03</span><span>IN THE GROUP</span></div>
          <div className="feature-content">
            <div className="feature-art" aria-hidden="true"><span className="feature-orbit" /><span className="feature-circle" /><span className="feature-letter">S</span><span className="feature-label">PEOPLE · IDEAS · PROGRESS</span></div>
            <div className="feature-copy"><p className="eyebrow">Stories from Sanjeevani</p><h2>Good things grow<br /><span>when we grow together.</span></h2><p>Get to know the people, ideas, and work across our group. We’ll share updates here as our story continues.</p><a className="text-link" href="#community">Discover our community <span aria-hidden="true">↗</span></a></div>
          </div>
        </section>

        <section className="investor-section" id="investors">
          <div className="section-wrap investor-content">
            <div className="section-kicker section-kicker-light"><span>04</span><span>INVESTORS</span></div>
            <div className="investor-copy"><h2>Building for<br /><span>the long term.</span></h2><div><p>We believe in responsible growth and creating lasting value across the businesses we bring together.</p><a className="button button-outline" href="mailto:info@sanjeevanigroup.com?subject=Investor%20enquiry">Connect with our team <span aria-hidden="true">↗</span></a></div></div>
            <div className="investor-foot"><span>SANJEEVANI GROUP</span><span>GROWING WITH PURPOSE</span></div>
          </div>
        </section>

        <section className="community-section section-wrap" id="community">
          <div className="community-copy"><div className="section-kicker"><span>05</span><span>COMMUNITY</span></div><h2>Rooted in people.<br /><span>Open to possibility.</span></h2><p>Our businesses are part of a wider community. We value the people, partners, and places that make progress possible.</p><a className="text-link" href="#careers">Be part of the story <span aria-hidden="true">↗</span></a></div>
          <div className="community-art" aria-hidden="true"><div className="community-sun" /><div className="community-mountain mountain-one" /><div className="community-mountain mountain-two" /><div className="community-ground" /><span className="community-word">TOGETHER</span></div>
        </section>

        <section className="careers-section" id="careers">
          <div className="section-wrap careers-content">
            <div className="section-kicker section-kicker-light"><span>06</span><span>CAREERS</span></div>
            <div><p className="eyebrow">Make your next move matter</p><h2>Bring your ambition.<br /><span>Grow with us.</span></h2><p>Explore a future across the diverse businesses of Sanjeevani Group. Get in touch to start a conversation.</p><a className="button button-light" href="mailto:careers@sanjeevanigroup.com?subject=Career%20enquiry">Start a conversation <span aria-hidden="true">↗</span></a></div>
            <span className="careers-watermark" aria-hidden="true">S</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main"><Brand /><p>Progress, with purpose.</p><div className="footer-links"><a href="#story">Our story</a><a href="#business">Business</a><a href="#media">Media</a><a href="#investors">Investors</a><a href="#community">Community</a><a href="#careers">Careers</a></div></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Sanjeevani Group</span><a href="mailto:info@sanjeevanigroup.com">Contact us <span aria-hidden="true">↗</span></a><a href="#home">Back to top ↑</a></div>
      </footer>
    </>
  );
}
