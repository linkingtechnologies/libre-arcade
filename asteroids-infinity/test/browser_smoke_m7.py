"""M7 Chromium diagnostic with inlined source to bypass environment-local-URL block.
The ES-module loader over a real HTTP server is NOT covered by this test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os, re
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
script='\n'.join(parts)+'\nwindow.__m7_setScore=(n)=>{state.score=n;};'
storage_stub="""Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__store.get(k)??null,setItem:(k,v)=>window.__store.set(k,v)}});"""
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    try:
        for kind,kw in [('desktop',dict(viewport=dict(width=1280,height=800),locale='en-US')),
                        ('mobile-portrait',dict(viewport=dict(width=390,height=844),locale='it-IT',is_mobile=True,has_touch=True)),
                        ('mobile-landscape',dict(viewport=dict(width=844,height=390),locale='en-US',is_mobile=True,has_touch=True))]:
            page=browser.new_page(**kw,accept_downloads=True)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(html);page.evaluate('window.__store=new Map();'+storage_stub)
            page.evaluate(script)
            assert 'M7' in page.title()
            assert page.locator('#menu-items button').count()==4
            assert page.evaluate('document.documentElement.scrollHeight<=innerHeight'),kind+' menu scroll'
            page.locator('#menu-items button').nth(2).click()
            assert page.locator('#menu-items button').count()==5
            with page.expect_download() as d:page.locator('.transfer-button').nth(1).click()
            assert d.value.suggested_filename=='controls.txt'
            assert Path(d.value.path()).read_text(encoding='utf-8')=='273\n274\n276\n275\n32\n306\n'
            with page.expect_file_chooser() as chooser:page.locator('.transfer-button').first.click()
            chooser.value.set_files({'name':'controls.txt','mimeType':'text/plain','buffer':b'119\n115\n97\n100\n32\n306\n'})
            page.wait_for_function("document.querySelector('#menu-tip').textContent.includes('Imported') || document.querySelector('#menu-tip').textContent.includes('Importato')")
            page.locator('#menu-items button').nth(3).click()
            assert page.locator('#menu-items button').first.inner_text().endswith('W')
            page.keyboard.press('Escape');page.keyboard.press('Escape')
            page.locator('#menu-items button').nth(1).click()
            assert page.locator('.score-table tr').count()==10
            with page.expect_download() as d:page.locator('.transfer-button').nth(1).click()
            assert d.value.suggested_filename=='highscores.txt'
            assert Path(d.value.path()).read_text(encoding='utf-8').startswith('8128:PERFECT\n')
            with page.expect_file_chooser() as chooser:page.locator('.transfer-button').first.click()
            chooser.value.set_files({'name':'highscores.txt','mimeType':'text/plain','buffer':b'9900:TESTER\n500:SMALL\n'})
            page.wait_for_function("document.querySelector('.score-table').textContent.includes('TESTER')")
            assert page.locator('.score-table tr').count()==10
            with page.expect_file_chooser() as chooser:page.locator('.transfer-button').first.click()
            chooser.value.set_files({'name':'highscores.txt','mimeType':'text/plain','buffer':b'0:BROKEN:NAME\n'})
            page.wait_for_function("document.querySelector('#menu-tip').textContent.includes('Could not') || document.querySelector('#menu-tip').textContent.includes('Impossibile')")
            assert 'TESTER' in page.locator('.score-table tr').first.inner_text()
            # Reevaluate app in a fresh DOM, keeping the same storage map as a browser reload would.
            snapshot=page.evaluate('Object.fromEntries(window.__store.entries())')
            page.close()
            page=browser.new_page(**kw,accept_downloads=True)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(html)
            page.evaluate('(data)=>{window.__store=new Map(Object.entries(data));'+storage_stub+'}',snapshot)
            page.evaluate(script)
            page.locator('#menu-items button').nth(1).click()
            assert 'TESTER' in page.locator('.score-table tr').first.inner_text()
            page.keyboard.press('Escape');page.locator('#menu-items button').nth(2).click();page.locator('#menu-items button').nth(3).click()
            assert page.locator('#menu-items button').first.inner_text().endswith('W')
            page.keyboard.press('Escape');page.keyboard.press('Escape') # return from controls to menu
            page.locator('#menu-items button').first.click() # PLAY
            page.evaluate('window.__m7_setScore(10000)') # route test only; not natural gameplay
            page.keyboard.press('Escape');page.keyboard.press('Enter')
            assert page.locator('#name-input').count()==1
            page.locator('#name-input').fill('A:B')
            page.keyboard.press('Enter')
            assert page.locator('#name-input').count()==1, 'invalid name caused exit or crash'
            page.keyboard.press('Escape')
            assert page.locator('#menu-items button').count()==4, 'escape from name must abandon entry and return to menu'
            assert page.evaluate('document.documentElement.scrollHeight<=innerHeight'),kind+' scroll'
            assert not errors,(kind,errors)
            output=os.environ.get('M7_SCREENSHOT_DIR')
            if output:
                Path(output).mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(Path(output)/f'browser-m7-{kind}.png'))
            print(f'BROWSER M7 {kind}: PASS (inline diagnostic; native text import/export; persistence simulated; malformed file rejected; no page scroll)')
            page.close()
    finally:browser.close()
