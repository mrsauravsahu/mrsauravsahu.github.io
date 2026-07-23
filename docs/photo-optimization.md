# Photo optimization (homepage photo dump)

Terse notes on the build-time image pipeline. See `README.md` for setup.

## Why

Originals in `apps/data-store/photos/` (symlinked to
`apps/portfolio/static/photos/`) are ~4000px Galaxy phone shots, 1.2–8.3 MB
each, **~82 MB total**. The homepage photo dump (`src/routes/+page.svelte`)
used to point both the grid thumbnails **and** the modal at those originals,
all eager — so opening `/` downloaded ~82 MB. Tiles render at ~200–320px and
the modal never exceeds ~800px, so originals were ~50× oversized.

## Pipeline

- `scripts/optimize-photos.js` (runs first in `npm run build`, via the
  `optimize:photos` script) reads `static/photos/*.{jpg,jpeg,png}` and writes
  WebP derivatives to `static/photos-opt/`:
  - `thumb/<name>.webp` — width 640, q72 (grid)
  - `full/<name>.webp`  — width 1600, q80 (modal)
  - Sizes are 2× on-screen max for HiDPI.
- Idempotent: a derivative is re-encoded only when its source is newer (mtime).
- `static/photos-opt/` is **gitignored** — generated, regenerated each build.
- `+page.server.ts` emits `thumb`/`full` URLs per photo; `filename` (original)
  is kept only as an `on:error` fallback so the grid still works in
  `npm run dev` (dev skips the optimizer).
- Grid `<img>` uses `thumb` + `loading="lazy"` + `decoding="async"`; modal uses
  `full`. Result: gallery download ~0.8 MB (lazy) vs 82 MB. No visual change.

## Gotcha: sharp across node versions (host vs pod)

`node_modules` is hostPath-shared: the host runs node 20, the in-cluster
portfolio pod runs node 24. sharp uses N-API (ABI-stable), so the same
`node_modules/sharp` binary loads under both — no rebuild needed when building
in-pod (`kubectl exec … npm run build`). Only the platform must match (both
linux-x64 here).

## Gotcha: EXIF orientation must be baked in

Several originals carry an EXIF orientation tag (e.g. a 4000×2252 landscape
file that displays as 2252×4000 portrait, orientation "upper-right"). Browsers
auto-orient JPEGs from that tag; re-encoding to WebP drops it. `sharp` must
call `.rotate()` (no args) to bake the rotation into the pixels first, or those
photos come out sideways. Verify a known-rotated one, e.g.
`20260421_200511` → derivative should be portrait (640×1137), not landscape.

## Gotcha: originals still ship to gh-pages (dead weight, not a load cost)

`adapter-static` copies all of `static/`, so the 82 MB of originals still land
in `build/photos/` and on the `gh-pages` branch. The browser never fetches
them (nothing references `/photos/*.jpg`), so **page load is unaffected** — but
the deploy carries dead weight. Removing it means restructuring the
`static/photos` symlink; left as-is on purpose. If you prune them, drop the
`on:error` → original fallback in `+page.svelte` first.

## Verifying image changes without the blogs API

A full `npm run build` hard-fails without a reachable blogs GraphQL API (empty
blog list → prerender crawl fails; see `local-dev-gotchas.md` Gotcha 4) — this
is unrelated to images. To verify the image path alone, either point
`BLOGS_API_URL` at a running blogs service, or temporarily add
`handleUnseenRoutes: 'ignore'` to `prerender` in `svelte.config.js`, build,
then revert. Measure real download bytes: serve `build/` (`python3 -m
http.server`) and sum the `/photos-opt/thumb/*.webp` responses.

## Verifying via the real k8s export path (prod parity)

The faithful check — exercises live blogs prerender + nginx clean-URL serving
(see `local-dev-gotchas.md` for cluster access + the in-cluster build):

```bash
# stack deployed, KUBECONFIG/PROJECT_ROOT/PROJECT_NAME exported:
kubectl exec -n mrsauravsahu-dev deploy/portfolio -- sh -c 'cd /app && npm run build'
kubectl exec -n mrsauravsahu-dev deploy/portfolio -- sh -c 'chown -R 1000:1000 /app/build'
plz run //apps/portfolio:local_static            # nginx, NodePort 30002
# curl http://<node-ip>:30002/ , /blog/1 , and the /photos-opt/thumb/*.webp
```

Confirmed here: gallery = 14 WebP thumbs, **0.81 MB total** (`image/webp`),
vs 82 MB of originals when they were referenced. Originals stay reachable at
`/photos/*.jpg` (~8 MB each) but no HTML references them, so browsers skip
them. In-cluster build produces **root-owned `build/`** — chown back (as above)
or it's undeletable from the host.
