import { Client } from "boardgame.io/client";
import { SocketIO } from "boardgame.io/multiplayer";
import { GooseGame } from "./game";
import { rulesets, rulesDescriptionHTML } from "./rulesets";
import { SERVER_URL, PLAYER_IMAGE_MAP } from "./constants";

import { GooseGameLobby } from "./lobby";

import rollADie from "./roll-a-die/roll-a-die";
import ConfettiGenerator from "confetti-js";

const INFO_TEXT_DURATION_SHORT = 2000;
const INFO_TEXT_DURATION_LONG = 4000;

class GooseGameClient {
    constructor(rootElement, { matchID, playerID, credentials }) {
        this.client = Client({
            game: GooseGame,

            multiplayer: SocketIO({ server: SERVER_URL }),

            matchID: matchID,
            playerID: playerID,
            credentials: credentials,

            debug: false,
        });
        this.client.start();

        this.rootElement = rootElement;

        this.client.subscribe((state) => this.update(state));

        this.lastTurn = 0;
        this.rollingDice = false;
        this.boardVisible = false;

        // Create lobby if the game has not yet started
        const state = this.client.getState();
        if (!state || !state.G.started) {
            this.lobby = new GooseGameLobby(this.rootElement, this.client);
        }

        // Leave the match when the page is going to be terminated
        window.addEventListener("pagehide", (event) => {
            const matchID = sessionStorage.getItem("matchID");

            if (!matchID) {
                sessionStorage.clear();
                return;
            }

            const body = new URLSearchParams({
                playerID: sessionStorage.getItem("playerID"),
                credentials: sessionStorage.getItem("playerCredentials"),
            });

            navigator.sendBeacon(`${SERVER_URL}/games/${GooseGame.name}/${matchID}/leave`, body);

            sessionStorage.clear();
        });
    }

