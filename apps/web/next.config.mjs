/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['deku-scraper'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.dekudeals.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dekudeals.com',
      },
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
      },
    ],
  },
};

export default nextConfig;
