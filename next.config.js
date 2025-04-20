const withPWA = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const crypto = require('crypto');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    domains: ['localhost', '127.0.0.1'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['*']
    },
    optimizeCss: false, // Disabled to avoid critters issue
  },
  poweredByHeader: false,
  compress: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.devtool = false;
    }
    return config;
  }
}

module.exports = withPWA(nextConfig)

