import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
      {
        protocol: "https",
        hostname: "sgp.cloud.appwrite.io",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["http://localhost:3000"],
      bodySizeLimit: "50MB"
    },
  },
};

export default nextConfig;
