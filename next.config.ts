import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.cocohappii.com",
      },
      {
        protocol: "https",
        hostname: "cocohappii.com",
      },
    ],
  },
};

export default nextConfig;
