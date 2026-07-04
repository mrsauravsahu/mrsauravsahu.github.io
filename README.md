# mrsauravsahu.github.io

Personal site monorepo — portfolio, blogs API, and data-store — built with [please.build](https://please.build/).

## deps

- [please.build](https://please.build/) (`plz`)
- [helm](https://helm.sh/) (for k8s deploys)
- A running k8s cluster (e.g. [MicroK8S](https://microk8s.io/) on Linux) with `~/.kube/config` configured

---

## local dev

### inject env vars
```bash
. ./template.envrc
```

### build
```bash
plz build //apps/...
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

### cleanup
```bash
helm uninstall -n mrsauravsahu-dev blogs data-store portfolio
kubectl delete namespace mrsauravsahu-dev
```
