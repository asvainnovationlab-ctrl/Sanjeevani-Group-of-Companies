import { NextResponse } from "next/server";
import {
  clearAdminSession,
  createAdminSession,
  hasAdminConfiguration,
  isAdminAuthenticated,
  isValidAdminPassword,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasAdminConfiguration()) {
    return NextResponse.json({ message: "Admin access is not configured on this server." }, { status: 503 });
  }
  const authenticated = isAdminAuthenticated();
  return NextResponse.json({ authenticated }, { status: authenticated ? 200 : 401 });
}

export async function POST(request: Request) {
  if (!hasAdminConfiguration()) {
    return NextResponse.json({ message: "Admin access is not configured on this server." }, { status: 503 });
  }

  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return NextResponse.json({ message: "Enter your admin password." }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length > 1024 || !isValidAdminPassword(body.password)) {
    return NextResponse.json({ message: "The password is incorrect." }, { status: 401 });
  }

  createAdminSession();
  return NextResponse.json({ authenticated: true });
}

export async function DELETE() {
  clearAdminSession();
  return NextResponse.json({ authenticated: false });
}
