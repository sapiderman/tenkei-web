/** @type {import('next').NextConfig} */
const nextConfig = {
  // Check if we are building inside our Docker/CI environment
  // If true, use 'standalone'. Otherwise, fall back to the default behavior (undefined)
  output: process.env.STANDALONE_BUILD === "true" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "asset.tenkeiaikidojo.org",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN", // Allows embedding only from your own domain
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://asset.tenkeiaikidojo.org; frame-src https://challenges.cloudflare.com; connect-src 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
