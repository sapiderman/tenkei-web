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
};

export default nextConfig;
