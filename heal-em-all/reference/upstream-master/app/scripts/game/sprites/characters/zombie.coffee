Q = Game.Q

#
Q.animations "zombie",
  run:
    frames: [0, 1, 2, 3]
    rate: 0.4
  hit:
    frames: [10]
    loop: false
    rate: 1
    next: "run"
  attack:
    frames: [8, 9, 10, 11]
    loop: false
    rate: 1/2
    next: "run"
  fall:
    frames: [4, 5, 6, 7, 7, 7, 7]
    rate: 1/5
    loop: false
    next: "run"

#
Q.Sprite.extend "Zombie",
  init: (p) ->
    @_super p,
      lifePoints: 1
      x: 0
      y: 0
      vx: 0
      z: 20
      sheet: "zombie"
      sprite: "zombie"
      canSeeThePlayerTimeout: 0
      type: Game.SPRITE_ENEMY
      collisionMask: Game.SPRITE_TILES | Game.SPRITE_PLAYER | Game.SPRITE_BULLET | Game.SPRITE_HUMAN

    Q.state.inc "enemiesCounter", 1

    @add "2d, animation, zombieAI"

    # events
    @on "hit", @, "collision"
    @on "bump.right", @, "hitFromRight"
    @on "bump.left", @, "hitFromLeft"

  collision: (col) ->
    if col.obj.isA("Bullet")
      @play("hit")
      @decreaseLifePoints()

  hitFromRight: (col) ->
    # don't stop after collision
    @p.vx = col.impact

  hitFromLeft: (col) ->
    # don't stop after collision
    @p.vx = -col.impact

  step: (dt) ->
    if @zombieStep?
      @zombieStep(dt)

    if @p.y > Game.map.p.h
      @die(false)

    # animations
    if @p.vy != 0
      @play("fall")
    else
      @play("run")

  decreaseLifePoints: ->
    @p.lifePoints -= 1

    if @p.lifePoints <= 0
      @die()

  die: (turnToHuman = true)->
    @destroy()

    if !@p.wasHuman && turnToHuman
      # replace zombie with human
      @stage.insert new Q.Human(x: @p.x, y: @p.y)
    else
      @stage.insert new Q.DeadZombie(x: @p.x, y: @p.y)

    # update enemies counter
    Q.state.dec "enemiesCounter", 1
