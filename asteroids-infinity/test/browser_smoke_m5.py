"""Browser-only M5 diagnostic. The sandbox blocks localhost and synthetic-origin
navigation. Inline the self-contained first-party JS sources strictly for the
probe; it does NOT certify normal HTTP ES-module loading or native-game parity.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,re
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
html=(PUBLIC/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+(PUBLIC/'style.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
scripts=[]
for name in ['asteroids.js','particles.js','saucers.js','combat.js','core.js','render.js','input.js','app.js']:
    code=(PUBLIC/'src'/name).read_text(encoding='utf-8')
    code='\n'.join(line for line in code.splitlines() if not line.startswith('import '))
    code=re.sub(r'\bexport\s+','',code)
    if name=='particles.js':code=re.sub(r'\bTAU\b','PARTICLE_TAU',code)
    scripts.append(code)
script='\n'.join(scripts)+'''
window.__m5_state=()=>state;
window.__m5_inject=()=>{particle(state,[350,270],[0,0]);return state.particles.length;};
'''
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
            page.evaluate('Math.random=()=>0.0;')
            page.evaluate(script)
            page.wait_for_timeout(150)
            assert page.locator('h1').inner_text().endswith('M5')
            assert page.locator('canvas').is_visible()
            assert page.evaluate('document.documentElement.scrollHeight<=window.innerHeight'),name+' vertical scroll'
            assert page.evaluate('document.querySelector("canvas").width===640&&document.querySelector("canvas").height===480')
            assert page.locator('#subtitle').inner_text().startswith('Asteroidi' if name=='mobile-portrait' else 'Asteroids')
            assert page.evaluate('window.__m5_inject()')>=1
            page.locator('#pause').click();page.locator('#lang').click();page.locator('#reset').click()
            if name=='desktop':
                page.keyboard.down('ArrowUp');page.wait_for_timeout(90);page.keyboard.up('ArrowUp')
            else:
                page.locator('[data-control="up"]').tap();page.wait_for_timeout(80)
            assert not errors,(name,errors)
            if os.environ.get('M5_SCREENSHOT_DIR'):
                out=Path(os.environ['M5_SCREENSHOT_DIR']);out.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(out/f'browser-m5-{name}.png'))
            print(f'BROWSER M5 {name}: PASS (inline JS diagnostic, particle canvas and control smoke, no vertical scroll)')
            page.close()
    finally:browser.close()
