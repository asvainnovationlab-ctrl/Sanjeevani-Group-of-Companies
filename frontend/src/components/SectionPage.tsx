"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { businesses as localBusinesses, businessGroups, type Business, type BusinessGroup } from "@/data/businesses";
import GroupEmblem from "@/components/GroupEmblem";
import GmailContactButton from "@/components/GmailContactButton";
import GroupFooter from "@/components/GroupFooter";
import BusinessDirectoryCard from "@/components/BusinessDirectoryCard";
import BusinessNavMenu from "@/components/BusinessNavMenu";
import AboutNavMenu from "@/components/AboutNavMenu";
import SocialLinks from "@/components/SocialLinks";

const navigation = [
  { label: "About us", href: "/about-us", keywords: "our story about history values purpose" },
  { label: "Business", href: "/businesses", keywords: "companies healthcare education agriculture suppliers construction" },
  { label: "Media", href: "/media", keywords: "updates stories group" },
  { label: "Investors", href: "/investors", keywords: "growth long term contact" },
  { label: "Community", href: "/community", keywords: "people education health agriculture" },
  { label: "Careers", href: "/careers", keywords: "jobs work careers email" },
  { label: "Contact", href: "/contact", keywords: "contact email phone location enquiry message" },
];

const careerAreas = [
  {
    title: "Care & clinical services",
    type: "Healthcare",
    companyNames: [
      "Sanjeevani Hospital, Pokhara",
      "Sanjeevani Hospital, Nepalgunj",
      "Sanjeevani Institute of Advance Science and Teaching Hospital",
    ],
  },
  {
    title: "Medical education",
    type: "Education",
    companyNames: ["Nepalgunj Medical College", "Universal Medical College", "Gandaki Medical College"],
  },
  {
    title: "School education",
    type: "Education",
    companyNames: ["Everest Education Foundation", "Mount Everest School"],
  },
  {
    title: "Agriculture & food",
    type: "Agriculture",
    companyNames: ["Om Agro", "Janakpur Agro", "Khilung Kalika Agro", "Khilung Kalika Feeders", "Khilung Kalika Foods"],
  },
  {
    title: "Construction & supply",
    type: "Infrastructure",
    companyNames: ["Khilung Kalika Construction", "Khilung Kalika Suppliers"],
  },
  {
    title: "Hydropower & engineering",
    type: "Infrastructure",
    companyNames: ["Laughing Budha Hydro Power"],
  },
  {
    title: "Development & marketing",
    type: "Business operations",
    companyNames: ["Sanjeevani Developers", "Khilung Kalika Marketing"],
  },
];

