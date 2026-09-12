// i18n.js — UI strings for the standalone launcher (index.html). The Camila-hosted dashboard
// (dashboard-grugnetto-go.inc.php) has its own PHP-side loader (ai_load_lang, reading
// lang/*.lang.php) and injects window.I18N before app.js ever runs — this file exists only
// because index.html is meant to be a fully static, portable page (no PHP available to inject
// anything), so the same strings are duplicated here. Keep in sync with lang/it.lang.php and
// lang/en.lang.php by hand if either changes — there's no build step tying them together.
//
// Both languages are kept (not just one hardcoded default) so index.html's own language switcher
// (window.setGrugnettoLanguage(), wired up in its bootstrap script — see app.js's SettingsScreen()
// for the UI) has real data to switch between — pickLanguage() below is just the FIRST-visit
// default (browser language, falling back to Italian) before any explicit choice is saved.
export const STRINGS = {
  it: {
    "grugnettogo.title": "Grugnetto Go!",
    "grugnettogo.score": "Punti: %s",
    "grugnettogo.controls": "Frecce / WASD per muoversi, Su / W / Spazio per saltare.",
    "grugnettogo.won": "Livello completato!",
    "grugnettogo.error.load": "Impossibile avviare il gioco: %s",
    "grugnettogo.fullscreen": "Attiva/disattiva schermo intero",
    "grugnettogo.play": "Gioca",
    "grugnettogo.back": "Indietro",
    "grugnettogo.loading": "Caricamento...",
    "grugnettogo.world.select": "Scegli",
    "grugnettogo.world.locked": "Completa il mondo precedente per sbloccare",
    "grugnettogo.world.comingsoon": "Prossimamente",
    "grugnettogo.level.select": "Scegli un livello",
    "grugnettogo.level.complete.next": "Prossimo livello",
    "grugnettogo.level.complete.levels": "Selezione livelli",
    "grugnettogo.level.complete.worlds": "Selezione mondo",
    "grugnettogo.gameover": "Game over!",
    "grugnettogo.gameover.retry": "Riprova",
    "grugnettogo.immune": "Immune",
    "grugnettogo.hud.worldlevel": "Mondo %s · Livello %s",
    "grugnettogo.credits": "Crediti",
    "grugnettogo.credits.title": "Crediti",
    "grugnettogo.credits.graphics": "Grafica",
    "grugnettogo.credits.audio": "Audio",
    "grugnettogo.credits.libraries": "Librerie",
    "grugnettogo.mode.select": "Scegli una modalità",
    "grugnettogo.mode.practice": "Esercitazione",
    "grugnettogo.mode.practice.desc": "Prova qualsiasi livello liberamente, senza vincoli",
    "grugnettogo.mode.arcade": "Arcade",
    "grugnettogo.mode.arcade.desc": "Livelli in sequenza, 8 vite in totale",
    "grugnettogo.arcade.complete": "Hai completato la modalità Arcade!",
    "grugnettogo.hometitle": "Torna alla home",
    "grugnettogo.superjump": "Super salto: %s/%s",
    "grugnettogo.combo": "Combo x%s",
    "grugnettogo.bonus.time": "Bonus velocità: +%s",
    "grugnettogo.bonus.nodamage": "Bonus senza danni: +%s",
    "grugnettogo.bonus.coins": "Bonus monete: +%s",
    "grugnettogo.settings": "Impostazioni",
    "grugnettogo.settings.volume": "Volume: %s%",
    "grugnettogo.settings.language": "Lingua",
    "grugnettogo.world.world1.name": "Prato di Casa",
    "grugnettogo.world.world2.name": "Bosco degli Scoiattoli",
    "grugnettogo.world.world3.name": "Dune Dorate",
    "grugnettogo.world.world4.name": "Miniera di Pietra",
    "grugnettogo.level.number": "Livello %s",
    "grugnettogo.mission": "Un'avventura leggendaria aspetta Grugnetto attraverso quattro mondi incantati: dal Prato di Casa al Bosco degli Scoiattoli, dalle Dune Dorate fino alla Miniera di Pietra. Raccogli ogni moneta lungo il cammino: solo così potrai raggiungere il traguardo!",
  },
  en: {
    "grugnettogo.title": "Grugnetto Go!",
    "grugnettogo.score": "Score: %s",
    "grugnettogo.controls": "Arrow keys / WASD to move, Up / W / Space to jump.",
    "grugnettogo.won": "Level complete!",
    "grugnettogo.error.load": "Could not start the game: %s",
    "grugnettogo.fullscreen": "Toggle fullscreen",
    "grugnettogo.play": "Play",
    "grugnettogo.back": "Back",
    "grugnettogo.loading": "Loading...",
    "grugnettogo.world.select": "Select",
    "grugnettogo.world.locked": "Complete the previous world to unlock",
    "grugnettogo.world.comingsoon": "Coming soon",
    "grugnettogo.level.select": "Select a level",
    "grugnettogo.level.complete.next": "Next level",
    "grugnettogo.level.complete.levels": "Level select",
    "grugnettogo.level.complete.worlds": "World select",
    "grugnettogo.gameover": "Game over!",
    "grugnettogo.gameover.retry": "Try again",
    "grugnettogo.immune": "Immune",
    "grugnettogo.hud.worldlevel": "World %s · Level %s",
    "grugnettogo.credits": "Credits",
    "grugnettogo.credits.title": "Credits",
    "grugnettogo.credits.graphics": "Graphics",
    "grugnettogo.credits.audio": "Audio",
    "grugnettogo.credits.libraries": "Libraries",
    "grugnettogo.mode.select": "Choose a mode",
    "grugnettogo.mode.practice": "Practice",
    "grugnettogo.mode.practice.desc": "Try any level freely, no restrictions",
    "grugnettogo.mode.arcade": "Arcade",
    "grugnettogo.mode.arcade.desc": "Levels in sequence, 8 lives total",
    "grugnettogo.arcade.complete": "You completed Arcade mode!",
    "grugnettogo.hometitle": "Back to title",
    "grugnettogo.superjump": "Super jump: %s/%s",
    "grugnettogo.combo": "Combo x%s",
    "grugnettogo.bonus.time": "Speed bonus: +%s",
    "grugnettogo.bonus.nodamage": "No-damage bonus: +%s",
    "grugnettogo.bonus.coins": "Coins bonus: +%s",
    "grugnettogo.settings": "Settings",
    "grugnettogo.settings.volume": "Volume: %s%",
    "grugnettogo.settings.language": "Language",
    "grugnettogo.world.world1.name": "Home Meadow",
    "grugnettogo.world.world2.name": "Squirrel Forest",
    "grugnettogo.world.world3.name": "Golden Dunes",
    "grugnettogo.world.world4.name": "Stone Mine",
    "grugnettogo.level.number": "Level %s",
    "grugnettogo.mission": "A legendary adventure awaits Grugnetto across four enchanted worlds: from the Home Meadow to the Squirrel Forest, through the Golden Dunes and into the Stone Mine. Collect every coin along the way — only then can you reach the goal!",
  },
};

// Today's default: browser language if we have a translation for it, Italian otherwise (this
// game's primary language throughout development) — not a real language picker, just enough to
// not hardcode one language into a page meant to be dropped on any server for anyone.
export function pickLanguage() {
  const nav = (navigator.language || "it").slice(0, 2).toLowerCase();
  return STRINGS[nav] ? nav : "it";
}
