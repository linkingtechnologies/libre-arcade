"""M2 browser UI smoke test with inline ES-module-free diagnostic injection.
Network access to 127.0.0.1 is blocked in the audit browser; this does NOT
verify a real HTTP ES-module loading path or historic Pygame graphics.
"""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
html=(PUBLIC/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+(PUBLIC/'style.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
scripts=[]
for name in ['asteroids.js','core.js','render.js','input.js','app.js']:
    code=(PUBLIC/'src'/name).read_text(encoding='utf-8')
    code='\n'.join(line for line in code.splitlines() if not line.startswith('import '))
    code=code.replace('export const ','const ').replace('export function ','function ')
    scripts.append(code)
script='\n'.join(scripts)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    try:
        scenarios=[('desktop',{'viewport':{'width':1280,'height':800},'locale':'en-US'}),
                   ('mobile-portrait',{'viewport':{'width':390,'height':844},'is_mobile':True,'has_touch':True,'locale':'it-IT'}),
                   ('mobile-landscape',{'viewport':{'width':844,'height':390},'is_mobile':True,'has_touch':True,'locale':'en-US'})]
        for name,opts in scenarios:
            page=browser.new_page(**opts)
            errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
            page.set_content(html)
            # Script injection is exclusively a testing workaround; shipped site uses ES modules.
            page.evaluate('Math.random = () => 0.2;')
            page.evaluate(script)
            page.wait_for_timeout(200)
            assert page.locator('canvas').is_visible(),name
            assert 'M2' in page.locator('h1').inner_text(),name
            assert page.locator('#subtitle').inner_text().startswith('Volo' if name=='mobile-portrait' else 'Flight')
            assert page.evaluate('document.documentElement.scrollHeight <= window.innerHeight'),name+' vertical scroll'
            assert page.evaluate('document.querySelector("canvas").width === 640 && document.querySelector("canvas").height === 480')
            pixels=page.evaluate('''() => {
              const c=document.querySelector('canvas'),a=c.getContext('2d').getImageData(0,0,640,480).data;
              let light=0;for(let i=0;i<a.length;i+=4){if(a[i]>175&&a[i+1]>175&&a[i+2]>175)light++}return light;
            }''')
            assert pixels>15,(name,'lack of rendered ship/rock pixels',pixels)
            page.locator('#pause').click();page.locator('#lang').click();page.locator('#reset').click()
            page.locator('#pause').click()
            if name=='desktop':
                page.keyboard.down('ArrowUp');page.wait_for_timeout(120);page.keyboard.up('ArrowUp')
            else:
                btn=page.locator('[data-control="up"]');btn.tap();page.wait_for_timeout(100)
            assert not errs,(name,errs)
            # Avoid changing versioned screenshots during repeatable post-extraction tests.
            if os.environ.get('M2_SCREENSHOT_DIR'):
                out=Path(os.environ['M2_SCREENSHOT_DIR']);out.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(out/f'browser-m2-{name}.png'))
            print(f'BROWSER M2 {name}: PASS (inline diagnostic, no HTTP modules, no vertical scroll, {pixels} light pixels)')
            page.close()
    finally:browser.close()
