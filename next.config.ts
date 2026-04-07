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
  turbopack: {
    root: process.cwd(),
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/node-fetch\/lib\/index\.js/ },
      { module: /node_modules\/punycode\/punycode\.js/ },
    ];
    
    // Silence PackFileCacheStrategy warning
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'error',
    };

    // react-pdf: prevent Node.js canvas module from being bundled client-side
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        canvas: false,
      },
    };
    
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    qualities: [55, 60, 75],
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
      // Static assets: immutable, 1-year cache
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Optimized images: 24-hour browser cache
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
