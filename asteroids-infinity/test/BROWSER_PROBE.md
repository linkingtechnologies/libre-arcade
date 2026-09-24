# Browser UI diagnostic — M1

The M1 HTML/CSS and JavaScript bodies were exercised in Chromium headless with desktop 1280x800 English browser locale and mobile 390x844 Italian browser locale. Both sessions tested Canvas visibility, no vertical page scrolling, initial language selection, pause/reset, language toggle, keyboard or mobile touch event flow and uncaught page errors; screenshots from these sessions are stored in `screenshots/`.

**Runtime caveat:** Sandbox network policy blocks HTTP navigation even to localhost; the original HTML/CSS and ES module JS bodies were injected into an `about:blank` browser page for these tests. The browser results do NOT establish that HTTP-served ES module imports, real handheld-device pointer behavior or real native-game parity have been tested. A static-server end-to-end smoke test on a connected machine is still required. The accompanying Node core oracle suite runs the original ES module unmodified, with built-in Node test runner.
