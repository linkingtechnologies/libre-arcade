"""Chromium audio and UI tests with injected local assets (HTTP navigation unavailable here)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'public/index.html').read_text().replace('<script type="module" src="js/app.js"></script>','').replace('<link rel="stylesheet" href="style.css">','<style>'+(ROOT/'public/style.css').read_text()+'</style>')
BUNDLE='\n'.join((ROOT/'public/js'/f).read_text().replace('export const ','const ').replace('export function ','function ').replace('export class ','class ').replace("import { SHAPES } from './shapes.js';",'').replace("import {Game,DEFAULT_SETTINGS,pieceCells,normalizeSettings} from './engine.js';",'').replace("import {SHAPES} from './shapes.js';",'').replace("import {SoundPlayer} from './audio.js';",'') for f in ['shapes.js','engine.js','audio.js','app.js'])

def boot(context,storage=None):
 p=context.new_page();errors=[];p.on('pageerror',lambda err:errors.append(str(err)))
 p.set_content(HTML)
 p.evaluate('''entries => {let data=new Map(entries);window.__testStore=data;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}});
 const Real=window.AudioContext;window.__soundAudit={starts:0,contexts:[]};window.AudioContext=class extends Real {constructor(...args){super(...args);window.__soundAudit.contexts.push(this);}createOscillator(){const o=super.createOscillator(),start=o.start.bind(o);o.start=(...args)=>{window.__soundAudit.starts++;return start(...args)};return o;}};}''',list((storage or {}).items()))
 p.add_script_tag(content=BUNDLE)
 return p,errors

results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=user-gesture-required'])
 for width,height,locale in [(1280,800,'en-US'),(320,480,'it-IT'),(390,844,'it-IT'),(667,375,'en-US')]:
  context=browser.new_context(viewport={'width':width,'height':height},locale=locale,is_mobile=width<800,has_touch=width<800)
  page,errors=boot(context)
  assert page.locator('#sound').get_attribute('aria-pressed')=='true'
  assert page.locator('#sound').get_attribute('aria-label')==('Suoni attivi. Premi per disattivarli' if locale=='it-IT' else 'Sounds on. Select to mute')
  dims=page.evaluate('''() => {const b=document.querySelector('#sound').getBoundingClientRect();return {scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,button:[b.left,b.top,b.right,b.bottom]}}''')
  assert dims['scrollW']<=width and dims['scrollH']<=height,(width,height,dims)
  assert dims['button'][0]>=0 and dims['button'][2]<=width and dims['button'][3]<=height,(width,height,dims)
  page.locator('#new').click();page.wait_for_timeout(220)
  state=page.evaluate('''() => ({starts:window.__soundAudit.starts,contexts:window.__soundAudit.contexts.length,status:window.__soundAudit.contexts[0]?.state})''')
  assert state['starts']>=2 and state['contexts']==1 and state['status']=='running',(width,height,state)
  page.locator('#sound').click()
  assert page.locator('#sound').get_attribute('aria-pressed')=='false'
  assert page.locator('#sound').get_attribute('aria-label')==('Suoni disattivati. Premi per attivarli' if locale=='it-IT' else 'Sounds off. Select to turn on')
  n=page.evaluate('window.__soundAudit.starts');page.locator('#new').click();page.wait_for_timeout(100)
  assert page.evaluate('window.__soundAudit.starts')==n,'Muted game must schedule zero oscillators'
  saved=page.evaluate('Object.fromEntries(window.__testStore)')
  page.close();page,errs2=boot(context,saved)
  assert page.locator('#sound').get_attribute('aria-pressed')=='false','Muted preference survives app restart'
  page.locator('#sound').click();page.wait_for_timeout(160)
  assert page.locator('#sound').get_attribute('aria-pressed')=='true'
  assert page.evaluate('window.__soundAudit.starts')>0,'Unmute click must play an audible preview'
  assert page.evaluate('JSON.parse(localStorage.getItem("libre-arcade-oglbricks-sound"))') is True
  page.locator('#menu').click();page.locator('#help').click()
  assert page.locator('#helpDialog').inner_text().find('altoparlante' if locale=='it-IT' else 'speaker')>=0
  assert not errors and not errs2,(width,height,errors,errs2)
  results.append(f'PASS {width}x{height} {locale}: Web Audio running, playback starts, mute suppresses, unmute previews, preference and bilingual Help OK; no scroll or JS errors')
  context.close()
 # Render actual synthesized PCM, with and without the master mute gain.
 context=browser.new_context();page,errors=boot(context)
 measurements=page.evaluate('''async () => {const out={};
  for(const name of SOUND_EVENTS){
   const render=async(muted)=>{const c=new OfflineAudioContext(1,48000,48000),master=c.createGain();master.gain.value=muted?0:.11;master.connect(c.destination);scheduleEffect(c,master,name,0);const a=(await c.startRendering()).getChannelData(0);let peak=0,energy=0;for(let i=0;i<a.length;i++){const x=Math.abs(a[i]);peak=Math.max(peak,x);energy+=x*x;}return {peak,rms:Math.sqrt(energy/a.length)};};
   out[name]={on:await render(false),off:await render(true)};
  }return out; }''')
 for kind,v in measurements.items():
  assert v['on']['peak']>.005 and v['on']['rms']>.001,(kind,v)
  assert v['off']['peak']==0 and v['off']['rms']==0,(kind,v)
 assert not errors,errors
 results.append('PASS OfflineAudioContext PCM: 7/7 sound effects generate nonzero signal and the muted master produces exactly zero samples')
 context.close();browser.close()
print('\n'.join(results));print('PASS ALL',len(results),'scenarios')
