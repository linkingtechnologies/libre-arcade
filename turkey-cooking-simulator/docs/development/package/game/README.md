# Turkey Cooking Simulator — Libre Arcade preservation port

A native HTML5 + JavaScript preservation port of **Turkey Cooking Simulator**, originally created for GitHub Game Off 2013.

The port preserves the original thermal simulation and gameplay behavior while replacing non-commercial artwork/dialogue assets with a clean Libre Arcade presentation built from procedural Canvas graphics and synthesized Web Audio.

## Play locally

The game uses ES modules, so serve the `src/` directory over HTTP:

```bash
python3 -m http.server 8000 --directory src
```

Then open `http://localhost:8000/`.

No build step, package install, framework, server-side component, or network connection is required during play.

## How to play

Your goal is to cook and serve a turkey successfully. The game simulates heat moving from the outside of the turkey toward its core, so the outside can look ready while the center is still undercooked.

1. **Shop.** Buy one turkey. You can also buy useful extras such as a temperature probe, alarm clock, oven light, cookbook, stuffing, and frills.
2. **Start cooking.** Enter the kitchen and set the oven temperature. Skin, Body, and Core temperatures evolve separately.
3. **Watch the turkey.** Its appearance changes as it moves from raw through cooked, dry, burnt, and fire states.
4. **Check the core.** If you bought the temperature probe, open the oven fully and use it to read the Core temperature. The interface marks **165°F** as a food-safety reference.
5. **Manage time.** Casual mode includes a 20-minute skip. Hardcore removes skip and retains the original Hardcore score multiplier.
6. **Serve.** Serve the turkey when you are satisfied. The final score deliberately preserves the historical scoring formula, including its original quirks.

The game saves locally in your browser. **Resume** continues the thermal simulation from the saved state rather than restarting it.

See [HOW_TO_PLAY.md](HOW_TO_PLAY.md) for the complete EN/IT guide.

## Controls

Mouse/touch can operate every visible control.

Keyboard:

- `M` — Market
- `K` — Kitchen
- `+` / `-` — Increase/decrease oven temperature
- `P` — Peek oven door
- `O` — Open/close oven door
- `T` — Temperature probe
- `I` — Oven light
- `S` — Skip 20 minutes (Casual only)
- `F` — Serve turkey
- `L` — Toggle EN/IT
- `A` — Toggle audio

## Preservation notes

The thermal model is intentionally faithful to the historical implementation. It retains the original transient-sphere analytical model, oven ramp behavior, water-loss accumulator, cook-state thresholds, historical scoring behavior, and documented legacy quirks.

The original baseline is commit:

`56bcde6458af8957f8e439d98df8361a43d2f6e5`

Technical preservation details are in [docs/PRESERVATION_NOTES.md](docs/PRESERVATION_NOTES.md).

## Licensing

The new runtime code is licensed under **GPLv3**.

Original artwork and dialogue identified as **CC BY-NC 3.0** remain isolated under `/reference` for archaeological purposes and are not used by the executable port. Runtime visuals are new procedural Canvas graphics; runtime audio is synthesized with Web Audio.

See `THIRD_PARTY_NOTICES.md` and `reference/LICENSES.md` for details.
