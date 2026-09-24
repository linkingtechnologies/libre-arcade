"""Desktop and mobile Chromium diagnostic: inlining scripts (not native HTTP-module parity)."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
html=(PUBLIC/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+(PUBLIC/'style.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
scripts=[]
for name in ['asteroids.js','combat.js','core.js','render.js','input.js','app.js']:
    code=(PUBLIC/'src'/name).read_text(encoding='utf-8')
    code='\n'.join(line for line in code.splitlines() if not line.startswith('import '))
    code=code.replace('export const ','const ').replace('export function ','function ')
    scripts.append(code)
script='\n'.join(scripts)+'\nwindow.__m3_state = () => state;'
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
            page.evaluate('Math.random = () => 0.2;')
            page.evaluate(script)
            page.wait_for_timeout(200)
            assert page.locator('canvas').is_visible(),name
            assert 'M3' in page.locator('h1').inner_text(),name
            assert page.locator('#subtitle').inner_text().startswith('Asteroidi' if name=='mobile-portrait' else 'Asteroids')
            assert page.evaluate('document.documentElement.scrollHeight <= window.innerHeight'),name+' vertical scroll'
            assert page.evaluate('document.querySelector("canvas").width === 640 && document.querySelector("canvas").height === 480')
            pixels=page.evaluate('''() => {const a=document.querySelector('canvas').getContext('2d').getImageData(0,0,640,480).data;
              let light=0;for(let i=0;i<a.length;i+=4){if(a[i]>175&&a[i+1]>175&&a[i+2]>175)light++}return light;}''')
            assert pixels>15,(name,pixels)
            page.locator('#pause').click();page.locator('#lang').click();page.locator('#reset').click()
            if name=='desktop':
                page.keyboard.down('Space');page.wait_for_timeout(110);page.keyboard.up('Space')
            else:
                btn=page.locator('[data-control="shoot"]');assert btn.is_visible(),name
                box=btn.bounding_box();assert box and box['width']>0,name
                btn.tap();page.wait_for_timeout(60)
            shots=page.evaluate('window.__m3_state().bullets.length')
            assert shots>=1,(name,'shot did not reach the engine',shots)
            assert not errs,(name,errs)
            if os.environ.get('M3_SCREENSHOT_DIR'):
                out=Path(os.environ['M3_SCREENSHOT_DIR']);out.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(out/f'browser-m3-{name}.png'))
            print(f'BROWSER M3 {name}: PASS (inline diagnostic, {pixels} light pixels, no vertical scroll)')
            page.close()
    finally:browser.close()
