#!/usr/bin/env bash
# Build the Android app (Trusted Web Activity) for Google Play in one go.
#
#   script/android/build.sh            # init on first run, then build
#   script/android/build.sh --update   # after changing twa-manifest.json (version, colours, icon)
#
# Needs: Node 18+, and a network that can reach dl.google.com (Bubblewrap downloads JDK 17 and the
# Android SDK into ~/.bubblewrap on first use). Run from any directory; paths are resolved from the repo.
# Outputs land in android/: app-release-bundle.aab (upload to Play) and app-release-signed.apk (sideload).
#
# The signing key android/android.keystore is created on first run if missing. KEEP IT AND BOTH PASSWORDS:
# losing the key means the app can never be updated. It is git-ignored (*.keystore).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$ROOT/android"
MANIFEST="$ROOT/twa-manifest.json"
KEYSTORE="$OUT/android.keystore"
ALIAS="gravitylab"
MODE="${1:-build}"

mkdir -p "$OUT"
cd "$OUT"

if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "Installing @bubblewrap/cli…"
  npm i -g @bubblewrap/cli
fi

# Keystore: created once, never committed.
if [ ! -f "$KEYSTORE" ]; then
  echo
  echo "No signing key yet. Creating $KEYSTORE (alias $ALIAS)."
  echo "You will be asked for a keystore password and a key password: write both down now."
  read -r -s -p "Keystore password: " KS_PASS; echo
  read -r -s -p "Key password (Enter = same): " KEY_PASS; echo
  KEY_PASS="${KEY_PASS:-$KS_PASS}"
  keytool -genkey -v -keystore "$KEYSTORE" -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KS_PASS" -keypass "$KEY_PASS" \
    -dname "CN=Gravity Lab, OU=School of Economics, O=Can Tho University, L=Can Tho, C=VN"
  echo
  echo "SHA-256 of the upload key (add it to /.well-known/assetlinks.json for sideloaded APKs):"
  keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "$KS_PASS" | grep -i "SHA256:"
fi

# twa-manifest.json lives at the repo root; Bubblewrap wants it in the project directory.
if [ ! -f "$OUT/twa-manifest.json" ] || [ "$MANIFEST" -nt "$OUT/twa-manifest.json" ]; then
  cp "$MANIFEST" "$OUT/twa-manifest.json"
fi

if [ "$MODE" = "--update" ]; then
  bubblewrap update --skipVersionUpgrade
fi

if [ ! -d "$OUT/app" ]; then
  echo "First build: bubblewrap init (answer the prompts; the defaults come from twa-manifest.json)."
  bubblewrap init --manifest "https://thuyhuongctu.github.io/Gravity-Lab/manifest.webmanifest" --directory "$OUT"
fi

bubblewrap build

echo
echo "Done."
echo "  Upload:   $OUT/app-release-bundle.aab   (Play Console → Testing → Closed testing)"
echo "  Sideload: $OUT/app-release-signed.apk   (adb install)"
echo "Then copy the Play App Signing SHA-256 into thuyhuongctu.github.io/.well-known/assetlinks.json (see ANDROID.md §3)."
