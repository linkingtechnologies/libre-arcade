"""Player-facing UI smoke test; inline static assets for restricted test browsers."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'public/index.html').read_text().replace('<script type="module" src="js/app.js"></script>','').replace('<link rel="stylesheet" href="style.css">','<style>'+(ROOT/'public/style.css').read_text()+'</style>')
bundle='\n'.join((ROOT/'public/js'/f).read_text().replace('export const ','const ').replace('export function ','function ').replace('export class ','class ').replace("import { SHAPES } from './shapes.js';",'').replace("import {Game,DEFAULT_SETTINGS,pieceCells,normalizeSettings} from './engine.js';",'').replace("import {SHAPES} from './shapes.js';",'') for f in ['shapes.js','engine.js','app.js'])
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':844},locale='it-IT')
    page.set_content(html)
    page.evaluate('''() => { const store=new Map();window.__mockStore=store;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});}''')
    page.add_script_tag(content=bundle)
    assert page.locator('#new').inner_text()=='Nuova partita'
    assert page.locator('#statusBar').is_hidden()
    page.locator('#menu').click()
    assert page.locator('#resetData').inner_text()=='Ricomincia da zero'
    assert not page.locator('#creditsDialog').evaluate('(e)=>e.open')
    page.locator('#help').click()
    assert 'questa versione web' not in page.locator('#helpDialog').inner_text().lower()
    assert page.locator('#resetData').is_hidden()
    page.locator('#closeHelp').click()
    page.locator('#save').click()
    assert page.evaluate("() => [...window.__mockStore.keys()].some(x=>x.includes('oglbricks-save'))")
    page.locator('#menu').click()
    page.once('dialog',lambda dialog:dialog.accept())
    page.locator('#resetData').click()
    assert not page.evaluate("() => [...window.__mockStore.keys()].some(x=>x.includes('oglbricks-save'))")
    assert page.locator('#menuDialog').is_hidden()
    page.locator('#menu').click();page.locator('#credits').click()
    assert page.locator('#creditsDialog a').count()==1 and 'Libre Arcade' in page.locator('#creditsDialog a').inner_text()
    print('PASS: Italian launch without startup status, simplified help, confirmed reset, Credits-only attribution.')
    browser.close()
