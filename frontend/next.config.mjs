/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next-build",
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
