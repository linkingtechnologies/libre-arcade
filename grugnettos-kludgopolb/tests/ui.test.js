import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { UI_TEXT } from '../public/src/ui/i18n.js';

test('UI shell covers the same keys in all four languages', () => {
  const keys = Object.keys(UI_TEXT.it).sort();
  assert.deepEqual(Object.keys(UI_TEXT.en).sort(), keys);
  assert.deepEqual(Object.keys(UI_TEXT.fr).sort(), keys);
  assert.deepEqual(Object.keys(UI_TEXT.de).sort(), keys);
});

test('game page is viewport-locked and mobile board has no forced minimum width', () => {
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(css, /html, body[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.app-shell[^}]*height:\s*100dvh/s);
  assert.match(css, /@media \(max-width:780px\)[\s\S]*?\.board\s*\{[^}]*min-width:\s*0/s);
});

test('browser UI imports the production GameController and save contract', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /GameController, serializeSave, deserializeSave/);
  assert.match(js, /controller\.dispatch/);
  assert.match(js, /localStorage\.setItem/);
});


test('new-game setup is player-facing: no visible seed and no internal setup scrolling', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /seedInput|>\s*Seed\s*</i);
  assert.doesNotMatch(js, /seedInput/);
  assert.match(js, /function createInternalSeed\(/);
  assert.match(css, /\.setup-dialog form\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.setup-dialog \.cpu-grid\s*\{[^}]*repeat\(2,/s);
});


test('CPU pawns are loaded from config and rendered as images, not initials', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /fetch\('config\/pawns\.json'\)/);
  assert.match(js, /cpuTokenAsset/);
  assert.doesNotMatch(js, /TOKEN_SHORT/);
});

test('trade coin UI uses player-facing direction controls instead of signed amounts', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /tradeCashDirection/);
  assert.match(js, /cashFromYou/);
  assert.match(js, /cashFromThem/);
  assert.doesNotMatch(js, /min="-\$\{/);
});

test('release-candidate UI has restrained motion with reduced-motion fallback', () => {
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(css, /@keyframes roll-row-pop/);
  assert.match(css, /@keyframes token-arrive/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(js, /animatePacketEvents/);
});

test('board spaces are keyboard accessible and dialogs remain viewport-bounded', () => {
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /setAttribute\('role','button'\)/);
  assert.match(js, /node\.tabIndex = 0/);
  assert.match(js, /e\.key === 'Enter' \|\| e\.key === ' '/);
  assert.match(css, /\.game-dialog\{[^}]*max-width:calc\(100vw - 16px\)/s);
  assert.match(css, /max-height:calc\(100dvh - 28px\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test('release-candidate player-facing copy avoids technical board internals', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const copy = JSON.stringify(UI_TEXT);
  assert.doesNotMatch(html, />\s*Seed\s*</i);
  assert.doesNotMatch(copy, /AI L[012]/);
  for (const lang of ['it','en','fr','de']) {
    assert.ok(UI_TEXT[lang].owner);
    assert.ok(UI_TEXT[lang].auctionPass);
    assert.ok(UI_TEXT[lang].placeInfo);
  }
});

test('localized how-to-play manual is wired into a viewport-bounded UI dialog', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(html, /id="helpBtn"/);
  assert.match(html, /id="helpDialog"/);
  assert.match(js, /loadHowToPlay/);
  assert.match(js, /openHowToPlay/);
  assert.match(css, /\.help-dialog\{[^}]*height:min\(760px,calc\(100dvh - 20px\)\)/s);
  assert.match(css, /\.help-body\{[^}]*overflow:auto/s);
  assert.match(css, /\.help-shell\{[^}]*grid-template-rows:auto minmax\(0,1fr\) auto/s);
});

test('setup exposes localized Grugnetto friend cards without expanding the page', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(html, /id="friendDialog"/);
  assert.match(js, /loadAiProfiles/);
  assert.match(js, /openFriendProfile/);
  assert.match(js, /data-friend/);
  assert.match(css, /\.friend-dialog\{[^}]*max-height:calc\(100dvh - 20px\)/s);
  assert.match(css, /\.friend-card\{[^}]*overflow:auto/s);
  assert.match(css, /\.cpu-choice-wrap\{[^}]*grid-template-columns:minmax\(0,1fr\) 28px/s);
});

test('Pazifik friend card can render localized five-star historical ratings', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(js, /data\.ratings/);
  assert.match(js, /friend-rating/);
  assert.match(js, /★/);
  assert.match(css, /\.friend-ratings/);
});

