#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DEST="$ROOT/public/assets/boards/original"
mkdir -p "$DEST"

PD_URL='https://upload.wikimedia.org/wikipedia/commons/8/88/Ganzenbord_pd.svg'
HIST_URL='https://upload.wikimedia.org/wikipedia/commons/e/ec/Ganzenbordspel.jpg'
UA='Grugnettos-Goose/0.13 software-archaeology asset fetcher'

fetch() {
  url=$1
  out=$2
  printf 'Fetching %s ...\n' "$out"
  curl --fail --location --retry 4 --retry-delay 2 --user-agent "$UA" --output "$DEST/$out.part" "$url"
  mv "$DEST/$out.part" "$DEST/$out"
}

fetch "$PD_URL" 'Ganzenbord_pd.svg'
fetch "$HIST_URL" 'Ganzenbordspel.jpg'

# Basic file-signature guards: fail loudly rather than keeping an HTML error page.
grep -q '<svg' "$DEST/Ganzenbord_pd.svg" || { echo 'Ganzenbord_pd.svg is not an SVG' >&2; exit 1; }
python3 - "$DEST/Ganzenbordspel.jpg" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
b=p.read_bytes()[:3]
if b != b'\xff\xd8\xff':
    raise SystemExit('Ganzenbordspel.jpg is not a JPEG')
PY

printf '\nDownloaded files:\n'
ls -lh "$DEST/Ganzenbord_pd.svg" "$DEST/Ganzenbordspel.jpg"

printf '\nSHA-256:\n'
(
  cd "$DEST"
  sha256sum Ganzenbord_pd.svg Ganzenbordspel.jpg | tee SHA256SUMS.txt
)

printf '\nGanzenbord_pd.svg SHA-1 check:\n'
ACTUAL_SHA1=$(sha1sum "$DEST/Ganzenbord_pd.svg" | awk '{print $1}')
EXPECTED_SHA1='2324f0f685f17a39771bb4b42617b52dc0b2953f'
printf 'expected: %s\nactual:   %s\n' "$EXPECTED_SHA1" "$ACTUAL_SHA1"
[ "$ACTUAL_SHA1" = "$EXPECTED_SHA1" ] || { echo 'WARNING: Commons SHA-1 did not match.' >&2; exit 1; }

printf '\nDone. The game can now use both board images fully locally.\n'
