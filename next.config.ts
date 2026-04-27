import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Localhost demo: Laravel serves uploads at http://localhost:8000/storage/...,
    // which Next 16's image optimizer refuses to fetch (private-IP SSRF guard).
    // Disable the optimizer entirely so <Image> passes URLs straight through.
    // Revisit before any non-local deployment.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
