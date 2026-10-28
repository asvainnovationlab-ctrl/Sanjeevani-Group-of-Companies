// Extra details for the About Us / Our Story company cards, keyed by the
// exact business name in data/businesses.ts.
//
// TODO: every `established` year below is a PLACEHOLDER — replace each one
// with the company's real founding year.
// `photo`: currently PLACEHOLDER photos reused from elsewhere on the site.
// Put the real company photo in public/company-photos/ and set the path
// here, e.g. "/company-photos/sanjeevani-hospital-pokhara.jpg". Leave it
// empty to show the branded placeholder instead.
//
// `managingDirector` / `managingDirectorPhoto`, `email`, `phone` and
// `address`: fill in per company. Empty values are hidden on the company page
// (the managing director shows as "To be announced", contact falls back to the
// group office).
export type CompanyProfile = {
  established: string;
  photo: string;
  managingDirector?: string;
  managingDirectorPhoto?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export const companyProfiles: Record<string, CompanyProfile> = {
  "Sanjeevani Hospital, Pokhara": { established: "2008", photo: "/companyprofile/sanjeevani%20hospital.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Sanjeevani Hospital, Nepalgunj": { established: "2010", photo: "/companyprofile/sanjeevani%20hospital.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Nepalgunj Medical College": { established: "2005", photo: "/companyprofile/nepalgunj%20medical%20college.png", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Universal Medical College": { established: "2011", photo: "/companyprofile/universal%20coolege%20of%20medical%20science.png", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Gandaki Medical College": { established: "2007", photo: "/companyprofile/gandaki%20medical%20college.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Sanjeevani Institute of Advance Science and Teaching Hospital": { established: "2015", photo: "/hospital.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Khilung Kalika Suppliers": { established: "2012", photo: "/impact/innovation.png", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Khilung Kalika Construction": { established: "2013", photo: "/companyprofile/khilung%20kalika%20construcction.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Sanjeevani Developers": { established: "2016", photo: "/construction.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Everest Education Foundation": { established: "2004", photo: "/key%20factor/edu.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Laughing Budha Hydro Power": { established: "2017", photo: "/companyprofile/laughing%20buddha%20.png", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Om Agro": { established: "2014", photo: "/key%20factor/agri.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Janakpur Agro": { established: "2018", photo: "/agro.png", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Khilung Kalika Agro": { established: "2015", photo: "/companyprofile/khilung%20kalika%20agro.png", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Khilung Kalika Feeders": { established: "2019", photo: "/impact/sustainablity.png", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Khilung Kalika Foods": { established: "2020", photo: "/impact/impact.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Khilung Kalika Marketing": { established: "2021", photo: "/aboutus/hero.png", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
  "Mount Everest School": { established: "2002", photo: "/companyprofile/mount%20everest%20school.jpg", managingDirector: "", managingDirectorPhoto: "", email: "", phone: "", address: "" },
};

export function getCompanyProfile(name: string): CompanyProfile | undefined {
  return companyProfiles[name];
}

// Accepts "example.com", "www.example.com" or a full URL; returns undefined
// for anything that isn't a usable http(s) link.
export function toWebsiteUrl(website: string | undefined): string | undefined {
  const value = website?.trim();
  if (!value) return undefined;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

// URL slug for a company's page: /businesses/<slug>.
export function getCompanySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// One photo per sector, shared by the Businesses directory and the company
// pages' fallback when a company has no photo of its own yet.
export const sectorImages: Record<string, string> = {
  healthcare: "/hospital.jpg",
  "medical-colleges": "/medical%20college.jpg",
  education: "/education.jpg",
  agriculture: "/agro.png",
  infrastructure: "/hydro.png",
  "business-services": "/construction.jpg",
};
