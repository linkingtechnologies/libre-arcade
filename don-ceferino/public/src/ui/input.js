const state = {left:false,right:false,up:false,down:false,shot:false,sweep:false};
const actionByKey = new Map([
  ['ArrowLeft','left'], ['a','left'], ['h','left'],
  ['ArrowRight','right'], ['d','right'], ['l','right'],
  ['ArrowUp','up'], ['w','up'], ['k','up'],
  ['ArrowDown','down'], ['s','down'], ['j','down'],
  ['x','shot'], ['2','shot'],
  ['z','sweep'], ['c','sweep'], ['1','sweep'], ['3','sweep']
]);
const resumeKeys = new Set([' ', 'Enter', 'z', 'c', 'x']);

export function createInput({ onPause, onResume, onEscape }) {
  const setKey = (event, value) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const action = actionByKey.get(key);
    if (action) {
      state[action] = value;
      event.preventDefault();
    }
    if (value && key === 'p') { onPause?.(); event.preventDefault(); }
    if (value && resumeKeys.has(key)) onResume?.();
    if (value && key === 'Escape') { onEscape?.(); event.preventDefault(); }
  };
  addEventListener('keydown', e => setKey(e, true), {passive:false});
  addEventListener('keyup', e => setKey(e, false), {passive:false});
  addEventListener('blur', () => Object.keys(state).forEach(k => state[k]=false));

  document.querySelectorAll('[data-action]').forEach(button => {
    const action = button.dataset.action;
    const down = e => {
      state[action] = true;
      if (action === 'shot' || action === 'sweep') onResume?.();
      button.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };
    const up = e => { state[action] = false; e.preventDefault(); };
    button.addEventListener('pointerdown', down, {passive:false});
    button.addEventListener('pointerup', up, {passive:false});
    button.addEventListener('pointercancel', up, {passive:false});
    button.addEventListener('pointerleave', e => { if (e.buttons === 0) up(e); }, {passive:false});
  });
  return state;
}
