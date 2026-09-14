const STORAGE_PREFIX = 'grugnettos-goose.board-calibration.';

export function calibrationStorageKey(themeId) {
  return `${STORAGE_PREFIX}${themeId}`;
}

export function cloneBoardLayout(layout) {
  return {
    ...layout,
    start: [...layout.start],
    positions: Object.fromEntries(
      Object.entries(layout.positions).map(([index, point]) => [index, [...point]])
    )
  };
}

export function isValidBoardLayout(layout) {
  if (!layout || typeof layout !== 'object') return false;
  if (!Array.isArray(layout.start) || layout.start.length !== 2) return false;
  const positions = layout.positions;
  if (!positions || Object.keys(positions).length !== 63) return false;
  const validPoint = (point) => Array.isArray(point)
    && point.length === 2
    && point.every((value) => Number.isFinite(value) && value >= 0 && value <= 100);
  return validPoint(layout.start) && Object.values(positions).every(validPoint);
}

export function loadCalibratedLayout(themeId, baseLayout, storage = globalThis.localStorage) {
  const fallback = cloneBoardLayout(baseLayout);
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(calibrationStorageKey(themeId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!isValidBoardLayout(parsed)) return fallback;
    return { ...fallback, ...cloneBoardLayout(parsed), id: themeId, calibrationStatus: 'local' };
  } catch {
    return fallback;
  }
}

export function saveCalibratedLayout(themeId, layout, storage = globalThis.localStorage) {
  if (!storage || !isValidBoardLayout(layout)) return false;
  storage.setItem(calibrationStorageKey(themeId), JSON.stringify({
    schemaVersion: 1,
    id: themeId,
    calibrationStatus: 'local',
    start: layout.start,
    positions: layout.positions
  }));
  return true;
}

export function clearCalibratedLayout(themeId, storage = globalThis.localStorage) {
  storage?.removeItem(calibrationStorageKey(themeId));
}


export function updateDebugMarkerPlacement(hotspot, x, y) {
  if (!hotspot) return;

  // The calibration label must represent the real anchor, not a cosmetically
  // shifted position. Earlier builds nudged labels away from the edges; that
  // made a correct layout look wrong in the editor. Keep both the dot and the
  // number exactly on the normalized board coordinate instead.
  hotspot.style.setProperty('--debug-label-x', '0px');
  hotspot.style.setProperty('--debug-label-y', '0px');
  hotspot.dataset.debugHorizontal = 'center';
  hotspot.dataset.debugVertical = 'center';
  hotspot.dataset.debugX = String(Number(x.toFixed?.(3) ?? x));
  hotspot.dataset.debugY = String(Number(y.toFixed?.(3) ?? y));
}

export function fitBoardRect(containerWidth, containerHeight, aspectRatio) {
  const width = Number(containerWidth);
  const height = Number(containerHeight);
  const ratio = Number(aspectRatio);
  if (!(width > 0) || !(height > 0) || !(ratio > 0)) return { width: 0, height: 0 };

  let fittedWidth = width;
  let fittedHeight = fittedWidth / ratio;
  if (fittedHeight > height) {
    fittedHeight = height;
    fittedWidth = fittedHeight * ratio;
  }
  return { width: fittedWidth, height: fittedHeight };
}

export function exportBoardLayout(layout) {
  return JSON.stringify({
    schemaVersion: 1,
    id: layout.id,
    calibrationStatus: 'calibrated',
    start: layout.start,
    positions: layout.positions
  }, null, 2) + '\n';
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export class BoardCalibrator {
  constructor({ boardEl, enabled, getLayout, onChange, onDirtyChange }) {
    this.boardEl = boardEl;
    this.enabled = enabled;
    this.getLayout = getLayout;
    this.onChange = onChange;
    this.onDirtyChange = onDirtyChange;
    this.dragIndex = null;
    this.pointerId = null;
    this.dirty = false;

    boardEl.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    boardEl.addEventListener('pointermove', (event) => this.onPointerMove(event));
    boardEl.addEventListener('pointerup', (event) => this.onPointerUp(event));
    boardEl.addEventListener('pointercancel', (event) => this.onPointerUp(event));
  }

  setDirty(value) {
    this.dirty = value;
    this.onDirtyChange?.(value);
  }

  onPointerDown(event) {
    if (!this.enabled()) return;
    const hotspot = event.target.closest?.('.board-hotspot');
    if (!hotspot || !this.boardEl.contains(hotspot)) return;
    event.preventDefault();
    this.dragIndex = Number(hotspot.dataset.index);
    this.pointerId = event.pointerId;
    hotspot.setPointerCapture?.(event.pointerId);
    hotspot.classList.add('calibration-dragging');
  }

  onPointerMove(event) {
    if (!this.enabled() || this.dragIndex === null || event.pointerId !== this.pointerId) return;
    const rect = this.boardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100);
    const layout = this.getLayout();
    layout.positions[String(this.dragIndex)] = [Number(x.toFixed(3)), Number(y.toFixed(3))];
    const hotspot = this.boardEl.querySelector(`[data-index="${this.dragIndex}"]`);
    if (hotspot) {
      hotspot.style.left = `${x}%`;
      hotspot.style.top = `${y}%`;
      updateDebugMarkerPlacement(hotspot, x, y);
    }
    this.setDirty(true);
    this.onChange?.(layout, this.dragIndex);
  }

  onPointerUp(event) {
    if (this.dragIndex === null || event.pointerId !== this.pointerId) return;
    const hotspot = this.boardEl.querySelector(`[data-index="${this.dragIndex}"]`);
    hotspot?.classList.remove('calibration-dragging');
    this.dragIndex = null;
    this.pointerId = null;
  }
}
