#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Install Libre Arcade from the latest GitHub Release.
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/linkingtechnologies/libre-arcade/main/packaging/linux/install.sh | bash
#   wget -qO- https://raw.githubusercontent.com/linkingtechnologies/libre-arcade/main/packaging/linux/install.sh | bash
set -euo pipefail

REPO="linkingtechnologies/libre-arcade"
PKG="libre-arcade"

# Resolve latest release tag via GitHub API (no authentication needed).
TAG=$(curl -sf "https://api.github.com/repos/${REPO}/releases/latest" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['tag_name'])")
VERSION="${TAG#v}"
DEB="${PKG}_${VERSION}_all.deb"
URL="https://github.com/${REPO}/releases/download/${TAG}/${DEB}"
SUMS_URL="https://github.com/${REPO}/releases/download/${TAG}/SHA256SUMS"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "Libre Arcade ${VERSION}"
echo "Downloading..."
curl -fL "$URL"      -o "$TMP/$DEB"
curl -fL "$SUMS_URL" -o "$TMP/SHA256SUMS"

echo "Verifying checksum..."
(cd "$TMP" && sha256sum --check --ignore-missing SHA256SUMS)

echo "Installing (requires sudo)..."
sudo apt install "$TMP/$DEB"

echo ""
echo "Done. Launch with:  libre-arcade"
