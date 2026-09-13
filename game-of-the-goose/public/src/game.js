import { normalizeRuleset, rulesets } from "./rulesets.js";

export const GooseGame = {
    name: "game-of-the-goose",
    minPlayers: 1,
    maxPlayers: 6,

    validateSetupData: (setupData, numPlayers) => {
        if (!Number.isInteger(numPlayers) || numPlayers < 1 || numPlayers > 6) {
            return "Game of the Goose supports between 1 and 6 players.";
        }
        if (setupData && setupData.ruleset && !(setupData.ruleset in rulesets)) {
            return `Unknown ruleset: ${setupData.ruleset}`;
        }
    },

    setup: (ctx, setupData) => {
        const ruleset = normalizeRuleset(setupData && setupData.ruleset);

        const players = {};
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
            ruleset,
            dice: null,
            rollDice: false,
            extraTurn: false,
            players,
            infoText: "",
        };
    },

    moves: {
        startGame: (G, ctx, playerList) => {
            if (G.started || !playerList || typeof playerList !== "object") {
                return;
            }

            const requiredPlayerIDs = Object.keys(G.players);
            const hasCompleteRoster = requiredPlayerIDs.every(
                (playerID) =>
                    Object.prototype.hasOwnProperty.call(playerList, playerID) &&
                    typeof playerList[playerID] === "string" &&
                    playerList[playerID].trim()
            );
            if (!hasCompleteRoster) return;

            for (const [playerID, playerName] of Object.entries(playerList)) {
                if (!(playerID in G.players)) continue;
                const normalizedName = typeof playerName === "string" ? playerName.trim().slice(0, 40) : "";
                G.players[playerID] = {
                    ...G.players[playerID],
                    name: normalizedName || `Player ${playerID}`,
                };
            }

            G.started = true;
            ctx.log.setMetadata("Started game");
        },

        rollDice: (G, ctx) => {
            if (!G.started || G.rollDice || ctx.gameover) {
                return;
            }

            const rules = rulesets[normalizeRuleset(G.ruleset)];
            const { DICE_COUNT, TILE_EVENT_MAP } = rules;
            const player = G.players[ctx.currentPlayer];
            if (!player) return;

            for (const otherPlayer of Object.values(G.players)) {
                otherPlayer.moveList = [];
            }
            G.infoText = "";
            G.extraTurn = false;

            if (player.skipTurns > 0) {
                player.skipTurns--;
                G.infoText = "Skipped turn.";
                ctx.events.endTurn();
                return;
            }

            const tileEvent = TILE_EVENT_MAP[player.tileNumber];
            if (
                player.stuck &&
                tileEvent &&
                tileEvent.endGameIfAllStuck &&
                typeof tileEvent.escapeCondition === "function" &&
                !tileEvent.escapeCondition(G, ctx)
            ) {
                G.infoText = "Player is stuck, skipped turn.";
                ctx.events.endTurn();
                return;
            }

            G.dice = ctx.random.D6(DICE_COUNT);
            if (!Array.isArray(G.dice)) {
                G.dice = [G.dice];
            }
            ctx.log.setMetadata(`Player ${ctx.currentPlayer} rolled ${G.dice}`);
            G.rollDice = true;
        },

        updatePlayer: (G, ctx) => {
            if (!G.started || !G.rollDice || !Array.isArray(G.dice) || G.dice.length === 0 || ctx.gameover) {
                return;
            }

            const rules = rulesets[normalizeRuleset(G.ruleset)];
            const { TILE_EVENT_MAP } = rules;
            const player = G.players[ctx.currentPlayer];
            if (!player) return;

            G.rollDice = false;

            const tileEvent = TILE_EVENT_MAP[player.tileNumber];
            if (
                player.stuck &&
                tileEvent &&
                typeof tileEvent.escapeCondition === "function" &&
                !tileEvent.escapeCondition(G, ctx)
            ) {
                G.infoText = "Player is stuck, skipped turn.";
                ctx.events.endTurn();
                return;
            }

            player.stuck = false;

            const diceSum = G.dice.reduce((a, b) => a + b, 0);
            movePlayer(G, ctx, diceSum, 1);

            if (G.extraTurn) {
                G.extraTurn = false;
                ctx.events.endTurn({ next: ctx.currentPlayer });
            } else {
                ctx.events.endTurn();
            }
        },
    },

    endIf: (G, ctx) => {
        if (!G.started) return;

        const rules = rulesets[normalizeRuleset(G.ruleset)];
        const { MAX_MOVE_COUNT, TILE_EVENT_MAP } = rules;
        const currentPlayer = G.players[ctx.currentPlayer];

        if (currentPlayer && currentPlayer.tileNumber === MAX_MOVE_COUNT) {
            return { winner: currentPlayer.name };
        }

        const players = Object.values(G.players);
        if (
            players.length > 0 &&
            players.every((player) => {
                if (!player.stuck) return false;
                const tileEvent = TILE_EVENT_MAP[player.tileNumber];
                const playerCtx = { ...ctx, currentPlayer: player.id };
                return Boolean(
                    tileEvent &&
                    tileEvent.endGameIfAllStuck &&
                    typeof tileEvent.escapeCondition === "function" &&
                    !tileEvent.escapeCondition(G, playerCtx)
                );
            })
        ) {
            return { winner: null };
        }
    },
};

function movePlayer(G, ctx, moveCount, moveDirection) {
    const rules = rulesets[normalizeRuleset(G.ruleset)];
    const { MAX_MOVE_COUNT, MOVE_AGAIN_TILES, TILE_EVENT_MAP } = rules;
    const player = G.players[ctx.currentPlayer];

    if (!player || !Number.isInteger(moveCount) || moveCount < 0 || (moveDirection !== 1 && moveDirection !== -1)) {
        return;
    }

    let tileNumber = player.tileNumber;
    let lastTileNumber = tileNumber;
    let nextMoveDirection = moveDirection;

    if (tileNumber + moveCount * moveDirection > MAX_MOVE_COUNT) {
        nextMoveDirection = -1;
        tileNumber = 2 * MAX_MOVE_COUNT - tileNumber - moveCount;
        player.moveList.push([lastTileNumber, MAX_MOVE_COUNT]);
        lastTileNumber = MAX_MOVE_COUNT;
    } else {
        tileNumber += moveCount * moveDirection;
    }

    // Defensive clamp: legal game states never need this, but it prevents malformed
    // or stale state from producing a DOM lookup for an impossible board tile.
    tileNumber = Math.max(0, Math.min(MAX_MOVE_COUNT, tileNumber));

    player.tileNumber = tileNumber;
    player.moveList.push([lastTileNumber, tileNumber]);

    const tileEvent = TILE_EVENT_MAP[tileNumber];
    if (tileEvent && tileEvent.condition(G, ctx)) {
        tileEvent.event(G, ctx);
        G.infoText = tileEvent.text;
    }

    if (MOVE_AGAIN_TILES.includes(player.tileNumber)) {
        movePlayer(G, ctx, moveCount, nextMoveDirection);
    }
}
