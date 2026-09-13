const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
    const root = path.resolve(__dirname, "..", "public");
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "goose-i18n-"));
    try {
        fs.copyFileSync(path.join(root, "src/i18n.js"), path.join(temp, "i18n.mjs"));
        const rulesSource = fs
            .readFileSync(path.join(root, "src/rulesets.js"), "utf8")
            .replace('from "./i18n.js"', 'from "./i18n.mjs"');
        fs.writeFileSync(path.join(temp, "rulesets.mjs"), rulesSource);

        const i18n = await import(pathToFileURL(path.join(temp, "i18n.mjs")).href + `?t=${Date.now()}`);
        const { rulesets } = await import(pathToFileURL(path.join(temp, "rulesets.mjs")).href + `?t=${Date.now()}`);

        const requiredKeys = [
            "meta.title", "common.newGame", "common.close",
            "create.title", "create.gameRules", "create.modern", "create.classic",
            "create.showRules", "create.rulesHint", "create.numPlayers", "create.playerNames",
            "create.startGame", "create.invalidPlayers", "create.playerDefault", "create.playerNameAria",
            "game.turn", "game.rules", "game.roll", "game.moveAgain", "game.tileAria",
            "game.playerAria", "game.won", "game.draw", "game.updateError", "game.newGameError",
            "gameMessages.skippedTurn", "gameMessages.stuckSkippedTurn",
            "dice.aria", "rulesets.modern", "rulesets.classic",
            "rules.intro", "rules.exactFinish", "rules.drawIfStuck", "rules.moveAgain", "rules.obstacles",
            "rules.oneDie", "rules.manyDice",
        ];

        for (const language of ["en", "it"]) {
            for (const key of requiredKeys) {
                const value = i18n.t(key, { number: 2, value: 6, turn: 3, name: "Ada", tile: 42, text: "Maze", count: 2, max: 63, dice: "2 dice", tiles: "5, 9" }, language);
                assert(value && value !== key, `Missing ${language} translation: ${key}`);
            }
        }

        assert.equal(i18n.t("create.playerDefault", { number: 2 }, "en"), "Player 2");
        assert.equal(i18n.t("create.playerDefault", { number: 2 }, "it"), "Giocatore 2");
        assert.match(i18n.t("game.turn", { turn: 7 }, "it"), /7/);

        for (const [rulesetName, rules] of Object.entries(rulesets)) {
            for (const [tile, event] of Object.entries(rules.TILE_EVENT_MAP)) {
                assert(event.i18nKey, `${rulesetName} tile ${tile} has no i18nKey`);
                for (const language of ["en", "it"]) {
                    const text = i18n.eventText(event, language);
                    const label = i18n.eventLabel(event, language);
                    assert(text && text !== `events.${event.i18nKey}.text`, `Missing ${language} event text for ${event.i18nKey}`);
                    assert(label && label !== `events.${event.i18nKey}.label`, `Missing ${language} event label for ${event.i18nKey}`);
                }
            }
        }

        for (const htmlFile of ["index.html", "create.html", "game.html"]) {
            const html = fs.readFileSync(path.join(root, htmlFile), "utf8");
            const keys = [
                ...html.matchAll(/data-i18n="([^"]+)"/g),
                ...html.matchAll(/data-i18n-aria-label="([^"]+)"/g),
            ].map((match) => match[1]);
            for (const key of keys) {
                for (const language of ["en", "it"]) {
                    assert.notEqual(i18n.t(key, {}, language), key, `${htmlFile}: missing ${language} translation for ${key}`);
                }
            }
        }

        console.log("IT/EN translation audit passed.");
    } finally {
        fs.rmSync(temp, { recursive: true, force: true });
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
