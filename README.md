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

The portfolio uses `@sveltejs/adapter-static`. Photos are managed in `apps/data-store/photos/` and symlinked into `apps/portfolio/static/photos/`.

### deploy to GitHub Pages
```bash
cd apps/portfolio
npm run deploy
# builds, writes CNAME + .nojekyll, then pushes to the gh-pages branch
```

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
