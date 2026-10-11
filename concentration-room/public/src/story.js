import { MODE, solitaireInitialMisses } from './rules.js';

// Exact 8-byte storyStages table from Concentration Room 0.02 litemain.s.
export const STORY_STAGES = Object.freeze([
  Object.freeze({ difficulty: 0, aiNoiseLevel: -1, winScene: 64, winNext: 1, loseScene: -1, loseNext: -1 }),
  Object.freeze({ difficulty: 0, aiNoiseLevel: 16, winScene: 65, winNext: 2, loseScene: 66, loseNext: 0 }),
  Object.freeze({ difficulty: 1, aiNoiseLevel: -1, winScene: 67, winNext: 3, loseScene: -1, loseNext: -1 }),
  Object.freeze({ difficulty: 1, aiNoiseLevel: 12, winScene: 68, winNext: 4, loseScene: 69, loseNext: 2 }),
  Object.freeze({ difficulty: 2, aiNoiseLevel: -1, winScene: 70, winNext: 5, loseScene: -1, loseNext: -1 }),
  Object.freeze({ difficulty: 2, aiNoiseLevel: 8,  winScene: 71, winNext: 6, loseScene: 72, loseNext: 4 }),
  Object.freeze({ difficulty: 3, aiNoiseLevel: -1, winScene: 73, winNext: 7, loseScene: -1, loseNext: -1 }),
  Object.freeze({ difficulty: 3, aiNoiseLevel: 8,  winScene: 74, winNext: 8, loseScene: 75, loseNext: 6 }),
  Object.freeze({ difficulty: 4, aiNoiseLevel: -1, winScene: 76, winNext: 9, loseScene: -1, loseNext: -1 }),
  Object.freeze({ difficulty: 4, aiNoiseLevel: 8,  winScene: 77, winNext: -1, loseScene: 78, loseNext: 8 }),
]);

const OPPONENTS = Object.freeze(['Lillie', 'Ethan', 'Venny', 'Snowy', 'Susan']);

// Exact English text from 0.02 src/litetitle.s. Each item is one NES text row.
export const STORY_OPENING_LINES = Object.freeze({
  en: Object.freeze([
    'Once upon a time in the',
    'Third Realm from the Sun,',
    'a team of biochemists were',
    'perfecting a truth serum.',
    'Codenamed Pinenut, the serum',
    'was intended to make it more',
    'difficult for a detainee to',
    'keep a secret from police',
    'and to make the physical',
    'tells of deception more',
    'obvious.',
    '',
    'But a lab accident at',
    'Hombon Pharma led to the',
    'creation of a mildly',
    'neurotoxic substance.',
    'Lab assistants were exposed',
    'to this "bad batch"',
    'before it could be',
    'properly cleaned up.',
    'To make things worse, it',
    'had to happen on Bring',
    'Your Child to Work Day.',
    '',
    'The assistants and their',
    'children were put in',
    'quarantine until their',
    'bodies eliminated the toxin.',
    'It caused painful seizures',
    'until they started thinking',
    'of other things to get their',
    'mind off the pain.',
    'One of the children in',
    'quarantine was carrying a',
    'deck of Concentration cards.',
    'It worked.',
    '',
    'The more intensely they',
    'thought, the more the',
    'side effects subsided.',
    'Concentrating heavily would',
    'reduce the concentration of',
    'the toxin in brain fluid,',
    'as it bound to waste',
    'products from metabolism',
    'in the brain.',
    '',
    // openingText intentionally falls through into instructionsText in 0.02.
    'Flip two cards, and if they',
    'match, you keep them. If',
    "they don't, flip them back.",
    "Good luck; you'll need it!",
  ]),
  // Translation for Libre Arcade. English above remains the historical oracle.
  it: Object.freeze([
    "C'era una volta nel Terzo",
    'Regno dal Sole un gruppo di',
    'biochimici che perfezionava',
    'un siero della verita.',
    'Nome in codice Pinenut: il',
    'siero doveva rendere piu',
    'difficile a un detenuto',
    'nascondere segreti alla',
    'polizia e rendere piu',
    'evidenti i segnali fisici',
    'della menzogna.',
    '',
    'Ma un incidente nei',
    'laboratori Hombon Pharma',
    'creò una sostanza',
    'lievemente neurotossica.',
    'Assistenti di laboratorio',
    'furono esposti a questo',
    '"lotto difettoso" prima che',
    'fosse ripulito del tutto.',
    'Peggio ancora, accadde',
    'proprio durante la giornata',
    'dei figli al lavoro.',
    '',
    'Gli assistenti e i loro',
    'bambini furono messi in',
    'quarantena finché il corpo',
    'non eliminasse la tossina.',
    'Provocava convulsioni',
    'dolorose, finché iniziarono',
    'a pensare ad altro per',
    'distrarsi dal dolore.',
    'Uno dei bambini aveva con',
    'sé un mazzo di carte per',
    'giocare a Concentration.',
    'Funzionò.',
    '',
    'Più intensamente pensavano,',
    'piu gli effetti collaterali',
    'si attenuavano.',
    'Concentrarsi riduceva la',
    'concentrazione della tossina',
    'nel fluido cerebrale, perché',
    'si legava ai prodotti di',
    'scarto del metabolismo',
    'del cervello.',
    '',
    // Italian translation of the four instruction rows reached by fall-through.
    'Gira due carte: se sono',
    'uguali, le tieni. Se non',
    'coincidono, ricoprile.',
    'Buona fortuna: servira!',
  ]),
});

