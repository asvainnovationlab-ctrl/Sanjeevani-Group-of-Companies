"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { businesses as localBusinesses, type Business, type BusinessCategory } from "@/data/businesses";
import GroupFooter from "@/components/GroupFooter";
import GmailContactButton from "@/components/GmailContactButton";
import GroupEmblem from "@/components/GroupEmblem";

type DirectoryResponse = { data: Business[]; message?: string };

const slides = [
  { label: "HOSPITAL", theme: "hospital", image: "/hospital.jpg" },
  { label: "MEDICAL COLLEGE", theme: "medical-college", image: "/medical%20college.jpg" },
  { label: "EDUCATION", theme: "education", image: "/education.jpg" },
  { label: "AGRO", theme: "agro", image: "/agro.jpg" },
  { label: "CONSTRUCTION", theme: "construction", image: "/construction.jpg" },
  { label: "HYDRO", theme: "hydro", image: "/hydro.jpg" },
];

const alphabet = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

const homeSections = [
  { id: "home", label: "Home" },
  { id: "story", label: "Who we are" },
  { id: "locations", label: "Locations" },
  { id: "businesses", label: "Businesses" },
  { id: "media", label: "Across the group" },
  { id: "community", label: "Community" },
];

const locationPins = [
  { city: "Nepalgunj", x: 31.4, y: 57.9, delay: "0s", label: "left" },
  { city: "Kohalpur", x: 33.3, y: 54.3, delay: ".5s", label: "above" },
  { city: "Bhairahawa", x: 45.1, y: 70.2, delay: "1s", label: "above" },
  { city: "Pokhara", x: 49.1, y: 54.3, delay: "1.5s", label: "above" },
  { city: "Ghorahi", x: 37.9, y: 58.1, delay: "0s", label: "below" },
  { city: "Kathmandu", x: 59.2, y: 65.4, delay: ".5s", label: "left" },
  { city: "Bhaktapur", x: 60, y: 66.4, delay: "1s", label: "right" },
  { city: "Hetauda", x: 57, y: 71.9, delay: "1.5s", label: "left" },
  { city: "Janakpur", x: 63.7, y: 87.5, delay: "0s", label: "above" },
  { city: "Syangja", x: 48.3, y: 57, delay: ".5s", label: "below" },
];

const navigation = [
  { label: "About us", href: "/about-us", keywords: "our story about history values purpose" },
  { label: "Businesses", href: "/businesses", keywords: "companies healthcare education agriculture suppliers construction hydro power" },
  { label: "Media", href: "/media", keywords: "updates stories group" },
  { label: "Investors", href: "/investors", keywords: "growth long term contact" },
  { label: "Community", href: "/community", keywords: "people education health agriculture" },
  { label: "Careers", href: "/careers", keywords: "jobs work careers email" },
  { label: "Contact", href: "/contact", keywords: "contact email location enquiry message" },
];

const localLocations = new Map(localBusinesses.map((business) => [business.name, business.location]));

