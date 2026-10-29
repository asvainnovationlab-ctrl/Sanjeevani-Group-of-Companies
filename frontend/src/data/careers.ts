// Career areas (the Careers page list) and the vacancies shown on each area's
// page at /careers/<area-slug>.
//
// TODO: every vacancy below is a SAMPLE written to show the layout (marked
// `sample: true`; the label is no longer shown on the site, so replace them
// before launch). Replace them with the companies'
// real vacancies (and drop the `sample` flag), or delete an area's vacancies
// to show "No open vacancies right now" for it.

// `image`: the hero photo on the area's vacancy page (reused site photos; replace freely).
export type CareerArea = { slug: string; title: string; type: string; image: string; companyNames: string[] };

export const careerAreas: CareerArea[] = [
  {
    slug: "care-and-clinical-services",
    image: "/key%20factor/healthcare.jpg",
    title: "Care & clinical services",
    type: "Healthcare",
    companyNames: [
      "Sanjeevani Hospital, Pokhara",
      "Sanjeevani Hospital, Nepalgunj",
      "Sanjeevani Institute of Advance Science and Teaching Hospital",
    ],
  },
  {
    slug: "medical-education",
    image: "/key%20factor/medical.jpg",
    title: "Medical education",
    type: "Education",
    companyNames: ["Nepalgunj Medical College", "Universal Medical College", "Gandaki Medical College"],
  },
  {
    slug: "school-education",
    image: "/key%20factor/edu.jpg",
    title: "School education",
    type: "Education",
    companyNames: ["Everest Education Foundation", "Mount Everest School"],
  },
  {
    slug: "agriculture-and-food",
    image: "/impact/impact.jpg",
    title: "Agriculture & food",
    type: "Agriculture",
    companyNames: ["Om Agro", "Janakpur Agro", "Khilung Kalika Agro", "Khilung Kalika Feeders", "Khilung Kalika Foods"],
  },
  {
    slug: "construction-and-supply",
    image: "/key%20factor/construction.jpg",
    title: "Construction & supply",
    type: "Infrastructure",
    companyNames: ["Khilung Kalika Construction", "Khilung Kalika Suppliers"],
  },
  {
    slug: "hydropower-and-engineering",
    image: "/key%20factor/hydro.jpg",
    title: "Hydropower & engineering",
    type: "Infrastructure",
    companyNames: ["Laughing Budha Hydro Power"],
  },
  {
    slug: "development-and-marketing",
    image: "/business/business.png",
    title: "Development & marketing",
    type: "Business operations",
    companyNames: ["Sanjeevani Developers", "Khilung Kalika Marketing"],
  },
];

export type Vacancy = {
  id: string;
  areaSlug: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  openings: number;
  deadline: string;
  summary: string;
  education: string;
  experience: string;
  skills: string[];
  // Shown on the role page. Leave empty ("") to show an [Add ...] placeholder.
  ageRange?: string; // e.g. "18-35 years"
  salary?: string; // e.g. "NPR 30,000 - 40,000 per month"
  sample?: boolean;
};