export const STORY_OPENING = Object.freeze({
  en: STORY_OPENING_LINES.en.join('\n'),
  it: STORY_OPENING_LINES.it.join('\n'),
});

// Flat order is exactly opponentScenes in 0.02 liteopponents.s:
// intro, opponent loses, opponent wins, repeated for all five opponents.
const SCENE_EN = Object.freeze([
  ['Lillie', 'Hey, you look fun.\nWanna play?'],
  ['Lillie', "Awww, you're no fun\nafter all."],
  ['Lillie', 'Yay! I won!\nWanna try again later?'],
  ['Ethan', "How dare you make my\nsister cry? You'll pay!"],
  ['Ethan', "Dang, you're good."],
  ['Ethan', "I told you that you'd pay."],
  ['Venny', "You're pretty good.\nWanna play me?"],
  ['Venny', 'I guess I was right:\nyou are pretty good.'],
  ['Venny', 'I guess I was wrong.\nWanna play again later?'],
  ['Snowy', 'Random challenge! Go!'],
  ['Snowy', 'Aaah, my random challenge\nfailed me. You won.'],
  ['Snowy', 'Yay! Awesome random\nchallenges are awesome.\nWanna play again later?'],
  ['Susan', 'You are quite intriguing.\nMind a match of cards\nwith me?'],
  ['Susan', 'Very amusing, you are skilled\nin the game of cards.\nWell done.'],
  ['Susan', "Hmmm.... I'm sorry, I\nmisjudged you. You still\nneed to work on it."],
]);

const SCENE_IT = Object.freeze([
  ['Lillie', 'Ehi, sembri simpatico.\nVuoi giocare?'],
  ['Lillie', 'Uffa, allora non sei\ncosi divertente.'],
  ['Lillie', 'Evviva! Ho vinto!\nRiproviamo piu tardi?'],
  ['Ethan', 'Come osi far piangere\nmia sorella? La pagherai!'],
  ['Ethan', 'Accidenti, sei bravo.'],
  ['Ethan', "Te l'avevo detto che\nl'avresti pagata."],
  ['Venny', 'Sei piuttosto bravo.\nVuoi giocare con me?'],
  ['Venny', 'Avevo ragione:\nsei davvero bravo.'],
  ['Venny', 'Mi sbagliavo.\nRiproviamo piu tardi?'],
  ['Snowy', 'Sfida casuale! Via!'],
  ['Snowy', 'Ah, la mia sfida casuale\nha fallito. Hai vinto.'],
  ['Snowy', 'Evviva! Le sfide casuali\nsono fantastiche.\nRiproviamo piu tardi?'],
  ['Susan', 'Sei davvero interessante.\nTi va una partita\na carte con me?'],
  ['Susan', 'Molto divertente: sei abile\nnel gioco delle carte.\nBen fatto.'],
  ['Susan', 'Mmm... mi dispiace,\nti avevo giudicato male.\nDevi ancora allenarti.'],
]);

