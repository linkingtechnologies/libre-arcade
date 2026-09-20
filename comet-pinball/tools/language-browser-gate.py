#!/usr/bin/env python3
"""Real Chromium rendering of the published JS/CSS/audio payload for both locales.
When the managed browser blocks local URLs, use the exact production bytes inline.
"""
from pathlib import Path
import base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
WEB=ROOT/'public'
html=(WEB/'index.html').read_text(encoding='utf-8').replace('<link rel="stylesheet" href="style.css">','<style>'+ (WEB/'style.css').read_text(encoding='utf-8')+'</style>')
for f in ['data/playfield.js','js/physics.js','js/camera.js','js/audio.js','js/visuals.js','js/i18n.js','js/comet.js']:
    html=html.replace(f'<script src="{f}"></script>','<script>\n'+(WEB/f).read_text(encoding='utf-8')+'\n</script>')
for ext,mime in [('ogg','audio/ogg'),('mp3','audio/mpeg')]:
    rel=f'assets/music/comet-loop.{ext}'
    html=html.replace(f'src="{rel}"', f'src="data:{mime};base64,'+base64.b64encode((WEB/rel).read_bytes()).decode('ascii')+'"')
shots=ROOT/'reports'/'browser-generated';shots.mkdir(exist_ok=True,parents=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking'])
    errors=[]
    for lang,play,credit in [('en-US','▶ PLAY','CREDITS'),('it-IT','▶ GIOCA','CREDITI'),('de-DE','▶ PLAY','CREDITS')]:
        ctx=browser.new_context(locale=lang,viewport={'width':390,'height':844})
        page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded')
        page.locator('#startGame').wait_for(timeout=7000)
        expected='it' if lang=='it-IT' else 'en'
        assert page.locator('html').get_attribute('lang')==expected,(lang,'HTML lang')
        assert page.locator('#startGame').inner_text()==play
        assert page.locator('#scoreLabel').inner_text()==('PUNTEGGIO' if expected=='it' else 'SCORE')
        assert page.locator('#languageBtn').is_visible()
        if expected=='en':
            page.screenshot(path=str(shots/'language-default-en-mobile.png'))
            page.set_viewport_size({'width':1280,'height':960})
            page.screenshot(path=str(shots/'language-default-en-desktop.png'))
            page.set_viewport_size({'width':390,'height':844})
        elif lang=='it-IT':
            page.screenshot(path=str(shots/'language-default-it-mobile.png'))
        assert page.locator('#musicVolume').get_attribute('aria-label')==('Volume musica' if expected=='it' else 'Music volume')
        page.locator('#showCredits').click();assert page.get_by_role('heading',name=credit).is_visible()
        assert page.locator('.credits-content a[href="https://linkingtechnologies.github.io/libre-arcade/"]').is_visible()
        page.locator('#backCredits').click()
        page.locator('#languageBtn').click()
        other='en' if expected=='it' else 'it'
        assert page.locator('html').get_attribute('lang')==other
        assert page.locator('#startGame').inner_text()==('▶ GIOCA' if other=='it' else '▶ PLAY')
        assert page.locator('#languageBtn').get_attribute('aria-pressed')==('true' if other=='it' else 'false')
        page.locator('#showCredits').click()
        assert page.get_by_role('heading',name='CREDITI' if other=='it' else 'CREDITS').is_visible()
        page.locator('#backCredits').click()
        page.locator('#startGame').click()
        assert page.locator('#pauseBtn').inner_text()==('Pausa Ⅱ' if other=='it' else 'Pause Ⅱ')
        page.locator('#languageBtn').click() # Toggle while a live game is running.
        assert page.locator('#overlay').evaluate('(e)=>e.classList.contains("show")')==False
        page.locator('#pauseBtn').click()
        assert page.locator('#resumeGame').is_visible()
        page.locator('#languageBtn').click() # Toggle while paused, preserving game state.
        assert page.locator('#resumeGame').is_visible()
        page.locator('#resumeGame').click()
        assert page.locator('#overlay').evaluate('(e)=>e.classList.contains("show")')==False
        page.screenshot(path=str(shots/f'language-{lang}.png'))
        assert page.evaluate('document.documentElement.scrollHeight-innerHeight')<=1
        print('LANGUAGE BROWSER PASS:',lang,'default',expected,'menu/credits/game/pause toggles, no overflow')
        ctx.close()
    assert not errors,errors
    print('PASS EN/IT browser gate: 3 browser locales, 0 page errors, exact shipped payloads inline')
    browser.close()
