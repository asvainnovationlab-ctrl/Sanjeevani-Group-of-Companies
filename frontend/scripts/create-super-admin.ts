// Creates the first Super Administrator (or resets an existing admin's
// password and makes them Super Administrator). Run once after the first
// migration and seed:
//
//   npm run admin:create -- --email you@example.com --name "Your Name"
//
// The password is asked for on the terminal (not echoed). For automated
// setups it can come from the SUPER_ADMIN_PASSWORD environment variable
// instead; it is never accepted as a command-line argument, which would end
// up in shell history.

import { PrismaClient } from "@prisma/client";
import { createInterface } from "node:readline";
import { hashPassword, passwordProblem } from "../src/server/auth/password";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (text: string) => void; output: NodeJS.WriteStream };
    let prompted = false;
    output._writeToOutput = (text: string) => {
      if (!prompted) {
        output.output.write(text);
        prompted = true;
      }
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
    console.error('Usage: npm run admin:create -- --email you@example.com --name "Your Name"');
    process.exit(1);
  }

  let password = process.env.SUPER_ADMIN_PASSWORD;
  if (!password) {
    password = await askHidden("Password (min 12 characters): ");
    const again = await askHidden("Repeat password: ");
    if (password !== again) throw new Error("The passwords do not match.");
  }
  const problem = passwordProblem(password, email);
  if (problem) throw new Error(problem);

  const prisma = new PrismaClient();
  try {
    const role = await prisma.role.findUnique({ where: { key: "SUPER_ADMIN" } });
    if (!role) throw new Error("The SUPER_ADMIN role does not exist yet. Run `npm run db:seed` first.");

    const passwordHash = await hashPassword(password);
    const now = new Date();
    const user = await prisma.$transaction(async (tx) => {
      const saved = await tx.user.upsert({
        where: { email },
        create: { email, name, passwordHash, status: "ACTIVE", passwordChangedAt: now, emailVerifiedAt: now },
        update: { name, passwordHash, status: "ACTIVE", passwordChangedAt: now, failedLoginCount: 0, lockedUntil: null },
      });
      const existing = await tx.membership.findFirst({ where: { userId: saved.id, roleId: role.id, companyId: null } });
      if (!existing) await tx.membership.create({ data: { userId: saved.id, roleId: role.id, companyId: null } });
      await tx.session.updateMany({ where: { userId: saved.id, revokedAt: null }, data: { revokedAt: now } });
      await tx.auditLog.create({
        data: { actorId: saved.id, action: "user.bootstrap_super_admin", entityType: "User", entityId: saved.id, metadata: { via: "cli" } },
      });
      return saved;
    });
    console.log(`Super Administrator ready: ${user.email}. Sign in at /admin.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
