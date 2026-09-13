import { LocalGameClient } from "./local-client.js";
import { normalizeRuleset, rulesets, rulesDescriptionHTML } from "./rulesets.js";
import { applyDocumentTranslations, eventLabel, eventText, getLanguage, localizeGameText, mountLanguageSwitcher, t } from "./i18n.js";
import { PLAYER_CLASS_MAP } from "./constants.js";
import { createGooseArtwork, eventIconMarkup } from "./artwork.js";
import rollADie from "./dice/roll-dice.js";

const INFO_TEXT_DURATION_SHORT = 2000;
const INFO_TEXT_DURATION_LONG = 4000;

class GooseGameClient {
    constructor(rootElement, { numPlayers = 2, ruleset = "modern", playerNames = [] }) {
        this.rootElement = rootElement;
        this.lastStateID = -1;
        this.lastAnimatedRollKey = null;
        this.rollingDice = false;
        this.boardVisible = false;
        this.gameOverShown = false;
        this.updateQueue = Promise.resolve();
        this.transitioning = false;
        this.currentState = null;
        this.currentRuleset = normalizeRuleset(ruleset);
        this.currentInfoMessage = null;

        applyDocumentTranslations(document);
        mountLanguageSwitcher({ onChange: () => this.applyLanguage() });

        this.client = new LocalGameClient({
            numPlayers: Math.max(1, Math.min(6, Number.parseInt(numPlayers, 10) || 2)),
            ruleset: normalizeRuleset(ruleset),
        });

        this.client.subscribe((state) => {
            this.updateQueue = this.updateQueue
                .then(() => this.update(state))
                .catch((error) => this.handleRuntimeError(error));
        });
        this.client.start();

        const state = this.client.getState();
        const count = state && state.ctx ? state.ctx.numPlayers : 2;
        const roster = {};
        for (let i = 0; i < count; i++) {
            const supplied = Array.isArray(playerNames) ? playerNames[i] : null;
            roster[i.toString()] = typeof supplied === "string" && supplied.trim()
                ? supplied.trim().slice(0, 40)
                : t("create.playerDefault", { number: i + 1 });
        }
        this.client.moves.startGame(roster);
    }

    handleRuntimeError(error) {
        console.error("Game UI update failed", error);
        if (this.infoText) {
            this.infoText.textContent = t("game.updateError");
            this.infoText.style.visibility = "visible";
            this.infoText.style.opacity = 1;
        }
    }

