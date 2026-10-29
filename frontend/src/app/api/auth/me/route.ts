import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/guard";
import { handle } from "@/server/http/errors";

export const dynamic = "force-dynamic";

// The signed-in user and what they may do, for the admin UI to decide which
// sections to show. The server still checks every action independently.
export const GET = handle(async () => {
  const user = await requireUser();
  const permissions = Object.fromEntries(
    [...user.access.grants].map(([key, grant]) => [key, grant === "all" ? "all" : [...grant]]),
  );
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    roles: user.access.roles,
    permissions,
  });
});
