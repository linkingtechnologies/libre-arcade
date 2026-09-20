# Historical JAR: preliminary redistribution review (2026-09-20)

**Practical result: public redistribution of the unmodified, shaded JAR has NOT been cleared.** Do not include it in a publicly accessible Git repository, Git LFS, GitHub release, or web build on the strength of the project-level Apache-2.0 label alone. This is a technical inventory and license-compliance risk review, not a legal opinion or an assertion that distribution is categorically forbidden.

## Evidence for the original game code

- Original source: https://github.com/boskoop/comet-pinball ; LICENSE at https://github.com/boskoop/comet-pinball/blob/master/LICENSE . The authors place their work under **Apache-2.0**, including a copyright notice for Comet Engineering, Patrick Haring and Christian Bürgi. This permits distribution of the *original authors' licensed work* subject to its attribution, license and NOTICE obligations.
- The upstream SourceForge page lists Apache License V2.0: https://sourceforge.net/projects/comet-pinball/ ; the JAR is published at https://sourceforge.net/projects/comet-pinball/files/1.1.0/ . A public download is not, by itself, proof of ownership or sublicense rights for every bundled third-party asset.

## Direct inventory of the original JAR (before removing it from this public-commit package)

- Filename: `comet-pinball-1.1.0-b480.jar`; size **7,816,773 bytes**, SHA-256 `84aa5e48c962439113d7e444881e3891c5a179b2306d49db42da9740d580a05f`.
- This is a **fat/shaded JAR** with 3,163 ZIP entries and third-party libraries. Some relevant Maven metadata: `ch.qos.logback/logback-classic` and `logback-core`, `org.picocontainer`, Commons Lang/IO, libGDX/LWJGL (details in `reference/audit/third-party-inventory.csv`). The JAR contains Apache license and Commons Lang NOTICE text under `META-INF/`; the inventory does not establish a complete license/attribution set for every shaded component, particularly alternative EPL-1.0/LGPL-2.1 conditions of the included Logback version. These terms require a separate distribution-compliance assessment.
- Embedded resource files `data/menu/nueva_white.fnt`, `data/menu/nueva_black.fnt`, `data/menu/nueva_white_0.tga`, and `data/menu/nueva_black_0.tga` are **bitmap-font descriptors and glyph atlases**. The descriptors identify `face="Nueva Std Cond"`; no grant covering republication of a reusable font atlas was located in the JAR or project audit. These are not `.otf`/`.ttf` font binaries, so a generic statement about redistribution of Adobe font files does not automatically determine their exact legal status. They nevertheless embed a reusable character set, rather than a static screenshot; rights for this specific material and distribution should be confirmed with its actual rights holder or the game authors.
- Other original resource files, including `data/libgdx.png`, `data/splash.png`, `data/metallkugel.jpg`, and `data/fussball.png`, have no independently established per-file origin and license in the preservation audit. Inclusion under the project-level license may be valid for author-owned assets but does not by itself resolve authorship of externally sourced images.

Adobe's general font-packaging guidance restricts redistribution of font files under many standard licenses (https://helpx.adobe.com/fonts/web/getting-and-using-fonts/package-font-files.html); the Nueva family page distinguishes app-embedding licensing from standard service usage (https://fonts.adobe.com/fonts/nueva). **Neither source by itself proves the status of these specific 2013 raster atlases.**

## Distribution decision for this repository

- **Publish:** clean HTML5 port, replacement art/music with their separately documented terms, source/documentation, SHA/provenance records, existing measured oracle CSVs, and original author attribution. Source code Apache-2.0 is not a blanket guarantee for third-party embedded resources.
- **Do not publish yet:** the untouched JAR. This first-commit ZIP deliberately excludes the JAR and `.gitignore` excludes `reference/releases/*.jar`. The `reference/SHA256SUMS` ledger intentionally retains its digest for archaeological identification. The original JAR can still be downloaded directly from the original project site for local verification.
- **To reconsider:** identify/verify original authorship or an explicit license for both Nueva Std bitmap atlases and other embedded images; inventory each shaded library and comply with its applicable notices, license text and any source/relinking conditions where required. If permissions cannot be established, preserve an unmodified JAR privately and link to the original upstream copy rather than redistributing it.

No historical game source, manual, or recorded oracle CSV was modified by this review.
