# M12 — Final polish / release candidate

M12 keeps the historically certified MilCity 1.0.5 gameplay model while finishing the browser-facing usability pass.

## Player-facing changes

- Removed the non-functional browser **Exit** menu item.
- Removed the non-functional **Vibration** option.
- The **Water** option now actually controls terrain generation (it was previously displayed but ignored by the browser core).
- Selecting a City building automatically moves the placement cursor to the first valid patch of free land when one exists.
- New games start with the Power Plant cursor already on a valid placement, avoiding the historical "red cursor on water" dead start.
- The quick-start box is now a live five-step coach: Power Plant → Commercial → Missile Silo → first Missile → first attack.
- The coach provides a direct **Take me to the next step / Portami al prossimo passo** button when an action is required.
- The selected building card shows live construction state and approximate remaining seconds.
- Successful placement reports the building name and expected construction time.
- Valid/invalid placement is reinforced with a translucent green/red footprint, not only a thin outline.
- Feedback is announced through an ARIA live region.

## Responsive changes

The page remains non-scrolling. On narrow displays the phone and control panel share the available viewport; the game viewport reserves room for the controls instead of consuming the whole screen. The control panel itself may scroll internally when required.

## Preservation boundary

The following remain unchanged from the parity-certified core:

- building/weapon costs and footprints;
- economy and energy rules;
- construction/production timing;
- combat, Spy and Shield behavior;
- scoring quirks and crater behavior;
- Easy / Medium / Hard / Madness AI;
- historical 10 FPS presentation timing.

The only core correction in M12 is wiring the already exposed `waterPercent` game option into the historical random-walk terrain generator.

## Test status

M12 adds 12 release-polish checks on top of the complete previous regression suite, including a functional test showing that 20% and 80% Water settings generate materially different maps under the same QA seed.
