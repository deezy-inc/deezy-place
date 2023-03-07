const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ordinals.com',
        port: '',
        pathname: '/content/**',
      },
    ],
  },
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    config.plugins.push(new NodePolyfillPlugin())
    return {
      ...config,
      experiments: {
        layers: true,
        asyncWebAssembly: true
      },
    }
  },
}

module.exports = nextConfig
