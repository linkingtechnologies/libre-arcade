const STORAGE_KEY = "gooseLanguage";
const SUPPORTED = ["en", "it"];

const messages = {
    en: {
        meta: { title: "Game of the Goose" },
        language: { label: "Language", en: "English", it: "Italian" },
        common: {
            newGame: "New game",
            close: "Close",
        },
        home: {
        },
        create: {
            title: "New game",
            gameRules: "Game rules:",
            modern: "Modern — simpler",
            classic: "Classic — traditional",
            showRules: "Show rules",
            rulesHint: "Modern uses one die; Classic uses two dice and the traditional special spaces.",
            numPlayers: "Number of players (1-6):",
            playerNames: "Player names:",
            startGame: "Start game",
            invalidPlayers: "Choose between 1 and 6 players.",
            playerDefault: "Player {number}",
            playerNameAria: "Player {number} name",
        },
        game: {
            turn: "Turn: {turn}",
            rules: "Rules",
            roll: "Roll",
            moveAgain: "Move again for the sum of the dice.",
            tileAria: "Tile {tile}: {text}",
            playerAria: "Player {number}",
            won: "{name} won!",
            draw: "All players are stuck! The game ends in a draw.",
            updateError: "Something went wrong while updating the game. Reload the page and try again.",
            newGameError: "Could not start a new game. Try again.",
        },
        gameMessages: {
            skippedTurn: "Skipped turn.",
            stuckSkippedTurn: "Player is stuck, skipped turn.",
        },
        dice: {
            aria: "Die {number}: {value}",
        },
        rulesets: {
            modern: "Modern",
            classic: "Classic",
        },
        rules: {
            intro: "The game is played with <b>{dice}</b>. Players take turns rolling the dice clockwise. All geese start on tile 0 and move according to the total rolled.",
            exactFinish: "The first player to land exactly on <b>tile {max}</b> wins the game. If a player goes past {max}, they move backwards for the remaining number of spaces.",
            drawIfStuck: " If all players are stuck, the game ends in a draw.",
            moveAgain: "If a player lands on <b>{tiles}</b> (marked with <span class=\"red\">red</span> numbers), they move again by the total rolled.",
            obstacles: "There are <b>obstacles</b> (or hazards) across the board. Their effects are:",
            oneDie: "1 die",
            manyDice: "{count} dice",
        },
        events: {
            leapfrog: { label: "Leapfrog", text: "Leapfrog: Move in front of the next player!" },
            bridge: { label: "Bridge", text: "Bridge: You can cross the river, continue to 12!" },
            birdcage: { label: "Birdcage", text: "Birdcage: A bird has escaped! To catch it, move back to 9." },
            hotel: { label: "Hotel", text: "Hotel: Tired of the journey, you stay a night in the hotel. Skip one turn." },
            diceAgain: { label: "Dice", text: "Dice: You threw 1 or 2, throw again!" },
            wellModern: { label: "Well", text: "The well: You fell into the well! You may only continue after you roll 6." },
            stairs: { label: "Stairs", text: "Stairs: You fell off the stairs, go back to 33." },
            mazeModern: { label: "Maze", text: "Maze: You've got lost in the maze! Go back to 30." },
            prisonModern: { label: "Prison", text: "Prison: You are going to jail. Skip two turns!" },
            graveyard: { label: "Graveyard", text: "Graveyard: Your life has come to an end, but you get a second chance. Move back to start..." },
            firstThrow: { label: "First throw", text: "Continue to 26 if you rolled 3 and 6, or to 53 if you rolled 4 and 5." },
            wellClassic: { label: "Well", text: "The well: You fell into the well! You may only continue when another player frees you." },
            mazeClassic: { label: "Maze", text: "Maze: You've got lost in the maze! Go back to 37." },
            prisonClassic: { label: "Prison", text: "Prison: You may only continue when another player frees you." },
        },
    },
    it: {
        meta: { title: "Gioco dell'Oca" },
        language: { label: "Lingua", en: "Inglese", it: "Italiano" },
        common: {
            newGame: "Nuova partita",
            close: "Chiudi",
        },
        home: {
        },
        create: {
            title: "Nuova partita",
            gameRules: "Regole di gioco:",
            modern: "Moderno — più semplice",
            classic: "Classico — tradizionale",
            showRules: "Mostra le regole",
            rulesHint: "Moderno usa un dado; Classico usa due dadi e le caselle speciali tradizionali.",
            numPlayers: "Numero di giocatori (1-6):",
            playerNames: "Nomi dei giocatori:",
            startGame: "Inizia partita",
            invalidPlayers: "Scegli da 1 a 6 giocatori.",
            playerDefault: "Giocatore {number}",
            playerNameAria: "Nome del giocatore {number}",
        },
        game: {
            turn: "Turno: {turn}",
            rules: "Regole",
            roll: "Tira",
            moveAgain: "Avanza di nuovo dello stesso numero di caselle ottenuto con i dadi.",
            tileAria: "Casella {tile}: {text}",
            playerAria: "Giocatore {number}",
            won: "Ha vinto {name}!",
            draw: "Tutti i giocatori sono bloccati! La partita termina in parità.",
            updateError: "Si è verificato un problema durante l'aggiornamento della partita. Ricarica la pagina e riprova.",
            newGameError: "Impossibile iniziare una nuova partita. Riprova.",
        },
        gameMessages: {
            skippedTurn: "Turno saltato.",
            stuckSkippedTurn: "Il giocatore è bloccato: turno saltato.",
        },
        dice: {
            aria: "Dado {number}: {value}",
        },
        rulesets: {
            modern: "Moderno",
            classic: "Classico",
        },
        rules: {
            intro: "Si gioca con <b>{dice}</b>. I giocatori tirano a turno in senso orario. Tutte le oche partono dalla casella 0 e avanzano del totale ottenuto.",
            exactFinish: "Vince il primo giocatore che arriva esattamente alla <b>casella {max}</b>. Se supera {max}, torna indietro delle caselle rimanenti.",
            drawIfStuck: " Se tutti i giocatori sono bloccati, la partita termina in parità.",
            moveAgain: "Se un giocatore arriva su <b>{tiles}</b> (numeri segnati in <span class=\"red\">rosso</span>), avanza di nuovo dello stesso totale ottenuto con i dadi.",
            obstacles: "Sul tabellone ci sono <b>ostacoli</b> e caselle speciali. I loro effetti sono:",
            oneDie: "1 dado",
            manyDice: "{count} dadi",
        },
        events: {
            leapfrog: { label: "Sorpasso", text: "Sorpasso: vai davanti al giocatore più vicino che ti precede!" },
            bridge: { label: "Ponte", text: "Ponte: attraversa il fiume e vai alla casella 12!" },
            birdcage: { label: "Gabbia", text: "Gabbia: un uccello è scappato! Torna alla casella 9 per riprenderlo." },
            hotel: { label: "Locanda", text: "Locanda: ti fermi a riposare per la notte. Salta un turno." },
            diceAgain: { label: "Dadi", text: "Dadi: hai ottenuto 1 o 2, tira di nuovo!" },
            wellModern: { label: "Pozzo", text: "Pozzo: sei caduto nel pozzo! Puoi ripartire soltanto dopo aver ottenuto 6." },
            stairs: { label: "Scale", text: "Scale: sei caduto dalle scale, torna alla casella 33." },
            mazeModern: { label: "Labirinto", text: "Labirinto: ti sei perso! Torna alla casella 30." },
            prisonModern: { label: "Prigione", text: "Prigione: finisci in prigione. Salta due turni!" },
            graveyard: { label: "Tomba", text: "Tomba: la tua corsa finisce qui, ma hai una seconda possibilità. Torna alla partenza..." },
            firstThrow: { label: "Primo tiro", text: "Vai alla casella 26 se hai ottenuto 3 e 6, oppure alla 53 se hai ottenuto 4 e 5." },
            wellClassic: { label: "Pozzo", text: "Pozzo: sei caduto nel pozzo! Puoi ripartire soltanto quando un altro giocatore ti libera." },
            mazeClassic: { label: "Labirinto", text: "Labirinto: ti sei perso! Torna alla casella 37." },
            prisonClassic: { label: "Prigione", text: "Prigione: puoi ripartire soltanto quando un altro giocatore ti libera." },
        },
    },
};

