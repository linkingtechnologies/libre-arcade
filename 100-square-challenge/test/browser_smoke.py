"""Local-only smoke checks. Requires playwright and a Chromium browser installed."""
from pathlib import Path
import re
import csv
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
html = (PUBLIC/'index.html').read_text()
css = (PUBLIC/'styles.css').read_text()
js_game = (PUBLIC/'src/game.js').read_text().replace('export ', '')
js_i18n = (PUBLIC/'src/i18n.js').read_text().replace('export ', '')
js_sound = (PUBLIC/'src/sound.js').read_text().replace('export ', '')
js_app = (PUBLIC/'src/app.js').read_text()
js_app = re.sub(r'^import .*?;\n', '', js_app, flags=re.MULTILINE|re.DOTALL)
inline_script = '\n'.join([js_game, js_i18n, js_sound, js_app])
html = html.replace('<link rel="stylesheet" href="./styles.css">', '<style>'+css+'</style>')
html = html.replace('<script type="module" src="./src/app.js"></script>', '<script type="module">'+inline_script+'</script>')
# Inject a deterministic Web Audio double before app initialization. The shipping page is unmodified.
audio_mock = '''<script>
window.__audioNotes = [];
window.__audioCreated = 0;
window.AudioContext = class {
  constructor() { window.__audioCreated++; this.currentTime=0; this.destination={}; }
  resume() { return Promise.resolve(); }
  createOscillator() { return { frequency:{setValueAtTime(){}}, connect(){}, disconnect(){}, start(t){window.__audioNotes.push(t);}, stop(){}, type:'sine' }; }
  createGain() { return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}; }
};
</script>'''
html = html.replace('<script type="module">', audio_mock+'<script type="module">',1)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    for name, width, height, language in [('desktop',1280,800,'en-US'),('phone',375,667,'it-IT'),('tiny-phone',320,568,'en-US'),('short-phone',320,480,'en-US'),('landscape',740,360,'en-US'),('short-landscape',800,320,'en-US')]:
        context = browser.new_context(viewport={'width':width, 'height':height}, locale=language, is_mobile=name in ('phone','tiny-phone'), has_touch=name in ('phone','tiny-phone'))
        page = context.new_page()
        errors=[]
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.set_content(html, wait_until="load")
        assert page.locator('#sound-button').get_attribute('aria-pressed') == 'false'
        assert page.evaluate('window.__audioCreated') == 0
        assert page.locator('.menu-caption').inner_text() == ('Fin dove riesci ad arrivare?' if language=='it-IT' else 'How far can you get?')
        page.locator('#play-button').click()
        assert page.locator('#dialog-backdrop').is_visible(), name
        assert page.locator('#dialog-backdrop').get_attribute('data-intro') == 'true', name
        assert page.locator('#dialog-title').inner_text() == ('Come si gioca' if language=='it-IT' else 'How to play'), name
        assert page.locator('#dialog-done').inner_text() == ('Inizia a giocare' if language=='it-IT' else 'Start playing'), name
        assert page.locator('#score').inner_text() == '0', name
        assert page.locator('#dialog-close').evaluate('(el) => document.activeElement === el'), name
        page.locator('#dialog-done').click()
        assert page.locator('#dialog-backdrop').is_hidden(), name
        assert page.locator('#board .cell').nth(0).evaluate('(el) => document.activeElement === el'), name
        page.wait_for_timeout(140)
        state = page.evaluate('''() => ({
           lang:document.documentElement.lang,
           buttonCount:document.querySelectorAll('#board button').length,
           boardRect:(() => {const r=document.querySelector('#board').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}})(),
           viewportH:window.innerHeight, viewportW:window.innerWidth,
           fullHeight:document.documentElement.scrollHeight, fullWidth:document.documentElement.scrollWidth,
           actionsBottom:document.querySelector('.game-actions').getBoundingClientRect().bottom,
           score:document.querySelector('#score').textContent
        })''')
        assert not errors, f'{name}: JS errors {errors}'
        assert state['buttonCount']==100, (name,state)
        assert abs(state['boardRect']['w']-state['boardRect']['h']) < 1, (name,state)
        assert state['boardRect']['b'] <= height+1, (name,state)
        assert state['actionsBottom'] <= height+1, (name,state)
        assert state['fullHeight'] <= height+1, (name,state)
        assert state['fullWidth'] <= width+1, (name,state)
        assert state['lang'] == ('it' if language=='it-IT' else 'en'), (name,state)
        assert state['score']=='0', (name,state)
        assert page.locator('#undo-button').is_disabled(), name
        # Keyboard focus roves across 100 cells while only highlighted cells are accepted.
        page.locator('#board .cell').nth(0).focus()
        page.keyboard.press('ArrowRight')
        assert page.locator('#board .cell').nth(1).evaluate('(el) => document.activeElement === el')
        page.keyboard.press('Enter') # non-knight target: ignored
        assert page.locator('#score').inner_text() == '0'
        page.keyboard.press('ArrowLeft')
        assert page.locator('#board .cell').nth(0).evaluate('(el) => document.activeElement === el')
        page.keyboard.press('Enter') # valid first move
        assert page.locator('#score').inner_text() == '1'
        assert page.locator('#board .cell.available').count() == 2
        assert page.evaluate('window.__audioNotes.length') == 0  # Sound defaults off even after moves.
        page.locator('#sound-button').click()
        assert page.locator('#sound-button').get_attribute('aria-pressed') == 'true'
        assert page.evaluate('window.__audioCreated') == 1
        if name=='phone':
            page.locator('#board .cell').nth(21).tap() # actual touch event in mobile emulation
        else:
            page.locator('#board .cell').nth(21).click() # (1,2)
        assert page.locator('#score').inner_text() == '2'
        assert page.evaluate('window.__audioNotes.length') == 1  # Exactly one gentle move tone.
        page.locator('#sound-button').click()
        assert page.locator('#sound-button').get_attribute('aria-pressed') == 'false'
        assert page.locator('#board .cell.available').count() == 5
        page.locator('#undo-button').click()
        assert page.locator('#score').inner_text() == '1'
        assert page.locator('#undo-button').is_disabled()
        # Undoing the first move must re-offer (0,0), not a knight target.
        page.locator('#new-button').click()
        assert page.locator('#score').inner_text() == '0'
        assert page.locator('#undo-button').is_disabled()
        page.locator('#board .cell').nth(0).click()
        page.locator('#undo-button').click()
        assert page.locator('#score').inner_text() == '0'
        assert page.locator('#board .cell.available').count() == 1
        assert page.locator('#board .cell').nth(0).get_attribute('class').find('available') >= 0
        assert page.locator('#undo-button').is_disabled()
        # Return to the menu does not reset the in-progress board.
        page.locator('#board .cell').nth(0).click()
        page.locator('#back-button').click()
        page.locator('#play-button').click()
        assert page.locator('#dialog-backdrop').is_hidden(), name  # first-play help only
        assert page.locator('#score').inner_text() == '1' # original reuses board
        page.locator('#help-button').click()
        assert page.locator('#dialog-title').inner_text() == ('Come si gioca' if language=='it-IT' else 'How to play')
        assert page.locator('#dialog-done').inner_text() == ('Chiudi' if language=='it-IT' else 'Close')
        page.keyboard.press('Escape')
        assert page.locator('#dialog-backdrop').is_hidden()
        page.locator('#credits-button').click()
        assert page.locator('#dialog-backdrop').is_visible()
        assert 'defects' not in page.locator('#dialog-backdrop').inner_text().lower()
        assert 'difetti' not in page.locator('#dialog-backdrop').inner_text().lower()
        assert page.locator('#dialog-links [data-i18n="sourceLink"]').inner_text() == ('Sorgenti e note legali ↗' if language=='it-IT' else 'Source code & notices ↗')
        page.keyboard.press('Escape')
        assert page.locator('#dialog-backdrop').is_hidden()
        page.locator('#lang-button').click()
        assert page.locator('html').get_attribute('lang') == ('en' if language=='it-IT' else 'it')
        assert page.locator('#sound-button').get_attribute('aria-label') == ('Turn sound on' if language=='it-IT' else 'Attiva audio')
        page.locator('#lang-button').click()
        assert page.locator('html').get_attribute('lang') == state['lang']
        if name=='desktop':
            def witness_csv(name, end=100):
                with (ROOT/'test'/'fixtures'/name).open(newline='') as fp:
                    rows=list(csv.DictReader(fp))
                if name.startswith('hamiltonian'):
                    rows=[r for r in rows if r['start_x']=='0' and r['start_y']=='0']
                return [int(r['y'])*10+int(r['x']) for r in rows[:end]]
            # A UI-level complete game: every click passes through DOM events.
            page.locator('#new-button').click()
            completed=witness_csv('hamiltonian_witnesses.csv')
            assert len(completed) == 100
            page.locator('#sound-button').click()
            assert page.locator('#sound-button').get_attribute('aria-pressed') == 'true'
            page.evaluate('window.__audioNotes.length = 0')
            page.evaluate('''path => { for (const i of path) document.querySelectorAll('#board .cell')[i].click(); }''',completed)
            assert page.locator('#score').inner_text() == '100'
            assert page.evaluate('window.__audioNotes.length') == 102  # 99 move tones + 3 victory tones.
            page.locator('#sound-button').click()  # Silence the next board reset.
            assert page.locator('#sound-button').get_attribute('aria-pressed') == 'false'
            assert page.locator('#board .cell.available').count() == 0
            assert '100' in page.locator('#status').inner_text()
            page.evaluate("document.querySelectorAll('#board .cell')[0].click()")
            assert page.locator('#score').inner_text() == '100' # no surprise erase
            page.locator('#undo-button').click()
            assert page.locator('#score').inner_text() == '99'
            page.locator('#new-button').click()
            assert page.locator('#score').inner_text() == '0'
            assert page.locator('#board .cell.available').count() == 1
            assert page.locator('#undo-button').is_disabled()
            # A historical dead-end path remains visible until an explicit action.
            blocked=witness_csv('blocked_path.csv')
            assert len(blocked) == 24
            page.locator('#sound-button').click()
            page.evaluate('window.__audioNotes.length = 0')
            page.evaluate('''path => { for (const i of path) document.querySelectorAll('#board .cell')[i].click(); }''',blocked)
            assert page.evaluate('window.__audioNotes.length') == 25  # 23 move tones + 2 dead-end tones.
            assert page.locator('#score').inner_text() == '24'
            assert page.locator('#board .cell.available').count() == 0
            page.evaluate("document.querySelectorAll('#board .cell')[99].click()")
            assert page.locator('#score').inner_text() == '24'
            page.locator('#undo-button').click()
            assert page.locator('#score').inner_text() == '23'
            assert page.locator('#board .cell.available').count() > 0
            page.locator('#new-button').click()
            assert page.locator('#score').inner_text() == '0'
        assert not errors, f'{name}: JS errors during interactions: {errors}'
        if width <= 410:
            assert page.locator('#help-button .compact-icon').is_visible(), name
            assert page.locator('#credits-button .compact-icon').is_visible(), name
        else:
            assert page.locator('#help-button [data-i18n="help"]').is_visible(), name
        bounds = page.evaluate("""() => ({h: document.documentElement.scrollHeight,
          w: document.documentElement.scrollWidth, vh: innerHeight, vw: innerWidth})""")
        assert bounds['h'] <= bounds['vh']+1 and bounds['w'] <= bounds['vw']+1, (name,bounds)
        if name=='phone':
            page.screenshot(path=str(ROOT/'test'/'phone.png'))
        if name=='desktop':
            page.screenshot(path=str(ROOT/'test'/'desktop.png'))
        print(f'BROWSER PASS {name} {width}x{height} lang={state["lang"]} board={state["boardRect"]["w"]}x{state["boardRect"]["h"]} no-overflow; move/undo/menu/dialog/IT-EN/sound OK')
        context.close()
    # Test persistent first-visit state using a localStorage double, because this
    # runner's Chromium blocks navigation to an HTTP origin (opaque about:blank
    # cannot use native localStorage). This tests the app's storage contract,
    # not persistence on a deployed origin.
    context = browser.new_context(viewport={'width':375,'height':667}, locale='en-US')
    page = context.new_page()
    page.set_content(html, wait_until='load')
    page.evaluate('''() => {
      window.__introStore = new Map();
      Object.defineProperty(window, 'localStorage', {configurable:true, value: {
        getItem: key => window.__introStore.get(key) ?? null,
        setItem: (key, value) => window.__introStore.set(key, value)
      }});
    }''')
    page.locator('#lang-button').click()  # Change language BEFORE initial Play.
    page.locator('#play-button').click()
    assert page.locator('#dialog-title').inner_text() == 'Come si gioca'
    assert page.locator('#dialog-done').inner_text() == 'Inizia a giocare'
    assert page.evaluate('window.__introStore.size') == 0  # Not stored before dismissal.
    page.locator('#dialog-done').click()
    assert page.evaluate("window.__introStore.get('libre-arcade.100-square-challenge.intro-seen.v1')") == '1'
    page.set_content(html, wait_until='load')  # Simulate a new page load in this browser context.
    page.locator('#play-button').click()
    assert page.locator('#dialog-backdrop').is_hidden()
    page.locator('#help-button').click()
    assert page.locator('#dialog-backdrop').is_visible()
    assert page.locator('#dialog-done').inner_text() == 'Close'
    page.locator('#dialog-done').click()
    print('BROWSER PASS first-play instructions persisted across page load (mocked localStorage); EN/IT and manual help OK')
    context.close()
    browser.close()
