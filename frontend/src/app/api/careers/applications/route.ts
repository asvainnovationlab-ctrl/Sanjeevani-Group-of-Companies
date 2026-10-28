import { NextResponse } from "next/server";
import { educationLevels, getCareerArea, vacancies } from "@/data/careers";
import { ApplicationModel } from "@/lib/application-model";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const maxCvBytes = 5 * 1024 * 1024;
const allowedCv: Record<string, { mime: string; magic: number[] }> = {
  pdf: { mime: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: [0x50, 0x4b, 0x03, 0x04] }, // zip
  doc: { mime: "application/msword", magic: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE
};

function text(form: FormData, name: string, max: number) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function fail(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("The application could not be read. Please try again.");
  }

  // Honeypot: a field hidden from people. Bots fill it; pretend success.
  if (text(form, "website", 200)) return NextResponse.json({ ok: true });

  // A listed vacancy, or "general:<area-slug>" for a general application to an area.
  const vacancyId = text(form, "vacancyId", 100);
  const generalArea = vacancyId.startsWith("general:") ? getCareerArea(vacancyId.slice("general:".length)) : undefined;
  const vacancy = generalArea
    ? { id: vacancyId, title: "General application", company: generalArea.title, areaSlug: generalArea.slug }
    : vacancies.find((item) => item.id === vacancyId);
  if (!vacancy) return fail("Choose the vacancy you are applying for.");

  const fullName = text(form, "fullName", 120);
  const email = text(form, "email", 200);
  const phone = text(form, "phone", 30);
  const address = text(form, "address", 200);
  const education = text(form, "education", 60);
  const gender = text(form, "gender", 30);
  const currentEmployer = text(form, "currentEmployer", 150);
  const expectedSalary = text(form, "expectedSalary", 60);
  const coverLetter = text(form, "coverLetter", 3000);
  const age = Number(text(form, "age", 3));
  const experienceYears = Number(text(form, "experienceYears", 4));

  if (fullName.length < 2) return fail("Enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Enter a valid email address.");
  if (!/^[+\d][\d\s-]{6,19}$/.test(phone)) return fail("Enter a valid phone number.");
  if (!Number.isInteger(age) || age < 16 || age > 80) return fail("Enter your age (16 to 80).");
  if (!address) return fail("Enter your address.");
  if (!educationLevels.includes(education)) return fail("Choose your highest education.");
  if (!Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 60) return fail("Enter your years of experience (0 to 60).");
  if (form.get("consent") !== "yes") return fail("Please confirm that your details are correct.");

  const cv = form.get("cv");
  if (!(cv instanceof File) || cv.size === 0) return fail("Attach your CV.");
  if (cv.size > maxCvBytes) return fail("Your CV must be 5 MB or smaller.");
  const extension = cv.name.split(".").pop()?.toLowerCase() ?? "";
  const kind = allowedCv[extension];
  if (!kind) return fail("Your CV must be a PDF or Word file (.pdf, .doc or .docx).");
  const bytes = Buffer.from(await cv.arrayBuffer());
  if (!kind.magic.every((byte, index) => bytes[index] === byte)) return fail("That file does not look like a real PDF or Word document.");

  if (!process.env.MONGODB_URI) {
    return fail("Online applications are not available right now. Please email your CV to info@sanjeevanigroup.com.", 503);
  }

  try {
    await connectToDatabase();
    await ApplicationModel.create({
      vacancyId: vacancy.id,
      vacancyTitle: vacancy.title,
      company: vacancy.company,
      areaSlug: vacancy.areaSlug,
      fullName,
      email,
      phone,
      age,
      gender,
      address,
      education,
      experienceYears,
      currentEmployer,
      expectedSalary,
      coverLetter,
      cvFileName: cv.name.replace(/[^\w.\- ]+/g, "_").slice(0, 150),
      cvMimeType: kind.mime,
      cvSize: cv.size,
      cvData: bytes,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Could not save a job application:", error);
    return fail("Your application could not be sent right now. Please try again, or email your CV to info@sanjeevanigroup.com.", 503);
  }
}
