"use client";

import { type CSSProperties, type FormEvent, type MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { businesses as localBusinesses, businessGroups, type Business, type BusinessGroup } from "@/data/businesses";
import { getBusinessLogo } from "@/data/businessLogos";
import { getCompanyProfile, getCompanySlug, sectorImages, toWebsiteUrl } from "@/data/companyProfiles";
import GroupEmblem from "@/components/GroupEmblem";
import GmailContactButton from "@/components/GmailContactButton";
import GroupFooter from "@/components/GroupFooter";
import CompanyProfile from "@/components/CompanyProfile";
import LeaderProfile from "@/components/LeaderProfile";
import NewsroomGallery from "@/components/NewsroomGallery";
import CareerVacancies from "@/components/CareerVacancies";
import { careerAreas, getAreaVacancies } from "@/data/careers";
import { chairmanSocials, leaderHref, leadershipBoard, leadershipTeam, type LeaderSocials } from "@/data/leaders";
import LegalDocument from "@/components/LegalDocument";
import BusinessNavMenu from "@/components/BusinessNavMenu";
import AboutNavMenu from "@/components/AboutNavMenu";
import CareersNavMenu from "@/components/CareersNavMenu";
import { companyNotices, getYouTubeId, latestEvents, latestPressReleases, youtubeVideos } from "@/data/newsroom";
import SocialLinks from "@/components/SocialLinks";
import NepalNetworkMap from "@/components/NepalNetworkMap";
import { faqs } from "@/data/faqs";

const navigation = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about-us" },
  { label: "Business", href: "/businesses" },
  { label: "Newsroom", href: "/newsroom" },
  { label: "Community", href: "/community" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];


// TODO: add each foundation's real logo (in /public), photo, description and website.
// "Know more" opens the website; until one is set it links to the Contact page.
const communityFoundations: { name: string; logo?: string; photo: string; tagline?: string; description: string; website: string }[] = [
  {
    name: "Khuma Aryal Foundation",
    logo: "/khuma.png",
    photo: "/aama.jpg",
    description: "Guiding young lives through education, health, sports and employment. We work to prevent the problems faced by young people by offering good counselling, real opportunity and steady community support across Nepal.",
    website: "",
  },
  {
    name: "Sanjeevani Developers",
    logo: "/companylogo/sanjevani debelopers.jpg",
    photo: "/construction.jpg",
    tagline: "Think Green. Think Life.",
    description: "With over 30 years of experience, Sanjeevani Group is a trusted name in real estate, committed to quality, innovation and sustainable development. With 45+ completed and ongoing projects and over 2,000 happy families, we create modern living spaces that harmonize with nature. Guided by integrity and customer satisfaction, we build not just properties, but thriving communities and lasting legacies.",
    website: "",
  },
];

// TODO: replace these placeholder photos with real community programme photos.
const communityGallery: ({ type: "photo"; src: string; alt: string } | { type: "text"; text: string })[] = [
  { type: "photo", src: "/hospital.jpg", alt: "Sanjeevani hospital serving the community" },
  { type: "photo", src: "/aama.jpg", alt: "Community members with Sanjeevani Group" },
  { type: "photo", src: "/education.jpg", alt: "Students learning at a Sanjeevani school" },
  { type: "photo", src: "/medical%20college.jpg", alt: "Sanjeevani medical college campus" },
  { type: "text", text: "Sanjeevani Group's businesses are part of the communities around them. Through healthcare, education and agriculture, our companies work to bring quality services closer to people across Nepal." },
  { type: "photo", src: "/agro.png", alt: "Sanjeevani agriculture project" },
  { type: "photo", src: "/construction.jpg", alt: "Sanjeevani construction project" },
  { type: "photo", src: "/hydro.png", alt: "Sanjeevani hydropower project" },
  { type: "photo", src: "/impact/impact.jpg", alt: "Sanjeevani Group in the community" },
];

// TODO: replace every "[Add …]" placeholder with the Chairman's verified biography.
const chairmanStory = {
  intro: "C.A. Khuma Parsad Aryal is the Chairman of Sanjeevani Group, leading a family of independent businesses across healthcare, medical education, education, agriculture, construction and hydropower.",
  panel: "Under his leadership, Sanjeevani Group has brought together hospitals, medical colleges, schools, agro and food companies, construction, development and hydropower ventures, each with its own focus and a shared commitment to meaningful progress for Nepal.",
  journeyHighlight: "[Add a key highlight from the Chairman's journey, for example how he founded the group and the vision behind it.]",
  journey: "[Add the story of how the Chairman began his career and the first businesses he established.]",
  visionHighlight: "[Add a highlight about the Chairman's vision for healthcare, education and development in Nepal.]",
  vision: [
    "[Add details of major milestones achieved under the Chairman's leadership.]",
    "[Add details of the Chairman's community, social and philanthropic contributions.]",
  ],
  honoursHighlight: "[Add awards, honours or recognition the Chairman has received.]",
  honours: "[Add further details about these honours and other achievements.]",
  roles: [
    { title: "Chairman", detail: "Sanjeevani Group of Companies" },
    { title: "[Add role]", detail: "[Add other positions, memberships or board roles held by the Chairman.]" },
  ],
};

// TODO: replace placeholder names, designations and photos with the real leadership team.

const leaderSocialIcons: { key: keyof LeaderSocials; label: string; icon: JSX.Element }[] = [
  { key: "linkedin", label: "LinkedIn", icon: <path d="M5.2 7.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.4 9h3.6v11H3.4V9Zm5.8 0h3.4v1.5h.1a3.7 3.7 0 0 1 3.3-1.8c3.5 0 4.1 2.3 4.1 5.2V20h-3.6v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H9.2V9Z" /> },
  { key: "facebook", label: "Facebook", icon: <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" /> },
  { key: "instagram", label: "Instagram", icon: <path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21 8.2c-.1-1.5-.4-2.8-1.5-3.8-1-1-2.4-1.4-3.8-1.5-1.5-.1-6-.1-7.5 0-1.5.1-2.8.4-3.8 1.5-1 1-1.4 2.3-1.5 3.8-.1 1.5-.1 6 0 7.5.1 1.5.4 2.8 1.5 3.8 1 1 2.3 1.4 3.8 1.5 1.5.1 6 .1 7.5 0 1.5-.1 2.8-.4 3.8-1.5 1-1 1.4-2.3 1.5-3.8.1-1.5.1-6 0-7.5Zm-2 9.1a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4A3 3 0 0 1 5 17.3c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3A3 3 0 0 1 6.7 5c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4A3 3 0 0 1 19 6.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3Z" /> },
  { key: "x", label: "X", icon: <path d="M18.9 3h2.9l-6.4 7.3L23 21h-6l-4.7-6.2L6.9 21H4l6.8-7.8L3.3 3h6.2l4.2 5.7L18.9 3Zm-1 16h1.6L8.4 4.9H6.7L17.9 19Z" /> },
];

function tiltCard(event: ReactMouseEvent<HTMLElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  card.style.setProperty("--ry", `${x * 16}deg`);
  card.style.setProperty("--rx", `${y * -16}deg`);
  card.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
  card.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
}

function resetTilt(event: ReactMouseEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--ry", "0deg");
  event.currentTarget.style.setProperty("--rx", "0deg");
}

function YouTubeVideo({ id, title, thumbnail }: { id: string; title: string; thumbnail?: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }
  return (
    <button className="newsroom-video-cover" type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
      {thumbnail ? (
        <Image src={thumbnail} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 33vw" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
      )}
      <span className="newsroom-video-title">{title}</span>
      <span className="newsroom-video-play" aria-hidden="true">
        <svg viewBox="0 0 68 48"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.3.3 34 .3 34 .3s-21.3 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 12.9.1 24 .1 24s0 11.1 1.4 16.3a8.5 8.5 0 0 0 6 6C12.7 47.7 34 47.7 34 47.7s21.3 0 26.5-1.4a8.5 8.5 0 0 0 6-6c1.4-5.2 1.4-16.3 1.4-16.3s0-11.1-1.4-16.3Z" fill="#f00" /><path d="M45 24 27 14v20" fill="#fff" /></svg>
      </span>
    </button>
  );
}

function LeaderSocialLinks({ name, socials, className = "" }: { name: string; socials: LeaderSocials; className?: string }) {
  return (
    <div className={`leader-socials ${className}`.trim()}>
      {leaderSocialIcons.map(({ key, label, icon }) => (
        <a href={socials[key]} key={key} target="_blank" rel="noopener noreferrer" aria-label={`${name} on ${label}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{icon}</svg>
        </a>
      ))}
    </div>
  );
}


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
  chairman: {
    number: "14A",
    navLabel: "Chairman",
    eyebrow: "SANJEEVANI GROUP / LEADERSHIP / CHAIRMAN",
    title: "C.A. Khuma<br />Parsad Aryal",
    intro: "Chairman of Sanjeevani Group of Companies.",
    lead: "Chairman",
    paragraphs: [],
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
  newsroom: {
    number: "03",
    navLabel: "Newsroom",
    eyebrow: "SANJEEVANI GROUP / NEWSROOM",
    title: "News and updates<br />from across the group.",
    intro: "Press releases, events and notices from Sanjeevani Group and its businesses, all in one place.",
    lead: "Newsroom",
    paragraphs: [],
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
    faqs,
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
      "Nothing on this website is an offer, investment recommendation, or substitute for professional advice.",
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
      { label: "Newsroom", href: "/newsroom" },
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

export default function SectionPage({ section, companySlug, leaderSlug, careerAreaSlug }: { section: string; companySlug?: string; leaderSlug?: string; careerAreaSlug?: string }) {
  const page = pageContent[section === "our-story" ? "about-us" : section];
  const storyLayout = section === "our-story" || section === "about-us";
  const leadershipLayout = section === "leadership" || section === "chairman";
  const photoHero = (section === "mission-vision-values" || section === "community" || section === "newsroom" || leadershipLayout || storyLayout) && !leaderSlug;
  // Pages whose hero photo runs under a transparent header that turns solid on scroll.
  const overlayHeader = photoHero || section === "businesses" || section === "careers";
  const [menuOpen, setMenuOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>(localBusinesses);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [letter, setLetter] = useState("All");
  const [businessCategory, setBusinessCategory] = useState<Business["category"] | "all">("all");
  const [businessGroup, setBusinessGroup] = useState<BusinessGroup | "all">("all");
  const [, setBusinessDirectoryOpen] = useState(false);
  const [contactNotice, setContactNotice] = useState("");
  const [careerSearch, setCareerSearch] = useState("");
  const [careerCompany, setCareerCompany] = useState("All companies");
  const [careerType, setCareerType] = useState("All areas");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [valuesTab, setValuesTab] = useState<"core" | "mudra">("core");

  useEffect(() => {
    if (!leadershipLayout && !storyLayout) return;
    const items = Array.from(document.querySelectorAll<HTMLElement>(".leadership-reveal, .about-reveal"));
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
    // businesses: the About/Our Story timeline re-renders when /api/businesses
    // replaces the bundled list, and those new <li>s need observing too.
  }, [leadershipLayout, storyLayout, businesses]);

  useEffect(() => {
    if (!overlayHeader) return;
    function updateHeader() {
      setHeaderScrolled(window.scrollY > 24);
    }
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [overlayHeader]);

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
      // Arriving from a sector link (e.g. the Business menu): skip the hero and
      // open straight on the company directory. "instant" overrides the
      // site-wide smooth scrolling so the hero never flashes past.
      if (group || searchQuery || savedSearch || category) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const directory = document.getElementById("explore");
          if (directory) window.scrollTo({ top: directory.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
        }));
      }
    }
    if (section === "careers") {
      const company = new URLSearchParams(window.location.search).get("company");
      if (company) {
        setCareerCompany(company);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const board = document.getElementById("career-board");
          if (board) window.scrollTo({ top: board.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
        }));
      }
    }
  }, [section]);


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

  // Businesses directory: the selected sector (undefined = all companies) and
  // the visible companies grouped by sector, in businessGroups order.
  const activeBusinessGroup = businessGroups.find((item) => item.value === businessGroup);
  const directoryGroups = useMemo(() => {
    const grouped = businessGroups
      .map((group) => ({ key: group.value, label: group.label, items: visibleBusinesses.filter(group.matches) }))
      .filter((entry) => entry.items.length > 0);
    const others = visibleBusinesses.filter((business) => !businessGroups.some((group) => group.matches(business)));
    return others.length ? [...grouped, { key: "other", label: "Other companies", items: others }] : grouped;
  }, [visibleBusinesses]);

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
      <header className={`reference-header${overlayHeader ? (headerScrolled ? " is-scrolled" : " is-overlay") : ""}`}>
        <div className="reference-wrap header-inner">
          <Brand />
          <nav className={`reference-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
            {navigation.map((item) => item.label === "About us" ? (
              <AboutNavMenu key={item.href} isCurrent={["about-us", "our-story", "mission-vision-values", "leadership", "chairman", "team"].includes(section)} />
            ) : item.label === "Business" ? (
              <BusinessNavMenu businesses={businesses} key={item.href} isCurrent={section === "businesses"} />
            ) : item.label === "Careers" ? (
              <CareersNavMenu businesses={businesses} key={item.href} isCurrent={section === "careers"} />
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

      <main className={`section-page${section === "businesses" ? " businesses-page" : ""}${photoHero ? " mission-page" : ""}${companySlug ? " company-page bx-scope cx" : ""}${leaderSlug ? " leader-page bx-scope ld" : ""}${careerAreaSlug ? " vacancy-page bx-scope vc" : ""}${!companySlug && (section === "privacy-policy" || section === "terms-of-use") ? " legal-page bx-scope lg" : ""}`}>
        {companySlug ? (
          <CompanyProfile slug={companySlug} businesses={businesses} />
        ) : careerAreaSlug ? (
          <CareerVacancies slug={careerAreaSlug} />
        ) : leaderSlug ? (
          <LeaderProfile slug={leaderSlug} socials={(name, links) => <LeaderSocialLinks name={name} socials={links} />} />
        ) : section === "privacy-policy" || section === "terms-of-use" ? (
          <LegalDocument kind={section} title={page.title} intro={page.intro} lead={page.lead} paragraphs={page.paragraphs} />
        ) : (
        <>
        <section className={`section-page-hero${["about-us", "our-story", "mission-vision-values", "leadership", "team", "businesses", "newsroom", "reviews", "gallery", "community", "contact"].includes(section) ? " section-page-hero-clean" : ""}${section === "contact" ? " contact-page-hero" : ""}${section === "careers" ? " career-page-hero" : ""}${section === "businesses" ? " businesses-page-hero" : ""}${photoHero ? " mission-page-hero" : ""}${storyLayout ? " story-page-hero" : ""}${storyLayout ? " about-page-hero" : ""}${section === "about-us" ? " about-us-hero" : ""}${leadershipLayout ? " leadership-page-hero" : ""}${section === "leadership" ? " leadership-team-hero" : ""}${section === "mission-vision-values" ? " mvv-page-hero" : ""}${section === "community" ? " community-page-hero" : ""}${section === "newsroom" ? " newsroom-page-hero" : ""}`}>
          <div className="hero-grid" aria-hidden="true" />
          <div className="section-page-orbit" aria-hidden="true" />
          {section === "businesses" && <div className="businesses-hero-art" aria-hidden="true"><span>Together<br />for a better<br />tomorrow</span></div>}
          {section === "careers" && <div className="career-hero-art" aria-hidden="true" />}
          <div className="reference-wrap section-page-hero-content">
            {section === "businesses" ? (
              <div className="mission-hero-copy businesses-hero-copy">
                <h1 className="visually-hidden">Our Businesses</h1>
                <span className="mission-hero-tag">Our Businesses</span>
                <p className="mission-hero-text">Sanjeevani Group brings together {businesses.length} independent companies across healthcare, medical education, education, agriculture, construction and hydropower, each with its own focus and a shared commitment to meaningful progress for Nepal.</p>
              </div>
            ) : section === "contact" ? (
              <div className="contact-network-hero-content">
                <span className="contact-sky-orb" aria-hidden="true" />
                <div className="contact-network-hero-copy">
                  <h1>Connecting <em>Nepal</em></h1>
                </div>
                <NepalNetworkMap connected drawOnScroll />
                <div className="contact-skyline" aria-hidden="true" />
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
            ) : storyLayout ? (
              <div className="mission-hero-copy">
                <h1 className="visually-hidden">{page.navLabel}</h1>
                <span className="mission-hero-tag">{page.navLabel}</span>
                <p className="mission-hero-text">Rooted in Nepal and led by Chairman C.A. Khuma Parsad Aryal, Sanjeevani Group has grown into a family of independent businesses across healthcare, education, agriculture, construction and hydropower, working together to transform lives across the nation.</p>
              </div>
            ) : section === "newsroom" ? (
              <div className="mission-hero-copy">
                <h1 className="visually-hidden">Newsroom</h1>
                <span className="mission-hero-tag">Newsroom</span>
                <p className="mission-hero-text">{page.intro}</p>
              </div>
            ) : section === "community" ? (
              <div className="mission-hero-copy">
                <h1 className="visually-hidden">Our community</h1>
                <span className="mission-hero-tag">Our Community</span>
                <p className="mission-hero-text">{page.intro}</p>
              </div>
            ) : section === "chairman" ? (
              <div className="mission-hero-copy">
                <h1 className="visually-hidden">C.A. Khuma Parsad Aryal, Chairman</h1>
                <span className="mission-hero-tag">Chairman</span>
                <p className="mission-hero-text">C.A. Khuma Parsad Aryal leads Sanjeevani Group, a family of independent businesses working to transform lives across Nepal.</p>
              </div>
            ) : section === "leadership" ? (
              <div className="mission-hero-copy">
                <h1 className="visually-hidden">Leadership</h1>
                <span className="mission-hero-tag">Our Leadership</span>
                <p className="mission-hero-text">Guided by experience and a long-term view, our leadership brings independent businesses together around one shared purpose: meaningful progress for Nepal.</p>
              </div>
            ) : section === "mission-vision-values" ? (
              <div className="mission-hero-copy">
                <h1 className="visually-hidden">Mission, Vision &amp; Values</h1>
                <span className="mission-hero-tag">About Sanjeevani Group</span>
                <p className="mission-hero-text">Guided by purpose and growing with care, Sanjeevani Group brings independent businesses together to create meaningful progress for the communities we serve across Nepal.</p>
              </div>
            ) : section === "careers" ? (
              <div className="mission-hero-copy career-hero-copy">
                <h1 className="visually-hidden">Careers</h1>
                <span className="mission-hero-tag">Careers</span>
                <p className="mission-hero-text">Build your career with Sanjeevani Group. Across healthcare, education, agriculture, construction and hydropower, our businesses bring together people who want to make a real difference for communities across Nepal.</p>
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
          <>
          <section className="bx-scope cr-board" id="career-board" aria-labelledby="career-board-title">
            <div className="bx-wrap">
              <div className="cr-intro">
                <div className="cr-intro-copy">
                  <h2 id="career-board-title">Explore career paths</h2>
                  <p className="bx-lead">Discover the fields represented across our businesses. Hiring is managed by each company, so please contact them to confirm current openings.</p>
                </div>
              </div>
              <div className="cr-toolbar">
                <label className="cr-search">
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
                <p className="cr-count" aria-live="polite"><span className="num">{visibleCareerAreas.length}</span> career {visibleCareerAreas.length === 1 ? "area" : "areas"}</p>
              </div>
              <ul className="cr-areas">
                {visibleCareerAreas.map((area) => {
                  const openRoles = getAreaVacancies(area.slug).length;
                  return (
                    <li className="cr-card" key={area.title}>
                      <div className="cr-card-photo">
                        <Image src={area.image} alt="" fill sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 380px" />
                        <span className="cr-card-type">{area.type}</span>
                      </div>
                      <div className="cr-card-body">
                        <h3>{area.title}</h3>
                        <dl className="cr-card-stats">
                          <div><dt>Roles</dt><dd className="num">{openRoles}</dd></div>
                          <div><dt>Companies</dt><dd className="num">{area.companyNames.length}</dd></div>
                          <div><dt>Location</dt><dd>Nepal</dd></div>
                        </dl>
                        <ul className="cr-card-companies" aria-label={`Companies in ${area.title}`}>
                          {area.companyNames.map((name) => (
                            <li key={name}><Link href={`/businesses/${getCompanySlug(name)}`}>{name}</Link></li>
                          ))}
                        </ul>
                        <Link className="bx-button cr-card-cta" href={`/careers/${area.slug}`} aria-label={`View vacancies in ${area.title}`}>
                          View vacancies
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {visibleCareerAreas.length === 0 && <p className="cr-empty">No career areas match those filters. Try a different search or company.</p>}
              <p className="cr-note">These are career areas, not advertised vacancies. Role availability, requirements, and locations vary by company.</p>
            </div>
          </section>
          </>
        ) : section === "newsroom" ? (
          <section className="newsroom">
            <div className="reference-wrap">
              <nav className="newsroom-jump" aria-label="Newsroom sections">
                <a href="#press-releases">Press releases</a>
                <a href="#events">Events</a>
                <a href="#notices">Notices</a>
                <a href="#youtube">YouTube</a>
                <a href="#gallery">Gallery</a>
              </nav>

              {[
                { id: "press-releases", label: "Press releases", stories: latestPressReleases },
                { id: "events", label: "Events", stories: latestEvents },
              ].map((group) => (
                <section className="newsroom-group" id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
                  <div className="newsroom-group-heading">
                    <h2 id={`${group.id}-title`}>{group.label}</h2>
                    <span>{group.stories.length} {group.stories.length === 1 ? "update" : "updates"}</span>
                  </div>
                  <div className="newsroom-grid">
                    {group.stories.map((story) => (
                      <article className="newsroom-card" key={story.title}>
                        <div className="newsroom-card-photo">
                          <Image src={story.image} alt={story.alt} fill sizes="(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 33vw" />
                        </div>
                        <div className="newsroom-card-body">
                          <time>{story.date}</time>
                          <h3>{story.title}</h3>
                          <p>{story.summary}</p>
                          {story.link && (
                            <a className="newsroom-card-link" href={story.link} target="_blank" rel="noopener noreferrer">
                              Read full story <span aria-hidden="true">↗</span>
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}

              <section className="newsroom-group" id="notices" aria-labelledby="notices-title">
                <div className="newsroom-group-heading">
                  <h2 id="notices-title">Notices</h2>
                  <span>{companyNotices.length} {companyNotices.length === 1 ? "notice" : "notices"}</span>
                </div>
                <ul className="newsroom-notices">
                  {companyNotices.map((notice, index) => {
                    const logo = getBusinessLogo(notice.company);
                    return (
                      <li className="newsroom-notice" key={`${notice.company}-${notice.title}`}>
                        <div className="newsroom-notice-top">
                          <span className="newsroom-notice-badge">Notice {String(index + 1).padStart(2, "0")}</span>
                          <time>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                            {notice.date}
                          </time>
                        </div>
                        <h3>{notice.title}</h3>
                        <div className="newsroom-notice-company">
                          <span className="newsroom-notice-logo">
                            {logo ? <Image src={logo} alt="" fill sizes="44px" /> : notice.company.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase()}
                          </span>
                          <span>{notice.company}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="newsroom-group" id="youtube" aria-labelledby="youtube-title">
                <div className="newsroom-group-heading">
                  <h2 id="youtube-title">YouTube</h2>
                  <span>{youtubeVideos.length} {youtubeVideos.length === 1 ? "video" : "videos"}</span>
                </div>
                {youtubeVideos.length > 0 ? (
                  <div className="newsroom-videos">
                    {youtubeVideos.map((video, index) => {
                      const id = getYouTubeId(video.url);
                      if (!id) return null;
                      return (
                        <div className="newsroom-video" key={`${id}-${index}`}>
                          <YouTubeVideo id={id} title={video.title} thumbnail={video.thumbnail} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="newsroom-empty">Videos from across the group will appear here soon.</p>
                )}
              </section>

              <NewsroomGallery renderYouTube={(id, title, thumbnail) => <YouTubeVideo id={id} title={title} thumbnail={thumbnail} />} />

              <p className="newsroom-contact">For media enquiries, email <a href="mailto:info@sanjeevanigroup.com">info@sanjeevanigroup.com</a>.</p>
            </div>
          </section>
        ) : section === "community" ? (
          <>
          <section className="community-foundations">
            <div className="reference-wrap">
              {communityFoundations.map((foundation, index) => (
                <article className={`community-foundation${index % 2 === 1 ? " is-reversed" : ""}`} key={`${foundation.name}-${index}`}>
                  <div className="community-foundation-copy">
                    <div className="community-foundation-logo">
                      {foundation.logo ? (
                        <Image src={foundation.logo} alt={`${foundation.name} logo`} fill sizes="200px" />
                      ) : (
                        <GroupEmblem />
                      )}
                    </div>
                    <p className="community-foundation-kicker">Sanjeevani Group with</p>
                    <h2>{foundation.name}</h2>
                    {foundation.tagline && <p className="community-foundation-tagline">{foundation.tagline}</p>}
                    <p>{foundation.description}</p>
                    {foundation.website ? (
                      <a className="community-foundation-link" href={foundation.website} target="_blank" rel="noopener noreferrer">
                        <span aria-hidden="true">›</span>Know more
                      </a>
                    ) : (
                      <Link className="community-foundation-link" href="/contact">
                        <span aria-hidden="true">›</span>Know more
                      </Link>
                    )}
                  </div>
                  <div className="community-foundation-photo">
                    <Image src={foundation.photo} alt={`${foundation.name} community work`} fill sizes="(max-width: 900px) 100vw, 45vw" />
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="community-gallery">
            <div className="reference-wrap community-gallery-grid">
              {communityGallery.map((item, index) => item.type === "text" ? (
                <div className="community-gallery-note" key={`note-${index}`}>
                  <p>{item.text}</p>
                </div>
              ) : (
                <figure className="community-gallery-photo" key={item.src}>
                  <Image src={item.src} alt={item.alt} fill sizes="(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 33vw" />
                </figure>
              ))}
            </div>
          </section>
          </>
        ) : section === "chairman" ? (
          <>
            <section className="chairman-story">
              <div className="reference-wrap">
                <p className="chairman-story-highlight leadership-reveal">{chairmanStory.intro}</p>

                <div className="leadership-chairman-panel chairman-story-panel leadership-reveal">
                  <div className="leadership-chairman-photo">
                    <Image src="/chairman.png" alt="Portrait of C.A. Khuma Parsad Aryal, Chairman of Sanjeevani Group" fill sizes="(max-width: 780px) 90vw, 40vw" priority />
                  </div>
                  <div className="leadership-chairman-copy">
                    <h2>C.A. Khuma Parsad Aryal</h2>
                    <p>{chairmanStory.panel}</p>
                    <LeaderSocialLinks className="leader-socials-light" name="C.A. Khuma Parsad Aryal" socials={chairmanSocials} />
                  </div>
                  <span className="leadership-chairman-mark" aria-hidden="true"><GroupEmblem /></span>
                </div>

                <div className="chairman-story-block leadership-reveal">
                  <p className="chairman-story-highlight">{chairmanStory.journeyHighlight}</p>
                  <p>{chairmanStory.journey}</p>
                </div>

                <div className="chairman-story-split">
                  <div className="chairman-story-split-photo leadership-reveal">
                    <Image src="/khumaa.jpeg" alt="C.A. Khuma Parsad Aryal" fill sizes="(max-width: 900px) 100vw, 48vw" />
                  </div>
                  <div className="chairman-story-split-copy leadership-reveal">
                    <p className="chairman-story-highlight">{chairmanStory.visionHighlight}</p>
                    {chairmanStory.vision.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                </div>

                <div className="chairman-story-block leadership-reveal">
                  <p className="chairman-story-highlight">{chairmanStory.honoursHighlight}</p>
                  <p>{chairmanStory.honours}</p>
                </div>

                <div className="chairman-roles leadership-reveal">
                  <h2>Key Roles</h2>
                  <div className="chairman-roles-grid">
                    <div>
                      {chairmanStory.roles.map((role) => (
                        <div className="chairman-role" key={role.title + role.detail}>
                          <h3>{role.title}</h3>
                          <p>{role.detail}</p>
                        </div>
                      ))}
                    </div>
                    <div className="chairman-role">
                      <h3>Group businesses</h3>
                      <ul>{businesses.map((business) => <li key={business._id}>{business.name}</li>)}</ul>
                    </div>
                  </div>
                </div>

                <div className="chairman-companies">
                  {businesses.map((business, index) => {
                    const logo = getBusinessLogo(business.name);
                    return (
                      <article className="chairman-company leadership-reveal" key={business._id} style={{ "--i": index % 4 } as CSSProperties}>
                        <div className="chairman-company-logo">
                          {logo ? <Image src={logo} alt={`${business.name} logo`} fill sizes="150px" /> : <strong>{business.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</strong>}
                        </div>
                        <div>
                          <h3>{business.name}</h3>
                          <p>{business.description}</p>
                          {(business.sector || business.location) && <small>{[business.sector, business.location].filter(Boolean).join(" · ")}</small>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="chairman-back">
              <div className="reference-wrap">
                <Link href="/leadership"><span aria-hidden="true">←</span> Back to Leadership</Link>
              </div>
            </section>
          </>
        ) : section === "leadership" ? (
          <>
            <section className="leadership-chairman">
              <div className="reference-wrap">
                <p className="leadership-chairman-statement leadership-reveal">Rooted in Nepal and guided by a long-term view, C.A. Khuma Parsad Aryal has led Sanjeevani Group as it has grown into a family of {businesses.length} independent businesses working to transform lives across the nation.</p>
                <div className="leadership-chairman-panel leadership-reveal">
                  <div className="leadership-chairman-photo">
                    <Image src="/chairman.png" alt="Portrait of C.A. Khuma Parsad Aryal, Chairman of Sanjeevani Group" fill sizes="(max-width: 780px) 90vw, 40vw" />
                  </div>
                  <div className="leadership-chairman-copy">
                    <h2>C.A. Khuma Parsad Aryal</h2>
                    <p className="leadership-chairman-role">Chairman</p>
                    <p>Under his leadership, Sanjeevani Group has brought together businesses across healthcare, medical education, education, agriculture, construction and hydropower, each with its own focus and a shared commitment to meaningful progress.</p>
                    <LeaderSocialLinks className="leader-socials-light" name="C.A. Khuma Parsad Aryal" socials={chairmanSocials} />
                    <Link className="leadership-chairman-link" href="/chairman">View details</Link>
                  </div>
                  <span className="leadership-chairman-mark" aria-hidden="true"><GroupEmblem /></span>                </div>
              </div>
            </section>

            <section className="leadership-section reference-section">
              <div className="reference-wrap">
                <div className="leadership-heading leadership-reveal">
                  <p className="section-overline">OUR LEADERSHIP</p>
                  <h2>The people guiding <em>our shared purpose.</em></h2>
                </div>
                {[leadershipBoard, leadershipTeam].map((group, groupIndex) => (
                  <div className={`leadership-grid${groupIndex === 0 ? " leadership-grid-board" : ""}`} key={groupIndex}>
                    {group.map((leader, index) => (
                      <article className="leadership-card leadership-reveal" key={`${leader.name}-${index}`} style={{ "--i": index } as CSSProperties} onMouseMove={tiltCard} onMouseLeave={resetTilt}>
                        <div className="leadership-photo">
                          <Image src={leader.photo} alt={`Portrait of ${leader.name}`} fill sizes="(max-width: 780px) 100vw, 33vw" />
                        </div>
                        <div className="leadership-info">
                          <h3><Link className="leadership-card-link" href={leaderHref(leader)}>{leader.name}</Link></h3>
                          <p>{leader.role}</p>
                          <LeaderSocialLinks name={leader.name} socials={leader.socials} />
                        </div>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </section>

          </>
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
                <div className="about-history-heading about-reveal">
                  <div>
                    <p className="section-overline">BRIEF HISTORY</p>
                    <h2>A story of steady<br /><em>progress and purpose.</em></h2>
                  </div>
                  <p className="section-lead">Explore the {businesses.length} businesses that make up Sanjeevani Group, each with its own focus and place in our shared story.</p>
                </div>
                <ol className="about-timeline">
                  {businesses.map((business) => {
                    const logo = getBusinessLogo(business.name);
                    const profile = getCompanyProfile(business.name);
                    const websiteUrl = toWebsiteUrl(business.website);
                    return (
                    <li className="about-reveal" key={business._id}>
                      <span className="about-timeline-marker" aria-hidden="true" />
                      <article className={`about-timeline-card about-timeline-${business.category}`}>
                        <div className="about-timeline-photo">
                          {profile?.photo ? (
                            <Image src={profile.photo} alt={`${business.name}`} fill sizes="(max-width: 780px) 90vw, 520px" />
                          ) : (
                            <span className="about-timeline-photo-placeholder" aria-hidden="true"><GroupEmblem /></span>
                          )}
                          {profile?.established && <span className="about-timeline-est">Est. {profile.established}</span>}
                        </div>
                        <div className="about-timeline-body">
                          <span className="about-timeline-logo" aria-hidden="true">
                            {logo ? (
                              <Image src={logo} alt="" fill sizes="84px" />
                            ) : (
                              <strong>{business.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</strong>
                            )}
                          </span>
                          <div className="about-timeline-copy">
                            <span className="about-timeline-kicker">{business.sector}</span>
                            <h3>{business.name}</h3>
                            <p>{business.description}</p>
                          </div>
                          <div className="about-timeline-footer">
                            <span className="about-timeline-location">
                              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
                              {business.location || "Nepal"}
                            </span>
                            {websiteUrl ? (
                              <a className="about-timeline-website" href={websiteUrl} target="_blank" rel="noreferrer">
                                Visit website <span aria-hidden="true">↗</span>
                              </a>
                            ) : (
                              <span className="about-timeline-website is-pending">Website coming soon</span>
                            )}
                          </div>
                        </div>
                      </article>
                    </li>
                    );
                  })}
                </ol>
                <p className="about-history-note about-reveal">The companies are shown in group directory order. Verified founding dates and historical milestones can be added when available.</p>
              </div>
            </section>
          </>
        ) : section === "businesses" ? (
          <section className="bx-scope bx-directory" id="explore" aria-labelledby="bx-directory-title">
            <div className="bx-wrap">
              <header className="bx-head">
                <h2 id="bx-directory-title">Explore our companies</h2>
                <p className="bx-lead">Choose a sector to see its companies, then open any company for its full profile.</p>
              </header>
              <div className="bx-index">
                <nav className="bx-sectors" aria-label="Filter businesses by sector">
                  <button type="button" className="bx-sector" aria-pressed={businessGroup === "all" && businessCategory === "all"} onClick={() => { setBusinessGroup("all"); setBusinessCategory("all"); setLetter("All"); setDirectoryQuery(""); setBusinessDirectoryOpen(true); }}>
                    <span className="bx-sector-thumb bx-sector-thumb-all" aria-hidden="true"><GroupEmblem /></span>
                    <span className="bx-sector-copy"><strong>All companies</strong><small>Every company in the group</small></span>
                    <span className="bx-sector-count num">{businesses.length}</span>
                  </button>
                  {businessGroups.map((group) => (
                    <button type="button" className="bx-sector" key={group.value} aria-pressed={businessGroup === group.value} onClick={() => { setBusinessGroup(group.value); setBusinessCategory("all"); setLetter("All"); setDirectoryQuery(""); setBusinessDirectoryOpen(true); }}>
                      <span className="bx-sector-thumb" aria-hidden="true"><Image src={sectorImages[group.value]} alt="" fill sizes="64px" /></span>
                      <span className="bx-sector-copy"><strong>{group.label}</strong><small>{group.detail}</small></span>
                      <span className="bx-sector-count num">{businesses.filter(group.matches).length}</span>
                    </button>
                  ))}
                </nav>
                <div className="bx-panel" id="business-directory-results">
                  <div className="bx-panel-head">
                    <div className="bx-panel-title">
                      <h3>{directoryQuery.trim() ? "Search results" : activeBusinessGroup ? activeBusinessGroup.label : "All companies"}</h3>
                      <p>{directoryQuery.trim() ? "Across every Sanjeevani Group company" : activeBusinessGroup ? activeBusinessGroup.detail : "Every company in Sanjeevani Group, by sector"}</p>
                    </div>
                    <div className="bx-toolbar">
                      <label className="bx-search">
                        <span className="visually-hidden">Search companies</span>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                        <input id="page-directory-search" type="search" placeholder="Search companies" autoComplete="off" value={directoryQuery} onChange={(event) => { setDirectoryQuery(event.target.value); setBusinessGroup("all"); setBusinessCategory("all"); setLetter("All"); }} />
                      </label>
                      <span className="bx-count" aria-live="polite"><span className="num">{visibleBusinesses.length}</span> {visibleBusinesses.length === 1 ? "company" : "companies"}</span>
                    </div>
                  </div>
                  <div className="bx-groups" key={`${businessGroup}-${letter}`}>
                    {directoryGroups.map((entry) => (
                      <div className="bx-group" key={entry.key}>
                        {!activeBusinessGroup && <h4>{entry.label}</h4>}
                        <ul className="bx-companies">
                          {entry.items.map((business) => {
                            const profile = getCompanyProfile(business.name);
                            const photo = profile?.photo || sectorImages[entry.key] || "/business/business.png";
                            return (
                              <li key={business._id}>
                                <Link className="bx-company" href={`/businesses/${getCompanySlug(business.name)}`}>
                                  <span className="bx-company-photo"><Image src={photo} alt="" fill sizes="(max-width: 780px) 34vw, 176px" /></span>
                                  <span className="bx-company-copy">
                                    <strong>{business.name}</strong>
                                    <span>{business.location || business.sector}</span>
                                  </span>
                                  {profile?.established && <span className="bx-company-year">Since <span className="num">{profile.established}</span></span>}
                                  <span className="bx-company-go">View profile</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                    {visibleBusinesses.length === 0 && <p className="bx-empty">No companies match &ldquo;{directoryQuery.trim()}&rdquo;. Try another name or sector.</p>}
                  </div>
                </div>
              </div>
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
                </div>
              </div>
            </section>}
            {(storyLayout || section === "community") && (
              <section className="section-page-highlights">
                <div className="reference-wrap">
                  <p className="section-overline">{storyLayout ? "WHAT CONNECTS US" : section === "community" ? "AREAS ACROSS THE GROUP" : "STAY CONNECTED"}</p>
                  <div className="section-highlight-grid">
                    {(storyLayout
                      ? [["01", "Care", "Put people and the communities around our businesses at the heart of progress."], ["02", "Trust", "Build lasting relationships through thoughtful, reliable work."], ["03", "Growth", "Bring different areas of expertise together to help create opportunity."]]
                      : section === "community"
                        ? [["01", "Healthcare", "Healthcare businesses are part of the wider group."], ["02", "Education", "Education businesses help shape the group’s portfolio."], ["03", "Agriculture", "Agriculture businesses support another important area of work."]]
                        : [["01", "Group updates", "News and announcements will be shared here when confirmed."], ["02", "Business stories", "Stories from across the group will appear as they become available."], ["03", "Contact", "For a media enquiry, get in touch with the group."]]
                    ).map(([number, title, description]) => <article className="section-highlight-card" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}
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
        </>
        )}
      </main>

      {section === "businesses" && !companySlug ? (
        <div className="business-page-footer"><GroupFooter /></div>
      ) : section === "contact" ? (
        <div className="contact-page-footer"><GroupFooter /></div>
      ) : section === "careers" ? (
        <div className="career-page-footer"><GroupFooter /></div>
      ) : <GroupFooter />}
    </>
  );
}