    createBoard(ruleset) {
        this.boardVisible = true;

        this.rootElement.innerHTML = `
            <div id="ruleset-modal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3 class="modal-title"></h3>
                    <p class="modal-text"></p>
                </div>
            </div>

            <div id="player-list-game"></div>
            <div id="game-info">
                <span id="turn-counter">Turn: 1</span>
                <span id="rules">Rules?</span>
                <div id="tooltip">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 122.88" class="info-icon">
                        <path
                            d="M61.44,0A61.46,61.46,0,1,1,18,18,61.25,61.25,0,0,1,61.44,0ZM59.12,36a8,8,0,0,1,.61-3.16,7.82,7.82,0,0,1,1.8-2.63,8.33,8.33,0,0,1,2.62-1.79,8.08,8.08,0,0,1,6.11,0,8.06,8.06,0,0,1,2.58,1.79,7.83,7.83,0,0,1,1.77,2.63A8.38,8.38,0,0,1,75.2,36a8.15,8.15,0,0,1-.59,3.1,8.23,8.23,0,0,1-1.76,2.65,8.15,8.15,0,0,1-2.59,1.82,7.72,7.72,0,0,1-3.05.6,8,8,0,0,1-3.12-.6,7.84,7.84,0,0,1-2.61-1.8,8.07,8.07,0,0,1-1.77-2.64A8.3,8.3,0,0,1,59.12,36Zm3.09,47.8-.17.63-.12.49-.05.34,0,.27a2,2,0,0,0,.09.64v0a1.09,1.09,0,0,0,.23.41.86.86,0,0,0,.35.23,1.55,1.55,0,0,0,.55.09,2.74,2.74,0,0,0,1.46-.63,14.6,14.6,0,0,0,2.15-2.06,36,36,0,0,0,2.57-3.3c.89-1.26,1.82-2.71,2.79-4.33a.37.37,0,0,1,.5-.13l3.28,2.44a.36.36,0,0,1,.09.5,56.84,56.84,0,0,1-4.58,6.87,30.35,30.35,0,0,1-4.73,4.89l0,0a18.55,18.55,0,0,1-4.92,2.92,14.15,14.15,0,0,1-5.19,1,13.63,13.63,0,0,1-4.07-.55,7.92,7.92,0,0,1-3-1.66,7.1,7.1,0,0,1-1.86-2.72,9.92,9.92,0,0,1-.61-3.62c0-.45,0-.92.08-1.42s.14-1,.25-1.58v0c.1-.54.25-1.15.43-1.82s.41-1.43.67-2.26L54.1,61.61l.47-1.67c.12-.47.22-.88.3-1.24a8.43,8.43,0,0,0,.15-.9,5.75,5.75,0,0,0,.06-.77,2.9,2.9,0,0,0-.2-1.09v0a2.49,2.49,0,0,0-.57-.81,2.68,2.68,0,0,0-.94-.55,4.15,4.15,0,0,0-1.28-.19H47.45a.37.37,0,0,1-.37-.36l0-.13,1.22-4.43a.37.37,0,0,1,.36-.27l23.67-.75a.38.38,0,0,1,.38.36l0,.12L62.21,83.78ZM97,25.88a50.31,50.31,0,1,0,14.72,35.56A50.16,50.16,0,0,0,97,25.88Z"
                        />
                    </svg>
                    <span id="tooltip-text"></span>
                </div>
            </div>

            <div id="info-container" class="container">
                <div id="info-text"></div>
                <button id="play-again-button" class="button">Return to lobby</button>
            </div>

            <canvas id="confetti-canvas"></canvas>
            <button id="roll-button" class="button" disabled><span>Roll</span></button>
            
            <div class="board">
                <div id="tile0" data-id="0" class="tile special"><span>0</span></div>
                <div id="tile1" data-id="1" class="tile"><span>1</span></div>
                <div id="tile2" data-id="2" class="tile"><span>2</span></div>
                <div id="tile3" data-id="3" class="tile"><span>3</span></div>
                <div id="tile4" data-id="4" class="tile"><span>4</span></div>
                <div id="tile5" data-id="5" class="tile"><span>5</span></div>
                <div id="tile6" data-id="6" class="tile"><span>6</span></div>
                <div id="tile7" data-id="7" class="tile"><span>7</span></div>
                <div id="tile8" data-id="8" class="tile"><span>8</span></div>
                <div id="tile9" data-id="9" class="tile"><span>9</span></div>
                <div id="tile10" data-id="10" class="tile"><span>10</span></div>
                <div id="tile11" data-id="11" class="tile"><span>11</span></div>
                <div id="tile31" data-id="31" class="tile"><span>31</span></div>
                <div id="tile32" data-id="32" class="tile"><span>32</span></div>
                <div id="tile33" data-id="33" class="tile"><span>33</span></div>
                <div id="tile34" data-id="34" class="tile"><span>34</span></div>
                <div id="tile35" data-id="35" class="tile"><span>35</span></div>
                <div id="tile36" data-id="36" class="tile"><span>36</span></div>
                <div id="tile37" data-id="37" class="tile"><span>37</span></div>
                <div id="tile38" data-id="38" class="tile"><span>38</span></div>
                <div id="tile39" data-id="39" class="tile"><span>39</span></div>
                <div id="tile40" data-id="40" class="tile"><span>40</span></div>
                <div id="tile41" data-id="41" class="tile"><span>41</span></div>
                <div id="tile12" data-id="12" class="tile"><span>12</span></div>
                <div id="tile30" data-id="30" class="tile"><span>30</span></div>
                <div id="tile55" data-id="55" class="tile"><span>55</span></div>
                <div id="tile56" data-id="56" class="tile"><span>56</span></div>
                <div id="tile57" data-id="57" class="tile"><span>57</span></div>
                <div id="tile58" data-id="58" class="tile"><span>58</span></div>
                <div id="tile59" data-id="59" class="tile"><span>59</span></div>
                <div id="tile60" data-id="60" class="tile"><span>60</span></div>
                <div id="tile61" data-id="61" class="tile"><span>61</span></div>
                <div id="tile62" data-id="62" class="tile"><span>62</span></div>
                <div id="tile63" data-id="63" class="tile special"><span>63</span></div>
                <div id="tile42" data-id="42" class="tile"><span>42</span></div>
                <div id="tile13" data-id="13" class="tile"><span>13</span></div>
                <div id="tile29" data-id="29" class="tile"><span>29</span></div>
                <div id="tile54" data-id="54" class="tile"><span>54</span></div>
                <div id="space"></div>
                <div id="tile43" data-id="43" class="tile"><span>43</span></div>
                <div id="tile14" data-id="14" class="tile"><span>14</span></div>
                <div id="tile28" data-id="28" class="tile"><span>28</span></div>
                <div id="tile53" data-id="53" class="tile"><span>53</span></div>
                <div id="tile52" data-id="52" class="tile"><span>52</span></div>
                <div id="tile51" data-id="51" class="tile"><span>51</span></div>
                <div id="tile50" data-id="50" class="tile"><span>50</span></div>
                <div id="tile49" data-id="49" class="tile"><span>49</span></div>
                <div id="tile48" data-id="48" class="tile"><span>48</span></div>
                <div id="tile47" data-id="47" class="tile"><span>47</span></div>
                <div id="tile46" data-id="46" class="tile"><span>46</span></div>
                <div id="tile45" data-id="45" class="tile"><span>45</span></div>
                <div id="tile44" data-id="44" class="tile"><span>44</span></div>
                <div id="tile15" data-id="15" class="tile"><span>15</span></div>
                <div id="tile27" data-id="27" class="tile"><span>27</span></div>
                <div id="tile26" data-id="26" class="tile"><span>26</span></div>
                <div id="tile25" data-id="25" class="tile"><span>25</span></div>
                <div id="tile24" data-id="24" class="tile"><span>24</span></div>
                <div id="tile23" data-id="23" class="tile"><span>23</span></div>
                <div id="tile22" data-id="22" class="tile"><span>22</span></div>
                <div id="tile21" data-id="21" class="tile"><span>21</span></div>
                <div id="tile20" data-id="20" class="tile"><span>20</span></div>
                <div id="tile19" data-id="19" class="tile"><span>19</span></div>
                <div id="tile18" data-id="18" class="tile"><span>18</span></div>
                <div id="tile17" data-id="17" class="tile"><span>17</span></div>
                <div id="tile16" data-id="16" class="tile"><span>16</span></div>
            </div>
        `;

        // TODO: add event tile images

        this.turnCounter = this.rootElement.querySelector("#turn-counter");
        this.rollButton = this.rootElement.querySelector("#roll-button");
        this.infoText = this.rootElement.querySelector("#info-text");
        this.playAgainButton = this.rootElement.querySelector("#play-again-button");
        this.spaceElement = this.rootElement.querySelector("#space");

        this.confetti = new ConfettiGenerator({
            target: "confetti-canvas",
            max: 80,
            size: 1.6,
        });

        this.playAgainButton.onclick = async () => {
            this.lastTurn = 0;
            this.rollingDice = false;
            this.boardVisible = false;

            await this.lobby.playAgain();
        };

        this.rollButton.onclick = () => {
            this.hideInfoText();
            this.client.moves.rollDice();
        };

        this.initializePlayerList();
        this.initializeTiles(ruleset);
        this.initializeRulesModal(ruleset);
    }

