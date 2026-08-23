#!/usr/bin/env bash
set -euo pipefail

# Build the static site inside the portfolio pod and copy it back to the host.
#
# The build bakes blog posts into the HTML at build time, so it needs to reach
# the blogs API. In the pod that's in-cluster DNS (BLOGS_API_URL=http://blogs)
# and always works; from the host it crosses the host↔cluster boundary, and
# when that fails it fails *silently* — the export succeeds, just with an empty
# blog. So the build only ever runs in the cluster.
#
# Usage: ./build-site.sh [output-dir]
#        defaults to build-<epoch>, which .gitignore already covers via build-*

NAMESPACE="${NAMESPACE:-mrsauravsahu-dev}"
DEPLOY="${DEPLOY:-portfolio}"
OUT_DIR="${1:-build-$(date +%s)}"

if ! command -v kubectl >/dev/null 2>&1; then
	echo "error: kubectl not found." >&2
	exit 1
fi

if ! kubectl get "deploy/$DEPLOY" -n "$NAMESPACE" >/dev/null 2>&1; then
	echo "error: deploy/$DEPLOY not found in namespace $NAMESPACE." >&2
	echo "       Is the cluster up and the stack deployed? See README (local dev)." >&2
	exit 1
fi

if [ -e "$OUT_DIR" ]; then
	echo "error: '$OUT_DIR' already exists — refusing to overwrite it." >&2
	exit 1
fi

echo "waiting for deploy/$DEPLOY to be ready…"
kubectl rollout status "deploy/$DEPLOY" -n "$NAMESPACE" --timeout=180s

# Pick a pod from the *current* ReplicaSet only. During a rollout the old pod
# still carries the same app label while it terminates, and picking it means
# building the source the deployment just moved away from — which produces a
# clean, plausible, wrong build.
HASH="$(kubectl get rs -n "$NAMESPACE" -l "app.kubernetes.io/name=$DEPLOY" \
	--sort-by=.metadata.creationTimestamp \
	-o jsonpath='{.items[-1:].metadata.labels.pod-template-hash}' 2>/dev/null || true)"

SELECTOR="app.kubernetes.io/name=$DEPLOY"
[ -n "$HASH" ] && SELECTOR="$SELECTOR,pod-template-hash=$HASH"

POD="$(kubectl get pod -n "$NAMESPACE" -l "$SELECTOR" \
	--field-selector=status.phase=Running \
	-o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
if [ -z "$POD" ]; then
	echo "error: no running pod for deploy/$DEPLOY in $NAMESPACE." >&2
	exit 1
fi

# The pod builds whatever its hostPath mount points at, which is the PROJECT_ROOT
# it was deployed with — not wherever you happen to run this from. Those can
# differ (a worktree deployed the stack, then you run this from the main
# checkout), and the output would land here looking like a build of this source
# while actually being a build of that one. Publishing the wrong branch is not a
# mistake that announces itself, so check rather than trust.
MOUNTED="$(kubectl get "pod/$POD" -n "$NAMESPACE" \
	-o jsonpath='{.spec.volumes[?(@.name=="code")].hostPath.path}' 2>/dev/null || true)"
HERE="$(pwd -P)"
if [ -n "$MOUNTED" ] && [ "$(readlink -f "$MOUNTED")" != "$HERE" ]; then
	echo "error: the pod builds a different source tree than this one." >&2
	echo "       pod mounts: $MOUNTED" >&2
	echo "       running in: $HERE" >&2
	echo "       Redeploy against this tree, from its repo root:" >&2
	echo "         PROJECT_ROOT=\$(pwd) plz run //apps/portfolio:local" >&2
	exit 1
fi

echo "building in pod $POD"

# Build to a scratch dir inside the pod so a failed run can't leave a partial
# tree where the previous good one was.
REMOTE_DIR="/tmp/site-build-$$"
kubectl exec -n "$NAMESPACE" "$POD" -- sh -c "
	set -e
	cd /app
	rm -rf build '$REMOTE_DIR'
	npm run export
	mv build '$REMOTE_DIR'
"

echo "copying $POD:$REMOTE_DIR → $OUT_DIR"
kubectl cp -n "$NAMESPACE" "$POD:$REMOTE_DIR" "$OUT_DIR"
kubectl exec -n "$NAMESPACE" "$POD" -- rm -rf "$REMOTE_DIR"

# The pod runs as root, so anything it wrote through a mount would otherwise be
# undeletable here. kubectl cp writes as the local user, but normalise anyway.
chmod -R u+w "$OUT_DIR" 2>/dev/null || true

if [ ! -s "$OUT_DIR/index.html" ]; then
	echo "error: no index.html in '$OUT_DIR' — the copy didn't land." >&2
	exit 1
fi

# Same two checks deploy.sh makes, reported here where the rebuild is cheap.
[ -s "$OUT_DIR/CNAME" ] || echo "warning: '$OUT_DIR/CNAME' missing — deploy.sh will refuse this build." >&2
[ -e "$OUT_DIR/blog.html" ] || echo "warning: no blog.html — the build rendered no blog posts." >&2

echo
echo "built: $OUT_DIR"
echo "publish with: ./deploy.sh $OUT_DIR"
