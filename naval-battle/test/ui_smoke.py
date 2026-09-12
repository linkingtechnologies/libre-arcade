#!/usr/bin/env python3
"""Browser smoke/regression test for 🐽's Naval Battle.

Development-only dependency: Playwright for Python. The game itself has no
runtime dependency on Python, Playwright, a framework, or a build step.

The test builds a temporary in-memory browser bundle from the ES modules. This
lets it run even in locked-down CI environments that block localhost URLs.
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def browser_fixture():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'src/ui/styles.css').read_text(encoding='utf-8')
    html = re.sub(r'<link rel="stylesheet"[^>]*>', f'<style>{css}</style>', html)
    html = re.sub(r'<script type="module"[^>]*></script>', '', html)

    order = [
        'src/core/rules.js',
        'src/core/prng.js',
        'src/core/board.js',
        'src/core/fleet.js',
        'src/players/warboats-2009.js',
        'src/players/os4-2009-reconstructed.js',
        'src/ui/app.js',
    ]
    chunks = []
    for rel in order:
        source = (ROOT / rel).read_text(encoding='utf-8')
        source = re.sub(r'^import .*?;\s*$', '', source, flags=re.MULTILINE)
        source = re.sub(r'\bexport\s+', '', source)
        chunks.append(f'// {rel}\n{source}')
    bundle = '\n\n'.join(chunks)

    # CI-only adaptations: fast CPU turn and no origin-dependent localStorage.
    bundle = re.sub(
        r"const CPU_DELAY_MS = .*?;",
        'const CPU_DELAY_MS = 0;',
        bundle,
        count=1,
    )
    bundle = re.sub(
        r"const saved = localStorage\.getItem\('grugnetto-naval-battle-language'\).*?;",
        'const saved = null;',
        bundle,
        count=1,
    )
    bundle = bundle.replace("localStorage.setItem('grugnetto-naval-battle-language', lang);", '')
    return html, bundle


def load_app(page, html, bundle):
    page.set_content(html, wait_until='load')
    page.add_script_tag(content=bundle)
    page.locator('.hero').wait_for()


def assert_fits(page, label: str):
    metrics = page.evaluate(
        """() => {
          const s = document.querySelector('.stage');
          const c = document.querySelector('.screen');
          const sr = s.getBoundingClientRect();
          const cr = c.getBoundingClientRect();
          return {
            stageClient: s.clientHeight,
            stageScroll: s.scrollHeight,
            stageWidth: s.clientWidth,
            stageScrollWidth: s.scrollWidth,
            screenTop: cr.top,
            screenBottom: cr.bottom,
            stageTop: sr.top,
            stageBottom: sr.bottom,
            innerHeight,
            innerWidth
          };
        }"""
    )
    assert metrics['stageScroll'] <= metrics['stageClient'] + 1, f'{label}: vertical overflow {metrics}'
    assert metrics['stageScrollWidth'] <= metrics['stageWidth'] + 1, f'{label}: horizontal overflow {metrics}'
    assert metrics['screenTop'] >= metrics['stageTop'] - 1, f'{label}: clipped top {metrics}'
    assert metrics['screenBottom'] <= metrics['stageBottom'] + 1, f'{label}: clipped bottom {metrics}'


def start_battle(page):
    page.locator('[data-action="play"]').click()
    page.locator('.placement-layout').wait_for()
    assert not page.locator('[data-action="start"]').is_disabled()
    page.locator('[data-action="start"]').click()
    page.locator('.battle-boards').wait_for()


def finish_game(page):
    for _ in range(1800):
        if page.locator('.result-card').count():
            return
        targets = page.locator('.cell[data-fire]')
        if targets.count():
            targets.first.click(force=True, timeout=1000)
        page.wait_for_timeout(3)
    raise AssertionError('Game did not finish in smoke loop')


def main():
    html, bundle = browser_fixture()
    chromium = os.environ.get('CHROME_BIN', '/usr/bin/chromium')
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=chromium,
            args=['--no-sandbox', '--disable-dev-shm-usage'],
        )
        try:
            for width, height in ((1365, 768), (390, 844), (360, 640)):
                page = browser.new_page(viewport={'width': width, 'height': height})
                load_app(page, html, bundle)
                assert_fits(page, f'home {width}x{height}')

                page.locator('[data-action="play"]').click()
                page.locator('.placement-layout').wait_for()
                assert_fits(page, f'placement {width}x{height}')

                page.locator('[data-action="start"]').click()
                page.locator('.battle-boards').wait_for()
                assert_fits(page, f'battle {width}x{height}')
                page.close()

            page = browser.new_page(viewport={'width': 390, 'height': 844})
            load_app(page, html, bundle)
            page.locator('[data-lang="en"]').click()
            assert page.locator('.brand-sub').inner_text() == 'Classic Naval Battle'
            page.locator('[data-lang="it"]').click()
            start_battle(page)

            original_layout = page.evaluate(
                """() => Array.from(document.querySelectorAll('.battle-board:first-of-type .cell'))
                  .map((e,i) => e.classList.contains('ship') ? i : null)
                  .filter(x => x !== null)"""
            )
            finish_game(page)
            assert_fits(page, 'result 390x844')

            page.locator('[data-action="replay"]').click()
            page.locator('.battle-boards').wait_for()
            replay_layout = page.evaluate(
                """() => Array.from(document.querySelectorAll('.battle-board:first-of-type .cell'))
                  .map((e,i) => e.classList.contains('ship') ? i : null)
                  .filter(x => x !== null)"""
            )
            assert replay_layout == original_layout, 'Play again must preserve the human fleet layout'

            finish_game(page)
            page.locator('[data-action="placement"]').click()
            page.locator('.placement-layout').wait_for()
            assert_fits(page, 'new game placement 390x844')
            page.close()
        finally:
            browser.close()

    print('UI smoke tests: OK')


if __name__ == '__main__':
    main()
