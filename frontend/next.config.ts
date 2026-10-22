// next.config.mjs or next.config.js
/** @type {import('next').NextConfig} */
const nextConfig: import("next").NextConfig = {
  devIndicators: false,
  reactStrictMode: false, // Prevents useEffect from running twice in dev mode
  output: "standalone",
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
