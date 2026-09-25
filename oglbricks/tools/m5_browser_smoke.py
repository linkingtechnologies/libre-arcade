"""Offline Chromium checks using injected local assets (browser navigation is restricted here).
This does not claim to test browser loading via HTTP; see smoke_http.py for that check.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, tempfile
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tools'/'out';OUT.mkdir(exist_ok=True)
HTML=(ROOT/'public/index.html').read_text().replace('<script type="module" src="js/app.js"></script>','').replace('<link rel="stylesheet" href="style.css">','<style>'+(ROOT/'public/style.css').read_text()+'</style>')
BUNDLE='\n'.join((ROOT/'public/js'/f).read_text().replace('export const ','const ').replace('export function ','function ').replace('export class ','class ').replace("import { SHAPES } from './shapes.js';",'').replace("import {Game,DEFAULT_SETTINGS,pieceCells,normalizeSettings} from './engine.js';",'').replace("import {SHAPES} from './shapes.js';",'').replace("import {SoundPlayer} from './audio.js';",'') for f in ['shapes.js','engine.js','audio.js','app.js'])
VIEWPORTS=[('desktop',1280,800,False),('phone',390,844,True),('small',320,568,True),('compact',320,480,True),('landscape',667,375,True)]

def boot(context,storage=None,blocked=False):
 page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 page.set_content(HTML)
 if blocked:
  page.evaluate("() => Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Blocked','SecurityError')}})")
 else:
  page.evaluate('''entries => {let data=new Map(entries);window.__testStore=data;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}})}''',list((storage or {}).items()))
 page.add_script_tag(content=BUNDLE)
 return page,errors

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 results=[]
 for name,w,h,mobile in VIEWPORTS:
  context=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,locale='it-IT' if name=='phone' else 'en-US',accept_downloads=True)
  page,errors=boot(context)
  assert page.locator('#new').inner_text()==('Nuova partita' if name=='phone' else 'New game')
  assert page.locator('#statusBar').is_hidden()
  dims=page.evaluate('''() => {const box=x=>{const r=x.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom,r.width,r.height]};return {scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,board:box(document.querySelector('#board')),buttons:['#new','#menu','#save','#load'].map(s=>box(document.querySelector(s))),touch:[...document.querySelectorAll('[data-control]')].map(box)}}''')
  assert dims['scrollW']<=w and dims['scrollH']<=h,(name,'scroll',dims)
  assert dims['board'][4]>125 and dims['board'][5]>90,(name,'board',dims)
  for b in dims['buttons']:
   assert b[0]>=0 and b[2]<=w and b[3]<=h and b[4]>20,(name,'button',b)
  if mobile:
   for b in dims['touch']:assert b[0]>=0 and b[2]<=w and b[1]>=0 and b[3]<=h and b[5]>=40,(name,'touch',b)
  page.screenshot(path=str(OUT/f'{name}.png'))
  page.locator('#menu').click();page.locator('#help').click();assert page.locator('#helpDialog').evaluate('(x)=>x.open')
  page.locator('#closeHelp').click();page.locator('#menu').click();page.locator('#credits').click()
  assert page.locator('#creditsDialog a[href="https://linkingtechnologies.github.io/libre-arcade/"]').count()==1
  page.locator('#closeCredits').click();page.locator('#menu').click();page.locator('#settings').click()
  page.locator('#fieldWidth').fill('50');page.locator('#fieldHeight').fill('50');page.locator('#applySettings').click()
  assert page.locator('#settingsDialog').is_hidden()
  # Exercise the actual keyboard/touch handlers, not just button placement.
  before=page.evaluate('() => game.current.x')
  if mobile:
   page.locator('[data-control=left]').click()
  else:
   page.keyboard.press('ArrowLeft')
  assert page.evaluate('() => game.current.x')==before-1,(name,'horizontal input')
  beforePaused=page.evaluate('() => game.paused')
  page.locator('#pause').click()
  assert page.evaluate('() => game.paused')!=beforePaused,(name,'pause')
  page.locator('#pause').click()
  assert page.evaluate('() => game.paused')==beforePaused,(name,'resume')
  if name=='phone':
   page.locator('#menu').click();page.locator('#language').click();assert page.locator('#new').inner_text()=='New game'
   remembered=page.evaluate('() => Object.fromEntries(window.__testStore)')
   page.close();page,errors=boot(context,remembered)
   assert page.locator('#new').inner_text()=='New game','language remembered'
  if name=='desktop':
   page.keyboard.press('ArrowLeft')
   with page.expect_download() as event:page.locator('#save').click()
   with tempfile.TemporaryDirectory() as tmp:
    file=Path(tmp)/'game.json';event.value.save_as(file);original=json.loads(file.read_text())
    assert original['settings']['width']==50 and original['format']=='oglbricks-libre-arcade'
    page.locator('#new').click();page.locator('#loadFile').set_input_files(str(file))
    assert page.locator('#status').inner_text()=='Game loaded'
    with page.expect_download() as event2:page.locator('#save').click()
    second=Path(tmp)/'loaded.json';event2.value.save_as(second);loaded=json.loads(second.read_text())
    assert loaded['current']['id']==original['current']['id'] and loaded['current']['x']==original['current']['x']
    assert loaded['score']==original['score'] and loaded['board']==original['board']
   page.keyboard.press('ArrowLeft');page.wait_for_timeout(1500)
   remembered=page.evaluate('() => Object.fromEntries(window.__testStore)')
   saved=json.loads(remembered['libre-arcade-oglbricks-save-m2'])
   page.close();page,errors=boot(context,remembered)
   with page.expect_download() as ev:page.locator('#save').click()
   with tempfile.TemporaryDirectory() as tmp:
    f=Path(tmp)/'resumed.json';ev.value.save_as(f);resumed=json.loads(f.read_text())
   assert resumed['score']==saved['score'] and resumed['board']==saved['board'] and resumed['current']['x']==saved['current']['x']
   page.locator('#menu').click();page.once('dialog',lambda dlg:dlg.accept());page.locator('#resetData').click()
   assert page.locator('#menuDialog').is_hidden()
  assert not errors,(name,errors)
  results.append(f'PASS {name} {w}x{h}: no scroll; settings, guide, credits and controls visible; runtime errors=0')
  context.close()
 blockedctx=browser.new_context(locale='it-IT',accept_downloads=True)
 blockedpage,errors=boot(blockedctx,blocked=True)
 blockedpage.wait_for_timeout(1450)
 assert 'Impossibile salvare' in blockedpage.locator('#status').inner_text()
 with blockedpage.expect_download() as ev:blockedpage.locator('#save').click()
 assert ev.value.suggested_filename.endswith('.json') and not errors
 results.append('PASS blocked storage: clear Italian warning and manual JSON download works')
 blockedctx.close();browser.close()
print('\n'.join(results));print(f'PASS ALL: {len(results)} offline Chromium scenarios')
