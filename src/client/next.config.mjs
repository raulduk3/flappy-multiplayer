/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    externalDir: true,
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (cfg) => {
    // Allow importing shared ESM files with explicit .js extension in source while
    // resolving to TypeScript when available. This keeps NodeNext (.js) happy on server
    // and Next happy on client without duplicating files.
    cfg.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return cfg;
  },
};

export default config;
