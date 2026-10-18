/* Turkey Cooking Simulator - responsive Canvas shell helpers */
/* SPDX-License-Identifier: GPL-3.0-only */

export const DESIGN = Object.freeze({ width:960, height:600 });
export const PORTRAIT_DESIGN = Object.freeze({ width:600, height:960 });
export const LayoutMode = Object.freeze({ LANDSCAPE:'landscape', PORTRAIT:'portrait', COMPACT_LANDSCAPE:'compact-landscape' });

export const STRINGS = Object.freeze({
  en: {
    title:'Turkey Cooking Simulator', subtitle:'Preservation build', newGame:'New game', resume:'Resume', casual:'Casual', hardcore:'Hardcore', market:'Market', kitchen:'Kitchen', credits:'Credits', howToPlay:'How to play',
    wallet:'Wallet', buy:'Buy', bought:'Bought', startCooking:'Start cooking', turkeyRequired:'Buy a turkey first', oven:'Oven', temp:'Temperature', skin:'Skin', body:'Body', core:'Core',
    door:'Door', closed:'Closed', peek:'Peek', open:'Open', closeDoor:'Close', probe:'Probe', skip:'Skip 20 min', finish:'Serve turkey', save:'Save', load:'Load', saved:'Saved', loaded:'Loaded', noSave:'No save',
    audio:'Audio', language:'IT', back:'Back', score:'Score', cookTime:'Cook time', result:'Result', raw:'Raw', undercooked:'Undercooked', cooked:'Cooked', dry:'Dry', burnt:'Burnt', fire:'Fire',
    temperatureSet:'Oven set to', probeNeedsOpen:'Open the oven fully to use the probe', probeMissing:'Buy the temperature probe first', skipBlocked:'Skip is unavailable in Hardcore',
    notEnough:'Not enough money', unavailable:'Item unavailable', turkeyOwned:'You already bought a turkey', start:'Start', continue:'Continue', reset:'Reset data', confirmReset:'Press again to reset',
    controls:'Keyboard: M market · K kitchen · +/- oven · P peek · O open · T probe · I light · S skip · F serve · U °F/°C · L language', shellNote:'New procedural graphics. Sounds: the original\'s, plus a few cues synthesized with Web Audio.',
    creditsBody:'Port of Turkey Cooking Simulator (Game Off 2013) by Robert J. Chen, Benjamin Kwok, Scott R. Mobley and Sheen Kao. Code: GPLv3. The original BY-NC artwork and dialogue are not used. The sounds and music are the original\'s, public domain or CC0: Turkey in the Straw, Waterford (Kevin MacLeod) and Freesound effects.',
    essentials:'Essentials', turkeys:'Turkeys', extras:'Extras', owned:'Owned', ready:'Ready to cook', shopHint:'Choose one turkey, then add any useful extras.', kitchenHint:'Set the oven, watch the turkey, and serve when you are satisfied.',
    ovenStatus:'Oven status', turkeyStatus:'Turkey status', actions:'Actions', mode:'Mode', portraitHint:'Portrait layout active', landscapeHint:'Landscape layout active', light:'Light', day:'Day', evening:'Evening', night:'Night', dawn:'Dawn', appearance:'Appearance', safe:'Food-safe target', probeReading:'Last probe', noProbeReading:'No probe reading yet', alarmOff:'Alarm off', excellent:'Excellent', good:'Good', fair:'Fair', poor:'Poor', legacyScore:'Legacy score', serveSummary:'Serving summary', helpGoal:'Goal', helpGoalText:'Cook and serve a turkey as well as you can. The simulation tracks heat from the skin to the core, so a browned outside does not guarantee a safe center.', helpShop:'1. Shop', helpShopText:'Buy exactly one turkey. Optional tools make the kitchen easier: the temperature probe reads the core, the alarm tracks time, and the oven light lets you inspect the turkey without opening the door.', helpCook:'2. Cook', helpCookText:'Start cooking, choose an oven temperature, and let time pass. Skin, Body and Core heat at different rates. Opening or peeking changes what you can see, but the preserved original model does not apply extra heat loss for the door.', helpCheck:'3. Check', helpCheckText:'Open the oven fully and use the probe to read the Core. 165°F (74°C) is shown as a food-safety reference. The visual appearance is useful, but the Core reading is the best guide.', helpServe:'4. Serve', helpServeText:'Serve when you are satisfied. The final score preserves the historical game formula, including its original quirks.', helpModes:'Modes', helpModesText:'Casual includes a 20-minute skip. Hardcore removes skip and applies the original score multiplier.', helpSave:'Saving', helpSaveText:'The game saves locally in your browser. Resume continues the thermal simulation from the saved state.'
  },
  it: {
    title:'Turkey Cooking Simulator', subtitle:'Build di preservazione', newGame:'Nuova partita', resume:'Riprendi', casual:'Casual', hardcore:'Hardcore', market:'Mercato', kitchen:'Cucina', credits:'Crediti', howToPlay:'Come si gioca',
    wallet:'Portafoglio', buy:'Compra', bought:'Comprato', startCooking:'Inizia a cucinare', turkeyRequired:'Compra prima un tacchino', oven:'Forno', temp:'Temperatura', skin:'Pelle', body:'Corpo', core:'Cuore',
    door:'Porta', closed:'Chiusa', peek:'Socchiusa', open:'Aperta', closeDoor:'Chiudi', probe:'Termometro', skip:'Salta 20 min', finish:'Servi il tacchino', save:'Salva', load:'Carica', saved:'Salvato', loaded:'Caricato', noSave:'Nessun salvataggio',
    audio:'Audio', language:'EN', back:'Indietro', score:'Punteggio', cookTime:'Tempo cottura', result:'Risultato', raw:'Crudo', undercooked:'Poco cotto', cooked:'Cotto', dry:'Secco', burnt:'Bruciato', fire:'Fuoco',
    temperatureSet:'Forno impostato a', probeNeedsOpen:'Apri completamente il forno per usare il termometro', probeMissing:'Compra prima il termometro', skipBlocked:'Lo skip non è disponibile in Hardcore',
    notEnough:'Fondi insufficienti', unavailable:'Oggetto non disponibile', turkeyOwned:'Hai già comprato un tacchino', start:'Avvia', continue:'Continua', reset:'Reset dati', confirmReset:'Premi ancora per resettare',
    controls:'Tastiera: M mercato · K cucina · +/- forno · P socchiudi · O apri · T termometro · I luce · S skip · F servi · U °F/°C · L lingua', shellNote:'Grafica procedurale nuova. Suoni: quelli dell\'originale, più alcuni segnali sintetizzati con Web Audio.',
    creditsBody:'Porting di Turkey Cooking Simulator (Game Off 2013) di Robert J. Chen, Benjamin Kwok, Scott R. Mobley e Sheen Kao. Codice: GPLv3. La grafica originale BY-NC e i dialoghi non sono usati. Suoni e musica sono quelli dell\'originale, di pubblico dominio o CC0: Turkey in the Straw, Waterford (Kevin MacLeod) ed effetti di Freesound.',
    essentials:'Essenziali', turkeys:'Tacchini', extras:'Extra', owned:'Posseduto', ready:'Pronto per cuocere', shopHint:'Scegli un tacchino e poi aggiungi gli extra utili.', kitchenHint:'Imposta il forno, controlla il tacchino e servilo quando sei soddisfatto.',
    ovenStatus:'Stato forno', turkeyStatus:'Stato tacchino', actions:'Azioni', mode:'Modalità', portraitHint:'Layout verticale attivo', landscapeHint:'Layout orizzontale attivo', light:'Luce', day:'Giorno', evening:'Sera', night:'Notte', dawn:'Alba', appearance:'Aspetto', safe:'Obiettivo sicurezza', probeReading:'Ultima misura', noProbeReading:'Nessuna misura ancora', alarmOff:'Allarme spento', excellent:'Eccellente', good:'Buono', fair:'Discreto', poor:'Scarso', legacyScore:'Punteggio storico', serveSummary:'Riepilogo servizio', helpGoal:'Obiettivo', helpGoalText:'Cuoci e servi il tacchino nel modo migliore possibile. La simulazione segue il calore dalla pelle al cuore: un esterno ben dorato non garantisce che il centro sia pronto.', helpShop:'1. Mercato', helpShopText:'Compra un solo tacchino. Gli strumenti opzionali semplificano la cucina: il termometro misura il cuore, l’allarme tiene il tempo e la luce del forno permette di controllare senza aprire la porta.', helpCook:'2. Cottura', helpCookText:'Avvia la cottura, scegli la temperatura del forno e lascia passare il tempo. Pelle, Corpo e Cuore si scaldano a velocità diverse. Aprire o socchiudere cambia ciò che puoi vedere, ma il modello originale preservato non applica dispersione termica aggiuntiva per la porta.', helpCheck:'3. Controllo', helpCheckText:'Apri completamente il forno e usa il termometro per leggere il Cuore. 165°F (74°C) è mostrato come riferimento di sicurezza alimentare. L’aspetto visivo aiuta, ma la misura del Cuore è la guida migliore.', helpServe:'4. Servi', helpServeText:'Servi quando sei soddisfatto. Il punteggio finale preserva la formula storica del gioco, compresi i suoi comportamenti originali.', helpModes:'Modalità', helpModesText:'Casual include lo skip di 20 minuti. Hardcore elimina lo skip e applica il moltiplicatore di punteggio originale.', helpSave:'Salvataggio', helpSaveText:'La partita viene salvata localmente nel browser. Riprendi continua la simulazione termica dallo stato salvato.'
  }
});