    initializePlayerList() {
        const playerListContainer = this.rootElement.querySelector("#player-list-game");
        let playerListHTML = "";
        for (const player of this.client.matchData) {
            let playerName = player.name;

            if (player.id.toString() === this.client.playerID) {
                playerName = `<b>${playerName}</b>`;
            }

            playerListHTML += `
                <div class="player-info-game" data-player-id="${player.id}">
                    <img class="player-goose-image" src=${PLAYER_IMAGE_MAP[player.id.toString()]}></img>
                    <span class="player-name">${playerName}</span>
                </div>
            `;
        }

        playerListContainer.innerHTML = playerListHTML;
    }

    initializeTiles(ruleset) {
        const tooltip = this.rootElement.querySelector("#tooltip");
        const tooltipText = this.rootElement.querySelector("#tooltip-text");

        // Add class and mouse hover events to move again tiles
        for (const tile of rulesets[ruleset].MOVE_AGAIN_TILES) {
            const moveAgainTile = this.rootElement.querySelector(`[data-id='${tile}']`);
            moveAgainTile.classList.add("move-again");

            moveAgainTile.addEventListener("mouseover", (event) => {
                tooltipText.innerText = `Move again for the sum of the dice.`;
                tooltip.style.visibility = "visible";
            });

            moveAgainTile.addEventListener("mouseout", (event) => {
                tooltip.style.visibility = "hidden";
            });
        }

        // Add mouse hover events to event tiles
        for (const [tile, tileEvent] of Object.entries(rulesets[ruleset].TILE_EVENT_MAP)) {
            const eventTile = this.rootElement.querySelector(`[data-id='${tile}']`);

            eventTile.addEventListener("mouseover", (event) => {
                tooltipText.innerText = tileEvent.text;
                tooltip.style.visibility = "visible";
            });

            eventTile.addEventListener("mouseout", (event) => {
                tooltip.style.visibility = "hidden";
            });
        }
    }

