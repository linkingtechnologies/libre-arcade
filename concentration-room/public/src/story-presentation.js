export const STORY_PRESENTATION = Object.freeze({
  ntscHz: 60,
  opponentCharsPerFrame: 1,
  openingPixelsPerStep: 1,
  openingStepFrames: 6,
  openingFastStepFrames: 1,
  // scrollOpeningText (litetitle.s), as the ROM runs it: the text goes up one pixel per step, a row of text every 16 pixels (a row of
  // spaces between rows), the first row entering at y = 232; 11 more rows are scrolled after the text ends, and then the screen fades
  // out in three steps of four frames, goes dark after 11 and the routine returns after 15.
  openingRowHeight: 16,
  openingFirstRowY: 232,
  openingBlankLinesAfterText: 11,
  fadeFrames: 15,
  fadeStepFrames: Object.freeze([4, 4, 3]),
  opponentTextX: 16,
  opponentTextY: 144,
  opponentLineHeight: 16,   // the text of an opponent scene is double spaced
});

export class OpponentTypewriter {
  constructor(rawText = '') { this.reset(rawText); }
  reset(rawText = '') {
    this.rawText = rawText;
    this.visibleChars = 0;
  }
  tick(frames = 1) {
    this.visibleChars = Math.min(this.rawText.length, this.visibleChars + Math.max(0, frames));
  }
  get text() { return this.rawText.slice(0, this.visibleChars); }
  get complete() { return this.visibleChars >= this.rawText.length; }
}

export class OpeningScroller {
  constructor(lines = []) { this.reset(lines); }
  reset(lines = []) {
    this.lines = [...lines];
    this.frameCounter = 0;
    this.scrollPx = 0;
    this.fading = false;
    this.fadeFrame = 0;
    this.finished = false;
  }
  tick({ up = false, down = false } = {}) {
    if (this.finished) return;
    // the text keeps scrolling while the picture fades, as the routine's loop does
    if (this.fading) {
      this.fadeFrame += 1;
      if (this.fadeFrame >= STORY_PRESENTATION.fadeFrames) { this.finished = true; return; }
    }
    this.frameCounter += 1;
    if (up) return; // original UP holds ytimer high and pauses scrolling
    const stepFrames = down ? STORY_PRESENTATION.openingFastStepFrames : STORY_PRESENTATION.openingStepFrames;
    if (this.frameCounter >= stepFrames) {
      this.frameCounter = 0;
      this.scrollPx += STORY_PRESENTATION.openingPixelsPerStep;
    }
    const rows = this.lines.length + STORY_PRESENTATION.openingBlankLinesAfterText;
    if (!this.fading && this.scrollPx >= rows * STORY_PRESENTATION.openingRowHeight) this.startFade();
  }
  startFade() {
    if (!this.fading) {
      this.fading = true;
      this.fadeFrame = 0;
    }
  }
  // 0: not fading; 1 to 3: the palette steps of the fade (orange, then darker, then black); 4: the screen is off
  get fadeStep() {
    if (!this.fading) return 0;
    let frame = this.fadeFrame;
    for (let step = 1; step <= 3; step += 1) {
      frame -= STORY_PRESENTATION.fadeStepFrames[step - 1];
      if (frame < 0) return step;
    }
    return 4;
  }
}
