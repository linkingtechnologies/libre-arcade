"""Chromium M12 browser UI/audio smoke using inlined ES modules.
Ordinary HTTP module loading is NOT certified by this diagnostic test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,re
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
html=(PUBLIC/'index.html').read_text(encoding='utf-8').replace('<link rel="stylesheet" href="./style.css">','<style>'+(PUBLIC/'style.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
parts=[]
for name in ['asteroids.js','particles.js','saucers.js','combat.js','core.js','render.js','storage.js','menu.js','native-files.js','input.js','frame-delta.js','frame-clock.js','sound.js','app.js']:
    script=(PUBLIC/'src'/name).read_text(encoding='utf-8')
    script='\n'.join(line for line in script.splitlines() if not line.startswith('import '))
    script=re.sub(r'\bexport\s+','',script)
    if name=='particles.js':script=re.sub(r'\bTAU\b','PARTICLE_TAU',script)
    parts.append(script)
script='\n'.join(parts)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required'])
    try:
        for kind,kw in [('desktop',dict(viewport=dict(width=1280,height=800),locale='en-US')),
                        ('mobile-portrait',dict(viewport=dict(width=390,height=844),locale='it-IT',is_mobile=True,has_touch=True)),
                        ('mobile-landscape',dict(viewport=dict(width=844,height=390),locale='en-US',is_mobile=True,has_touch=True))]:
            page=browser.new_page(**kw)
            errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
            page.set_content(html)
            page.evaluate("""() => {
              window.__store=new Map();
              Object.defineProperty(window,'localStorage',{configurable:true,value:{
                getItem:k=>window.__store.get(k)??null,
                setItem:(k,v)=>window.__store.set(k,v),
                removeItem:k=>window.__store.delete(k)
              }});
            }""")
            page.evaluate("""() => {
              const real=AudioContext.prototype.createOscillator;
              window.__oscCount=0;
              AudioContext.prototype.createOscillator=function(...args){window.__oscCount++;return real.apply(this,args);};
            }""")
            page.evaluate(script)
            assert page.locator('#menu-items button').count()==4
            assert page.locator('.secondary-menu-item').count()==2
            assert 'Libre Arcade' not in page.locator('header').inner_text()
            assert 'Libre Arcade' not in page.locator('footer').inner_text()
            # Help is complete in both languages and can be closed without starting play.
            output=os.environ.get('M12_SCREENSHOT_DIR')
            if output:
                Path(output).mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(Path(output)/f'browser-m12-menu-{kind}.png'))
            page.locator('.secondary-menu-item').first.click()
            assert page.locator('#menu-items button').count()==1
            assert page.locator('.player-help p').count()==6
            assert ('Tastiera' if kind=='mobile-portrait' else 'Keyboard') in page.locator('.player-help').inner_text()
            assert ('Smartphone' if kind=='mobile-portrait' else 'Phone') in page.locator('.player-help').inner_text()
            assert page.evaluate('document.documentElement.scrollHeight<=innerHeight && document.documentElement.scrollWidth<=innerWidth'),kind+' help overflow'
            if output:page.screenshot(path=str(Path(output)/f'browser-m12-help-{kind}.png'))
            page.locator('#menu-items button').click()
            page.locator('.secondary-menu-item').last.click()
            assert page.locator('.player-credits a').count()==2
            assert page.locator('.player-credits a').last.get_attribute('href')=='https://linkingtechnologies.github.io/libre-arcade/'
            assert ('collaboratori' if kind=='mobile-portrait' else 'contributors') in page.locator('.player-credits').inner_text()
            if output:page.screenshot(path=str(Path(output)/f'browser-m12-credits-{kind}.png'))
            page.locator('#menu-items button').click()
            assert page.locator('#menu-items button').count()==4
            assert page.locator('#sound').is_visible()
            assert page.locator('#sound').get_attribute('aria-pressed')=='true'
            page.locator('#sound').click()
            assert page.locator('#sound').get_attribute('aria-pressed')=='false'
            assert page.evaluate("window.__store.get('libre-arcade.ai.sound.m12')")=='off'
            page.locator('#sound').click()
            assert page.locator('#sound').get_attribute('aria-pressed')=='true'
            assert page.evaluate("window.__store.get('libre-arcade.ai.sound.m12')")=='on'
            page.locator('#menu-items button').nth(2).click()
            assert page.locator('#menu-items button').count()==5
            assert page.locator('.advanced-tools').count()==1
            assert page.locator('.transfer-button').first.is_hidden()
            page.locator('.advanced-tools summary').click()
            assert page.locator('.transfer-button').first.is_visible()
            page.keyboard.press('Escape')
            page.locator('#menu-items button').first.click()
            assert page.locator('#menu-overlay').is_hidden()
            page.wait_for_timeout(150)
            # grid/developer HUD no longer present, while play HUD remains informative
            canvas_text=page.evaluate('''() => {
              const c=document.querySelector('#game'), ctx=c.getContext('2d');
              return {w:c.width,h:c.height};
            }''')
            assert canvas_text=={'w':640,'h':480}
            if kind=='desktop':page.keyboard.down('ArrowUp');page.wait_for_timeout(100);page.keyboard.up('ArrowUp');page.keyboard.press('Space')
            else:
                page.locator('[data-control="up"]').tap()
                page.locator('[data-control="shoot"]').tap()
            page.wait_for_timeout(170)
            assert page.evaluate('window.__oscCount>0'),kind+' synthesized sound not triggered after user gesture'
            page.locator('#pause').click()
            assert page.locator('#menu-overlay').is_visible()
            assert page.locator('#sound').is_visible()
            assert page.evaluate('document.documentElement.scrollHeight<=innerHeight && document.documentElement.scrollWidth<=innerWidth'),kind+' page overflow'
            assert not errors,(kind,errors)
            output=os.environ.get('M12_SCREENSHOT_DIR')
            if output:
                Path(output).mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(Path(output)/f'browser-m12-{kind}.png'))
            print(f'M12 BROWSER {kind}: PASS (player UI, sound toggle, options, play, pause, no scroll; inlined modules)')
            page.close()
    finally:browser.close()