    initializeRulesModal(ruleset) {
        const rulesText = this.rootElement.querySelector("#rules");
        const rulesetModal = this.rootElement.querySelector("#ruleset-modal");
        const closeButton = this.rootElement.querySelector("#ruleset-modal .close");
        const modalTitle = this.rootElement.querySelector("#ruleset-modal .modal-title");
        const modalText = this.rootElement.querySelector("#ruleset-modal .modal-text");

        modalTitle.innerText = ruleset;
        modalText.innerHTML = rulesDescriptionHTML(ruleset);

        rulesText.onclick = () => {
            rulesetModal.style.visibility = "visible";
            rulesetModal.style.opacity = 1;
        };

        // Close modal if the close button is pressed or when the user clicks outside of the modal content
        closeButton.onclick = () => {
            rulesetModal.style.visibility = "hidden";
            rulesetModal.style.opacity = 0;
        };

        window.onclick = (event) => {
            if (event.target === rulesetModal) {
                rulesetModal.style.visibility = "hidden";
                rulesetModal.style.opacity = 0;
            }
        };
    }

    updatePlayerNames() {
        if (!this.client.matchData) {
            return;
        }

        const playerNames = [];
        for (const player of this.client.matchData) {
            if (player.name && player.isConnected) {
                playerNames.push(player.name);
            }
        }

        if (this.lobby && playerNames.length !== 0) {
            this.lobby.updatePlayers(playerNames);
        }
    }

    async update(state) {
        if (state === null) {
            return;
        }

        const { G, ctx } = state;

        if (!G.started) {
            this.updatePlayerNames();
            return;
        }

        if (!this.boardVisible) {
            this.createBoard(G.ruleset);
        }

        // Play roll animation when needed
        if (G.rollDice && !this.rollingDice) {
            this.rollButton.disabled = true;
            this.rollingDice = true;

            rollADie({
                element: this.spaceElement,
                numberOfDice: rulesets[G.ruleset].DICE_COUNT,
                callback: () => {
                    // Update current player when animation is finished
                    if (ctx.currentPlayer === this.client.playerID) {
                        this.client.moves.updatePlayer();
                    }

                    this.rollingDice = false;
                },
                values: G.dice,
            });

            return;
        }

        // Prevent old state updates stemming from optimistic client-side updates
        if (ctx.turn <= this.lastTurn && !ctx.gameover) {
            return;
        }

        // Update turn counter
        this.turnCounter.innerText = `Turn: ${ctx.turn}`;

        // Clear goose images from all tiles
        const tiles = this.rootElement.querySelectorAll(".goose");
        tiles.forEach((goose) => {
            goose.remove();
        });

        const spacing = 80 / ctx.numPlayers;
        for (const [id, player] of Object.entries(G.players)) {
            // Draw players that are stationary
            if (G.players[id].moveList.length === 0) {
                this.drawPlayerPosition(spacing, player.tileNumber, id);
            }
        }

        let previousPlayerIndex = ctx.playOrderPos === 0 ? ctx.numPlayers - 1 : ctx.playOrderPos - 1;
        let previousPlayerID =
            ctx.gameover || ctx.turn === 1 || ctx.numPlayers === 1
                ? ctx.currentPlayer
                : ctx.playOrder[previousPlayerIndex];
        let moveList = G.players[previousPlayerID].moveList;

        // Stuck on tile, show info text
        if (ctx.turn > 1 && moveList.length === 0) {
            this.rollButton.disabled = true;
            await this.showInfoText(G.infoText, INFO_TEXT_DURATION_SHORT);
        }

        // Animate moving player, scale animation time by number of moves
        for (let [from, to] of moveList) {
            let duration = Math.round(Math.min(500, 1000 / Math.abs(from - to)));
            await this.animatePlayer(G, ctx, previousPlayerID, from, to, duration);
        }

        for (let i = 0; i < ctx.numPlayers; i++) {
            const id = i.toString();

            // Clear player turn indicator
            const currentPlayerText = this.rootElement.querySelector(`[data-player-id='${id}']`);
            currentPlayerText.classList.remove("player-selected");

            // Add player turn indicator
            if (id === ctx.currentPlayer) {
                currentPlayerText.classList.add("player-selected");
            }
        }

        // Enable roll button for current player
        this.rollButton.disabled = ctx.currentPlayer !== this.client.playerID;

        if (ctx.gameover) {
            this.rollButton.disabled = true;
            this.playAgainButton.style.visibility = "visible";
            this.playAgainButton.style.opacity = 1;

            if (ctx.gameover.winner) {
                this.confetti.render();
                this.showInfoText(`${ctx.gameover.winner} won!`, -1);
            } else {
                this.showInfoText("All players are stuck! The game ends in a draw.", -1);
            }
        }

        this.lastTurn = ctx.turn;
    }

