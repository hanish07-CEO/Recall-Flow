// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure lucide-react icons are transpiled correctly for server runtime
  transpilePackages: ['lucide-react'],
};
module.exports = nextConfig;
