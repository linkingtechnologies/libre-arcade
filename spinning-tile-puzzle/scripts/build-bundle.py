from pathlib import Path
root=Path(__file__).resolve().parents[1]
parts=[(root/'src'/n).read_text(encoding='utf-8') for n in ['game.js','i18n.js','app.js']]
(root/'public'/'app.bundle.js').write_text('\n\n'.join(parts)+'\n',encoding='utf-8',newline='\n')
print(root/'public'/'app.bundle.js')
