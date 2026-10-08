import { NextResponse } from "next/server";
import { BusinessModel, ensureInitialBusinesses } from "@/lib/business-model";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json(
      { message: "MongoDB is not configured. Add MONGODB_URI to frontend/.env.local." },
      { status: 503 },
    );
  }

  try {
    await connectToDatabase();
    await ensureInitialBusinesses();
    const directory = await BusinessModel.find({ published: true })
      .sort({ order: 1, name: 1 })
      .select("name category sector description website location published order")
      .lean();

    return NextResponse.json({ data: directory });
  } catch (error) {
    console.error("Could not load the MongoDB business directory:", error);
    return NextResponse.json(
      { message: "Could not connect to the Sanjeevani business directory in MongoDB." },
      { status: 503 },
    );
  }
}
