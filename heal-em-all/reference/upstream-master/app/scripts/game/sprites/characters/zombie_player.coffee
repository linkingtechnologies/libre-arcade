Q = Game.Q

# animations object
Q.animations "zombiePlayer",
  stand:
    frames: [4]
    rate: 1
  run:
    frames: [3, 4, 5, 4]
    rate: 1/3
  jump:
    frames: [3]
    rate: 1
  intro:
    frames: [0, 1, 0, 1, 0, 1]
    rate: 0.8
    next: "stand"
    trigger: "ready"

# main object and logic
Q.Sprite.extend "ZombiePlayer",
  init: (p) ->
    @_super p,
      timeToNextSave: 0
      x: 0
      y: 0
      z: 100
      savedPosition: {}
      sheet: "zombie_player"
      sprite: "zombiePlayer"
      type: Game.SPRITE_ZOMBIE_PLAYER
      collisionMask: Game.SPRITE_TILES | Game.SPRITE_HUMAN

    @add("2d, animation")

    @p.jumpSpeed = -500
    @p.speed = 140
    @p.savedPosition.x = @p.x
    @p.savedPosition.y = @p.y
    @p.playerDirection = @p.direction

    Game.infoLabel.zombieModeOn()
    @play "intro", 10

    # events
    @on "player.outOfMap", @, "die"
    @on "ready", @, "enableZombieMode"

  enableZombieMode: ->
    @add "platformerControls"
    @p.direction = @p.playerDirection
    Game.infoLabel.zombieModeOnNext()
    Game.currentLevelData.zombieModeFound = true
    Game.playerAvatar.changeToZombie()
    Game.healthImg.changeToHalf()

    # audio
    Q.AudioManager.remove Game.audio.playerBg
    Q.AudioManager.add Game.audio.zombieMode,
      loop: true

  step: (dt) ->
    if @p.direction == "left"
      @p.flip = "x"
    if @p.direction == "right"
      @p.flip = false

    # check if out of map
    if @p.y > Game.map.p.h
      @trigger "player.outOfMap"

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
      @p.timeToNextSave = 4

    # animations
    if @p.vy != 0
      @play("jump")
    else if @p.vx != 0
      @play("run")
    else
      @play("stand")

  savePosition: ->
    dirX = @p.vx/Math.abs(@p.vx)
    ground = Q.stage().locate(@p.x, @p.y + @p.h/2 + 1, Game.SPRITE_TILES)

    if ground
      @p.savedPosition.x = @p.x
      @p.savedPosition.y = @p.y

  die: ->
    # zombie mode ends
    Q.state.set "lives", 3

    Game.player = player = @stage.insert new Q.Player
      x: @p.savedPosition.x
      y: @p.savedPosition.y

    player.p.wasZombie = true

    Game.setCameraTo(@stage, player)

    Game.infoLabel.zombieModeOff()
    Game.playerAvatar.changeToPlayer()

    Q.AudioManager.remove Game.audio.zombieMode
    @destroy()
