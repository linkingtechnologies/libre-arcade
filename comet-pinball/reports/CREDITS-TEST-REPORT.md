# Credits screen — initial import verification record

- The original dedicated `tests/credits-menu.js` checks attribution, menu navigation, Escape, paused simulation and starting a game after leaving credits.
- The earlier 37-test JavaScript suite passed with unchanged physics and game behavior.
- The managed Chromium gate checked menu/credits/game and four viewports without overflow or page errors; previous controls and music remained unchanged.
- On phones the credits panel uses the full game area to keep the content readable without resizing the playfield.
- At the credits-screen revision only `js/comet.js` changed at runtime, identically in the published and research trees; geometry, physics, camera, music and archived files were unchanged.
- The original JAR was intentionally excluded from the public-repository package because some embedded resources lack independently documented redistribution rights. Physical-device acceptance remained open.
- Credits link directly to https://linkingtechnologies.github.io/libre-arcade/ . This is a historical screen-level report; see the current bilingual-language gate for the later localized credits panel.
