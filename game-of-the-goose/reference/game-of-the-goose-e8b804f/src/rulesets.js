export const rulesets = {
    modern: {
        MAX_MOVE_COUNT: 63,
        DICE_COUNT: 1,
        MOVE_AGAIN_TILES: [1, 5, 10, 23, 32, 41, 45, 54, 59],
        TILE_EVENT_MAP: {
            // Move player in front of the next player
            3: {
                condition: (G, ctx) =>
                    Object.values(G.players).some(
                        (player) => player.tileNumber > G.players[ctx.currentPlayer].tileNumber
                    ),
                event: (G, ctx) => {
                    let tileNumber = G.players[ctx.currentPlayer].tileNumber;

                    let nextPlayerTileNumber = 0;
                    let distanceToNextPlayer = 63;
                    for (const player of Object.values(G.players)) {
                        if (player.id === ctx.currentPlayer || player.tileNumber === 0) {
                            continue;
                        }

                        if (player.tileNumber > tileNumber && player.tileNumber - tileNumber < distanceToNextPlayer) {
                            distanceToNextPlayer = player.tileNumber - tileNumber;
                            nextPlayerTileNumber = player.tileNumber;
                        }
                    }

                    if (nextPlayerTileNumber > 0) {
                        G.players[ctx.currentPlayer].tileNumber = nextPlayerTileNumber + 1;
                        G.players[ctx.currentPlayer].moveList.push([tileNumber, nextPlayerTileNumber + 1]);
                    }
                },
                text: `Leapfrog: Move in front of the next player!`,
                // TODO: add images, e.g. image: 'image.src',
            },

            // Move ahead to tile 12
            6: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].moveList.push([6, 12]);
                    G.players[ctx.currentPlayer].tileNumber = 12;
                },
                text: `Bridge: You can cross the river, continue to 12!`,
            },

            // Move back to tile 9
            15: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].moveList.push([15, 9]);
                    G.players[ctx.currentPlayer].tileNumber = 9;
                },
                text: `Birdcage: A bird has escaped! To catch it, move back to 9.`,
            },

            // Skip the next turn
            19: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].skipTurns = 1;
                },
                text: `Hotel: Tired of the journey, you stay a night in the hotel. Skip one turn.`,
            },

            // Throw again if the last throw was either 1 or 2
            26: {
                condition: (G, ctx) => {
                    const diceSum = G.dice.reduce((a, b) => a + b, 0);
                    return diceSum === 1 || diceSum === 2;
                },
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].moveList = [];
                    ctx.events.endTurn({ next: ctx.currentPlayer });
                },
                text: `Dice: You threw 1 or 2, throw again!`,
            },

            // Player falls in the well
            31: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].stuck = true;
                },
                text: `The well: You fell into the well! You may only continue after you roll 6.`,
                escapeCondition: (G, ctx) => {
                    const diceSum = G.dice.reduce((a, b) => a + b, 0);
                    return diceSum === 6;
                },
                endGameIfAllStuck: false,
            },

            // Move back to tile 33
            39: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].moveList.push([39, 33]);
                    G.players[ctx.currentPlayer].tileNumber = 33;
                },
                text: `Stairs: Dummy! You fell off the stairs, go back to 33.`,
            },

            // Move back to tile 30
            42: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].moveList.push([42, 30]);
                    G.players[ctx.currentPlayer].tileNumber = 30;
                },
                text: `Maze: You've got lost in the maze! Go back to 30.`,
            },

            // Skip the next 2 turns
            52: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].skipTurns = 2;
                },
                text: `Prison: And now you're going to jail?! Skip two turns!`,
            },

            // Move back to tile 0 (the starting tile)
            58: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].moveList.push([58, 0]);
                    G.players[ctx.currentPlayer].tileNumber = 0;
                },
                text: `Graveyard: Your life has come to an end, but you get a second chance. Move back to start...`,
            },
        },
    },

    classic: {
        MAX_MOVE_COUNT: 63,
        DICE_COUNT: 2,
        MOVE_AGAIN_TILES: [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59],
        TILE_EVENT_MAP: {
            // Move ahead to tile 12
            6: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].moveList.push([6, 12]);
                    G.players[ctx.currentPlayer].tileNumber = 12;
                },
                text: `Bridge: You can cross the river, continue to 12!`,
            },

            // Move ahead to tile 26 if the player rolled 3 and 6, and ahead to tile 53 if the player rolled 4 and 5
            9: {
                condition: (G, ctx) => {
                    const diceSum = G.dice.reduce((a, b) => a + b, 0);
                    return diceSum === 9;
                },
                event: (G, ctx) => {
                    if (G.dice.includes(3) && G.dice.includes(6)) {
                        G.players[ctx.currentPlayer].moveList.push([9, 26]);
                        G.players[ctx.currentPlayer].tileNumber = 26;
                        return;
                    }

                    if (G.dice.includes(4) && G.dice.includes(5)) {
                        G.players[ctx.currentPlayer].moveList.push([9, 53]);
                        G.players[ctx.currentPlayer].tileNumber = 53;
                        return;
                    }
                },
                text: `Continue to 26 if you rolled 3 and 6, or to 54 if you rolled 4 and 5.`,
            },

            // Skip the next turn
            19: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].skipTurns = 1;
                },
                text: `Hotel: Tired of the journey, you stay a night in the hotel. Skip one turn.`,
            },

            // Player falls in the well
            31: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].stuck = true;
                },
                text: `The well: You fell into the well! You may only continue when another player frees you.`,
                escapeCondition: (G, ctx) =>
                    Object.values(G.players).some(
                        (player) =>
                            player.id !== ctx.currentPlayer &&
                            player.tileNumber === G.players[ctx.currentPlayer].tileNumber
                    ),
                endGameIfAllStuck: true,
            },

            // Move back to tile 37
            42: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].moveList.push([42, 37]);
                    G.players[ctx.currentPlayer].tileNumber = 37;
                },
                text: `Maze: You've got lost in the maze! Go back to 37.`,
            },

            // Skip the next 2 turns
            52: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].stuck = true;
                },
                text: `Prison: And now you're going to jail?! You may only continue when another player frees you.`,
                escapeCondition: (G, ctx) =>
                    Object.values(G.players).some(
                        (player) =>
                            player.id !== ctx.currentPlayer &&
                            player.tileNumber === G.players[ctx.currentPlayer].tileNumber
                    ),
                endGameIfAllStuck: true,
            },

            // Move back to tile 0 (the starting tile)
            58: {
                condition: (G, ctx) => true,
                event: (G, ctx) => {
                    G.players[ctx.currentPlayer].moveList.push([58, 0]);
                    G.players[ctx.currentPlayer].tileNumber = 0;
                },
                text: `Graveyard: Your life has come to an end, but you get a second chance. Move back to start...`,
            },
        },
    },
};

