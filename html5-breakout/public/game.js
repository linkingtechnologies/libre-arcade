/**
 * A simple and traditional Breakout game implementation for the HTML5.
 *
 * This game is a HTML5 version of the old and legendary Breakout game, which
 * was release in 1976 by Atari Inc. This version uses the 2D drawing context
 * from the HTML5 canvas element to draw items on the screen. Game also uses
 * two different scenes, which also act as the states of the game. These scenes
 * are following:
 *
 * 1. Welcome
 * 2. Court
 *
 * Welcome scene contains the welcoming message and a selection whether to play
 * a single/multiplayer game and the court scene has the game implementation.
 *
 * @author J. Toiviainen
 */
var breakout = (function () {

  /** A constant for the number one keycode. */
  var KEY_1 = 49;
  /** A constant for the number two keycode. */
  var KEY_2 = 50;
  /** A constant for the right-arrow keycode. */
  var KEY_RIGHT = 39;
  /** A constant for the left-arrow keycode. */
  var KEY_LEFT = 37;
  /** A constant for the spacebar keycode. */
  var KEY_SPACEBAR = 32;
  /** A constant for the enter keycode. Local addition, not upstream — used only to return to
   *  the welcome scene once a game has ended, see courtScene's own onKeyUp. */
  var KEY_ENTER = 13;

  /** A constant definition for the game framerate. */
  var FPS = (1000.0 / 60.0);

  var canvas;
  var ctx;
  var scene;
  var players;
  var prevTickTime;
  var deltaAccumulator = 0.0;

  // ==========================================================================

  /**
   * The welcoming scene for the Breakout game.
   *
   * This scene is the main scene which will be shown to users when they open
   * the page. Our implementation contains a simple view where users see the
   * name of the game and an instructions about how to start the game.
   */
  var welcomeScene = (function () {

    /** A function that is called when the game enters this scene. */
    function enter() {
      document.addEventListener("keyup", onKeyUp);
    }

    /** A function that is called when the game exists this scene. */
    function exit() {
      document.removeEventListener("keyup", onKeyUp);
    }

    /** A function that is called on each main loop iteration. */
    function update() {
      // ... no implementation required
    }

    /** A funcion that is called on each rendering frame iteration. */
    function draw() {
      // calculate the center coordinates of the canvas.
      var center = [(canvas.width / 2), (canvas.height / 2)];

      // draw the application name string.
      ctx.font = "32pt Arial";
      ctx.fillText("HTML5 BREAKOUT", center[0], center[1] - 200);

      // draw the number of players selection instruction strings.
      ctx.font = "24pt Arial";
      ctx.fillText("Controls:", center[0], center[1] - 100);
      ctx.fillText("[spacebar] launch a ball", center[0], center[1] - 50);
      ctx.fillText("[left-arrow] move left", center[0], center[1]);
      ctx.fillText("[right-arrow] move right", center[0], center[1] + 50);
      ctx.fillText("Press [1] to start a 1 player game", center[0], center[1] + 150);
      ctx.fillText("Press [2] to start a 2 player game", center[0], center[1] + 200);
    }

    /**
     * A key listener to detect when a user key press is released.
     *
     * This implementation will detect only number 1 and 2 presses, which will
     * first save the definition about the number of players and the trigger a
     * new state transition from the welcome scene to the court scene.
     *
     * @param {*} event A key release event from the browser.
     */
    function onKeyUp(event) {
      var key = event.keyCode ? event.keyCode : event.which;
      if (key == KEY_1 || key == KEY_2) {
        players = (key == KEY_1 ? 1 : 2);
        setScene(courtScene);
      }
    }

    return {
      enter: enter,
      exit: exit,
      update: update,
      draw: draw
    }

  })();

  // ==========================================================================

  /**
   * The court scene for the Breakout application.
   *
   * This is the main game scene where the game simulation will be processed.
   * It contains all the logics required to move game entities and to make the
   * game act as a "game". This is the biggest scene from the two scenes.
   */
  var courtScene = (function () {

    /** The divisor of the slot width related to canvas width. */
    var SLOT_WIDTH_DIVISOR = 16;
    /** The divisor of the slot height related to canvas width. */
    var SLOT_HEIGHT_DIVISOR = 45;

    /** The fill style for the first brick group closest to paddle. */
    var BRICKS_1_FILL_STYLE = "yellow";
    /** The fill style for the second brick group. */
    var BRICKS_2_FILL_STYLE = "green";
    /** The fill style for the third brick group. */
    var BRICKS_3_FILL_STYLE = "orange";
    /** The fill style for the fourth brick group. */
    var BRICKS_4_FILL_STYLE = "red";

    /**
     * Get a normalized version of the given 2d-vector.
     *
     * @param {[]} vector An 2d-vector to be normalized.
     * @returns {[]} A normalized version of the given vector.
     */
    function normalize(vector) {
      var length = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
      return [vector[0] / length, vector[1] / length];
    }

    // ========================================================================
    /**
     * A constructor for all entities within the court scene.
     * @param {*} x The x-position of the entity.
     * @param {*} y The y-position of the entity.
     * @param {*} width The width of the entity.
     * @param {*} height The height of the entity.
     */
    function Entity(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    // ========================================================================
    /**
     * A constructor for all drawable entities within the court scene.
     * @param {*} x The x-position of the drawable entity.
     * @param {*} y The y-position of the drawable entity.
     * @param {*} width The width of the drawable entity.
     * @param {*} height The height of the drawable entity.
     */
    function Drawable(x, y, width, height) {
      Entity.call(this, x, y, width, height);
      this.fillStyle = "white";
      this.visible = true;
      this.draw = function () {
        if (this.visible == true) {
          ctx.fillStyle = this.fillStyle;
          ctx.fillRect(this.x, this.y, this.width, this.height);
        }
      }
    }

    // ========================================================================
    /**
     * A constructor for all collideable entities within the court scene.
     * @param {*} x The x-position of the collideable entity.
     * @param {*} y The y-position of the collideable entity.
     * @param {*} width The width of the collideable entity.
     * @param {*} height The height of the collideable entity.
     */
    function Collideable(x, y, width, height) {
      Drawable.call(this, x, y, width, height);
      this.extent = [width / 2, height / 2];
      this.center = [x + this.extent[0], y + this.extent[1]];
      this.enabled = true;
      this.collides = function (o) {
        if (this.enabled == false || o.enabled == false) return false;
        var x = Math.abs(this.center[0] - o.center[0]) < (this.extent[0] + o.extent[0]);
        var y = Math.abs(this.center[1] - o.center[1]) < (this.extent[1] + o.extent[1]);
        return x && y;
      }
    }

    // ========================================================================
    /**
     * A constructor for all movable entities within the court scene.
     * @param {*} x The x-position of the movable entity.
     * @param {*} y The y-position of the movable entity.
     * @param {*} width The width of the movable entity.
     * @param {*} height The height of the movable entity.
     */
    function Movable(x, y, width, height) {
      Collideable.call(this, x, y, width, height);
      this.direction = [0.0, 0.0];
      this.velocity = 0.0;
      this.move = function (dt) {
        if (this.direction[0] != 0.0) {
          var diffX = dt * this.direction[0] * this.velocity;
          this.x += diffX;
          this.center[0] += diffX;
        }
        if (this.direction[1] != 0.0) {
          var diffY = dt * this.direction[1] * this.velocity;
          this.y += diffY;
          this.center[1] += diffY;
        }
      }
    }

    // ========================================================================
    /**
     * A constructor for all wall entities within the court scene.
     * @param {*} x The x-position of the wall.
     * @param {*} y The y-position of the wall.
     * @param {*} width The width of the wall.
     * @param {*} height The height of the wall.
     */
    function Wall(x, y, width, height) {
      Collideable.call(this, x, y, width, height);
    }

    // ========================================================================
    /**
     * A constructor for the ball within the court scene.
     * @param {*} x The x-position of the ball.
     * @param {*} y The y-position of the ball.
     * @param {*} width The width of the ball.
     * @param {*} height The height of the ball.
     */
    function Ball(x, y, width, height) {
      /** The initial velocity for the ball.  */
      var INITIAL_VELOCITY = canvas.height / 2370;
      /** The amount of velocity to increment of each increase. */
      var VELOCITY_INCREMENT_STEP = canvas.height / 6330;

      /**
       * A utility function to create an initial random direction for the ball.
       *
       * @returns {[]} A new random 2d-direction vector.
       */
      function createRandomInitDirection() {
        switch (Math.floor((Math.random() * 10) + 1) % 3) {
          case 0:
            return normalize([0.0, 1.0]);
          case 1:
            return normalize([0.5, 0.5]);
          case 2:
            return normalize([-0.5, 0.5]);
        }
      }

      Movable.call(this, x, y, width, height);
      this.STATE_NORMAL = 0;
      this.STATE_BRICK_HIT = 1;
      this.velocity = 0.0;
      this.visible = false;
      this.direction = createRandomInitDirection();
      this.state = this.STATE_NORMAL;
      this.endGameMode = false;
      this.hitCounter = 0;
      this.redBricksHit = false;
      this.orangeBricksHit = false;
      this.INITIAL_VELOCITY = INITIAL_VELOCITY;
      this.incrementHitCount = function () {
        this.hitCounter++;
        if (this.hitCounter == 4 || this.hitCounter == 12) {
          this.incrementVelocity();
        }
      };
      this.incrementVelocity = function () {
        this.velocity += VELOCITY_INCREMENT_STEP;
      };
      this.reset = function () {
        this.x = (canvas.width / 2) - this.extent[0];
        this.y = (canvas.height / 2) - this.extent[1];
        this.center[0] = (canvas.width / 2);
        this.center[1] = (canvas.height / 2);
        this.velocity = 0;
        this.visible = false;
        this.direction = createRandomInitDirection();
        this.state = this.STATE_NORMAL;
        this.hitCounter = 0;
        this.redBricksHit = false;
        this.orangeBricksHit = false;
      };
      this.update = function (dt) {
        // skip update functionality if the ball is not visible.
        if (this.visible == false) return;

        if (this.direction[1] < 0.0 && this.collides(topWall)) {
          this.direction[1] = -this.direction[1];
          this.state = this.STATE_NORMAL;
          this.incrementHitCount();
          paddle.shrink();
        }
        if (this.direction[0] < 0.0 && this.collides(leftWall)) {
          this.direction[0] = -this.direction[0];
          this.state = this.STATE_NORMAL;
          this.incrementHitCount();
        }
        if (this.direction[0] > 0.0 && this.collides(rightWall)) {
          this.direction[0] = -this.direction[0];
          this.state = this.STATE_NORMAL;
          this.incrementHitCount();
        }
        if (this.direction[1] > 0.0 && this.collides(paddle)) {
          var xDiff = (this.center[0] - paddle.center[0]);
          this.direction[0] = xDiff / (paddle.width / 2);
          this.direction[1] = -this.direction[1];
          this.direction = normalize(this.direction);
          this.state = this.STATE_NORMAL;
          this.incrementHitCount();
        }

        // check whether the ball has entered so called out-of-bounds area.
        // after the ball enters this section, it is considered as being lost.
        // game ends i.e. goes into end animation after the last ball is used.
        // two player games will also need to change the player index here.
        if (this.direction[1] > 0.0 && this.collides(outOfBoundsDetector)) {
          incrementBallIndex();
          resetBallAndPaddle();
          if (players == 1) {
            if (playerBallIndex[activePlayer] > 3) {
              endGame();
            }
          } else {
            // hidden special case, which may occur only in two player games.
            // here an additional level is added to second player levels if
            // the first player has completed the first level with the third
            // ball and whether the ball gets off-the-screen immediately by
            // not hiting any bricks before. This hidden speciality allows
            // the second player to achieve the maximum of 1344 points instead
            // of the normal 896 points, which is available with two levels.
            if (activePlayer == 0) {
              if (playerBallIndex[activePlayer] > 3) {
                if (playerLevel[activePlayer] == 1) {
                  playerBricks[1].push(playerBricks[0][1]);
                }
              }
            }

            if (playerBallIndex[0] > 3 && playerBallIndex[1] > 3) {
              endGame();
            } else {
              switchPlayer();
            }
          }
        } else if (this.state != this.STATE_BRICK_HIT) {
          // check whether the ball intersects with the court bricks.
          var currentLevel = playerLevel[activePlayer];
          var bricks = playerBricks[activePlayer][currentLevel];
          for (var i = 0; i < bricks.length; i++) {
            if (this.collides(bricks[i])) {
              if (this.endGameMode == false) {
                // disable the brick from the level.
                bricks[i].visible = false;
                bricks[i].enabled = false;

                // perform actions based on the color of the brick we just hit.
                if (bricks[i].fillStyle == BRICKS_1_FILL_STYLE) {
                  playerScores[activePlayer] += 1;
                } else if (bricks[i].fillStyle == BRICKS_2_FILL_STYLE) {
                  playerScores[activePlayer] += 3;
                } else if (bricks[i].fillStyle == BRICKS_3_FILL_STYLE) {
                  playerScores[activePlayer] += 5;
                  if (this.orangeBricksHit == false) {
                    this.incrementVelocity();
                    this.orangeBricksHit = true;
                  }
                } else if (bricks[i].fillStyle == BRICKS_4_FILL_STYLE) {
                  playerScores[activePlayer] += 7;
                  if (this.redBricksHit == false) {
                    this.incrementVelocity();
                    this.redBricksHit = true;
                  }
                }

                // start blinking the current player score digits.
                blinkPlayerScoreDigits(activePlayer);

                // refresh the currently active players score.
                refreshPlayerScoreDigits(activePlayer);

                // increment the hit-count.
                this.incrementHitCount();

                // calculate the amount of destroyed bricks.
                var destroyedBricks = 0;
                for (var j = 0; j < bricks.length; j++) {
                  if (bricks[j].visible == false) {
                    destroyedBricks++;
                  }
                }

                // check whether the end of this level has been reached.
                // this requires that the player just destroyed the last brick.
                // we need to goto next level or check whether to end the game.
                if (destroyedBricks == bricks.length) {
                  resetBallAndPaddle();
                  if ((currentLevel + 1) >= playerBricks[activePlayer].length) {
                    playerBallIndex[activePlayer] = 4;
                  } else {
                    playerLevel[activePlayer]++;
                  }
                  if (players == 1) {
                    if (playerBallIndex[activePlayer] > 3) {
                      endGame();
                    }
                  } else {
                    if (playerBallIndex[0] > 3 && playerBallIndex[1] > 3) {
                      endGame();
                    } else if (playerBallIndex[activePlayer] > 3) {
                      switchPlayer();
                    }
                  }
                  return;
                }
              }

              // change the ball state to require a paddle or wall hit next.
              this.state = this.STATE_BRICK_HIT;

              // determine the reflection direction based on the collision side.
              this.direction[1] = -this.direction[1];
              break;
            }
          }
        }
        this.move(dt);
      }
    }

    function resetBallAndPaddle() {
      ball.reset();
      paddle.reset();
    }

    function incrementBallIndex() {
      playerBallIndex[activePlayer]++;
      playerBallIndexDigit.value = playerBallIndex[activePlayer];
    }

    function switchPlayer() {
      if (playerBallIndex[activePlayer == 0 ? 1 : 0] < 4) {
        // toggle the next active player index.
        activePlayer = (activePlayer == 0 ? 1 : 0);
        playerIndexDigit.value = (activePlayer + 1);
        playerIndexDigit.setBlink(true);

        // show the new active player ball index.
        playerBallIndexDigit.value = playerBallIndex[activePlayer];
      }
    }

    /**
     * End the current game.
     *
     * Ending the game will stretch the player paddle to 100% of the paddle
     * movement range width and make the ball to bounce around without breaking
     * any bricks from the currently shown level. This is considered as the end
     * game scene as it will not allow players to perform any actions anymore.
     */
    function endGame() {
      paddle.width = (canvas.width - rightWall.width - leftWall.width);
      paddle.x = rightWall.width;
      paddle.extent[0] = (paddle.width / 2);
      paddle.center[0] = (paddle.x + paddle.extent[0]);
      ball.velocity = ball.INITIAL_VELOCITY;
      ball.visible = true;
      ball.endGameMode = true;
    }

    /**
     * Refresh the target player score digits.
     *
     * This function is used to refresh the number shown with a four digit
     * group near the top of the screen. All digits are individual numbers
     * that must be separately updated to show the actual score in a user
     * friendly way. Both players have 4 digits to show the player score.
     * One digit (thousand digit) is being hidden until it is required.
     *
     * @param {*} playerIdx The index of the player to score to be refreshed.
     */
    function refreshPlayerScoreDigits(playerIdx) {
      // get the target player score in a string presentation.
      var scoreString = playerScores[playerIdx].toString();

      // ensure that the "secret" fourth number gets visible if required.
      if (scoreString.length == 4) {
        playerScoreDigits[playerIdx][0].visible = true;
      }

      // assign score values to corresponding player score digits.
      for (var i = 0; i < scoreString.length; i++) {
        var value = parseInt(scoreString.charAt((scoreString.length - 1) - i));
        playerScoreDigits[playerIdx][3 - i].value = value;
      }
    }

    /**
     * Start blinking of the target player score.
     *
     * This function starts a blinking functionality for the target player
     * scores i.e. the four or three digits currently shown as a player score.
     * Note that the fourth digit (i.e. the thousand digit) is only blinked
     * when the player has enough points that the thousand should be shown.
     *
     * @param {*} playerIdx The index of the player score to be blinked.
     */
    function blinkPlayerScoreDigits(playerIdx) {
      if (playerScores[activePlayer] > 999) {
        playerScoreDigits[activePlayer][0].setBlink(true);
      }
      playerScoreDigits[activePlayer][1].setBlink(true);
      playerScoreDigits[activePlayer][2].setBlink(true);
      playerScoreDigits[activePlayer][3].setBlink(true);
    }

    // ========================================================================
    /**
     * A constructor for the paddle within the court scene.
     * @param {*} x The x-position of the paddle.
     * @param {*} y The y-position of the paddle.
     * @param {*} width The width of the paddle.
     * @param {*} height The height of the paddle.
     */
    function Paddle(x, y, width, height) {
      Movable.call(this, x, y, width, height);
      this.fillStyle = "cyan";
      this.velocity = (canvas.height / 1350);
      this.originalWidth = width;
      this.shrink = function () {
        if (this.width == this.originalWidth) {
          this.width = (this.width / 2);
          this.extent[0] = (this.width / 2);
          this.x = (this.center[0] - this.extent[0]);
        }
      };
      this.reset = function () {
        if (this.width != this.originalWidth) {
          this.width = this.originalWidth;
          this.extent[0] = (this.width / 2);
        }
        this.x = (canvas.width / 2) - this.extent[0];
        this.center[0] = this.x + this.extent[0];
      }
      this.update = function (dt) {
        this.move(dt);
        if (this.direction[0] < 0.0 && this.collides(leftWall)) {
          this.x = leftWall.x + leftWall.extent[0] * 2;
          this.center[0] = this.x + this.extent[0];
        }
        if (this.direction[0] > 0.0 && this.collides(rightWall)) {
          this.x = rightWall.x - this.extent[0] * 2;
          this.center[0] = this.x + this.extent[0];
        }
      }
    }

    // ========================================================================
    /**
     * A constructor for a single digit instance within the court scene.
     * @param {*} x The x-position of the digit.
     * @param {*} y The y-position of the digit.
     * @param {*} width The width of the digit.
     * @param {*} height The height of the digit.
     */
    function Digit(x, y, width, height) {
      Drawable.call(this, x, y, width, height);
      this.value = 0;

      /** The index for the topmost horizontal line. */
      var HLINE_TOP = 0;
      /** The index for the middle horizontal line. */
      var HLINE_MIDDLE = 1;
      /** The index for the bottom horizontal line. */
      var HLINE_BOTTOM = 2;

      /** The index for the topleft vertical line. */
      var VLINE_LEFT_TOP = 0;
      /** The index for the bottomleft vertical line. */
      var VLINE_LEFT_BOTTOM = 1;
      /** The index for the topright vertical line. */
      var VLINE_RIGHT_TOP = 2;
      /** The index for the bottomright vertical line. */
      var VLINE_RIGHT_BOTTOM = 3;
      /** The index for the center vertical line. */
      var VLINE_CENTER = 4;

      /** The thickness used to draw the borders of the numbers. */
      var thickness = (height / 5);
      /** A precalculation for the half-height fixed with a 1 pixel. */
      var halfHeight = Math.ceil(height / 2) - 1;

      /** Horizontal line draw instructions. */
      var hlines = [];
      hlines[HLINE_TOP] = [x, y, width, thickness];
      hlines[HLINE_MIDDLE] = [x - 1, y + halfHeight- thickness / 2, width + 2, thickness];
      hlines[HLINE_BOTTOM] = [x, y + (height - thickness), width, thickness];

      /** Vertical line draw instructions. */
      var vlines = [];
      vlines[VLINE_LEFT_TOP] = [x - 1, y, thickness, halfHeight + 1];
      vlines[VLINE_LEFT_BOTTOM] = [x - 1, y + halfHeight, thickness, halfHeight + 1];
      vlines[VLINE_RIGHT_TOP] = [x + width - thickness, y, thickness + 1, halfHeight + 1];
      vlines[VLINE_RIGHT_BOTTOM] = [x + width - thickness, y + halfHeight, thickness + 1, halfHeight + 1];
      vlines[VLINE_CENTER] = [x + width / 2 - thickness, y, thickness, height];

      /** The amount of times to blink when blink is activated. */
      var BLINK_COUNT = 5;
      /** The amount of ticks (updates) to wait between blinking. */
      var BLINK_INTERVAL = 10;

      this.blinksLeft = 0;
      this.blinkTimer = 0;

      this.update = function (dt) {
        if (this.blinksLeft > 0) {
          this.blinkTimer--;
          if (this.visible == true) {
            // number is currently shown, so check whether it is time to hide it.
            if (this.blinkTimer <= 0) {
              this.visible = false;
              this.blinkTimer = BLINK_INTERVAL;
            }
          } else {
            // number is currently hidden, so check whether it is time to show it.
            if (this.blinkTimer <= 0) {
              this.visible = true;
              this.blinksLeft--;
              if (this.blinksLeft > 0) {
                this.blinkTimer = BLINK_INTERVAL;
              }
            }
          }
        }
      }

      this.setBlink = function (active) {
        if (active == false) {
          this.blinksLeft = 0;
          this.blinkTimer = 0;
          this.visible = true;
        } else {
          this.blinksLeft = BLINK_COUNT;
          this.blinkTimer = 0;
        }
      }

      /**
       * Draw the given line instructions on the canvas.
       * @param {[]} line A line instruction set to be drawn.
       */
      function drawLine(line) {
        ctx.fillRect(line[0], line[1], line[2], line[3]);
      }

      this.draw = function () {
        if (this.visible) {
          ctx.fillStyle = "white";
          switch (this.value) {
            case 0:
              drawLine(hlines[HLINE_TOP]);
              drawLine(hlines[HLINE_BOTTOM]);
              drawLine(vlines[VLINE_LEFT_TOP]);
              drawLine(vlines[VLINE_LEFT_BOTTOM]);
              drawLine(vlines[VLINE_RIGHT_TOP]);
              drawLine(vlines[VLINE_RIGHT_BOTTOM]);
              break;
            case 1:
              drawLine(vlines[VLINE_RIGHT_TOP]);
              drawLine(vlines[VLINE_RIGHT_BOTTOM]);
              break;
            case 2:
              drawLine(hlines[HLINE_TOP]);
              drawLine(hlines[HLINE_MIDDLE]);
              drawLine(hlines[HLINE_BOTTOM]);
              drawLine(vlines[VLINE_LEFT_BOTTOM]);
              drawLine(vlines[VLINE_RIGHT_TOP]);
              break;
            case 3:
              drawLine(hlines[HLINE_TOP]);
              drawLine(hlines[HLINE_MIDDLE]);
              drawLine(hlines[HLINE_BOTTOM]);
              drawLine(vlines[VLINE_RIGHT_TOP]);
              drawLine(vlines[VLINE_RIGHT_BOTTOM]);
              break;
            case 4:
              drawLine(hlines[HLINE_MIDDLE]);
              drawLine(vlines[VLINE_LEFT_TOP]);
              drawLine(vlines[VLINE_RIGHT_TOP]);
              drawLine(vlines[VLINE_RIGHT_BOTTOM]);
              break;
            case 5:
              drawLine(hlines[HLINE_TOP]);
              drawLine(hlines[HLINE_MIDDLE]);
              drawLine(hlines[HLINE_BOTTOM]);
              drawLine(vlines[VLINE_LEFT_TOP]);
              drawLine(vlines[VLINE_RIGHT_BOTTOM]);
              break;
            case 6:
              drawLine(hlines[HLINE_TOP]);
              drawLine(hlines[HLINE_MIDDLE]);
              drawLine(hlines[HLINE_BOTTOM]);
              drawLine(vlines[VLINE_LEFT_TOP]);
              drawLine(vlines[VLINE_LEFT_BOTTOM]);
              drawLine(vlines[VLINE_RIGHT_BOTTOM]);
              break;
            case 7:
              drawLine(hlines[HLINE_TOP]);
              drawLine(vlines[VLINE_RIGHT_TOP]);
              drawLine(vlines[VLINE_RIGHT_BOTTOM]);
              break;
            case 8:
              drawLine(hlines[HLINE_TOP]);
              drawLine(hlines[HLINE_MIDDLE]);
              drawLine(hlines[HLINE_BOTTOM]);
              drawLine(vlines[VLINE_LEFT_TOP]);
              drawLine(vlines[VLINE_LEFT_BOTTOM]);
              drawLine(vlines[VLINE_RIGHT_TOP]);
              drawLine(vlines[VLINE_RIGHT_BOTTOM]);
              break;
            case 9:
              drawLine(hlines[HLINE_TOP]);
              drawLine(hlines[HLINE_MIDDLE]);
              drawLine(hlines[HLINE_BOTTOM]);
              drawLine(vlines[VLINE_LEFT_TOP]);
              drawLine(vlines[VLINE_RIGHT_TOP]);
              drawLine(vlines[VLINE_RIGHT_BOTTOM]);
              break;
            default:
              break;
          }
        }
      }
    }

    // ========================================================================
    /**
     * A constructor for an individual brick within the court scene.
     * @param {*} x The x-position of the brick.
     * @param {*} y The y-position of the brick.
     * @param {*} width The width of the brick.
     * @param {*} height The height of the brick.
     */
    function Brick(x, y, width, height, fillStyle) {
      Collideable.call(this, x, y, width, height);
      this.fillStyle = fillStyle;
    }

    // ========================================================================
    /**
     * A constructor for the out-of-bounds detector at the bottom of the court.
     * @param {*} x The x-position of the detector.
     * @param {*} y The y-position of the detector.
     * @param {*} width The width of the detector.
     * @param {*} height The height of the detector.
     */
    function OutOfBounds(x, y, width, height) {
      Collideable.call(this, x, y, width, height);
      this.visible = false;
    }

    var leftWall;
    var rightWall;
    var topWall;
    var ball;
    var paddle;
    var playerIndexDigit;
    var playerBallIndexDigit;
    var playerScoreDigits = [[], []];
    var playerBricks = [[[], []], [[], []]];
    var outOfBoundsDetector;

    /** The currently active player as a zero based index (0|1). */
    var activePlayer = 0;
    /** The definition of the current level (0-based) for both players. */
    var playerLevel = [0, 0];
    /** A definition of the current ball index for both players. */
    var playerBallIndex = [1, 1];
    /** The player scores. */
    var playerScores = [0, 0];

    /** A function that is called when the game enters this scene. */
    function enter() {
      // Local addition, not upstream: reset all per-game state before rebuilding it below.
      // Upstream's own code only ever calls this once per page load (welcomeScene's onKeyUp is
      // the only caller, and there was previously no way back to welcomeScene to call it again
      // from) — courtScene was never designed to be re-entered. Now that a finished game can
      // return to the welcome scene and start a new one (see this scene's own onKeyUp, the
      // KEY_ENTER case), this scene needs to be safely re-enterable: without this reset,
      // playerScoreDigits/playerBricks below get MORE items pushed onto whatever was already in
      // them from the previous game (never cleared), and playerScores/activePlayer/playerLevel/
      // playerBallIndex simply carry over — a second playthrough would show a blank/stale brick
      // field (the draw loop only ever reads the first 112 bricks per level, which after a
      // second push are the exhausted ones from the previous game) and the previous game's score.
      // See specs/html5-breakout/design.md for the full account.
      activePlayer = 0;
      playerLevel = [0, 0];
      playerBallIndex = [1, 1];
      playerScores = [0, 0];
      playerScoreDigits = [[], []];
      playerBricks = [[[], []], [[], []]];

      // precalculate some relative size definitions.
      var slotWidth = (canvas.width / SLOT_WIDTH_DIVISOR);
      var slotHeight = (canvas.width / SLOT_HEIGHT_DIVISOR);
      var slotHalfWidth = (slotWidth / 2);
      var slotHalfHeight = (slotHeight / 2);
      var digitHeight = (slotHeight * 5);
      var canvasHalfWidth = (canvas.width / 2);
      var canvasHalfHeight = (canvas.height / 2);

      // calculate the amount of spacing we can reserve between the slots.
      // NOTE: spacing is based on the free space after 2 walls and 14 bricks.
      var slotSpacing = (canvas.width - (2 * slotHeight) - (14 * slotWidth)) / 13;

      // build the left, right and top wall for the court.
      leftWall = new Wall(0, 0, slotHeight, canvas.height);
      rightWall = new Wall((canvas.width - slotHeight), 0, slotHeight, canvas.height);
      topWall = new Wall(0, 0, canvas.width, slotHeight);

      // build the ball of the court.
      var x = (canvasHalfWidth - slotHalfHeight);
      var y = (canvasHalfHeight - slotHalfHeight);
      ball = new Ball(x, y, slotHeight, slotHeight);

      // build the paddle for the player.
      var x = (canvasHalfWidth - slotHalfWidth);
      var y = (canvas.height - 100);
      paddle = new Paddle(x, y, slotWidth, slotHeight);

      // build the digit indicating the current player.
      var x = slotHeight;
      var y = slotHeight;
      playerIndexDigit = new Digit(x, y, slotWidth, digitHeight);
      playerIndexDigit.value = (activePlayer + 1);

      // build the digit indicating the current ball index.
      var x = canvasHalfWidth;
      playerBallIndexDigit = new Digit(x, y, slotWidth, digitHeight);
      playerBallIndexDigit.value = playerBallIndex[activePlayer];

      // build the digits used to show the score for the first player.
      x = slotHeight;
      y += digitHeight + slotSpacing;
      playerScoreDigits[0].push(new Digit(x, y, slotWidth, digitHeight));
      x += slotWidth + slotSpacing;
      playerScoreDigits[0].push(new Digit(x, y, slotWidth, digitHeight));
      x += slotWidth + slotSpacing;
      playerScoreDigits[0].push(new Digit(x, y, slotWidth, digitHeight));
      x += slotWidth + slotSpacing;
      playerScoreDigits[0].push(new Digit(x, y, slotWidth, digitHeight));

      // build the digits used to show the score for the second player.
      x = canvasHalfWidth
      playerScoreDigits[1].push(new Digit(x, y, slotWidth, digitHeight));
      x += slotWidth + slotSpacing;
      playerScoreDigits[1].push(new Digit(x, y, slotWidth, digitHeight));
      x += slotWidth + slotSpacing;
      playerScoreDigits[1].push(new Digit(x, y, slotWidth, digitHeight));
      x += slotWidth + slotSpacing;
      playerScoreDigits[1].push(new Digit(x, y, slotWidth, digitHeight));

      // hide hidden score indicators (fourth numbers).
      playerScoreDigits[0][0].visible = false;
      playerScoreDigits[1][0].visible = false;

      // initialize bricks for both players.
      y += digitHeight + slotSpacing;
      for (var i = 0; i < 8; i++) {
        // resolve the color to be used for this row.
        var fillStyle;
        if (i < 2) {
          fillStyle = BRICKS_4_FILL_STYLE;
        } else if (i < 4) {
          fillStyle = BRICKS_3_FILL_STYLE;
        } else if (i < 6) {
          fillStyle = BRICKS_2_FILL_STYLE;
        } else if (i < 8) {
          fillStyle = BRICKS_1_FILL_STYLE;
        }

        // start placing from the left wall.
        x = slotHeight;

        // create all bricks for both players and for all levels.
        for (var j = 0; j < 14; j++) {
          playerBricks[0][0].push(new Brick(x, y, slotWidth, slotHeight, fillStyle));
          playerBricks[0][1].push(new Brick(x, y, slotWidth, slotHeight, fillStyle));
          playerBricks[1][0].push(new Brick(x, y, slotWidth, slotHeight, fillStyle));
          playerBricks[1][1].push(new Brick(x, y, slotWidth, slotHeight, fillStyle));
          x += slotWidth + slotSpacing;
        }
        y += slotHeight + slotSpacing;
      }

      // create the hidden out-of-bounds detector.
      outOfBoundsDetector = new OutOfBounds(0, canvas.height + slotHeight, canvas.width, 1000);

      // attach a keyboard key press listeners.
      document.addEventListener("keyup", onKeyUp);
      document.addEventListener("keydown", onKeyDown);
    }

    /** A function that is called when the game exists this scene. */
    function exit() {
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("keydown", onKeyDown);
    }

    /** A function that is called when a keyboard key is released. */
    function onKeyUp(event) {
      var key = event.keyCode ? event.keyCode : event.which;
      switch (key) {
        case KEY_LEFT:
          if (paddle.direction[0] == -1.0) {
            paddle.direction = [0.0, 0.0];
          }
          break;
        case KEY_RIGHT:
          if (paddle.direction[0] == 1.0) {
            paddle.direction = [0.0, 0.0];
          }
          break;
        // Local addition, not upstream — once the game has ended (ball.endGameMode == true),
        // Enter returns to the welcome scene instead of leaving the player stuck on the end-game
        // animation with no way back short of reloading the page. Same keyup-triggered
        // setScene(...) pattern welcomeScene's own onKeyUp already uses for its own transition
        // into this scene. See specs/html5-breakout/design.md.
        case KEY_ENTER:
          if (ball.endGameMode) {
            setScene(welcomeScene);
          }
          break;
      }
    }

    /** A function that is called when a keyboard key is pressed. */
    function onKeyDown(event) {
      var key = event.keyCode ? event.keyCode : event.which;
      switch (key) {
        case KEY_LEFT:
          paddle.direction = [-1.0, 0.0];
          break;
        case KEY_RIGHT:
          paddle.direction = [1.0, 0.0]
          break;
        case KEY_SPACEBAR:
          if (ball.velocity == 0.0 && ball.visible == false) {
            ball.velocity = ball.INITIAL_VELOCITY;
            ball.visible = true;
          }
          break;
      }
    }

    /** A function that is called on each main loop iteration. */
    function update(dt) {
      paddle.update(dt);
      ball.update(dt);

      playerScoreDigits[0][0].update(dt);
      playerScoreDigits[0][1].update(dt);
      playerScoreDigits[0][2].update(dt);
      playerScoreDigits[0][3].update(dt);

      playerScoreDigits[1][0].update(dt);
      playerScoreDigits[1][1].update(dt);
      playerScoreDigits[1][2].update(dt);
      playerScoreDigits[1][3].update(dt);

      playerIndexDigit.update(dt);
    }

    /** A funcion that is called on each rendering frame iteration. */
    function draw() {
      topWall.draw();
      ball.draw();
      paddle.draw();
      playerIndexDigit.draw();
      playerBallIndexDigit.draw();

      // draw the currently act
      for (var i = 0; i < 112; i++) {
        playerBricks[activePlayer][playerLevel[activePlayer]][i].draw();
      }

      playerScoreDigits[0][0].draw();
      playerScoreDigits[0][1].draw();
      playerScoreDigits[0][2].draw();
      playerScoreDigits[0][3].draw();

      playerScoreDigits[1][0].draw();
      playerScoreDigits[1][1].draw();
      playerScoreDigits[1][2].draw();
      playerScoreDigits[1][3].draw();

      leftWall.draw();
      rightWall.draw();

      // Local addition, not upstream: draw a "GAME OVER" overlay once the game has ended
      // (ball.endGameMode == true, set by endGame() above). Upstream never drew any game-over
      // text or gave any way back to the welcome scene — see specs/html5-breakout/design.md.
      // ctx.fillStyle is reset here explicitly since the loop above leaves it at whatever the
      // last-drawn brick's color was, not the "white" set once, globally, in init().
      if (ball.endGameMode) {
        var center = [(canvas.width / 2), (canvas.height / 2)];
        ctx.fillStyle = "white";
        ctx.font = "32pt Arial";
        ctx.fillText("GAME OVER", center[0], center[1]);
        ctx.font = "24pt Arial";
        ctx.fillText("Press [enter]", center[0], center[1] + 50);
        ctx.fillText("to return to the menu", center[0], center[1] + 90);
      }
    }

    return {
      enter: enter,
      exit: exit,
      update: update,
      draw: draw
    }

  })();

  /**
   * Set the given scene as the active scene.
   *
   * Old active scene (if any) will be first exited by calling the exit
   * function so it can clean up all necessary resources as required. New
   * scene will be assigned as the active scene and the enter function will
   * be called to ensure that the new scene can initialize itself.
   *
   * @param {*} newScene A new scene to be applied as the active scene.
   */
  function setScene(newScene) {
    if (newScene) {
      // perform a cleanup for the old scene (if defined).
      if (scene) {
        scene.exit();
      }

      // apply the new scene and call the scene init (reset).
      scene = newScene;
      scene.enter();
    }
  }

  /**
   * Initialize the game.
   *
   * Initialization will ensure that the game will get a reference to the 2D
   * drawing context from the game canvas element. It also provides a way to
   * define a game wide initializations for scenes etc.
   */
  function init() {
    // get a referene to the target <canvas> element.
    if (!(canvas = document.getElementById("game-canvas"))) {
      throw Error("Unable to find the required canvas element.");
    }

    // resize the canvas based on the available browser available draw size.
    // this ensures that a full screen window can contain the whole game view.
    canvas.height = (window.screen.availHeight - 100);
    canvas.width = (canvas.height * 0.8);

    // get a reference to the 2D drawing context.
    if (!(ctx = canvas.getContext("2d"))) {
      throw Error("Unable to get 2D draw context from the canvas.");
    }

    // specify global draw definitions.
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    // set the welcome scene as the initial scene.
    setScene(welcomeScene);
  }

  /**
   * Run the game.
   *
   * Running the game means that the game will execute an infinite loop that
   * runs the game logic updates and draw operations until the user closes the
   * browser tab or the JavaScript catches an exception from the code.
   */
  function run(tickTime) {
    // calculate delta time and store current tick time.
    var dt = (tickTime - prevTickTime);
    prevTickTime = tickTime;

    // update and draw the scene only when we have reasonable delta.
    if (dt < 100) {
      deltaAccumulator += dt;
      while (deltaAccumulator >= FPS) {
        scene.update(FPS);
        deltaAccumulator -= FPS;
      }

      // swipe old contents from the draw buffer and draw the scene.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      scene.draw();
    }

    // perform a main loop iteration.
    requestAnimationFrame(run);
  }

  /**
   * Start the game.
   *
   * Game will be first initialized and then started. Game will be using a
   * infinite loop (via requestAnimationFrame) as the main loop, so the game
   * will not stop running until the user closes the browser tab or if an
   * error is detected by the browser JavaScript engine.
   */
  function start() {
    init();
    run();
  }

  return {
    start: start
  }

})();

breakout.start();
