#!/usr/bin/env python3
"""Chromium rendering/input release gate; never substitutes production logic.
Managed runners may block both local HTTP and file://: if so embed exactly the
same seven script payloads and CSS into a document, explicitly report fallback.
Physical Android/iOS and direct hosted-file acceptance are NOT inferred.
"""
from pathlib import Path
import subprocess,time,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
WEB=ROOT/'public'
html=(WEB/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+(WEB/'style.css').read_text(encoding='utf-8')+'\n</style>')
for f in ['data/playfield.js','js/physics.js','js/camera.js','js/audio.js','js/visuals.js','js/i18n.js','js/comet.js']:
    html=html.replace(f'<script src="{f}"></script>', '<script>\n'+(WEB/f).read_text(encoding='utf-8')+'\n</script>')
# Embedded-script fallback in managed Chromium must also use the real, bundled
# recording (not a mocked audio API or synthesized replacement).
for ext,mime in [('ogg','audio/ogg'),('mp3','audio/mpeg')]:
    rel=f'assets/music/comet-loop.{ext}'
    uri=f'data:{mime};base64,'+base64.b64encode((WEB/rel).read_bytes()).decode('ascii')
    html=html.replace(f'src="{rel}"',f'src="{uri}"')
shots=ROOT/'reports'/'browser-generated';shots.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['python3','-m','http.server','8879','--bind','127.0.0.1'],cwd=WEB,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--disable-background-networking'])
  errors=[]
  context=browser.new_context(viewport={'width':1280,'height':960},locale='it-IT')
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  mode=''
  for kind,url in [('served HTTP','http://127.0.0.1:8879/index.html'),('direct file', (WEB/'index.html').as_uri())]:
   try:
    page.goto(url,wait_until='domcontentloaded',timeout=5000)
    page.locator('#startGame').wait_for(timeout=1200)
    mode=kind;break
   except Exception as e:
    print(f'{kind} unavailable: {str(e).splitlines()[0]}')
  if not mode:
   page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html,wait_until='domcontentloaded')
   page.locator('#startGame').wait_for(timeout=5000)
   mode='same script/CSS payloads inline in Chromium (NOT hosted or file navigation)'
  print('BROWSER MODE:',mode)
  page.screenshot(path=str(shots/'desktop-menu.png'))
  page.locator('#showCredits').click()
  assert page.get_by_text('Patrick Haring e Christian Bürgi').is_visible()
  assert page.get_by_text('Mechanical Night loop · CC0 1.0').is_visible()
  assert page.locator('.credits-content a[href="https://linkingtechnologies.github.io/libre-arcade/"]').is_visible()
  assert page.locator('.credits-content a[href="https://linkingtechnologies.github.io/libre-arcade/"]').get_attribute('rel')=='noopener noreferrer'
  assert page.locator('.credits-content a[href="https://github.com/boskoop/comet-pinball"]').get_attribute('href')=='https://github.com/boskoop/comet-pinball'
  page.screenshot(path=str(shots/'desktop-credits.png'))
  page.locator('#backCredits').click();assert page.locator('#startGame').is_visible()
  page.locator('#startGame').click();page.wait_for_timeout(220)
  assert page.locator('#game').is_visible()
  # GIOCA is a real user gesture: the soundtrack should start without another
  # click, and music volume must remain independent from synthesized effects.
  page.wait_for_timeout(900)
  music_state=page.locator('#musicTrack').evaluate('(e)=>({paused:e.paused,time:e.currentTime,ready:e.readyState,volume:e.volume,src:e.currentSrc})')
  print('MUSIC STATE after GIOCA:',{k:v for k,v in music_state.items() if k!='src'})
  assert not music_state['paused'] and music_state['time']>.1 and music_state['ready']>=2,music_state
  assert page.locator('#musicBtn').get_attribute('aria-pressed')=='true'
  page.locator('#musicVolume').fill('35')
  assert abs(page.locator('#musicTrack').evaluate('(e)=>e.volume')-.35)<.001
  page.locator('#soundBtn').click();assert page.locator('#soundBtn').get_attribute('aria-pressed')=='false'
  assert not page.locator('#musicTrack').evaluate('(e)=>e.paused'),'SFX toggle must not mute music'
  page.locator('#soundBtn').click();assert page.locator('#soundBtn').get_attribute('aria-pressed')=='true'
  page.screenshot(path=str(shots/'desktop-play.png'))
  page.keyboard.down('ArrowLeft');page.keyboard.down('ArrowRight');page.wait_for_timeout(180)
  page.keyboard.up('ArrowLeft');page.keyboard.up('ArrowRight')
  page.keyboard.press('Space');page.wait_for_timeout(350)
  assert page.locator('#ballText').inner_text().strip()=='1 / 3'
  page.locator('#viewBtn').click();assert page.locator('#viewBtn').get_attribute('aria-pressed')=='true'
  page.locator('#viewBtn').click();assert page.locator('#viewBtn').get_attribute('aria-pressed')=='false'
  page.locator('#soundBtn').click();assert page.locator('#soundBtn').get_attribute('aria-pressed')=='false'
  page.locator('#soundBtn').click();assert page.locator('#soundBtn').get_attribute('aria-pressed')=='true'
  page.locator('#musicBtn').click();assert page.locator('#musicBtn').get_attribute('aria-pressed')=='false'
  assert page.locator('#musicTrack').evaluate('(e)=>e.paused')
  page.locator('#musicBtn').click();assert page.locator('#musicBtn').get_attribute('aria-pressed')=='true'
  page.wait_for_timeout(180);assert not page.locator('#musicTrack').evaluate('(e)=>e.paused')
  page.locator('#pauseBtn').click();assert page.get_by_text('IN PAUSA').is_visible()
  page.wait_for_timeout(150);assert page.locator('#musicTrack').evaluate('(e)=>e.paused')
  page.locator('#resetBtn').click();assert page.get_by_text('Nuova partita?').is_visible()
  assert page.locator('#confirmForfeit').count()==0
  page.locator('#cancelRestart').click();assert page.get_by_text('IN PAUSA').is_visible()
  page.locator('#menuBtn').click();assert page.get_by_text('Uscire dalla partita?').is_visible()
  page.locator('#cancelMenu').click();assert page.get_by_text('IN PAUSA').is_visible()
  page.locator('#resumeGame').click();assert not page.locator('#overlay').evaluate('(e)=>e.classList.contains("show")')
  page.wait_for_timeout(150);assert not page.locator('#musicTrack').evaluate('(e)=>e.paused')
  page.locator('#menuBtn').click();assert page.get_by_text('Uscire dalla partita?').is_visible()
  page.locator('#yesMenu').click();assert page.locator('#startGame').is_visible()
  # Four responsive layouts, including short-screen pause/confirm controls.
  for w,h in [(1280,960),(390,844),(390,667),(320,568)]:
   page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(90)
   overflow=page.evaluate('({w:document.documentElement.scrollWidth-innerWidth,h:document.documentElement.scrollHeight-innerHeight})')
   assert overflow['w']<=1 and overflow['h']<=1,(w,h,overflow)
   if w<=390:
    assert page.locator('#leftBtn').is_visible() and page.locator('#rightBtn').is_visible() and page.locator('#plungeBtn').is_visible()
   page.locator('#showCredits').click()
   assert page.locator('#backCredits').is_visible()
   if (w,h)==(390,844):page.screenshot(path=str(shots/'mobile-credits-390x844.png'))
   if (w,h)==(320,568):page.screenshot(path=str(shots/'mobile-credits-320x568.png'))
   credit_overflow=page.evaluate('({w:document.documentElement.scrollWidth-innerWidth,h:document.documentElement.scrollHeight-innerHeight})')
   assert credit_overflow['w']<=1 and credit_overflow['h']<=1,(w,h,credit_overflow)
   page.locator('#backCredits').click();assert page.locator('#startGame').is_visible()
   page.locator('#startGame').click();page.locator('#pauseBtn').click()
   for control in ('resumeGame','forfeitBall'):
    r=page.locator('#'+control).bounding_box()
    assert r and r['y']>=0 and r['y']+r['height']<=h,(w,h,control,r)
   page.locator('#resumeGame').click()
   if w==390 and h==844:page.screenshot(path=str(shots/'mobile-390x844.png'))
   if w==320 and h==568:page.screenshot(path=str(shots/'mobile-320x568.png'))
   page.locator('#menuBtn').click();page.locator('#yesMenu').click()
   print('VIEWPORT PASS:',w,h,'overflow',overflow)
  # Chromium touch emulation is not equivalent to a physical touchscreen.
  touch=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2,locale='it-IT')
  t=touch.new_page();t.on('pageerror',lambda e:errors.append(str(e)))
  t.set_content(html,wait_until='domcontentloaded');assert t.locator('#viewBtn').get_attribute('aria-pressed')=='true';t.locator('#startGame').tap()
  t.locator('#plungeBtn').tap();t.locator('#leftBtn').tap();t.locator('#rightBtn').tap()
  t.locator('#pauseBtn').tap();assert t.get_by_text('IN PAUSA').is_visible()
  t.locator('#resumeGame').tap()
  assert t.locator('#game').is_visible()
  # Simultaneous real CDP touch points on both flipper surfaces.
  l=t.locator('#leftBtn').bounding_box();r=t.locator('#rightBtn').bounding_box()
  xy=lambda b:{'x':round(b['x']+b['width']/2),'y':round(b['y']+b['height']/2)}
  session=t.context.new_cdp_session(t)
  left={'x':xy(l)['x'],'y':xy(l)['y'],'id':11};right={'x':xy(r)['x'],'y':xy(r)['y'],'id':12}
  session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[left]})
  session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[left,right]})
  t.wait_for_timeout(150)
  session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  t.wait_for_timeout(90);assert t.locator('#game').is_visible()
  print('TOUCH-EMULATED PASS: launch, left/right, simultaneous two-finger flipper touch, pause/resume')
  assert not errors,errors
  print('PASS COMET CHROMIUM browser gate; pageerrors:',len(errors),'screenshots:',shots)
  touch.close();context.close();browser.close()
finally:
 server.terminate();server.wait(timeout=5)
