import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { ApplicationModel } from "@/lib/application-model";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// The list of applications, newest first, without the CV files themselves.
export async function GET() {
  if (!isAdminAuthenticated()) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (!process.env.MONGODB_URI) return NextResponse.json({ message: "MongoDB is not configured." }, { status: 503 });

  try {
    await connectToDatabase();
    const data = await ApplicationModel.find()
      .sort({ createdAt: -1 })
      .select("-cvData")
      .limit(500)
      .lean();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Could not load job applications:", error);
    return NextResponse.json({ message: "Could not load applications." }, { status: 503 });
  }
}
