import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@hometik/shared-types'],
  experimental: {
    cpus: 1,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
