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
        ],
      },
    ];
  },
};

export default nextConfig;
