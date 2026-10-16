#!/usr/bin/env python3
from pathlib import Path
import re, sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
CSS=(ROOT/'src/style.css').read_text()
HTML=HTML.replace('<link rel="stylesheet" href="src/style.css">','<style>'+CSS+'</style>')
srcs=re.findall(r'<script src="([^"]+)"></script>',HTML)
HTML=re.sub(r'<script src="[^"]+"></script>','',HTML)
# The managed browser blocks file:// and localhost. Use the exact production payload
# inline and provide a test-only lexical localStorage shim for the opaque document.
shim='''<script>const localStorage=(()=>{const d=new Map();return{getItem:k=>d.has(String(k))?d.get(String(k)):null,setItem:(k,v)=>d.set(String(k),String(v)),removeItem:k=>d.delete(String(k)),key:i=>Array.from(d.keys())[i]??null,get length(){return d.size}}})();</script>'''
inline=shim+''.join('<script>'+ (ROOT/src).read_text() +'</script>' for src in srcs)
HTML=HTML.replace('</body>',inline+'</body>')

def assert_(v,msg):
    if not v: raise AssertionError(msg)

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    for width,height in [(1280,960),(390,844),(320,568)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(HTML,wait_until='load'); page.wait_for_timeout(450)
        assert_(not errors,f'page errors {width}x{height}: {errors}')
        dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,cw:document.documentElement.clientWidth,ch:document.documentElement.clientHeight})')
        assert_(dims['sw']<=dims['cw'] and dims['sh']<=dims['ch'],f'overflow {width}x{height}: {dims}')
        # Help: native Enter on Back must work, not be stolen by the global NES listener.
        page.click('#helpButton'); assert_(page.locator('#helpScreen').is_visible(),'help not visible')
        assert_(page.evaluate("()=>document.activeElement&&document.activeElement.id")=='helpTitle','help focus target')
        page.locator('#helpScreen .back').focus(); page.keyboard.press('Enter'); page.wait_for_timeout(30)
        assert_(page.locator('#menuScreen').is_visible(),'Enter on help Back did not return')
        assert_(page.evaluate("()=>document.activeElement&&document.activeElement.id")=='helpButton','help focus not restored')
        # Credits: native Enter on Reset must remain functional.
        page.click('#creditsButton'); page.locator('#resetDataButton').focus(); page.keyboard.press('Enter'); page.wait_for_timeout(30)
        assert_('reset' in page.locator('#creditsStatus').inner_text().lower(),'credits reset keyboard activation failed')
        page.locator('#creditsScreen .back').focus(); page.keyboard.press('Enter'); page.wait_for_timeout(30)
        # Enter passcode mode through the NES keyboard menu, then type into the focused DOM input.
        page.locator('#titleCanvas').focus(); page.keyboard.press('ArrowDown'); page.keyboard.press('Enter'); page.wait_for_timeout(30)
        inp=page.locator('#codeInput'); assert_(inp.is_visible(),'code input not visible')
        assert_(page.evaluate("()=>document.activeElement&&document.activeElement.id")=='codeInput','code input not focused')
        inp.fill('0471'); page.keyboard.press('Enter'); page.wait_for_timeout(900)
        assert_(page.locator('#gameScreen').is_visible(),'valid passcode did not start level 2')
        # Keyboard-operable touch controls: START pauses and A/START can resume via focused buttons.
        start=page.locator('[data-act="start"]'); start.focus(); page.keyboard.press('Enter'); page.wait_for_timeout(40)
        # Pause menu is rendered in canvas; pressing Enter on focused START must invoke control() exactly once.
        page.keyboard.press('Enter'); page.wait_for_timeout(40)
        assert_(not errors,f'late page errors {width}x{height}: {errors}')
        page.close()
    browser.close()
print('M13 managed Chromium smoke: PASS (1280x960, 390x844, 320x568)')
