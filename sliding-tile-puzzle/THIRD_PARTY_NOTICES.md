# Third-party notices

## Original software

**Virtual Toybox Puzzle Collection / Sliding Tile Puzzle**  
Copyright © 2010 Jonathan Hulka.  
The recovered source headers license the software under the GNU General Public License, version 3 or (at your option) any later version.

Unmodified historical artifacts are preserved under `reference/`.

## Photographs

The ten historical photographs and their thumbnails are credited to **JS Nature Photos** and are distributed under **Creative Commons Attribution-ShareAlike 3.0 US** according to the attribution file preserved from the Libre Jigsaw source lineage.

Attribution: JS Nature Photos — http://photos.jstechs.com/

License copy and original attribution text are under `LICENSES/`.

## Analytics

The one remote script is the collection's **GoatCounter** page-view snippet (`gc.zgo.at`, counts sent to `grugnetto.goatcounter.com`) in `public/index.html`, added when the game joined the collection. It is not part of the game, is not covered by this project's license, and is the page's only network request; removing that single `<script>` tag leaves the game with no remote dependency. `test/production-smoke.cjs` lists every remote script in the page and allows exactly that one.
