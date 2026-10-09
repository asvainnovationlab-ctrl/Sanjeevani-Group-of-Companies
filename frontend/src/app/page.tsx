"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { businesses as localBusinesses, type Business } from "@/data/businesses";
import GroupFooter from "@/components/GroupFooter";
import GmailContactButton from "@/components/GmailContactButton";
import GroupEmblem from "@/components/GroupEmblem";
import BusinessNavMenu from "@/components/BusinessNavMenu";
import AboutNavMenu from "@/components/AboutNavMenu";
import SocialLinks from "@/components/SocialLinks";

type DirectoryResponse = { data: Business[]; message?: string };

const slides = [
  { label: "HOSPITAL", theme: "hospital", image: "/hospital.jpg" },
  { label: "MEDICAL COLLEGE", theme: "medical-college", image: "/medical%20college.jpg" },
  { label: "EDUCATION", theme: "education", image: "/education.jpg" },
  { label: "AGRO", theme: "agro", image: "/agro.jpg" },
  { label: "CONSTRUCTION", theme: "construction", image: "/construction.jpg" },
  { label: "HYDRO", theme: "hydro", image: "/hydro.jpg" },
];

const homeSections = [
  { id: "home", label: "Home" },
  { id: "story", label: "Who we are" },
  { id: "locations", label: "Locations" },
  { id: "impact", label: "Our impact" },
  { id: "group-film", label: "Group film" },
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

export default function HomePage() {
  const [hasEntered, setHasEntered] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>(localBusinesses);
  const [query, setQuery] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeHomeSection, setActiveHomeSection] = useState("home");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [groupFilmAutoplayBlocked, setGroupFilmAutoplayBlocked] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const storyRuleRef = useRef<HTMLSpanElement>(null);
  const groupFilmVideoRef = useRef<HTMLVideoElement>(null);
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

  useEffect(() => {
    const video = groupFilmVideoRef.current;
    if (!video || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (video.ended) video.currentTime = 0;
        video.play().catch(async (error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          if (error instanceof DOMException && error.name === "NotAllowedError" && !video.muted) {
            video.muted = true;
            setGroupFilmAutoplayBlocked(true);
            try {
              await video.play();
            } catch (mutedPlaybackError: unknown) {
              if (mutedPlaybackError instanceof DOMException && mutedPlaybackError.name === "AbortError") return;
              console.error("Could not autoplay the Sanjeevani Group video.", mutedPlaybackError);
            }
          } else {
            console.error("Could not autoplay the Sanjeevani Group video.", error);
          }
        });
      } else {
        video.pause();
      }
    }, { threshold: 0.35 });

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return [
      ...businesses
        .filter((business) => `${business.name} ${business.sector}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 5)
        .map((business) => ({ label: business.name, detail: business.sector, href: `/businesses?search=${encodeURIComponent(business.name)}` })),
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
    setQuery("");
    setSearchOpen(false);
    if (href.startsWith("/")) {
      window.location.assign(href);
      return;
    }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }

  function playGroupFilmWithSound() {
    const video = groupFilmVideoRef.current;
    if (!video) return;
    video.muted = false;
    video.play().then(() => {
      setGroupFilmAutoplayBlocked(false);
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setGroupFilmAutoplayBlocked(true);
        return;
      }
      console.error("Could not start the Sanjeevani Group video.", error);
    });
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
            {navigation.map((item) => item.label === "About us" ? (
              <AboutNavMenu key={item.href} />
            ) : item.label === "Businesses" ? (
              <BusinessNavMenu businesses={businesses} key={item.href} />
            ) : (
              <a href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
            ))}
            <SocialLinks className="mobile-nav-social-links" />
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
          <SocialLinks className="header-social-links" />
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

        <section className="impact-section" id="impact" aria-labelledby="impact-title">
          <div className="reference-wrap">
            <div className="impact-heading">
              <div>
                <p className="section-overline">PURPOSE IN ACTION</p>
                <h2 id="impact-title">Our impact.<br /><em>Our shared responsibility.</em></h2>
              </div>
              <p className="section-lead">
                From care and education to agriculture, our businesses work in the sectors that shape everyday life and help communities move forward.
              </p>
            </div>
            <div className="impact-grid">
              <Link className="impact-card impact-card-featured" href="/businesses?group=healthcare">
                <Image src="/hospital.jpg" alt="Healthcare services within the Sanjeevani Group" fill sizes="(max-width: 780px) 100vw, 58vw" />
                <span className="impact-card-shade" aria-hidden="true" />
                <span className="impact-card-index">01 / CARE</span>
                <span className="impact-card-copy">
                  <strong>Care that brings us closer.</strong>
                  <small>Healthcare and clinical services</small>
                </span>
                <span className="impact-card-arrow" aria-hidden="true">↗</span>
              </Link>
              <Link className="impact-card" href="/businesses?group=education">
                <Image src="/education.jpg" alt="Learning and education across the group" fill sizes="(max-width: 780px) 100vw, 38vw" />
                <span className="impact-card-shade" aria-hidden="true" />
                <span className="impact-card-index">02 / LEARNING</span>
                <span className="impact-card-copy">
                  <strong>Opening doors through learning.</strong>
                  <small>Education and opportunity</small>
                </span>
                <span className="impact-card-arrow" aria-hidden="true">↗</span>
              </Link>
              <Link className="impact-card" href="/businesses?group=agriculture">
                <Image src="/agro.jpg" alt="Agriculture and food businesses" fill sizes="(max-width: 780px) 100vw, 38vw" />
                <span className="impact-card-shade" aria-hidden="true" />
                <span className="impact-card-index">03 / LIVELIHOODS</span>
                <span className="impact-card-copy">
                  <strong>Growing from the ground up.</strong>
                  <small>Agriculture and food</small>
                </span>
                <span className="impact-card-arrow" aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="impact-footer">
              <span>Different sectors. One shared commitment to meaningful progress.</span>
              <Link href="/businesses">Explore our businesses <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </section>

        <section className="group-film-section" id="group-film" aria-label="Sanjeevani Group film">
          <div className="reference-wrap group-film-layout">
            <div className="group-film-frame">
              <video
                ref={groupFilmVideoRef}
                controls
                playsInline
                preload="metadata"
                aria-label="Sanjeevani Group video"
                onVolumeChange={(event) => {
                  if (!event.currentTarget.muted) setGroupFilmAutoplayBlocked(false);
                }}
              >
                <source src="/video.mp4" type="video/mp4" />
                Your browser does not support embedded video.
              </video>
              {groupFilmAutoplayBlocked && (
                <button className="group-film-play-prompt" type="button" onClick={playGroupFilmWithSound}>
                  <span aria-hidden="true">◖))</span> Enable sound
                </button>
              )}
              <span className="group-film-frame-label">20 SEC <i /> SANJEEVANI · NEPAL</span>
            </div>
          </div>
        </section>

      </main>

      <GroupFooter />
    </>
  );
}
