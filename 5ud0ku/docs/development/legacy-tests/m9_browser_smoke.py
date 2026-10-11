from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'src/browser/index.html').read_text()
CSS=(ROOT/'src/browser/styles.css').read_text()

# The sandbox blocks browser navigation to localhost/file URLs. This smoke test therefore
# renders the exact M9 markup + CSS through set_content(), and inserts representative board
# content. Engine/worker behaviour is covered independently by the M2-M8 tests.
def preview_markup():
    h=HTML.replace('<link rel="stylesheet" href="./styles.css">', f'<style>{CSS}</style>')
    h=h.replace('<script type="module" src="./app.js"></script>', '')
    return h

def populate(page):
    page.evaluate("""() => {
      const board=document.getElementById('board');
      const puzzle='530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      for(let r=0;r<9;r++)for(let c=0;c<9;c++){
        const i=r*9+c, d=Number(puzzle[i]);
        const b=document.createElement('button'); b.type='button'; b.className='cell'; b.dataset.row=r; b.dataset.col=c;
        if(d){b.textContent=String(d);b.classList.add('fixed');}
        if(r===0&&c===2){b.classList.add('selected');}
        board.appendChild(b);
      }
      const pad=document.getElementById('digits');
      for(let d=1;d<=9;d++){const b=document.createElement('button');b.type='button';b.className='digit-button';b.dataset.digit=d;b.textContent=String(d);pad.appendChild(b);}
      document.getElementById('loadingOverlay').classList.add('hidden');
      document.getElementById('app').setAttribute('aria-busy','false');
      document.getElementById('statusText').textContent='Ready';
      document.getElementById('timer').textContent='03:42';
    }""")

def run_view(page,w,h,label):
    page.set_viewport_size({'width':w,'height':h})
    page.set_content(preview_markup(),wait_until='load')
    populate(page)
    assert page.locator('.cell').count()==81
    assert page.locator('.digit-button').count()==9
    assert page.evaluate("document.documentElement.scrollHeight <= document.documentElement.clientHeight")
    assert page.evaluate("document.body.scrollHeight <= document.body.clientHeight")
    box=page.locator('#board').bounding_box(); assert box and box['width']>120 and abs(box['width']-box['height'])<2
    out=ROOT/'docs'/f'm9-{label}.png'; page.screenshot(path=str(out),full_page=False)
    return box

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page()
        desktop=run_view(page,1280,800,'desktop')
        mobile=run_view(page,360,640,'mobile')
        compact=run_view(page,320,480,'compact')
        browser.close()
    print(f'M9 browser layout smoke: PASS desktop={desktop["width"]:.0f}px mobile={mobile["width"]:.0f}px compact={compact["width"]:.0f}px')
if __name__=='__main__': main()
