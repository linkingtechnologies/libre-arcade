# Historical audio conversion

Wok 1.0 ships two music tracks as early Xiphophorus Vorbis beta streams:
`wok1.ogg` and `wok2.ogg`. Modern FFmpeg/Chromium identifies them as Vorbis
beta 1/2 but rejects their setup codebooks. SoX can decode these historical
streams successfully.

For the web runtime, each original Ogg file was decoded once to signed 16-bit
PCM WAV, mono, 16000 Hz. This avoids a second lossy encoding generation. The
original files are preserved unchanged in both the historical reference and the
original-asset convenience copy.

Runtime outputs:

- `wok1.wav`: 1 channel, 16000 Hz, 16-bit PCM, 28.14 s
- `wok2.wav`: 1 channel, 16000 Hz, 16-bit PCM, 31.15 s

SHA-256:

- original `wok1.ogg`: `46e8d3e4734b0790e5b44ae9e02f7f55781e1355d2049a8de3069ecb68e6268d`
- original `wok2.ogg`: `3ae0be67ed9d0fdbecb58581677ab0910bd10ba3b1ff77d270802375ef315c0b`
- runtime `wok1.wav`: `04fca5377f08f608d48d595eea9f0b48abf0fa681aac9c5f92e1065f4dc674bd`
- runtime `wok2.wav`: `c316d4e612971cc4e286b09dd9b9e77524ba3ed0daa8e263bb52b95a17d781e5`

The browser smoke test is `test/audio-browser-smoke.html`.
