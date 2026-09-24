"""Exercise the historical v1.2 TEXT-I/O routines directly in a temporary cwd.
The two Python 2 print statements in get_highscores' error handler are removed
solely so the code snippet parses on Python 3; normal-path I/O remains literal
historical source. This is NOT a native Python 2/Pygame gameplay test.
"""
from pathlib import Path
import os, subprocess, tempfile, json, sys
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
text=(ROOT/'reference/AsteroidsInfinity-1.2.py').read_text(encoding='utf-8')
start=text.index('def get_highscores():');end=text.index('class DummySound():',start)
original='\n'.join((line[:len(line)-len(line.lstrip())]+'pass # Python 2 diagnostic print removed') if line.lstrip().startswith('print ') else line for line in text[start:end].splitlines())
class PygameKeys:
    K_LEFT=276;K_RIGHT=275;K_UP=273;K_DOWN=274;K_SPACE=32;K_LCTRL=306
def historical_open(name,mode='r',*args,**kwargs):
    """The historical files are plain LF, as Python 2 wrote them on the author's
    system. Pin that on write so the byte-for-byte comparison below measures the
    JavaScript round-trip and not the host's line-ending translation."""
    if 'w' in mode:kwargs.setdefault('newline','\n')
    return open(name,mode,*args,**kwargs)
ns={'os':os,'pygame':PygameKeys,'open':historical_open}
exec(compile(original,'historical-v1.2-io','exec'),ns)
with tempfile.TemporaryDirectory() as tmp:
    current=Path.cwd();os.chdir(tmp)
    try:
        defaults=ns['get_controls']()
        assert [defaults[k] for k in ('up','down','left','right','shoot','shield')]==[273,274,276,275,32,306]
        ns['save_controls'](defaults)
        native_controls=Path('controls.txt').read_text(encoding='utf-8')
        assert native_controls=='273\n274\n276\n275\n32\n306\n'
        assert ns['get_controls']()==defaults
        defaults_score=ns['get_highscores']()
        ns['save_highscores'](defaults_score)
        native_scores=Path('highscores.txt').read_text(encoding='utf-8')
        assert native_scores.startswith('8128:PERFECT\n')
        assert ns['get_highscores']()==defaults_score
        js='''import {parseNativeControls,formatNativeControls,parseNativeScores,formatNativeScores} from './src/native-files.js';
          import fs from 'node:fs';
          const controls=fs.readFileSync(process.argv[1],'utf8'), scores=fs.readFileSync(process.argv[2],'utf8');
          if(formatNativeControls(parseNativeControls(controls))!==controls)process.exit(2);
          if(formatNativeScores(parseNativeScores(scores))!==scores)process.exit(3);
          console.log('HISTORICAL FILE ORACLE: canonical controls.txt and highscores.txt byte-for-byte JS round-trip PASS');'''
        result=subprocess.run(['node','--input-type=module','-e',js,str(Path('controls.txt').resolve()),str(Path('highscores.txt').resolve())],cwd=PUBLIC,capture_output=True,text=True)
        assert result.returncode==0,(result.stdout,result.stderr)
        print(result.stdout.strip())
        print('HISTORICAL FILE ORACLE: direct original Python get/save controls and highscores PASS (Python 3 compatible normal-path snippet)')
    finally:os.chdir(current)
