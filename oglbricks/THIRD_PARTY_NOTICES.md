# Third-party notices and origin

## OGLBricks

Original game and source-defined 27 piece geometries: **Alexey Markarov**, © 2012, MIT License. `reference/OGLBricks-MIT-LICENSE.txt` reproduces the original license notice. The geometry dataset in `public/js/shapes.js` is derived from the original MIT-licensed `Shape.cpp` using the audited geometric transforms. Preserve the original author notice and MIT license when redistributing this derived portion.

## New HTML5 port

Libre Arcade's original HTML/JS/CSS, tests and documentation are licensed under GPL-3.0-or-later (`LICENSE`). This license does not erase the MIT attribution/notice for the original geometry and source-derived material.

## Runtime and assets

The web app uses only browser-provided Canvas, Web Audio and other web-standard APIs plus system fonts. The new synthesized sound effects are original work of the Libre Arcade adaptation and do not use or redistribute samples from the Windows original. No Qt, Assimp, OpenGL implementation, original Windows runtime DLLs, unverified `.3ds` meshes, original icons or music/audio are distributed in the web deployment. Archive copies of historic binaries and sources are intended only for provenance/audit; any separate publication of them requires a dedicated review of third-party license terms and asset provenance. The independent web visual treatment is drawn procedurally.

## Analytics

The one remote script is the collection's **GoatCounter** page-view snippet (`gc.zgo.at`, counts sent to `grugnetto.goatcounter.com`) in `public/index.html`, added when the game joined the collection. It is not part of the game, is not covered by this project's license, and is the page's only network request; removing that single `<script>` tag leaves the game with no remote dependency. `test/site.test.mjs` lists every remote script in the page and allows exactly that one.
