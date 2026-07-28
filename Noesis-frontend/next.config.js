/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // tighten to your storage/CDN domain(s) before production
    ],
  },
  async rewrites() {
    let backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:5005";
    
    // Ensure the backendUrl starts with http://, https://, or / to prevent Next.js build crash
    if (!backendUrl.startsWith("http://") && !backendUrl.startsWith("https://") && !backendUrl.startsWith("/")) {
      backendUrl = `http://${backendUrl}`;
    }
    
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
