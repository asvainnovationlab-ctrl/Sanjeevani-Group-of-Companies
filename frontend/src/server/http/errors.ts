import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Errors that are safe to show to the caller. Anything else becomes a generic
// 500 so stack traces and internals never reach the browser.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "error",
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message, "bad_request");
export const unauthorized = (message = "Sign in to continue.") => new HttpError(401, message, "unauthorized");
export const forbidden = (message = "You do not have permission to do that.") => new HttpError(403, message, "forbidden");
export const notFound = (message = "Not found.") => new HttpError(404, message, "not_found");
export const conflict = (message: string) => new HttpError(409, message, "conflict");
export const tooManyRequests = (message = "Too many attempts. Please wait a few minutes and try again.") =>
  new HttpError(429, message, "rate_limited");

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return NextResponse.json(
      { error: { code: "validation", message: first?.message ?? "Invalid input.", fields: error.flatten().fieldErrors } },
      { status: 400 },
    );
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Database unavailable:", error.errorCode ?? error.message.split("\n")[0]);
    return NextResponse.json(
      { error: { code: "unavailable", message: "The service is temporarily unavailable. Please try again shortly." } },
      { status: 503 },
    );
  }
  console.error("Unhandled API error:", error instanceof Error ? error.message : error);
  return NextResponse.json({ error: { code: "server_error", message: "Something went wrong. Please try again." } }, { status: 500 });
}

// Wraps a route handler so thrown HttpErrors / ZodErrors become JSON responses.
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw badRequest("The request body must be valid JSON.");
  }
}
