"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { businesses as localBusinesses, type Business } from "@/data/businesses";
import GroupFooter from "@/components/GroupFooter";
import GmailContactButton from "@/components/GmailContactButton";
import GroupEmblem from "@/components/GroupEmblem";
import BusinessNavMenu from "@/components/BusinessNavMenu";
import CareersNavMenu from "@/components/CareersNavMenu";
import AboutNavMenu from "@/components/AboutNavMenu";
import { companyNotices, latestEvents, latestPressReleases } from "@/data/newsroom";
import SocialLinks from "@/components/SocialLinks";
import NepalNetworkMap from "@/components/NepalNetworkMap";
import { faqs } from "@/data/faqs";

type DirectoryResponse = { data: Business[]; message?: string };

const slides = [
  { label: "Hospital", theme: "hospital", image: "/business/business.png" },
  { label: "Medical College", theme: "medical-college", image: "/medical%20college.jpg" },
  { label: "Education", theme: "education", image: "/education.jpg" },
  { label: "Agro", theme: "agro", image: "/agro.png" },
  { label: "Construction", theme: "construction", image: "/construction.jpg" },
  { label: "Hydro", theme: "hydro", image: "/hydro.png" },
];
const slideDuration = 3000;

const homeSections = [
  { id: "home", label: "Home" },
  { id: "story", label: "Who we are" },
  { id: "locations", label: "Locations" },
  { id: "impact", label: "Our impact" },
  { id: "faq", label: "FAQ" },
];

const welcomeSectors = ["Healthcare", "Education", "Agriculture", "Infrastructure"];

const navigation = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about-us" },
  { label: "Businesses", href: "/businesses" },
  { label: "Newsroom", href: "/newsroom" },
  { label: "Community", href: "/community" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];
const introImages = [
  { src: "/medical%20college.jpg", alt: "Sanjeevani medical college campus" },
  { src: "/hospital.jpg", alt: "Sanjeevani hospital" },
  { src: "/education.jpg", alt: "Students learning at a Sanjeevani school" },
  { src: "/agro.png", alt: "Sanjeevani agriculture project" },
  { src: "/hydro.png", alt: "Sanjeevani hydropower project" },
];

const keySectors = [
  {
    title: "Healthcare",
    detail: "Hospitals and clinical care",
    image: "/key%20factor/healthcare.jpg",
    href: "/businesses?group=healthcare",
    icon: <><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-5h6v5" /><path d="M12 7.5v5M9.5 10h5" /></>,
  },
  {
    title: "Medical Education",
    detail: "Medical colleges and training",
    image: "/key%20factor/medical.jpg",
    href: "/businesses?group=medical-colleges",
    icon: <><path d="M2 9l10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /><path d="M22 9v6" /></>,
  },
  {
    title: "Education",
    detail: "Schools and learning",
    image: "/key%20factor/edu.jpg",
    href: "/businesses?group=education",
    icon: <><path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2Z" /><path d="M12 6v14" /></>,
  },
  {
    title: "Agriculture",
    detail: "Farming and food",
    image: "/key%20factor/agri.jpg",
    href: "/businesses?group=agriculture",
    icon: <><path d="M12 21V11" /><path d="M12 11C12 6 8 3 3 3c0 5 4 8 9 8Z" /><path d="M12 14c0-4 3-7 8-7 0 4-3 7-8 7Z" /></>,
  },
  {
    title: "Construction",
    detail: "Building and infrastructure",
    image: "/key%20factor/construction.jpg",
    href: "/businesses?group=infrastructure",
    icon: <><path d="M3 21h18" /><path d="M5 21V10h6v11" /><path d="M11 4h10M14 4v6h4V4" /><path d="M8 13v.01M8 16v.01" /></>,
  },
  {
    title: "Hydropower",
    detail: "Clean energy for Nepal",
    image: "/key%20factor/hydro.jpg",
    href: "/businesses?group=infrastructure",
    icon: <><path d="M12 3s-5 5.5-5 9a5 5 0 0 0 10 0c0-3.5-5-9-5-9Z" /><path d="M12.5 9.5 10.5 13h3l-2 3.5" /></>,
  },
];

