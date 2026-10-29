import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { ApplicationModel } from "@/lib/application-model";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// GET downloads the applicant's CV; PATCH marks the application reviewed or new.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (!mongoose.isValidObjectId(params.id)) return NextResponse.json({ message: "Application not found." }, { status: 404 });

  try {
    await connectToDatabase();
    const application = await ApplicationModel.findById(params.id).select("cvData cvFileName cvMimeType").lean();
    if (!application) return NextResponse.json({ message: "Application not found." }, { status: 404 });
    const data = Buffer.from(application.cvData.buffer ?? application.cvData);
    return new NextResponse(data, {
      headers: {
        "Content-Type": application.cvMimeType,
        "Content-Disposition": `attachment; filename="${application.cvFileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not load a CV:", error);
    return NextResponse.json({ message: "Could not load the CV." }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (!mongoose.isValidObjectId(params.id)) return NextResponse.json({ message: "Application not found." }, { status: 404 });

  let body: { status?: unknown };
  try {
    body = (await request.json()) as { status?: unknown };
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  if (body.status !== "new" && body.status !== "reviewed") return NextResponse.json({ message: "Invalid status." }, { status: 400 });

  try {
    await connectToDatabase();
    const updated = await ApplicationModel.findByIdAndUpdate(params.id, { status: body.status }, { new: true }).select("-cvData").lean();
    if (!updated) return NextResponse.json({ message: "Application not found." }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Could not update an application:", error);
    return NextResponse.json({ message: "Could not update the application." }, { status: 503 });
  }
}
