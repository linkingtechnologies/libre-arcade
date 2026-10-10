/* GPL-3.0-only integration of the validated GNOME Gnect/Velena adapters. */
/* Licence basis: the retained Velena headers grant the GNU GPL with no version number; version 3 is chosen under GPLv2 section 9. */
import { chooseRuleMove } from './gnome-velena-rule-engine.js';
import { hybridChoose, _test as hybridParts } from './gnome-velena-hybrid.js';
import { proofSearch, _test as pn } from './gnome-velena-proof-number.js';

const PROFILES={
  1:{rules:250,pn:250,depth:2,defence:100},
  2:{rules:1000,pn:1000,depth:3,defence:250},
  3:{rules:5000,pn:2800,depth:4,defence:500},
};

function opening(position){return hybridParts.opening(position);}

/**
 * Full integration is deliberately an orchestrator, not a new perfect solver:
 * opening/tactics -> rule coverage -> PN/hybrid cascade -> defensive validation.
 */
export function fullVelenaChoose(position,effort,context={}){
  const profile=PROFILES[effort];
  const book=opening(position);
  if(book>=0)return{column:book,kind:'opening',nodes:0,effort,components:['opening']};

  const rules=chooseRuleMove(position,profile.rules);
  if(rules.kind==='immediate-win'||rules.kind==='forced-block')return{...rules,effort,components:['rules','tactics']};

  const hybrid=hybridChoose(position,effort,context);
  let column=hybrid.column,kind=`hybrid-${hybrid.kind}`,validation=null;

  // A compatibility proof may override the historical fallback only after the
  // candidate survives a bounded opponent PN attack.
  if(rules.kind==='rule-proof'&&rules.column!==hybrid.column){
    const next=pn.drop(position.board,rules.column,position.player);
    validation=proofSearch(next,3-position.player,profile.defence);
    if(validation.status!=='proved'){
      column=rules.column;
      kind='validated-rule-proof';
    }
  }

  return{
    column,kind,effort,
    nodes:(rules.nodes??0)+(hybrid.nodes??0)+(validation?.nodes??0),
    components:['nine-rules','proof-number','defensive-screen','tactical-lookahead'],
    ruleKind:rules.kind,ruleColumn:rules.column,ruleCovered:rules.covered??0,
    ruleUnresolved:rules.unresolved??0,ruleSolutions:rules.solutions??0,
    hybridKind:hybrid.kind,hybridColumn:hybrid.column,
    validationStatus:validation?.status??'not-required',
    validationProof:validation?.proof??null,
    validationDisproof:validation?.disproof??null,
  };
}

export const gnomeVelenaFullIntegrationPlayer={
  id:'gnome-velena-full-integration',
  name:'GNOME Velena Full Integration',
  source:'GNOME Games 2.8.3 Gnect evaluate.c, pbsolver.c and ia_main.c',
  license:'GPL-3.0-only',
  family:'integrated-rules-proof-number-tactical',
  settings:{key:'effort',label:'Effort',values:[1,2,3],default:2},
  capabilities:{deterministic:false,supportsSeed:true,supportsDifficulty:true,reportsNodes:true,learnedWeights:false,perfectPlay:false,openingDatabase:false},
  create(options={}){
    const effort=Number(options.effort??2);
    if(!PROFILES[effort])throw new RangeError('Effort must be 1, 2 or 3');
    return{id:`gnome-velena-full-e${effort}`,reset(){},chooseMove(position,context={}){return fullVelenaChoose(position,effort,context);}};
  },
};

export const _test={PROFILES,opening};
