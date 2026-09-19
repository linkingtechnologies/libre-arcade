export function defaultLanguage(navigatorLanguage='') {
  return String(navigatorLanguage).toLowerCase().startsWith('it') ? 'it' : 'en';
}

export function normalizeLanguage(storedLanguage, navigatorLanguage='') {
  return storedLanguage === 'it' || storedLanguage === 'en'
    ? storedLanguage
    : defaultLanguage(navigatorLanguage);
}