test('Place details present current rent separately from a readable level schedule', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  for (const lang of ['it','en','fr','de']) {
    assert.ok(UI_TEXT[lang].currentRent);
    assert.ok(UI_TEXT[lang].rentByLevel);
    assert.ok(UI_TEXT[lang].embellishmentCost);
    assert.ok(UI_TEXT[lang].world);
  }
  assert.match(js, /currentRent/);
  assert.match(js, /rent-level/);
  assert.match(js, /completeWorldBonus/);
  assert.match(css, /\.rent-level\.is-current/);
  assert.doesNotMatch(js, /rents\.join\(' \/ '\)/);
  assert.equal(UI_TEXT.en.rent, 'Rent');
});


test('human trade proposals show an explicit accepted or declined result', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(html, /id="tradeResultDialog"/);
  assert.match(js, /function showHumanTradeResult/);
  assert.match(js, /tradeAcceptedTitle/);
  assert.match(js, /tradeDeclinedTitle/);
  assert.match(js, /showHumanTradeResult\(summary,next\)/);
  assert.match(css, /\.trade-result-card\.accepted/);
  assert.match(css, /\.trade-result-card\.declined/);
  for (const lang of ['it','en','fr','de']) {
    assert.ok(UI_TEXT[lang].tradeAcceptedTitle);
    assert.ok(UI_TEXT[lang].tradeDeclinedTitle);
    assert.ok(UI_TEXT[lang].tradeAcceptedMessage);
    assert.ok(UI_TEXT[lang].tradeDeclinedMessage);
  }
});

test('board cell titles use per-cell measured auto-fit instead of a fixed zoom font', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(js, /function titleFitProfile/);
  assert.match(js, /function fitOneSpaceTitle/);
  assert.match(js, /function fitBoardSpaceTitles/);
  assert.match(js, /title\.scrollHeight <= availableHeight/);
  assert.match(js, /title\.scrollWidth <= availableWidth/);
  assert.match(js, /Math\.pow\(clamp\(boardZoom, 1, MAX_BOARD_ZOOM\), 0\.28\)/);
  assert.match(js, /ResizeObserver/);
  assert.match(js, /document\.fonts\?\.ready/);
  assert.doesNotMatch(js, /--space-title-size/);
  assert.match(css, /\.space-title\s*\{/);
  assert.doesNotMatch(css, /type-event strong/);
  assert.match(css, /font-size:var\(--space-price-size/);
});

test('CPU action popups use a durable action-by-action queue in engine event order', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /cpuPopupQueue/);
  assert.match(js, /drainCpuPopupQueue/);
  assert.match(js, /buildCpuActionItems/);
  assert.match(js, /popupActionLabel/);
  assert.match(js, /cpuActionMessage/);
  assert.match(js, /function cpuPopupHoldMs\(\).*2700/s);
  assert.match(js, /CPU_POPUP_EVENT_TYPES/);
  assert.doesNotMatch(js, /buildCpuTurnGroups/);
});

test('event strip notifications are queued across packets instead of cancelling the previous sequence', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /eventStripQueue/);
  assert.match(js, /enqueueEventStripNotifications/);
  assert.match(js, /drainEventStripQueue/);
  assert.doesNotMatch(js, /const runId = \+\+notificationRunId/);
  assert.doesNotMatch(js, /runId !== notificationRunId/);
});


test('zoomed board can auto-follow the active pawn and manual pan suspends follow', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="followBtn"/);
  assert.match(js, /function centerBoardOnSpace/);
  assert.match(js, /function followCurrentTurn/);
  assert.match(js, /function suspendAutoFollow/);
  assert.match(js, /MANUAL_FOLLOW_PAUSE_MS\s*=\s*6000/);
});

test('board exposes normal and fast animation speeds in every UI language', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="speedSelect"/);
  assert.match(js, /ANIMATION_SPEED_KEY/);
  assert.match(js, /cpuPopupHoldMs/);
  for (const lang of ['it','en','fr','de']) {
    assert.ok(UI_TEXT[lang].animationSpeed);
    assert.ok(UI_TEXT[lang].speedNormal);
    assert.ok(UI_TEXT[lang].speedFast);
  }
});

test('players expose world completion progress and board Places use symbol plus colour', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(js, /worldProgressMarkup/);
  assert.match(js, /worldEmoji/);
  assert.match(js, /space-world-symbol/);
  assert.match(css, /\.world-progress-chip/);
  assert.match(css, /\.space-world-symbol/);
});

