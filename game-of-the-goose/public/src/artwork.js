// Original restoration artwork built from inline SVG primitives.
// No external image, font, icon pack or upstream game artwork is used here.

function escapeNumber(value) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? String(n + 1) : "";
}

export function gooseSVGMarkup(playerID, { showNumber = true } = {}) {
    const number = escapeNumber(playerID);
    return `
        <svg class="goose-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path class="goose-shadow" d="M19 91c11 7 61 8 78 0 8-4 6-10-2-11H27c-9 1-14 6-8 11Z"/>
            <path class="goose-leg" d="M49 78v15m19-18v18m-25 0h12m7 0h13"/>
            <path class="goose-body" d="M24 68c5-17 22-26 40-22 8 2 14 7 20 13 5 5 12 6 20 5-5 8-12 12-23 13-7 11-20 17-34 15-16-2-28-11-23-24Z"/>
            <path class="goose-wing" d="M37 66c9-10 27-12 39-3-4 2-7 6-9 11 7-1 12 1 16 4-14 7-35 8-46-1 4-3 5-7 0-11Z"/>
            <path class="goose-neck" d="M71 58c-5-11-8-24-2-35 5-10 17-16 29-11-8 3-12 9-11 16 1 8 7 13 10 21 2 6 1 12-4 17-6 5-16 3-22-8Z"/>
            <ellipse class="goose-head" cx="91" cy="19" rx="12" ry="10"/>
            <path class="goose-beak" d="M101 17 117 22l-16 5Z"/>
            <circle class="goose-eye" cx="95" cy="16" r="2.2"/>
            <path class="goose-highlight" d="M33 68c8-9 20-13 31-10"/>
            ${showNumber ? `<circle class="goose-number-disc" cx="87" cy="91" r="13"/><text class="goose-number" x="87" y="96" text-anchor="middle">${number}</text>` : ""}
        </svg>`;
}

export function createGooseArtwork(playerID, options = {}) {
    const container = document.createElement("span");
    container.className = "goose-artwork";
    container.innerHTML = gooseSVGMarkup(playerID, options).trim();
    return container.firstElementChild;
}

const ICONS = {
    leapfrog: `<svg class="event-icon" viewBox="0 0 64 64"><circle cx="18" cy="43" r="7"/><circle cx="44" cy="43" r="7"/><path d="M13 31c10-15 27-15 37 0"/><path d="m42 22 9 9-11 3"/></svg>`,
    bridge: `<svg class="event-icon" viewBox="0 0 64 64"><path d="M8 44h48M12 44c4-20 36-20 40 0M15 36h34M20 31v13m12-18v18m12-13v13"/></svg>`,
    birdcage: `<svg class="event-icon" viewBox="0 0 64 64"><path d="M17 54V24c0-12 30-12 30 0v30M14 54h36M22 22v32m10-36v36m10-32v32"/><path d="M26 38c4-7 13-6 16 1-4 4-12 5-16-1Z"/><circle cx="38" cy="35" r="1.5"/></svg>`,
    hotel: `<svg class="event-icon" viewBox="0 0 64 64"><path d="M13 54V18h38v36M20 26h8v8h-8zm16 0h8v8h-8zM20 41h24v13"/><path d="M9 18h46M25 54V43h14v11"/></svg>`,
    diceAgain: `<svg class="event-icon" viewBox="0 0 64 64"><rect x="13" y="13" width="38" height="38" rx="6"/><circle cx="23" cy="23" r="3"/><circle cx="41" cy="23" r="3"/><circle cx="32" cy="32" r="3"/><circle cx="23" cy="41" r="3"/><circle cx="41" cy="41" r="3"/></svg>`,
    firstThrow: `<svg class="event-icon" viewBox="0 0 64 64"><rect x="8" y="18" width="29" height="29" rx="5"/><rect x="29" y="11" width="27" height="27" rx="5"/><circle cx="18" cy="28" r="2.5"/><circle cx="28" cy="38" r="2.5"/><circle cx="38" cy="20" r="2.5"/><circle cx="47" cy="29" r="2.5"/></svg>`,
    wellModern: `<svg class="event-icon" viewBox="0 0 64 64"><ellipse cx="32" cy="22" rx="20" ry="8"/><path d="M12 22v24c0 5 40 5 40 0V22M17 33c9 4 21 4 30 0M17 42c9 4 21 4 30 0"/></svg>`,
    wellClassic: `<svg class="event-icon" viewBox="0 0 64 64"><ellipse cx="32" cy="22" rx="20" ry="8"/><path d="M12 22v24c0 5 40 5 40 0V22M17 33c9 4 21 4 30 0M17 42c9 4 21 4 30 0"/></svg>`,
    stairs: `<svg class="event-icon" viewBox="0 0 64 64"><path d="M10 50h11V39h11V28h11V17h11"/><path d="m41 47 10 3-4 10"/></svg>`,
    mazeModern: `<svg class="event-icon" viewBox="0 0 64 64"><path d="M11 11h42v42H11zM20 11v10h23v10H20v13h23V34h10M11 32h9M32 21v10M32 44v9"/></svg>`,
    mazeClassic: `<svg class="event-icon" viewBox="0 0 64 64"><path d="M11 11h42v42H11zM20 11v10h23v10H20v13h23V34h10M11 32h9M32 21v10M32 44v9"/></svg>`,
    prisonModern: `<svg class="event-icon" viewBox="0 0 64 64"><rect x="12" y="11" width="40" height="44" rx="3"/><path d="M22 12v42m10-42v42m10-42v42M12 24h40M12 43h40"/></svg>`,
    prisonClassic: `<svg class="event-icon" viewBox="0 0 64 64"><rect x="12" y="11" width="40" height="44" rx="3"/><path d="M22 12v42m10-42v42m10-42v42M12 24h40M12 43h40"/></svg>`,
    graveyard: `<svg class="event-icon" viewBox="0 0 64 64"><path d="M32 9v31M22 19h20M18 52c3-10 25-10 29 0M13 55h38"/></svg>`,
};

export function eventIconMarkup(key) {
    return ICONS[key] || "";
}
