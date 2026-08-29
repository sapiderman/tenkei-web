/** @type {import('next').NextConfig} */
const nextConfig = {
  // Check if we are building inside our Docker/CI environment
  // If true, use 'standalone'. Otherwise, fall back to the default behavior (undefined)
  output: process.env.STANDALONE_BUILD === "true" ? "standalone" : undefined,
  // Pin Turbopack's workspace root to this repo. A stray yarn.lock in the home
  // directory otherwise makes Turbopack infer the wrong root, which breaks
  // module resolution and can emit a broken proxy bundle
  // ("TypeError: adapterFn is not a function").
  turbopack: {
    root: import.meta.dirname,
  },
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