test('double tap or double click can zoom and center a board space', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /DOUBLE_TAP_MS\s*=\s*320/);
  assert.match(js, /function handleSpaceClick/);
  assert.match(js, /function focusSpace/);
  assert.match(js, /node\.addEventListener\('click', \(\) => handleSpaceClick\(index\)\)/);
});

test('active player is visually emphasized on both list and board token', () => {
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(css, /\.player-card\.current/);
  assert.match(css, /\.board-token\.current-turn/);
  assert.match(js, /current-turn/);
});

test('the recent-turns log is gone: the turn review already shows each CPU turn', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /miniLog/);
  assert.doesNotMatch(js, /turnSummaryHistory|renderLog/);
  assert.equal(Object.values(UI_TEXT).some(lang => 'recentTurnsTitle' in lang), false);
});


test('manual saves remain separate from automatic refresh recovery', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /const SAVE_KEY = 'grugnettos-kludgopolb\.save\.v1'/);
  assert.match(js, /const AUTOSAVE_KEY = 'grugnettos-kludgopolb\.autosave\.v1'/);
  assert.match(js, /storage\.set\(SAVE_KEY,serializeSave\(controller\)\)/);
  assert.match(js, /storage\.set\(AUTOSAVE_KEY, serializeSave\(controller\)\)/);
});


test('active game is autosaved after state packets and again when the page is hidden', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /function autosaveGame\(/);
  assert.match(js, /function processPacket[\s\S]*?autosaveGame\(\);/);
  assert.match(js, /pagehide[\s\S]*?autosaveGame/);
  assert.match(js, /visibilitychange[\s\S]*?autosaveGame/);
});

test('startup offers a localized resume-or-new-game recovery dialog for valid autosaves', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="recoveryDialog"/);
  assert.match(js, /function offerRecoveryOrSetup\(/);
  assert.match(js, /deserializeSave\(\{board,json\}\)/);
  assert.match(js, /recoveryResume/);
  assert.match(js, /recoveryNewGame/);
  assert.match(js, /offerRecoveryOrSetup\(\)/);
  for (const lang of ['it','en','fr','de']) {
    assert.ok(UI_TEXT[lang].recoveryTitle);
    assert.ok(UI_TEXT[lang].recoveryText);
    assert.ok(UI_TEXT[lang].recoveryResume);
    assert.ok(UI_TEXT[lang].recoveryNew);
    assert.ok(UI_TEXT[lang].recoverySummary);
    assert.ok(UI_TEXT[lang].recoveryTurn);
  }
});


