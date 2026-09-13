import { rulesets, rulesDescriptionHTML } from "./rulesets";
import { LobbyClient } from "boardgame.io/client";
import { GooseGame } from "./game";
import { SERVER_URL } from "./constants";

const rulesetSelector = document.querySelector("#ruleset-selector");
const numPlayersInput = document.querySelector("#num-players");

const rulesetInfoIcon = document.querySelector(".info-icon");
const rulesetModal = document.querySelector("#ruleset-modal");
const closeButton = document.querySelector("#ruleset-modal .close");
const modalTitle = document.querySelector("#ruleset-modal .modal-title");
const modalText = document.querySelector("#ruleset-modal .modal-text");

const createMatchButton = document.querySelector("#create-match-button");

let rulesetOptions = "";
for (const ruleset of Object.keys(rulesets)) {
    rulesetOptions += `<option value="${ruleset}">${ruleset.charAt(0).toUpperCase() + ruleset.slice(1)}</option>\n`;
}

rulesetSelector.innerHTML = rulesetOptions;

modalTitle.innerText = rulesetSelector.value;
modalText.innerHTML = rulesDescriptionHTML(rulesetSelector.value);
rulesetSelector.onchange = () => {
    modalTitle.innerText = rulesetSelector.value;
    modalText.innerHTML = rulesDescriptionHTML(rulesetSelector.value);
};

createMatchButton.onclick = () => createMatch();

async function createMatch() {
    const lobbyClient = new LobbyClient({ server: SERVER_URL });

    const match = await lobbyClient.createMatch(GooseGame.name, {
        numPlayers: parseInt(numPlayersInput.value),
        setupData: { ruleset: rulesetSelector.value },
    });

    window.location.href = `/game.html?matchID=${match.matchID}`;
}

// Show modal
rulesetInfoIcon.onclick = () => {
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
