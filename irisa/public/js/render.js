// SPDX-License-Identifier: GPL-3.0-only
// Libre Arcade addition. Replaces upstream's Vue render functions
// (index.js, components/*.js) with plain DOM, same output.
//
// Like Vue patching unkeyed children, element i always shows entity i, so
// when a new level replaces the entity list the old elements slide and change
// into the new ones through the same CSS transitions upstream had.

import { getEntityStyle } from './game/util.js';

export function entityClassName ({ className, isDisabled }) {
  return `${isDisabled ? 'disabled ' : ''}entity ${className}`;
}

export function createRenderer ({ app, board, nav, store, levelCount, isDevMode, onLevelButton, onChange }) {
  const elements = [];
  const dots = [];

  for (let n = 0; n < levelCount; n += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.addEventListener('click', () => onLevelButton(n));
    nav.appendChild(dot);
    dots.push(dot);
  }

  let lastLevel = -1;
  let lastState = '';

  function setClass (el, value) {
    if (el.className !== value) {
      el.className = value;
    }
  }

  function render () {
    const { boardSize, currentLevelNumber, entities, gameState } = store.state;

    setClass(app, gameState.toLowerCase());

    entities.forEach((entity, i) => {
      let el = elements[i];
      if (!el) {
        el = document.createElement('div');
        board.appendChild(el);
        elements[i] = el;
      }
      setClass(el, entityClassName(entity.props));
      const style = getEntityStyle(boardSize, entity.x, entity.y);
      el.style.height = style.height;
      el.style.left = style.left;
      el.style.top = style.top;
      el.style.width = style.width;
    });
    while (elements.length > entities.length) {
      elements.pop().remove();
    }

    const dev = isDevMode();
    dots.forEach((dot, n) => {
      const reachable = n <= currentLevelNumber || dev;
      setClass(dot, n < currentLevelNumber ? 'complete' : n === currentLevelNumber ? 'current' : '');
      if (dot.disabled === reachable) {
        dot.disabled = !reachable;
      }
      if (n === currentLevelNumber) {
        dot.setAttribute('aria-current', 'step');
      } else {
        dot.removeAttribute('aria-current');
      }
    });

    if (currentLevelNumber !== lastLevel || gameState !== lastState) {
      lastLevel = currentLevelNumber;
      lastState = gameState;
      if (onChange) {
        onChange({ level: currentLevelNumber, gameState });
      }
    }
  }

  return { render, dots };
}
