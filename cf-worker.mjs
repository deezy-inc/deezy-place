// Custom entry point wrapping the OpenNext worker: dynamic detail routes are
// client-side shells, so serve their prerendered HTML straight from the
// assets layer instead of letting Next attempt a server render (which the
// workers runtime cannot do for this app). Everything else falls through to
// the OpenNext handler.
import openNextWorker from "./.open-next/worker.js";

const SHELL_ROUTES = ["inscription", "output", "collection"];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Canonical host: redirect www to the apex domain
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    const [, first, second] = url.pathname.split("/");
    if (request.method === "GET" && second && SHELL_ROUTES.includes(first)) {
      const shellUrl = new URL(`/_shells/${first}.html`, url.origin);
      const response = await env.ASSETS.fetch(new Request(shellUrl, { method: "GET" }));
      if (response.ok) {
        return new Response(response.body, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    }
    // Serve static assets (all page HTML and _next files) directly; needed
    // when run_worker_first routes every request through this worker
    if (request.method === "GET" || request.method === "HEAD") {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }
    const response = await openNextWorker.fetch(request, env, ctx);
    // This app has no server-rendered routes, so a 500 on a GET page request
    // means Next attempted a render it cannot do here (e.g. the 404 page);
    // serve the prerendered 404 instead
    if (request.method === "GET" && response.status === 500) {
      const notFound = await env.ASSETS.fetch(
        new Request(new URL("/404.html", url.origin), { method: "GET" }),
      );
      if (notFound.ok) {
        return new Response(notFound.body, {
          status: 404,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    }
    return response;
  },
};