const pillars = [
  {
    tab: "Innovation",
    title: "Ideas That Move Nepal Forward",
    image: "/impact/innovation.png",
    imageAlt: "Treatment plant with pumps and processing towers",
    paragraphs: [
      "Innovation at Sanjeevani Group means finding better ways to serve people. Our businesses keep looking for new approaches in patient care, medical training, classroom learning, agriculture and infrastructure.",
      "By sharing knowledge across sectors and embracing modern technology, we work to make quality services more accessible, efficient and dependable for the communities we serve.",
    ],
  },
  {
    tab: "Sustainability",
    title: "Responsible Growth",
    image: "/impact/sustainablity.png",
    imageAlt: "Aerial view of a Sanjeevani Group farm facility",
    paragraphs: [
      "Our growth is guided by a simple belief: businesses should leave the communities and environment around them better than they found them. Across healthcare, education, agriculture, construction and hydropower, we aim to create long-term value while caring for our people and our planet.",
      "From clean hydropower that strengthens Nepal’s energy future to farming that respects the land, our companies work to grow responsibly, use resources carefully and build for the generations to come.",
    ],
  },
  {
    tab: "Our Impact",
    title: "Progress We Share",
    image: "/impact/impact.jpg",
    imageAlt: "Smiling woman working in the hillside fields",
    paragraphs: [
      "Our impact is measured by the lives we touch: patients who receive care closer to home, students who gain the skills to shape their futures, farmers who grow with confidence and communities connected by stronger infrastructure.",
      "With 18 businesses across six areas of work, Sanjeevani Group remains committed to meaningful, lasting progress for Nepal and its people.",
    ],
  },
];

const groupFacts = [
  "Sanjeevani Group brings together 18 businesses under one shared purpose.",
  "Our companies work across six areas: healthcare, medical education, education, agriculture, construction and hydropower.",
  "Sanjeevani Group is led by Chairman C.A. Khuma Parsad Aryal.",
  "Our network spans cities across Nepal, from Nepalgunj in the west to Janakpur in the east.",
];

const refreshIcon = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v5h-5" /></svg>;

const localLocations = new Map(localBusinesses.map((business) => [business.name, business.location]));

function Brand() {
  return (
    <a className="reference-brand" href="#top" aria-label="Sanjeevani Group home">
      <span className="brand-emblem-small"><GroupEmblem /></span>
      <span className="brand-wordmark">Sanjeevani<span>GROUP OF COMPANIES</span></span>
    </a>
  );
}