function getByPath(object, path) {
    return path.split(".").reduce((value, key) => (value && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined), object);
}

function interpolate(value, vars) {
    return String(value).replace(/\{([A-Za-z0-9_]+)\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
    );
}

export function normalizeLanguage(language) {
    const code = String(language || "").toLowerCase().split("-")[0];
    return SUPPORTED.includes(code) ? code : "en";
}

export function getLanguage() {
    let stored = null;
    try {
        stored = localStorage.getItem(STORAGE_KEY);
    } catch {
        // Storage may be blocked; browser language is still a safe fallback.
    }
    if (SUPPORTED.includes(stored)) return stored;

    const browserLanguages = typeof navigator !== "undefined"
        ? (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language])
        : [];
    const italian = browserLanguages.some((language) => normalizeLanguage(language) === "it");
    return italian ? "it" : "en";
}

export function setLanguage(language) {
    const normalized = normalizeLanguage(language);
    try {
        localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
        // A blocked localStorage must not make the game unusable.
    }
    if (typeof document !== "undefined") document.documentElement.lang = normalized;
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("goose-language-change", { detail: { language: normalized } }));
    }
    return normalized;
}

export function t(key, vars = {}, language = getLanguage()) {
    const normalized = normalizeLanguage(language);
    const value = getByPath(messages[normalized], key) ?? getByPath(messages.en, key) ?? key;
    return typeof value === "string" ? interpolate(value, vars) : value;
}

