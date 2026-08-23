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

The pod already has `BLOGS_API_URL=http://blogs` (in-cluster DNS) and is
hostPath-mounted to `apps/portfolio`, so it sidesteps host networking entirely
and the output lands on your disk with no copying. Set the cluster up under
[local dev](#local-dev-kubernetes) first, then:

```bash
kubectl exec -n mrsauravsahu-dev deploy/portfolio -- sh -c \
  'cd /app && npm run export && d=build-$(date +%s) && mv build "$d" && \
   chown -R $(stat -c "%u:%g" .) "$d" && echo "OUT_DIR=$d"'
```

- The container runs as root, so the `chown` is what keeps the output
  deletable by you afterwards.
- Output is a timestamped `build-<epoch>/` (gitignored via `build-*`) so runs
  don't clobber each other.

### publish to GitHub Pages

Publishing pushes the directory the pod produced, and nothing else. Requires
SSH push access to `origin`.

```bash
cd apps/portfolio
mv build-<epoch> build

# Never publish without this check — see the CNAME section below.
[ -s build/CNAME ] || { echo "build/CNAME missing — would drop the domain"; exit 1; }
echo "deploying to $(cat build/CNAME)"

npx gh-pages -d ./build -b gh-pages -t -f
```

**Don't use `npm run deploy` or `deploy.sh` as they stand.** Both run
`npm run build` on the host first, which is exactly the unreliable path this
section exists to avoid — and it would silently overwrite the pod's build with
a host one before pushing. They need that build step dropped before they can be
the publish command again.

### the deploy domain comes from the CNAME file

**The custom domain is `apps/portfolio/static/CNAME` (tracked). Deploy scripts
must never write `build/CNAME` — change the domain by editing that one file.**

`adapter-static` copies `static/CNAME` into `build/`, so the domain travels with
the build. This matters because `gh-pages` force-pushes with `--remove`: it
deletes anything on `gh-pages` that is missing from `build/`. So a hardcoded
`build/CNAME` silently repoints the live domain, and a *missing* one deletes it
outright — either way GitHub Pages stops serving the site.

That is what the check in the publish step above is guarding against: it
refuses to push a build with no `build/CNAME` rather than take the site down.
`deploy.sh` carries the same check (alongside the host build that makes it
unusable as-is).

To verify what is actually live:

```bash
git fetch origin gh-pages
git show origin/gh-pages:CNAME    # mrsauravsahu.in
```

Note `npm run export` still writes `build/CNAME` itself with the same value —
redundant now that `static/CNAME` is tracked, but harmless as long as the two
agree. Keep them in sync if you change the domain.

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
