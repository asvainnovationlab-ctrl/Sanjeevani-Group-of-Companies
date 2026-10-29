import { z } from "zod";
import { educationLevels } from "@/data/careers";
import { slugSchema } from "@/server/validation/company";

const lines = (max: number) => z.array(z.string().trim().min(1).max(500)).max(max);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-30.");
const money = z.number().nonnegative().max(100_000_000).nullable();

const vacancyFields = {
  companyId: z.string().uuid(),
  careerAreaId: z.string().uuid().nullable(),
  departmentId: z.string().uuid().nullable(),
  locationId: z.string().uuid().nullable(),
  locationText: z.string().trim().min(2).max(160),
  title: z.string().trim().min(3).max(160),
  slug: slugSchema,
  summary: z.string().trim().max(600),
  description: z.string().trim().max(10000).nullable(),
  responsibilities: lines(30),
  qualifications: lines(30),
  requiredEducation: z.string().trim().max(200),
  requiredExperience: z.string().trim().max(200),
  skills: lines(30),
  requiredDocuments: lines(15),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY", "VOLUNTEER"]),
  openings: z.number().int().min(1).max(1000),
  minAge: z.number().int().min(16).max(80).nullable(),
  maxAge: z.number().int().min(16).max(80).nullable(),
  salaryMin: money,
  salaryMax: money,
  salaryPeriod: z.enum(["HOUR", "DAY", "MONTH", "YEAR"]),
  salaryDisclosed: z.boolean(),
  salaryNote: z.string().trim().max(200).nullable(),
  openingDate: day.nullable(), // Nepal calendar dates
  deadline: day.nullable(),
  publishAt: z.string().datetime().nullable(), // exact scheduling instants
  closeAt: z.string().datetime().nullable(),
  ownerId: z.string().uuid().nullable(),
};

const vacancyBase = z.object(vacancyFields);

const ranges = <T extends { minAge?: number | null; maxAge?: number | null; salaryMin?: number | null; salaryMax?: number | null }>(v: T, ctx: z.RefinementCtx) => {
  if (v.minAge != null && v.maxAge != null && v.minAge > v.maxAge) ctx.addIssue({ code: "custom", path: ["minAge"], message: "The minimum age is above the maximum age." });
  if (v.salaryMin != null && v.salaryMax != null && v.salaryMin > v.salaryMax) ctx.addIssue({ code: "custom", path: ["salaryMin"], message: "The minimum salary is above the maximum salary." });
};

export const vacancyCreateSchema = vacancyBase
  .partial()
  .required({ companyId: true, title: true, locationText: true })
  .extend({ summary: vacancyFields.summary.default(""), requiredEducation: vacancyFields.requiredEducation.default(""), requiredExperience: vacancyFields.requiredExperience.default("") })
  .superRefine(ranges);

export const vacancyUpdateSchema = vacancyBase
  .partial()
  .extend({ expectedUpdatedAt: z.string().datetime().optional() })
  .strict()
  .superRefine(ranges);

export type VacancyCreateInput = z.infer<typeof vacancyCreateSchema>;
export type VacancyUpdateInput = z.infer<typeof vacancyUpdateSchema>;

export const vacancyStatusSchema = z.object({ action: z.enum(["publish", "close", "archive", "restore"]) });

export const vacancyListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
  companyId: z.string().uuid().optional(),
});

// The public application form (multipart). Field names match ApplicationForm.tsx.
const formText = (min: number, max: number, message: string) => z.string().trim().min(min, message).max(max, message);

export const applicationFormSchema = z.object({
  vacancyId: formText(1, 120, "Choose the vacancy you are applying for."),
  fullName: formText(2, 120, "Enter your full name."),
  email: z.string().trim().toLowerCase().max(200).email("Enter a valid email address."),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{6,19}$/, "Enter a valid phone number."),
  age: z.coerce.number({ invalid_type_error: "Enter your age (16 to 80)." }).int("Enter your age (16 to 80).").min(16, "Enter your age (16 to 80).").max(80, "Enter your age (16 to 80)."),
  gender: z.string().trim().max(30).optional().transform((v) => v || null),
  address: formText(2, 200, "Enter your address."),
  education: z.string().refine((value) => educationLevels.includes(value), "Choose your highest education."),
  experienceYears: z.coerce.number({ invalid_type_error: "Enter your years of experience (0 to 60)." }).min(0, "Enter your years of experience (0 to 60).").max(60, "Enter your years of experience (0 to 60)."),
  currentEmployer: z.string().trim().max(150).optional().transform((v) => v || null),
  expectedSalary: z.string().trim().max(60).optional().transform((v) => v || null),
  coverLetter: z.string().trim().max(3000).optional().transform((v) => v || null),
  consent: z.literal("yes", { errorMap: () => ({ message: "Please confirm that your details are correct." }) }),
});

export const applicationListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"]).optional(),
  vacancyId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const applicationStatusSchema = z.object({
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"]),
  note: z.string().trim().max(2000).optional(),
});

export const applicationNoteSchema = z.object({ body: z.string().trim().min(1, "Write a note.").max(5000) });
