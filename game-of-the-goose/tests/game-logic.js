const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
    const root = path.resolve(__dirname, "..", "public");
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "goose-logic-"));
    try {
        fs.writeFileSync(path.join(temp, "package.json"), '{"type":"module"}\n');
        const rulesSource = fs
            .readFileSync(path.join(root, "src/rulesets.js"), "utf8")
            .replace('from "./i18n"', 'from "./i18n.js"');
        fs.writeFileSync(path.join(temp, "rulesets.js"), rulesSource);
        fs.copyFileSync(path.join(root, "src/i18n.js"), path.join(temp, "i18n.js"));
        const gameSource = fs
            .readFileSync(path.join(root, "src/game.js"), "utf8")
            .replace('from "./rulesets.js"', 'from "./rulesets.js"');
        fs.writeFileSync(path.join(temp, "game.js"), gameSource);

        const { GooseGame } = await import(pathToFileURL(path.join(temp, "game.js")).href + `?t=${Date.now()}`);
        const { rulesets } = await import(pathToFileURL(path.join(temp, "rulesets.js")).href + `?t=${Date.now()}`);

        function context({ numPlayers = 2, currentPlayer = "0", dice = [1] } = {}) {
            const endTurns = [];
            return {
                numPlayers,
                currentPlayer,
                gameover: undefined,
                turn: 1,
                events: { endTurn: (options) => endTurns.push(options || null) },
                random: { D6: () => dice.slice() },
                log: { setMetadata: () => {} },
                _endTurns: endTurns,
            };
        }

        function startedGame(ruleset, opts = {}) {
            const ctx = context(opts);
            const G = GooseGame.setup(ctx, { ruleset });
            GooseGame.moves.startGame(G, ctx, Object.fromEntries(Object.keys(G.players).map((id) => [id, `P${id}`])));
            return { G, ctx };
        }

        // Game setup constraints must mirror the UI contract.
        assert.equal(GooseGame.validateSetupData({ ruleset: "modern" }, 1), undefined);
        assert.equal(GooseGame.validateSetupData({ ruleset: "classic" }, 6), undefined);
        assert.match(GooseGame.validateSetupData({ ruleset: "modern" }, 0), /1 and 6/);
        assert.match(GooseGame.validateSetupData({ ruleset: "classic" }, 7), /1 and 6/);
        assert.match(GooseGame.validateSetupData({ ruleset: "unknown" }, 2), /Unknown ruleset/);

        // Invalid setup data must never poison later ruleset lookups.
        {
            const ctx = context();
            const G = GooseGame.setup(ctx, { ruleset: "not-a-ruleset" });
            assert.equal(G.ruleset, "modern");
        }

        // A game cannot start with an incomplete player list.
        {
            const ctx = context({ numPlayers: 2 });
            const G = GooseGame.setup(ctx, { ruleset: "modern" });
            GooseGame.moves.startGame(G, ctx, { "0": "Only host" });
            assert.equal(G.started, false);
        }

        // Player names are treated as display text and bounded before entering game state.
        {
            const ctx = context({ numPlayers: 1 });
            const G = GooseGame.setup(ctx, { ruleset: "modern" });
            GooseGame.moves.startGame(G, ctx, { "0": "   " + "x".repeat(80) + "   " });
            assert.equal(G.players["0"].name.length, 40);
        }

        // Basic modern move + move-again tile (0 -> 1 -> 2 on a roll of 1).
        {
            const { G, ctx } = startedGame("modern", { numPlayers: 1, dice: [1] });
            GooseGame.moves.rollDice(G, ctx);
            assert.deepEqual(G.dice, [1]);
            GooseGame.moves.updatePlayer(G, ctx);
            assert.equal(G.players["0"].tileNumber, 2);
            assert.equal(ctx._endTurns.length, 1);
        }

        // Classic special opening 3+6 lands on 26 and ends the turn exactly once.
        {
            const { G, ctx } = startedGame("classic", { numPlayers: 1, dice: [3, 6] });
            GooseGame.moves.rollDice(G, ctx);
            GooseGame.moves.updatePlayer(G, ctx);
            assert.equal(G.players["0"].tileNumber, 26);
            assert.equal(ctx._endTurns.length, 1);
        }

        // Modern tile 26 repeat-turn rule must not call endTurn twice.
        {
            const { G, ctx } = startedGame("modern", { numPlayers: 1, dice: [1] });
            G.players["0"].tileNumber = 25;
            GooseGame.moves.rollDice(G, ctx);
            GooseGame.moves.updatePlayer(G, ctx);
            assert.equal(G.players["0"].tileNumber, 26);
            assert.equal(ctx._endTurns.length, 1);
            assert.deepEqual(ctx._endTurns[0], { next: "0" });
        }

        // A duplicate roll request while a roll is pending is a no-op.
        {
            const { G, ctx } = startedGame("modern", { numPlayers: 1, dice: [4] });
            GooseGame.moves.rollDice(G, ctx);
            GooseGame.moves.rollDice(G, ctx);
            assert.deepEqual(G.dice, [4]);
            assert.equal(ctx._endTurns.length, 0);
        }

        // Exact-finish bounce remains on the board.
        {
            const { G, ctx } = startedGame("modern", { numPlayers: 1, dice: [4] });
            G.players["0"].tileNumber = 62;
            GooseGame.moves.rollDice(G, ctx);
            GooseGame.moves.updatePlayer(G, ctx);
            assert.equal(G.players["0"].tileNumber, 60);
            assert.deepEqual(G.players["0"].moveList.slice(0, 2), [[62, 63], [63, 60]]);
        }

        // Classic well blocks a player when nobody else is on the tile.
        {
            const { G, ctx } = startedGame("classic", { numPlayers: 2, dice: [1, 1] });
            G.players["0"].tileNumber = 31;
            G.players["0"].stuck = true;
            GooseGame.moves.rollDice(G, ctx);
            assert.equal(G.rollDice, false);
            assert.equal(ctx._endTurns.length, 1);
        }

        // Modern well can be escaped by rolling 6.
        {
            const { G, ctx } = startedGame("modern", { numPlayers: 1, dice: [6] });
            G.players["0"].tileNumber = 31;
            G.players["0"].stuck = true;
            GooseGame.moves.rollDice(G, ctx);
            GooseGame.moves.updatePlayer(G, ctx);
            assert.equal(G.players["0"].stuck, false);
            assert.equal(G.players["0"].tileNumber, 37);
        }

        // Draw detection must evaluate each stuck player's own escape condition, not only ctx.currentPlayer.
        {
            const { G, ctx } = startedGame("classic", { numPlayers: 3, currentPlayer: "0", dice: [1, 1] });
            G.players["0"].tileNumber = 52;
            G.players["1"].tileNumber = 31;
            G.players["2"].tileNumber = 31;
            for (const player of Object.values(G.players)) player.stuck = true;
            assert.equal(GooseGame.endIf(G, ctx), undefined, "players sharing a trap can still free each other");

            G.players["2"].tileNumber = 52;
            // Now 0 and 2 share prison, so they can still free each other.
            assert.equal(GooseGame.endIf(G, ctx), undefined);

            G.players["0"].tileNumber = 31;
            G.players["1"].tileNumber = 52;
            G.players["2"].tileNumber = 19;
            // Player 2 is marked stuck on a non-stuck event; this malformed state must not be declared a draw.
            assert.equal(GooseGame.endIf(G, ctx), undefined);
        }

        // Classic 4+5 opening uses the implemented destination 53.
        {
            const { G, ctx } = startedGame("classic", { numPlayers: 1, dice: [4, 5] });
            GooseGame.moves.rollDice(G, ctx);
            GooseGame.moves.updatePlayer(G, ctx);
            assert.equal(G.players["0"].tileNumber, 53);
        }

        // Modern event destinations / penalties remain internally coherent.
        {
            const eventCases = [
                { from: 5, dice: [1], tile: 12 },  // bridge 6 -> 12
                { from: 14, dice: [1], tile: 9 },  // birdcage 15 -> 9
                { from: 38, dice: [1], tile: 33 }, // stairs 39 -> 33
                { from: 41, dice: [1], tile: 30 }, // maze 42 -> 30
                { from: 57, dice: [1], tile: 0 },  // graveyard 58 -> 0
            ];
            for (const test of eventCases) {
                const { G, ctx } = startedGame("modern", { numPlayers: 1, dice: test.dice });
                G.players["0"].tileNumber = test.from;
                GooseGame.moves.rollDice(G, ctx);
                GooseGame.moves.updatePlayer(G, ctx);
                assert.equal(G.players["0"].tileNumber, test.tile, `modern event from ${test.from}`);
            }
        }

        // Modern prison assigns two skipped turns, then consumes exactly one per roll attempt.
        {
            const { G, ctx } = startedGame("modern", { numPlayers: 1, dice: [1] });
            G.players["0"].tileNumber = 51;
            GooseGame.moves.rollDice(G, ctx);
            GooseGame.moves.updatePlayer(G, ctx);
            assert.equal(G.players["0"].tileNumber, 52);
            assert.equal(G.players["0"].skipTurns, 2);
            GooseGame.moves.rollDice(G, ctx);
            assert.equal(G.players["0"].skipTurns, 1);
            assert.equal(ctx._endTurns.length, 2);
        }

        // Modern leapfrog jumps immediately in front of the nearest player ahead.
        {
            const { G, ctx } = startedGame("modern", { numPlayers: 3, dice: [3] });
            G.players["1"].tileNumber = 8;
            G.players["2"].tileNumber = 12;
            GooseGame.moves.rollDice(G, ctx);
            GooseGame.moves.updatePlayer(G, ctx);
            assert.equal(G.players["0"].tileNumber, 9);
        }

        // Classic maze preserves the historically implemented 42 -> 37 variant.
        {
            const { G, ctx } = startedGame("classic", { numPlayers: 1, dice: [1, 1] });
            G.players["0"].tileNumber = 40;
            GooseGame.moves.rollDice(G, ctx);
            GooseGame.moves.updatePlayer(G, ctx);
            assert.equal(G.players["0"].tileNumber, 37);
        }

        // Broad movement sweep: every legal die result from every board tile stays 0..63.
        for (const [rulesetName, rules] of Object.entries(rulesets)) {
            const diceCombos = rules.DICE_COUNT === 1
                ? [1, 2, 3, 4, 5, 6].map((n) => [n])
                : Array.from({ length: 6 }, (_, a) => Array.from({ length: 6 }, (_, b) => [a + 1, b + 1])).flat();
            for (let tile = 0; tile <= 63; tile++) {
                for (const dice of diceCombos) {
                    const { G, ctx } = startedGame(rulesetName, { numPlayers: 1, dice });
                    G.players["0"].tileNumber = tile;
                    GooseGame.moves.rollDice(G, ctx);
                    if (G.rollDice) GooseGame.moves.updatePlayer(G, ctx);
                    const result = G.players["0"].tileNumber;
                    assert(Number.isInteger(result) && result >= 0 && result <= 63, `${rulesetName} ${tile} ${dice} -> ${result}`);
                }
            }
        }

        // Deterministic full-game simulations exercise repeated turn/event interactions.
        function seededRandom(seed) {
            let state = seed >>> 0;
            return () => {
                state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
                return state / 0x100000000;
            };
        }

        for (const [rulesetName, rules] of Object.entries(rulesets)) {
            for (let simulation = 0; simulation < 20; simulation++) {
                const rand = seededRandom(0xC0FFEE + simulation * 97 + (rulesetName === "classic" ? 1 : 0));
                const numPlayers = 4;
                const ctx = {
                    numPlayers,
                    currentPlayer: "0",
                    gameover: undefined,
                    turn: 1,
                    playOrder: ["0", "1", "2", "3"],
                    playOrderPos: 0,
                    random: {
                        D6: (count = 1) => {
                            const values = Array.from({ length: count }, () => 1 + Math.floor(rand() * 6));
                            return count === 1 ? values[0] : values;
                        },
                    },
                    log: { setMetadata: () => {} },
                    events: {
                        endTurn: (options = {}) => {
                            const next = options && options.next;
                            if (next !== undefined) {
                                ctx.currentPlayer = String(next);
                                ctx.playOrderPos = ctx.playOrder.indexOf(ctx.currentPlayer);
                            } else {
                                ctx.playOrderPos = (ctx.playOrderPos + 1) % ctx.playOrder.length;
                                ctx.currentPlayer = ctx.playOrder[ctx.playOrderPos];
                            }
                            ctx.turn++;
                        },
                    },
                };
                const G = GooseGame.setup(ctx, { ruleset: rulesetName });
                GooseGame.moves.startGame(G, ctx, Object.fromEntries(ctx.playOrder.map((id) => [id, `P${id}`])));

                let result;
                for (let steps = 0; steps < 5000 && !result; steps++) {
                    const actingPlayer = ctx.currentPlayer;
                    GooseGame.moves.rollDice(G, ctx);
                    if (G.rollDice) {
                        // updatePlayer must be executed by the same acting player before endTurn changes context.
                        assert.equal(ctx.currentPlayer, actingPlayer);
                        GooseGame.moves.updatePlayer(G, ctx);
                    }
                    for (const player of Object.values(G.players)) {
                        assert(Number.isInteger(player.tileNumber));
                        assert(player.tileNumber >= 0 && player.tileNumber <= rules.MAX_MOVE_COUNT);
                        assert(player.skipTurns >= 0);
                    }
                    result = GooseGame.endIf(G, { ...ctx, currentPlayer: actingPlayer });
                }
                assert(result, `${rulesetName} simulation ${simulation} did not terminate within 5000 turns`);
            }
        }

        console.log("Game logic tests passed.");
    } finally {
        fs.rmSync(temp, { recursive: true, force: true });
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