export function t(lang,key){ return (STRINGS[lang] ?? STRINGS.en)[key] ?? STRINGS.en[key] ?? key; }


export const MARKET_ITEM_LABELS = Object.freeze({
  en: {
    'Organic Turkey':'Organic Turkey',
    'Free Range Turkey':'Free Range Turkey',
    'Sunny Farms Turkey':'Sunny Farms Turkey',
    'Pastured Turkey':'Pastured Turkey',
    'General Turkey':'General Turkey',
    'Frills Box':'Frills Box',
    'Temperature Probe':'Temperature Probe',
    'Oven Light in a Box':'Oven Light',
    'Alarm Clock':'Alarm Clock',
    'Cookbook':'Cookbook',
    'Repurposed Stuffing':'Repurposed Stuffing',
    'Exquisite Stuffing':'Exquisite Stuffing',
    'Special Stuffing':'Special Stuffing'
  },
  it: {
    'Organic Turkey':'Tacchino biologico',
    'Free Range Turkey':'Tacchino allevato all’aperto',
    'Sunny Farms Turkey':'Tacchino Sunny Farms',
    'Pastured Turkey':'Tacchino al pascolo',
    'General Turkey':'Tacchino standard',
    'Frills Box':'Kit decorazioni',
    'Temperature Probe':'Termometro a sonda',
    'Oven Light in a Box':'Luce per forno',
    'Alarm Clock':'Timer da cucina',
    'Cookbook':'Ricettario',
    'Repurposed Stuffing':'Ripieno di recupero',
    'Exquisite Stuffing':'Ripieno prelibato',
    'Special Stuffing':'Ripieno speciale'
  }
});

