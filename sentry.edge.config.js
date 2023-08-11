// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import env from "./env-variables.json";

Sentry.init({
  dsn: "https://1b2decb65870413bb10959f3eb1d227b@o4505546397712384.ingest.sentry.io/4505546453811200",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: env?.SENTRY_ENVIRONMENT || "local",
});
