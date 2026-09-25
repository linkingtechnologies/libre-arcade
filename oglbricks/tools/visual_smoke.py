"""Optional Chromium smoke test; inline local assets to avoid restricted navigation in CI."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'public/index.html').read_text().replace('<script type="module" src="js/app.js"></script>','').replace('<link rel="stylesheet" href="style.css">','<style>'+ (ROOT/'public/style.css').read_text()+'</style>')
BUNDLE='\n'.join((ROOT/'public/js'/f).read_text().replace('export const ','const ').replace('export function ','function ').replace('export class ','class ').replace("import { SHAPES } from './shapes.js';",'').replace("import {Game,DEFAULT_SETTINGS,pieceCells,normalizeSettings} from './engine.js';",'').replace("import {SHAPES} from './shapes.js';",'').replace("import {SoundPlayer} from './audio.js';",'') for f in ['shapes.js','engine.js','audio.js','app.js'])
OUT=Path('/mnt/data/oglbricks-m4-work/screenshots')
OUT.mkdir(parents=True, exist_ok=True)
VIEWPORTS=[('desktop',1280,800,False),('phone',390,844,True),('small-phone',320,568,True),('compact',320,480,True),('landscape',667,375,True)]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files'])
 for name,w,h,touch in VIEWPORTS:
  ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch,device_scale_factor=1,locale='en-US')
  page=ctx.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML); page.add_script_tag(content=BUNDLE); page.wait_for_timeout(120)
  v=page.evaluate('''() => {let r=id=>{const e=document.getElementById(id).getBoundingClientRect();return {x:e.x,y:e.y,w:e.width,h:e.height,right:e.right,bottom:e.bottom}};return {vw:innerWidth,vh:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,board:r('board'),touch:r('boardOverlay'),save:r('save'),load:r('load'),toolbar:r('menu'),controls:[...document.querySelectorAll('[data-control]')].map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom}})}}''')
  assert v['scrollW']<=w and v['scrollH']<=h, (name,'scroll',v)
  assert v['board']['w']>130 and v['board']['h']>100, (name,'board',v)
  for k in ['save','load','toolbar']:
   b=v[k];assert b['x']>=0 and b['right']<=w and b['bottom']<=h and b['w']>0, (name,k,b)
  if touch:
   for b in v['controls']: assert b['x']>=0 and b['right']<=w and b['bottom']<=h, (name,'touch',b)
  assert not errors,(name,errors)
  page.screenshot(path=str(OUT/f'{name}.png'))
  # Open menu, help, credits, settings, test that the game is paused in a dialog.
  page.locator('#menu').click();assert page.locator('#menuDialog').evaluate('(e)=>e.open')
  page.locator('#help').click();assert page.locator('#helpDialog').evaluate('(e)=>e.open')
  assert page.locator('#boardOverlayLabel').inner_text()=='Paused'
  page.locator('#closeHelp').click();assert not page.locator('#boardOverlay').is_visible()
  page.locator('#menu').click();page.locator('#credits').click()
  assert page.locator('#creditsDialog a').count()==1
  assert page.locator('body > .app a').count()==0
  page.locator('#closeCredits').click()
  page.locator('#menu').click();page.locator('#language').click()
  assert page.locator('#new').inner_text()=='Nuova partita'
  assert page.locator('#help').inner_text()=='Come si gioca'
  assert page.locator('#credits').inner_text()=='Riconoscimenti'
  assert page.locator('#language').inner_text()=='English'
  page.locator('#settings').click()
  assert page.locator('#settingsDialog').evaluate('(e)=>e.open')
  assert page.locator('#fieldWidth').input_value()=='20'
  page.locator('#cancelSettings').click()
  assert not page.locator('#boardOverlay').is_visible()
  if name=='desktop':
   page.locator('#save').click()
   # Saving produces a browser download without uploading data to a server.
   assert page.locator('#status').inner_text()=='Partita scaricata'
   snapshot=page.evaluate('() => game.snapshot()')
   import json
   page.locator('#loadFile').set_input_files({'name':'saved-game.json','mimeType':'application/json','buffer':json.dumps(snapshot).encode('utf-8')})
   assert page.locator('#status').inner_text()=='Partita caricata'
  assert not errors,(name,errors)
  print(f'PASS {name} {w}x{h}: scroll=none board={int(v["board"]["w"])}x{int(v["board"]["h"])}; dialogs/IT-EN/credits OK')
  ctx.close()
 it_ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,locale='it-IT')
 it_page=it_ctx.new_page();it_page.set_content(HTML);it_page.add_script_tag(content=BUNDLE)
 assert it_page.locator('#new').inner_text()=='Nuova partita'
 assert it_page.locator('#statusBar').is_hidden()
 it_page.locator('#menu').click();assert it_page.locator('#help').inner_text()=='Come si gioca'
 print('PASS it-IT browser locale: Italian selected by default')
 it_ctx.close()
 browser.close()
