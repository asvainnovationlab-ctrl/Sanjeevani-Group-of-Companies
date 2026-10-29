// Baseline security headers for every response. A full Content-Security-Policy
// needs testing against the embedded YouTube / Facebook content and is added
// once the admin UI is in place (Phase 7).
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const privateHeaders = [
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next-build",
  poweredByHeader: false,
  experimental: {
    // Native password-hashing module: load it from node_modules at runtime
    // instead of bundling it.
    serverComponentsExternalPackages: ["@node-rs/argon2"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Admin pages and auth APIs must never be cached or indexed.
      ...["/admin/:path*", "/api/auth/:path*", "/api/admin/:path*"].map((source) => ({ source, headers: privateHeaders })),
    ];
  },
  async redirects() {
    return [
      { source: "/media", destination: "/newsroom", permanent: true },
      { source: "/news", destination: "/newsroom", permanent: true },
      { source: "/press-release", destination: "/newsroom#press-releases", permanent: true },
      { source: "/events", destination: "/newsroom#events", permanent: true },
    ];
  },
};

export default nextConfig;
