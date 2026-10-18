# Turkey Cooking Simulator

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/turkey-cooking-simulator/public/index.html)**

Browser port of **Turkey Cooking Simulator**, the cooking game that Robert J. Chen, Benjamin Kwok, Scott R. Mobley and Sheen Kao made for GitHub's Game Off in 2013. You buy one turkey and a few extras with $45, put it in the oven and set the temperature. The game simulates heat travelling from the skin to the core, so the outside can look done while the middle is still raw. Serve it when you think it is ready: the score is the original's.

The port follows the original **as the authors left it on the night of 1 December 2013** (commit `13afa12`): its thermal model is run against the original's own `model.js` and found identical tick for tick. Temperatures can be shown in **°F or °C** (the original has only °F). The pictures are drawn here, since the original's artwork is licensed for non-commercial use only; the sounds and the two tunes are the original's own, which are public domain or CC0.

## Play

- **Shop.** Choose one turkey (five, from 10 to 19 lb) and, if you can pay, the temperature probe, the alarm clock, the oven light, the cookbook, stuffing and the frills box.
- **Cook.** Start cooking and set the oven with the −25 and +25 buttons (−10 and +10 in °C). The oven warms slowly. Skin, Body and Core are three different temperatures.
- **Check.** Peek at the turkey, open the door fully and use the probe (if you own it) to read the Core. An open door cools the oven: 3 °C at once and 1 °C more for every second it stays open. The page marks 165 °F (74 °C) as a food-safety line.
- **Time.** The game runs in real time, one cooking second per second. In **Casual** you can skip 20 minutes at a time; **Hardcore** has no skip and multiplies the score by 20.
- **Serve.** The result screen shows the score and how it was made: the skin counts by the hottest it ever got, the core by how cooked it is and how near 165 °F. **Save** and **Resume** keep a game in the browser, and a resumed game continues from the saved temperatures.
- **Keyboard:** `M` market, `K` kitchen, `+`/`-` oven, `P` peek, `O` open the door, `T` probe, `I` light, `S` skip 20 minutes (Casual), `F` serve, `U` °F/°C, `L` English or Italian, `A` sound. Everything can also be done with the mouse or by touch.

The full guide, in English and Italian, is [`HOW_TO_PLAY.md`](HOW_TO_PLAY.md).

## Run it

```
npm install
npm run dev      # serves public/ on http://localhost:8080
npm run build    # copies public/ to game/ (a throwaway export of this one game)
npm test         # about a minute and a half
npm run check    # lint and test
```

`public/index.html` is the game, ES modules and a canvas: no build step, no framework, no network call but the collection's visit counter. Any static web server will do; it must be a server, not `file://`.

## Which version

The original lives at <https://github.com/fernjager/game-off-2013>. On 1 December 2013 its authors went on changing the game from morning to night: the thermal model (an analytic series became a finite-difference scheme with other constants), the cook states, the score and the oven door. The restoration package this game started from had ported the commit of 06:50; this game follows the last commit of the day, [`13afa12`](https://github.com/fernjager/game-off-2013/commit/13afa1230761fa24d13d9df4324ccafb504398bc) (23:25 Pacific time), and the package's earlier port is kept, with its own oracle, in `docs/development/package/`. The same turkey in the same oven comes out differently in the two (skin after an hour: 150 °F in the earlier one, 205 °F here). The details are in [`reference/SOURCE.md`](reference/SOURCE.md) and [`PROVENANCE.md`](PROVENANCE.md).

## How it was checked

- **Level 1, an executable oracle, for the thermal model.** The original's `js/model.js` of `13afa12`, byte for byte, is run next to the port's `thermal-model.js` and compared **exactly** after every second of ten turkeys and eleven oven schedules, door openings included (about 540,000 ticks): no difference. A game played in a real browser (headless Chrome, 6,019 ticks, five set points, five skips, the door open seven seconds) was replayed on the original and on the port and agrees to 1e-12.
- **Level 1 under stubs, for the score and the market.** The original's `ScoreScreen` is run as it is with the browser pieces stubbed and agrees with the port over 3,000 random servings; the original's market statements agree on prices and on the price rule for random weights.
- **Level 3, reading the source, for the scheduler and skip, the door and probe, and the effect of buying**, because `ui.js` needs CreateJS and a browser; the open door's cooling is pinned by hand-worked numbers and by the browser game.
- The restoration package's own 12 test scripts are kept and run against its own earlier port (`test/package.test.mjs`); two of them do not pass on the package's own files, and the test records why.
- The page was driven in headless Chrome (Casual and Hardcore, English and Italian, °F and °C, a phone-sized window, saving and resuming): no error in the console. Firefox, Safari and a real phone were not tried.
- **Not ported:** the original's house-fire screen (oven above 1,100 °F, or a burning turkey served), its dialogue and its art. The market's turkey weights are fixed, not random.

## Where it came from

A restoration package, `turkey-cooking-simulator-complete-rc1.zip`, with a JavaScript port of the original's morning commit, a page, reports for twelve milestones (summarised in `docs/development/MILESTONES.md`) and test scripts. Its page and most of its modules are in `public/`, with the changes listed in `docs/development/CHANGES.md`; its own files are in `docs/development/package/`. The original's code (not its art, sound or dialogue) is kept in `reference/`, for both commits.

## Licence

The port's code is **GPL-3.0-only** (`LICENSE`). The original's code is under the GPL version 3 with no "or later" in any file read, so "or later" is not assumed. The original's artwork is licensed CC BY-NC by its artist and is not used or redistributed, nor is its dialogue. Its sound files (twelve MP3, in `public/sounds/`) are public domain or CC0 according to the original's own credits and are used as they are. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`PROVENANCE.md`](PROVENANCE.md).
