export const NES_VIEWPORT = Object.freeze({ width: 256, height: 240 });

export function computeCanvasCssSize(availableWidth, availableHeight) {
  const width = Number(availableWidth);
  const height = Number(availableHeight);
  if (!(width > 0) || !(height > 0)) {
    return { width: NES_VIEWPORT.width, height: NES_VIEWPORT.height, scale: 1 };
  }

  const fit = Math.min(width / NES_VIEWPORT.width, height / NES_VIEWPORT.height);
  // At 2x and above, whole-number scaling keeps the NES pixels perfectly crisp.
  // Below 2x, use the full available area so small windows and phones do not
  // collapse back to an unnecessarily tiny 1x display.
  const scale = fit >= 2 ? Math.floor(fit) : fit;

  return {
    width: Math.max(1, Math.floor(NES_VIEWPORT.width * scale)),
    height: Math.max(1, Math.floor(NES_VIEWPORT.height * scale)),
    scale,
  };
}