export default function HomePage() {
  const [hasEntered, setHasEntered] = useState(false);
  const [welcomeSector, setWelcomeSector] = useState(0);
  const [businesses, setBusinesses] = useState<Business[]>(localBusinesses);
  const [slideIndex, setSlideIndex] = useState(0);
  const [introIndex, setIntroIndex] = useState(0);
  const [pillarIndex, setPillarIndex] = useState(0);
  const [newsSlide, setNewsSlide] = useState(0);
  const [eventSlide, setEventSlide] = useState(0);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [activeHomeSection, setActiveHomeSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const sectorTrackRef = useRef<HTMLDivElement>(null);
  const sectorPauseUntil = useRef(0);
  const [statsCounts, setStatsCounts] = useState([0, 0, 0]);

  useEffect(() => {
    document.body.style.overflow = hasEntered ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [hasEntered]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setHasEntered(true), 2700);
    const rotation = window.setInterval(() => setWelcomeSector((index) => (index + 1) % welcomeSectors.length), 650);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(rotation);
    };
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
    }, slideDuration);
    return () => window.clearInterval(interval);
  }, [hasEntered, slideIndex]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIntroIndex((current) => (current + 1) % introImages.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".home-main [data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-revealed"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function updateHeader() {
      setHeaderScrolled(window.scrollY > 24);
    }
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    const sectionElements = homeSections
      .map((section) => document.getElementById(section.id))
      .filter((section): section is HTMLElement => section !== null);
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting && entry.target.id !== "home")
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (visible) setActiveHomeSection(visible.target.id);
      else if (window.scrollY < window.innerHeight * 0.5) setActiveHomeSection("home");
    }, { rootMargin: "-44% 0px -44% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });

    sectionElements.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stats = statsRef.current;
    if (!stats) return;

    let frameId = 0;
    const targets = [18, 6, 1];
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
    const track = sectorTrackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let setWidth = track.scrollWidth / 3;
    let position = setWidth;
    let inView = false;
    let hovered = false;
    let frameId = 0;
    track.scrollLeft = position;

    function wrap() {
      if (!track) return;
      if (track.scrollLeft <= setWidth * 0.5) track.scrollLeft += setWidth;
      else if (track.scrollLeft >= setWidth * 2) track.scrollLeft -= setWidth;
    }

    function drift() {
      if (track && inView && !hovered && Date.now() > sectorPauseUntil.current) {
        if (Math.abs(track.scrollLeft - position) > 2) position = track.scrollLeft;
        position += 0.6;
        if (position >= setWidth * 2) position -= setWidth;
        track.scrollLeft = position;
      } else if (track) {
        position = track.scrollLeft;
      }
      frameId = window.requestAnimationFrame(drift);
    }

    function resize() {
      if (!track) return;
      const offset = track.scrollLeft % setWidth;
      setWidth = track.scrollWidth / 3;
      track.scrollLeft = setWidth + offset;
      position = track.scrollLeft;
    }

    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0.3 });
    const pause = () => { hovered = true; };
    const resume = () => { hovered = false; };
    const touchPause = () => { sectorPauseUntil.current = Date.now() + 2500; };
    observer.observe(track);
    track.addEventListener("scroll", wrap, { passive: true });
    track.addEventListener("pointerenter", pause);
    track.addEventListener("pointerleave", resume);
    track.addEventListener("touchstart", touchPause, { passive: true });
    track.addEventListener("touchend", touchPause, { passive: true });
    window.addEventListener("resize", resize);
    if (!reduceMotion) frameId = window.requestAnimationFrame(drift);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
      track.removeEventListener("scroll", wrap);
      track.removeEventListener("pointerenter", pause);
      track.removeEventListener("pointerleave", resume);
      track.removeEventListener("touchstart", touchPause);
      track.removeEventListener("touchend", touchPause);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNewsSlide((current) => (current + 1) % latestPressReleases.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [newsSlide]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setEventSlide((current) => (current + 1) % latestEvents.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [eventSlide]);

  function scrollSectors(direction: number) {
    const track = sectorTrackRef.current;
    const card = track?.querySelector<HTMLElement>(".key-sector-card");
    if (!track || !card) return;
    sectorPauseUntil.current = Date.now() + 1500;
    track.scrollBy({ left: direction * (card.offsetWidth + 24), behavior: "smooth" });
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
            <p className="welcome-sector" aria-hidden="true">
              <span key={welcomeSector}>{welcomeSectors[welcomeSector]}</span>
            </p>
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
            ) : item.label === "Careers" ? (
              <CareersNavMenu businesses={businesses} key={item.href} />
            ) : (
              <a href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
            ))}
            <SocialLinks className="mobile-nav-social-links" />
          </nav>
          <SocialLinks className="header-social-links" />
          <button className="reference-menu" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
        </div>
      </header>

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

      <main id="top" className="home-main">
        <section id="home" className={`reference-hero home-hero hero-category-${slides[slideIndex].theme}`} aria-roledescription="carousel" aria-label="Sanjeevani Group business categories">
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
              <strong key={slideIndex}>{slides[slideIndex].label.toUpperCase()}</strong>
            </h1>
          </div>
          <div className="reference-wrap home-hero-tabs" aria-label="Choose a featured business">
            {slides.map((slide, index) => (
              <button
                key={slide.theme}
                type="button"
                className={slideIndex === index ? "is-active" : ""}
                aria-label={`Show ${slide.label}`}
                aria-pressed={slideIndex === index}
                onClick={() => setSlideIndex(index)}
              >
                <span className="home-hero-tab-bar" aria-hidden="true">{slideIndex === index && <i key={slideIndex} style={{ animationDuration: `${slideDuration}ms` }} />}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="group-intro-section" aria-labelledby="group-intro-title">
          <div className="reference-wrap group-intro-card" data-reveal>
            <div className="group-intro-copy">
              <div className="group-intro-logo">
                <span className="group-intro-emblem"><GroupEmblem /></span>
                <h2 id="group-intro-title">Sanjeevani<span>Group of Companies</span></h2>
              </div>
              <p>
                Sanjeevani Group is a family of independent businesses rooted in Nepal. Led by Chairman C.A. Khuma Parsad Aryal,
                the group works across healthcare, medical education, schooling, agriculture, construction and hydropower,
                bringing quality services closer to the communities it serves and building long-term progress for the nation.
              </p>
              <Link className="group-intro-link" href="/our-story">read more <span aria-hidden="true">→</span></Link>
            </div>
            <Link className="group-intro-gallery" href="/our-story" aria-label="Open our story">
              {introImages.map((image, index) => (
                <span className={`group-intro-image${introIndex === index ? " is-active" : ""}`} key={image.src} aria-hidden={introIndex !== index}>
                  <Image src={image.src} alt={image.alt} fill sizes="(max-width: 780px) 100vw, 66vw" />
                </span>
              ))}
            </Link>
          </div>
        </section>

        <section className="reference-section story-section" id="story">
          <div className="reference-wrap story-layout story-layout-chairman">
            <p className="leadership-chairman-statement story-chairman-statement" data-reveal>Rooted in Nepal and guided by a long-term view, C.A. Khuma Parsad Aryal has led Sanjeevani Group as it has grown into a family of {businesses.length} independent businesses working to transform lives across the nation.</p>
            <div className="leadership-chairman-panel story-chairman-panel" data-reveal>
              <div className="leadership-chairman-photo">
                <Image src="/chairman.png" alt="Portrait of C.A. Khuma Parsad Aryal, Chairman of Sanjeevani Group" fill sizes="(max-width: 780px) 90vw, 40vw" />
              </div>
              <div className="leadership-chairman-copy">
                <h2>C.A. Khuma Parsad Aryal</h2>
                <p className="leadership-chairman-role">Chairman</p>
                <p>Under his leadership, Sanjeevani Group has brought together businesses across healthcare, medical education, education, agriculture, construction and hydropower, each with its own focus and a shared commitment to meaningful progress.</p>
                <Link className="leadership-chairman-link" href="/chairman">View details</Link>
              </div>
              <span className="leadership-chairman-mark" aria-hidden="true"><GroupEmblem /></span>
            </div>
          </div>
        </section>

        <section className="locations-section" id="locations" aria-labelledby="locations-title">
          <div className="locations-panel">
            <div className="locations-copy" data-reveal>
              <p className="locations-overline">Sanjeevani Group across Nepal</p>
              <h2 id="locations-title">Our<br /><em>Locations</em></h2>
              <p>Sanjeevani Group companies work in cities across Nepal, so help is never far from where you live or do business. Find the office or project nearest to you.</p>
              <a className="locations-cta" href="https://www.google.com/maps/search/?api=1&query=Sanjeevani+Group+Nepal" target="_blank" rel="noreferrer">
                Find a location near you <span aria-hidden="true">↗</span>
              </a>
              <small>Select a city marker to view its location in Google Maps.</small>
              <div className="reference-stats locations-stats" ref={statsRef} aria-label="Sanjeevani Group at a glance">
                <div><strong>{statsCounts[0]}</strong><span>Businesses in the group</span></div>
                <div><strong>{statsCounts[1]}</strong><span>Areas of work</span></div>
                <div><strong>{statsCounts[2]}</strong><span>Shared purpose</span></div>
                <div><strong>Nepal</strong><span>Rooted in community</span></div>
              </div>
            </div>
            <NepalNetworkMap drawOnScroll />
          </div>
        </section>

        <section className="key-sectors-section" aria-labelledby="key-sectors-title">
          <div className="reference-wrap key-sectors-heading" data-reveal>
            <h2 id="key-sectors-title">Key <em>Sectors</em></h2>
            <p>
              Sanjeevani Group operates in six key sectors: <strong>Healthcare</strong>, <strong>Medical Education</strong>,{" "}
              <strong>Education</strong>, <strong>Agriculture</strong>, <strong>Construction</strong>, and <strong>Hydropower</strong>.
              Rooted in Nepal, our businesses work together to deliver quality services and lasting value to the communities we serve.
            </p>
          </div>
          <div className="key-sectors-carousel">
            <div className="key-sectors-arrows">
              <button type="button" aria-label="Previous sectors" onClick={() => scrollSectors(-1)}>←</button>
              <button type="button" aria-label="Next sectors" onClick={() => scrollSectors(1)}>→</button>
            </div>
            <div className="key-sectors-track" ref={sectorTrackRef}>
              {[0, 1, 2].flatMap((copy) => keySectors.map((sector) => (
                <Link
                  className="key-sector-card"
                  href={sector.href}
                  key={`${copy}-${sector.title}`}
                  aria-hidden={copy !== 1 ? true : undefined}
                  tabIndex={copy !== 1 ? -1 : undefined}
                >
                  <Image src={sector.image} alt="" fill sizes="(max-width: 780px) 80vw, 25vw" />
                  <span className="key-sector-shade" aria-hidden="true" />
                  <span className="key-sector-copy">
                    <svg viewBox="0 0 24 24" aria-hidden="true">{sector.icon}</svg>
                    <strong>{sector.title}</strong>
                    <small>{sector.detail}</small>
                  </span>
                </Link>
              )))}
            </div>
          </div>
        </section>

        <section className="impact-section" id="impact" aria-labelledby="impact-title">
          <div className="reference-wrap">
            <div className="impact-heading" data-reveal>
              <div>
                <p className="section-overline">PURPOSE IN ACTION</p>
                <h2 id="impact-title">Our impact.<br /><em>Our shared responsibility.</em></h2>
              </div>
              <p className="section-lead">
                From care and education to agriculture, our businesses work in the sectors that shape everyday life and help communities move forward.
              </p>
            </div>
            <div className="pillars-card" data-reveal>
              <span className="pillars-watermark" aria-hidden="true"><GroupEmblem /></span>
              <div className="pillars-tabs" role="tablist" aria-label="Our commitments">
                {pillars.map((pillar, index) => (
                  <button
                    key={pillar.tab}
                    type="button"
                    role="tab"
                    id={`pillar-tab-${index}`}
                    aria-selected={pillarIndex === index}
                    aria-controls="pillar-panel"
                    className={pillarIndex === index ? "is-active" : ""}
                    onClick={() => setPillarIndex(index)}
                  >
                    {pillar.tab}
                  </button>
                ))}
              </div>
              <div className="pillars-panel" id="pillar-panel" role="tabpanel" aria-labelledby={`pillar-tab-${pillarIndex}`} key={pillarIndex}>
                <div className="pillars-copy">
                  <h3>{pillars[pillarIndex].title}</h3>
                  {pillars[pillarIndex].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                <div className="pillars-media">
                  <div className="pillars-image">
                    <Image src={pillars[pillarIndex].image} alt={pillars[pillarIndex].imageAlt} fill sizes="(max-width: 780px) 100vw, 45vw" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="news-section" aria-labelledby="news-title">
          <div className="reference-wrap">
            <h2 id="news-title" className="news-title">In the News</h2>
            <div className="news-grid" data-reveal>
              <article className="news-feature">
                <div className="news-feature-media">
                  {latestPressReleases.map((release, index) => (
                    <Image className={newsSlide === index ? "is-active" : ""} src={release.image} alt={newsSlide === index ? release.alt : ""} fill sizes="(max-width: 780px) 100vw, 30vw" key={release.title} />
                  ))}
                  <div className="news-feature-dots">
                    {latestPressReleases.map((release, index) => (
                      <button key={release.title} type="button" className={newsSlide === index ? "is-active" : ""} aria-label={`Show press release ${index + 1}`} aria-pressed={newsSlide === index} onClick={() => setNewsSlide(index)} />
                    ))}
                  </div>
                </div>
                <Link className="news-feature-copy" href="/newsroom#press-releases">
                  <span className="news-label">Press release</span>
                  <div className="news-card-body" key={newsSlide} aria-live="polite">
                    <span className="news-event-date">{latestPressReleases[newsSlide].date}</span>
                    <h3>{latestPressReleases[newsSlide].title}</h3>
                    <p className="news-quote">{latestPressReleases[newsSlide].summary}</p>
                  </div>
                  <span className="news-more">View all press releases <span aria-hidden="true">↗</span></span>
                </Link>
              </article>

              <article className="news-card news-card-company">
                <span className="news-label">Notices</span>
                <div className="news-card-body" key={noticeIndex} aria-live="polite">
                  <h3>{companyNotices[noticeIndex].title}</h3>
                  <p className="news-quote">
                    {companyNotices[noticeIndex].company}
                    <small>{companyNotices[noticeIndex].date}</small>
                  </p>
                </div>
                <button className="news-refresh" type="button" aria-label="Show another notice" onClick={() => setNoticeIndex((current) => (current + 1) % companyNotices.length)}>{refreshIcon}</button>
              </article>

              <article className="news-card news-card-facts">
                <span className="news-label">Facts</span>
                <h3>Did you know</h3>
                <div className="news-card-body" key={factIndex} aria-live="polite">
                  <p className="news-quote">{groupFacts[factIndex]}<small>One horizon, many ambitions.</small></p>
                </div>
                <button className="news-refresh" type="button" aria-label="Show another fact" onClick={() => setFactIndex((current) => (current + 1) % groupFacts.length)}>{refreshIcon}</button>
              </article>

              <article className="news-feature news-feature-events">
                <div className="news-feature-media">
                  {latestEvents.map((event, index) => (
                    <Image className={eventSlide === index ? "is-active" : ""} src={event.image} alt={eventSlide === index ? event.alt : ""} fill sizes="(max-width: 780px) 100vw, 30vw" key={event.title} />
                  ))}
                  <div className="news-feature-dots">
                    {latestEvents.map((event, index) => (
                      <button key={event.title} type="button" className={eventSlide === index ? "is-active" : ""} aria-label={`Show event ${index + 1}`} aria-pressed={eventSlide === index} onClick={() => setEventSlide(index)} />
                    ))}
                  </div>
                </div>
                <Link className="news-feature-copy" href="/newsroom#events">
                  <span className="news-label">Events</span>
                  <div className="news-card-body" key={eventSlide} aria-live="polite">
                    <span className="news-event-date">{latestEvents[eventSlide].date}</span>
                    <h3>{latestEvents[eventSlide].title}</h3>
                    <p className="news-quote">{latestEvents[eventSlide].summary}</p>
                  </div>
                  <span className="news-more">View all events <span aria-hidden="true">↗</span></span>
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="home-faq-section" id="faq" aria-labelledby="home-faq-title">
          <div className="reference-wrap home-faq-layout" data-reveal>
            <div className="home-faq-heading">
              <p className="section-overline">FREQUENTLY ASKED QUESTIONS</p>
              <h2 id="home-faq-title">Questions about<br /><em>the group?</em></h2>
              <p className="section-lead">Helpful information about Sanjeevani Group, its businesses, locations, and how to get in touch.</p>
              <Link className="group-intro-link" href="/faq">View all FAQs <span aria-hidden="true">→</span></Link>
            </div>
            <div className="section-faq-list">
              {faqs.map(({ question, answer }) => (
                <details key={question}><summary>{question}</summary><p>{answer}</p></details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <GroupFooter />
    </>
  );
}
