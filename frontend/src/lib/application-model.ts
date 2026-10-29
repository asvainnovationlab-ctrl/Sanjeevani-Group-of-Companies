import mongoose, { Schema, model, models } from "mongoose";

// A job application sent from /careers/<area>. The CV is stored with the
// application (max 5 MB), so the whole record lives in one place and the
// admin panel can download it.
export type ApplicationRecord = {
  vacancyId: string;
  vacancyTitle: string;
  company: string;
  areaSlug: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  education: string;
  experienceYears: number;
  currentEmployer: string;
  expectedSalary: string;
  coverLetter: string;
  cvFileName: string;
  cvMimeType: string;
  cvSize: number;
  cvData: Buffer;
  status: "new" | "reviewed";
};

const applicationSchema = new Schema<ApplicationRecord>(
  {
    vacancyId: { type: String, required: true, trim: true },
    vacancyTitle: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    areaSlug: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, default: "", trim: true },
    address: { type: String, required: true, trim: true },
    education: { type: String, required: true, trim: true },
    experienceYears: { type: Number, required: true },
    currentEmployer: { type: String, default: "", trim: true },
    expectedSalary: { type: String, default: "", trim: true },
    coverLetter: { type: String, default: "", trim: true },
    cvFileName: { type: String, required: true },
    cvMimeType: { type: String, required: true },
    cvSize: { type: Number, required: true },
    cvData: { type: Buffer, required: true },
    status: { type: String, enum: ["new", "reviewed"], default: "new" },
  },
  { collection: "applications", timestamps: true },
);

export const ApplicationModel =
  (models.Application as mongoose.Model<ApplicationRecord> | undefined) ??
  model<ApplicationRecord>("Application", applicationSchema);
