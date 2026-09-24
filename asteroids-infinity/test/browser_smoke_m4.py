"""M4 browser diagnostic with inline ESM adaptation: HTTP localhost is restricted here.
   This does not certify normal network-based ES-module loading. """
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
html=(PUBLIC/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+(PUBLIC/'style.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
scripts=[]
for name in ['asteroids.js','combat.js','core.js','saucers.js','render.js','input.js','app.js']:
    code=(PUBLIC/'src'/name).read_text(encoding='utf-8')
    code='\n'.join(line for line in code.splitlines() if not line.startswith('import '))
    code=code.replace('export const ','const ').replace('export function ','function ')
    scripts.append(code)
script='\n'.join(scripts)+'''\nwindow.__m4_state=()=>state;
window.__m4_spawn=(type,pos)=>createSaucer(state,type,pos);undefined;'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    try:
        scenarios=[('desktop',{'viewport':{'width':1280,'height':800},'locale':'en-US'}),
                   ('mobile-portrait',{'viewport':{'width':390,'height':844},'is_mobile':True,'has_touch':True,'locale':'it-IT'}),
                   ('mobile-landscape',{'viewport':{'width':844,'height':390},'is_mobile':True,'has_touch':True,'locale':'en-US'})]
        for name,opts in scenarios:
            page=browser.new_page(**opts)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(html)
            page.evaluate('Math.random=()=>0.2;')
            page.evaluate(script)
            page.wait_for_timeout(100)
            assert page.locator('canvas').is_visible()
            assert page.locator('h1').inner_text().endswith('M4')
            assert page.locator('#subtitle').inner_text().startswith('Asteroidi' if name=='mobile-portrait' else 'Asteroids')
            assert page.evaluate('document.documentElement.scrollHeight<=window.innerHeight'),name+' vertical scroll'
            assert page.evaluate('document.querySelector("canvas").width===640&&document.querySelector("canvas").height===480')
            page.locator('#pause').click();page.locator('#lang').click();page.locator('#reset').click()
            if name=='desktop':
                page.keyboard.down('Space');page.wait_for_timeout(100);page.keyboard.up('Space')
            else:
                button=page.locator('[data-control="shoot"]');assert button.is_visible()
                button.tap();page.wait_for_timeout(60)
            assert page.evaluate('window.__m4_state().bullets.length>=1'),'shoot input failed'
            # Diagnostic spawn (NOT organic random encounter) to check canvas rendering.
            page.evaluate('''() => {const s=window.__m4_state();const b=window.__m4_spawn('small',[90,420]);
              b.proto=false;b.radius=b.realRadius;s.collidables.push(b);
              if(!s.saucers.includes(b)||s.collidables.indexOf(b)<0)throw Error('spawn failed');}''')
            page.wait_for_timeout(70)
            assert not errors,(name,errors)
            if os.environ.get('M4_SCREENSHOT_DIR'):
                out=Path(os.environ['M4_SCREENSHOT_DIR']);out.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(out/f'browser-m4-{name}.png'))
            print(f'BROWSER M4 {name}: PASS (inline diagnostic, saucer injected for rendering, no scroll, input works)')
            page.close()
    finally:browser.close()
