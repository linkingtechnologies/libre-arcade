# Legal and provenance audit

## Result

**GREEN for a GPLv3-compatible browser port.**

The source archives themselves contain the complete GNU GPL version 3 text in `COPYING.txt`. `README.txt` says: “This is free software under the terms of GPL version 3.” The author’s current project page additionally states “GPL version 3 (or later)”. The browser port therefore uses **GPL-3.0-or-later**.

## Upstream inconsistency retained as archaeology

`setup.py` contains both `license='GPL'` and the PyPI classifier `License :: OSI Approved :: MIT License`. This conflicts with `README.txt`, `COPYING.txt`, and the author’s project page. It is treated as an upstream metadata mistake, not as a separate MIT grant. The original file remains untouched under `/reference`.

Release 1.0.1 also spells the author surname as `Jartinez` in one copyright line; the author field and earlier release use `Juan J. Martinez`. This typo is preserved in `/reference` and corrected only in our documentation.

## Third-party game content explicitly excluded from GPL upstream

The upstream README identifies four exceptions:

1. `background.png` — derived from **NASA Blue Marble 2007 East**, credit NASA/Goddard Space Flight Center/Reto Stöckli, **CC BY 2.0**.
2. `RussoOne-Regular.ttf` — Jovanny Lemonad, **SIL OFL 1.1**, Reserved Font Name “Russo”.
3. `DroidSansMono.ttf` — Android Open Source Project, **Apache License 2.0**.
4. `cow.wav` — BuffBill84, **CC BY 3.0**. The preserved WAV is 882,044 bytes (~0.882 MB), matching the SoundBible “Cow” entry by BuffBill84; the 2013 README calls it “Cow Moo”.

The rest of the game assets are not listed as exceptions by upstream and were distributed with the GPL-covered game. The author’s PyWeek material also states that the game, including art, was produced during the competition week.

## Bundled Python libraries in `/reference`

The original release vendors Pyglet 1.2alpha1 and Cocos2d 0.5.5. Their source headers carry BSD-style terms; `cocos/audio` also contains historic Library GPL material. They are preserved unchanged for archaeology but **are not used by the HTML5/JavaScript port**.

## Distribution rule for this repository

- Browser-port code: GPL-3.0-or-later.
- Original third-party assets: remain under their own licenses and attribution requirements.
- `/reference`: preserved upstream material with its original notices; do not relicense it.
