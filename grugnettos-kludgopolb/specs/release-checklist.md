# RC39 production release checklist

## Automated gates

- [x] `npm test`
- [x] `npm run qa`
- [x] `npm run smoke` HTTP/status/MIME check
- [x] project-local storage reset covered by automated tests
- [x] packaged-file integrity / FILELIST and release checksums regenerated after all RC39 changes

## Browser smoke tests

The managed Chromium available in the build environment blocks navigation to loopback/local sites by organization policy. These checks are therefore **not claimed as passed** here.

- [ ] Chromium desktop, 1440×900
- [ ] Chromium compact/mobile viewport, 390×844
- [ ] Chromium short landscape viewport
- [ ] no page-level scrolling at tested viewport sizes
- [ ] new-game dialog opens and remains within viewport
- [ ] board/config/localization requests complete without browser HTTP errors

## Manual release gates

These must not be marked complete without actual observation on the target browser/device.

- [ ] Firefox desktop
- [ ] Safari desktop / WebKit
- [ ] Android Chromium on a physical touch device
- [ ] iPhone/iPad Safari on a physical touch device
- [ ] portrait phone
- [ ] landscape phone / short viewport
- [ ] keyboard-only interaction pass
- [ ] touch interaction pass
- [ ] IT / EN / FR / DE visual overflow pass
- [ ] save → reload → resume
- [ ] Reset local data → reload → no recovery prompt / preferences reset
- [ ] sound: silent until the first tap, plays after it, the toolbar level changes the volume and off is silent (also with the phone's silent switch on iPhone/iPad Safari, and with the tab in the background)

Until the applicable browser/device gates are completed, RC39 remains a release candidate rather than a final production-labelled build.