export function storyStageConfig(stageIndex) {
  const stage = STORY_STAGES[stageIndex];
  if (!stage) throw new RangeError(`Invalid story stage ${stageIndex}`);
  const cpu = stage.aiNoiseLevel >= 0;
  return {
    ...stage,
    stageIndex,
    mode: cpu ? MODE.VS_CPU : MODE.SOLITAIRE,
    initialScore: cpu ? [0, 0] : [solitaireInitialMisses(stage.difficulty), 0],
    opponent: cpu ? OPPONENTS[Math.floor(stageIndex / 2)] : null,
  };
}

export function storyOutcome(stageIndex, game) {
  const stage = STORY_STAGES[stageIndex];
  if (!stage) throw new RangeError(`Invalid story stage ${stageIndex}`);
  const cpu = stage.aiNoiseLevel >= 0;
  const won = cpu ? game.score[1] < game.score[0] : game.score[0] > 0 && game.winner === 0;
  return {
    won,
    sceneId: won ? stage.winScene : stage.loseScene,
    nextStage: won ? stage.winNext : stage.loseNext,
  };
}

export function storyScene(sceneId, language = 'en') {
  if (sceneId < 64) return null;
  const index = sceneId - 64;
  const source = language === 'it' ? SCENE_IT : SCENE_EN;
  const item = source[index];
  if (!item) return null;
  const portraitIndex = Math.floor(index / 3);
  const speaker = item[0];
  const text = item[1];
  let rawText = `<${speaker}>\n${text}`;
  // Historical 0.02 quirk: opponent5LoseText (scene 77) has no $00
  // terminator and falls straight through into opponent5WinText. Preserve the
  // user-visible byte-stream here; scene 78 still starts at the win text.
  if (index === 13) {
    const win = source[14];
    rawText += `\n\n<${win[0]}>\n${win[1]}`;
  }
  return {
    id: sceneId,
    index,
    portraitIndex,
    speaker,
    text,
    rawText,
  };
}

// Pre-game text screens. English is transcribed from 0.02 litetitle.s.
export const SOLO_INSTRUCTION_LINES = Object.freeze({
  en: Object.freeze([
    'Flip two cards, and if they',
    'match, you keep them. If',
    "they don't, flip them back.",
    "Good luck; you'll need it!",
  ]),
  it: Object.freeze([
    'Gira due carte: se sono',
    'uguali, le tieni. Se non',
    'coincidono, ricoprile.',
    'Buona fortuna: servira!',
  ]),
});

export const TWO_PLAYER_INSTRUCTION_LINES = Object.freeze({
  en: Object.freeze([
    'Press the A and B Buttons',
    'when the other player',
    'gives you the controller,',
    'and flip two cards.',
    "If they don't match, it's",
    "the other player's turn.",
    'Match more pairs than the',
    'other player to win.',
  ]),
  it: Object.freeze([
    'Premi A e B quando',
    'l altro giocatore ti',
    'passa il controller,',
    'poi gira due carte.',
    'Se non coincidono, passa',
    'il turno all altro.',
    'Trova piu coppie dell altro',
    'giocatore per vincere.',
  ]),
});

// The original Select/details screen is moved to the dedicated Credits page
// in the Libre Arcade UI. Build-time text is intentionally omitted because it
// was generated by the 2010 assembler rather than being stable source text.
export const CREDITS_LINES = Object.freeze({
  en: Object.freeze([
    'Concentration Room 0.02',
    '',
    '(c) 2010 Damian Yerrick',
    '',
    'Comes with ABSOLUTELY NO',
    'WARRANTY. This is free',
    'software, and you are',
    'welcome to spread it',
    'under certain conditions;',
    'see GPLv3 for details.',
    '',
    'Program by Damian Yerrick',
    'Graphics by Damian Yerrick',
    'and Sara Crickard',
    '',
    'HTML5 port by',
    'Libre Arcade',
    '',
    'linkingtechnologies.github.io',
    '/libre-arcade/',
  ]),
  it: Object.freeze([
    'Concentration Room 0.02',
    '',
    '(c) 2010 Damian Yerrick',
    '',
    'Distribuito SENZA ALCUNA',
    'GARANZIA. E software libero',
    'e puo essere ridistribuito',
    'alle condizioni della',
    'licenza GPLv3.',
    '',
    'Programma: Damian Yerrick',
    'Grafica: Damian Yerrick',
    'e Sara Crickard',
    '',
    'Versione HTML5:',
    'Libre Arcade',
    '',
    'linkingtechnologies.github.io',
    '/libre-arcade/',
  ]),
});
