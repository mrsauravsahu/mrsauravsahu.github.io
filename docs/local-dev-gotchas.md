# Local dev gotchas (k8s on this WSL2 host)

Terse notes for humans and agents debugging "blogs not showing up" or similar
local-dev breakage. See `README.md` for the normal setup steps.

## Architecture recap

- `apps/portfolio` — SvelteKit, built with `@sveltejs/adapter-static`. Production
  (GitHub Pages) is a **static export**: blog data is fetched once at
  `npm run build` time via GraphQL and baked into the HTML. There is no
  server at runtime. If the blogs API is unreachable *during the build*, the
  shipped site silently has no blog posts — nothing fails loudly.
- `apps/blogs` — .NET 8 / HotChocolate GraphQL API. Reads blog content from
  CSV-backed "database" files in `apps/data-store/data` (`Blog.csv`, per-post
  folders). No real database.
- `apps/data-store` — static file server for photos, and the CSV data blogs
  reads from.
- Local dev runs all three in the `mrsauravsahu-dev` k8s namespace via
  `plz run //apps/<app>:local` (hostPath-mounted source, live reload).

## Gotcha 1: blogs pod crash-loops forever after any restart (no NuGet cache)

`apps/blogs` runs via `dotnet watch run` inside `mcr.microsoft.com/dotnet/sdk:8.0`
with **no persistent volume for `~/.nuget/packages`**. Every pod restart
(node reboot, WSL restart, `dotnet watch` hot-reload restart) wipes the
container filesystem, so the *entire* NuGet dependency tree (~40 packages,
some via HotChocolate) must be re-downloaded from nuget.org before the API
can even compile. Under load this reliably times out on at least one large
package, and `dotnet watch` retries the whole restore from scratch — the pod
can stay in this loop indefinitely. No liveness/readiness probes are defined
in `LOCAL_DEVELOPMENT` mode, so `kubectl get pods` shows `1/1 Running` the
whole time, hiding the problem.

**Fix applied**: `apps/blogs/k8s/values.local.yaml` now mounts a persistent
hostPath volume at `/root/.nuget/packages` (`apps/blogs/.nuget-cache/`,
gitignored). After the first successful restore, packages survive pod
restarts and only new/changed packages need the network.

**To check if this is happening**: `kubectl logs -n mrsauravsahu-dev -l
app.kubernetes.io/name=blogs` — repeated `TimeoutException` /
`FindPackagesByIdAsync` retries mean it's still restoring.

## Gotcha 2: `localhost:30001` silently fails from Node, but curl "works"

On this WSL2 host, `kubectl port-forward svc/blogs 30001:80` binds both
`127.0.0.1` and `[::1]`, but connections to the IPv4 loopback
(`127.0.0.1`/`localhost` when it resolves to v4) hang and time out — this
reproduces with plain `curl -4` too, so it's not Node-specific. `curl
localhost:30001` "works" because curl happens to prefer the IPv6 address,
masking the problem.

**Symptom**: `npm run build`/`npm run dev` produce an empty blog list with
no error, even though "the API is clearly up" per curl.

**Workarounds** (pick one):
- Point `BLOGS_API_URL` / `VITE_BLOGS_BASE_URL` in `apps/portfolio/.env` at
  `http://[::1]:30001` instead of `http://localhost:30001`.
- Or skip port-forward entirely and hit the NodePort directly via the node's
  real interface IP: `http://<node-internal-ip>:30001` (`kubectl get nodes
  -o wide`). This is what the `:local_static` target below uses implicitly
  by running the build with blogs reachable however you've configured it.

## Gotcha 3: urql swallows network/GraphQL errors — failures are silent

`@urql/core`'s `.toPromise()` **resolves** (doesn't reject) on network
errors and GraphQL errors; it puts them in `result.error` instead of
throwing. The blog-fetching `load` functions in
`apps/portfolio/src/routes/+page.server.ts` and
`.../blog/[page]/+page.server.ts` wrapped the query in `try/catch` expecting
exceptions — which never fired for this failure mode, so `console.warn
('Could not fetch blogs from API', e)` never printed and the build produced
an empty (but "successful") blog list with zero diagnostic trace.

