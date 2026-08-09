import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/strategy", destination: "/", permanent: false },
      { source: "/portfolio", destination: "/", permanent: false },
      { source: "/home2", destination: "/", permanent: false },
      { source: "/operating-platform", destination: "/", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
