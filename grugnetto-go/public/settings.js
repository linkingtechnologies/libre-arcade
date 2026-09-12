// settings.js — persisted player preferences (master volume, language), localStorage-backed,
// same isolation pattern as progress.js (every localStorage touch stays behind these functions,
// nothing calls localStorage directly elsewhere in the game). Requested live ("mettiamo 3 e 5" —
// touch controls and a volume/language settings screen, from a "cosa manca" readiness review).
//
// `lang` defaults to null ("follow the browser/host" — see index.html's own pickLanguage() call
// and dashboard-grugnetto-go.inc.php's PHP-side $_CAMILA['lang']) rather than a hardcoded
// language: this module has no opinion on which languages exist or which one is "default", it
// only remembers an explicit override once the player actually picks one.
const KEY = "libre-arcade:grugnetto-go:settings";
const DEFAULTS = { volume: 1, lang: null };

function read() {
  try {
    return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY)) || {});
  } catch {
    return Object.assign({}, DEFAULTS);
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // private browsing, storage disabled, etc — non-essential, the choice just won't persist
  }
}

export function getVolume() {
  return read().volume;
}

export function setVolume(volume) {
  const data = read();
  data.volume = volume;
  write(data);
}

export function getLang() {
  return read().lang;
}

export function setLang(lang) {
  const data = read();
  data.lang = lang;
  write(data);
}
