// Extra details for the About Us / Our Story company cards, keyed by the
// exact business name in data/businesses.ts.
//
// TODO: every `established` year below is a PLACEHOLDER — replace each one
// with the company's real founding year.
// `photo`: currently PLACEHOLDER photos reused from elsewhere on the site.
// Put the real company photo in public/company-photos/ and set the path
// here, e.g. "/company-photos/sanjeevani-hospital-pokhara.jpg". Leave it
// empty to show the branded placeholder instead.
export type CompanyProfile = {
  established: string;
  photo: string;
};

export const companyProfiles: Record<string, CompanyProfile> = {
  "Sanjeevani Hospital, Pokhara": { established: "2008", photo: "/key%20factor/healthcare.jpg" },
  "Sanjeevani Hospital, Nepalgunj": { established: "2010", photo: "/hospital.jpg" },
  "Nepalgunj Medical College": { established: "2005", photo: "/key%20factor/medical.jpg" },
  "Universal Medical College": { established: "2011", photo: "/medical%20college.jpg" },
  "Gandaki Medical College": { established: "2007", photo: "/key%20factor/healthcare.jpg" },
  "Sanjeevani Institute of Advance Science and Teaching Hospital": { established: "2015", photo: "/hospital.jpg" },
  "Khilung Kalika Suppliers": { established: "2012", photo: "/impact/innovation.png" },
  "Khilung Kalika Construction": { established: "2013", photo: "/key%20factor/construction.jpg" },
  "Sanjeevani Developers": { established: "2016", photo: "/construction.jpg" },
  "Everest Education Foundation": { established: "2004", photo: "/key%20factor/edu.jpg" },
  "Laughing Budha Hydro Power": { established: "2017", photo: "/key%20factor/hydro.jpg" },
  "Om Agro": { established: "2014", photo: "/key%20factor/agri.jpg" },
  "Janakpur Agro": { established: "2018", photo: "/agro.png" },
  "Khilung Kalika Agro": { established: "2015", photo: "/impact/sustainablity.png" },
  "Khilung Kalika Feeders": { established: "2019", photo: "/impact/sustainablity.png" },
  "Khilung Kalika Foods": { established: "2020", photo: "/impact/impact.jpg" },
  "Khilung Kalika Marketing": { established: "2021", photo: "/aboutus/hero.png" },
  "Mount Everest School": { established: "2002", photo: "/education.jpg" },
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
