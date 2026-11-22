// SPDX-License-Identifier: GPL-3.0-only
// Libre Arcade addition. Replaces upstream's six <audio> tags and its
// playSoundEffect(): same pause / rewind / play per effect, but the files are
// only requested after the first user gesture (unlock), there is a mute, and
// it is not limited to Chrome (upstream's gate silenced Firefox and Safari).

export const SOUND_FILES = {
  freezetime: 'freezetime.mp3',
  lose: 'lose.mp3',
  move: 'move.mp3',
  reverse: 'reverse.mp3',
  teleport: 'teleport.mp3',
  win: 'win.mp3',
};

export function createSound ({ base = 'assets/audio/', AudioClass = globalThis.Audio, muted = false } = {}) {
  const elements = new Map();
  let unlocked = false;
  let isMuted = muted;

  return {
    // Must be called from a user gesture (a click, a key press, a touch).
    unlock () {
      if (unlocked || !AudioClass) {
        return;
      }
      unlocked = true;
      Object.entries(SOUND_FILES).forEach(([name, file]) => {
        const audio = new AudioClass(base + file);
        audio.preload = 'auto';
        elements.set(name, audio);
      });
    },

    play (name) {
      const audio = elements.get(name);
      if (!audio || isMuted) {
        return;
      }
      audio.pause();
      audio.currentTime = 0;
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    },

    setMuted (value) {
      isMuted = Boolean(value);
      if (isMuted) {
        elements.forEach(audio => audio.pause());
      }
    },

    get muted () {
      return isMuted;
    },

    get unlocked () {
      return unlocked;
    },
  };
}
