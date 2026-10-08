import { NextResponse } from "next/server";
import { BusinessModel, ensureInitialBusinesses } from "@/lib/business-model";
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

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export async function GET() {
  const unauthorized = authorizationError();
  if (unauthorized) return unauthorized;

  try {
    await connectToDatabase();
    await ensureInitialBusinesses();
    const businesses = await BusinessModel.find({})
      .sort({ order: 1, name: 1 })
      .select("name category sector description website location published order")
      .lean();
    return NextResponse.json({ data: businesses });
  } catch (error) {
    console.error("Could not load the admin business directory:", error);
    return NextResponse.json({ message: "Could not load the business directory." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const unauthorized = authorizationError();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Enter valid business details." }, { status: 400 });
  }

  const validated = validateBusinessInput(body);
  if (!validated.success) {
    return NextResponse.json({ message: validated.message }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const business = await BusinessModel.create(validated.data);
    return NextResponse.json({ data: business.toObject() }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ message: "A business with that name already exists." }, { status: 409 });
    }
    console.error("Could not create a directory business:", error);
    return NextResponse.json({ message: "Could not save the business." }, { status: 503 });
  }
}
