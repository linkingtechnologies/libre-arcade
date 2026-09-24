"""M6 browser UI smoke: JS inlined only to bypass this environment's blocked
local navigation. It is NOT a test of conventional HTTP ES-module loading or
of native Python 2/Pygame gameplay parity.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,re
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
html=(PUBLIC/'index.html').read_text(encoding='utf-8').replace('<link rel="stylesheet" href="./style.css">','<style>'+(PUBLIC/'style.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
parts=[]
for name in ['asteroids.js','particles.js','saucers.js','combat.js','core.js','render.js','storage.js','menu.js','native-files.js','input.js','app.js']:
    script=(PUBLIC/'src'/name).read_text(encoding='utf-8')
    script='\n'.join(line for line in script.splitlines() if not line.startswith('import '))
    script=re.sub(r'\bexport\s+','',script)
    if name=='particles.js':script=re.sub(r'\bTAU\b','PARTICLE_TAU',script)
    parts.append(script)
script='\n'.join(parts)+'\nwindow.__m6_setScore=(n)=>{state.score=n;};window.__m6_status=()=>({screen:machine.screen,binding:machine.binding,bindings:{...bindings},score:state.score,mode:state.mode,ticks:state.ticks,paused:machine.screen===\'pause\'});'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    try:
        for name,opts in [('desktop',dict(viewport=dict(width=1280,height=800),locale='en-US')),
                          ('mobile-portrait',dict(viewport=dict(width=390,height=844),locale='it-IT',is_mobile=True,has_touch=True)),
                          ('mobile-landscape',dict(viewport=dict(width=844,height=390),locale='en-US',is_mobile=True,has_touch=True))]:
            page=browser.new_page(**opts)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(html)
            page.evaluate('Math.random=()=>0.3')
            page.evaluate(script)
            assert page.locator('#menu-title').inner_text()=='ASTEROIDS INFINITY'
            assert page.locator('#menu-items button').count()==4
            assert page.evaluate('document.documentElement.scrollHeight<=innerHeight'),name+' scroll at main menu'
            # Keyboard-driven original menu flow: 2 downs -> options -> controls.
            page.keyboard.press('ArrowDown');page.keyboard.press('ArrowDown');page.keyboard.press('Enter')
            assert page.evaluate('window.__m6_status().screen')=='options'
            assert page.locator('#menu-items button').count()==5
            page.locator('#menu-items button').nth(3).click()
            assert page.evaluate('window.__m6_status().screen')=='controls'
            assert page.locator('#menu-items button').count()==7
            # Rebind 'shoot' to KeyQ, then check the gameplay adapter sees it.
            page.locator('#menu-items button').nth(4).click()
            assert page.evaluate('window.__m6_status().binding')=='shoot'
            page.keyboard.press('q')
            assert page.evaluate('window.__m6_status().bindings.shoot')=='KeyQ'
            assert page.locator('#menu-items button').nth(4).inner_text().endswith('Q')
            page.keyboard.press('Escape')
            assert page.evaluate('window.__m6_status().screen')=='options'
            page.keyboard.press('Escape')
            assert page.evaluate('window.__m6_status().screen')=='menu'
            # Open highscore table via menu and go back.
            page.locator('#menu-items button').nth(1).click()
            assert page.locator('.score-table tr').count()==10
            assert page.locator('.score-table tr').first.inner_text().find('PERFECT')>=0
            page.keyboard.press('Escape')
            # Start game, pause (no stepping while paused), resume and ESC surrender.
            page.locator('#menu-items button').first.click()
            assert page.evaluate('window.__m6_status().screen')=='play'
            assert page.locator('#menu-overlay').is_hidden()
            page.wait_for_timeout(100)
            page.keyboard.press('p')
            assert page.evaluate('window.__m6_status().paused')
            ticks=page.evaluate('window.__m6_status().ticks');page.wait_for_timeout(100)
            assert page.evaluate('window.__m6_status().ticks')==ticks
            page.keyboard.press('Enter')
            assert page.evaluate('window.__m6_status().screen')=='play'
            page.keyboard.press('Escape')
            assert page.evaluate('window.__m6_status().screen')=='gameover'
            page.keyboard.press('Enter')
            assert page.evaluate('window.__m6_status().screen')=='highscores'
            page.keyboard.press('Escape')
            assert page.evaluate('window.__m6_status().screen')=='menu'
            # Artificial score tests the UI route only, NOT a natural gameplay result.
            page.locator('#menu-items button').first.click()
            page.evaluate('window.__m6_setScore(10000)')
            page.locator('#menu-toggle').click()
            assert page.evaluate('window.__m6_status().screen')=='gameover'
            page.keyboard.press('Enter')
            assert page.evaluate('window.__m6_status().screen')=='name'
            page.locator('#name-input').fill('PLAYER')
            page.locator('#menu-items button').first.click()
            assert page.evaluate('window.__m6_status().screen')=='highscores'
            assert 'PLAYER' in page.locator('.score-table tr').first.inner_text()
            page.keyboard.press('Escape')
            # Touch main menu selection and bilingual language.
            page.locator('#lang').click()
            assert page.locator('#menu-items button').first.inner_text() in ('PLAY','GIOCA')
            assert page.evaluate('document.documentElement.scrollHeight<=innerHeight'),name+' menu vertical scroll'
            assert not errors,(name,errors)
            output=os.environ.get('M6_SCREENSHOT_DIR')
            if output:
                out=Path(output);out.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(out/f'browser-m6-{name}.png'))
            print(f'BROWSER M6 {name}: PASS (menu, rebind, highscore, pause, keyboard/touch responsive, no vertical scroll; inline diagnostic)')
            page.close()
    finally:browser.close()
