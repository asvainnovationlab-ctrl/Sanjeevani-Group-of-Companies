"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { businesses as localBusinesses, businessGroups, type Business, type BusinessGroup } from "@/data/businesses";
import { getBusinessLogo } from "@/data/businessLogos";
import GroupEmblem from "@/components/GroupEmblem";
import GmailContactButton from "@/components/GmailContactButton";
import GroupFooter from "@/components/GroupFooter";
import BusinessDirectoryCard from "@/components/BusinessDirectoryCard";
import BusinessNavMenu from "@/components/BusinessNavMenu";
import AboutNavMenu from "@/components/AboutNavMenu";
import MediaNavMenu from "@/components/MediaNavMenu";
import SocialLinks from "@/components/SocialLinks";
import NepalNetworkMap from "@/components/NepalNetworkMap";

const navigation = [
  { label: "About us", href: "/about-us" },
  { label: "Business", href: "/businesses" },
  { label: "Media", href: "/media" },
  { label: "Investors", href: "/investors" },
  { label: "Community", href: "/community" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];
const mediaPages = [
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Press Release", href: "/press-release" },
  { label: "Newsletter", href: "/newsletter" },
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
  team: {
    number: "15",
    navLabel: "Team",
    eyebrow: "SANJEEVANI GROUP / TEAM",
    title: "The people behind<br />our shared purpose.",
    intro: "Meet the people who contribute to Sanjeevani Group and its businesses.",
    lead: "Our team",
    paragraphs: [
      "Team profiles will be added here as official information becomes available. For current enquiries, please contact Sanjeevani Group.",
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
  news: {
    number: "03A",
    navLabel: "News",
    eyebrow: "SANJEEVANI GROUP / NEWS",
    title: "News from<br />across the group.",
    intro: "Announcements and updates from Sanjeevani Group and its businesses.",
    lead: "News",
    paragraphs: [
      "There are no verified news announcements to share at this time. Updates will be published here when confirmed.",
    ],
  },
  events: {
    number: "03B",
    navLabel: "Events",
    eyebrow: "SANJEEVANI GROUP / EVENTS",
    title: "Events across<br />the group.",
    intro: "Discover events and activities from Sanjeevani Group and its businesses.",
    lead: "Events",
    paragraphs: [
      "There are no confirmed upcoming events to display at this time. Event details will be shared here when available.",
    ],
  },
  "press-release": {
    number: "03C",
    navLabel: "Press Release",
    eyebrow: "SANJEEVANI GROUP / PRESS RELEASE",
    title: "Official updates<br />from the group.",
    intro: "Official announcements and statements from Sanjeevani Group.",
    lead: "Press Release",
    paragraphs: [
      "There are no approved press releases to display at this time. Official statements will be published here when available.",
    ],
  },
  newsletter: {
    number: "03D",
    navLabel: "Newsletter",
    eyebrow: "SANJEEVANI GROUP / NEWSLETTER",
    title: "News from<br />across Sanjeevani.",
    intro: "Read updates and highlights from Sanjeevani Group and its businesses.",
    lead: "Newsletter",
    paragraphs: [
      "No newsletters are available yet. Group news and highlights will be shared here when editions are ready.",
    ],
  },
  reviews: {
    number: "03E",
    navLabel: "Reviews",
    eyebrow: "SANJEEVANI GROUP / REVIEWS",
    title: "Experiences<br />across our group.",
    intro: "Reviews and feedback about the services offered by Sanjeevani Group businesses.",
    lead: "Reviews",
    paragraphs: [
      "Verified reviews are not available to display yet. For feedback about a specific service, please contact the relevant business directly.",
    ],
  },
  gallery: {
    number: "03E",
    navLabel: "Gallery",
    eyebrow: "SANJEEVANI GROUP / GALLERY",
    title: "A closer look<br />at our work.",
    intro: "Photos and moments from Sanjeevani Group and its businesses.",
    lead: "Gallery",
    paragraphs: [
      "There are no approved gallery photos to display yet. Images will be added here as they become available.",
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
      { label: "Team", href: "/team" },
      { label: "Media", href: "/media" },
      ...mediaPages,
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

const coreValues = [
  {
    title: "Pioneering Spirit",
    icon: <><path d="M12 15c3-2 6-6 6-11-5 0-9 3-11 6l-3 1 2 2" /><path d="m9 15 2 2" /><path d="M6 18c-1 1-1.5 2.5-1.5 2.5S6 20 7 19" /><circle cx="14.5" cy="9.5" r="1.5" /></>,
    text: "Sanjeevani Group is founded on the belief that better services change lives. We actively nurture new ideas in our people and our businesses.",
  },
  {
    title: "Team Work",
    icon: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M15 14.5c3 0 6 1.8 6 5.5" /></>,
    text: "We believe every person in our organisation is a valuable and indispensable member of one team.",
  },
  {
    title: "Accountability",
    icon: <><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    text: "Transparency and good governance underpin every action we take across Sanjeevani Group.",
  },
  {
    title: "Excellence",
    icon: <><circle cx="12" cy="9" r="6" /><path d="m12 6 .9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1L9 8.2l2.1-.3L12 6Z" /><path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7" /></>,
    text: "We strive for the highest standards of quality in healthcare, education and every business we run.",
  },
  {
    title: "Morality",
    icon: <><path d="M12 3v18M7 21h10" /><path d="M5 7h14" /><path d="m5 7-3 6c0 1.7 1.3 3 3 3s3-1.3 3-3L5 7ZM19 7l-3 6c0 1.7 1.3 3 3 3s3-1.3 3-3l-3-6Z" /></>,
    text: "We are dedicated to delivering ethical, fair and responsible services to the people and communities we serve.",
  },
];

export default function SectionPage({ section }: { section: string }) {
  const page = pageContent[section === "our-story" ? "about-us" : section];
  const photoHero = section === "mission-vision-values" || section === "our-story";
  const [menuOpen, setMenuOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>(localBusinesses);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [letter, setLetter] = useState("All");
  const [businessCategory, setBusinessCategory] = useState<Business["category"] | "all">("all");
  const [businessGroup, setBusinessGroup] = useState<BusinessGroup | "all">("all");
  const [businessDirectoryOpen, setBusinessDirectoryOpen] = useState(false);
  const [contactNotice, setContactNotice] = useState("");
  const [careerSearch, setCareerSearch] = useState("");
  const [careerCompany, setCareerCompany] = useState("All companies");
  const [careerType, setCareerType] = useState("All areas");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [valuesTab, setValuesTab] = useState<"core" | "mudra">("core");

  useEffect(() => {
    if (!photoHero) return;
    function updateHeader() {
      setHeaderScrolled(window.scrollY > 24);
    }
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [photoHero]);

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
      setBusinessDirectoryOpen(Boolean(group || searchQuery || savedSearch || category));
      if (savedSearch) window.sessionStorage.removeItem("sanjeevani-business-search");
    }
  }, [section]);

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
      <header className={`reference-header${section === "businesses" ? " businesses-site-header" : ""}${photoHero ? (headerScrolled ? " is-scrolled" : " is-overlay") : ""}`}>
        <div className="reference-wrap header-inner">
          <Brand />
          <nav className={`reference-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
            {navigation.map((item) => item.label === "Investors" ? null : item.label === "About us" ? (
              <AboutNavMenu key={item.href} isCurrent={["about-us", "our-story", "mission-vision-values", "leadership", "team"].includes(section)} />
            ) : item.label === "Business" ? (
              <BusinessNavMenu businesses={businesses} key={item.href} isCurrent={section === "businesses"} />
            ) : item.label === "Media" ? (
              <MediaNavMenu key={item.href} isCurrent={["media", "news", "events", "press-release", "newsletter"].includes(section)} onNavigate={() => setMenuOpen(false)} />
            ) : (
              <Link className={item.href === `/${section}` ? "is-current" : ""} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
            ))}
            <SocialLinks className="mobile-nav-social-links" />
          </nav>
          <SocialLinks className="header-social-links" />
          <button className="reference-menu" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
        </div>
      </header>

      <GmailContactButton />

      <main className={`section-page${section === "businesses" ? " businesses-page" : ""}${photoHero ? " mission-page" : ""}`}>
        <section className={`section-page-hero${["about-us", "our-story", "mission-vision-values", "leadership", "team", "businesses", "media", "news", "events", "press-release", "newsletter", "reviews", "gallery", "investors", "community", "contact"].includes(section) ? " section-page-hero-clean" : ""}${section === "contact" ? " contact-page-hero" : ""}${section === "careers" ? " career-page-hero" : ""}${section === "businesses" ? " businesses-page-hero" : ""}${photoHero ? " mission-page-hero" : ""}${section === "our-story" ? " story-page-hero" : ""}`}>
          <div className="hero-grid" aria-hidden="true" />
          <div className="section-page-orbit" aria-hidden="true" />
          {section === "businesses" && <div className="businesses-hero-art" aria-hidden="true"><span>Together<br />for a better<br />tomorrow</span></div>}
          {section === "careers" && <div className="career-hero-art" aria-hidden="true" />}
          <div className="reference-wrap section-page-hero-content">
            {section === "businesses" ? (
              <div className="businesses-hero-copy">
                <p className="section-overline">THE GROUP</p>
                <h1>Our <em>Businesses</em></h1>
                <p className="businesses-hero-description">Eighteen companies, each with a distinct role in our shared story.<br />Explore the directory by name.</p>
                <label className="businesses-hero-search">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  <span className="visually-hidden">Search companies by name or sector</span>
                  <input id="page-directory-search" type="search" placeholder="Search companies by name or sector..." value={directoryQuery} onChange={(event) => { setDirectoryQuery(event.target.value); setLetter("All"); }} />
                  <span className="businesses-hero-search-count" aria-live="polite">{visibleBusinesses.length}<small>results</small></span>
                </label>
                <div className="businesses-hero-stats">
                  <div><strong>{businesses.length}</strong><span>Companies<br />in the group</span></div>
                  <div><strong>{businessGroups.length}</strong><span>Diverse sectors<br />Healthcare · Education · More</span></div>
                </div>
              </div>
            ) : section === "contact" ? (
              <div className="contact-network-hero-content">
                <div className="contact-network-hero-copy">
                  <h1>Connecting <em>Nepal</em></h1>
                </div>
                <NepalNetworkMap connected drawOnScroll />
                <p className="contact-network-hero-description">Sanjeevani Group brings together businesses represented across cities in Nepal. Select a location marker to view the city in Google Maps.</p>
                <div className="head-office-card">
                  <h2>Head Office</h2>
                  <address>
                    Kathmandu, Nepal<br />
                    {/* TODO: replace with the real office number, e.g. <a href="tel:+97714XXXXXX">01-4XXXXXX</a> */}
                    Phone: to be added<br />
                    <a href="mailto:info@sanjeevanigroup.com">info@sanjeevanigroup.com</a>
                  </address>
                </div>
              </div>
            ) : section === "our-story" ? (
              <div className="mission-hero-copy">
                <h1 className="visually-hidden">Our Story</h1>
                <span className="mission-hero-tag">Our Story</span>
                <p className="mission-hero-text">Rooted in Nepal and led by Chairman C.A. Khuma Parsad Aryal, Sanjeevani Group has grown into a family of independent businesses across healthcare, education, agriculture, construction and hydropower, working together to transform lives across the nation.</p>
              </div>
            ) : section === "mission-vision-values" ? (
              <div className="mission-hero-copy">
                <h1 className="visually-hidden">Mission, Vision &amp; Values</h1>
                <span className="mission-hero-tag">About Sanjeevani Group</span>
                <p className="mission-hero-text">Guided by purpose and growing with care, Sanjeevani Group brings independent businesses together to create meaningful progress for the communities we serve across Nepal.</p>
              </div>
            ) : section === "careers" ? (
              <div className="career-hero-copy">
                <p className="section-overline">{page.eyebrow}</p>
                <h1 dangerouslySetInnerHTML={{ __html: page.title }} />
                <a className="career-hero-cta" href="#career-board-title">Explore career paths <span aria-hidden="true">↗</span></a>
                <p className="career-hero-message">{page.intro}</p>
              </div>
            ) : (
              <>
                <p className="section-overline">{page.eyebrow}</p>
                <h1 dangerouslySetInnerHTML={{ __html: page.title }} />
                <p>{page.intro}</p>
                <div className="section-page-breadcrumb"><Link href="/">Home</Link><span>/</span><span>{page.navLabel}</span></div>
              </>
            )}
          </div>
          <span className="section-page-number" aria-hidden="true">{page.number}</span>
        </section>

        {section === "mission-vision-values" && (
          <section className="mission-statement" aria-label="Our commitment">
            <div className="reference-wrap">
              <p>Sanjeevani Group continues to grow across healthcare, education, agriculture, construction and hydropower by focusing on care, innovation and sustainable progress for the people of Nepal.</p>
            </div>
          </section>
        )}

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
                      <p className="career-area-companies"><strong>{area.companyNames.join(" · ")} | Sanjeevani Group</strong></p>
                      <div className="career-area-meta"><span><strong>Career area:</strong> {area.type}</span><span><strong>Location:</strong> Nepal</span></div>
                      <p className="career-area-note"><em>For current openings and application details, please contact the relevant company to confirm availability.</em></p>
                      <a className="career-area-cta" href={`mailto:info@sanjeevanigroup.com?subject=${encodeURIComponent(`Career enquiry: ${area.title}`)}&body=${encodeURIComponent(`Hello Sanjeevani Group,\n\nI would like to enquire about current opportunities in ${area.title}.\n\nPlease let me know which group company I should contact.\n`)}`}>
                        Enquire about roles <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                    <div className="career-area-poster">
                      <Image
                        src="/career hiring.png"
                        alt="Nurse hiring poster for GMC Hospital, Nepal, repeated as a visual on career-area cards"
                        width={1024}
                        height={1536}
                        sizes="(max-width: 760px) 80vw, 420px"
                      />
                    </div>
                  </article>
                ))}
                {visibleCareerAreas.length === 0 && <p className="career-empty">No career areas match those filters. Try a different search or company.</p>}
              </div>
              <p className="career-listing-note">These are career areas, not advertised vacancies. Role availability, requirements, and locations vary by company.</p>
            </div>
          </section>
        ) : section === "contact" ? (
          <>
            <section className="contact-section">
              <div className="reference-wrap contact-panel contact-form-panel">
                <div className="contact-map">
                  <iframe
                    title="Google Maps search for Sanjeevani Group office locations in Nepal"
                    src="https://maps.google.com/maps?q=Sanjeevani%20Group%20Nepal&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <p>Google Maps search for Sanjeevani Group locations. Confirm the specific office address with the relevant company before visiting.</p>
                </div>
                <form className="contact-form" onSubmit={submitContactForm}>
                  <h2>Send us an enquiry</h2>
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
          </>
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
                  {businesses.map((business) => {
                    const logo = getBusinessLogo(business.name);
                    return (
                    <li key={business._id}>
                      <span className="about-timeline-marker" aria-hidden="true" />
                      <article className={`about-timeline-card about-timeline-${business.category}`}>
                        <div className="about-timeline-art" aria-hidden="true">
                          <span>{business.sector}</span>
                          {logo ? (
                            <span className="about-timeline-logo"><Image src={logo} alt="" fill sizes="104px" /></span>
                          ) : (
                            <strong>{business.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</strong>
                          )}
                        </div>
                        <div className="about-timeline-copy">
                          <span className="about-timeline-kicker">{business.category.replace("-", " ").toUpperCase()}</span>
                          <h3>{business.name}</h3>
                          <p>{business.description}</p>
                          {(business.location || business.sector) && <small>{[business.location, business.sector].filter(Boolean).join(" · ")}</small>}
                        </div>
                      </article>
                    </li>
                    );
                  })}
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
          <section className="reference-section directory-section business-directory-section section-page-content">
            <div className="reference-wrap">
              <div className="business-category-selector">
                <div className="business-category-column">
                  {businessGroups.slice(0, 3).map((group) => (
                    <button className={`business-category-tile business-category-tile-${group.value}`} type="button" key={group.value} onClick={() => { setBusinessGroup(group.value); setBusinessCategory("all"); setLetter("All"); setBusinessDirectoryOpen(true); }}>
                      <span className="business-category-art" aria-hidden="true" />
                      <strong>{group.label}</strong>
                      <span className="business-category-arrow" aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
                <div className="business-category-center">
                  <span className="business-category-emblem"><GroupEmblem /></span>
                  <span className="business-category-center-label">SANJEEVANI GROUP</span>
                  <h2>Many businesses.<br /><em>One shared purpose.</em></h2>
                  <p>Choose an area to explore the companies in our group.</p>
                  <button type="button" className="business-category-all" onClick={() => { setBusinessGroup("all"); setBusinessCategory("all"); setLetter("All"); setDirectoryQuery(""); setBusinessDirectoryOpen(true); }}>View all businesses <span aria-hidden="true">↓</span></button>
                </div>
                <div className="business-category-column">
                  {businessGroups.slice(3).map((group) => (
                    <button className={`business-category-tile business-category-tile-${group.value}`} type="button" key={group.value} onClick={() => { setBusinessGroup(group.value); setBusinessCategory("all"); setLetter("All"); setBusinessDirectoryOpen(true); }}>
                      <span className="business-category-art" aria-hidden="true" />
                      <strong>{group.label}</strong>
                      <span className="business-category-arrow" aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              </div>
              {businessDirectoryOpen && (
                <div className="business-directory-panel" id="business-directory-results">
                  <div className="business-directory-results-heading">
                    <div>
                      <span>BUSINESS DIRECTORY</span>
                      <h2>{businessGroup === "all" ? "All businesses" : businessGroups.find((item) => item.value === businessGroup)?.label}</h2>
                    </div>
                    <button type="button" onClick={() => setBusinessDirectoryOpen(false)}>Back to categories <span aria-hidden="true">↑</span></button>
                  </div>
                  <div className="business-directory-toolbar">
                    <div className="business-directory-filters" role="group" aria-label="Filter businesses by sector">
                      <button type="button" className={businessGroup === "all" && businessCategory === "all" ? "is-active" : ""} aria-pressed={businessGroup === "all" && businessCategory === "all"} onClick={() => { setBusinessGroup("all"); setBusinessCategory("all"); }}>All</button>
                      {businessGroups.map((group) => <button type="button" key={group.value} className={businessGroup === group.value ? "is-active" : ""} aria-pressed={businessGroup === group.value} onClick={() => { setBusinessGroup(group.value); setBusinessCategory("all"); setLetter("All"); }}>{group.label}</button>)}
                    </div>
                    <label className="business-directory-letter-filter">
                      <span>Sort by first letter</span>
                      <select value={letter} onChange={(event) => { setLetter(event.target.value); setDirectoryQuery(""); }}>
                        {alphabet.map((value) => <option key={value} value={value}>{value === "All" ? "All companies" : value}</option>)}
                      </select>
                    </label>
                    <span className="business-directory-result-count">{visibleBusinesses.length} results</span>
                  </div>
                  <div className="directory-grid" aria-live="polite">{visibleBusinesses.map((business, index) => <BusinessDirectoryCard business={business} index={index} key={business._id} />)}{visibleBusinesses.length === 0 && <p className="directory-empty">No businesses match. Try another name or letter.</p>}</div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {section !== "mission-vision-values" && <section className="reference-section section-page-content">
              <div className="reference-wrap section-page-copy">
                <div><p className="section-overline">{page.number} / {page.navLabel.toUpperCase()}</p><h2>{page.lead}</h2></div>
                <div className="section-page-paragraphs">{page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {page.faqs && <div className="section-faq-list">{page.faqs.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>}
                  {page.links && <nav className="section-sitemap-links" aria-label="Website pages">{page.links.map(({ label, href }) => <Link href={href} key={href}>{label}<span aria-hidden="true">↗</span></Link>)}</nav>}
                  {section === "careers" && <a className="reference-button" href="mailto:careers@sanjeevanigroup.com?subject=Career%20enquiry">Email our team <span>↗</span></a>}
                  {section === "investors" && <a className="reference-button" href="mailto:info@sanjeevanigroup.com?subject=Investor%20enquiry">Investor enquiries <span>↗</span></a>}
                </div>
              </div>
            </section>}
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
        {section === "mission-vision-values" && (
          <section className="mission-feature" aria-labelledby="mission-feature-title">
            <div className="reference-wrap mission-feature-content">
              <h2 id="mission-feature-title" className="mission-hero-tag">Vision</h2>
              <p className="mission-hero-text">We strive to become one of Nepal’s most trusted groups by bringing innovation to every business we run and creating shared value for our communities and stakeholders.</p>
            </div>
          </section>
        )}
        {section === "mission-vision-values" && (
          <section className="values-section" aria-labelledby="values-title">
            <div className="reference-wrap">
              <h2 id="values-title">The Values That Guide Us</h2>
              <div className="values-tabs" role="tablist" aria-label="Values">
                <button type="button" role="tab" id="values-tab-core" aria-selected={valuesTab === "core"} aria-controls="values-panel" className={valuesTab === "core" ? "is-active" : ""} onClick={() => setValuesTab("core")}>Our Core Values</button>
                <button type="button" role="tab" id="values-tab-mudra" aria-selected={valuesTab === "mudra"} aria-controls="values-panel" className={valuesTab === "mudra" ? "is-active" : ""} onClick={() => setValuesTab("mudra")}>Sanjeevani Leaf</button>
              </div>
              <div id="values-panel" role="tabpanel" aria-labelledby={valuesTab === "core" ? "values-tab-core" : "values-tab-mudra"} key={valuesTab} className="values-panel">
                {valuesTab === "core" ? (
                  <div className="values-grid">
                    {coreValues.map((value) => (
                      <article className="value-card" key={value.title}>
                        <span className="value-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24">{value.icon}</svg></span>
                        <h3>{value.title}</h3>
                        <p>{value.text}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mudra-panel">
                    <div className="mudra-copy">
                      <h3>The Herb of Life</h3>
                      <p><strong>Sanjeevani (संजीवनी)</strong> comes from the Sanskrit words <em>sam</em> (completely) and <em>jīv</em> (life), meaning <strong>“that which restores life.”</strong></p>
                      <p>In the Ramayana, the Sanjeevani herb was brought from the Himalayas to revive Lakshmana, a symbol of <strong>hope, healing and renewal</strong>, even in the hardest moments. Like the herb, we aspire to bring new life to every venture, community and person we touch. In our brandmark, the interlinked paths of the emblem represent our core values of <strong>Pioneering Spirit, Team Work, Accountability, Excellence and Morality</strong>.</p>
                    </div>
                    <div className="mudra-art" aria-hidden="true"><GroupEmblem /></div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {section === "mission-vision-values" && (
          <section className="mission-feature mission-feature-left" aria-labelledby="mission-statement-title">
            <div className="reference-wrap mission-feature-content">
              <h2 id="mission-statement-title" className="mission-hero-tag">Mission</h2>
              <p className="mission-hero-text">We are committed to bringing independent businesses together to create meaningful progress and opportunity, delivering quality care, education and essential services to the communities we serve across Nepal.</p>
            </div>
          </section>
        )}
      </main>

      {section === "businesses" ? (
        <>
          <section className="business-page-motto" aria-label="Our motto">
            <div className="business-page-motto-content">
              <span className="business-page-motto-emblem"><GroupEmblem /></span>
              <p>One horizon, <em>many ambitions.</em></p>
            </div>
          </section>
          <div className="business-page-footer"><GroupFooter /></div>
        </>
      ) : section === "contact" ? (
        <div className="contact-page-footer"><GroupFooter /></div>
      ) : section === "careers" ? (
        <div className="career-page-footer"><GroupFooter /></div>
      ) : <GroupFooter />}
    </>
  );
}
