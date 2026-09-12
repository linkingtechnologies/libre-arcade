// SPDX-License-Identifier: GPL-3.0-only
const SUIT_SYMBOL = {
  denari: "🪙",
  coppe: "🏆",
  spade: "⚔️",
  bastoni: "🌿"
};

const RANK_NAME = {
  1: "A",
  8: "F",
  9: "C",
  10: "R"
};

const FULL_RANK_NAME = {
  1: "Asso",
  2: "Due",
  3: "Tre",
  4: "Quattro",
  5: "Cinque",
  6: "Sei",
  7: "Sette",
  8: "Fante",
  9: "Cavallo",
  10: "Re"
};

export function cardLabel(card) {
  return `${FULL_RANK_NAME[card.rank] ?? card.rank} di ${card.suit}`;
}

function renderFallbackFace(button, card) {
  button.classList.add("card-fallback");
  button.innerHTML = `
    <strong>${RANK_NAME[card.rank] ?? card.rank}</strong>
    <span class="suit">${SUIT_SYMBOL[card.suit]}</span>
    <small>${card.suit}</small>
  `;
}

function appendImage(container, { imageUrl, alt, onError }) {
  const img = document.createElement("img");
  img.className = "card-image";
  img.alt = alt;
  img.src = imageUrl;
  img.addEventListener("error", onError, { once: true });
  container.append(img);
}

export function createCardElement(card, {
  disabled = false,
  onClick = null,
  deck = null,
  imageUrl = null
} = {}) {
  const button = document.createElement("button");
  button.className = "card";
  button.disabled = disabled;
  button.dataset.cardId = card.id;
  if (deck?.id) button.dataset.deck = deck.id;

  if (imageUrl) {
    appendImage(button, {
      imageUrl,
      alt: cardLabel(card),
      onError: () => {
        button.replaceChildren();
        renderFallbackFace(button, card);
      }
    });
  } else {
    renderFallbackFace(button, card);
  }

  if (onClick) button.addEventListener("click", onClick);
  return button;
}

export function createCardBackElement({ label = "🐽", imageUrl = null, deck = null } = {}) {
  const back = document.createElement("div");
  back.className = "card card-back";
  if (deck?.id) back.dataset.deck = deck.id;

  if (imageUrl) {
    appendImage(back, {
      imageUrl,
      alt: "Dorso della carta",
      onError: () => {
        back.replaceChildren();
        back.classList.remove("has-back-image");
        back.textContent = label;
      }
    });
    back.classList.add("has-back-image");
  } else {
    back.textContent = label;
  }

  return back;
}