    createBoard(ruleset, players) {
        ruleset = normalizeRuleset(ruleset);
        this.boardVisible = true;

        this.rootElement.innerHTML = `
            <div id="ruleset-modal" class="modal">
                <div class="modal-content">
                    <button type="button" class="close modal-close-button" data-i18n-aria-label="common.close" aria-label="${t("common.close")}">&times;</button>
                    <h3 class="modal-title"></h3>
                    <p class="modal-text"></p>
                </div>
            </div>

            <div id="player-list-game"></div>
            <div id="game-info">
                <span id="turn-counter">${t("game.turn", { turn: 1 })}</span>
                <span id="rules">${t("game.rules")}</span>
                <div id="tooltip">
                    <span class="info-icon info-icon-text" aria-hidden="true">i</span>
                    <span id="tooltip-text"></span>
                </div>
            </div>

            <div id="info-container" class="container">
                <div id="info-text"></div>
                <button id="play-again-button" class="button">${t("common.newGame")}</button>
            </div>

            <button id="roll-button" class="button" disabled><span>${t("game.roll")}</span></button>
            
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

        this.turnCounter = this.rootElement.querySelector("#turn-counter");
        this.rollButton = this.rootElement.querySelector("#roll-button");
        this.infoText = this.rootElement.querySelector("#info-text");
        this.playAgainButton = this.rootElement.querySelector("#play-again-button");
        this.spaceElement = this.rootElement.querySelector("#space");

        this.confetti = null;

        this.playAgainButton.addEventListener("click", async () => {
            if (this.transitioning) return;
            this.transitioning = true;
            this.playAgainButton.disabled = true;
            this.lastStateID = -1;
            this.lastAnimatedRollKey = null;
            this.rollingDice = false;
            this.boardVisible = false;
            this.gameOverShown = false;
            if (this.confetti && typeof this.confetti.clear === "function") this.confetti.clear();

            try {
                window.location.href = new URL("create.html", window.location.href).href;
                return;
            } catch (error) {
                console.error("Could not start a new game", error);
                this.playAgainButton.disabled = false;
                await this.showInfoText({ key: "game.newGameError" }, INFO_TEXT_DURATION_LONG);
            } finally {
                this.transitioning = false;
            }
        });

        this.rollButton.addEventListener("click", () => {
            if (this.transitioning || this.rollButton.disabled) return;
            this.rollButton.disabled = true;
            this.hideInfoText();
            this.client.moves.rollDice();
        });

        this.initializePlayerList(players);
        this.initializeTiles(ruleset);
        this.initializeRulesModal(ruleset);
        this.refreshTileTranslations(ruleset);
        this.applyLanguage();
    }

    initializePlayerList(players) {
        const playerListContainer = this.rootElement.querySelector("#player-list-game");
        playerListContainer.replaceChildren();

        for (const [id, player] of Object.entries(players || {})) {
            const row = document.createElement("div");
            row.className = "player-info-game";
            row.dataset.playerId = id;

            const token = document.createElement("span");
            token.className = `player-goose-image player-token ${PLAYER_CLASS_MAP[id] || ""}`.trim();
            token.setAttribute("aria-hidden", "true");
            token.appendChild(createGooseArtwork(id));

            const name = document.createElement("span");
            name.className = "player-name";
            if (id === this.client.playerID) {
                const strong = document.createElement("b");
                strong.textContent = player.name;
                name.appendChild(strong);
            } else {
                name.textContent = player.name;
            }

            row.append(token, name);
            playerListContainer.appendChild(row);
        }
    }

    initializeTiles(ruleset) {
        ruleset = normalizeRuleset(ruleset);
        const tooltip = this.rootElement.querySelector("#tooltip");
        const tooltipText = this.rootElement.querySelector("#tooltip-text");

        // Add class and mouse hover events to move again tiles
        for (const tile of rulesets[ruleset].MOVE_AGAIN_TILES) {
            const moveAgainTile = this.rootElement.querySelector(`[data-id='${tile}']`);
            if (!moveAgainTile) continue;
            moveAgainTile.classList.add("move-again");

            moveAgainTile.addEventListener("mouseover", () => {
                tooltipText.innerText = t("game.moveAgain");
                tooltip.style.visibility = "visible";
            });

            moveAgainTile.addEventListener("mouseout", () => {
                tooltip.style.visibility = "hidden";
            });
        }

        // Mark event tiles using license-clean text/CSS artwork instead of external images.
        for (const [tile, tileEvent] of Object.entries(rulesets[ruleset].TILE_EVENT_MAP)) {
            const eventTile = this.rootElement.querySelector(`[data-id='${tile}']`);
            if (!eventTile) continue;
            eventTile.classList.add("event-tile");
            eventTile.dataset.eventLabel = eventLabel(tileEvent);
            eventTile.setAttribute("aria-label", t("game.tileAria", { tile, text: eventText(tileEvent) }));

            const artwork = document.createElement("span");
            artwork.className = "event-art";
            artwork.innerHTML = eventIconMarkup(tileEvent.i18nKey);
            eventTile.appendChild(artwork);

            eventTile.addEventListener("mouseover", () => {
                tooltipText.innerText = eventText(tileEvent);
                tooltip.style.visibility = "visible";
            });

            eventTile.addEventListener("mouseout", () => {
                tooltip.style.visibility = "hidden";
            });
        }
    }

    initializeRulesModal(ruleset) {
        ruleset = normalizeRuleset(ruleset);
        const rulesText = this.rootElement.querySelector("#rules");
        const rulesetModal = this.rootElement.querySelector("#ruleset-modal");
        const closeButton = this.rootElement.querySelector("#ruleset-modal .close");
        const modalTitle = this.rootElement.querySelector("#ruleset-modal .modal-title");
        const modalText = this.rootElement.querySelector("#ruleset-modal .modal-text");

        modalTitle.innerText = t(`rulesets.${ruleset}`);
        modalText.innerHTML = rulesDescriptionHTML(ruleset, getLanguage());

        rulesText.addEventListener("click", () => {
            rulesetModal.style.visibility = "visible";
            rulesetModal.style.opacity = 1;
        });

        const hideModal = () => {
            rulesetModal.style.visibility = "hidden";
            rulesetModal.style.opacity = 0;
        };
        closeButton.addEventListener("click", hideModal);
        rulesetModal.addEventListener("click", (event) => {
            if (event.target === rulesetModal) hideModal();
        });
    }

    refreshTileTranslations(ruleset = this.currentRuleset) {
        ruleset = normalizeRuleset(ruleset);
        for (const tile of rulesets[ruleset].MOVE_AGAIN_TILES) {
            const moveAgainTile = this.rootElement.querySelector(`[data-id='${tile}']`);
            if (moveAgainTile) moveAgainTile.setAttribute("title", t("game.moveAgain"));
        }
        for (const [tile, tileEvent] of Object.entries(rulesets[ruleset].TILE_EVENT_MAP)) {
            const eventTile = this.rootElement.querySelector(`[data-id='${tile}']`);
            if (!eventTile) continue;
            const text = eventText(tileEvent);
            eventTile.dataset.eventLabel = eventLabel(tileEvent);
            eventTile.setAttribute("aria-label", t("game.tileAria", { tile, text }));
            eventTile.setAttribute("title", text);
        }
    }

    refreshRulesModal(ruleset = this.currentRuleset) {
        const modalTitle = this.rootElement.querySelector("#ruleset-modal .modal-title");
        const modalText = this.rootElement.querySelector("#ruleset-modal .modal-text");
        if (!modalTitle || !modalText) return;
        const normalized = normalizeRuleset(ruleset);
        modalTitle.textContent = t(`rulesets.${normalized}`);
        modalText.innerHTML = rulesDescriptionHTML(normalized, getLanguage());
    }

    applyLanguage() {
        applyDocumentTranslations(document);
        if (!this.boardVisible) return;
        const state = this.currentState || this.client.getState();
        const ctx = state && state.ctx;
        if (this.turnCounter && ctx) this.turnCounter.textContent = t("game.turn", { turn: ctx.turn });
        const rulesText = this.rootElement.querySelector("#rules");
        if (rulesText) rulesText.textContent = t("game.rules");
        const rollText = this.rollButton && this.rollButton.querySelector("span");
        if (rollText) rollText.textContent = t("game.roll");
        if (this.playAgainButton) this.playAgainButton.textContent = t("common.newGame");
        this.refreshTileTranslations();
        this.refreshRulesModal();
        this.rootElement.querySelectorAll(".goose").forEach((token) => {
            const match = token.id.match(/^player(\d+)$/);
            if (match) token.setAttribute("aria-label", t("game.playerAria", { number: Number(match[1]) + 1 }));
        });
        if (this.infoText && this.infoText.style.visibility === "visible" && this.currentInfoMessage) {
            this.infoText.textContent = this.formatInfoMessage(this.currentInfoMessage);
        }
    }


    async update(state) {
        if (this.transitioning) return;
        if (state === null) {
            return;
        }

        const { G, ctx } = state;
        const ruleset = normalizeRuleset(G.ruleset);
        this.currentState = state;
        this.currentRuleset = ruleset;
        const activeRules = rulesets[ruleset];

        if (!G.started) {
            return;
        }

        if (!this.boardVisible) {
            this.createBoard(ruleset, G.players);
        }

        // Play each roll once and wait for the animation before processing later states.
        if (G.rollDice) {
            const rollKey = `${ctx.turn}:${ctx.currentPlayer}:${Array.isArray(G.dice) ? G.dice.join(",") : G.dice}`;
            if (rollKey !== this.lastAnimatedRollKey && !this.rollingDice) {
                this.lastAnimatedRollKey = rollKey;
                this.rollButton.disabled = true;
                this.rollingDice = true;
                try {
                    await rollADie({
                        element: this.spaceElement,
                        numberOfDice: activeRules.DICE_COUNT,
                        values: G.dice,
                    });
                } catch (error) {
                    // Dice animation is cosmetic. A rendering problem must never leave
                    // the game state stuck in G.rollDice = true.
                    console.warn("Dice animation failed; applying the roll without animation.", error);
                } finally {
                    this.client.moves.updatePlayer();
                    this.rollingDice = false;
                }
            }
            return;
        }

        // Ignore stale or duplicate states, but never use turn number for this:
        // several legitimate changes happen within the same turn.
        if (typeof state._stateID === "number" && state._stateID <= this.lastStateID && !ctx.gameover) {
            return;
        }

        // Update turn counter
        this.turnCounter.innerText = t("game.turn", { turn: ctx.turn });

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
            if (!currentPlayerText) continue;
            currentPlayerText.classList.remove("player-selected");

            // Add player turn indicator
            if (id === ctx.currentPlayer) {
                currentPlayerText.classList.add("player-selected");
            }
        }

        // Every turn is played on this device.
        this.rollButton.disabled = false;

        if (ctx.gameover && !this.gameOverShown) {
            this.gameOverShown = true;
            this.rollButton.disabled = true;
            this.playAgainButton.style.visibility = "visible";
            this.playAgainButton.style.opacity = 1;

            if (ctx.gameover.winner) {
                this.showInfoText({ key: "game.won", vars: { name: ctx.gameover.winner } }, -1);
            } else {
                this.showInfoText({ key: "game.draw" }, -1);
            }
        }

        if (typeof state._stateID === "number") this.lastStateID = state._stateID;
    }

    // Returns a Promise that resolves after "ms" milliseconds
    timer(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async animatePlayer(G, ctx, id, from, to, duration) {
        let direction = from > to ? -1 : 1;

        for (let i = from; i !== to + direction; i += direction) {
            // Remove old player image
            const oldTile = this.rootElement.querySelector(`[data-id='${i - direction}']`);
            if (oldTile) {
                let oldPlayerImgs = this.rootElement.querySelectorAll(`#player${id}`);
                for (let oldPlayerImg of oldPlayerImgs) {
                    oldPlayerImg.remove();
                }
            }

