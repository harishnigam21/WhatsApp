// next.config.mjs or next.config.js
/** @type {import('next').NextConfig} */
const nextConfig: import("next").NextConfig = {
  experimental: {
    agentUpgrade: false,
  },
  devIndicators: false,
  reactStrictMode: false, // Prevents useEffect from running twice in dev mode
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