test('title auto-fit profiles keep special labels more restrained than Places', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /site:\s*\{ max: 10\.6, min: 7\.2/);
  assert.match(js, /event:\s*\{ max: 9\.2, min: 6\.8/);
  assert.match(js, /tax:\s*\{ max: 9\.2, min: 6\.8/);
  assert.match(js, /hub:\s*\{ max: 10\.0, min: 7\.0/);
});


test('default board uses a separate illustrated background plus JSON rectangle layout', () => {
  const index = JSON.parse(fs.readFileSync(new URL('../public/boards/index.json', import.meta.url), 'utf8'));
  const entry = index.boards.find(item => item.id === index.defaultBoard);
  assert.equal(entry.layout, 'boards/layouts/grugnetto-islands/layout.json');
  const board = JSON.parse(fs.readFileSync(new URL('../public/boards/grugnetto-32-v1.4/board.json', import.meta.url), 'utf8'));
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  assert.equal(layout.schemaVersion, 1);
  assert.equal(layout.presentation, 'illustrated');
  assert.equal(layout.spaces.length, 32);
  assert.deepEqual(layout.spaces.map(item => item.id), board.spaces.map(item => item.id));
  assert.ok(layout.spaces.every(item => item.w > 0 && item.h > 0));
  assert.equal(layout.regions.length, 4);
  assert.deepEqual(layout.regions.map(region => region.worldId), ['world1','world2','world3','world4']);
  assert.deepEqual(layout.regions.map(region => region.spaceIndexes), [
    [0,1,2,3,4,5,6,7], [8,9,10,11,12,13,14,15], [16,17,18,19,20,21,22,23], [24,25,26,27,28,29,30,31]
  ]);
  assert.deepEqual(layout.connectors.map(item => [item.from,item.to]), [[7,8],[15,16],[23,24],[31,0]]);
  assert.ok(layout.connectors.every(item => Array.isArray(item.waypoints) && item.waypoints.length >= 2));
  assert.deepEqual(layout.spaces.map(item => item.levelRef), Array.from({ length: 32 }, (_, i) => `world${Math.floor(i/8)+1}-level${(i%8)+1}`));
  assert.deepEqual(layout.spaces.map(item => item.visualWorldId), Array.from({ length: 32 }, (_, i) => `world${Math.floor(i/8)+1}`));
  assert.ok(layout.spaces.every(item => item.iconAsset && fs.existsSync(new URL(`../public/${item.iconAsset}`, import.meta.url))));
  for (let i = 0; i < layout.spaces.length; i += 1) {
    const a = layout.spaces[i];
    for (const b of layout.spaces.slice(i + 1)) {
      const overlaps = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      assert.equal(overlaps, false, `layout boxes ${a.index} and ${b.index} overlap`);
    }
  }
  const [, , viewWidth, viewHeight] = layout.viewBox;
  assert.ok(layout.spaces.every(item => item.x >= 0 && item.y >= 0 && item.x + item.w <= viewWidth && item.y + item.h <= viewHeight));
  const c = layout.center;
  assert.ok(layout.spaces.every(item => !(item.x < c.x + c.w && item.x + item.w > c.x && item.y < c.y + c.h && item.y + item.h > c.y)));
  const bg = new URL('../public/boards/layouts/grugnetto-islands/board_blank_tiles.webp', import.meta.url);
  assert.ok(fs.existsSync(bg));
  assert.ok(fs.statSync(bg).size > 100000);
});

test('browser board renderer consumes mapped rectangles and preserves the legacy grid only as fallback', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="boardBackground"/);
  assert.match(js, /function validateBoardLayout/);
  assert.match(js, /function loadBoardLayout/);
  assert.match(js, /function applyBoardLayoutGeometry/);
  assert.match(js, /node\.style\.left/);
  assert.match(js, /tokenAnchor/);
  assert.match(js, /connectorWaypoints/);
  assert.match(js, /iconAsset/);
  assert.match(js, /layout-illustrated/);
  assert.match(js, /Falling back to legacy grid board layout/);
  assert.match(css, /\.board\.layout-map/);
  assert.match(css, /\.board-background/);
  assert.match(css, /\.space-number-overlay\{/);
});


test('package ships exactly one official presentation layout and every board uses it', () => {
  const layoutsRoot = new URL('../public/boards/layouts/', import.meta.url);
  const dirs = fs.readdirSync(layoutsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  assert.deepEqual(dirs, ['grugnetto-islands']);

  const index = JSON.parse(fs.readFileSync(new URL('../public/boards/index.json', import.meta.url), 'utf8'));
  for (const entry of index.boards) {
    assert.equal(entry.layout, 'boards/layouts/grugnetto-islands/layout.json');
  }
});


test('local data reset is localized, project-scoped and autosave-safe', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /LOCAL_STORAGE_KEYS/);
  assert.match(js, /function clearLocalData\(/);
  assert.match(js, /suppressAutosave = true/);
  assert.match(js, /for \(const key of LOCAL_STORAGE_KEYS\) storage\.remove\(key\)/);
  assert.doesNotMatch(js, /localStorage\.clear\(/);
  for (const lang of ['it','en','fr','de']) {
    assert.ok(UI_TEXT[lang].clearLocalData);
    assert.ok(UI_TEXT[lang].clearLocalDataConfirm);
  }
});

test('RC38 illustrated layout keeps the central island scenic-only and the HUD compact', () => {
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.equal(layout.centerHub?.role, 'scenic-only');
  assert.equal(layout.spaces.length, 32);
  assert.deepEqual(layout.spaces.map(space => space.index), Array.from({length:32}, (_, i) => i));
  const c = layout.center;
  const overlaps = layout.spaces.filter(space => !(
    space.x + space.w <= c.x || c.x + c.w <= space.x ||
    space.y + space.h <= c.y || c.y + c.h <= space.y
  ));
  assert.deepEqual(overlaps, []);
  assert.ok(c.w <= 170 && c.h <= 100);
  assert.match(css, /\.board\.layout-illustrated \.space-title\{\s*display:none;/s);
  assert.match(css, /\.board\.layout-illustrated \.space-icon\{[^}]*width:42%/s);
  assert.match(css, /\.board\.layout-illustrated \.center-message h2,[\s\S]*\.board\.layout-illustrated \.event-strip\{\s*display:none;/s);
});


test('RC39 world labels are live localized overlays and typography is readability-first', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  const en = JSON.parse(fs.readFileSync(new URL('../public/boards/grugnetto-32-v1.4/i18n/en.json', import.meta.url), 'utf8'));
  assert.match(html, /id="worldLabels" class="world-label-layer"/);
  assert.equal(layout.worldLabels.length, 4);
  assert.deepEqual(layout.worldLabels.map(item => item.worldId).sort(), ['world1','world2','world3','world4']);
  assert.match(js, /function renderWorldLabels\(/);
  assert.match(js, /node\.textContent = worldName\(label\.worldId\)/);
  assert.match(css, /\.board-world-label\{/);
  assert.match(css, /Atkinson Hyperlegible Next/);
  assert.match(css, /FreeSans/);
  assert.match(css, /Verdana/);
  assert.doesNotMatch(css.split('\n').slice(0,12).join('\n'), /ui-rounded/);
  assert.equal(en.worlds.world1, 'Home Meadow');
  assert.equal(en.worlds.world2, 'Squirrel Woods');
  assert.equal(en.worlds.world3, 'Golden Dunes');
  assert.equal(en.worlds.world4, 'Stone Mine');
});


test('RC42 polish keeps dice in the action panel and world artwork readable', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  assert.doesNotMatch(html, /id="diceBox"/);
  assert.match(html, /id="rollTrackerPanel"/);
  assert.match(js, /roll-decision-card/);
  for (const name of ['home-meadow.png','squirrel-woods.png','golden-dunes.png','stone-mine.png']) {
    assert.ok(fs.existsSync(new URL(`../public/assets/grugnetto/world-icons/${name}`, import.meta.url)));
  }
  assert.match(css, /\.space-world-image\{width:100%;height:100%;border-radius:3px\}/);
  assert.match(css, /\.roll-tracker-dice \.die\{width:32px/);
  assert.ok(layout.center.w <= 150 && layout.center.h <= 78);
});


test('RC44 uses large character-first board pawns', () => {
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const pawns = JSON.parse(fs.readFileSync(new URL('../public/config/pawns.json', import.meta.url), 'utf8'));
  assert.match(css, /\.board-token-layer\{/);
  assert.match(css, /width:clamp\(66px,6\.4vmin,88px\)/);
  assert.match(pawns.cpu.Hans.asset, /grugnetto-go\/enemies\/frog_idle\.png$/);
  assert.match(pawns.cpu.Zilla.asset, /grugnetto-go\/enemies\/slime_normal_rest\.png$/);
  assert.match(pawns.cpu.Queen.asset, /grugnetto-go\/enemies\/bee_rest\.png$/);
});


test('RC47 puts all player dice rolls in the right sidebar', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(html, /id="rollTrackerPanel"/);
  assert.match(html, /id="rollTrackerList"/);
  assert.match(js, /function renderRollTracker\(/);
  assert.match(js, /latestRollsByPlayer = new Map\(/);
  assert.match(css, /\.roll-tracker-row\{/);
  assert.match(css, /\.roll-tracker-dice \.die\{width:32px/);
});


test('RC48 highlights the latest roller, doubles and extra rolls while minimizing duplicate history', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(js, /latest-roll/);
  assert.match(js, /doubleBadge/);
  assert.match(js, /extraRollBadge/);
  assert.doesNotMatch(js, /decisionDiceMarkup\(/);
  assert.match(css, /\.roll-tracker-row\.latest-roll\{/);
  assert.match(css, /\.roll-status-badge\.double\{/);
});


test('RC49 removes turn-review duplication and restores button styling', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /id="turnReviewAck"/);
  assert.match(html, /id="turnReviewPanel"[^>]*hidden/);
  assert.doesNotMatch(html, /miniLogPanel/);
  assert.match(js, /if \(pending\.type === 'TURN_REVIEW'\) return '';/);
  assert.match(js, /turnReviewPanel\.hidden = !active/);
  assert.match(js, /tokenFanOffsets\(playersAtSpace\.length\)/);
  assert.match(css, /\.primary \{ background:#277b48/);
  assert.match(css, /\.turn-review-panel \{ flex:0 1 38%; max-height:38%/);
  assert.match(css, /\.board\.reviewing-turn \.center-panel\{opacity:0/);
  for (const source of [html, js]) {
    for (const match of source.matchAll(/<button\b[^>]*>/g)) assert.match(match[0], /class=/, match[0]);
  }
});


test('RC50 uses artifact-clean background and semantic icon mapping', () => {
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  assert.equal(layout.backgroundRevision, 'artifact-clean-v2');
  assert.equal(layout.semanticIcons, true);
  assert.equal(layout.spaces.length, 32);
  assert.ok(new Set(layout.spaces.map(space => space.iconRole)).size >= 24);
  for (const [index, space] of layout.spaces.entries()) {
    assert.ok(space.iconRole, `missing role ${index}`);
    if (space.iconAsset) assert.equal(fs.existsSync(new URL(`../public/${space.iconAsset}`, import.meta.url)), true, space.iconAsset);
  }
  assert.match(layout.spaces[13].iconAsset, /board-icons\/campfire\.png$/);
  assert.match(layout.spaces[30].iconAsset, /board-icons\/arrow_counterclockwise\.png$/);
  assert.match(layout.spaces[6].iconAsset, /world-icons\/home-meadow\.png$/);
  assert.match(layout.spaces[29].iconAsset, /world-icons\/stone-mine\.png$/);
});


test('RC51 marks the illustrated board center as Grugnetto', () => {
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  assert.equal(layout.backgroundRevision, 'artifact-clean-v2');
  assert.equal(layout.centerCharacter, 'grugnetto');
  assert.equal(fs.existsSync(new URL('../public/boards/layouts/grugnetto-islands/board_blank_tiles.webp', import.meta.url)), true);
});


test('RC53 crowded-board scaling remains intact after later human-token refinements', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(js, /stackScale = count <= 1 \? 1/);
  assert.match(js, /human-shell/);
  assert.match(css, /\.board-token-shell \.board-token\{/);
  assert.match(css, /transform:scale\(var\(--stack-scale,1\)\)/);
  assert.doesNotMatch(css, /content:"▶ TOCCA"/);
});


test('RC54 shows the CPU turn review in the right column and keeps OK after the action list', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(js, /classList\.toggle\('review-mode', active\)/);
  assert.match(js, /\$\{list\}\$\{actions\}/);
  assert.match(js, /turnReviewBody\.scrollTop = 0/);
  assert.doesNotMatch(js, /turnReviewWaiting/);
  assert.match(css, /\.action-panel \.turn-review-panel\{/);
  assert.match(html, /id="decision"[\s\S]*id="turnReviewPanel"[\s\S]*id="rollTrackerPanel"/);
  assert.match(css, /\.turn-review-actions\{\s*position:static/);
  assert.match(html, /<title>Grugnetto's KludgopolB<\/title>/);
  assert.match(html, /class="brand-pig"[^>]*>🐽's<\/span> <strong>KludgopolB<\/strong>/);
});


test('RC55 route-direction layer and fixed human-token infrastructure remain available', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');

  assert.match(html, /id="routeDirections"/);
  assert.match(js, /renderRouteDirections\(\)/);
  assert.match(js, /renderRouteDirections\(\)/);
  assert.match(css, /\.route-direction-layer/);
  assert.match(css, /\.route-arrow/);
  assert.doesNotMatch(js, /token-emoji" aria-hidden="true">🐷/);
});


test("RC56 harmonizes Grugnetto's pawn, avoids center arrows and exposes player holdings", () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const pawns = JSON.parse(fs.readFileSync(new URL('../public/config/pawns.json', import.meta.url), 'utf8'));

  assert.equal(pawns.human.asset, 'assets/grugnetto/grugnetto_token.svg');
  assert.equal(fs.existsSync(new URL('../public/assets/grugnetto/grugnetto_token.svg', import.meta.url)), true);
  assert.match(js, /HUMAN_TOKEN_ASSET/);
  assert.match(js, /ROUTE_ARROW_SPECS/);
  assert.match(js, /const ROUTE_ARROW_SPECS = \[\]/);
  assert.doesNotMatch(js, /ROUTE_ARROW_PAIRS/);
  assert.match(js, /function showPlayerHoldings\(/);
  assert.match(js, /inspected-owner-space/);
  assert.match(js, /inspectPlayer/);
  assert.match(css, /\.grugnetto-token/);
  assert.match(css, /\.holding-row/);
  assert.match(css, /\.board\.inspecting-player \.space\.inspected-owner-space/);
});


test('RC57 exposes goose-style 1-based numbering and compact type badges', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(js, /const spaceNumber = index \+ 1/);
  assert.match(js, /space-type-badge/);
  assert.match(js, /`\$\{t\('space'\)\} \$\{spaceNumber\}/);
  assert.match(css, /\.space-number-overlay\{/);
  assert.match(css, /\.space-type-badge\{/);
});


test('RC58 draws board numbers as a dedicated overlay layer (kept below the pawns)', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(js, /function renderBoardSpaceNumbers/);
  assert.match(js, /boardEl\.querySelectorAll\('\.space-number-overlay'\)/);
  assert.match(js, /renderBoardSpaceNumbers\(\)/);
  assert.match(css, /\.space-number-overlay\{/);
  assert.match(css, /\.board\.layout-illustrated \.space-number\{display:none\}/);
});


test('RC59 exposes draggable number editing controls and simpler illustrated ownable tiles', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.match(html, /id="numberEditBtn"/);
  assert.match(html, /id="numberExportBtn"/);
  assert.match(html, /id="numberResetBtn"/);
  assert.match(js, /function exportBoardNumberPositions/);
  assert.match(js, /function resetBoardNumberPositions/);
  assert.match(js, /function attachNumberDrag/);
  assert.match(js, /storage\.set\(NUMBER_POSITIONS_KEY/);
  assert.match(css, /\.board\.number-edit-mode \.space-number-overlay/);
  assert.match(css, /\.space\.type-site \.space-title,/);
});


test('RC60 maps exactly 32 visible plaques and disables visual route arrows', () => {
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  assert.equal(layout.tileCount, 32);
  assert.equal(layout.tileRevision, '32-visible-tiles-v1');
  assert.equal(layout.spaces.length, 32);
  assert.deepEqual(layout.spaces.map(space => space.index + 1), Array.from({length:32}, (_, i) => i + 1));
  assert.match(js, /const ROUTE_ARROW_SPECS = \[\]/);
  assert.match(css, /\.route-direction-layer\{display:none!important\}/);
  assert.match(css, /\.board\.layout-illustrated \.space\.type-site[\s\S]*border-top-width:1px/);
});


test('RC61 uses a two-family tile grammar and tighter crowded pawn stacks', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  assert.ok(['rc61-remapped-clean-overlay','rc62-background-plaque-runtime-content'].includes(layout.tilePresentation));
  assert.equal(layout.mappingRevision, '32-plaque-physical-path-v4');
  assert.ok(layout.spaces.every(space => space.w === 90 && space.h === 58));
  assert.match(js, /ownable-space/);
  assert.match(js, /special-space/);
  assert.match(js, /count === 4 \? \.58/);
  assert.match(css, /\.space\.ownable-space \.space-price/);
  assert.match(css, /\.space\.special-space \.space-icon/);
});


test('RC62 lets the background own the plaque surface and runtime draw only content', () => {
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  assert.equal(layout.tilePresentation, 'rc62-background-plaque-runtime-content');
  assert.equal(layout.numberPositionRevision, 'v6');
  assert.match(js, /numberPositions\.v6/);
  assert.match(css, /RC62 — the illustrated background owns the tile/);
  assert.match(css, /\.space::before\{[\s\S]*border:0!important;[\s\S]*box-shadow:none!important/);
  assert.match(css, /\.board \.space-number-overlay,[\s\S]*?background:transparent;/);
  assert.equal((css.match(/^\.board \.space-number-overlay,$/gm) || []).length, 1, 'the number badge is styled by a single base rule');
  assert.match(css, /\.space\.ownable-space \.space-price\{[\s\S]*background:transparent!important/);
});


test('RC63 suppresses duplicate world banners on illustrated boards', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  assert.equal(layout.presentation, 'illustrated');
  assert.ok(['background-art', 'runtime-text', 'runtime-banner'].includes(layout.worldLabelPresentation));
  assert.match(js, /boardLayout\?\.presentation === 'illustrated'/);
  assert.match(css, /\.board\.layout-illustrated \.world-label-layer\{display:block!important/);
});


test('RC64 restores localized labels without redrawing banner chrome', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const en = JSON.parse(fs.readFileSync(new URL('../public/boards/grugnetto-32-v1.4/i18n/en.json', import.meta.url), 'utf8'));
  assert.match(js, /banner-overlay-label/);
  assert.match(js, /world-label-scrub/);
  assert.match(js, /world-label-text/);
  assert.doesNotMatch(js, /if \(boardLayout\?\.presentation === 'illustrated'\) return;/);
  assert.match(css, /\.board\.layout-illustrated \.world-label-layer\{display:block!important/);
  assert.match(css, /\.world-label-scrub\{/);
  assert.match(css, /background:transparent/);
  assert.equal(en.worlds.world1, 'Home Meadow');
  assert.equal(en.worlds.world4, 'Stone Mine');
});


test('RC65 fully scrubs baked world names before rendering the localized label', () => {
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(css, /\.banner-overlay-label \.world-label-scrub\{[\s\S]*?z-index:0;/);
  assert.match(css, /\.banner-overlay-label \.world-label-text\{[\s\S]*?display:flex;[\s\S]*?height:100%/);
  assert.match(js, /text\.textContent = worldName\(label\.worldId\)/);
});


test('RC68 renders language-neutral parchment cartouches behind localized world names', () => {
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  const banner = fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/world-banner.svg', import.meta.url), 'utf8');
  assert.equal(layout.worldLabelPresentation, 'runtime-banner');
  assert.equal(layout.worldLabels.length, 4);
  assert.match(css, /world-banner\.svg/);
  assert.match(css, /banner-overlay-label \.world-label-text/);
  assert.match(js, /text\.textContent = worldName\(label\.worldId\)/);
  assert.match(banner, /<svg/);
  assert.doesNotMatch(banner, /Prato di Casa|Bosco degli Scoiattoli|Dune Dorate|Miniera di Pietra|Home Meadow|Squirrel Woods|Golden Dunes|Stone Mine/);
  for (const lang of ['it', 'en', 'fr', 'de']) {
    const locale = JSON.parse(fs.readFileSync(new URL(`../public/boards/grugnetto-32-v1.4/i18n/${lang}.json`, import.meta.url), 'utf8'));
    assert.deepEqual(Object.keys(locale.worlds).sort(), ['world1','world2','world3','world4']);
    assert.ok(Object.values(locale.worlds).every(value => typeof value === 'string' && value.trim().length > 0));
  }
});

test('plaque outlines drive tint, spotlight, hit-testing and focus ring', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/src/ui/app.css', import.meta.url), 'utf8');
  const layout = JSON.parse(fs.readFileSync(new URL('../public/boards/layouts/grugnetto-islands/layout.json', import.meta.url), 'utf8'));
  const outlines = JSON.parse(fs.readFileSync(new URL('../public/' + layout.tileOutlines, import.meta.url), 'utf8'));
  assert.equal(outlines.tiles.length, layout.spaces.length);
  assert.deepEqual(outlines.viewBox, layout.viewBox);
  assert.ok(outlines.tiles.every((tile, index) => tile.index === index && tile.id === layout.spaces[index].id && tile.outline.length >= 3));
  assert.match(js, /function loadTileOutlines/);
  assert.match(js, /function renderTileShapes/);
  assert.match(js, /function spotlightIndexes/);
  assert.match(js, /function tileIndexAtEvent/);
  assert.match(js, /function togglePlayerTint/);
  assert.match(js, /AUCTION_BIDS/);
  assert.match(js, /TRADE_OFFER/);
  assert.match(js, /player-tint-toggle/);
  assert.match(css, /\.tile-tint\{/);
  assert.match(css, /\.spot-dim\{/);
  assert.match(css, /\.focus-ring\{/);
  assert.match(css, /\.board\.shape-hit \.space\{pointer-events:none\}/);
  for (const lang of ['it', 'en', 'fr', 'de']) assert.ok(UI_TEXT[lang].tintProperties);
});

test('every UI text key used by the browser shell exists in the UI dictionary', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  const used = new Set();
  for (const call of js.matchAll(/\b(?:t|tf)\(\s*([^,)]*)/g)) {
    for (const literal of call[1].matchAll(/(['"])([A-Za-z][\w.-]*)\1/g)) used.add(literal[2]);
  }
  assert.ok(used.size > 100, 'the scan should find the shell\'s t()/tf() keys');
  const missing = [...used].filter(key => !(key in UI_TEXT.it));
  assert.deepEqual(missing, [], `t() keys without a UI_TEXT entry: ${missing.join(', ')}`);
});

test('browser storage is only touched through the guarded helper', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /const storage = \{/);
  const outsideHelper = js.replace(/const storage = \{[\s\S]*?\n\};\n/, '');
  assert.doesNotMatch(outsideHelper, /\blocalStorage\b/);
});

test('type badges use the board locale and synthetic tile clicks resolve their own tile', () => {
  const js = fs.readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(js, /locale\?\.types\?\.\[space\.type\]/);
  assert.match(js, /const tile = event\.target\.closest\('\.space'\)/);
});
