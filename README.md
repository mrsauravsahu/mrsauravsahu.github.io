# mrsauravsahu.github.io

Personal site monorepo — portfolio, blogs API, and data-store.

## structure

```
apps/
  portfolio/    # SvelteKit static site (GitHub Pages)
  blogs/        # .NET blogs API
  data-store/   # photos and other static assets
```

---

## portfolio — static export & deploy

The portfolio uses `@sveltejs/adapter-static`. Photos are managed in `apps/data-store/photos/` and symlinked into `apps/portfolio/static/photos/`. At build time they are downsized to WebP derivatives under `static/photos-opt/` (grid + modal); the site never serves the multi-MB originals — see [`docs/photo-optimization.md`](docs/photo-optimization.md).

### the build runs in the cluster, not on your machine

**Builds run inside the `portfolio` pod. That is the only supported way.**

The build is not self-contained: it fetches every blog post over the network
and bakes the results into static HTML, so it needs a reachable blogs API and
hard-fails without one (zero posts → zero links to crawl → prerender error;
see [`docs/local-dev-gotchas.md`](docs/local-dev-gotchas.md) Gotcha 4). Host
builds have to reach that API across the host↔cluster boundary, which is where
they go wrong — quietly, in the case that matters, because a build that can't
see the API produces a *successful* export with no blog posts in it.

The pod has `BLOGS_API_URL=http://blogs` (in-cluster DNS), so it sidesteps host
networking entirely. Bring the stack up under [local dev](#local-dev-kubernetes)
first, then:

```bash
cd apps/portfolio
./build-site.sh                 # or: npm run build:site
```

It builds in the pod, `kubectl cp`s the result back to the host, and prints the
directory it wrote. That's a timestamped `build-<epoch>/` by default (gitignored
via `build-*`) so runs never clobber each other; pass a name to choose your own.
The pod builds to a scratch directory and the copy only happens on success, so a
failed run can't leave a half-built tree where a good one was.

Override the target with `NAMESPACE=` / `DEPLOY=` if you're not on the defaults
(`mrsauravsahu-dev` / `portfolio`).

### publish to GitHub Pages

`deploy.sh` takes the directory to publish and does not build — pass it what
`build-site.sh` printed. Requires SSH push access to `origin`.

```bash
./deploy.sh build-<epoch>       # or: npm run deploy -- build-<epoch>
```

Before pushing it checks the directory is a real site (`index.html`), that
`CNAME` is present and non-empty, and that `blog.html` exists — the last one
catches the silent failure above, where a build that never reached the blogs API
would otherwise publish the site with an empty blog.

### the deploy domain comes from the CNAME file

**The custom domain is `apps/portfolio/static/CNAME` (tracked). Deploy scripts
must never write `build/CNAME` — change the domain by editing that one file.**

`adapter-static` copies `static/CNAME` into `build/`, so the domain travels with
the build. This matters because `gh-pages` force-pushes with `--remove`: it
deletes anything on `gh-pages` that is missing from `build/`. So a hardcoded
`build/CNAME` silently repoints the live domain, and a *missing* one deletes it
outright — either way GitHub Pages stops serving the site.

`deploy.sh` therefore hard-fails if the build's `CNAME` is absent or empty
rather than publishing something that would drop the domain, and echoes the
target domain before pushing.

To verify what is actually live:

```bash
git fetch origin gh-pages
git show origin/gh-pages:CNAME    # mrsauravsahu.in
```

`npm run export` no longer writes `build/CNAME` itself — it used to hardcode the
domain, which is the exact footgun described above. The tracked `static/CNAME` is
now the only place the domain is written down.

The live domain right now is `mrsauravsahu.in`, served from apex `A` records
pointing at GitHub's `185.199.108–111.153`, with `www` a `CNAME` to the apex.

---

## local dev (kubernetes)

### deps

- [please.build](https://please.build/) (`plz`)
- [helm](https://helm.sh/)
- A running k8s cluster with `~/.kube/config` configured:
  - **Linux** — [MicroK8s](https://microk8s.io/) (`microk8s start`). See
    [`docs/local-dev-gotchas.md`](docs/local-dev-gotchas.md) Gotcha 5: the
    checked-in kubeconfig points at a dead endpoint on this box.
  - **macOS** — [Colima](https://github.com/abiosoft/colima) with Kubernetes
    enabled (`colima start --kubernetes`), which brings the container runtime
    with it.

Everything runs in the cluster — the apps locally, and the release build. There
is no separate local-only stack to keep in step with it.

### inject env vars
```bash
. ./template.envrc
```

### deploy to kubernetes
Deploys to the `mrsauravsahu-dev` namespace using helm:
```bash
plz run //apps/blogs:local
plz run //apps/data-store:local
plz run //apps/portfolio:local
```

### deploy a worktree to kubernetes
When working in a git worktree, pass `PROJECT_ROOT` explicitly so helm resolves paths from the worktree directory:
```bash
PROJECT_ROOT=$(pwd) plz run //apps/portfolio:local
```

### access the app

Port-forward the services to localhost:
```bash
kubectl port-forward -n mrsauravsahu-dev svc/portfolio 3000:80
kubectl port-forward -n mrsauravsahu-dev svc/blogs 30001:80
```

- **portfolio** → `http://localhost:3000`
- **blogs API** → `http://localhost:30001`

### cleanup
```bash
helm uninstall -n mrsauravsahu-dev blogs data-store portfolio
kubectl delete namespace mrsauravsahu-dev
```
