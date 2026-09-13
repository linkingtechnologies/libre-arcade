const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const publicRoot = path.join(root, "public");
const mustExist = [
    "public/index.html", "public/create.html", "public/game.html", "public/src/app.js", "public/src/local-client.js",
    "public/src/game.js", "public/src/rulesets.js", "public/src/i18n.js", "public/src/artwork.js", "public/src/create-game.js",
    "public/src/dice/roll-dice.js", "public/src/dice/roll-dice.css", "public/css/style.css", "public/css/game.css",
    "public/css/create.css", "LICENSE", "UPSTREAM_NOTICE.md", "THIRD_PARTY_NOTICES.md"
];
for (const rel of mustExist) {
    if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing required file: ${rel}`);
}
for (const forbidden of ["public/img", "public/screenshots", "public/src/roll-a-die", "public/src/lobby.js", "public/src/server.js"]) {
    if (fs.existsSync(path.join(root, forbidden))) throw new Error(`Obsolete/unresolved runtime content still present: ${forbidden}`);
}
function read(rel) { return fs.readFileSync(path.join(publicRoot, rel), "utf8"); }
const app = read("src/app.js");
const create = read("create.html");
const home = read("index.html");
const gameHtml = read("game.html");
const createJS = read("src/create-game.js");
const style = read("css/style.css");
const gameCSS = read("css/game.css");
const createCSS = read("css/create.css");
const rules = read("src/rulesets.js");

if (/match-id|join-match-button|Join match|Match ID:/i.test(home + create + gameHtml)) throw new Error("Online multiplayer controls are exposed.");
if (/boardgame\.io|SocketIO|LobbyClient|SERVER_URL|confetti-js/.test(app + createJS + read("src/local-client.js"))) throw new Error("Static runtime still depends on online/npm libraries.");
if (!home.includes("./create.html") || !createJS.includes("gooseLocalConfig")) throw new Error("Local navigation/configuration is missing.");
if (!/type="module" src="\.\/src\/boot-index\.js"/.test(home)) throw new Error("Home page is not using a browser ES module entry.");
if (!/type="module" src="\.\/src\/create-game\.js"/.test(create)) throw new Error("Create page is not using a browser ES module entry.");
if (!/type="module" src="\.\/src\/app\.js"/.test(gameHtml)) throw new Error("Game page is not using a browser ES module entry.");
if (!gameHtml.includes("./src/dice/roll-dice.css")) throw new Error("Dice CSS is not linked from game.html.");
if (!home.includes('data-i18n="common.newGame"') || !create.includes('data-i18n="create.title"')) throw new Error("IT/EN hooks missing.");
if (!read("src/i18n.js").includes("Gioco dell'Oca") || !read("src/i18n.js").includes("Game of the Goose")) throw new Error("Both language catalogs must be present.");
if (/fonts\.googleapis\.com/.test(style)) throw new Error("External Google Font import remains.");
if (!/max-device-width:\s*820px/.test(gameCSS) || !/max-width:\s*620px/.test(createCSS)) throw new Error("Responsive mobile breakpoints are missing.");
if (!rules.includes("or to 53 if you rolled 4 and 5")) throw new Error("Classic 4+5 rules text is inconsistent with code.");
if (!read("src/artwork.js").includes("gooseSVGMarkup") || !app.includes("eventIconMarkup")) throw new Error("Restored inline artwork is missing.");
if (/https?:\/\//.test(read("src/artwork.js"))) throw new Error("Artwork module must not fetch external assets.");

const tileIDs = [...app.matchAll(/data-id="(\d+)"/g)].map((m) => Number(m[1]));
if (tileIDs.length !== 64 || new Set(tileIDs).size !== 64 || Math.min(...tileIDs) !== 0 || Math.max(...tileIDs) !== 63) {
    throw new Error("Board must contain each tile exactly once from 0 through 63.");
}

const jsFiles = [];
function collect(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) collect(full);
        else if (entry.name.endsWith(".js")) jsFiles.push(full);
    }
}
collect(path.join(publicRoot, "src"));
collect(path.join(root, "scripts"));
collect(path.join(root, "tests"));
for (const file of jsFiles) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(`Syntax check failed for ${path.relative(root, file)}:\n${result.stderr}`);
}

// Browser ESM imports must be relative, explicit .js files, and resolve on disk.
for (const file of jsFiles.filter((f) => f.includes(path.sep + "src" + path.sep))) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)) {
        const spec = match[2];
        if (!spec.startsWith(".")) throw new Error(`${path.relative(root, file)} has non-relative browser import: ${spec}`);
        if (!spec.endsWith(".js")) throw new Error(`${path.relative(root, file)} import lacks .js extension: ${spec}`);
        const target = path.resolve(path.dirname(file), spec);
        if (!fs.existsSync(target)) throw new Error(`${path.relative(root, file)} imports missing file: ${spec}`);
    }
}

for (const htmlRel of ["index.html", "create.html", "game.html"]) {
    const html = read(htmlRel);
    for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)) {
        const target = path.resolve(publicRoot, path.dirname(htmlRel), match[1]);
        if (!fs.existsSync(target)) throw new Error(`${htmlRel} references missing local file ${match[1]}`);
    }
}

console.log(`Static source audit passed (${jsFiles.length} JavaScript files checked).`);
