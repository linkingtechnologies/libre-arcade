const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..", "public");

const publicFiles = [
  "index.html", "create.html", "game.html",
  "src/i18n.js", "src/rulesets.js", "src/app.js", "src/create-game.js"
];
const combined = publicFiles.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

const forbidden = [
  /Dummy!/i,
  /going to jail\?!/i,
  /browser console/i,
  /\bSocketIO\b/i,
  /\bLobbyClient\b/i,
  /\bSERVER_URL\b/i,
  /Powered by/i,
  /restored\.10/i,
  /\bv10\b/i,
];
for (const pattern of forbidden) {
  if (pattern.test(combined)) throw new Error(`Unwanted public-facing/dead copy found: ${pattern}`);
}
console.log("Public copy audit passed.");
