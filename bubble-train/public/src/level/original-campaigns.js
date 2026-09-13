// SPDX-License-Identifier: GPL-3.0-or-later

/** Metadata for the five game manifests shipped with Bubble Train 1.0. */
export const ORIGINAL_CAMPAIGNS = Object.freeze([
  Object.freeze({ id: 'easy', name: 'Easy', manifest: 'Easy.gms', levels: 10 }),
  Object.freeze({ id: 'normal', name: 'Normal', manifest: 'Normal.gms', levels: 20 }),
  Object.freeze({ id: 'hard', name: 'Hard', manifest: 'Hard.gms', levels: 20 }),
  Object.freeze({ id: 'bubbletrain', name: 'Bubble Train', manifest: 'BubbleTrain.gms', levels: 11 }),
  Object.freeze({ id: 'everything', name: 'Everything', manifest: 'Everything.gms', levels: 50 })
]);

export const DEFAULT_ORIGINAL_CAMPAIGN = 'easy';

const DIRECTORY_CASE = Object.freeze({
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  bubbletrain: 'BubbleTrain'
});

export function getOriginalCampaign(id = DEFAULT_ORIGINAL_CAMPAIGN) {
  return ORIGINAL_CAMPAIGNS.find(c => c.id === id) ?? ORIGINAL_CAMPAIGNS[0];
}

/**
 * Return the byte-preserved manifest path relative to data/original-levels/.
 */
export function originalManifestPath(id = DEFAULT_ORIGINAL_CAMPAIGN) {
  return `files/${getOriginalCampaign(id).manifest}`;
}

/**
 * Resolve a historical .gms src value without rewriting the original XML.
 * The shipped manifests use easy/normal/hard lowercase while the archive
 * stores Easy/Normal/Hard directories. Old target filesystems tolerated this;
 * case-sensitive web hosting does not.
 */
export function resolveOriginalLevelPath(src) {
  const value = String(src ?? '').replaceAll('\\', '/');
  const parts = value.split('/').filter(Boolean);
  if (!parts.length || parts.some(p => p === '.' || p === '..')) throw new Error(`Invalid historical level path: ${src}`);
  const canonical = DIRECTORY_CASE[parts[0].toLowerCase()] ?? parts[0];
  return `files/${[canonical, ...parts.slice(1)].join('/')}`;
}
