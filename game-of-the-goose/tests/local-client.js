const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
    const root = path.resolve(__dirname, "..", "public");
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "goose-local-client-"));
    try {
        fs.writeFileSync(path.join(temp, "package.json"), '{"type":"module"}\n');
        for (const name of ["i18n.js", "rulesets.js", "game.js", "local-client.js"]) {
            fs.copyFileSync(path.join(root, "src", name), path.join(temp, name));
        }
        const { LocalGameClient } = await import(pathToFileURL(path.join(temp, "local-client.js")).href + `?t=${Date.now()}`);
        const client = new LocalGameClient({ numPlayers: 3, ruleset: "modern" });
        const snapshots = [];
        client.subscribe((state) => snapshots.push(state));
        client.start();
        client.moves.startGame({ "0": "Ada", "1": "Bob", "2": "Carla" });
        assert.equal(client.getState().G.started, true);
        assert.equal(client.getState().ctx.numPlayers, 3);
        assert.equal(client.getState().G.players["0"].name, "Ada");
        client.moves.rollDice();
        assert(Array.isArray(client.getState().G.dice));
        client.moves.updatePlayer();
        assert(client.getState().ctx.turn >= 2);
        assert(snapshots.length >= 4);

        const winnerClient = new LocalGameClient({ numPlayers: 2, ruleset: "modern" });
        winnerClient.start();
        winnerClient.moves.startGame({ "0": "Ada", "1": "Bob" });
        winnerClient.G.players["0"].tileNumber = 62;
        winnerClient.ctx.random.D6 = () => 1;
        winnerClient.moves.rollDice();
        winnerClient.moves.updatePlayer();
        assert.equal(winnerClient.getState().ctx.gameover.winner, "Ada");
        assert.equal(winnerClient.getState().ctx.currentPlayer, "0", "winner stays selected in final state");

        console.log("Local browser client tests passed.");
    } finally {
        fs.rmSync(temp, { recursive: true, force: true });
    }
})().catch((error) => { console.error(error); process.exit(1); });
