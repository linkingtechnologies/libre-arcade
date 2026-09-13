import { rulesets } from "./rulesets";

export const GooseGame = {
    name: "game-of-the-goose",

    setup: (ctx, setupData) => {
        if (!setupData) {
            setupData = { ruleset: "modern" };
        }

        let players = {};
        for (let i = 0; i < ctx.numPlayers; i++) {
            players[i.toString()] = {
                id: i.toString(),
                name: "Player " + i,
                tileNumber: 0,
                moveList: [],
                skipTurns: 0,
                stuck: false,
            };
        }

        return {
            started: false,
            ruleset: setupData.ruleset,
            dice: null,
            rollDice: false,
            players: players,
            infoText: "",
        };
    },

    moves: {
        startGame: (G, ctx, playerList) => {
            for (const [playerID, playerName] of Object.entries(playerList)) {
                G.players[playerID] = {
                    ...G.players[playerID],
                    name: playerName,
                };
            }

            G.started = true;
            ctx.log.setMetadata(`Started game`);
        },
        rollDice: (G, ctx) => {
            const DICE_COUNT = rulesets[G.ruleset].DICE_COUNT;
            const TILE_EVENT_MAP = rulesets[G.ruleset].TILE_EVENT_MAP;

            // Clear move lists
            for (const player of Object.values(G.players)) {
                player.moveList = [];
            }

            // Check if the player has to skip a turn
            if (G.players[ctx.currentPlayer].skipTurns > 0) {
                G.players[ctx.currentPlayer].skipTurns--;

                G.infoText = "Skipped turn.";

                ctx.events.endTurn();
                return;
            }

            // Check if the player is stuck, and has no chance of escaping
            const tileNumber = G.players[ctx.currentPlayer].tileNumber;
            if (
                G.players[ctx.currentPlayer].stuck &&
                TILE_EVENT_MAP[tileNumber].endGameIfAllStuck &&
                !TILE_EVENT_MAP[tileNumber].escapeCondition(G, ctx)
            ) {
                G.infoText = "Player is stuck, skipped turn.";
                ctx.events.endTurn();
                return;
            }

            G.dice = ctx.random.D6(DICE_COUNT);
            ctx.log.setMetadata(`Player ${ctx.currentPlayer} rolled ${G.dice}`);

            G.rollDice = true;
        },
        updatePlayer: (G, ctx) => {
            const TILE_EVENT_MAP = rulesets[G.ruleset].TILE_EVENT_MAP;

            G.rollDice = false;

            // Check if the player is stuck, free player if the escape condition is met
            if (
                G.players[ctx.currentPlayer].stuck &&
                !TILE_EVENT_MAP[G.players[ctx.currentPlayer].tileNumber].escapeCondition(G, ctx)
            ) {
                G.infoText = "Player is stuck, skipped turn.";
                ctx.events.endTurn();
                return;
            }

            G.players[ctx.currentPlayer].stuck = false;

            const diceSum = G.dice.reduce((a, b) => a + b, 0);
            movePlayer(G, ctx, diceSum, 1);

            ctx.events.endTurn();
        },
    },

    endIf: (G, ctx) => {
        const MAX_MOVE_COUNT = rulesets[G.ruleset].MAX_MOVE_COUNT;
        const TILE_EVENT_MAP = rulesets[G.ruleset].TILE_EVENT_MAP;

        // End the game if a player reaches the last tile
        if (G.players[ctx.currentPlayer].tileNumber === MAX_MOVE_COUNT) {
            return { winner: G.players[ctx.currentPlayer].name };
        }

        // End if all players are stuck, resulting in a draw
        if (
            Object.values(G.players).every(
                (player) =>
                    player.stuck &&
                    !TILE_EVENT_MAP[player.tileNumber].escapeCondition(G, ctx) &&
                    TILE_EVENT_MAP[player.tileNumber].endGameIfAllStuck
            )
        ) {
            return { winner: null };
        }
    },
};

function movePlayer(G, ctx, moveCount, moveDirection) {
    const MAX_MOVE_COUNT = rulesets[G.ruleset].MAX_MOVE_COUNT;
    const MOVE_AGAIN_TILES = rulesets[G.ruleset].MOVE_AGAIN_TILES;
    const TILE_EVENT_MAP = rulesets[G.ruleset].TILE_EVENT_MAP;

    let tileNumber = G.players[ctx.currentPlayer].tileNumber;
    let lastTileNumber = tileNumber;
    let nextMoveDirection = moveDirection;

    // Start moving backwards if the the max move count is exceeded
    if (tileNumber + moveCount * moveDirection > MAX_MOVE_COUNT) {
        nextMoveDirection = -1;
        tileNumber = 2 * MAX_MOVE_COUNT - tileNumber - moveCount;

        G.players[ctx.currentPlayer].moveList.push([lastTileNumber, MAX_MOVE_COUNT]);
        lastTileNumber = MAX_MOVE_COUNT;
    } else {
        tileNumber += moveCount * moveDirection;
    }

    // Move player to new tile (updating state)
    G.players[ctx.currentPlayer].tileNumber = tileNumber;
    G.players[ctx.currentPlayer].moveList.push([lastTileNumber, tileNumber]);

    // Handle special tile events
    if (tileNumber in TILE_EVENT_MAP && TILE_EVENT_MAP[tileNumber].condition(G, ctx)) {
        TILE_EVENT_MAP[tileNumber].event(G, ctx);
        G.infoText = TILE_EVENT_MAP[tileNumber].text;
    }

    // Move again using the last throw
    if (MOVE_AGAIN_TILES.includes(G.players[ctx.currentPlayer].tileNumber)) {
        movePlayer(G, ctx, moveCount, nextMoveDirection);
    }
}
