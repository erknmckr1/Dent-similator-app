import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "procvonbywnmzpuhmlan.supabase.co",
      },
    ],
  },
};

export default nextConfig;
