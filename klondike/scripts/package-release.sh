#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Umberto Bresciani
# SPDX-License-Identifier: GPL-3.0-or-later

set -euo pipefail

cd "$(dirname "$0")/.."

release_version="$(node -p "require('./package.json').version")"
release_name="grugnettos-klondike-${release_version}"
release_dir="release"
archive_path="${release_dir}/${release_name}.zip"

node scripts/build.mjs

mkdir -p "${release_dir}"
rm -f "${archive_path}"
(cd game && zip -r "../${archive_path}" .)
sha256sum "${archive_path}" > "${archive_path}.sha256"

echo "Created ${archive_path} and checksum."