export const vacancies: Vacancy[] = [
  {
    id: "staff-nurse-pokhara",
    areaSlug: "care-and-clinical-services",
    title: "Staff Nurse",
    company: "Sanjeevani Hospital, Pokhara",
    location: "Pokhara, Nepal",
    employmentType: "Full-time",
    openings: 4,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Provide safe, compassionate nursing care across inpatient wards.",
    education: "PCL or B.Sc. Nursing, registered with the Nepal Nursing Council",
    experience: "1 year or more of hospital nursing (freshers may apply)",
    skills: ["Patient assessment and care", "Medication administration", "Clear communication with patients and families"],
    sample: true,
  },
  {
    id: "medical-officer-nepalgunj",
    areaSlug: "care-and-clinical-services",
    title: "Medical Officer",
    company: "Sanjeevani Hospital, Nepalgunj",
    location: "Nepalgunj, Nepal",
    employmentType: "Full-time",
    openings: 2,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Manage outpatient and emergency patients as part of the clinical team.",
    education: "MBBS, registered with the Nepal Medical Council",
    experience: "1 year or more after internship",
    skills: ["Emergency and outpatient care", "Clinical documentation", "Teamwork in a busy hospital"],
    sample: true,
  },
  {
    id: "lab-technologist-teaching-hospital",
    areaSlug: "care-and-clinical-services",
    title: "Laboratory Technologist",
    company: "Sanjeevani Institute of Advance Science and Teaching Hospital",
    location: "Nepal",
    employmentType: "Full-time",
    openings: 1,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Run and report laboratory tests to quality standards.",
    education: "B.Sc. Medical Laboratory Technology, registered with the Nepal Health Professional Council",
    experience: "2 years or more in a hospital laboratory",
    skills: ["Haematology and biochemistry", "Quality control", "Laboratory information systems"],
    sample: true,
  },
  {
    id: "lecturer-anatomy-nepalgunj",
    areaSlug: "medical-education",
    title: "Lecturer, Anatomy",
    company: "Nepalgunj Medical College",
    location: "Nepalgunj, Nepal",
    employmentType: "Full-time",
    openings: 1,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Teach anatomy to MBBS and allied health students.",
    education: "MD or M.Sc. in Anatomy",
    experience: "Teaching experience preferred",
    skills: ["Lecture and dissection teaching", "Student assessment", "Research and publication"],
    sample: true,
  },
  {
    id: "assistant-professor-gandaki",
    areaSlug: "medical-education",
    title: "Assistant Professor, Community Medicine",
    company: "Gandaki Medical College",
    location: "Pokhara, Nepal",
    employmentType: "Full-time",
    openings: 1,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Lead community medicine teaching and field programmes.",
    education: "MD in Community Medicine",
    experience: "3 years or more of teaching at a medical college",
    skills: ["Curriculum delivery", "Field research supervision", "Public health programmes"],
    sample: true,
  },
  {
    id: "science-teacher-mount-everest",
    areaSlug: "school-education",
    title: "Secondary Science Teacher",
    company: "Mount Everest School",
    location: "Nepal",
    employmentType: "Full-time",
    openings: 2,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Teach science to grades 8 to 10.",
    education: "Bachelor's in Science with a teaching licence",
    experience: "2 years or more of classroom teaching",
    skills: ["Lesson planning", "Laboratory demonstrations", "Classroom management"],
    sample: true,
  },
  {
    id: "farm-supervisor-om-agro",
    areaSlug: "agriculture-and-food",
    title: "Farm Supervisor",
    company: "Om Agro",
    location: "Nepal",
    employmentType: "Full-time",
    openings: 1,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Supervise daily farm operations and field teams.",
    education: "B.Sc. Agriculture or a related diploma",
    experience: "2 years or more in farm operations",
    skills: ["Crop and livestock management", "Team supervision", "Record keeping"],
    sample: true,
  },
  {
    id: "quality-officer-foods",
    areaSlug: "agriculture-and-food",
    title: "Quality Control Officer",
    company: "Khilung Kalika Foods",
    location: "Nepal",
    employmentType: "Full-time",
    openings: 1,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Check raw materials and finished products against food-safety standards.",
    education: "B.Tech. Food Technology or B.Sc. Microbiology",
    experience: "1 year or more in food quality control",
    skills: ["Food-safety standards", "Sampling and testing", "Documentation"],
    sample: true,
  },
  {
    id: "site-engineer-construction",
    areaSlug: "construction-and-supply",
    title: "Site Engineer (Civil)",
    company: "Khilung Kalika Construction",
    location: "Nepal",
    employmentType: "Full-time",
    openings: 2,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Supervise construction work on site for quality, safety and schedule.",
    education: "B.E. Civil, registered with the Nepal Engineering Council",
    experience: "2 years or more of site supervision",
    skills: ["AutoCAD and quantity estimation", "Site safety", "Contractor coordination"],
    sample: true,
  },
  {
    id: "electrical-engineer-hydro",
    areaSlug: "hydropower-and-engineering",
    title: "Electrical Engineer",
    company: "Laughing Budha Hydro Power",
    location: "Nepal",
    employmentType: "Full-time",
    openings: 1,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Operate and maintain powerhouse electrical systems.",
    education: "B.E. Electrical, registered with the Nepal Engineering Council",
    experience: "3 years or more in hydropower or power systems",
    skills: ["Generator and switchyard maintenance", "Protection systems", "Safety procedures"],
    sample: true,
  },
  {
    id: "marketing-executive",
    areaSlug: "development-and-marketing",
    title: "Marketing Executive",
    company: "Khilung Kalika Marketing",
    location: "Nepal",
    employmentType: "Full-time",
    openings: 2,
    deadline: "[Add deadline]",
    ageRange: "",
    salary: "",
    summary: "Plan and run campaigns for the group's products and services.",
    education: "BBA, BBS or a related bachelor's degree",
    experience: "1 year or more in marketing or sales",
    skills: ["Campaign planning", "Social media", "Client communication"],
    sample: true,
  },
];

export function getCareerArea(slug: string): CareerArea | undefined {
  return careerAreas.find((area) => area.slug === slug);
}

export function getAreaVacancies(slug: string): Vacancy[] {
  return vacancies.filter((vacancy) => vacancy.areaSlug === slug);
}

export const educationLevels = [
  "SLC / SEE",
  "+2 / Intermediate",
  "Diploma / PCL",
  "Bachelor's degree",
  "Master's degree",
  "MBBS / MD / MS",
  "PhD",
  "Other",
];
