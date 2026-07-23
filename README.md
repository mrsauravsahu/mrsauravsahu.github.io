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

### deploy to GitHub Pages
```bash
cd apps/portfolio
npm run deploy            # runs export (build) then pushes build/ to gh-pages
# export writes CNAME (mrsauravsahu.in) + .nojekyll; deploy force-pushes to the gh-pages branch
```

**The build fetches blog data at build time** (baked into static HTML), so a
reachable blogs GraphQL API is required or the build hard-fails (empty blog
list → prerender crawl error; see [`docs/local-dev-gotchas.md`](docs/local-dev-gotchas.md) Gotcha 4).
Point `apps/portfolio/.env` at it:

```bash
# Local k8s: use the node IP + NodePort, NOT localhost — host→cluster loopback
# hangs on this box (docs/local-dev-gotchas.md Gotcha 2). Get the node IP with
# `kubectl get nodes -o wide`; blogs is NodePort 30001.
echo 'BLOGS_API_URL=http://<node-ip>:30001' > apps/portfolio/.env
```

Alternatively, build the export **inside** the portfolio pod (it has
`BLOGS_API_URL=http://blogs`), which sidesteps host networking entirely — see
`docs/local-dev-gotchas.md`. Requires push access to `origin` (SSH) for the
`gh-pages` branch.

---

## local dev (kubernetes)

### deps

- [please.build](https://please.build/) (`plz`)
- [helm](https://helm.sh/)
- A running k8s cluster (e.g. [MicroK8S](https://microk8s.io/)) with `~/.kube/config` configured

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
