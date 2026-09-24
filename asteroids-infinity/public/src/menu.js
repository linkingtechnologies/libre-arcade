/* Historical menu topology from Ben Whittaker's v1.2 main() (source lines 639–920).
 * Presentation/DOM, touch selection and browser-only quit are modern adapters.
 * GPL-3.0-or-later, (C) 2026 Libre Arcade contributors.
 */
export const MENU_ITEMS=Object.freeze({
  menu:['play','highscores','options','quit'],
  options:['fullscreen','volume','fps','controls','back'],
  controls:['up','down','left','right','shoot','shield','back'],
  highscores:['back'],help:['back'],credits:['back'],gameover:['continue'],name:['submit'],quit:['back']
});
export const CONTROL_ORDER=Object.freeze(['up','down','left','right','shoot','shield']);
export class MenuMachine {
  constructor(){this.screen='menu';this.selected=0;this.binding=null;this.origin='menu';}
  open(screen){if(!(screen in MENU_ITEMS)&&!['play','pause'].includes(screen))throw new Error('Invalid menu screen');
    this.screen=screen;this.selected=0;this.binding=null;return screen;}
  navigate(delta){const entries=MENU_ITEMS[this.screen];if(!entries||this.binding)return null;
    this.selected=(this.selected+(delta<0?-1:1)+entries.length)%entries.length;return entries[this.selected];}
  choose(){const entries=MENU_ITEMS[this.screen];if(!entries||this.binding)return null;
    const item=entries[this.selected],screen=this.screen;
    if(screen==='menu'){
      if(item==='play')this.open('play');
      else if(item==='highscores')this.open('highscores');
      else if(item==='options')this.open('options');
      else this.open('quit');
    }else if(screen==='options'){
      if(item==='controls')this.open('controls');
      else if(item==='back')this.open('menu');
    }else if(screen==='controls'){
      if(item==='back')this.open('options');
      else {this.binding=item;}
    }else if(screen==='highscores'||screen==='quit'||screen==='help'||screen==='credits')this.open('menu');
    else if(screen==='gameover')this.open('highscores');
    return item;
  }
  escape(){if(this.binding){this.binding=null;return 'cancel-binding';}
    if(this.screen==='controls'){this.open('options');return 'options';}
    if(this.screen==='options'||this.screen==='highscores'||this.screen==='quit'||this.screen==='help'||this.screen==='credits'){this.open('menu');return 'menu';}
    if(this.screen==='pause'){this.open('play');return 'play';}
    if(this.screen==='play'){this.open('gameover');return 'gameover';}
    if(this.screen==='menu')return 'quit';
    if(this.screen==='gameover'){this.open('highscores');return 'highscores';}
    return null;
  }
}
