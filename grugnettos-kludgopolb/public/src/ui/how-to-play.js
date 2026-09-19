function interpolate(value, variables) {
  if (typeof value === 'string') {
    return value.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (_, key) => String(variables[key] ?? `{{${key}}}`));
  }
  if (Array.isArray(value)) return value.map(item => interpolate(item, variables));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, interpolate(v, variables)]));
  return value;
}

export async function loadHowToPlay(locale = 'it', base = 'config/how-to-play') {
  const manifest = await fetch(`${base}/manifest.json`).then(r => {
    if (!r.ok) throw new Error(`Unable to load how-to-play manifest (${r.status})`);
    return r.json();
  });
  const selected = manifest.locales.includes(locale) ? locale : manifest.defaultLocale;
  const content = await fetch(`${base}/i18n/${selected}.json`).then(r => {
    if (!r.ok) throw new Error(`Unable to load how-to-play locale ${selected} (${r.status})`);
    return r.json();
  });
  return { manifest, locale: selected, content: interpolate(content, manifest.variables) };
}
