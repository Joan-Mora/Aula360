import type { NextConfig } from "next";
import path from "path";

const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd()),
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  serverExternalPackages: [
    "@prisma/client",
    "pdfkit",
    "exceljs",
    "@node-rs/argon2",
    "cloudinary",
  ],
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
    ];
    if (process.env.NODE_ENV === "production") {
      security.push({ key: "Content-Security-Policy", value: csp });
    }
    return [{ source: "/:path*", headers: security }];
  },
};

export default nextConfig;