export function marketItemLabel(lang,name){
  return (MARKET_ITEM_LABELS[lang] ?? MARKET_ITEM_LABELS.en)[name] ?? name;
}

export function layoutForViewport(viewW, viewH) {
  const portrait = viewH > viewW * 1.08;
  if (portrait) return { mode:LayoutMode.PORTRAIT, design:{...PORTRAIT_DESIGN} };
  const compact = viewH < 520 || viewW < 820;
  return { mode:compact?LayoutMode.COMPACT_LANDSCAPE:LayoutMode.LANDSCAPE, design:{...DESIGN} };
}

export function fitCanvas(viewW, viewH, designW=DESIGN.width, designH=DESIGN.height) {
  const scale=Math.min(viewW/designW, viewH/designH);
  return { cssWidth:Math.floor(designW*scale), cssHeight:Math.floor(designH*scale), scale };
}

export function fitAdaptiveCanvas(viewW, viewH) {
  const layout=layoutForViewport(viewW,viewH);
  const fit=fitCanvas(viewW,viewH,layout.design.width,layout.design.height);
  return {...layout,...fit};
}

export function clientToCanvas(clientX,clientY,rect,design=DESIGN){
  return { x:(clientX-rect.left)*(design.width/rect.width), y:(clientY-rect.top)*(design.height/rect.height) };
}

export function inRect(p,r){ return p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.h; }
export function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

export function safeInsets(env={}){
  return {
    top:Number(env.top)||0, right:Number(env.right)||0,
    bottom:Number(env.bottom)||0, left:Number(env.left)||0
  };
}

export function formatClock(seconds){
  const s=Math.max(0,Math.floor(seconds));
  const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); const sec=s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export function conditionLabel(lang,condition){
  const key=String(condition ?? 'raw').toLowerCase();
  return t(lang,key) ?? key;
}

export function marketCategory(item){
  if(item?.kind==='turkey') return 'turkeys';
  const n=String(item?.name??'').toLowerCase();
  if(/probe|alarm|cookbook|oven light/.test(n)) return 'essentials';
  return 'extras';
}