    // Returns a Promise that resolves after "ms" milliseconds
    timer = (ms) => new Promise((res) => setTimeout(res, ms));

    async animatePlayer(G, ctx, id, from, to, duration) {
        let direction = from > to ? -1 : 1;

        for (let i = from; i !== to + direction; i += direction) {
            // Remove old player image
            const oldTile = this.rootElement.querySelector(`[data-id='${i - direction}']`);
            if (oldTile) {
                let oldPlayerImgs = this.rootElement.querySelectorAll(`#player${id}`);
                for (let oldPlayerImg of oldPlayerImgs) {
                    oldPlayerImg.outerHTML = "";
                }
            }

            // Add new player image
            const spacing = 80 / ctx.numPlayers;
            this.drawPlayerPosition(spacing, i, id);

            const TILE_EVENT_MAP = rulesets[G.ruleset].TILE_EVENT_MAP;
            if (i in TILE_EVENT_MAP && TILE_EVENT_MAP[i].condition(G, ctx) && i === to && G.infoText) {
                await this.showInfoText(G.infoText, INFO_TEXT_DURATION_LONG);
            }

            // Wait between adding images
            await this.timer(duration);
        }
    }

    drawPlayerPosition(spacing, tile, id) {
        const newTile = this.rootElement.querySelector(`[data-id='${tile}']`);
        if (newTile.querySelector("#player" + id)) {
            return;
        }

        const playerGoose = document.createElement("img");

        playerGoose.id = "player" + id;
        playerGoose.classList.add("goose");
        playerGoose.src = PLAYER_IMAGE_MAP[id];

        const topSpacing = (spacing - 20) / 2 + parseInt(id) * spacing;
        playerGoose.style.top = `${topSpacing}%`;

        newTile.appendChild(playerGoose);
    }

    async showInfoText(text, duration) {
        this.infoText.innerText = text;
        this.infoText.style.visibility = "visible";
        this.infoText.style.opacity = 1;

        if (duration >= 0) {
            await this.timer(duration);
            this.hideInfoText();
        }
    }

    hideInfoText() {
        this.infoText.style.visibility = "hidden";
        this.infoText.style.opacity = 0;
    }
}

const appElement = document.querySelector(".container");

const matchID = sessionStorage.getItem("matchID");
const playerID = sessionStorage.getItem("playerID");
const playerCredentials = sessionStorage.getItem("playerCredentials");
new GooseGameClient(appElement, {
    matchID: matchID,
    playerID: playerID,
    credentials: playerCredentials,
});
