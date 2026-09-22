import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Ensures the Aiven CA certificate (read at runtime by src/lib/prisma.ts
  // for production TLS verification) is actually present in Vercel's
  // serverless function output, since it's a non-code asset that Next's
  // automatic file tracing wouldn't otherwise discover.
  outputFileTracingIncludes: {
    "/*": ["./certs/aiven-ca.pem"],
  },
};

export default nextConfig;