function Brand() {
  return (
    <a className="reference-brand" href="#top" aria-label="Sanjeevani Group home">
      <span className="brand-emblem-small"><GroupEmblem /></span>
      <span className="brand-wordmark">Sanjeevani<span>GROUP OF COMPANIES</span></span>
    </a>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8m10.6 10.6 1.8 1.8M2 12h2.5m15 0H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function BusinessArt({ business }: { business: Business }) {
  const initial = business.name.trim().charAt(0).toUpperCase();
  const colors: Record<BusinessCategory, string> = {
    healthcare: "monogram-health",
    education: "monogram-education",
    agriculture: "monogram-agriculture",
    other: "monogram-other",
  };

  return (
    <div className="business-logo" aria-hidden="true">
      <span className={`business-monogram ${colors[business.category]}`}>{initial}</span>
      <span className="business-logo-caption">SANJEEVANI GROUP</span>
    </div>
  );
}

function BusinessCard({ business, index }: { business: Business; index: number }) {
  const cardRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const website = business.website?.trim() ?? "";
  const location = business.location?.trim() ?? "";
  let websiteUrl: string | undefined;

  if (website) {
    try {
      const parsedWebsite = new URL(/^[a-z][a-z\d+.-]*:/i.test(website) ? website : `https://${website}`);
      if (parsedWebsite.protocol === "http:" || parsedWebsite.protocol === "https:") {
        websiteUrl = parsedWebsite.href;
      }
    } catch {
      websiteUrl = undefined;
    }
  }

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      className={`directory-card${isVisible ? " is-visible" : ""}`}
      style={{ transitionDelay: `${Math.min(index * 65, 390)}ms` }}
    >
      <BusinessArt business={business} />
      <span className="directory-card-sector">{business.sector}</span>
      <h3>{business.name}</h3>
      <dl className="directory-card-details">
        <div>
          <dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></dt>
          <dd title={location || "Location"}>{location || "Location"}</dd>
        </div>
        <div>
          <dt><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg></dt>
          <dd title={website || "Website"}>{websiteUrl
            ? <a href={websiteUrl} target="_blank" rel="noreferrer">{website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</a>
            : "Website"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default function HomePage() {
  const [hasEntered, setHasEntered] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>(localBusinesses);
  const [query, setQuery] = useState("");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState("All");
  const [showAllBusinesses, setShowAllBusinesses] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeHomeSection, setActiveHomeSection] = useState("home");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const storyRuleRef = useRef<HTMLSpanElement>(null);
  const [storyRuleVisible, setStoryRuleVisible] = useState(false);
  const [statsCounts, setStatsCounts] = useState([0, 0, 0]);

  useEffect(() => {
    document.body.style.overflow = hasEntered ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [hasEntered]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setHasEntered(true), 500);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    fetch("/api/businesses")
      .then(async (response) => {
        const result = (await response.json()) as DirectoryResponse;
        if (!response.ok) throw new Error(result.message ?? "Business directory unavailable.");
        if (result.data.length > 0) {
          setBusinesses(result.data.map((business) => ({
            ...business,
            location: business.location || localLocations.get(business.name) || "",
          })));
        }
      })
      .catch((error: unknown) => {
        console.error("Using the bundled company directory because MongoDB is unavailable.", error);
      });
  }, []);

  useEffect(() => {
    if (!hasEntered) return;
    const interval = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [hasEntered]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    function updateHeader() {
      setHeaderScrolled(window.scrollY > 24);
    }
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    const rule = storyRuleRef.current;
    if (!rule) return;
    if (!("IntersectionObserver" in window)) {
      setStoryRuleVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setStoryRuleVisible(true);
      observer.disconnect();
    }, { threshold: 1 });

    observer.observe(rule);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sectionElements = homeSections
      .map((section) => document.getElementById(section.id))
      .filter((section): section is HTMLElement => section !== null);
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (visible) setActiveHomeSection(visible.target.id);
    }, { rootMargin: "-44% 0px -44% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });

    sectionElements.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stats = statsRef.current;
    if (!stats) return;

    let frameId = 0;
    const targets = [18, 4, 1];
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setStatsCounts(targets);
        return;
      }

      const startTime = performance.now();
      const duration = 1500;
      function countUp(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setStatsCounts(targets.map((target) => Math.floor(target * eased)));
        if (progress < 1) frameId = window.requestAnimationFrame(countUp);
      }
      frameId = window.requestAnimationFrame(countUp);
    }, { threshold: 0.35 });

    observer.observe(stats);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = directoryQuery.trim().toLowerCase();
    return businesses.filter((business) => {
      const matchesLetter = activeLetter === "All" || business.name.toUpperCase().startsWith(activeLetter);
      const searchable = `${business.name} ${business.sector} ${business.description}`.toLowerCase();
      return matchesLetter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeLetter, businesses, directoryQuery]);
  const displayedBusinesses = showAllBusinesses
    ? filteredBusinesses
    : filteredBusinesses.slice(0, 12);

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return [
      ...businesses
        .filter((business) => `${business.name} ${business.sector}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 5)
        .map((business) => ({ label: business.name, detail: business.sector, href: "#businesses" })),
      ...navigation
        .filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 4)
        .map((item) => ({ label: item.label, detail: "Explore this section", href: item.href })),
    ].slice(0, 7);
  }, [businesses, query]);

  function moveSlide(direction: number) {
    setSlideIndex((current) => (current + direction + slides.length) % slides.length);
  }

  function selectSearchResult(href: string) {
    if (href === "#businesses" && query.trim()) setDirectoryQuery(query.trim());
    setQuery("");
    setSearchOpen(false);
    if (href.startsWith("/")) {
      window.location.assign(href);
      return;
    }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {!hasEntered && (
        <div className="welcome-screen">
          <div className="welcome-lockup">
            <div className="welcome-emblem">
              <GroupEmblem />
            </div>
            <p className="welcome-name">Sanjeevani Group</p>
            <p className="welcome-subtitle">OF COMPANIES</p>
            <div className="welcome-progress" role="status" aria-label="Loading Sanjeevani Group">
              <span className="welcome-progress-track" aria-hidden="true">
                <span className="welcome-progress-fill" />
              </span>
              <span className="welcome-loading-label">WELCOME</span>
            </div>
          </div>
        </div>
      )}
      <header className={`reference-header${headerScrolled ? " is-scrolled" : " is-overlay"}`}>
        <div className="reference-wrap header-inner">
          <Brand />
          <nav className={`reference-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
            {navigation.map((item) => (
              <a href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
            ))}
          </nav>
          <div className="reference-search" role="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <label className="visually-hidden" htmlFor="group-search">Search the group</label>
            <input
              id="group-search"
              type="search"
              placeholder="Search the group"
              autoComplete="off"
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
                if (event.key === "Enter" && searchResults[0]) selectSearchResult(searchResults[0].href);
              }}
            />
            {searchOpen && query.trim() && (
              <ul className="search-results">
                {searchResults.length ? searchResults.map((result) => (
                  <li key={`${result.href}-${result.label}`}>
                    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectSearchResult(result.href)}>
                      {result.label}<small>{result.detail}</small>
                    </button>
                  </li>
                )) : <li className="search-no-results">No results for “{query}”</li>}
              </ul>
            )}
          </div>
          <button className="reference-menu" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
        </div>
      </header>

      <div className="theme-switcher" role="group" aria-label="Colour theme">
        <button type="button" aria-label="Day mode" aria-pressed={theme === "light"} onClick={() => setTheme("light")}><SunIcon /></button>
        <button type="button" aria-label="Night mode" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><MoonIcon /></button>
      </div>
      <GmailContactButton />

      <nav className="section-progress" aria-label="Homepage section navigation">
        {homeSections.map((section) => (
          <button
            type="button"
            className={activeHomeSection === section.id ? "is-active" : ""}
            key={section.id}
            aria-label={`Go to ${section.label}`}
            aria-current={activeHomeSection === section.id ? "location" : undefined}
            onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className="section-progress-label">{section.label}</span>
            <span className="section-progress-tick" aria-hidden="true" />
          </button>
        ))}
      </nav>

      <main id="top">
        <section id="home" className={`reference-hero hero-category-${slides[slideIndex].theme}`} aria-roledescription="carousel" aria-label="Sanjeevani Group business categories">
          <div
            key={slides[slideIndex].theme}
            className="hero-category-photo"
            aria-hidden="true"
            style={{ backgroundImage: `url("${slides[slideIndex].image}")` }}
          />
          <div className="hero-category-content" aria-live="polite">
            <h1>
              <span>SANJEEVANI GROUP</span>
              <i aria-hidden="true">|</i>
              <strong key={slideIndex}>{slides[slideIndex].label}</strong>
            </h1>
          </div>
          <div className="hero-controls">
            <button type="button" aria-label="Previous slide" onClick={() => moveSlide(-1)}>←</button>
            <div className="hero-dots" aria-label="Choose a featured slide">
              {slides.map((slide, index) => (
                <button key={slide.theme} className={slideIndex === index ? "is-active" : ""} type="button" aria-label={`Show ${slide.label.toLowerCase()} slide`} aria-pressed={slideIndex === index} onClick={() => setSlideIndex(index)} />
              ))}
            </div>
            <button type="button" aria-label="Next slide" onClick={() => moveSlide(1)}>→</button>
          </div>
          <div className="hero-progress hero-progress-fast" aria-hidden="true"><span key={slideIndex} /></div>
        </section>

        <div className="reference-wrap">
          <div className="reference-stats" ref={statsRef} aria-label="Sanjeevani Group at a glance">
            <div><strong>{statsCounts[0]}</strong><span>Businesses in the group</span></div>
            <div><strong>{statsCounts[1]}</strong><span>Areas of work</span></div>
            <div><strong>{statsCounts[2]}</strong><span>Shared purpose</span></div>
            <div><strong>Nepal</strong><span>Rooted in community</span></div>
          </div>
        </div>

        <section className="reference-section story-section" id="story">
          <div className="reference-wrap story-layout">
            <div className="story-intro">
              <p className="section-overline">WHO WE ARE</p>
              <h2>Rooted in Nepal.<br /><em>Growing together.</em></h2>
              <span ref={storyRuleRef} className={`story-heading-rule${storyRuleVisible ? " is-visible" : ""}`} aria-hidden="true" />
              <p className="section-lead">Sanjeevani Group is a family of independent businesses working across healthcare, education, agriculture, infrastructure, and more to create meaningful progress in the communities we serve.</p>
              <Link className="story-about-link" href="/about-us">Who we are <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="story-portrait">
              <div className="story-portrait-frame">
                <Image
                  src="/khumaa.jpeg"
                  alt="Portrait of C.A. Khuma Parsad Aryal"
                  width={1024}
                  height={1018}
                  sizes="(max-width: 780px) 90vw, 48vw"
                />
              </div>
              <div className="story-portrait-caption">
                <span>CHAIRMAN</span>
                <p>C.A. Khuma Parsad Aryal</p>
              </div>
            </div>
          </div>
        </section>

        <section className="locations-section" id="locations" aria-labelledby="locations-title">
          <div className="locations-panel">
            <div className="locations-copy">
              <p className="locations-overline">Sanjeevani Group across Nepal</p>
              <h2 id="locations-title">Our<br /><em>Locations</em></h2>
              <p>Sanjeevani Group companies work in cities across Nepal, so help is never far from where you live or do business. Find the office or project nearest to you.</p>
              <a className="locations-cta" href="https://www.google.com/maps/search/?api=1&query=Sanjeevani+Group+Nepal" target="_blank" rel="noreferrer">
                Find a location near you <span aria-hidden="true">↗</span>
              </a>
              <small>Select a city marker to view its location in Google Maps.</small>
            </div>
            <div className="nepal-map" role="group" aria-label="Example locations in Nepal. Select a city to open it in Google Maps.">
              <Image className="nepal-map-shape" src="/nepal-outline.svg" alt="" width={700} height={300} />
              {locationPins.map((pin) => (
                <a
                  key={pin.city}
                  className="nepal-map-pin"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pin.city}, Nepal`)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${pin.city}, Nepal in Google Maps`}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%`, animationDelay: pin.delay }}
                  data-label-position={pin.label}
                >
                  <span className="nepal-map-pin-dot" aria-hidden="true" />
                  <span className="nepal-map-pin-label">{pin.city}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="reference-section directory-section" id="businesses">
          <div className="reference-wrap">
            <p className="section-overline">THE GROUP</p>
            <div className="directory-heading">
              <div><h2>Our businesses</h2><p className="section-lead">Eighteen companies, each with a distinct role in our shared story. Explore the directory by name.</p></div>
              <p className="directory-total"><strong>{businesses.length}</strong><span>companies<br />and counting</span></p>
            </div>
            <div className="directory-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <label className="visually-hidden" htmlFor="directory-search">Search companies</label>
              <input id="directory-search" type="search" placeholder="Search companies by name or sector" value={directoryQuery} onChange={(event) => { setDirectoryQuery(event.target.value); setActiveLetter("All"); setShowAllBusinesses(false); }} />
              <span>{filteredBusinesses.length} results</span>
            </div>
            <div className="directory-letters" role="toolbar" aria-label="Filter companies by first letter">
              {alphabet.map((letter) => (
                <button type="button" key={letter} disabled={letter !== "All" && !businesses.some((business) => business.name.toUpperCase().startsWith(letter))} className={activeLetter === letter ? "is-active" : ""} aria-pressed={activeLetter === letter} onClick={() => { setActiveLetter(letter); setDirectoryQuery(""); setShowAllBusinesses(false); }}>
                  {letter === "All" ? "All" : letter}
                </button>
              ))}
            </div>
            <div className="directory-grid" aria-live="polite">
              {displayedBusinesses.map((business, index) => (
                <BusinessCard business={business} index={index} key={business._id} />
              ))}
              {filteredBusinesses.length === 0 && <p className="directory-empty">No companies match that search. Try another name or letter.</p>}
            </div>
            {filteredBusinesses.length > 12 && (
              <div className="directory-expand">
                <button
                  className="directory-expand-button"
                  type="button"
                  aria-expanded={showAllBusinesses}
                  onClick={() => setShowAllBusinesses((isShowingAll) => !isShowingAll)}
                >
                  {showAllBusinesses ? "Show fewer" : `Show all ${filteredBusinesses.length} businesses`}
                  <span aria-hidden="true">{showAllBusinesses ? "↑" : "↓"}</span>
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="reference-section media-section" id="media">
          <div className="reference-wrap">
            <p className="section-overline">ACROSS THE GROUP</p>
            <div className="media-heading"><h2>Many fields.<br /><em>One wider story.</em></h2><p className="section-lead">Discover the different areas of work represented across Sanjeevani Group.</p></div>
            <div className="sector-grid">
              <article className="sector-card sector-health"><span>01</span><div className="sector-art sector-art-health" aria-hidden="true"><i /><i /><i /></div><p>Care &amp; wellbeing</p><h3>Healthcare</h3><a href="#businesses">Explore businesses <span>↗</span></a></article>
              <article className="sector-card sector-learning"><span>02</span><div className="sector-art sector-art-learning" aria-hidden="true"><i /><i /><i /></div><p>Ideas for tomorrow</p><h3>Education</h3><a href="#businesses">Explore businesses <span>↗</span></a></article>
              <article className="sector-card sector-agri"><span>03</span><div className="sector-art sector-art-agri" aria-hidden="true"><i /><i /><i /></div><p>Rooted in growth</p><h3>Agriculture</h3><a href="#businesses">Explore businesses <span>↗</span></a></article>
            </div>
          </div>
        </section>

        <section className="reference-section community-section" id="community">
          <div className="reference-wrap community-layout">
            <div className="community-graphic" aria-hidden="true"><span className="community-sun" /><span className="community-mountain mountain-back" /><span className="community-mountain mountain-front" /><span className="community-art-text">GROWING<br />TOGETHER</span></div>
            <div><p className="section-overline">COMMUNITY</p><h2>Rooted in people.<br /><em>Open to possibility.</em></h2><p className="section-lead">The communities around us are part of every business we build. We value the people, partners, and places that make progress possible.</p><div className="community-pill-list"><span>Healthcare</span><span>Education</span><span>Opportunity</span></div></div>
          </div>
        </section>
      </main>

      <GroupFooter />
    </>
  );
}
