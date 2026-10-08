export type BusinessCategory =
  | "healthcare"
  | "education"
  | "agriculture"
  | "other";

type Business = {
  _id: string;
  name: string;
  category: BusinessCategory;
  sector: string;
  description: string;
  website: string;
  published: boolean;
  order: number;
};

const directory: {
  name: string;
  category: BusinessCategory;
  sector: string;
}[] = [
  { name: "Sanjeevani Hospital, Pokhara", category: "healthcare", sector: "Healthcare" },
  { name: "Sanjeevani Hospital, Nepalgunj", category: "healthcare", sector: "Healthcare" },
  { name: "Nepalgunj Medical College", category: "education", sector: "Healthcare · Education" },
  { name: "Universal Medical College", category: "education", sector: "Healthcare · Education" },
  { name: "Gandaki Medical College", category: "education", sector: "Healthcare · Education" },
  { name: "Sanjeevani Institute of Advance Science and Teaching Hospital", category: "healthcare", sector: "Healthcare · Education" },
  { name: "Khilung Kalika Suppliers", category: "other", sector: "Suppliers" },
  { name: "Khilung Kalika Construction", category: "other", sector: "Construction" },
  { name: "Sanjeevani Developers", category: "other", sector: "Development" },
  { name: "Everest Education Foundation", category: "education", sector: "Education" },
  { name: "Laughing Budha Hydro Power", category: "other", sector: "Hydropower" },
  { name: "Om Agro", category: "agriculture", sector: "Agriculture" },
  { name: "Janakpur Agro", category: "agriculture", sector: "Agriculture" },
  { name: "Khilung Kalika Agro", category: "agriculture", sector: "Agriculture" },
  { name: "Khilung Kalika Feeders", category: "agriculture", sector: "Agriculture" },
  { name: "Khilung Kalika Foods", category: "agriculture", sector: "Food" },
  { name: "Khilung Kalika Marketing", category: "other", sector: "Marketing" },
  { name: "Mount Everest School", category: "education", sector: "Education" },
];

export const businesses: Business[] = directory.map((business, order) => ({
  ...business,
  _id: String(order + 1),
  description: "Part of the Sanjeevani Group family of businesses.",
  website: "",
  published: true,
  order,
}));
