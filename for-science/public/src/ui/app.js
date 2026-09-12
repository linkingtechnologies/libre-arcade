import { RandomSource } from '../core/random.js';
import { GameController } from '../core/game-controller.js';
import { AssetStore, CanvasRenderer } from '../render/canvas-renderer.js';
import { AudioEngine } from './audio.js';
import { I18n } from './i18n.js';

export class App {
  constructor() {
    this.canvas = document.querySelector('#game');
    this.mainMenu = document.querySelector('#main-menu');
    this.optionsMenu = document.querySelector('#options-menu');
    this.helpMenu = document.querySelector('#help-menu');
    this.status = document.querySelector('#status');
    this.frame = document.querySelector('.frame');
    this.sceneFade = document.querySelector('#scene-fade');
    this.musicToggle = document.querySelector('#music');
    this.fullscreenToggle = document.querySelector('#fullscreen');
    this.languageSelect = document.querySelector('#language');
    this.i18n = new I18n();
    this.assets = new AssetStore();
    this.audio = new AudioEngine();
    this.renderer = null;
    this.game = null;
    this.transition = null;
  }

  async init() {
    this.i18n.applyDocument(document);
    this.languageSelect.value = this.i18n.language;

    // Start fetching audio while the mandatory visual assets load. Decoding is
    // deferred until a user gesture unlocks AudioContext.
    void this.audio.preload();
    await this.assets.loadImages();
    if (document.fonts?.ready) await document.fonts.ready;

    this.renderer = new CanvasRenderer(this.canvas, this.assets, (key) => this.i18n.t(key));
    this.renderer.drawTitle();
    this.#bindUi();
    this.musicToggle.checked = this.audio.musicEnabled;
    this.#syncFullscreenToggle();
    this.status.textContent = '';
    this.frame.setAttribute('aria-busy', 'false');

    const autostarted = this.#maybeAutostartParityRun();
    if (!autostarted) {
      this.mainMenu.hidden = false;
      this.#focusFirst(this.mainMenu);
    }
    this.#loop();
  }

