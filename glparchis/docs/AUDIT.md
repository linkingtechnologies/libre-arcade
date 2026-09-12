# glParchis 20181125 — archaeology audit

## Identification

- Project: **glParchis**
- Version audited: **20181125**
- Internal version date: **2018-11-25**
- Main developer credited by the package: **Mariano Muñoz / Turulomio**
- French translation credited to **Nadejda Adam**
- Technology: Python 3, PyQt5, PyOpenGL, Qt Multimedia

The archive passes `tar` integrity inspection and all Python files compile syntactically with Python 3's `compileall` in the audit environment.

## License conclusion

`LICENSE.txt` contains the complete **GNU General Public License, Version 3, 29 June 2007**. `setup.py` independently declares the PyPI classifier `GNU General Public License v3 (GPLv3)` and `license='GPL-3'`.

There is no package-level statement granting “GPL v3 or any later version”, and source files do not contain per-file “or later” notices. For restoration work the conservative interpretation is therefore **GPL-3.0-only** unless additional upstream evidence says otherwise.

This resolves the SourceForge/LibreGameWiki GPLv2 metadata conflict for the 20181125 package: this particular source release is GPLv3.

## Completeness

The 2012 changelog already states that the application had all gameplay functionality and that virtual players still needed improvement. Later releases add and refine AI, high scores, 6/8-player boards, settings, statistics, autosave, 3-player mode and automatic dice/move handling. Version 20181125 is a mature playable implementation, although its PyPI classifier still calls it Beta.

Native board layouts exist for 3, 4, 6 and 8 seats. Every seat has independent `plays` and `ia` flags, so active seats may be human or CPU in any mix. This is local/hot-seat multiplayer only; no gameplay networking protocol was found.

## Network dependencies

Gameplay itself is local. The application contains optional HTTP calls for installation/game statistics, global-statistics pages, update checking and bug-report navigation. These are not needed to reproduce the game and should be omitted from the static browser port.

## Restoration verdict

**GO for code, rules, board data and AI under GPLv3.**

**NO-GO for blindly copying the complete media directory.** Several media files lack provenance and two icons explicitly identify themselves as unlicensed preview images. The browser restoration should recreate the presentation with clean Canvas/SVG/DOM assets and separately licensed audio.
