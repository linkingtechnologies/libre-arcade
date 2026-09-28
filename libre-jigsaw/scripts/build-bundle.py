from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src'
OUT=ROOT/'public/app.bundle.js'

def body(name):
    s=(SRC/name).read_text(encoding='utf-8')
    s=re.sub(r'^import[^\n]*\n','',s,flags=re.M)
    s=re.sub(r'\bexport\s+','',s)
    return s

parts=["/* Libre Jigsaw browser bundle — GPL-3.0-or-later. Generated from src/*.js so the game also works from file://. */\n'use strict';\n"]
parts.append("const I18N=(()=>{\n"+body('i18n.js')+"\nreturn {STRINGS,applyLanguage};\n})();\n")
parts.append("const G2012=(()=>{\n"+body('geometry2012.js')+"\nreturn {makeRng,squareBestFit,hexBestFit,createSquareGeometry,createHexGeometry,rotateVectorSteps,rotateVector,areGridNeighbors};\n})();\n")
parts.append("const G2010=(()=>{\nconst {makeRng,squareBestFit}=G2012; const createHexGeometry2012=G2012.createHexGeometry;\n"+body('geometry2010.js')+"\nreturn {createSquareGeometry2010,createHexGeometry2010};\n})();\n")
parts.append("const SNAPMOD=(()=>{\nconst {areGridNeighbors,rotateVectorSteps}=G2012;\n"+body('snapping.js')+"\nreturn {SNAP_THRESHOLD,expectedNeighborVector,neighborCorrection,collectSnapCandidates,planSnap2010,planSnap2012,planSnap};\n})();\n")
parts.append("const LAYERS=(()=>{\n"+body('layers.js')+"\nreturn {LAYER_COUNT,normalizeLayer,visiblePieces,uniqueGroupsFromPieces,moveGroupsToLayer,normalizeRect,rectsIntersect};\n})();\n")
parts.append("const SAVEGAME=(()=>{\n"+body('savegame.js')+"\nreturn {SAVE_FORMAT,SAVE_VERSION,createSaveData,validateSaveData,parseSaveText,stringifySaveData};\n})();\n")
parts.append("const COMPLETION=(()=>{\n"+body('completion.js')+"\nreturn {planSolvedPlacement};\n})();\n")
parts.append("const VIEWPORT=(()=>{\n"+body('viewport.js')+"\nreturn {computeViewport,canvasToPlayfield,playfieldToCanvas};\n})();\n")
app=body('app.js')
pre="""\n(()=>{\nconst {applyLanguage,STRINGS}=I18N;\nconst {createSquareGeometry,createHexGeometry,makeRng,rotateVectorSteps}=G2012;\nconst {createSquareGeometry2010,createHexGeometry2010}=G2010;\nconst {collectSnapCandidates,planSnap2012,SNAP_THRESHOLD}=SNAPMOD;\nconst {LAYER_COUNT,visiblePieces,moveGroupsToLayer,normalizeRect,rectsIntersect}=LAYERS;\nconst {createSaveData,parseSaveText,stringifySaveData}=SAVEGAME;\nconst {planSolvedPlacement}=COMPLETION;\nconst {computeViewport,canvasToPlayfield}=VIEWPORT;\n"""
parts.append(pre+app+"\n})();\n")
OUT.write_text('\n'.join(parts), encoding='utf-8', newline='\n')
print(OUT)
