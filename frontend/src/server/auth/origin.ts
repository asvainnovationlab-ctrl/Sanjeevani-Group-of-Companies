// Pure same-origin check (CSRF defence for cookie-authenticated writes).
// Browsers send Origin on cross-site POST/PUT/PATCH/DELETE, so a mismatch is
// rejected; without Origin, a cross-site Fetch-Metadata header is rejected.
// SameSite=strict cookies are the second layer.
export function isSameOrigin(headers: Headers, allowedOrigins: string[] = []): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin) {
    const site = headers.get("sec-fetch-site");
    return !site || site === "same-origin" || site === "none";
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  if (host && originHost === host) return true;
  return allowedOrigins.some((allowed) => {
    try {
      return new URL(allowed).host === originHost;
    } catch {
      return false;
    }
  });
}
