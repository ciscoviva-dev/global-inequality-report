import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['duckdb'],
  outputFileTracingIncludes: {
    '/': ['./data/wid.duckdb'],
    '/summary': ['./data/wid.duckdb'],
  },
};

export default nextConfig;
