import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The old /harry address still works and lands on the AI Lead page.
    return [{ source: "/harry", destination: "/ai-lead", permanent: true }];
  },
};

export default nextConfig;