export function rulesDescriptionHTML(ruleset) {
    const rules = rulesets[ruleset];

    let description = "";

    description += `The game is played with <b>${rules.DICE_COUNT} dice</b>. Players take turns rolling the dice in a clock-wise fashion.
    All geese start on tile 0, and move according to the sum of the rolled dice.`;

    description += "<br><br>";

    description += `The first player to land exactly on <b>tile ${rules.MAX_MOVE_COUNT}</b> wins the game.
    If a player goes past ${rules.MAX_MOVE_COUNT}, they have to move backwards for the remaining number of moves.`;

    if (Object.values(rules.TILE_EVENT_MAP).some((value) => value.endGameIfAllStuck)) {
        description += " If all players are stuck, the game ends in a draw.";
    }

    description += "<br><br>";

    if (rules.MOVE_AGAIN_TILES && rules.MOVE_AGAIN_TILES.length !== 0) {
        description += `If a player lands on <b>${rules.MOVE_AGAIN_TILES.join(
            ", "
        )}</b> (marked with <span class="red">red</span> numbers), they move again by the sum of the dice.`;
    }

    description += "<br><br>";

    description += `There are <b>obstacles</b> (or hazards) spread across the board. The obstacle tiles, along with the corresponding consequences, are as follows:`;
    description += "<br><br>";
    for (const [key, value] of Object.entries(rules.TILE_EVENT_MAP)) {
        description += `<b>${key}</b> - ${value.text}`;
        description += "<br>";
    }

    return description;
}
