import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

// Load NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath) && !process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) {
  const content = readFileSync(envPath, "utf-8");
  const match = content.match(/^NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=(.+)$/m);
  if (match) process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY = match[1].trim().replace(/^['"]|['"]$/g, "");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/node-fetch\/lib\/index\.js/ },
      { module: /node_modules\/punycode\/punycode\.js/ },
      /Serializing big strings.+impacts deserialization performance/,
    ];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placecats.com",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
