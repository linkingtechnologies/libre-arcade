#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node test/parity_cpp.mjs
node test/progression.mjs
node test/campaign.mjs
node test/all_levels_render.mjs
node test/assets.mjs
node test/soak_all_levels.mjs
node test/playthrough_all_levels.mjs
node tests/test_preferences.mjs
node tests/test_renderer_ui.mjs
node tests/test_publication_shell.mjs
node tests/test_audio_manager.mjs
node tests/test_app_smoke.mjs