export function minimumTouchTarget(layoutMode){ return layoutMode===LayoutMode.PORTRAIT?48:42; }


export function dayNightState(gameSeconds, startHour=14) {
  const hour=((Number(startHour)||0)+(Math.max(0,Number(gameSeconds)||0)/3600))%24;
  let phase='day', skyMix=1, stars=0, roomDim=0;
  if(hour>=20||hour<5){phase='night';skyMix=0;stars=1;roomDim=.28;}
  else if(hour>=17){phase='evening';skyMix=Math.max(0,(20-hour)/3);stars=1-skyMix;roomDim=.16*(1-skyMix);}
  else if(hour<8){phase='dawn';skyMix=Math.min(1,(hour-5)/3);stars=1-skyMix;roomDim=.12*(1-skyMix);}
  return {hour,phase,skyMix,stars,roomDim};
}

export function cookingVisualState(condition='raw') {
  const key=String(condition||'raw').toLowerCase();
  const states={
    raw:{skin:'#d8a777',edge:'#b97852',steam:0,smoke:0,fire:0},
    undercooked:{skin:'#d79b6a',edge:'#b26d46',steam:.10,smoke:0,fire:0},
    'slightly cooked':{skin:'#c9834d',edge:'#9c5633',steam:.28,smoke:0,fire:0},
    cooked:{skin:'#ad6535',edge:'#754125',steam:.55,smoke:0,fire:0},
    overcooked:{skin:'#8b4c2e',edge:'#5c3020',steam:.38,smoke:.14,fire:0},
    dry:{skin:'#70402b',edge:'#42261c',steam:.12,smoke:.35,fire:0},
    burnt:{skin:'#392a24',edge:'#211a17',steam:0,smoke:.65,fire:0},
    fire:{skin:'#251c19',edge:'#17110f',steam:0,smoke:.82,fire:1}
  };
  return states[key] ?? states.raw;
}

export function ovenGlow(rawTempC){
  const c=Math.max(20,Number(rawTempC)||20);
  return Math.max(0,Math.min(1,(c-60)/220));
}


export function itemVisualSpec(name='', kind='') {
  const n=String(name).toLowerCase();
  if(kind==='turkey') return {glyph:'turkey', label:'T'};
  if(/probe/.test(n)) return {glyph:'probe', label:'°'};
  if(/alarm/.test(n)) return {glyph:'alarm', label:'⏱'};
  if(/oven light/.test(n)) return {glyph:'light', label:'☀'};
  if(/cookbook/.test(n)) return {glyph:'book', label:'≡'};
  if(/frills/.test(n)) return {glyph:'frills', label:'✦'};
  if(/stuffing/.test(n)) return {glyph:'stuffing', label:'S'};
  return {glyph:'item', label:'•'};
}

export function purchasedKitchenFeatures(purchasedItems=[]) {
  const names=Array.isArray(purchasedItems)?purchasedItems:[];
  return {
    probe:names.some(n=>/temperature probe/i.test(n)),
    alarm:names.some(n=>/alarm clock/i.test(n)),
    light:names.some(n=>/oven light/i.test(n)),
    cookbook:names.some(n=>/cookbook/i.test(n)),
    frills:names.some(n=>/frills/i.test(n)),
    stuffing:names.filter(n=>/stuffing/i.test(n)),
  };
}


export function temperatureBandF(tempF, layer='core') {
  const t=Number(tempF);
  if(!Number.isFinite(t)) return {key:'unknown',level:0};
  if(layer==='skin'){
    if(t<140) return {key:'cold',level:0};
    if(t<165) return {key:'warming',level:.35};
    if(t<220) return {key:'cooking',level:.65};
    if(t<300) return {key:'hot',level:.85};
    return {key:'very-hot',level:1};
  }
  if(t<120) return {key:'cold',level:0};
  if(t<150) return {key:'warming',level:.35};
  if(t<165) return {key:'nearly-safe',level:.7};
  if(t<=180) return {key:'safe',level:1};
  return {key:'over',level:.9};
}

export function scoreGrade(score){
  const n=Number(score)||0;
  if(n>=1800)return 'excellent';
  if(n>=1400)return 'good';
  if(n>=1000)return 'fair';
  return 'poor';
}

export function alarmUrgency(seconds, active=true){
  if(!active)return 'off';
  const s=Number(seconds)||0;
  if(s<=0)return 'ring';
  if(s<=60)return 'urgent';
  if(s<=300)return 'soon';
  return 'normal';
}
