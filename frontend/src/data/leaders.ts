// Leadership people: the Leadership page's cards and each person's profile
// page at /leadership/<slug>. The chairman keeps his own page at /chairman.
//
// TODO: replace each "Leader Name" / "Designation" / photo with the real
// person, and give them a slug (it becomes their page address). Their
// message and CV live in `leaderProfiles` below; anything left out shows as
// an "[Add …]" placeholder on their page.

export type LeaderSocials = { linkedin: string; facebook: string; instagram: string; x: string };

// TODO: replace these placeholder links with each person's real profile URLs.
export const placeholderSocials: LeaderSocials = {
  linkedin: "https://www.linkedin.com/",
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  x: "https://x.com/",
};

export const chairmanSocials = placeholderSocials;

export type Leader = { slug: string; name: string; role: string; photo: string; socials: LeaderSocials };

export const leadershipBoard: Leader[] = [
  { slug: "chairman", name: "C.A. Khuma Parsad Aryal", role: "Chairman", photo: "/khumaa.jpeg", socials: chairmanSocials },
  { slug: "leader-2", name: "Leader Name", role: "Designation", photo: "/khumaa.jpeg", socials: placeholderSocials },
  { slug: "leader-3", name: "Leader Name", role: "Designation", photo: "/khumaa.jpeg", socials: placeholderSocials },
];
export const leadershipTeam: Leader[] = [
  { slug: "leader-4", name: "Leader Name", role: "Designation", photo: "/khumaa.jpeg", socials: placeholderSocials },
  { slug: "leader-5", name: "Leader Name", role: "Designation", photo: "/khumaa.jpeg", socials: placeholderSocials },
  { slug: "leader-6", name: "Leader Name", role: "Designation", photo: "/khumaa.jpeg", socials: placeholderSocials },
  { slug: "leader-7", name: "Leader Name", role: "Designation", photo: "/khumaa.jpeg", socials: placeholderSocials },
];
export const allLeaders: Leader[] = [...leadershipBoard, ...leadershipTeam];

// Where a leader's card links: the chairman to his existing page, everyone
// else to their profile.
export function leaderHref(leader: Leader): string {
  return leader.slug === "chairman" ? "/chairman" : `/leadership/${leader.slug}`;
}

export type LeaderProfileContent = {
  summary: string;
  message: string[];
  career: { period: string; position: string; organisation: string }[];
  education: { qualification: string; institution: string }[];
  responsibilities: string[];
};

// Fill in per person, keyed by slug, e.g.
// "leader-2": {
//   summary: "One sentence on who they are.",
//   message: ["First paragraph of their message.", "Second paragraph."],
//   career: [{ period: "2015 – present", position: "Managing Director", organisation: "Sanjeevani Hospital, Pokhara" }],
//   education: [{ qualification: "MBBS", institution: "Tribhuvan University" }],
//   responsibilities: ["Hospital operations", "Clinical quality"],
// },
export const leaderProfiles: Record<string, Partial<LeaderProfileContent>> = {};

export function getLeader(slug: string): Leader | undefined {
  return allLeaders.find((leader) => leader.slug === slug);
}

// The person's content, with an "[Add …]" placeholder for anything not yet written.
export function getLeaderProfile(leader: Leader): LeaderProfileContent {
  const given = leaderProfiles[leader.slug] ?? {};
  const who = leader.name === "Leader Name" ? "this leader" : leader.name;
  return {
    summary: given.summary ?? `[Add a one-sentence professional summary for ${who}.]`,
    message: given.message?.length
      ? given.message
      : [
          `[Add a message from ${who} about the vision and priorities they bring to Sanjeevani Group.]`,
          "[Add a second paragraph, for example what they want patients, students, partners or employees to know.]",
        ],
    career: given.career?.length
      ? given.career
      : [
          { period: "[Year – present]", position: `[Add current position, e.g. ${leader.role}]`, organisation: "Sanjeevani Group" },
          { period: "[Year – Year]", position: "[Add previous position]", organisation: "[Add organisation]" },
          { period: "[Year – Year]", position: "[Add earlier position]", organisation: "[Add organisation]" },
        ],
    education: given.education?.length
      ? given.education
      : [
          { qualification: "[Add highest qualification]", institution: "[Add institution]" },
          { qualification: "[Add further qualification]", institution: "[Add institution]" },
        ],
    responsibilities: given.responsibilities?.length
      ? given.responsibilities
      : ["[Add a key responsibility]", "[Add a key responsibility]", "[Add a key responsibility]"],
  };
}
