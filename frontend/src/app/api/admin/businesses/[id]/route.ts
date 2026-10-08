import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { BusinessModel } from "@/lib/business-model";
import { connectToDatabase } from "@/lib/mongodb";
import { hasAdminConfiguration, isAdminAuthenticated } from "@/lib/admin-session";
import { validateBusinessInput } from "@/lib/business-validation";

export const dynamic = "force-dynamic";

function authorizationError() {
  if (!hasAdminConfiguration()) {
    return NextResponse.json({ message: "Admin access is not configured on this server." }, { status: 503 });
  }
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "Sign in to manage the business directory." }, { status: 401 });
  }
  return null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const unauthorized = authorizationError();
  if (unauthorized) return unauthorized;
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ message: "Business not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Enter valid business details." }, { status: 400 });
  }

  const validated = validateBusinessInput(body, true);
  if (!validated.success) {
    return NextResponse.json({ message: validated.message }, { status: 400 });
  }
  if (Object.keys(validated.data).length === 0) {
    return NextResponse.json({ message: "Include at least one field to update." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const business = await BusinessModel.findByIdAndUpdate(
      params.id,
      { $set: validated.data },
      { new: true, runValidators: true },
    ).lean();
    if (!business) return NextResponse.json({ message: "Business not found." }, { status: 404 });
    return NextResponse.json({ data: business });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "A business with that name already exists." }, { status: 409 });
    }
    console.error("Could not update a directory business:", error);
    return NextResponse.json({ message: "Could not update the business." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const unauthorized = authorizationError();
  if (unauthorized) return unauthorized;
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ message: "Business not found." }, { status: 404 });
  }

  try {
    await connectToDatabase();
    const business = await BusinessModel.findByIdAndDelete(params.id).lean();
    if (!business) return NextResponse.json({ message: "Business not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Could not delete a directory business:", error);
    return NextResponse.json({ message: "Could not delete the business." }, { status: 503 });
  }
}
