export const LOGICAL_WIDTH = 640;
export const LOGICAL_HEIGHT = 480;

/**
 * Source-faithful visual geometry for GameControl.on_use_asset().
 * Coordinates are kept in Cocos bottom-left space here and converted by the
 * controller only when passed to the Canvas renderer.
 */
export function attackVisualSpec(assetIndex, playerIndex, targetJitter = 0) {
  const src = playerIndex === 0 ? [75, 20] : [LOGICAL_WIDTH - 75, 20];
  const dst = playerIndex === 0 ? [LOGICAL_WIDTH - 75, 75] : [75, 75];
  const targetBottom = [dst[0], dst[1] + targetJitter];

  if (assetIndex === 1) {
    return {
      sourceBottom: [src[0], src[1] + 20], targetBottom,
      duration: 2000, flipX: true, rotateTurns: 2,
    };
  }
  if (assetIndex === 2) {
    return {
      sourceBottom: playerIndex === 0 ? [0, LOGICAL_HEIGHT] : [LOGICAL_WIDTH, LOGICAL_HEIGHT],
      targetBottom,
      duration: 2000,
      // Upstream names are slightly counter-intuitive: player 0 launches the
      // flip_x=True `meteorite_right`, player 1 the unflipped `meteorite_left`.
      flipX: playerIndex === 0,
      rotateTurns: 0,
    };
  }
  if (assetIndex === 3) {
    return {
      sourceBottom: [...src], targetBottom,
      duration: 1000, flipX: playerIndex === 1, rotateTurns: 0,
    };
  }
  if (assetIndex === 4) {
    return {
      sourceBottom: [...src], targetBottom,
      duration: 500, flipX: false, rotateTurns: 0,
    };
  }
  throw new RangeError(`unsupported attack asset: ${assetIndex}`);
}
