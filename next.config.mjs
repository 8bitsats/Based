/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'basedchesh.nyc3.cdn.digitaloceanspaces.com',
        pathname: '/graphics/**',
      },
      {
        protocol: 'https',
        hostname: 'grindao.nyc3.cdn.digitaloceanspaces.com',
        pathname: '/Art/**',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'v2.fal.media',
        pathname: '/files/**',
      }
    ],
  },
};

export default nextConfig;
