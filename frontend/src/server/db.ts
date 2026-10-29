import { PrismaClient } from "@prisma/client";

// One PrismaClient per server process. In development Next.js reloads modules
// on every change, so the client is cached on globalThis to avoid exhausting
// database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
