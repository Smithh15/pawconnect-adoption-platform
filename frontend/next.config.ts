import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'placedog.net',
      },
      {
        protocol: 'https',
        hostname: 'cataas.com',
      },
    ],
  },
};

export default nextConfig;
