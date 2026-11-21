import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Almost every page depends on the signed-in member, so pages render per request.
  cacheComponents: false,
  experimental: {
    serverActions: {
      // Payment screenshots are capped at 2 MB in lib/validation.ts; leave room for form overhead.
      bodySizeLimit: "2.5mb",
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
