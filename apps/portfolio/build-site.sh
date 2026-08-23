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

POD="$(kubectl get pod -n "$NAMESPACE" -l "app.kubernetes.io/name=$DEPLOY" \
	-o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
if [ -z "$POD" ]; then
	# Fall back to whatever the deployment's own selector matches.
	SELECTOR="$(kubectl get "deploy/$DEPLOY" -n "$NAMESPACE" \
		-o jsonpath='{.spec.selector.matchLabels}' | tr -d '{}"' | tr ',' '\n' | paste -sd, -)"
	POD="$(kubectl get pod -n "$NAMESPACE" -l "$SELECTOR" \
		-o jsonpath='{.items[0].metadata.name}')"
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
