# M10.4 — Back/Indietro menu fix

A manual browser test found that the visible Back/Indietro softkey on list menus (Solo, Options) did not react to mouse/touch.

Cause: `showList()` rendered the softkey as a plain `<span>` with no click handler. Keyboard Escape worked, and form screens used a separate clickable `#backForm`, so the issue escaped earlier automated checks.

Fix:
- list-menu Back is now a real button (`#backMenu`);
- it calls the same `back()` route-stack function as Escape;
- the main menu intentionally renders no active Back action;
- form Back remains unchanged.
