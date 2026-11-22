#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Build a Libre Arcade .deb package for GitHub Releases distribution."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

VERSION = '1.0.0'
PACKAGE = 'libre-arcade'
MAINTAINER = 'Umberto Bresciani <umbe.cr@gmail.com>'

def _parse_game_hrefs(index_html: Path) -> list[str]:
    text = index_html.read_text(encoding='utf-8')
    return re.findall(r"href:\s*'([^']+)'", text)


def _copy_game(src_root: Path, share: Path, href: str) -> None:
    game_dir = href.split('/')[0]
    game_src = src_root / game_dir
    if not game_src.is_dir():
        print(f'  WARNING: {game_dir} not found, skipping', file=sys.stderr)
        return

    # Every game has a public/ directory — copy it verbatim.
    public_src = game_src / 'public'
    public_dst = share / game_dir / 'public'
    if public_src.is_dir():
        shutil.copytree(public_src, public_dst)

    # Screenshots are referenced from root index.html.
    shots = game_src / 'screenshots'
    if shots.is_dir():
        shutil.copytree(shots, share / game_dir / 'screenshots')


def build_deb(src_root: Path, output_dir: Path,
              maintainer: str, version: str) -> Path:
    packaging_dir = Path(__file__).parent

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)

        # /usr/share/libre-arcade/
        share = tmpdir / 'usr' / 'share' / 'libre-arcade'
        share.mkdir(parents=True)
        shutil.copy2(src_root / 'index.html', share / 'index.html')

        seen: set[str] = set()
        for href in _parse_game_hrefs(src_root / 'index.html'):
            game_dir = href.split('/')[0]
            if game_dir in seen:
                continue
            seen.add(game_dir)
            print(f'  {game_dir}')
            _copy_game(src_root, share, href)

        # /usr/bin/libre-arcade
        bin_dir = tmpdir / 'usr' / 'bin'
        bin_dir.mkdir(parents=True)
        launcher_dst = bin_dir / 'libre-arcade'
        shutil.copy2(packaging_dir / 'launcher.py', launcher_dst)
        launcher_dst.chmod(0o755)

        # /usr/share/applications/
        apps_dir = tmpdir / 'usr' / 'share' / 'applications'
        apps_dir.mkdir(parents=True)
        shutil.copy2(packaging_dir / 'libre-arcade.desktop',
                     apps_dir / 'libre-arcade.desktop')

        # /usr/share/icons/hicolor/scalable/apps/
        icon_dir = (tmpdir / 'usr' / 'share' / 'icons'
                    / 'hicolor' / 'scalable' / 'apps')
        icon_dir.mkdir(parents=True)
        shutil.copy2(packaging_dir / 'libre-arcade.svg',
                     icon_dir / 'libre-arcade.svg')

        # DEBIAN/
        debian_dir = tmpdir / 'DEBIAN'
        debian_dir.mkdir()
        postinst_src = packaging_dir / 'postinst'
        if postinst_src.is_file():
            postinst_dst = debian_dir / 'postinst'
            shutil.copy2(postinst_src, postinst_dst)
            postinst_dst.chmod(0o755)
        installed_size = sum(
            f.stat().st_size for f in tmpdir.rglob('*') if f.is_file()
        ) // 1024
        control = textwrap.dedent(f"""\
            Package: {PACKAGE}
            Version: {version}
            Architecture: all
            Maintainer: {maintainer}
            Installed-Size: {installed_size}
            Depends: python3, chromium | chromium-browser
            Section: games
            Priority: optional
            Homepage: https://linkingtechnologies.github.io/libre-arcade/
            Description: offline collection of restored open-source browser games
             Libre Arcade restores historical open-source games and preserves their
             original gameplay in HTML5 and JavaScript. This package provides the
             full collection as a desktop application, playable offline with Chromium.
        """)
        (debian_dir / 'control').write_text(control, encoding='utf-8')

        output_dir.mkdir(parents=True, exist_ok=True)
        deb_name = f'{PACKAGE}_{version}_all.deb'
        deb_path = output_dir / deb_name
        subprocess.run(
            ['dpkg-deb', '--build', '--root-owner-group', str(tmpdir), str(deb_path)],
            check=True,
        )
        return deb_path


def main() -> int:
    ap = argparse.ArgumentParser(description='Build Libre Arcade .deb')
    ap.add_argument('--source', default='.',
                    help='Path to libre-arcade checkout (default: .)')
    ap.add_argument('--output', default='dist',
                    help='Output directory (default: dist)')
    ap.add_argument('--maintainer', default=MAINTAINER)
    ap.add_argument('--version', default=VERSION)
    args = ap.parse_args()

    src = Path(args.source).resolve()
    if not (src / 'index.html').is_file():
        print(f'ERROR: {src}/index.html not found. '
              'Pass --source pointing to the libre-arcade checkout.',
              file=sys.stderr)
        return 1

    out = Path(args.output).resolve()
    print(f'Building {PACKAGE}_{args.version}_all.deb')
    print(f'  Source : {src}')
    print(f'  Output : {out}')
    print('Copying games:')

    deb = build_deb(src, out, args.maintainer, args.version)

    print(f'\nDone: {deb}')
    print(f'\nInspect:  dpkg-deb --contents {deb.name}')
    print(f'Install:  sudo apt install ./{deb.name}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
