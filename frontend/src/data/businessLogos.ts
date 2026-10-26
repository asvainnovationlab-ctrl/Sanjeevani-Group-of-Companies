const businessLogos: Record<string, string> = {
  "janakpur agro": "/companylogo/janakpur agro farm limited.jpeg",
  "khilung kalika agro": "/companylogo/khilung kalika agro farm pvt ltd.jpeg",
  "khilung kalika construction": "/companylogo/khilung kalika construction.webp",
  "khilung kalika foods": "/companylogo/khilung kalika food limited.jpeg",
  "khilung kalika marketing": "/companylogo/khilung kalika marketing.jpeg",
  "khilung kalika suppliers": "/companylogo/khilung kalika general trading.jpeg",
  "laughing budha hydro power": "/companylogo/lord buddha.jpeg",
  "mount everest school": "/companylogo/Mount-Everest-Boarding-School.png",
  "nepalgunj medical college": "/companylogo/nepalgunj medical college.png",
  "om agro": "/companylogo/om agro pvt ltd.jpeg",
  "sanjeevani hospital, nepalgunj": "/companylogo/sanjevani hospital nepalgunj.png",
  "sanjeevani hospital, pokhara": "/companylogo/sanjevani hospital logo.png",
  "sanjeevani institute of advance science and teaching hospital": "/companylogo/sanjeevani institute of advanced studeis and teaching hospital.jpg",
  "sanjeevani developers": "/companylogo/sanjevani debelopers.jpg",
  "gandaki medical college": "/companylogo/gandaki medical college.png",
  "universal medical college": "/companylogo/universal college of medical science.jpeg",
};

export function getBusinessLogo(name: string) {
  return businessLogos[name.trim().toLowerCase()];
}