const pageContent: Record<string, {
  number: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  intro: string;
  lead: string;
  paragraphs: string[];
  faqs?: { question: string; answer: string }[];
  links?: { label: string; href: string }[];
}> = {
  "our-story": {
    number: "01",
    navLabel: "Our story",
    eyebrow: "SANJEEVANI GROUP / OUR STORY",
    title: "One shared purpose.<br />Many ways to grow.",
    intro: "A connected group of independent businesses, brought together by a belief in meaningful progress.",
    lead: "Different expertise. Shared ambition.",
    paragraphs: [
      "Sanjeevani Group brings together businesses working across healthcare, education, agriculture, construction, development, and other sectors.",
      "Each company has its own focus and role. Together, they form a diverse group working to create opportunity and contribute to the communities around them.",
    ],
  },
  "about-us": {
    number: "",
    navLabel: "About us",
    eyebrow: "SANJEEVANI GROUP / ABOUT US",
    title: "Rooted in Nepal.<br />Growing together.",
    intro: "A family of independent businesses, united by shared purpose and a long-term view.",
    lead: "A brief history",
    paragraphs: [
      "Sanjeevani Group brings together independent businesses working across healthcare, education, agriculture, construction, development, and more.",
      "Each business contributes its own expertise and perspective. Together, they reflect a shared commitment to care, opportunity, and meaningful progress for the communities around us.",
    ],
  },
  "mission-vision-values": {
    number: "12",
    navLabel: "Mission, Vision & Values",
    eyebrow: "SANJEEVANI GROUP / OUR PURPOSE",
    title: "Guided by purpose.<br />Growing with care.",
    intro: "The shared principles and long-term ambition that guide Sanjeevani Group and its businesses.",
    lead: "Our mission, vision and values",
    paragraphs: [
      "Our mission is to bring independent businesses together to create meaningful progress and opportunity in the communities we serve.",
      "Our vision is to grow responsibly as a trusted group, contributing to a stronger future for Nepal.",
      "Our values are care, trust and growth: putting people first, building lasting relationships, and bringing different expertise together to create opportunity.",
    ],
  },
  leadership: {
    number: "14",
    navLabel: "Leadership",
    eyebrow: "SANJEEVANI GROUP / LEADERSHIP",
    title: "Leadership with<br />a long-term view.",
    intro: "Meet the leadership guiding Sanjeevani Group’s shared purpose and its family of businesses.",
    lead: "Chairman",
    paragraphs: [
      "C.A. Khuma Parsad Aryal is the Chairman of Sanjeevani Group. The group brings together independent businesses working across healthcare, education, agriculture, infrastructure and more.",
    ],
  },
  businesses: {
    number: "02",
    navLabel: "Business",
    eyebrow: "SANJEEVANI GROUP / OUR BUSINESSES",
    title: "A broad group.<br />Distinct businesses.",
    intro: "Explore the companies and sectors that make up Sanjeevani Group.",
    lead: "18 companies. Four areas of work.",
    paragraphs: [
      "Browse the directory by company name or first letter. Search results reflect the latest published directory when MongoDB is connected.",
    ],
  },
  media: {
    number: "03",
    navLabel: "Media",
    eyebrow: "SANJEEVANI GROUP / MEDIA",
    title: "Stories from<br />across the group.",
    intro: "A place for announcements, stories, and updates from Sanjeevani Group and its businesses.",
    lead: "News and updates",
    paragraphs: [
      "There are no verified media announcements to display yet. Group updates can be added here when they are ready to share.",
    ],
  },
  investors: {
    number: "04",
    navLabel: "Investors",
    eyebrow: "SANJEEVANI GROUP / INVESTORS",
    title: "A diverse group.<br />A long-term view.",
    intro: "Information for partners interested in Sanjeevani Group and its portfolio of businesses.",
    lead: "Building with a long-term perspective.",
    paragraphs: [
      "Sanjeevani Group brings together independent businesses across several sectors. For official company, governance, or financial information, please contact the group directly.",
      "No financial reports or investment offers are published on this page.",
    ],
  },
  community: {
    number: "05",
    navLabel: "Community",
    eyebrow: "SANJEEVANI GROUP / COMMUNITY",
    title: "Progress is better<br />when shared.",
    intro: "Our businesses are part of the communities around them. People, local partners, and places all play a role in the group’s story.",
    lead: "Connected to the communities around us.",
    paragraphs: [
      "Healthcare, education, and agriculture are among the areas represented across the group’s businesses.",
      "Specific community programmes and announcements will be shared here once confirmed.",
    ],
  },
  careers: {
    number: "06",
    navLabel: "Careers",
    eyebrow: "SANJEEVANI GROUP / CAREERS",
    title: "Careers",
    intro: "Explore career areas across our group. Contact a company directly to confirm its current openings.",
    lead: "Explore opportunities across the group.",
    paragraphs: [
      "Career opportunities are managed by the individual group businesses. Contact us to ask about current openings or the right team to reach.",
    ],
  },
  contact: {
    number: "13",
    navLabel: "Contact",
    eyebrow: "SANJEEVANI GROUP / CONTACT",
    title: "Let’s start<br />a conversation.",
    intro: "Send an enquiry to Sanjeevani Group or find a map search for the group in Nepal.",
    lead: "Contact us",
    paragraphs: [],
  },
  faq: {
    number: "07",
    navLabel: "Frequently asked questions",
    eyebrow: "SANJEEVANI GROUP / FAQ",
    title: "Questions about<br />the group?",
    intro: "Helpful information about Sanjeevani Group, its businesses, locations, and how to get in touch.",
    lead: "Frequently asked questions",
    paragraphs: [],
    faqs: [
      { question: "How many businesses are part of Sanjeevani Group?", answer: "The group directory currently lists 18 businesses. Use the Businesses page to browse the latest published directory." },
      { question: "Which sectors does the group work in?", answer: "The group spans healthcare, education, agriculture, and other areas including construction, development, hydropower, and supply." },
      { question: "Where can I find the group’s locations?", answer: "The homepage map links to city searches in Google Maps. A map marker is a location reference, not confirmation of a specific office; please contact the relevant business before visiting." },
      { question: "How can I ask about a business or partnership?", answer: "Email info@sanjeevanigroup.com with your enquiry and the name of the business or subject you are asking about." },
      { question: "How can I ask about careers?", answer: "Career opportunities are managed by individual businesses. Use the Careers page to contact the group about current openings or the right team." },
    ],
  },
  "privacy-policy": {
    number: "08",
    navLabel: "Privacy policy",
    eyebrow: "SANJEEVANI GROUP / PRIVACY",
    title: "Your privacy<br />matters to us.",
    intro: "This notice describes how information is handled when you use this website.",
    lead: "Website privacy notice",
    paragraphs: [
      "Directory searches are performed in your browser. When you open the Businesses page from a search result, the search term may be kept in session storage for that navigation so it can be applied there.",
      "The website requests the published business directory from its own API. Directory records may include business names, sectors, descriptions, locations, and website addresses. The site does not provide account registration or an enquiry form.",
      "Contact links open your email application. If you send a message, the information in it is received and handled by the group to respond to your enquiry.",
      "City markers link to Google Maps. When you follow an external link, that service may process information under its own privacy notice.",
      "The Contact page embeds a Google Maps search. Loading the map may send technical information, including your IP address, to Google under its privacy notice.",
      "This website does not currently include an intentional advertising or analytics tracker. The hosting provider and connected database may process technical information needed to deliver and operate the service; confirm their current retention and processing terms before publication.",
      "For privacy questions, contact info@sanjeevanigroup.com. This notice should be reviewed against the group’s actual hosting, database, and operational practices before being treated as a final legal policy.",
    ],
  },
  "terms-of-use": {
    number: "09",
    navLabel: "Terms of use",
    eyebrow: "SANJEEVANI GROUP / TERMS",
    title: "Using this<br />website.",
    intro: "Please use this website responsibly and verify important information directly with the relevant business.",
    lead: "Website terms",
    paragraphs: [
      "This website provides general information about Sanjeevani Group and its businesses. Content is provided for information and may change; contact the relevant business to confirm current services, locations, and details.",
      "Nothing on this website is an offer, investment recommendation, or substitute for professional advice. Investor information should be requested directly from the group.",
      "You may not misuse the website, attempt to disrupt its operation, or use its content in a way that violates applicable law or another person’s rights.",
      "Links to third-party websites are provided for convenience. Sanjeevani Group does not control those websites or their content.",
      "Questions about these terms can be sent to info@sanjeevanigroup.com. These draft terms should be reviewed for the group’s jurisdiction and business requirements before publication.",
    ],
  },
  accessibility: {
    number: "10",
    navLabel: "Accessibility",
    eyebrow: "SANJEEVANI GROUP / ACCESSIBILITY",
    title: "Access for<br />everyone.",
    intro: "We want this website to be usable by as many people as possible.",
    lead: "Our accessibility approach",
    paragraphs: [
      "The website is designed to support responsive layouts, keyboard navigation, visible focus states, and reduced-motion preferences. Some content and interactions may still have accessibility limitations.",
      "If you encounter a barrier or need information in another format, email info@sanjeevanigroup.com and describe the page and assistance you need.",
      "We welcome feedback and will use it to identify improvements. This statement describes our intent and is not a claim of formal conformance or certification.",
    ],
  },
  sitemap: {
    number: "11",
    navLabel: "Sitemap",
    eyebrow: "SANJEEVANI GROUP / SITEMAP",
    title: "Explore the<br />whole group.",
    intro: "Find the main sections and resources available on the Sanjeevani Group website.",
    lead: "Website directory",
    paragraphs: [],
    links: [
      { label: "Home", href: "/" },
      { label: "Who we are", href: "/#story" },
      { label: "About us", href: "/about-us" },
      { label: "Locations", href: "/#locations" },
      { label: "Businesses", href: "/businesses" },
      { label: "Media", href: "/media" },
      { label: "Investors", href: "/investors" },
      { label: "Community", href: "/community" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Frequently asked questions", href: "/faq" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms of use", href: "/terms-of-use" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
};

function Brand() {
  return (
    <Link className="reference-brand section-brand" href="/" aria-label="Sanjeevani Group home">
      <span className="brand-emblem-small" aria-hidden="true">
        <GroupEmblem />
      </span>
      <span className="brand-wordmark">Sanjeevani<span>GROUP OF COMPANIES</span></span>
    </Link>
  );
}

export default function SectionPage({ section }: { section: string }) {
  const page = pageContent[section === "our-story" ? "about-us" : section];
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>(localBusinesses);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [letter, setLetter] = useState("All");
  const [businessCategory, setBusinessCategory] = useState<Business["category"] | "all">("all");
  const [businessGroup, setBusinessGroup] = useState<BusinessGroup | "all">("all");
  const [contactNotice, setContactNotice] = useState("");
  const [careerSearch, setCareerSearch] = useState("");
  const [careerCompany, setCareerCompany] = useState("All companies");
  const [careerType, setCareerType] = useState("All areas");

  useEffect(() => {
    if (section !== "businesses" && section !== "about-us" && section !== "our-story" && section !== "careers") return;
    fetch("/api/businesses")
      .then(async (response) => {
        const result = (await response.json()) as { data: Business[] };
        if (!response.ok) throw new Error("Could not refresh company directory.");
        if (result.data.length) setBusinesses(result.data);
      })
      .catch((error: unknown) => console.error("Using the bundled business directory.", error));
  }, [section]);

  useEffect(() => {
    if (section === "businesses") {
      const searchParams = new URLSearchParams(window.location.search);
      const group = businessGroups.find((item) => item.value === searchParams.get("group"));
      const category = searchParams.get("category");
      setBusinessGroup(group?.value ?? "all");
      if (category === "healthcare" || category === "education" || category === "agriculture" || category === "other") {
        setBusinessCategory(category);
      } else {
        setBusinessCategory("all");
      }
      const savedSearch = window.sessionStorage.getItem("sanjeevani-business-search");
      const searchQuery = searchParams.get("search");
      setDirectoryQuery(searchQuery || savedSearch || "");
      if (savedSearch) window.sessionStorage.removeItem("sanjeevani-business-search");
    }
  }, [section]);

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    const businessMatches = businesses
      .filter((business) => `${business.name} ${business.sector}`.toLowerCase().includes(term))
      .slice(0, 5)
      .map((business) => ({ label: business.name, detail: business.sector, href: "/businesses" }));
    const pageMatches = navigation
      .filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(term))
      .slice(0, 4)
      .map((item) => ({ label: item.label, detail: "Explore this page", href: item.href }));
    return [...businessMatches, ...pageMatches].slice(0, 7);
  }, [businesses, search]);

  const alphabet = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

  const visibleBusinesses = useMemo(() => {
    const term = directoryQuery.trim().toLowerCase();
    return businesses.filter((business) => {
      const matchesLetter = letter === "All" || business.name.toUpperCase().startsWith(letter);
      const matchesSearch = !term || `${business.name} ${business.sector} ${business.description}`.toLowerCase().includes(term);
      const matchesCategory = businessCategory === "all" || business.category === businessCategory;
      const matchesGroup = businessGroup === "all" || businessGroups.find((item) => item.value === businessGroup)?.matches(business);
      return matchesLetter && matchesSearch && matchesCategory && matchesGroup;
    });
  }, [businessCategory, businessGroup, businesses, directoryQuery, letter]);

  const visibleCareerAreas = useMemo(() => {
    const term = careerSearch.trim().toLowerCase();
    return careerAreas.filter((area) => {
      const matchesCompany = careerCompany === "All companies" || area.companyNames.includes(careerCompany);
      const matchesType = careerType === "All areas" || area.type === careerType;
      const searchable = `${area.title} ${area.type} ${area.companyNames.join(" ")}`.toLowerCase();
      return matchesCompany && matchesType && (!term || searchable.includes(term));
    });
  }, [careerCompany, careerSearch, careerType]);

  function followSearchResult(href: string) {
    if (href === "/businesses" && search.trim()) {
      window.sessionStorage.setItem("sanjeevani-business-search", search.trim());
    }
    window.location.assign(href);
  }

  function submitContactForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      message,
    ].join("\n");

    window.location.href = `mailto:info@sanjeevanigroup.com?subject=${encodeURIComponent("Website enquiry")}&body=${encodeURIComponent(body)}`;
    setContactNotice("Your email application should open with your enquiry ready to send. If it does not, email info@sanjeevanigroup.com.");
  }

  return (
    <>
      <header className="reference-header">
        <div className="reference-wrap header-inner">
          <Brand />
          <nav className={`reference-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
            {navigation.map((item) => item.label === "About us" ? (
              <AboutNavMenu key={item.href} isCurrent={section === "about-us" || section === "our-story"} />
            ) : item.label === "Business" ? (
              <BusinessNavMenu businesses={businesses} key={item.href} isCurrent={section === "businesses"} />
            ) : (
              <Link className={item.href === `/${section}` ? "is-current" : ""} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
            ))}
            <SocialLinks className="mobile-nav-social-links" />
          </nav>
          <div className="reference-search" role="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <label className="visually-hidden" htmlFor="section-search">Search Sanjeevani Group</label>
            <input id="section-search" type="search" placeholder="Search the group" value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); if (event.key === "Enter" && searchResults[0]) followSearchResult(searchResults[0].href); }} />
            {searchOpen && search.trim() && <ul className="search-results">{searchResults.length ? searchResults.map((result) => <li key={`${result.href}-${result.label}`}><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => followSearchResult(result.href)}>{result.label}<small>{result.detail}</small></button></li>) : <li className="search-no-results">No results found.</li>}</ul>}
          </div>
          <SocialLinks className="header-social-links" />
          <button className="reference-menu" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
        </div>
      </header>

      <GmailContactButton />

      <main className="section-page">
        <section className={`section-page-hero${["about-us", "our-story", "businesses", "media", "investors", "community", "contact"].includes(section) ? " section-page-hero-clean" : ""}${section === "contact" ? " contact-page-hero" : ""}${section === "careers" ? " career-page-hero" : ""}`}>
          <div className="hero-grid" aria-hidden="true" />
          <div className="section-page-orbit" aria-hidden="true" />
          <div className="reference-wrap section-page-hero-content">
            <p className="section-overline">{page.eyebrow}</p>
            <h1 dangerouslySetInnerHTML={{ __html: page.title }} />
            <p>{page.intro}</p>
            <div className="section-page-breadcrumb"><Link href="/">Home</Link><span>/</span><span>{page.navLabel}</span></div>
          </div>
          <span className="section-page-number" aria-hidden="true">{page.number}</span>
        </section>

        {section === "careers" ? (
          <section className="career-board" aria-labelledby="career-board-title">
            <div className="reference-wrap">
              <div className="career-board-heading">
                <div>
                  <p className="section-overline">CAREERS AT SANJEEVANI GROUP</p>
                  <h2 id="career-board-title">Explore career paths</h2>
                  <p>Discover the fields represented across our businesses. Hiring is managed by each company, so please contact them to confirm current openings.</p>
                </div>
              </div>
              <div className="career-filters">
                <label className="career-search">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  <span className="visually-hidden">Search career areas or businesses</span>
                  <input type="search" placeholder="Search roles or companies" value={careerSearch} onChange={(event) => setCareerSearch(event.target.value)} />
                </label>
                <label className="visually-hidden" htmlFor="career-company-filter">Filter by company</label>
                <select id="career-company-filter" value={careerCompany} onChange={(event) => setCareerCompany(event.target.value)}>
                  <option>All companies</option>
                  {businesses.map((business) => <option key={business._id}>{business.name}</option>)}
                </select>
                <label className="visually-hidden" htmlFor="career-type-filter">Filter by career area</label>
                <select id="career-type-filter" value={careerType} onChange={(event) => setCareerType(event.target.value)}>
                  <option>All areas</option>
                  {[...new Set(careerAreas.map((area) => area.type))].map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <p className="career-result-count" aria-live="polite">{visibleCareerAreas.length} career {visibleCareerAreas.length === 1 ? "area" : "areas"} · current vacancies should be confirmed with each business</p>
              <div className="career-area-list">
                {visibleCareerAreas.map((area) => (
                  <article className="career-area-card" key={area.title}>
                    <div className="career-area-details">
                      <h3>{area.title}</h3>
                      <p className="career-area-companies">{area.companyNames.join(" · ")}</p>
                      <div className="career-area-meta"><span>Nepal</span><span>{area.type}</span><span>Company-led recruitment</span></div>
                    </div>
                    <a className="career-area-cta" href={`mailto:info@sanjeevanigroup.com?subject=${encodeURIComponent(`Career enquiry: ${area.title}`)}&body=${encodeURIComponent(`Hello Sanjeevani Group,\n\nI would like to enquire about current opportunities in ${area.title}.\n\nPlease let me know which group company I should contact.\n`)}`}>
                      Enquire about roles <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                ))}
                {visibleCareerAreas.length === 0 && <p className="career-empty">No career areas match those filters. Try a different search or company.</p>}
              </div>
              <p className="career-listing-note">These are career areas, not advertised vacancies. Role availability, requirements, and locations vary by company.</p>
            </div>
          </section>
        ) : section === "contact" ? (
          <section className="contact-section">
            <div className="reference-wrap contact-panel">
              <div className="contact-map">
                <iframe
                  title="Google Maps search for Sanjeevani Group in Nepal"
                  src="https://maps.google.com/maps?q=Sanjeevani%20Group%20Nepal&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <p>Map search for Sanjeevani Group in Nepal. Please confirm the relevant company’s address before visiting.</p>
              </div>
              <form className="contact-form" onSubmit={submitContactForm}>
                <label htmlFor="contact-name">Full name</label>
                <input id="contact-name" name="name" type="text" autoComplete="name" placeholder="Enter full name" maxLength={120} required />
                <label htmlFor="contact-email">Email address</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="Enter email" maxLength={254} required />
                <label htmlFor="contact-phone">Phone <span>(optional)</span></label>
                <input id="contact-phone" name="phone" type="tel" autoComplete="tel" placeholder="Enter phone" maxLength={40} />
                <label htmlFor="contact-message">How can we help?</label>
                <textarea id="contact-message" name="message" placeholder="Write your message here" maxLength={4000} required />
                <button className="contact-submit" type="submit">Send message <span aria-hidden="true">↗</span></button>
                {contactNotice && <p className="contact-notice" role="status">{contactNotice}</p>}
                <small>Your details are placed into an email draft and are not stored by this website.</small>
              </form>
            </div>
          </section>
        ) : section === "about-us" || section === "our-story" ? (
          <>
            <section className="about-history reference-section">
              <div className="reference-wrap">
                <div className="about-history-heading">
                  <div>
                    <p className="section-overline">BRIEF HISTORY</p>
                    <h2>A story of steady<br /><em>progress and purpose.</em></h2>
                  </div>
                  <p className="section-lead">Explore the {businesses.length} businesses that make up Sanjeevani Group, each with its own focus and place in our shared story.</p>
                </div>
                <ol className="about-timeline">
                  {businesses.map((business) => (
                    <li key={business._id}>
                      <span className="about-timeline-marker" aria-hidden="true" />
                      <article className={`about-timeline-card about-timeline-${business.category}`}>
                        <div className="about-timeline-art" aria-hidden="true">
                          <span>{business.sector}</span>
                          <strong>{business.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</strong>
                        </div>
                        <div className="about-timeline-copy">
                          <span className="about-timeline-kicker">{business.category.replace("-", " ").toUpperCase()}</span>
                          <h3>{business.name}</h3>
                          <p>{business.description}</p>
                          {(business.location || business.sector) && <small>{[business.location, business.sector].filter(Boolean).join(" · ")}</small>}
                        </div>
                      </article>
                    </li>
                  ))}
                </ol>
                <p className="about-history-note">The companies are shown in group directory order. Verified founding dates and historical milestones can be added when available.</p>
              </div>
            </section>
            <section className="about-values">
              <div className="reference-wrap">
                <p className="section-overline">WHAT GUIDES US</p>
                <h2>Our shared values</h2>
                <div className="about-values-grid">
                  <article><span>PEOPLE</span><h3>Care</h3><p>Put people and the communities around our businesses first.</p></article>
                  <article><span>RELATIONSHIPS</span><h3>Trust</h3><p>Build lasting relationships through responsible, thoughtful work.</p></article>
                  <article><span>FUTURE</span><h3>Growth</h3><p>Bring different expertise together to create opportunity.</p></article>
                </div>
              </div>
            </section>
          </>
        ) : section === "businesses" ? (
          <section className="reference-section directory-section section-page-content">
            <div className="reference-wrap">
              <p className="section-overline">THE GROUP</p>
              <div className="directory-heading"><div><h2>{businessGroup !== "all" ? businessGroups.find((item) => item.value === businessGroup)?.label : businessCategory === "all" ? "Our businesses" : `${businessCategory[0].toUpperCase()}${businessCategory.slice(1)} businesses`}</h2><p className="section-lead">Eighteen companies, each with a distinct role in our shared story. Explore the directory by name.</p></div><p className="directory-total"><strong>{visibleBusinesses.length}</strong><span>{businessGroup === "all" && businessCategory === "all" ? "companies in the group" : "matching businesses"}</span></p></div>
              <div className="directory-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg><label className="visually-hidden" htmlFor="page-directory-search">Search companies</label><input id="page-directory-search" type="search" placeholder="Search companies by name or sector" value={directoryQuery} onChange={(event) => { setDirectoryQuery(event.target.value); setLetter("All"); }} /><span>{visibleBusinesses.length} results</span></div>
              <div className="directory-letters" role="toolbar" aria-label="Filter businesses by first letter">{alphabet.map((value) => <button key={value} type="button" disabled={value !== "All" && !businesses.some((business) => business.name.toUpperCase().startsWith(value))} className={letter === value ? "is-active" : ""} aria-pressed={letter === value} onClick={() => { setLetter(value); setDirectoryQuery(""); }}>{value}</button>)}</div>
              <div className="directory-grid" aria-live="polite">{visibleBusinesses.map((business, index) => <BusinessDirectoryCard business={business} index={index} key={business._id} />)}{visibleBusinesses.length === 0 && <p className="directory-empty">No businesses match. Try another name or letter.</p>}</div>
            </div>
          </section>
        ) : (
          <>
            <section className="reference-section section-page-content">
              <div className="reference-wrap section-page-copy">
                <div><p className="section-overline">{page.number} / {page.navLabel.toUpperCase()}</p><h2>{page.lead}</h2></div>
                <div className="section-page-paragraphs">{page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {page.faqs && <div className="section-faq-list">{page.faqs.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>}
                  {page.links && <nav className="section-sitemap-links" aria-label="Website pages">{page.links.map(({ label, href }) => <Link href={href} key={href}>{label}<span aria-hidden="true">↗</span></Link>)}</nav>}
                  {section === "careers" && <a className="reference-button" href="mailto:careers@sanjeevanigroup.com?subject=Career%20enquiry">Email our team <span>↗</span></a>}
                  {section === "investors" && <a className="reference-button" href="mailto:info@sanjeevanigroup.com?subject=Investor%20enquiry">Investor enquiries <span>↗</span></a>}
                </div>
              </div>
            </section>
            {["our-story", "community", "media"].includes(section) && (
              <section className="section-page-highlights">
                <div className="reference-wrap">
                  <p className="section-overline">{section === "our-story" ? "WHAT CONNECTS US" : section === "community" ? "AREAS ACROSS THE GROUP" : "STAY CONNECTED"}</p>
                  <div className="section-highlight-grid">
                    {(section === "our-story"
                      ? [["01", "Care", "Put people and the communities around our businesses at the heart of progress."], ["02", "Trust", "Build lasting relationships through thoughtful, reliable work."], ["03", "Growth", "Bring different areas of expertise together to help create opportunity."]]
                      : section === "community"
                        ? [["01", "Healthcare", "Healthcare businesses are part of the wider group."], ["02", "Education", "Education businesses help shape the group’s portfolio."], ["03", "Agriculture", "Agriculture businesses support another important area of work."]]
                        : [["01", "Group updates", "News and announcements will be shared here when confirmed."], ["02", "Business stories", "Stories from across the group will appear as they become available."], ["03", "Contact", "For a media enquiry, get in touch with the group."]]
                    ).map(([number, title, description]) => <article className="section-highlight-card" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p>{section === "media" && number === "03" && <a href="mailto:info@sanjeevanigroup.com">Send an enquiry ↗</a>}</article>)}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <GroupFooter />
    </>
  );
}
