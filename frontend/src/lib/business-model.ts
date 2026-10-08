import mongoose, { Schema, model, models } from "mongoose";
import { businesses as initialBusinesses } from "@/data/businesses";

export type BusinessRecord = {
  name: string;
  category: string;
  sector: string;
  description: string;
  website: string;
  location: string;
  published: boolean;
  order: number;
};

const businessSchema = new Schema<BusinessRecord>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["healthcare", "education", "agriculture", "other"],
    },
    sector: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    website: { type: String, default: "" },
    location: { type: String, default: "", trim: true },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { collection: "businesses", timestamps: true },
);

businessSchema.index({ name: 1 }, { unique: true });

type BusinessSeedState = { _id: string; completedAt: Date };
const seedStateSchema = new Schema<BusinessSeedState>(
  {
    _id: { type: String, required: true },
    completedAt: { type: Date, required: true },
  },
  { collection: "app_settings", versionKey: false },
);

export const BusinessModel =
  (models.BusinessDirectory as mongoose.Model<BusinessRecord> | undefined) ??
  model<BusinessRecord>("BusinessDirectory", businessSchema);

const BusinessSeedStateModel =
  (models.BusinessSeedState as mongoose.Model<BusinessSeedState> | undefined) ??
  model<BusinessSeedState>("BusinessSeedState", seedStateSchema);

export async function ensureInitialBusinesses() {
  const seedId = "initial-businesses-v1";
  if (await BusinessSeedStateModel.exists({ _id: seedId })) return;
  if (await BusinessModel.exists({})) {
    await BusinessSeedStateModel.updateOne(
      { _id: seedId },
      { $setOnInsert: { completedAt: new Date() } },
      { upsert: true },
    );
    return;
  }

  for (const business of initialBusinesses) {
    const {
      name,
      category,
      sector,
      description,
      website,
      location,
      published,
      order,
    } = business;
    await BusinessModel.updateOne(
      { name },
      { $setOnInsert: { name, category, sector, description, website, location, published, order } },
      { upsert: true },
    );
    if (location) {
      await BusinessModel.updateOne(
        { name, $or: [{ location: { $exists: false } }, { location: "" }] },
        { $set: { location } },
      );
    }
  }
  await BusinessSeedStateModel.updateOne(
    { _id: seedId },
    { $setOnInsert: { completedAt: new Date() } },
    { upsert: true },
  );
}
