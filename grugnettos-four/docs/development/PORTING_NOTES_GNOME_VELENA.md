# GNOME Gnect Velena tactical port

M15 ports the bounded tactical fallback used by GNOME Gnect's GPL release of
the Velena engine, not the complete perfect-play engine.

Preserved concepts and constants:

- 69 four-cell winning groups;
- immediate-win and immediate-loss handling;
- `groupeval()` weights for two- and three-stone groups;
- gravity-aware odd threats and repeated odd-threat bonuses;
- the historical five-column `pentas` pattern;
- `GOODMOVE = 16384`, `BADMOVE = -16384`;
- depth-limited alternating lookahead;
- random leaf variance in `[0, 34]` and random best-move tie selection.

ConnectLab injects its seeded xorshift32 stream in place of GNOME's runtime
random function. Therefore replay is deterministic inside the Arena, while the
random sequence is not claimed to match GLib. Depths 2–4 are offered; depth 4
matches the historical `DEPTH` constant.

The original engine also invokes proof-number search, all nine Allis rules and
an opening book before this fallback. Those components are preserved in
`reference/` but are not claimed by the JavaScript adapter. Naming it
“GNOME Velena Tactical” keeps that scope visible and avoids a false
perfect-play claim.
