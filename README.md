# mrsauravsahu.github.io

Personal site monorepo: `apps/portfolio` (SvelteKit → GitHub Pages), `apps/blogs` (.NET GraphQL API), `apps/data-store` (photos + blog CSVs).

## local dev (k3d)

Deps: [plz](https://please.build/), [helm](https://helm.sh/), [k3d](https://k3d.io/) — on macOS its Docker comes from [Colima](https://github.com/abiosoft/colima). Local dev *and* the release build both run in the cluster.

k3d's node is itself a container, so the repo must be mounted at the **same absolute path** it has on the host — the charts build `hostPath` from `PROJECT_ROOT`, which would otherwise point at nothing — and NodePorts must be published at creation:

```bash
REPO=$(git rev-parse --show-toplevel)
k3d cluster create mrss --volume "$REPO:$REPO@all" \
  -p "30000:30000@server:0" -p "30001:30001@server:0" -p "30002:30002@server:0"
export KUBECONFIG="$(k3d kubeconfig write mrss)"

. ./template.envrc
plz run //apps/blogs:local && plz run //apps/data-store:local && plz run //apps/portfolio:local
```

Mount the repo root, not a worktree — then `PROJECT_ROOT=$(pwd) plz run //apps/portfolio:local` deploys from `w/<name>` without recreating the cluster. Adding a port later does need a new one.

portfolio → `localhost:30000`, blogs → `:30001`, `:local_static` nginx → `:30002`. Blogs takes minutes to answer on first start while NuGet restores, reporting `Running` throughout ([Gotcha 1](docs/local-dev-gotchas.md)).

## build — in the pod, only

The build bakes every blog post into static HTML. A host build must cross the host↔cluster boundary, and when that fails it fails *silently*: a successful export with an empty blog. The pod has in-cluster DNS instead.

```bash
cd apps/portfolio && ./build-site.sh          # npm run build:site
```

Builds in the pod, `kubectl cp`s back, prints a timestamped `build-<epoch>/`. Copies only on success, so a failed run can't replace a good build. Override `NAMESPACE=` / `DEPLOY=`. Photos are symlinked from `apps/data-store/photos/` and downsized to WebP ([docs](docs/photo-optimization.md)).

## publish

```bash
./deploy.sh build-<epoch>                     # npm run deploy -- build-<epoch>
```

Takes a directory, never builds. Refuses anything missing `index.html`, a non-empty `CNAME`, or `blog.html` — the last catches that empty-blog build before it goes live. Needs SSH push access to `origin`.

## the domain

It lives **only** in `apps/portfolio/static/CNAME` (tracked); `adapter-static` copies it into the build. Never write `build/CNAME`: `gh-pages` force-pushes with `--remove`, so a hardcoded one silently repoints the live domain and a missing one deletes it outright.

Live: `mrsauravsahu.in` — apex `A` records to `185.199.108–111.153`, `www` a CNAME to the apex. Verify with `git show origin/gh-pages:CNAME`.

## cleanup

```bash
helm uninstall -n mrsauravsahu-dev blogs data-store portfolio
k3d cluster delete mrss
```