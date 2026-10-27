export type NewsroomStory = {
  image: string;
  alt: string;
  date: string;
  title: string;
  summary: string;
  link?: string;
};

export type CompanyNotice = {
  company: string;
  date: string;
  title: string;
};

// TODO: replace these sample press releases with real ones (newest first).
export const latestPressReleases: NewsroomStory[] = [
  {
    image: "/hospital.jpg",
    alt: "Sanjeevani hospital",
    date: "November 2026",
    title: "Sanjeevani Hospital expands specialist services",
    summary: "New departments bring more specialist care closer to patients in the region.",
    link: "https://nayapusta.com/2026/09/03/239400/",
  },
  {
    image: "/medical%20college.jpg",
    alt: "Sanjeevani medical college campus",
    date: "October 2026",
    title: "Medical college opens admissions for the new academic year",
    summary: "Applications are now open for undergraduate and postgraduate medical programmes.",
    link: "https://nayapusta.com/2026/09/03/239400/",
  },
  {
    image: "/hydro.png",
    alt: "Sanjeevani hydropower project",
    date: "September 2026",
    title: "Progress update on our hydropower project",
    summary: "Construction milestones reached as the project moves towards generation.",
    link: "https://nayapusta.com/2026/09/03/239400/",
  },
];

// TODO: replace these sample events with real ones (newest first).
export const latestEvents: NewsroomStory[] = [
  {
    image: "/education.jpg",
    alt: "Students at a Sanjeevani Group college",
    date: "November 2026",
    title: "Annual convocation and academic awards",
    summary: "Graduates from our medical and academic colleges are honoured alongside faculty and families.",
  },
  {
    image: "/hospital.jpg",
    alt: "Sanjeevani hospital building",
    date: "October 2026",
    title: "Free community health camp",
    summary: "Doctors from our hospitals offer free check-ups and health advice to local communities.",
  },
  {
    image: "/agro.png",
    alt: "Sanjeevani agro farm",
    date: "September 2026",
    title: "Farmers' outreach programme",
    summary: "Our agro companies share modern farming practices with farmers across the region.",
  },
];

// TODO: add YouTube videos here (newest first). Paste any YouTube link: watch, youtu.be or shorts.
// Example: { url: "https://www.youtube.com/watch?v=VIDEO_ID", title: "Video title", thumbnail: "/photo.jpg" },
// thumbnail is optional; without it YouTube's own thumbnail is shown.
export const youtubeVideos: { url: string; title: string; thumbnail?: string }[] = [
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/aama.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/hospital.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/medical%20college.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/education.jpg" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/agro.png" },
  { url: "https://youtu.be/HF5RPCxa0m0", title: "Maya Pirati – Trishna Gurung | Best Of Hits Collection Song", thumbnail: "/construction.jpg" },
];

export function getYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

// TODO: replace these sample notices with real ones from each company (newest first).
export const companyNotices: CompanyNotice[] = [
  {
    company: "Nepalgunj Medical College",
    date: "November 2026",
    title: "Entrance exam schedule published",
  },
  {
    company: "Sanjeevani Hospital, Nepalgunj",
    date: "November 2026",
    title: "OPD hours extended on weekdays",
  },
  {
    company: "Mount Everest Boarding School",
    date: "October 2026",
    title: "Admissions open for the new session",
  },
];
