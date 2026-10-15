# M19 browser/static QA

## Passed

- ES module syntax validation for all `.js` / `.mjs` files.
- Canvas remains 256×240 virtual resolution.
- Existing no-scroll responsive CSS regression remains green.
- Keyboard, WASD and touch input regression remains green.
- IT/EN campaign strings include Dream entry and both Dream outcomes.
- Renderer contains only programmatic placeholder drawing; no image asset dependency was added.
- `PHONE_TELEPORT`, `GHOST_CAUGHT`, `STAGE_WON` and `DREAM_CAUGHT` are wired to user-visible messages/outcomes.

## Environment limitation

Automated visual Chromium certification is still not claimed in this container environment. The project should be served through a local HTTP server for manual browser QA.

Static syntax pass covered **38 JavaScript/ES-module files**.

A local HTTP smoke attempt in this execution container returned connection code `000` / curl error 7 even though the server process was launched, consistent with the localhost restrictions observed in earlier milestones. This is recorded as an environment limitation, not counted as a browser certification.
