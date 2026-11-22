#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Builds ASSET-INVENTORY.csv from SOURCE-MANIFEST.json + the per-file licensing judgements below.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const m = JSON.parse(readFileSync(join(root, "SOURCE-MANIFEST.json"), "utf8"));
const sha = Object.fromEntries(m.masterFiles.map(f => [f.path, f.sha256]));
const CODE = ["Krzysztof Urbas (README: (c) 2013 Urbas and Madeja)", "krzysu/game-off-2013", "GPL-3.0 (declared)", "README.md 'Licensing/Code' + LICENSE file, both added in commit 66950cd on 2019-07-24, committed by Krzysztof Urbas (PR #1 by kmcnaught, merged by krzysu)", "CLEARED (declared by copyright holder)", "GPL-3.0 notice + copyright (c) 2013 Krzysztof Urbas, Pawel Madeja", "No per-file license headers exist; none were added upstream"];
const ART = ["Pawel Madeja", "krzysu/game-off-2013 app/images/", "CC BY 4.0 (declared)", "README.md 'Assets' (commit 66950cd, 2019-07-24). Replaces the 2013 README text: 'All rights reserved for graphic design... forbidden to use for profit'. File content shows original artwork, no third-party characters identified", "CONDITIONALLY REDISTRIBUTABLE (declared; author-side confirmation recommended)", "Credit 'Pawel Madeja', link CC BY 4.0, indicate changes", "Relicensing was committed by Urbas; no written statement from Madeja himself was found. Obtain confirmation before M5"];
const AUD = (src, hint) => ["UNKNOWN", src, "UNKNOWN", hint, "QUARANTINED - NOT REDISTRIBUTABLE", "Unknown (cannot be determined)", "Original author, source page and license are not recorded anywhere in the repository (README only says 'downloaded from OpenGameArt'; missing_audio.txt is a to-do list). Do not ship until identified"];
const rows = [];
const add = (path, type, [a, s, l, e, r, att, q], note = "") => rows.push([path, type, a, s, l, e, r, att, q + (note ? " | " + note : ""), sha[path] ?? ""]);
for (const p of ["app/scripts/game.js", "app/index.html", "app/styles/main.scss", "Gruntfile.js", "package.json", "README.md", "app/.htaccess", "app/robots.txt"]) add(p, "code", CODE);
for (const p of m.masterFiles.map(f => f.path).filter(p => p.startsWith("app/scripts/game/"))) add(p, "code (CoffeeScript source)", CODE);
for (const p of ["app/data/bullet.json", "app/data/characters.json", "app/data/hud.json", "app/data/items.json", "app/data/others.json"]) add(p, "data (sprite sheet frame maps)", CODE);
for (let i = 1; i <= 6; i++) add(`app/data/level${i}.tmx`, "data (level layout, Tiled TMX)", CODE, "Level design is the authors' own; tile image references only");
add("LICENSE", "license text", ["Free Software Foundation", "gnu.org", "GPL-3.0 text", "Standard GPLv3 text", "n/a (license document)", "Keep verbatim", "none"]);
for (const p of ["bullet.png", "characters.png", "gradient-top.png", "hud.png", "items.png", "map_tiles.png", "others.png", "bg.gif", "bg-blured.jpg"]) add(`app/images/${p}`, "graphic (used by game)", ART, p === "bg-blured.jpg" ? "Not requested at runtime in the baseline network log" : "");
for (const p of ["promo.png", "promo2.png"]) add(`app/images/${p}`, "graphic (README promo, not used at runtime)", ART, "Exclude from the game package; use only in documentation if needed");
add("app/favicon.ico", "graphic (icon)", ["Not stated", "krzysu/game-off-2013", "Not stated (outside app/images/)", "README license statement covers only app/images/", "UNRESOLVED - not essential", "Unknown", "Origin unknown; probably derived from the game art. Replace or confirm"]);
add("app/scripts/lib/quintus-all.js", "third-party engine", ["Pascal Rettig, Cykod LLC (c) 2012; embeds Underscore.js (c) Jeremy Ashkenas, DocumentCloud and 'Simple JavaScript Inheritance' by John Resig", "html5quintus.com / github.com/cykod/Quintus", "MIT or GPLv2 (file header); Underscore MIT; Resig inheritance MIT", "File header lines 2-3: 'may be freely distributed under the MIT license or GPLv2 License'; README says MIT; no LICENSE file shipped in the repo", "REDISTRIBUTABLE (MIT) once the MIT notice text is shipped", "Keep file header; ship MIT license text for Quintus, Underscore, Resig", "Is this byte-identical to an upstream Quintus release? Not verified (M2)"]);
add("app/scripts/lib/stats.min.js", "third-party library", ["Mr.doob (stats.js)", "github.com/mrdoob/stats.js", "MIT (upstream project license; not stated in this minified file)", "Header comment names the project only", "REDISTRIBUTABLE (MIT) - verify upstream license text in M2", "Ship MIT notice", "Only needed because game code instantiates Stats(); the widget is never attached to the DOM"]);
for (const [f, a, l] of [["Boogaloo (Google Fonts, remote)", "John Vargas Beltran (per OFL.txt)", "SIL OFL 1.1 (verified: OFL.txt downloaded, now in public/fonts/)"], ["Jolly Lodger (Google Fonts, remote)", "Font Diner (per OFL.txt)", "SIL OFL 1.1 (verified: OFL.txt downloaded, now in public/fonts/)"], ["Ubuntu (Google Fonts, remote)", "Dalton Maag / Canonical", "Ubuntu Font Licence 1.0 (NOT verified this session)"]]) rows.push([`(remote) ${f}`, "font loaded from fonts.googleapis.com over http://", a, "fonts.googleapis.com", l, "index.html <link> tags; fonts are NOT in the repository", "LOCALISED in M2 (Boogaloo, Jolly Lodger); Ubuntu not shipped", "Per license", "Boogaloo and Jolly Lodger are used by canvas text and CSS; Ubuntu is declared but no usage was found", ""]);
rows.push(["(remote) Google Analytics UA-9904630-18", "tracking script", "Google / site owner", "google-analytics.com", "n/a", "index.html inline snippet; game code calls ga('send', ...) in trackEvent", "MUST BE REMOVED (privacy, offline); keep a no-op ga() stub so calls do not throw", "n/a", "", ""]);
const AUDIO = {
  collected: "ID3v1 + Vorbis tags: TITLE/ARTIST='elevator ding' (a title, not an author). A web search found an OpenGameArt 'Elevator ding' CC0 entry, but nothing ties it to this file",
  gun_shot: "Vorbis tag DATE=2011 only",
  human_created: "Vorbis tag ARTIST=SoundBible.com (a site, not a person); SoundBible licenses vary per sound (CC BY 3.0 / public domain). Git: 'new audio for human created' 2013-11-23",
  player_bg: "No tags. 616 KB mp3; git: 'lower music file' 2013-11-28 (edited, so a derivative)",
  player_hit: "Tags TITLE='Gut Punch 1', ARTIST='CGEffects'. A similarly named author 'CGEffex' has a CC BY 3.0 pack on OpenGameArt ('Punch, slap n kick'); NOT confirmed to be the same sound",
  zombie_mode: "Empty ID3v2 frames. Music loop; git 'shorter audio files' 2013-11-28 (edited derivative)",
  zombie_notice: "No tags",
};
for (const [n, h] of Object.entries(AUDIO)) for (const ext of ["mp3", "ogg"]) add(`app/audio/${n}.${ext}`, "audio", AUD(`'OpenGameArt' per README (unverified${n === "human_created" ? "; tag says SoundBible.com" : ""})`, h), ext === "ogg" ? "Same sound as the .mp3 sibling (transcode)" : "");
add("app/audio/missing_audio.txt", "notes", CODE, "Author's to-do list of sounds (door open, success, failed level, player out of map were never implemented)");
const q = v => '"' + String(v).replace(/"/g, '""') + '"';
const head = ["path", "type", "author_or_attribution", "original_source", "license", "evidence", "redistribution_status", "required_attribution", "outstanding_questions", "sha256"];
writeFileSync(join(root, "ASSET-INVENTORY.csv"), [head, ...rows].map(r => r.map(q).join(",")).join("\n") + "\n");
console.log(rows.length, "rows");
