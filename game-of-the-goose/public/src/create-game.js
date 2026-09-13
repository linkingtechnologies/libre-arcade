import { rulesets, rulesDescriptionHTML, normalizeRuleset } from "./rulesets.js";
import { applyDocumentTranslations, getLanguage, mountLanguageSwitcher, t } from "./i18n.js";

const rulesetSelector = document.querySelector("#ruleset-selector");
const numPlayersInput = document.querySelector("#num-players");
const playerNamesContainer = document.querySelector("#player-names");
const rulesetInfoIcon = document.querySelector(".info-icon");
const rulesetModal = document.querySelector("#ruleset-modal");
const closeButton = document.querySelector("#ruleset-modal .close");
const modalTitle = document.querySelector("#ruleset-modal .modal-title");
const modalText = document.querySelector("#ruleset-modal .modal-text");
const startGameButton = document.querySelector("#start-game-button");
const statusText = document.querySelector("#create-status");
let statusKey = null;

function rulesetLabel(ruleset) {
    return t(`create.${ruleset}`);
}

function setStatus(message = "", isError = false, key = null) {
    if (!statusText) return;
    statusKey = key;
    statusText.textContent = message;
    statusText.classList.toggle("error", isError);
}

function updateRulesetHelp() {
    const selectedRuleset = normalizeRuleset(rulesetSelector.value);
    rulesetSelector.value = selectedRuleset;
    modalTitle.textContent = t(`rulesets.${selectedRuleset}`);
    modalText.innerHTML = rulesDescriptionHTML(selectedRuleset, getLanguage());
}

function snapshotNames() {
    return [...playerNamesContainer.querySelectorAll("input")].map((input) => ({
        value: input.value,
        automatic: input.dataset.autoName !== "false",
    }));
}

function localPlayerName(index) {
    return t("create.playerDefault", { number: index + 1 });
}

function renderPlayerNames() {
    const count = Math.max(1, Math.min(6, Number.parseInt(numPlayersInput.value, 10) || 1));
    const previous = snapshotNames();
    playerNamesContainer.replaceChildren();

    for (let i = 0; i < count; i++) {
        const prior = previous[i];
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 40;
        input.autocomplete = "off";
        input.setAttribute("aria-label", t("create.playerNameAria", { number: i + 1 }));
        input.placeholder = localPlayerName(i);
        input.dataset.autoName = prior && !prior.automatic ? "false" : "true";
        input.value = prior && !prior.automatic ? prior.value : localPlayerName(i);
        input.addEventListener("input", () => {
            input.dataset.autoName = "false";
        });
        playerNamesContainer.appendChild(input);
    }
}

function refreshPlayerNameTranslations() {
    [...playerNamesContainer.querySelectorAll("input")].forEach((input, index) => {
        input.setAttribute("aria-label", t("create.playerNameAria", { number: index + 1 }));
        input.placeholder = localPlayerName(index);
        if (input.dataset.autoName !== "false") input.value = localPlayerName(index);
    });
}

function applyPageLanguage() {
    applyDocumentTranslations(document);
    for (const ruleset of Object.keys(rulesets)) {
        let option = rulesetSelector.querySelector(`option[value="${ruleset}"]`);
        if (!option) {
            option = document.createElement("option");
            option.value = ruleset;
            rulesetSelector.appendChild(option);
        }
        option.textContent = rulesetLabel(ruleset);
    }
    refreshPlayerNameTranslations();
    updateRulesetHelp();
    if (statusKey) statusText.textContent = t(statusKey);
}

function gamePageURL() {
    const url = new URL("game.html", window.location.href);
    url.search = "";
    url.searchParams.set("mode", "local");
    return url.href;
}

function createLocalGame() {
    setStatus();

    const numPlayers = Number.parseInt(numPlayersInput.value, 10);
    if (!Number.isInteger(numPlayers) || numPlayers < 1 || numPlayers > 6 || !numPlayersInput.checkValidity()) {
        setStatus(t("create.invalidPlayers"), true, "create.invalidPlayers");
        numPlayersInput.focus();
        return;
    }

    const ruleset = normalizeRuleset(rulesetSelector.value);
    const names = [...playerNamesContainer.querySelectorAll("input")]
        .slice(0, numPlayers)
        .map((input, index) => input.value.trim().slice(0, 40) || localPlayerName(index));

    const config = { ruleset, numPlayers, names };
    sessionStorage.setItem("gooseLocalConfig", JSON.stringify(config));
    window.location.href = gamePageURL();
}

renderPlayerNames();
applyPageLanguage();
mountLanguageSwitcher({ onChange: applyPageLanguage });

rulesetSelector.addEventListener("change", updateRulesetHelp);
numPlayersInput.addEventListener("change", renderPlayerNames);
numPlayersInput.addEventListener("input", renderPlayerNames);
startGameButton.addEventListener("click", createLocalGame);

rulesetInfoIcon.addEventListener("click", () => {
    rulesetModal.style.visibility = "visible";
    rulesetModal.style.opacity = 1;
});

closeButton.addEventListener("click", () => {
    rulesetModal.style.visibility = "hidden";
    rulesetModal.style.opacity = 0;
});

rulesetModal.addEventListener("click", (event) => {
    if (event.target === rulesetModal) {
        rulesetModal.style.visibility = "hidden";
        rulesetModal.style.opacity = 0;
    }
});
