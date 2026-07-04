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

The portfolio uses `@sveltejs/adapter-static`. Photos are managed in `apps/data-store/photos/` and copied into `apps/portfolio/static/photos/` as part of the build via a `prebuild` npm script.

### export
```bash
cd apps/portfolio
npm run export
# builds to apps/portfolio/build/
# writes CNAME and .nojekyll automatically
```

### deploy to GitHub Pages
```bash
cd apps/portfolio
npm run deploy
# runs export then pushes build/ to the gh-pages branch
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

- **portfolio** → `http://<node-ip>:30000`
- **blogs API** → `http://<node-ip>:30001`

Get node IP:
```bash
kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}'
```

For WSL, use port-forward instead:
```bash
kubectl port-forward -n mrsauravsahu-dev svc/portfolio-svc 3000:80
```

### cleanup
```bash
helm uninstall -n mrsauravsahu-dev blogs data-store portfolio
kubectl delete namespace mrsauravsahu-dev
```
