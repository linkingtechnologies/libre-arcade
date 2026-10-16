#!/usr/bin/env python3
from pathlib import Path
import json, re
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
CSS=(ROOT/'src/style.css').read_text()
WIT=[json.loads((ROOT/'tests'/'witnesses'/f'level{n:02d}.json').read_text()) for n in range(1,51)]
PASSWORDS=[]
# Read the production level/password JS in the browser; no duplicate source of truth here.

# Managed Chromium blocks file:// and localhost in this environment. Build a test-only
# in-memory page from the exact production files. app.js gets a closure-local QA hook;
# the shipped app.js is not modified by this harness.
HTML=HTML.replace('<link rel="stylesheet" href="src/style.css">','<style>'+CSS+'</style>')
srcs=re.findall(r'<script src="([^"]+)"></script>',HTML)
HTML=re.sub(r'<script src="[^"]+"></script>','',HTML)
shim=r'''<script>
const __store=Object.create(null);
const localStorage={
  getItem(k){k=String(k);return Object.prototype.hasOwnProperty.call(__store,k)?__store[k]:null},
  setItem(k,v){k=String(k);v=String(v);__store[k]=v;this[k]=v},
  removeItem(k){k=String(k);delete __store[k];delete this[k]},
  key(i){return Object.keys(__store)[i]??null},
  get length(){return Object.keys(__store).length}
};
window.requestAnimationFrame=()=>0;
</script>'''
parts=[]
for src in srcs:
    text=(ROOT/src).read_text()
    if src=='src/app.js':
        marker='updateLang();fresh();'
        hook=r'''globalThis.__LM_M14__={
  state,
  tick(n=1){for(let i=0;i<n;i++)fixedTick()},
  drive(target,max=2000){for(let i=0;i<max&&state.screen!==target;i++)fixedTick();return state.screen},
  snapshot(){return {screen:state.screen,menuMode:state.menuMode,menuSelection:state.menuSelection,levelIndex:state.levelIndex,gameTime:state.gameTime,seed:state.seed,onlineDisplay:state.onlineDisplay,cursor:{...state.cursor}}},
  board(){const out=[];for(let y=0;y<12;y++)for(let x=0;x<12;x++)out.push(state.map[(y+1)*16+(x+1)]);return out},
  setWitness(board){for(let y=0;y<12;y++)for(let x=0;x<12;x++)state.map[(y+1)*16+(x+1)]=board[y*12+x];state.displayMap=null;state.pending=null;state.traceCountdown=0;drawGame()},
  rotationPlan(board){const p=[];for(let y=0;y<12;y++)for(let x=0;x<12;x++){const off=(y+1)*16+(x+1),cur=state.map[off],dst=board[y*12+x];let turns=-1;for(let t=0;t<4;t++)if(C.rotate(cur,t)===dst){turns=t;break}if(turns<0)throw new Error(`no rotation match ${x},${y}: ${cur}->${dst}`);if(turns)p.push({x,y,turns})}return p},
  nextCode, currentCode, beginMenuFadeIn,
  passwords:P.slice(), endingCode:END,
  audio(){return {sfx:state.sfx,bgm:state.bgm}}
};
'''
        if marker not in text: raise RuntimeError('app hook marker not found')
        text=text.replace(marker,hook+marker,1)
    parts.append('<script>'+text+'</script>')
HTML=HTML.replace('</body>',shim+''.join(parts)+'</body>')

def assert_(v,msg):
    if not v: raise AssertionError(msg)

def boot(page):
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(HTML,wait_until='load')
    page.evaluate('__LM_M14__.tick(16)')
    s=page.evaluate('__LM_M14__.snapshot()')
    assert_(s['screen']=='menu',f'boot did not reach menu: {s}')
    return errors

def drive(page,target,max_ticks=2000):
    got=page.evaluate('([t,m])=>__LM_M14__.drive(t,m)',[target,max_ticks])
    assert_(got==target,f'drive expected {target}, got {got}')

def enter_passcode(page,code):
    # Return to a fresh title menu using production transition code, then use real DOM input.
    page.evaluate('__LM_M14__.beginMenuFadeIn()')
    drive(page,'menu',64)
    page.locator('#titleCanvas').focus()
    page.keyboard.press('ArrowDown')
    page.keyboard.press('Enter')
    assert_(page.locator('#codeInput').is_visible(),'passcode input not visible')
    page.locator('#codeInput').fill(code)
    page.keyboard.press('Enter')

def start_level_by_number(page,n):
    if n==1:
        page.evaluate('__LM_M14__.beginMenuFadeIn()'); drive(page,'menu',64)
        page.locator('#titleCanvas').focus(); page.keyboard.press('Enter')
    else:
        pw=page.evaluate('(n)=>__LM_M14__.passwords[n-2]',n)
        enter_passcode(page,pw)
    drive(page,'playing',400)
    got=page.evaluate('__LM_M14__.state.levelIndex+1')
    assert_(got==n,f'level launch expected {n}, got {got}')

