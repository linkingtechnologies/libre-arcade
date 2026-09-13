import { GooseGame } from "./game.js";
import { normalizeRuleset } from "./rulesets.js";

function clone(value) {
    if (value === undefined) return undefined;
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

export class LocalGameClient {
    constructor({ numPlayers = 2, ruleset = "modern" } = {}) {
        this.numPlayers = Math.max(1, Math.min(6, Number.parseInt(numPlayers, 10) || 2));
        this.ruleset = normalizeRuleset(ruleset);
        this.playerID = null;
        this._stateID = 0;
        this._running = false;
        this._subscribers = new Set();
        this._playOrder = Array.from({ length: this.numPlayers }, (_, index) => String(index));

        this.ctx = {
            numPlayers: this.numPlayers,
            currentPlayer: "0",
            gameover: undefined,
            turn: 1,
            playOrder: this._playOrder.slice(),
            playOrderPos: 0,
            random: {
                D6: (count = 1) => {
                    const amount = Math.max(1, Number.parseInt(count, 10) || 1);
                    const values = Array.from({ length: amount }, () => 1 + Math.floor(Math.random() * 6));
                    return amount === 1 ? values[0] : values;
                },
            },
            log: { setMetadata: () => {} },
            events: {
                endTurn: (options = {}) => this._endTurn(options),
            },
        };

        this.G = GooseGame.setup(this.ctx, { ruleset: this.ruleset });
        this.moves = Object.fromEntries(
            Object.keys(GooseGame.moves).map((moveName) => [moveName, (...args) => this._dispatch(moveName, args)])
        );
    }

    _endTurn(options = {}) {
        const requested = options && options.next;
        if (requested !== undefined && this._playOrder.includes(String(requested))) {
            this.ctx.currentPlayer = String(requested);
            this.ctx.playOrderPos = this._playOrder.indexOf(this.ctx.currentPlayer);
        } else {
            this.ctx.playOrderPos = (this.ctx.playOrderPos + 1) % this._playOrder.length;
            this.ctx.currentPlayer = this._playOrder[this.ctx.playOrderPos];
        }
        this.ctx.turn += 1;
    }

    _dispatch(moveName, args) {
        const move = GooseGame.moves[moveName];
        if (typeof move !== "function") return;

        const actingPlayer = this.ctx.currentPlayer;
        move(this.G, this.ctx, ...args);

        const gameover = GooseGame.endIf(this.G, { ...this.ctx, currentPlayer: actingPlayer });
        if (gameover !== undefined) {
            this.ctx.gameover = gameover;
            // Keep the player who ended the game selected in the final state.
            this.ctx.currentPlayer = actingPlayer;
            this.ctx.playOrderPos = this._playOrder.indexOf(actingPlayer);
        }

        this._stateID += 1;
        this._notify();
    }

    _publicState() {
        return {
            G: clone(this.G),
            ctx: {
                numPlayers: this.ctx.numPlayers,
                currentPlayer: this.ctx.currentPlayer,
                gameover: clone(this.ctx.gameover),
                turn: this.ctx.turn,
                playOrder: this.ctx.playOrder.slice(),
                playOrderPos: this.ctx.playOrderPos,
            },
            _stateID: this._stateID,
            isActive: this.ctx.gameover === undefined,
            isConnected: true,
        };
    }

    _notify() {
        if (!this._running) return;
        for (const subscriber of this._subscribers) subscriber(this._publicState());
    }

    subscribe(callback) {
        if (typeof callback !== "function") return () => {};
        this._subscribers.add(callback);
        if (this._running) callback(this._publicState());
        return () => this._subscribers.delete(callback);
    }

    start() {
        if (this._running) return;
        this._running = true;
        this._notify();
    }

    stop() {
        this._running = false;
    }

    getState() {
        return this._publicState();
    }
}
