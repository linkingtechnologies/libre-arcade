from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/'public'/'app.bundle.js'
parts=[]
for name in ['game.js','i18n.js','app.js']:
    parts.append((root/'src'/name).read_text(encoding='utf-8'))
out.write_text('\n\n'.join(parts)+'\n',encoding='utf-8',newline='\n')
print(out)
