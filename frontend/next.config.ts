import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/submit", destination: "/teacher/submit", permanent: false },
      { source: "/my-shifts", destination: "/teacher/my-shifts", permanent: false },
    ];
  },
};

export default nextConfig;
