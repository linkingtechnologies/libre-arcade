# UI v0.25 — setup footer visibility fix

The v0.24 setup card made the complete setup content scrollable. On short desktop
viewports this could place `Nuova partita`/`Continua` below the initially visible
scroll area even with a sticky footer.

v0.25 changes the ownership of scrolling:

- the setup card remains viewport-bounded;
- player-count control remains fixed;
- **only `.player-setup` scrolls** when player rows do not fit;
- Audio / reduced-motion controls remain visible;
- `Nuova partita` and `Continua` remain visible at the bottom of the card;
- on short desktop windows the two option toggles are laid out side-by-side to
  preserve vertical space.

No gameplay, RNG, board layout or save semantics changed.
