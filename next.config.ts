import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Ignora erros de lint no deploy
  },
};

export default nextConfig;