export function eventText(event, language = getLanguage()) {
    if (!event) return "";
    const key = event.i18nKey ? `events.${event.i18nKey}.text` : null;
    return key ? t(key, {}, language) : event.text || "";
}

export function eventLabel(event, language = getLanguage()) {
    if (!event) return "";
    const key = event.i18nKey ? `events.${event.i18nKey}.label` : null;
    return key ? t(key, {}, language) : event.label || "";
}

const GAME_MESSAGE_KEYS = new Map([
    ["Skipped turn.", "gameMessages.skippedTurn"],
    ["Player is stuck, skipped turn.", "gameMessages.stuckSkippedTurn"],
    ["Leapfrog: Move in front of the next player!", "events.leapfrog.text"],
    ["Bridge: You can cross the river, continue to 12!", "events.bridge.text"],
    ["Birdcage: A bird has escaped! To catch it, move back to 9.", "events.birdcage.text"],
    ["Hotel: Tired of the journey, you stay a night in the hotel. Skip one turn.", "events.hotel.text"],
    ["Dice: You threw 1 or 2, throw again!", "events.diceAgain.text"],
    ["The well: You fell into the well! You may only continue after you roll 6.", "events.wellModern.text"],
    ["Stairs: You fell off the stairs, go back to 33.", "events.stairs.text"],
    ["Maze: You've got lost in the maze! Go back to 30.", "events.mazeModern.text"],
    ["Prison: You are going to jail. Skip two turns!", "events.prisonModern.text"],
    ["Graveyard: Your life has come to an end, but you get a second chance. Move back to start...", "events.graveyard.text"],
    ["Continue to 26 if you rolled 3 and 6, or to 53 if you rolled 4 and 5.", "events.firstThrow.text"],
    ["The well: You fell into the well! You may only continue when another player frees you.", "events.wellClassic.text"],
    ["Maze: You've got lost in the maze! Go back to 37.", "events.mazeClassic.text"],
    ["Prison: You may only continue when another player frees you.", "events.prisonClassic.text"],
]);

export function localizeGameText(text, language = getLanguage()) {
    const key = GAME_MESSAGE_KEYS.get(text);
    return key ? t(key, {}, language) : text || "";
}

export function applyDocumentTranslations(root = document) {
    const language = getLanguage();
    document.documentElement.lang = language;
    document.title = t("meta.title", {}, language);

    root.querySelectorAll("[data-i18n]").forEach((element) => {
        element.textContent = t(element.dataset.i18n, {}, language);
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
        element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel, {}, language));
    });
}

export function mountLanguageSwitcher({ onChange } = {}) {
    let switcher = document.querySelector(".language-switcher");
    if (!switcher) {
        switcher = document.createElement("div");
        switcher.className = "language-switcher";
        switcher.setAttribute("role", "group");
        document.body.appendChild(switcher);
    }

    const render = () => {
        const language = getLanguage();
        switcher.setAttribute("aria-label", t("language.label", {}, language));
        switcher.replaceChildren();
        for (const code of ["it", "en"]) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "language-button";
            button.dataset.language = code;
            button.textContent = code.toUpperCase();
            button.title = t(`language.${code}`, {}, language);
            button.setAttribute("aria-pressed", String(code === language));
            button.addEventListener("click", () => {
                const next = setLanguage(code);
                render();
                applyDocumentTranslations(document);
                if (typeof onChange === "function") onChange(next);
            });
            switcher.appendChild(button);
        }
    };

    render();
    return switcher;
}
