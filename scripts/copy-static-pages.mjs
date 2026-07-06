// Copies the prerendered static page HTML into the Cloudflare assets
// directory so they are served directly by the assets layer (CDN) instead of
// going through the worker. Dynamic shell routes (e.g. /inscription/[slug])
// stay with the worker, which serves their shells.
import { cpSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";

const SRC = ".next/server/pages";
const DEST = ".open-next/assets";

const copyHtml = (dir) => {
  for (const entry of readdirSync(join(SRC, dir))) {
    const rel = join(dir, entry);
    const abs = join(SRC, rel);
    if (statSync(abs).isDirectory()) {
      copyHtml(rel);
    } else if (entry.endsWith(".html") && !rel.includes("[")) {
      const dest = join(DEST, rel);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(abs, dest);
      console.log(`copied ${rel}`);
    }
  }
};

copyHtml("");

// The dynamic routes are prerendered client-side shells; expose them as
// assets so the worker can serve them without ever rendering a page
const SHELLS = [
  ["inscription/[slug].html", "_shells/inscription.html"],
  ["output/[output].html", "_shells/output.html"],
  ["collection/[slug].html", "_shells/collection.html"],
];
for (const [src, dest] of SHELLS) {
  mkdirSync(dirname(join(DEST, dest)), { recursive: true });
  cpSync(join(SRC, src), join(DEST, dest));
  console.log(`copied shell ${src} -> ${dest}`);
}
