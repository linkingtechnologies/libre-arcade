"""M10 browser integration: real Chromium JS engine, inlined ES modules due to
administrator-blocked navigation; accelerated simulated foreground timestamps.
Not an unscripted human gameplay session and not a normal HTTP module test.
"""
from pathlib import Path
import re,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
html=(PUBLIC/'index.html').read_text(encoding='utf-8').replace('<link rel="stylesheet" href="./style.css">','<style>'+ (PUBLIC/'style.css').read_text(encoding='utf-8')+'</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
parts=[]
for name in ['asteroids.js','particles.js','saucers.js','combat.js','core.js','render.js','storage.js','menu.js','native-files.js','input.js','frame-delta.js','frame-clock.js','app.js']:
    script=(PUBLIC/'src'/name).read_text(encoding='utf-8')
    script='\n'.join(line for line in script.splitlines() if not line.startswith('import '))
    script=re.sub(r'\bexport\s+','',script)
    if name=='particles.js':script=re.sub(r'\bTAU\b','PARTICLE_TAU',script)
    parts.append(script)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    try:
        page=browser.new_page(viewport={'width':1280,'height':800},locale='en-US')
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html)
        driver="""
        window.__m10_fastSession=()=>{
          // Initiate via the actual UI, then replace only the non-repeatable RNG
          // with the same seeded browser adapter used by M7's ordinary-run oracle.
          document.querySelector('#menu-items button').click();
          let seed=19;
          const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
          const rng=browserRandom(rand);
          state=createSimulation({gameplay:true,rng});spawnWave(state,1,rng);
          simClock.reset();simClock.advance(0);
          let frames=0,updates=0;
          for(let i=1;i<90000&&state.mode!=='gameover';i++){
            const dt=simClock.advance(i/60);
            if(dt!==null){step(state,controls.get(),dt);updates++;}
            frames++;
          }
          const final={frames,updates,score:state.score,lostShips:state.lostShips,
                       lives:state.lives,mode:state.mode,wave:state.wave};
          if(state.mode==='gameover')finishGame();
          return final;
        };
        """
        page.evaluate('\n'.join(parts)+driver)
        result=page.evaluate('window.__m10_fastSession()')
        assert result['mode']=='gameover',result
        assert result['lostShips']==5 and result['lives']==0,result
        assert result['frames']>1000 and result['updates']>1000,result
        assert page.locator('#menu-title').inner_text()=='GAME OVER'
        assert page.locator('#menu-overlay').is_visible()
        assert page.evaluate('document.documentElement.scrollHeight<=innerHeight')
        page.locator('#menu-items button').first.click()
        assert page.locator('.score-table tr').count()==10
        page.keyboard.press('Escape')
        assert page.locator('#menu-items button').count()==4
        assert not errors,errors
        output=os.getenv('M10_SCREENSHOT_DIR')
        if output:
            Path(output).mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(Path(output)/'browser-m10-natural-gameover-menu.png'))
        print('BROWSER M10 FULL SESSION: PASS; simulated variable 60Hz, seeded RNG, no forced deaths/collisions/scores:',result)
        print('BROWSER M10 FULL SESSION: PASS; gameover -> highscores -> main menu, no page errors or page scroll')
        page.close()
    finally:browser.close()
