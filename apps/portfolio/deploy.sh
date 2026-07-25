#!/usr/bin/env bash
set -euo pipefail

# The custom domain lives in static/CNAME (tracked) and is copied into build/
# by adapter-static. Do NOT write build/CNAME here: gh-pages force-pushes and
# removes anything missing from build/, so a hardcoded or absent CNAME silently
# repoints or drops the live domain and takes the site down.
npm run build

if [ ! -s build/CNAME ]; then
	echo "error: build/CNAME missing or empty — expected it from static/CNAME." >&2
	echo "       Refusing to deploy; this would drop the custom domain." >&2
	exit 1
fi

echo "deploying to $(cat build/CNAME)"

touch build/.nojekyll
rm -f build/.DS_Store

npx gh-pages -d ./build -b gh-pages -t -f
