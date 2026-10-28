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

// Newsroom gallery: the Photos and Videos tabs below the YouTube section.
// TODO: these use photos already on the site as placeholders. Put new photos
// in public/gallery/ and list them here, newest first. `caption` is shown
// under the photo and in the full-screen viewer.
export type GalleryPhoto = { src: string; alt: string; caption: string };

export const galleryPhotos: GalleryPhoto[] = [
  { src: "/business/business.png", alt: "Aerial view of a Sanjeevani Group hospital campus", caption: "Hospital campus from above" },
  { src: "/key%20factor/medical.jpg", alt: "Doctors and students at a clinical training session", caption: "Clinical skills training" },
  { src: "/key%20factor/edu.jpg", alt: "School children standing beside a yellow school bus", caption: "Students on their way to class" },
  { src: "/impact/impact.jpg", alt: "Smiling woman working in green hillside fields", caption: "In the fields" },
  { src: "/key%20factor/construction.jpg", alt: "Worker on concrete formwork at a construction site", caption: "On site with the construction team" },
  { src: "/key%20factor/hydro.jpg", alt: "Water rushing through a hydropower dam spillway", caption: "Hydropower spillway" },
  { src: "/leaderhero/leader.jpg", alt: "Sanjeevani Group leadership seated together at a table", caption: "Group leadership meeting" },
  { src: "/aboutus/mission.png", alt: "Engineers in hard hats reviewing plans on a laptop", caption: "Engineers reviewing project plans" },
  { src: "/key%20factor/healthcare.jpg", alt: "Front of the teaching hospital building", caption: "Teaching hospital" },
];

// A video is a YouTube link, or your own file in public/gallery/ (mp4 or webm)
// with an optional poster image.
// TODO: replace these placeholders with the group's own videos.
export type GalleryVideo =
  | { kind: "youtube"; url: string; title: string; thumbnail?: string }
  | { kind: "file"; src: string; title: string; poster?: string };

export const galleryVideos: GalleryVideo[] = [
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Placeholder video: replace with a group video", thumbnail: "/key%20factor/healthcare.jpg" },
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Placeholder video: replace with a group video", thumbnail: "/impact/sustainablity.png" },
  { kind: "youtube", url: "https://youtu.be/HF5RPCxa0m0", title: "Placeholder video: replace with a group video", thumbnail: "/key%20factor/hydro.jpg" },
];
