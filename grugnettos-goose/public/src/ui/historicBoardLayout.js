// Historical board-theme metadata only.
// Square geometry lives in data/board-layouts/*.json and gameplay rules stay
// entirely independent from artwork.
//
// v0.14 policy:
// - historical board artwork is bundled locally under assets/boards/original/;
// - no network fallback is used at runtime;
// - square geometry remains independent in data/board-layouts/*.json.

export const GANZENBORD_PD = Object.freeze({
  id: 'ganzenbord-pd',
  title: 'Ganzenbord pd',
  author: 'Pmathijssen',
  nominalWidth: 956,
  nominalHeight: 684,
  artworkUrl: './assets/boards/original/Ganzenbord_pd.svg',
  labelKey: 'boardThemePd',
  captionKey: 'boardThemeCaptionPd'
});

export const GANZENBORDSPEL = Object.freeze({
  id: 'ganzenbordspel',
  title: 'Ganzenbordspel',
  author: 'Daan Hoeksema',
  nominalWidth: 2048,
  nominalHeight: 1470,
  artworkUrl: './assets/boards/original/Ganzenbordspel.jpg',
  labelKey: 'boardThemeHistoric',
  captionKey: 'boardThemeCaptionHistoric'
});

export const HISTORIC_BOARD_THEMES = Object.freeze([
  GANZENBORD_PD,
  GANZENBORDSPEL
]);

export function getHistoricBoardTheme(id = GANZENBORD_PD.id) {
  return HISTORIC_BOARD_THEMES.find((theme) => theme.id === id) ?? GANZENBORD_PD;
}
