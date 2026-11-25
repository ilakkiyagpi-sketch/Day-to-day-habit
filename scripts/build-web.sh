#!/usr/bin/env bash
# Builds the installable web version (PWA) for GitHub Pages into ./dist.
# Supabase keys are read from EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY if set;
# without them the site runs in demo mode.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
npx expo export --platform web --output-dir dist
cp dist/index.html dist/404.html   # GitHub Pages: deep links (e.g. /today) load the app
touch dist/.nojekyll               # GitHub Pages: serve the _expo/ folder
echo "Web build ready in dist/"
