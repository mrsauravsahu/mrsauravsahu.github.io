#!/usr/bin/env bash
set -euo pipefail

# Publish an already-built site to the gh-pages branch.
#
# This script does not build. The build has to happen inside the portfolio pod
# — a build on the host reaches the blogs API across the host↔cluster boundary,
# and when that fails it fails silently, producing a perfectly successful export
# with no blog posts in it. Use build-site.sh, then hand the directory it
# reports to this script.
#
# Usage: ./deploy.sh <build-dir>

usage() {
	echo "usage: $0 <build-dir>" >&2
	echo "  e.g. $0 build-1740000000   (see ./build-site.sh)" >&2
	exit 2
}

[ $# -eq 1 ] || usage
BUILD_DIR="${1%/}"

if [ ! -d "$BUILD_DIR" ]; then
	echo "error: '$BUILD_DIR' is not a directory." >&2
	exit 1
fi

if [ ! -s "$BUILD_DIR/index.html" ]; then
	echo "error: '$BUILD_DIR/index.html' missing or empty — that isn't a built site." >&2
	exit 1
fi

# The custom domain lives in static/CNAME (tracked) and is copied into the build
# by adapter-static. gh-pages force-pushes and removes anything missing from the
# directory it publishes, so an absent CNAME doesn't just skip the domain — it
# deletes it from the branch and takes the live site down.
if [ ! -s "$BUILD_DIR/CNAME" ]; then
	echo "error: '$BUILD_DIR/CNAME' missing or empty — expected it from static/CNAME." >&2
	echo "       Refusing to deploy; this would drop the custom domain." >&2
	exit 1
fi

# A build that reached no blogs API still exports cleanly, just with an empty
# blog. Catching it here is the last chance before it's live.
if [ ! -e "$BUILD_DIR/blog.html" ]; then
	echo "error: '$BUILD_DIR/blog.html' missing — the build didn't render the blog." >&2
	echo "       Refusing to deploy; rebuild with ./build-site.sh." >&2
	exit 1
fi

echo "publishing '$BUILD_DIR' to $(cat "$BUILD_DIR/CNAME")"

touch "$BUILD_DIR/.nojekyll"
rm -f "$BUILD_DIR/.DS_Store"

npx gh-pages -d "$BUILD_DIR" -b gh-pages -t -f
