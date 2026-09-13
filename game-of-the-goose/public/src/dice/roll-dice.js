import { t } from "../i18n.js";

let activeDice = [];
const PIPS = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
};

function validate({ numberOfDice, callback, element, values }) {
    if (!(element instanceof HTMLElement)) throw new Error("A valid dice container is required.");
    if (!Number.isInteger(numberOfDice) || numberOfDice < 1) throw new Error("numberOfDice must be a positive integer.");
    if (callback !== undefined && typeof callback !== "function") throw new Error("callback must be a function when provided.");
    if (values !== undefined) {
        if (!Array.isArray(values) || values.length !== numberOfDice) throw new Error("Dice values do not match numberOfDice.");
        for (const value of values) {
            if (!Number.isInteger(value) || value < 1 || value > 6) throw new Error("Dice values must be integers from 1 to 6.");
        }
    }
}

function refreshDiceLabels() {
    activeDice.forEach((die) => {
        const number = Number(die.dataset.dieNumber);
        const value = Number(die.dataset.dieValue);
        if (Number.isInteger(number) && Number.isInteger(value)) {
            die.setAttribute("aria-label", t("dice.aria", { number, value }));
        }
    });
}

if (typeof window !== "undefined") window.addEventListener("goose-language-change", refreshDiceLabels);

function clearDice() {
    activeDice.forEach((die) => die.remove());
    activeDice = [];
}

function createDie(value, index) {
    const die = document.createElement("div");
    die.className = "restored-die";
    die.setAttribute("role", "img");
    die.dataset.dieNumber = String(index + 1);
    die.dataset.dieValue = String(value);
    die.setAttribute("aria-label", t("dice.aria", { number: index + 1, value }));
    die.style.animationDelay = `${index * 70}ms`;

    const face = document.createElement("span");
    face.className = "die-face";
    for (const position of PIPS[value]) {
        const pip = document.createElement("span");
        pip.className = `die-pip pip-${position}`;
        face.appendChild(pip);
    }
    die.appendChild(face);
    return die;
}

export default function rollDice(options) {
    validate(options);
    clearDice();

    const { numberOfDice, callback, element, values } = options;
    const result = Array.from({ length: numberOfDice }, (_, index) =>
        values ? values[index] : Math.floor(Math.random() * 6) + 1
    );

    return new Promise((resolve) => {
        let completed = false;
        let fallbackTimer = null;
        const finish = () => {
            if (completed) return;
            completed = true;
            if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
            if (callback) callback(result);
            resolve(result);
        };

        result.forEach((value, index) => {
            const die = createDie(value, index);
            element.appendChild(die);
            activeDice.push(die);
            if (index === result.length - 1) die.addEventListener("animationend", finish, { once: true });
        });

        fallbackTimer = window.setTimeout(finish, 1100 + (numberOfDice - 1) * 70);
    });
}
