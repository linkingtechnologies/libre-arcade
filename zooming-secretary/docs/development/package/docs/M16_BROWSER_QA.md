# M16 Browser QA

Automated/static checks cover:

- 256x240 virtual canvas;
- fixed 50 Hz simulation scheduler;
- keyboard and touch controls;
- IT/EN copy for Day 1 and Day 2;
- no-scroll CSS policy;
- Day 1 -> Day 2 campaign wiring;
- Chief and coffee rendering paths;
- ES-module syntax validation;
- local HTTP serving of `index.html` and `web/app.js`;
- no historical media in `web/`.

Chromium is present in the build environment, but the headless process times out because the
container lacks its DBus services. M16 therefore does **not** claim automated cross-browser
visual certification. A local human browser play-test remains recommended for visual sizing,
touch feel and readability on small displays.
