export async function loadAiProfiles(locale = 'it', base = 'config/players') {
  const manifest = await fetch(`${base}/ai-profiles.json`).then(r => {
    if (!r.ok) throw new Error(`Unable to load AI profile manifest (${r.status})`);
    return r.json();
  });
  const selected = manifest.locales.includes(locale) ? locale : manifest.defaultLocale;
  const content = await fetch(`${base}/i18n/${selected}.json`).then(r => {
    if (!r.ok) throw new Error(`Unable to load AI profile locale ${selected} (${r.status})`);
    return r.json();
  });
  const byId = Object.fromEntries(manifest.players.map(player => [player.id, player]));
  return { manifest, locale: selected, content, byId };
}
