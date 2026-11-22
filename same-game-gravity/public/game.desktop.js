/*
 * Desktop version
 * Copyright (C) 2011 @greweb
 * GPL v3 - https://github.com/gre/same-game-gravity
 *
 * Restored for Libre Arcade (2026): jQuery/Modernizr/hashchange/tmpl removed,
 * online scores + Twitter sharing + analytics + app-store links dropped, Pause,
 * mute, language switch and touch controls added. The rules, difficulty table,
 * score formula and timings are the original ones. See specs/design.md.
 */
(function(){
  var util = window.util = window.util||{};
  var game = window.samegame = window.samegame||{};

  var Ticker = util.Ticker;
  var Timer = util.Timer;
  var TimeProgression = util.TimeProgression;
  var Color = game.Color;
  var Colors = game.Colors;
  var Sound = util.Sound;
  var i18n = util.i18n;
  var LevelProgressBar = game.LevelProgressBar;
  var GameStorage = game.Storage;

  var $ = function(sel, ctx) { return (ctx||document).querySelector(sel); };
  var $$ = function(sel, ctx) { return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); };

  // RESTORATION: the bar holds Back / Pause / Mute, a bit taller than the
  // original 30px so that it stays tappable on a phone.
  game.GAME_BAR_SIZE = 40;

  var safeStore = {
    get: function(k) { try { return window.localStorage.getItem(k); } catch(e) { return null; } },
    set: function(k, v) { try { window.localStorage.setItem(k, v); } catch(e) {} }
  };
  var LANG_KEY = 'libre-arcade.same-game-gravity.lang';
  var MUTE_KEY = 'libre-arcade.same-game-gravity.muted';

  var readyFns = [];
  var onReady = function(f) { readyFns.push(f); };

  var Orientation = util.Orientation = function() {
    var orientationDelayed = 0;
    var orientation = 0;
    var cssOrientation = 0;
    var delay = null;

    var rotateNodes = [];

    var setCssOrientation = function(o) {
      cssOrientation = o;
      rotateNodes.forEach(function(n){ n.style.transform = 'rotate('+o+'deg)'; });
    }
    var setOrientation = function(o) {
      orientation = o;
      if(delay) clearTimeout(delay);
      delay = setTimeout(function(){
        delay = null;
        orientationDelayed = o;
      }, 500);
    }
    /* convert any %90 orientation to a valid orientation (-90, 0, 90, 180) */
    var normalizeOrientation = function(o) {
      while(o<0) o += 360;
      return (o+90)%360 - 90;
    }
    var addOrientation = function(add) {
      setCssOrientation(cssOrientation+add);
      setOrientation( normalizeOrientation(orientation + add) );
    }

    window.addEventListener('keydown', function(e){
      var key = e.key;
      switch (key) {
        case 'ArrowLeft': e.preventDefault(); addOrientation(-90); break;
        case 'ArrowRight': e.preventDefault(); addOrientation(90);  break;
        case 'ArrowUp': case 'ArrowDown': e.preventDefault(); break; // prevent scrolling
        default: return;
      }
    });

    return {
      init: function() {
        rotateNodes = $$('#gameContainer canvas');
      },
      resetOrientation: function() {
        setOrientation(0);
      },
      turnRight: function() {
        addOrientation(90);
      },
      turnLeft: function() {
        addOrientation(-90);
      },
      fromRealPosition: function(p, maxX, maxY, translateX, translateY) {
        if(!translateX) translateX=0;
        if(!translateY) translateY=0;
        var o = orientationDelayed;
        if(o==90) return {x: p.y, y: maxX-p.x-translateX };
        if(o==-90) return {x: maxY-p.y-translateY, y: p.x };
        if(o==180) return {x: maxX-p.x-translateX, y: maxY-p.y-translateY };
        return p;
      },
      toRealPosition: function(p, maxX, maxY, translateX, translateY) {
        if(!translateX) translateX=0;
        if(!translateY) translateY=0;
        var o = orientationDelayed;
        if(o==-90) return {x: p.y, y: maxX-p.x-translateX };
        if(o==90) return {x: maxY-p.y-translateY, y: p.x };
        if(o==180) return {x: maxX-p.x-translateX, y: maxY-p.y-translateY };
        return p;
      },
      get: function(){
        return orientationDelayed;
      }
    }
  }();
  onReady(Orientation.init);

  onReady(function(){
    var bindTurn = function(sel, fn) {
      var node = $(sel);
      node.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        fn();
      });
    };
    bindTurn('#game .turnleft', function(){ Orientation.turnLeft(); });
    bindTurn('#game .turnright', function(){ Orientation.turnRight(); });
  });

  // RESTORATION: browser language auto-detection (IT/EN/FR), stored choice first
  var Locale = util.Locale = {
    get: function(){
      var saved = safeStore.get(LANG_KEY);
      if(saved) return saved;
      var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
      var supported = i18n.languages();
      for(var i=0; i<list.length; ++i) {
        var l = String(list[i]).substring(0,2).toLowerCase();
        if(supported.indexOf(l) != -1) return l;
      }
      return 'en';
    }
  };

  var currentGame = null;
  var pauseControl = null; // set while a game is running, see game()
  /// The game controller
  var sg = game.SameGame = (function() {
    var colors;
    // game constants
    var gridSizeByDifficulty = game.Difficulty.gridSize;
    var colorNumberByDifficulty = game.Difficulty.colorNumber;
    var gameTimeoutByDifficulty = game.Difficulty.timeout;
    var difficulties = game.Difficulty.names;

    var gameNeverLaunched = GameStorage.gameNeverLaunched();

    var audioPop, audioSwosh;

    // Some Controller utils functions
    var scene = function(name) {
      var section = document.getElementById(name);
      var all = $$('#main > section');
      var idx = all.indexOf(section);
      all.forEach(function(s, i){
        if(i > idx) s.classList.add('after');
        else s.classList.remove('after');
        if(i == idx) s.classList.add('current');
        else s.classList.remove('current');
      });
      document.body.setAttribute('data-scene', name);
    }
    var _functions = [];
    var onRouteChange = function(call) {
      _functions.push(call);
    }
    var callRouteChangeFunctions = function() {
      for(var i=0; i<_functions.length; ++i)
        _functions[i]();
      _functions = [];
    }
    var redirect = function(path) {
      sg.route(path);
    }

    var retrieveGame = function() {
      if(currentGame!==null && !currentGame.isFinished()) return currentGame;
      return GameStorage.retrieveGame();
    }

    var hasGameSaved = function() {
      return currentGame!==null && !currentGame.isFinished() || GameStorage.hasGameSaved();
    }

    return {
      init: function() {
        audioPop = new Sound(['pop.wav'], 2);
        audioSwosh = new Sound(['swosh.wav'], 4);
      },
      route: function(path) {
        callRouteChangeFunctions();
        if(path=='/') return this.index();
        if(path=='/menu') return this.menu();
        if(path=='/game/continue') return this.continueGame();
        if(path=='/game/new') return this.newGame();
        if(path=='/game/new/easy') return this.newGame(0);
        if(path=='/game/new/normal') return this.newGame(1);
        if(path=='/game/new/hard') return this.newGame(2);
        if(path=='/highscores') return this.highscores();
        if(path=='/help') return this.help();
        if(path=='/help/1') return this.help(1);
        if(path=='/help/2') return this.help(2);
        if(path=='/credits') return this.credits();
        return this.index();
      },
      index: function() {
        if(gameNeverLaunched) {
          gameNeverLaunched = false;
          return redirect('/help');
        }
        return this.menu();
      },
      menu: function() {
        var c = $('#menu .continueGame');
        c.style.display = hasGameSaved() ? '' : 'none';
        scene('menu');
      },
      highscores: function() {
        var highscores = $('#highscores');
        var scores = [GameStorage.getDifficultyScore(0), GameStorage.getDifficultyScore(1), GameStorage.getDifficultyScore(2)];
        var easy = scores[0] || 0, normal = scores[1] || 0, hard = scores[2] || 0;
        var totalScore = GameStorage.getTotalScore();
        var levelProgress = new LevelProgressBar(totalScore).get();

        $('.totalScore', highscores).textContent = totalScore+'';
        $('.level', highscores).textContent = levelProgress.level;
        $('.progress', highscores).style.width = (levelProgress.progress*100)+'%';
        $('.easyScore', highscores).textContent = easy;
        $('.normalScore', highscores).textContent = normal;
        $('.hardScore', highscores).textContent = hard;

        $('.resetHighscores', highscores).onclick = function(){
          if(confirm(i18n.get("confirm_reset_highscores"))) {
            GameStorage.resetScores();
            sg.highscores();
          }
        };
        scene('highscores');
      },
      credits: function() {
        scene('credits');
      },
      help: function(num) {
        if(!num) num = 1;
        scene('help-'+num);
      },
      newGame: function(difficulty) {
        if(!difficulty) difficulty = 0;
        currentGame = new game.Game({
          gridSize: gridSizeByDifficulty[difficulty],
          colors: colors=Colors.get(colorNumberByDifficulty[difficulty]),
          container: '#game',
          rendererClass: 'GameCanvasRenderer',
          difficulty: difficulty,
          drawHover: true,
          globalTimer: new Timer().pause(),
          keepSquare: true
        });
        this.game();
      },
      continueGame: function() {
        if(!hasGameSaved()) return redirect('/');
        try {
          currentGame = retrieveGame();
        } catch(e) {
          GameStorage.cleanGameSave();
          return redirect('/');
        }
        this.game();
      },
      game: function() {
        if(!currentGame) return hasGameSaved() ? redirect('/game/continue') : redirect('/');
        GameStorage.saveGame(currentGame);

        var timeout = gameTimeoutByDifficulty[currentGame.params.difficulty];
        var ticker = new Ticker();
        var gameEndProgression = new TimeProgression(timeout);
        var globalTimer = currentGame.params.globalTimer;

        var audioEnabled = false;
        setTimeout(function(){ audioEnabled = true; }, 500);

        // RESTORATION: Pause / resume
        var paused = false, pauseStartedAt = 0;
        var overlay = $('#pauseOverlay');
        var setPauseUI = function(on) {
          overlay.hidden = !on;
          $$('.pauseButton').forEach(function(b){ b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        };
        var pause = function() {
          if(paused || !gameEndProgression) return;
          paused = true;
          pauseStartedAt = new Date().getTime();
          globalTimer.pause();
          game.RemainingSecondsBar.freeze();
          setPauseUI(true);
        };
        var resume = function() {
          if(!paused) return;
          var ms = new Date().getTime() - pauseStartedAt;
          paused = false;
          if(gameEndProgression) gameEndProgression.shift(ms);
          currentGame.shiftTimes(ms);
          globalTimer.start();
          game.RemainingSecondsBar.unfreeze(gameEndProgression ? gameEndProgression.getRemainingTime() : 0);
          setPauseUI(false);
        };
        pauseControl = {
          pause: pause,
          resume: resume,
          toggle: function() { paused ? resume() : pause(); },
          isPaused: function() { return paused; }
        };
        game.RemainingSecondsBar.clearInline();
        setPauseUI(false);

        currentGame.bindAll();
        currentGame.bind('game-blockDestroy', function(){
          gameEndProgression = new TimeProgression(timeout);
          if(audioEnabled) audioPop.play();
        });
        currentGame.bind('game-gravityChange', function(e, data){
          var nb = 0;
          for(var i=0; i<data.gravityMove.length; ++i)
            nb += data.gravityMove[i].length;
          if(audioEnabled && nb>0) audioSwosh.play();
        })
        currentGame.bind('game-change', function(){
          if(currentGame && !currentGame.isFinished()) GameStorage.saveGame(currentGame);
        });
        currentGame.bind('game-finish', function(){
          currentGame.unbindAll();
          ticker.stop().removeListeners();
          globalTimer.pause();
          GameStorage.cleanGameSave();
          pauseControl = null;
          setPauseUI(false);
          sg.endGame(gameEndProgression == null);
        });

        onRouteChange(function(){
          gameEndProgression = null;
          if(currentGame) {
            currentGame.unbindAll();
          }
          ticker.stop().removeListeners();
          globalTimer.pause();
          pauseControl = null;
          setPauseUI(false);
        });

        ticker.addListener(function(){
          if(paused) return;
          if(gameEndProgression && gameEndProgression.isOver()) {
            currentGame.trigger('game-finish');
            gameEndProgression = null;
          }
          else {
            currentGame.render();
            game.RemainingSecondsBar.updateRemainingSeconds(gameEndProgression, timeout);
          }
        }).start();
        globalTimer.start();

        scene('game');
      },
      endGame: function(timeoutReach) {
        if(!currentGame) return this.menu();
        var finish = $('#finish');
        var destroyed = currentGame.getAllDestroyed().sort(function(a, b){
          return b.nb - a.nb;
        }).splice(0, 4);
        // RESTORATION: the colors of the game being finished (upstream used the
        // module variable of the last *new* game, undefined after a reload).
        var gameColors = currentGame.colors;
        for(var i=0; i<destroyed.length; ++i) {
          var dest = destroyed[i];
          dest.clrStyle = gameColors[dest.color].getHexWithLightness(0.5);
        }
        var blocksRemaining = currentGame.grid.countBlocks();
        var difficulty = currentGame.params.difficulty;
        var globalTimer = currentGame.params.globalTimer;
        var result = game.computeScore(difficulty, blocksRemaining, destroyed, globalTimer.getMillis());
        var remainingBlocksScore = result.remainingBlocksScore;
        var destructionScore = result.destructionScore;
        var timeScore = result.timeScore;
        var score = result.score;
        var newRecord = GameStorage.setDifficultyScore(difficulty, score);
        GameStorage.addToTotalScore(score);

        var list = $('#finish .bestDestroyed');
        list.textContent = '';
        destroyed.forEach(function(d){
          var li = document.createElement('li');
          li.style.color = d.clrStyle;
          var combo = document.createElement('span');
          combo.className = 'combo';
          combo.textContent = d.nb;
          var bull = document.createElement('span');
          bull.className = 'bull';
          bull.style.backgroundColor = d.clrStyle;
          li.appendChild(combo);
          li.appendChild(document.createTextNode(' '));
          li.appendChild(bull);
          list.appendChild(li);
        });

        $('.newRecord', finish).style.display = newRecord ? '' : 'none';
        $('.congratulations', finish).style.display = blocksRemaining==0 ? '' : 'none';
        $('.gameover', finish).style.display = blocksRemaining==0 ? 'none' : '';
        $('.remainingBlocksScore', finish).textContent = ''+remainingBlocksScore;
        $('.timeScore', finish).textContent = ''+timeScore;
        $('.totalScore', finish).textContent = ''+score;
        $('.destructionScore', finish).textContent = ''+destructionScore;
        // kept as keys so the text follows a language switch
        finish.setAttribute('data-blocks-remaining', blocksRemaining);
        sg.updateFinishTitle();
        $('.again', finish).onclick = function(e){
          e.preventDefault();
          redirect('/game/new/'+difficulties[difficulty]);
        };
        GameStorage.cleanGameSave();
        currentGame.unbindAll();
        currentGame = null;
        scene('finish');
      },
      updateFinishTitle: function() {
        var finish = $('#finish');
        var n = parseInt(finish.getAttribute('data-blocks-remaining') || '0', 10);
        $('.remainingBlocksScoreTitle', finish).textContent = n==0 ? i18n.get('all_blocks_destroyed') : n+' '+i18n.get('blocks_remaining');
      },
      getCurrentGame: function() { return currentGame; },
      pause: function() { if(pauseControl) pauseControl.pause(); },
      resume: function() { if(pauseControl) pauseControl.resume(); },
      togglePause: function() { if(pauseControl) pauseControl.toggle(); },
      isPaused: function() { return !!pauseControl && pauseControl.isPaused(); }
    }
  }());

  /// RESTORATION: mute switch (persisted), shared by every mute button
  var applyMute = function() {
    $$('.muteButton').forEach(function(b){
      b.setAttribute('aria-pressed', Sound.muted ? 'true' : 'false');
      b.classList.toggle('on', !Sound.muted);
    });
  };
  game.setMuted = function(m) {
    Sound.muted = !!m;
    safeStore.set(MUTE_KEY, Sound.muted ? '1' : '0');
    applyMute();
  };

  /// Init and bind the game controller
  var startup = function(){
    readyFns.forEach(function(f){ f(); });

    // RESTORATION: ?seed=N plays a reproducible board (test / replay mode)
    var m = /[?&]seed=(-?\d+)/.exec(location.search);
    if(m) game.setSeed(parseInt(m[1], 10));

    Sound.muted = safeStore.get(MUTE_KEY) === '1';
    applyMute();

    setTimeout(function(){ // Wait before enabling transition to not do transition for the first load
      $('#main').classList.add('enabletransition');
    }, 500);

    $('#main').style.display = 'block';

    document.addEventListener('click', function(e){
      var a = e.target.closest ? e.target.closest('a') : null;
      if(!a) return;
      var href = a.getAttribute('href') || '';
      if(href.indexOf('#!') == 0) {
        e.preventDefault();
        game.SameGame.route(href.replace('#!', '') || '/');
      }
    });

    $$('.pauseButton').forEach(function(b){ b.addEventListener('click', function(e){ e.stopPropagation(); game.SameGame.togglePause(); }); });
    $('#pauseOverlay').addEventListener('click', function(e){ e.stopPropagation(); game.SameGame.resume(); });
    $$('.muteButton').forEach(function(b){ b.addEventListener('click', function(e){ e.stopPropagation(); game.setMuted(!Sound.muted); }); });
    $$('.langButton').forEach(function(b){
      b.addEventListener('click', function(){
        var l = b.getAttribute('data-lang');
        if(i18n.setLang(l)) {
          safeStore.set(LANG_KEY, l);
          refreshLang();
        }
      });
    });
    var refreshLang = function() {
      $$('.langButton').forEach(function(b){
        b.setAttribute('aria-pressed', b.getAttribute('data-lang') == i18n.getLang() ? 'true' : 'false');
      });
      game.SameGame.updateFinishTitle();
    };
    refreshLang();

    window.addEventListener('keydown', function(e){
      if(e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key;
      if(k == 'p' || k == 'P' || k == 'Escape') {
        if(game.SameGame.getCurrentGame() && document.body.getAttribute('data-scene') == 'game') {
          e.preventDefault();
          game.SameGame.togglePause();
        }
      }
      else if(k == 'm' || k == 'M') {
        game.setMuted(!Sound.muted);
      }
    });
    // a hidden tab keeps the wall clock running: pause instead of timing out
    document.addEventListener('visibilitychange', function(){
      if(document.hidden) game.SameGame.pause();
    });

    game.SameGame.init();
    game.SameGame.route('/');
    game.ready = true;
    document.dispatchEvent(new Event('samegame-ready'));
  };
  // i18n.js is loaded after this file but, like every script, before DOMContentLoaded
  document.addEventListener('DOMContentLoaded', startup);

}());
