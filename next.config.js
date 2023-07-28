/* eslint-disable */
const path = require("path");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
// import { Wasm as WasmIntegration } from "@sentry/wasm";

const t = {
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
};

// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");
const nextConfig = {
  sentry: {
    disableServerWebpackPlugin: true,
    disableClientWebpackPlugin: true,
  },
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

module.exports = withSentryConfig(t, sentryWebpackPluginOptions);