def rotate_via_real_controls(page,witness,use_buttons=False):
    plan=page.evaluate('(w)=>__LM_M14__.rotationPlan(w)',witness)
    canvas=page.locator('#game')
    box=canvas.bounding_box(); assert_(box is not None,'game canvas missing bounding box')
    for op in plan:
        # Select the tile through the production pointer handler.
        px=(32+op['x']*16+8)/256*box['width']
        py=(32+op['y']*16+8)/240*box['height']
        canvas.click(position={'x':px,'y':py})
        if use_buttons:
            act={1:'a',2:'select',3:'b'}[op['turns']]
            page.locator(f'[data-act="{act}"]').click()
        else:
            key={1:'z',2:'Shift',3:'x'}[op['turns']]
            page.keyboard.press(key)
        page.evaluate('__LM_M14__.tick(1)')
    # The exact final rotation may occur between 25-frame trace probes.
    drive(page,'clear',160)
    return len(plan)

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])

    # Gate A: all 49 historical level passcodes + ending passcode through the real input path.
    page=browser.new_page(viewport={'width':1280,'height':960})
    errors=boot(page)
    passwords=page.evaluate('__LM_M14__.passwords')
    assert_(len(passwords)==49 and len(set(passwords))==49,'passcodes must be 49 unique values')
    assert_(all(len(x)==4 and x.isdigit() for x in passwords),'passcodes must be four digits')
    for idx,code in enumerate(passwords, start=2):
        enter_passcode(page,code)
        drive(page,'playing',400)
        got=page.evaluate('__LM_M14__.state.levelIndex+1')
        assert_(got==idx,f'passcode {code} expected level {idx}, got {got}')
    enter_passcode(page,page.evaluate('__LM_M14__.endingCode'))
    drive(page,'ending',160)
    assert_(page.locator('#endingScreen').is_visible(),'ending code did not open ending')
    assert_(not errors,f'passcode gate page errors: {errors}')
    page.close()

    # Gate B: a complete 1 -> 50 campaign. Each level is placed in its independently
    # certified solved orientation, then the *production* trace/clear/hide/reveal state
    # machine advances it naturally to the next stage and final ending.
    page=browser.new_page(viewport={'width':1280,'height':960})
    errors=boot(page)
    page.locator('#titleCanvas').focus(); page.keyboard.press('Enter'); drive(page,'playing',400)
    for n,witness in enumerate(WIT,start=1):
        got=page.evaluate('__LM_M14__.state.levelIndex+1')
        assert_(got==n,f'campaign expected level {n}, got {got}')
        page.evaluate('(w)=>__LM_M14__.setWitness(w)',witness)
        page.evaluate('__LM_M14__.tick(1)')
        drive(page,'clear',160)
        expected=(page.evaluate('(i)=>__LM_M14__.passwords[i]',n-1) if n<50 else page.evaluate('__LM_M14__.endingCode'))
        shown=page.evaluate('__LM_M14__.nextCode()')
        assert_(shown==expected,f'level {n} next code mismatch: {shown} != {expected}')
        page.keyboard.press('Enter')
        if n<50: drive(page,'playing',400)
        else: drive(page,'ending',160)
    assert_(page.locator('#endingScreen').is_visible(),'campaign did not finish at ending')
    page.click('#endingMenu'); drive(page,'menu',64)
    assert_(page.locator('#menuScreen').is_visible(),'ending -> menu failed')
    assert_(not errors,f'campaign page errors: {errors}')
    page.close()

    # Gate C: solve representative levels with actual player actions. Levels 11/25/50
    # cover self-rotation eras and increasingly aggressive timers; every logical change
    # is made by the production pointer + keyboard/control event path, not by map injection.
    desktop_counts={}
    page=browser.new_page(viewport={'width':1280,'height':960})
    errors=boot(page)
    for n in (1,11,25,50):
        start_level_by_number(page,n)
        desktop_counts[n]=rotate_via_real_controls(page,WIT[n-1],use_buttons=False)
        if n==50:
            page.keyboard.press('Enter'); drive(page,'ending',160)
        else:
            page.evaluate('__LM_M14__.beginMenuFadeIn()'); drive(page,'menu',64)
    assert_(not errors,f'desktop control-solve page errors: {errors}')
    page.close()

    # Gate D: mobile/touch-emulated solve using the visible on-screen A/B/SEL buttons.
    ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    page=ctx.new_page(); errors=boot(page)
    start_level_by_number(page,11)
    mobile_count=rotate_via_real_controls(page,WIT[10],use_buttons=True)
    dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,cw:document.documentElement.clientWidth,ch:document.documentElement.clientHeight})')
    assert_(dims['sw']<=dims['cw'] and dims['sh']<=dims['ch'],f'mobile overflow: {dims}')
    assert_(not errors,f'mobile control-solve page errors: {errors}')
    page.close(); ctx.close()

    # Gate E: language/settings behavior with actual DOM controls and scoped reset.
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=boot(page)
    page.click('#langButton')
    assert_(page.evaluate('localStorage.getItem("lanmaster.lang")')=='it','language preference not persisted')
    page.click('#creditsButton'); page.click('#resetDataButton')
    assert_(page.evaluate('localStorage.getItem("lanmaster.lang")') is None,'reset did not remove scoped language preference')
    assert_(page.locator('#langButton').inner_text()=='IT','reset did not restore English UI')
    assert_(not errors,f'settings page errors: {errors}')
    page.close()

    browser.close()

print('M14 playability gate: PASS')
print('passcodes: 49/49 + ending code')
print('campaign: 50/50 levels -> ending -> menu')
print('desktop real-control solved levels:', ', '.join(f'L{k} ({v} rotations)' for k,v in desktop_counts.items()))
print(f'mobile on-screen-control solved: L11 ({mobile_count} rotations)')
print('settings/language/reset: PASS')