  #maybeAutostartParityRun() {
    // Hidden capture hook used only by the parity harness. It intentionally
    // bypasses AudioContext/user-gesture requirements and adds no visible UI.
    const mode = new URLSearchParams(window.location.search).get('autostart');
    if (mode !== 'game' && mode !== 'demo') return false;
    this.#hideMenus();
    this.game = new GameController({
      renderer: this.renderer,
      audio: this.audio,
      demo: mode === 'demo',
      rng: this.#createRandomSource(),
      onExit: () => this.showMenu(),
      t: (key) => this.i18n.t(key),
    });
    void this.game.start();
    return true;
  }

  #bindUi() {
    document.querySelector('#start').addEventListener('click', () => this.startGame(false));
    document.querySelector('#demo').addEventListener('click', () => this.startGame(true));
    document.querySelector('#help').addEventListener('click', async () => {
      await this.#unlockMenuAudio();
      this.#showOnly(this.helpMenu);
      this.#focusFirst(this.helpMenu);
    });
    document.querySelector('#options').addEventListener('click', async () => {
      await this.#unlockMenuAudio();
      this.#showOnly(this.optionsMenu);
      this.#focusFirst(this.optionsMenu);
    });
    document.querySelector('#back').addEventListener('click', () => this.#returnToMainMenu());
    document.querySelector('#help-back').addEventListener('click', () => this.#returnToMainMenu());

    this.languageSelect.addEventListener('change', (event) => {
      this.i18n.setLanguage(event.target.value);
      this.i18n.applyDocument(document);
      this.languageSelect.value = this.i18n.language;
      this.audio.play('select');
      if (!this.game) this.renderer.drawTitle();
    });

    this.musicToggle.addEventListener('change', async (event) => {
      await this.audio.unlock();
      this.audio.setMusic(event.target.checked);
    });

    this.fullscreenToggle.addEventListener('change', async (event) => {
      await this.#setFullscreen(event.target.checked);
    });
    document.addEventListener('fullscreenchange', () => this.#syncFullscreenToggle());

    document.querySelector('#quit').addEventListener('click', async () => {
      await this.audio.unlock();
      this.audio.play('select');
      this.audio.stopMusic();
      this.status.textContent = this.i18n.t('status.quit');
    });

    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      void this.game?.handlePointer(event.clientX, event.clientY);
    });
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.game) {
          this.showMenu();
        } else if (!this.mainMenu.hidden) {
          // Already at the top level: preserve the original no-op feel.
        } else {
          this.#returnToMainMenu();
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void this.#setFullscreen(!document.fullscreenElement);
      }
    });
  }

  async #unlockMenuAudio() {
    await this.audio.unlock();
    this.audio.play('select');
    this.audio.startMusic();
  }

  #returnToMainMenu() {
    this.audio.play('select');
    this.#showOnly(this.mainMenu);
    this.#focusFirst(this.mainMenu);
  }

  #showOnly(menu) {
    this.mainMenu.hidden = menu !== this.mainMenu;
    this.optionsMenu.hidden = menu !== this.optionsMenu;
    this.helpMenu.hidden = menu !== this.helpMenu;
  }

  #hideMenus() {
    this.mainMenu.hidden = true;
    this.optionsMenu.hidden = true;
    this.helpMenu.hidden = true;
  }

  #focusFirst(menu) {
    queueMicrotask(() => menu.querySelector('button, input')?.focus({ preventScroll: true }));
  }

  async #setFullscreen(enabled) {
    try {
      if (enabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (!enabled && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen unavailable', error);
    } finally {
      this.#syncFullscreenToggle();
    }
  }

  #syncFullscreenToggle() {
    if (this.fullscreenToggle) this.fullscreenToggle.checked = Boolean(document.fullscreenElement);
  }

  async startGame(demo) {
    await this.audio.unlock();
    this.audio.play('select');
    this.audio.stopMusic();
    this.status.textContent = '';
    this.game?.stop();
    this.game = new GameController({
      renderer: this.renderer,
      audio: this.audio,
      demo,
      rng: this.#createRandomSource(),
      onExit: () => this.showMenu(),
      t: (key) => this.i18n.t(key),
    });

    // MainMenu uses FadeTransition(GameScene(...), 1.0): outgoing menu fades
    // to black for 0.5 s, incoming game appears under black, then fades in
    // for 0.5 s. The game scene itself is already alive during the transition.
    this.transition = { started: performance.now(), duration: 1000, midpoint: 500, switched: false };
    this.frame.classList.add('transitioning');
    void this.game.start();
  }

  #createRandomSource() {
    // Hidden parity hook: ?seed=123 reproduces Python 2.7 Random(123) for
    // board generation, AI shuffles, damage rolls and impact jitter.
    const value = new URLSearchParams(window.location.search).get('seed');
    if (value !== null && /^-?\d+$/.test(value)) return RandomSource.fromSeed(Number(value));
    return new RandomSource();
  }

  showMenu() {
    this.game?.stop();
    this.game = null;
    this.transition = null;
    this.sceneFade.style.opacity = '0';
    this.frame.classList.remove('transitioning');
    this.renderer.drawTitle();
    this.#showOnly(this.mainMenu);
    this.status.textContent = '';
    this.audio.startMusic();
    this.#focusFirst(this.mainMenu);
  }

  t(key) {
    return this.i18n.t(key);
  }

  #loop() {
    const frame = (now) => {
      if (this.game) {
        this.game.update(now);

        if (this.transition) {
          const age = now - this.transition.started;
          const half = this.transition.midpoint;
          if (age < half) {
            this.renderer.drawTitle();
            this.sceneFade.style.opacity = String(Math.max(0, Math.min(1, age / half)));
          } else {
            if (!this.transition.switched) {
              this.transition.switched = true;
              this.#hideMenus();
            }
            this.renderer.drawGame(this.game);
            this.sceneFade.style.opacity = String(Math.max(0, Math.min(1, (this.transition.duration - age) / half)));
            this.game.endFrame();
          }
          if (age >= this.transition.duration) {
            this.transition = null;
            this.sceneFade.style.opacity = '0';
            this.frame.classList.remove('transitioning');
          }
        } else {
          this.renderer.drawGame(this.game);
          this.game.endFrame();
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