            // Add new player image
            const spacing = 80 / ctx.numPlayers;
            this.drawPlayerPosition(spacing, i, id);

            const TILE_EVENT_MAP = rulesets[normalizeRuleset(G.ruleset)].TILE_EVENT_MAP;
            if (i in TILE_EVENT_MAP && TILE_EVENT_MAP[i].condition(G, ctx) && i === to && G.infoText) {
                await this.showInfoText(G.infoText, INFO_TEXT_DURATION_LONG);
            }

            // Wait between adding images
            await this.timer(duration);
        }
    }

    drawPlayerPosition(spacing, tile, id) {
        const newTile = this.rootElement.querySelector(`[data-id='${tile}']`);
        if (!newTile) {
            console.error(`Cannot draw player ${id}: board tile ${tile} does not exist.`);
            return;
        }
        if (newTile.querySelector("#player" + id)) {
            return;
        }

        const playerGoose = document.createElement("span");

        playerGoose.id = "player" + id;
        playerGoose.classList.add("goose", "player-token");
        if (PLAYER_CLASS_MAP[id]) playerGoose.classList.add(PLAYER_CLASS_MAP[id]);
        playerGoose.setAttribute("aria-label", t("game.playerAria", { number: Number(id) + 1 }));
        playerGoose.appendChild(createGooseArtwork(id));

        const topSpacing = (spacing - 20) / 2 + parseInt(id) * spacing;
        playerGoose.style.top = `${topSpacing}%`;

        newTile.appendChild(playerGoose);
    }

    formatInfoMessage(message) {
        if (message && typeof message === "object" && message.key) {
            return t(message.key, message.vars || {});
        }
        return localizeGameText(message);
    }

    async showInfoText(message, duration) {
        this.currentInfoMessage = message;
        this.infoText.innerText = this.formatInfoMessage(message);
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
let config = {};
try {
    config = JSON.parse(sessionStorage.getItem("gooseLocalConfig") || "{}");
} catch (error) {
    console.warn("Ignoring invalid local game configuration", error);
}

new GooseGameClient(appElement, {
    numPlayers: config.numPlayers,
    ruleset: config.ruleset,
    playerNames: config.names,
});
