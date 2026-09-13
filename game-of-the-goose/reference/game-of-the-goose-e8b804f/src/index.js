const playerNameInput = document.querySelector("#player-name");
const matchIdInput = document.querySelector("#match-id");

const joinMatchButton = document.querySelector("#join-match-button");
const newMatchButton = document.querySelector("#new-match-button");

// Get matchID URL parameter
const params = new URL(document.location).searchParams;
let matchID = params.get("matchID");

joinMatchButton.disabled = !matchID && matchIdInput.value === "";

// Set matchID input to URL parameter
if (matchID) {
    matchIdInput.value = matchID;
}

// Update join button to reflect match ID state
matchIdInput.addEventListener("input", (e) => {
    matchID = e.target.value;
    joinMatchButton.disabled = matchID === "";
});

joinMatchButton.onclick = () => {
    sessionStorage.setItem("playerName", playerNameInput.value);
    window.location.href = `/game.html?matchID=${matchID}`;
};

newMatchButton.onclick = () => {
    sessionStorage.setItem("playerName", playerNameInput.value);
    window.location.href = "/create.html";
};
