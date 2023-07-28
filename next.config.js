/* eslint-disable */
const path = require("path");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  reactStrictMode: false,
  sassOptions: {
    includePaths: [path.join(__dirname, "./src/assets/scss")],
  },
  images: {
    domains: [
      "ordinals.com",
      "d2v3k2do8kym1f.cloudfront.net",
      "https://ordinals.com",
      "https://explorer-signet.openordex.org",
    ],
    unoptimized: true,
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // eslint-disable-next-line no-param-reassign
    (config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    }),
      (config.ignoreWarnings = [
        {
          message:
            /(magic-sdk|@walletconnect\/web3-provider|@web3auth\/web3auth)/,
        },
      ]);
    return config;
  },
  env: {
    IS_TESTNET: process.env.IS_TESTNET || false,
  },
});

// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");
const nextConfig = {
  hideSourceMaps: true,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
};
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,

  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: "deezy-io",
  project: "deezy-place",
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
