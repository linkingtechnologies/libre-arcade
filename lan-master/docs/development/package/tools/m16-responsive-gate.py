#!/usr/bin/env python3
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(); CSS=(ROOT/'src/style.css').read_text()
HTML=HTML.replace('<link rel="stylesheet" href="src/style.css">','<style>'+CSS+'</style>')
srcs=re.findall(r'<script src="([^"]+)"></script>',HTML)
HTML=re.sub(r'<script src="[^"]+"></script>','',HTML)
shim='''<script>const localStorage=(()=>{const d=new Map();return{getItem:k=>d.has(String(k))?d.get(String(k)):null,setItem:(k,v)=>d.set(String(k),String(v)),removeItem:k=>d.delete(String(k)),key:i=>Array.from(d.keys())[i]??null,get length(){return d.size}}})();</script>'''
HTML=HTML.replace('</body>',shim+''.join('<script>'+ (ROOT/src).read_text() +'</script>' for src in srcs)+'</body>')

def check(v,msg):
    if not v: raise AssertionError(msg)

def near(a,b,t=0.02): return abs(a-b)<=t

expected={(654,639):(512,480),(1280,960):(512,480),(390,844):(376,352.5),(320,568):(306,286.875)}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    for wh,target in expected.items():
        page=browser.new_page(viewport={'width':wh[0],'height':wh[1]}); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(HTML,wait_until='load'); page.wait_for_timeout(450)
        title=page.locator('#titleCanvas').bounding_box(); check(near(title['width'],256) and near(title['height'],240),f'title should remain native display size at {wh}: {title}')
        page.locator('#titleCanvas').focus(); page.keyboard.press('Enter'); page.wait_for_timeout(900)
        d=page.evaluate('''()=>{const c=document.querySelector('#game').getBoundingClientRect(),f=document.querySelector('#gameScreen .nes-frame').getBoundingClientRect(),de=document.documentElement;return{cw:c.width,ch:c.height,fw:f.width,fh:f.height,sw:de.scrollWidth,sh:de.scrollHeight,vw:de.clientWidth,vh:de.clientHeight}}''')
        check(not errors,f'page errors {wh}: {errors}')
        check(d['sw']<=d['vw'] and d['sh']<=d['vh'],f'overflow {wh}: {d}')
        check(near(d['cw'],target[0]) and near(d['ch'],target[1]),f'canvas size {wh}: {d}, wanted {target}')
        check(near(d['cw']/d['ch'],256/240,0.001),f'aspect ratio changed {wh}: {d}')
        check(d['cw']<=d['fw']+0.1 and d['ch']<=d['fh']+0.1,f'canvas escaped frame {wh}: {d}')
        check(d['cw']>256 and d['ch']>240,f'board did not enlarge {wh}: {d}')
        page.close()
    browser.close()
print('M16 responsive board gate: PASS (654x639=512x480; desktop cap 2x; mobile viewport-fit; no overflow)')
