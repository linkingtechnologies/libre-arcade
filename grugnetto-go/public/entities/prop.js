import * as me from "../vendor/melonjs-19.9.1.esm.js";

// Pure scenery — no collision, no physics, nothing the player can touch or that touches them
// (LEVEL_FORMAT.md's own words for "props": "senza corpo fisico/collisione"). A plain me.Sprite
// instead of me.Collectable (which every other Tiled-object entity here extends) reflects that
// literally: no me.Body ever gets created for this one. `settings.type` carries the prop kind
// (compile-level.py's own "kind" field, same convention as BonusEntity/EnemyEntity's "type")
// and picks which registered image to draw — falls back to "bush" for an unrecognized kind
// rather than throwing, since a missing decoration is a shrug, not a broken level.
const DEFAULT_KIND = "bush";

class PropEntity extends me.Sprite {
  constructor(x, y, settings) {
    const kind = me.loader.getImage(settings.type) ? settings.type : DEFAULT_KIND;
    super(x, y, Object.assign({
      image: me.loader.getImage(kind),
    }, settings));
    // Tiled's raw object (x, y) is the top-left corner (compile-level.py places props at
    // col*TILE, row*TILE — no bottom-center conversion the way GoalEntity needs); me.Sprite
    // defaults to a center (0.5, 0.5) anchor, which would draw this half a tile up-and-left of
    // where it's meant to sit. Force top-left to match, same reasoning as CoinEntity's own note
    // on why Tiled's object factory settings must not silently override this.
    this.anchorPoint.set(0, 0);
  }
}

export default PropEntity;
