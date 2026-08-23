# Local dev gotchas (k8s on this WSL2 host)

Terse notes for debugging "blogs not showing up" style breakage. See
`README.md` for normal setup.

## Architecture

Everything runs in Kubernetes — MicroK8s on Linux, Colima with Kubernetes on
macOS. Both local dev and the release build happen in the cluster, so there is
only ever one way the apps are wired together.

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

## Gotcha 2: `localhost:30001` hangs from Node, but curl "works"

`kubectl port-forward` binds both `127.0.0.1` and `[::1]`, but IPv4
loopback connections just hang on this host (`curl -4` hangs too — not
Node-specific). Plain `curl localhost:...` "works" only because curl prefers
IPv6, masking it.

**Symptom**: build/dev produce an empty blog list, no error.

**Don't work around it — don't build on the host.** Chasing this with
`http://[::1]:30001` or the node IP in `apps/portfolio/.env` is how the
original bug shipped: the failure is silent, so a build that never reached the
API still *succeeds*, just with no blog posts baked in. Build in the pod
instead (below), where there is no host↔cluster hop to get wrong.

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

```bash
cd apps/portfolio && npm run build
PROJECT_ROOT=$(pwd)/../.. plz run //apps/portfolio:local_static  # omit PROJECT_ROOT from repo root
```

Deploys nginx (release `portfolio-static`, NodePort `30002`) serving
`apps/portfolio/build/` — `values.local-static.yaml` + `nginx.conf`. The
custom nginx conf adds `try_files $uri $uri.html $uri/index.html =404`
because plain nginx doesn't replicate GitHub Pages' clean-URL resolution
(`/blog/1` → `blog/1.html`); without it every route but `/` 404s. hostPath
mount — no redeploy needed after rebuilding.

## The export/deploy build: inside the cluster, not the host

This is the only supported way to produce a publishable build. `kubectl exec`
into the running `portfolio` pod and build there: it already has
`BLOGS_API_URL=http://blogs` (in-cluster DNS, always reliable) and is
hostPath-mounted to `apps/portfolio`, so output appears on the host with no
`kubectl cp`.

```bash
kubectl exec -n mrsauravsahu-dev deploy/portfolio -- sh -c \
  'cd /app && npm run export && d=build-$(date +%s) && mv build "$d" && \
   chown -R $(stat -c "%u:%g" .) "$d" && echo "OUT_DIR=$d"'
```

- Container runs as root → output would be undeletable by you without the
  `chown` (uses `/app`'s host-owning uid:gid).
- Timestamped `build-<epoch>/` (gitignored via `build-*`) so runs don't
  clobber each other. `gh-pages` expects a plain `build/` — rename, or point
  `gh-pages -d` at the timestamped dir. See the README's publish step; don't
  use `npm run deploy`/`deploy.sh`, which rebuild on the host.
- Spot-check without touching k8s: `npx http-server apps/portfolio/build-<epoch> -p 8080`.
  Doesn't replicate clean-URL routing though — use `:local_static` for that.

## Gotcha 5: `~/.kube/config` points at a dead endpoint; cluster is on :16443

`~/.kube/config` targets `https://127.0.0.1:6443`, but the actual microk8s
API server listens on `https://<node-ip>:16443` (`ss -tlnp | grep 16443`).
So plain `kubectl`/`helm`/`plz` fail with `connection refused` on 6443 while
`microk8s kubectl get nodes` works fine. `multipass list` is empty — there is
no VM; the cluster is **host microk8s on this WSL2 box**, and the `:6443`
entry is stale.

**Non-destructive fix** (don't overwrite `~/.kube/config`): point tooling at a
generated config via env only —

```bash
microk8s config > /tmp/mk8s.kubeconfig
export KUBECONFIG=/tmp/mk8s.kubeconfig
# now plz/helm/kubectl reach the cluster; deploy per README, then:
# helm uninstall -n mrsauravsahu-dev blogs data-store portfolio portfolio-static
```

`plz run //apps/<app>:local` still needs `PROJECT_ROOT=<repo-root>` and
`PROJECT_NAME=mrsauravsahu` exported (helm `--set helpers.PROJECT_ROOT`, ns
`${PROJECT_NAME}-dev`).
