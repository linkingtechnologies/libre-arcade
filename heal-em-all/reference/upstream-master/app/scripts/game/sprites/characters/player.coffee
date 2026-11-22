Q = Game.Q

# animations object
Q.animations "player",
  stand:
    frames: [1]
    rate: 1
  run:
    frames: [0, 1, 2, 1]
    rate: 1/4
  hit:
    frames: [4]
    loop: false
    rate: 1
    next: "stand"
  jump:
    frames: [3, 4, 5, 4]
    rate: 1/3

Q.animations "playerWithGun",
  stand:
    frames: [1]
    rate: 1
  run:
    frames: [0, 1, 2, 1]
    rate: 1/4
  hit:
    frames: [3]
    loop: false
    rate: 1
    next: "stand"
  jump:
    frames: [3]
    rate: 1

# player object and logic
Q.Sprite.extend "Player",
  init: (p) ->
    @_super p,
      lifePoints: Q.state.get "lives"
      timeInvincible: 0
      timeToNextSave: 0
      x: 0
      y: 0
      z: 100
      savedPosition: {}
      hasKey: false
      sheet: "player"
      sprite: "player"
      type: Game.SPRITE_PLAYER
      collisionMask: Game.SPRITE_TILES | Game.SPRITE_ENEMY | Game.SPRITE_PLAYER_COLLECTIBLE

    @add("2d, platformerControls, animation")

    if Q.state.get "hasGun"
      @add("gun")

    @p.jumpSpeed = -660
    @p.speed = 330
    @p.savedPosition.x = @p.x
    @p.savedPosition.y = @p.y

    # audio
    Q.AudioManager.add Game.audio.playerBg,
      loop: true

    # events
    @on "bump.left, bump.right, bump.bottom, bump.top", @, "collision"
    @on "player.outOfMap", @, "restore"

  step: (dt) ->
    if @p.direction == "left"
      @p.flip = "x"
      @p.points = [
        [-15, -50 ],
        [ 25, -50 ],
        [ 25,  50 ],
        [-15,  50 ]
      ]
    if @p.direction == "right"
      @p.flip = false
      @p.points = [
        [-25, -50 ],
        [ 15, -50 ],
        [ 15,  50 ],
        [-25,  50 ]
      ]

    # do not allow to get out of level
    if @p.x > Game.map.p.w
      @p.x = Game.map.p.w

    if @p.x < 0
      @p.x = 0

    # save
    if @p.timeToNextSave > 0
      @p.timeToNextSave = Math.max(@p.timeToNextSave - dt, 0)

    if @p.timeToNextSave == 0
      @savePosition()
      @p.timeToNextSave = 2

    # collision with enemy timeout
    if @p.timeInvincible > 0
      @p.timeInvincible = Math.max(@p.timeInvincible - dt, 0)

    # jump from too high place
    if @p.vy > 1100
      @p.willBeDead = true

    if @p.willBeDead && @p.vy < 1100
      @updateLifePoints()
      @p.willBeDead = false

    # check if out of map
    if @p.y > Game.map.p.h
      @updateLifePoints()
      @trigger "player.outOfMap"
      @p.willBeDead = false

    # animations
    if @p.vy != 0
      @play("jump")
    else if @p.vx != 0
      @play("run")
    else
      @play("stand")

    # gun
    if @gunStep?
      @gunStep(dt)


  collision: (col) ->
    if col.obj.isA("Zombie") && @p.timeInvincible == 0
      @updateLifePoints()

      col.obj.play("attack", 10)

      # will be invincible for 1 second
      @p.timeInvincible = 1

  savePosition: ->
    dirX = @p.vx/Math.abs(@p.vx)
    ground = Q.stage().locate(@p.x, @p.y + @p.h/2 + 1, Game.SPRITE_TILES)

    if ground
      @p.savedPosition.x = @p.x
      @p.savedPosition.y = @p.y

  updateLifePoints: (newLives) ->
    if newLives?
      @p.lifePoints += newLives

    else
      @p.lifePoints -= 1
      Game.infoLabel.lifeLost()
      @play("hit", 1)
      Q.AudioManager.add Game.audio.playerHit

      if @p.lifePoints <= 0

        if @p.wasZombie
          @destroy()
          Game.stageGameOverScreen()
          return

        # zombie mode!
        zombiePlayer = @stage.insert new Q.ZombiePlayer
          x: do =>
            if @p.y > Game.map.p.h
              return @p.savedPosition.x
            else
              return @p.x

          y: do =>
            if @p.y > Game.map.p.h
              return @p.savedPosition.y
            else
              return @p.y

        Game.setCameraTo(@stage, zombiePlayer)
        zombiePlayer.p.direction = @p.direction

        @destroy()

      if @p.lifePoints == 1
        Game.infoLabel.lifeLevelLow()

    # always update label
    Q.state.set "lives", @p.lifePoints

  restore: ->
    @p.x = @p.savedPosition.x
    @p.y = @p.savedPosition.y