**Fix applied**: both `load` functions now check `response.error` explicitly
and `throw` it so the existing catch/log path actually fires.

## Gotcha 4: prerender crawl fails hard if the blog list is empty

`svelte.config.js` prerenders `/blog/posts/[blogId]` by *crawling links*
found in already-rendered pages (no `entries()` export). If the blog list
pages render with zero posts (e.g. because of gotcha 2 or 3), there are no
`<a href="/blog/posts/...">` links to discover, and the whole
`npm run build` **hard-fails** with "routes marked as prerenderable but were
not found while crawling". This is actually useful — it turns the two silent
bugs above into a loud build failure — but it means a bad build produces
*no* `build/` output at all, not a stale one.

## Verifying the actual production code path locally: `:local_static`

The normal `plz run //apps/portfolio:local` target runs `npm run dev`, which
re-fetches blogs on every request — it does **not** exercise the
build-time-prerender path that production (GitHub Pages) actually uses, so
it can look fine locally while the real static export is broken.

To test the real path:

```bash
cd apps/portfolio
npm run build        # writes apps/portfolio/build/, needs blogs API reachable
PROJECT_ROOT=$(pwd)/../.. plz run //apps/portfolio:local_static   # from a worktree; omit PROJECT_ROOT from repo root
```

This deploys a second, independent release (`portfolio-static`, NodePort
`30002`) that serves `apps/portfolio/build/` via nginx —
`apps/portfolio/k8s/values.local-static.yaml` +
`apps/portfolio/k8s/nginx.conf`. The custom nginx config adds
`try_files $uri $uri.html $uri/index.html =404;` because plain nginx does
**not** replicate GitHub Pages' automatic clean-URL resolution
(`/blog/1` → `blog/1.html`) — without it every route except `/` 404s even
on a correct build.

Rerun `npm run build` + re-run the target whenever you want to check a fresh
build; the pod picks up the new `build/` directory on the next request (no
redeploy needed, it's a hostPath mount).

## Running the real export/deploy build: do it inside the cluster, not on the host

Gotcha 2's `[::1]`/node-IP workarounds are fragile and easy to forget (that's
literally how the original "blogs not showing" bug shipped). The reliable
fix: don't build on the host at all — `kubectl exec` into the already-running
`portfolio` dev pod and run the export there. Inside the cluster,
`BLOGS_API_URL=http://blogs` (in-cluster Service DNS, set by
`values.local.yaml`) always resolves correctly — no localhost/NodePort/WSL2
networking involved.

```bash
kubectl exec -n mrsauravsahu-dev deploy/portfolio -- sh -c \
  'cd /app && npm run export && d=build-$(date +%s) && mv build "$d" && \
   chown -R $(stat -c "%u:%g" .) "$d" && echo "OUT_DIR=$d"'
```

Notes:
- `/app` is hostPath-mounted straight to `apps/portfolio` on the host, so the
  output directory appears on the host with **no `kubectl cp` needed** — the
  mount is bidirectional.
- The container runs as root, so output would otherwise land root-owned and
  undeletable by your host user; the `chown` step (using `/app`'s owning
  uid:gid, since that's bind-mounted from the host) fixes that.
- Output goes to a fresh `build-<unix-epoch>/` each run (gitignored via
  `build-*`) instead of overwriting `build/`, so you can compare/keep runs.
  `npm run deploy`/`gh-pages` still expects a plain `build/` dir — rename
  before deploying, or point `gh-pages -d` at the timestamped dir directly.

**Quick spot-check** without deploying `:local_static` to k8s at all:

```bash
npx http-server apps/portfolio/build-<epoch> -p 8080
```

Then open `localhost:8080`. Good enough for eyeballing blog cards/content;
use the `:local_static` nginx target instead if you need to verify
clean-URL routing (`/blog/1` vs `/blog/1.html`), since `http-server` doesn't
replicate GitHub Pages' extension-less URL resolution either.
