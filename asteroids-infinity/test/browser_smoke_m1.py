"""Optional browser diagnostic: no HTTP access required, modules injected.
Requires Python Playwright and a local Chromium executable; not needed to play.
Not a native-game or HTTP-module parity certification.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
html=(PUBLIC/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+(PUBLIC/'style.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
scripts=[]
for name in ['core.js','render.js','input.js','app.js']:
    data=(PUBLIC/'src'/name).read_text(encoding='utf-8')
    data='\n'.join(line for line in data.splitlines() if not line.startswith('import '))
    data=data.replace('export const ','const ').replace('export function ','function ')
    scripts.append(data)
code='\n'.join(scripts)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    try:
        for label,opts in [('desktop',{'viewport':{'width':1280,'height':800},'locale':'en-US'}),
                           ('mobile',{'viewport':{'width':390,'height':844},'is_mobile':True,'has_touch':True,'locale':'it-IT'})]:
            page=browser.new_page(**opts)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(html);page.evaluate(code);page.wait_for_timeout(180)
            assert page.locator('canvas').is_visible()
            assert page.locator('#subtitle').inner_text().startswith('Volo' if label=='mobile' else 'Flight')
            assert page.evaluate('document.documentElement.scrollHeight <= window.innerHeight'),label+' vertical scroll'
            page.locator('#pause').click();page.locator('#reset').click();page.locator('#lang').click()
            assert page.locator('#subtitle').inner_text().startswith('Flight' if label=='mobile' else 'Volo')
            page.locator('#pause').click()
            if label=='desktop':
                page.keyboard.down('ArrowUp');page.wait_for_timeout(150);page.keyboard.up('ArrowUp')
            else:
                page.locator('[data-control="up"]').tap();page.wait_for_timeout(70)
            assert not errors,(label,errors)
            out=ROOT/'test/screenshots'/f'browser-{label}.png'
            page.screenshot(path=str(out));print(f'BROWSER {label} PASS (about:blank injection, NOT HTTP ES modules)')
            page.close()
    finally:browser.close()
