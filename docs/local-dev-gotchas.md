# Local dev gotchas (k3d)

Terse notes for debugging "blogs not showing up" style breakage. See
`README.md` for normal setup.

## Architecture

Everything runs in Kubernetes, via k3d on both Linux and macOS. Both local dev
and the release build happen in the cluster, so there is only ever one way the
apps are wired together. See the README for the cluster-create, which has to
mount the repo and publish the NodePorts up front.

- `apps/portfolio` — SvelteKit + `adapter-static`. Prod (GitHub Pages) is a
  static export: blog data is fetched once at build time and baked into
  HTML. No runtime server, no re-fetch.
- `apps/blogs` — .NET 8 / HotChocolate GraphQL. Data source is CSV files in
  `apps/data-store/data`, not a real DB.
- `apps/data-store` — static file server for photos + the blogs CSVs.
- Local dev = all three in `mrsauravsahu-dev` k8s ns via
  `plz run //apps/<app>:local` (hostPath-mounted source, live reload).

## Gotcha 1: blogs pod crash-loops forever after any restart

No persistent volume for `~/.nuget/packages`. Every pod restart wipes the
container, so ~40 NuGet packages must re-download before the API can even
compile; one timeout resets the whole restore. No liveness probe in
`LOCAL_DEVELOPMENT`, so `kubectl get pods` shows `1/1 Running` throughout —
looks healthy, isn't.

**Fix**: `values.local.yaml` mounts `apps/blogs/.nuget-cache/` (hostPath) at
`/root/.nuget/packages`. Survives restarts.

**Check**: `kubectl logs -n mrsauravsahu-dev -l app.kubernetes.io/name=blogs`
— repeated `TimeoutException` = still restoring.

## Gotcha 2: never build the site on the host

The build bakes blog posts into the HTML at build time, so it needs the blogs
API. A build run on the host has to reach it across the host↔cluster boundary,
and when that fails it **fails silently**: urql resolves rather than throws
(Gotcha 3), so the export succeeds with an empty blog and looks fine until it's
live.

**So don't.** Build in the pod with `apps/portfolio/build-site.sh`, where
`BLOGS_API_URL=http://blogs` is in-cluster DNS and there is no boundary to get
wrong. `deploy.sh` refuses a build with no `blog.html` as a last line of
defence.

## Gotcha 3: urql swallows network/GraphQL errors

`.toPromise()` resolves (doesn't reject) on network/GraphQL errors — puts
them in `result.error` instead of throwing. The `try/catch` around blog
queries in `+page.server.ts` / `blog/[page]/+page.server.ts` never fired for
this, so failures were 100% silent (empty blog list, no log line).

**Fix**: both `load` functions now do `if (response.error) throw response.error`.

## Gotcha 4: empty blog list = hard build failure

`/blog/posts/[blogId]` prerenders by crawling links on already-rendered
pages (no `entries()`). Zero blog posts → zero links → `npm run build`
hard-fails ("routes marked prerenderable but not found while crawling").
Good: turns gotcha 2/3's silent failures loud. Bad: no `build/` output at
all when it happens, not a stale one.

## Verify the real prod code path: `:local_static`

`plz run //apps/portfolio:local` runs `npm run dev` — re-fetches per
request, doesn't exercise the build-time prerender path prod actually uses.
Can look fine locally while the real static export is broken.

It serves `apps/portfolio/build/`, so point that at a build from the pod rather
than making one on the host (Gotcha 2):

```bash
cd apps/portfolio
./build-site.sh && mv build-<epoch> build
PROJECT_ROOT=$(pwd)/../.. plz run //apps/portfolio:local_static  # omit PROJECT_ROOT from repo root
```

Deploys nginx (release `portfolio-static`, NodePort `30002`) serving
`apps/portfolio/build/` — `values.local-static.yaml` + `nginx.conf`. The
custom nginx conf adds `try_files $uri $uri.html $uri/index.html =404`
because plain nginx doesn't replicate GitHub Pages' clean-URL resolution
(`/blog/1` → `blog/1.html`); without it every route but `/` 404s. hostPath
mount — no redeploy needed after rebuilding.

## The export/deploy build: inside the cluster, not the host

This is the only supported way to produce a publishable build. `apps/portfolio/build-site.sh`
runs `npm run export` inside the `portfolio` pod — which has
`BLOGS_API_URL=http://blogs` (in-cluster DNS, always reliable) — and `kubectl cp`s
the result back to the host.

```bash
cd apps/portfolio && ./build-site.sh      # prints the build-<epoch> dir it wrote
./deploy.sh build-<epoch>                 # checks, then publishes to gh-pages
```

- Timestamped `build-<epoch>/` (gitignored via `build-*`) so runs don't clobber
  each other. The pod builds to a scratch dir and copies only on success.
- `deploy.sh` never builds. It takes a directory and verifies it before pushing:
  `index.html`, a non-empty `CNAME`, and `blog.html` — the last catches the
  Gotcha 2 failure, where a build that never reached the API publishes an empty
  blog.
- Spot-check without touching k8s: `npx http-server apps/portfolio/build-<epoch> -p 8080`.
  Doesn't replicate clean-URL routing though — use `:local_static` for that.

## Gotcha 5: point tooling at the k3d kubeconfig

`~/.kube/config` on this box still targets an old, dead endpoint, so plain
`kubectl`/`helm`/`plz` fail with `connection refused` against it. Don't
overwrite it — export the k3d one for the shell instead:

```bash
export KUBECONFIG="$(k3d kubeconfig write mrss)"
```

`plz run //apps/<app>:local` still needs `PROJECT_ROOT=<repo-root>` and
`PROJECT_NAME=mrsauravsahu` exported (helm `--set helpers.PROJECT_ROOT`, ns
`${PROJECT_NAME}-dev`).
