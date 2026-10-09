export type BusinessCategory =
  | "healthcare"
  | "education"
  | "agriculture"
  | "other";

export type BusinessGroup =
  | "healthcare"
  | "medical-colleges"
  | "education"
  | "agriculture"
  | "infrastructure"
  | "business-services";

export const businessGroups: {
  label: string;
  value: BusinessGroup;
  detail: string;
  matches: (business: Business) => boolean;
}[] = [
  {
    label: "Healthcare",
    value: "healthcare",
    detail: "Hospitals and clinical care",
    matches: (business) => business.category === "healthcare",
  },
  {
    label: "Medical colleges",
    value: "medical-colleges",
    detail: "Higher medical education",
    matches: (business) => business.name.toLowerCase().includes("medical college"),
  },
  {
    label: "Education",
    value: "education",
    detail: "Schools and learning",
    matches: (business) => business.category === "education" && !business.name.toLowerCase().includes("medical college"),
  },
  {
    label: "Agriculture & food",
    value: "agriculture",
    detail: "Agriculture, feed and food",
    matches: (business) => business.category === "agriculture",
  },
  {
    label: "Infrastructure",
    value: "infrastructure",
    detail: "Construction and hydropower",
    matches: (business) => ["construction", "hydropower"].includes(business.sector.toLowerCase()),
  },
  {
    label: "Business services",
    value: "business-services",
    detail: "Suppliers, development and marketing",
    matches: (business) => ["suppliers", "development", "marketing"].includes(business.sector.toLowerCase()),
  },
];

export type Business = {
  _id: string;
  name: string;
  category: BusinessCategory;
  sector: string;
  description: string;
  website: string;
  location: string;
  published: boolean;
  order: number;
};

const directory: {
  name: string;
  category: BusinessCategory;
  sector: string;
  location: string;
}[] = [
  { name: "Sanjeevani Hospital, Pokhara", category: "healthcare", sector: "Healthcare", location: "Pokhara, Nepal" },
  { name: "Sanjeevani Hospital, Nepalgunj", category: "healthcare", sector: "Healthcare", location: "Nepalgunj, Nepal" },
  { name: "Nepalgunj Medical College", category: "education", sector: "Healthcare · Education", location: "" },
  { name: "Universal Medical College", category: "education", sector: "Healthcare · Education", location: "" },
  { name: "Gandaki Medical College", category: "education", sector: "Healthcare · Education", location: "" },
  { name: "Sanjeevani Institute of Advance Science and Teaching Hospital", category: "healthcare", sector: "Healthcare · Education", location: "" },
  { name: "Khilung Kalika Suppliers", category: "other", sector: "Suppliers", location: "" },
  { name: "Khilung Kalika Construction", category: "other", sector: "Construction", location: "" },
  { name: "Sanjeevani Developers", category: "other", sector: "Development", location: "" },
  { name: "Everest Education Foundation", category: "education", sector: "Education", location: "" },
  { name: "Laughing Budha Hydro Power", category: "other", sector: "Hydropower", location: "" },
  { name: "Om Agro", category: "agriculture", sector: "Agriculture", location: "" },
  { name: "Janakpur Agro", category: "agriculture", sector: "Agriculture", location: "" },
  { name: "Khilung Kalika Agro", category: "agriculture", sector: "Agriculture", location: "" },
  { name: "Khilung Kalika Feeders", category: "agriculture", sector: "Agriculture", location: "" },
  { name: "Khilung Kalika Foods", category: "agriculture", sector: "Food", location: "" },
  { name: "Khilung Kalika Marketing", category: "other", sector: "Marketing", location: "" },
  { name: "Mount Everest School", category: "education", sector: "Education", location: "" },
];

export const businesses: Business[] = directory.map((business, order) => ({
  ...business,
  _id: String(order + 1),
  description: "Part of the Sanjeevani Group family of businesses.",
  website: "",
  published: true,
  order,
}));
